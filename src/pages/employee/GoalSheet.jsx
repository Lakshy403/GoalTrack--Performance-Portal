import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { WeightageWidget, StatusBadge, UomBadge } from '@/components/shared/GoalComponents';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import { useToast } from '@/components/ui/toast';
import useGoalStore from '@/store/goalStore';
import { Plus, Trash2, Save, Send, Lock, Users, Loader2, FileText, Edit2, AlertCircle } from 'lucide-react';

const UOM_OPTIONS = ['percentage', 'number', 'currency', 'rating', 'boolean', 'date'];
const UOM_LABELS = { percentage: 'Percentage', number: 'Numeric', currency: 'Currency', rating: 'Rating', boolean: 'Zero-based', date: 'Timeline' };
const SCORE_METHODS = [
  { value: 'min', label: 'Min / Higher is better' },
  { value: 'max', label: 'Max / Lower is better' },
  { value: 'timeline', label: 'Timeline / Deadline' },
  { value: 'zero', label: 'Zero-based success' },
];

export default function GoalSheet() {
  const { addToast } = useToast();
  const {
    currentSheet, goals, sharedGoals, thrustAreas,
    fetchCurrentSheet, fetchThrustAreas, createDraftSheet,
    addGoal, updateGoal, deleteGoal, submitSheet,
    isLoading, isSaving, error, clearError,
  } = useGoalStore();

  const [loaded, setLoaded] = useState(false);
  const [editingGoalId, setEditingGoalId] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [confirmSubmit, setConfirmSubmit] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const emptyGoal = { thrustAreaId: '', title: '', description: '', uomType: 'percentage', scoreMethod: 'min', targetValue: '', weightage: '' };
  const [goalForm, setGoalForm] = useState(emptyGoal);

  useEffect(() => {
    const load = async () => {
      await Promise.all([fetchCurrentSheet(), fetchThrustAreas()]);
      setLoaded(true);
    };
    load();
  }, []);

  const isEditable = !currentSheet || ['draft', 'rework'].includes(currentSheet.status);
  const isLocked = currentSheet && ['submitted', 'under_review', 'approved'].includes(currentSheet.status);

  // Validation data for the widget
  const validationGoals = goals.map(g => ({
    weightage: parseFloat(g.weightage || 0),
  }));

  const totalWeightage = validationGoals.reduce((s, g) => s + g.weightage, 0);
  const canSubmit = goals.length > 0 && goals.length <= 8
    && Math.abs(totalWeightage - 100) < 0.01
    && !goals.some(g => parseFloat(g.weightage) < 10);

  // CREATE DRAFT
  const handleCreateDraft = async () => {
    const result = await createDraftSheet();
    if (result) {
      addToast({ title: 'Goal Sheet Created', description: 'Draft goal sheet created. Start adding goals!', variant: 'success' });
    }
  };

  // ADD GOAL
  const handleAddGoal = async () => {
    if (!goalForm.title || !goalForm.thrustAreaId || !goalForm.targetValue || !goalForm.weightage) {
      addToast({ title: 'Missing Fields', description: 'Please fill in all required fields.', variant: 'warning' });
      return;
    }
    const result = await addGoal({
      goalSheetId: currentSheet.id,
      thrustAreaId: parseInt(goalForm.thrustAreaId),
      title: goalForm.title,
      description: goalForm.description,
      uomType: goalForm.uomType,
      scoreMethod: goalForm.scoreMethod,
      targetValue: goalForm.targetValue,
      weightage: parseFloat(goalForm.weightage),
      sortOrder: goals.length + 1,
    });
    if (result) {
      addToast({ title: 'Goal Added', description: `"${goalForm.title}" added successfully.`, variant: 'success' });
      setGoalForm(emptyGoal);
      setShowAddForm(false);
    }
  };

  // ADD SHARED GOAL
  const handleAddSharedGoal = async (sg) => {
    const result = await addGoal({
      goalSheetId: currentSheet.id,
      thrustAreaId: sg.thrust_area_id,
      title: sg.title,
      description: sg.description || '',
      uomType: sg.uom_type,
      scoreMethod: 'min',
      targetValue: sg.target_value,
      weightage: 10,
      isShared: true,
      sharedGoalId: sg.id,
      sortOrder: goals.length + 1,
    });
    if (result) {
      addToast({ title: 'Shared Goal Added', description: `"${sg.title}" added. Adjust weightage as needed.`, variant: 'success' });
    }
  };

  // UPDATE GOAL
  const handleUpdateGoal = async (goalId) => {
    const result = await updateGoal(goalId, {
      thrustAreaId: parseInt(goalForm.thrustAreaId),
      title: goalForm.title,
      description: goalForm.description,
      uomType: goalForm.uomType,
      scoreMethod: goalForm.scoreMethod,
      targetValue: goalForm.targetValue,
      weightage: parseFloat(goalForm.weightage),
    });
    if (result) {
      addToast({ title: 'Goal Updated', description: 'Changes saved.', variant: 'success' });
      setEditingGoalId(null);
      setGoalForm(emptyGoal);
    }
  };

  // DELETE GOAL
  const handleDeleteGoal = async () => {
    if (!confirmDelete) return;
    const success = await deleteGoal(confirmDelete);
    if (success) addToast({ title: 'Goal Deleted', variant: 'success' });
    setConfirmDelete(null);
  };

  // SUBMIT
  const handleSubmit = async () => {
    const result = await submitSheet(currentSheet.id);
    if (result) {
      addToast({ title: 'Goal Sheet Submitted! 🎉', description: 'Your goal sheet has been sent for manager review.', variant: 'success' });
    } else if (error) {
      addToast({ title: 'Submission Failed', description: error, variant: 'error' });
    }
    setConfirmSubmit(false);
  };

  // Start editing a goal
  const startEdit = (goal) => {
    setEditingGoalId(goal.id);
    setGoalForm({
      thrustAreaId: String(goal.thrust_area_id),
      title: goal.title,
      description: goal.description || '',
      uomType: goal.uom_type,
      scoreMethod: goal.score_method || (goal.uom_type === 'date' ? 'timeline' : goal.uom_type === 'boolean' ? 'zero' : 'min'),
      targetValue: goal.target_value,
      weightage: String(parseFloat(goal.weightage)),
    });
    setShowAddForm(false);
  };

  if (!loaded || isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-[hsl(var(--color-muted-foreground))]" />
      </div>
    );
  }

  // NO SHEET — Create Draft CTA
  if (!currentSheet) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-20 text-center">
            <div className="p-4 rounded-2xl bg-gradient-to-br from-teal-500/10 to-emerald-500/10 dark:from-blue-500/10 dark:to-indigo-500/10 mb-4">
              <FileText className="h-12 w-12 text-teal-600 dark:text-blue-400" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No Goal Sheet Yet</h3>
            <p className="text-sm text-[hsl(var(--color-muted-foreground))] max-w-md mb-6">
              Create a new goal sheet for the current quarter to start setting your performance goals.
            </p>
            <Button onClick={handleCreateDraft} disabled={isSaving} size="lg">
              {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
              Create Goal Sheet
            </Button>
          </CardContent>
        </Card>

        {/* Show shared goals available */}
        {sharedGoals.length > 0 && (
          <Card className="border-teal-200/60 dark:border-indigo-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5 text-teal-600 dark:text-indigo-400" /> Shared Goals Available</CardTitle>
              <CardDescription>These will be available to add after creating your sheet</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {sharedGoals.map(sg => (
                <div key={sg.id} className="p-3 rounded-xl bg-gradient-to-r from-teal-50/50 to-emerald-50/30 dark:bg-indigo-950/20 text-sm">
                  <span className="font-medium">{sg.title}</span>
                  <span className="text-xs text-[hsl(var(--color-muted-foreground))] ml-2">Target: {sg.target_value}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Sheet Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            Goal Sheet
            {isLocked && <Lock className="h-4 w-4 text-amber-500" />}
          </h2>
          <p className="text-sm text-[hsl(var(--color-muted-foreground))]">{currentSheet.period} · v{currentSheet.version}</p>
        </div>
        <div className="flex gap-2 items-center">
          <StatusBadge status={currentSheet.status?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())} />
          {isEditable && canSubmit && (
            <Button size="sm" onClick={() => setConfirmSubmit(true)} disabled={isSaving}>
              <Send className="h-4 w-4 mr-1" /> Submit
            </Button>
          )}
        </div>
      </div>

      {/* Rework banner */}
      {currentSheet.status === 'rework' && currentSheet.review_comments && (
        <Card className="border-amber-300 dark:border-amber-700 bg-amber-50/50 dark:bg-amber-950/30">
          <CardContent className="p-4 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-amber-700 dark:text-amber-300">Rework Required</p>
              <p className="text-sm mt-1">{currentSheet.review_comments}</p>
              {currentSheet.reviewerName && (
                <p className="text-xs text-[hsl(var(--color-muted-foreground))] mt-1">— {currentSheet.reviewerName}</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Locked banner */}
      {isLocked && (
        <Card className="border-teal-200 dark:border-blue-800 bg-teal-50/50 dark:bg-blue-950/30">
          <CardContent className="p-4 flex items-center gap-3">
            <Lock className="h-5 w-5 text-teal-600 dark:text-blue-500" />
            <p className="text-sm">This goal sheet is <strong>{currentSheet.status.replace('_', ' ')}</strong> and cannot be edited.</p>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* GOALS LIST + FORM (2/3) */}
        <div className="lg:col-span-2 space-y-4">
          {/* Existing goals */}
          {goals.map((goal, idx) => (
            <Card key={goal.id} className="overflow-hidden">
              {editingGoalId === goal.id ? (
                /* EDIT MODE */
                <CardContent className="p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold">Editing Goal #{idx + 1}</p>
                    <Button variant="ghost" size="sm" onClick={() => { setEditingGoalId(null); setGoalForm(emptyGoal); }}>Cancel</Button>
                  </div>
                  {renderGoalForm(goalForm, setGoalForm, thrustAreas, goal.is_shared)}
                  <Button onClick={() => handleUpdateGoal(goal.id)} disabled={isSaving} size="sm">
                    {isSaving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
                    Save Changes
                  </Button>
                </CardContent>
              ) : (
                /* VIEW MODE */
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium text-slate-600 dark:text-slate-400 bg-gradient-to-r from-teal-50/60 to-emerald-50/40 dark:from-slate-700/50 dark:to-slate-700/30 px-2 py-0.5 rounded">#{idx + 1}</span>
                        <h4 className="text-sm font-semibold truncate">{goal.title}</h4>
                        {goal.is_shared ? (
                          <span className="inline-flex items-center gap-1 text-[10px] text-teal-700 dark:text-indigo-400 bg-teal-100 dark:bg-indigo-900/40 px-2 py-0.5 rounded-full font-medium">
                            <Users className="h-3 w-3" /> Shared
                          </span>
                        ) : null}
                      </div>
                      <p className="text-xs text-[hsl(var(--color-muted-foreground))]">{goal.thrust_area_name}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <UomBadge type={UOM_LABELS[goal.uom_type] || goal.uom_type} />
                      <span className="text-sm font-bold">{parseFloat(goal.weightage)}%</span>
                    </div>
                  </div>
                  {goal.description && (
                    <p className="text-xs text-[hsl(var(--color-muted-foreground))]">{goal.description}</p>
                  )}
                  <div className="flex items-center gap-4 text-xs text-[hsl(var(--color-muted-foreground))]">
                    <span>Target: {goal.target_value}</span>
                    {isEditable && (
                      <div className="flex gap-1 ml-auto">
                        <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => startEdit(goal)}>
                          <Edit2 className="h-3 w-3 mr-1" /> Edit
                        </Button>
                        <Button variant="ghost" size="sm" className="h-7 text-xs text-red-500 hover:text-red-700" onClick={() => setConfirmDelete(goal.id)}>
                          <Trash2 className="h-3 w-3 mr-1" /> Delete
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              )}
            </Card>
          ))}

          {/* ADD NEW GOAL FORM */}
          {isEditable && goals.length < 8 && (
            showAddForm ? (
              <Card className="border-dashed border-2 border-teal-300 dark:border-blue-700">
                <CardContent className="p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold">Add New Goal</p>
                    <Button variant="ghost" size="sm" onClick={() => { setShowAddForm(false); setGoalForm(emptyGoal); }}>Cancel</Button>
                  </div>
                  {renderGoalForm(goalForm, setGoalForm, thrustAreas, false)}
                  <Button onClick={handleAddGoal} disabled={isSaving}>
                    {isSaving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Plus className="h-4 w-4 mr-1" />}
                    Add Goal
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Button variant="outline" className="w-full border-dashed h-12" onClick={() => { setShowAddForm(true); setEditingGoalId(null); setGoalForm(emptyGoal); }}>
                <Plus className="h-4 w-4 mr-2" /> Add Goal ({goals.length}/8)
              </Button>
            )
          )}
        </div>

        {/* VALIDATION SIDEBAR (1/3) */}
        <div className="space-y-4">
          <WeightageWidget goals={validationGoals} />

          {/* Shared Goals */}
          {sharedGoals.length > 0 && isEditable && (
            <Card className="border-teal-200/60 dark:border-indigo-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2"><Users className="h-4 w-4 text-teal-600 dark:text-indigo-400" /> Shared Goals</CardTitle>
                <CardDescription className="text-xs">Assigned by admin</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {sharedGoals.map(sg => {
                  const alreadyAdded = goals.some(g => g.shared_goal_id === sg.id);
                  return (
                    <div key={sg.id} className="p-3 rounded-xl bg-gradient-to-r from-teal-50/50 to-emerald-50/30 dark:bg-indigo-950/20 space-y-1">
                      <p className="text-sm font-medium">{sg.title}</p>
                      <p className="text-xs text-[hsl(var(--color-muted-foreground))]">Target: {sg.target_value} · {UOM_LABELS[sg.uom_type] || sg.uom_type}</p>
                      {alreadyAdded ? (
                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">✓ Added</span>
                      ) : (
                        <Button variant="outline" size="sm" className="h-6 text-xs mt-1" onClick={() => handleAddSharedGoal(sg)} disabled={goals.length >= 8}>
                          <Plus className="h-3 w-3 mr-1" /> Add
                        </Button>
                      )}
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* CONFIRM SUBMIT DIALOG */}
      <ConfirmDialog
        open={confirmSubmit}
        onOpenChange={setConfirmSubmit}
        title="Submit Goal Sheet?"
        description={`You have ${goals.length} goals totaling ${totalWeightage}% weightage. Once submitted, you won't be able to edit until your manager returns it.`}
        confirmLabel="Submit for Review"
        onConfirm={handleSubmit}
        variant="default"
      />

      {/* CONFIRM DELETE DIALOG */}
      <ConfirmDialog
        open={!!confirmDelete}
        onOpenChange={() => setConfirmDelete(null)}
        title="Delete Goal?"
        description="This action cannot be undone. The goal will be permanently removed from your sheet."
        confirmLabel="Delete"
        onConfirm={handleDeleteGoal}
      />

      {/* Error display */}
      {error && (
        <div className="fixed bottom-20 right-4 z-50 p-4 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 rounded-xl shadow-lg max-w-sm animate-slide-in">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-red-500" />
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            <button onClick={clearError} className="ml-auto text-red-400 hover:text-red-600 cursor-pointer">×</button>
          </div>
        </div>
      )}
    </div>
  );
}

// Reusable form component
function renderGoalForm(form, setForm, thrustAreas, isShared) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Thrust Area *</Label>
          <Select value={form.thrustAreaId} onValueChange={v => setForm(f => ({ ...f, thrustAreaId: v }))} disabled={isShared}>
            <SelectTrigger><SelectValue placeholder="Select thrust area" /></SelectTrigger>
            <SelectContent>
              {thrustAreas.map(ta => (
                <SelectItem key={ta.id} value={String(ta.id)}>{ta.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Goal Title * {isShared && <span className="text-teal-600 dark:text-indigo-400 text-xs">(Shared — read only)</span>}</Label>
          <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            placeholder="Enter goal title" readOnly={isShared} className={isShared ? 'bg-gradient-to-r from-teal-50/30 to-emerald-50/20 dark:from-slate-800/30 dark:to-slate-800/20' : ''} />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Description</Label>
        <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
          placeholder="Describe this goal..." rows={2} readOnly={isShared} className={isShared ? 'bg-gradient-to-r from-teal-50/30 to-emerald-50/20 dark:from-slate-800/30 dark:to-slate-800/20' : ''} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="space-y-2">
          <Label>UoM Type</Label>
          <Select value={form.uomType} onValueChange={v => setForm(f => ({ ...f, uomType: v }))} disabled={isShared}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {UOM_OPTIONS.map(u => <SelectItem key={u} value={u}>{UOM_LABELS[u]}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Score Formula</Label>
          <Select value={form.scoreMethod} onValueChange={v => setForm(f => ({ ...f, scoreMethod: v }))} disabled={isShared}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {SCORE_METHODS.map(method => <SelectItem key={method.value} value={method.value}>{method.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Target * {isShared && <span className="text-teal-600 dark:text-indigo-400 text-xs">(read only)</span>}</Label>
          <Input value={form.targetValue} onChange={e => setForm(f => ({ ...f, targetValue: e.target.value }))}
            placeholder="e.g. 95%" readOnly={isShared} className={isShared ? 'bg-gradient-to-r from-teal-50/30 to-emerald-50/20 dark:from-slate-800/30 dark:to-slate-800/20' : ''} />
        </div>
        <div className="space-y-2">
          <Label>Weightage (%) *</Label>
          <Input type="number" min={10} max={100} value={form.weightage}
            onChange={e => setForm(f => ({ ...f, weightage: e.target.value }))} placeholder="10-100" />
        </div>
      </div>
    </div>
  );
}
