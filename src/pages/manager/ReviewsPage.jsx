import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { StatusBadge, UomBadge } from '@/components/shared/GoalComponents';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import { useToast } from '@/components/ui/toast';
import { managerService } from '@/services/api';
import { formatDate } from '@/lib/utils';
import { Check, X, RotateCcw, ChevronDown, ChevronUp, Save, Loader2 } from 'lucide-react';

export default function ReviewsPage() {
  const [expanded, setExpanded] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);
  const [sheets, setSheets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [draftGoals, setDraftGoals] = useState({});
  const [savingGoalId, setSavingGoalId] = useState(null);
  const { addToast } = useToast();

  useEffect(() => {
    loadSheets();
  }, []);

  const loadSheets = async () => {
    try {
      const { data } = await managerService.getTeamGoalSheets();
      setSheets(data);
      const drafts = {};
      data.forEach(sheet => sheet.goals?.forEach(goal => {
        drafts[goal.id] = { targetValue: goal.target_value, weightage: String(parseFloat(goal.weightage)) };
      }));
      setDraftGoals(drafts);
    } catch (err) {
      console.error(err);
      addToast({ title: 'Error', description: 'Failed to load goal sheets', variant: 'error' });
    } finally {
      setLoading(false);
    }
  };
  const pendingSheets = sheets.filter(s => s.status === 'submitted');
  const handleAction = (action, sheet) => {
    setConfirmAction({ action, sheet, comment: '' });
  };

  const saveGoalEdit = async (goalId) => {
    const draft = draftGoals[goalId];
    if (!draft) return;
    setSavingGoalId(goalId);
    try {
      const { data } = await managerService.updateGoalForReview(goalId, {
        targetValue: draft.targetValue,
        weightage: parseFloat(draft.weightage),
      });
      setSheets(current => current.map(sheet => ({
        ...sheet,
        goals: sheet.goals?.map(goal => goal.id === goalId ? data : goal),
      })));
      addToast({ title: 'Goal Updated', description: 'Target/weightage saved for review.', variant: 'success' });
    } catch (err) {
      addToast({ title: 'Update Failed', description: err.response?.data?.error || 'Could not update goal.', variant: 'error' });
    } finally {
      setSavingGoalId(null);
    }
  };

  const executeAction = async () => {
    if (!confirmAction) return;
    const { action, sheet, comment } = confirmAction;
    
    try {
      if (action === 'Approved') {
        await managerService.approveGoalSheet(sheet.id);
      } else if (action === 'Returned') {
        await managerService.returnForRework(sheet.id, comment || 'Please review and adjust your goals.');
      } else if (action === 'Rejected') {
        await managerService.rejectGoalSheet(sheet.id, comment || 'Goals rejected.');
      }
      
      addToast({
        title: `Goal Sheet ${action}`,
        description: `${sheet.employeeName}'s goal sheet has been ${action.toLowerCase()}`,
        variant: action === 'Approved' ? 'success' : action === 'Rejected' ? 'error' : 'warning',
      });
      loadSheets();
    } catch (err) {
      console.error(err);
      addToast({ title: 'Error', description: err.response?.data?.error || `Failed to process action`, variant: 'error' });
    }
    
    setConfirmAction(null);
  };

  if (loading) {
    return <div className="flex h-32 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Goal Reviews</h2>
        <p className="text-sm text-[hsl(var(--color-muted-foreground))]">{pendingSheets.length} sheets pending review</p>
      </div>

      {pendingSheets.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-[hsl(var(--color-muted-foreground))]">No goal sheets pending review.</CardContent></Card>
      ) : (
        pendingSheets.map(sheet => (
          <Card key={sheet.id} className="overflow-hidden">
            <div className="p-5 flex items-center justify-between cursor-pointer" onClick={() => setExpanded(expanded === sheet.id ? null : sheet.id)}>
              <div className="flex items-center gap-4">
                <div>
                  <p className="font-semibold">{sheet.employeeName}</p>
                  <p className="text-xs text-[hsl(var(--color-muted-foreground))]">{sheet.department_name} · Submitted {formatDate(sheet.submitted_at || sheet.updated_at)}</p>
                </div>
                <StatusBadge status={sheet.status} />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-[hsl(var(--color-muted-foreground))]">{sheet.goals?.length || 0} goals</span>
                {expanded === sheet.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </div>
            </div>

            {expanded === sheet.id && (
              <CardContent className="border-t border-[hsl(var(--color-border))] pt-4 space-y-4 animate-fade-in">
                {sheet.goals?.map((goal) => (
                  <div key={goal.id} className="p-4 rounded-xl bg-gradient-to-br from-white/50 to-emerald-50/20 dark:from-slate-800/40 dark:to-slate-800/20 border border-teal-100/40 dark:border-slate-700/30 space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-semibold">{goal.title}</p>
                        <p className="text-xs text-[hsl(var(--color-muted-foreground))]">{goal.thrust_area_name}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <UomBadge type={goal.uom_type} />
                        <span className="text-sm font-bold">{goal.weightage}%</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-[1fr_140px_auto] gap-3 items-end">
                      <div className="space-y-1">
                        <Label className="text-xs">Target {goal.is_shared ? '(Linked KPI read-only)' : ''}</Label>
                        <Input
                          value={draftGoals[goal.id]?.targetValue ?? goal.target_value}
                          readOnly={Boolean(goal.is_shared)}
                          onChange={(e) => setDraftGoals(current => ({ ...current, [goal.id]: { ...current[goal.id], targetValue: e.target.value } }))}
                          className={goal.is_shared ? 'bg-[hsl(var(--color-muted))]/40' : ''}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Weightage %</Label>
                        <Input
                          type="number"
                          min={10}
                          max={100}
                          value={draftGoals[goal.id]?.weightage ?? parseFloat(goal.weightage)}
                          onChange={(e) => setDraftGoals(current => ({ ...current, [goal.id]: { ...current[goal.id], weightage: e.target.value } }))}
                        />
                      </div>
                      <Button size="sm" variant="outline" onClick={() => saveGoalEdit(goal.id)} disabled={savingGoalId === goal.id}>
                        {savingGoalId === goal.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                ))}
                <div className="flex gap-2 pt-2">
                  <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => handleAction('Approved', sheet)}>
                    <Check className="h-4 w-4 mr-1" />Approve
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleAction('Returned', sheet)}>
                    <RotateCcw className="h-4 w-4 mr-1" />Return for Rework
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => handleAction('Rejected', sheet)}>
                    <X className="h-4 w-4 mr-1" />Reject
                  </Button>
                </div>
              </CardContent>
            )}
          </Card>
        ))
      )}

      {confirmAction && (
        <ConfirmDialog
          open={!!confirmAction}
          onOpenChange={(open) => !open && setConfirmAction(null)}
          title={`${confirmAction.action} Goal Sheet?`}
          description={
            <div className="space-y-4 pt-2">
              <p>Are you sure you want to {confirmAction.action.toLowerCase()} {confirmAction.sheet?.employeeName}'s goal sheet?</p>
              {confirmAction.action !== 'Approved' && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Add a comment (required)</p>
                  <Textarea 
                    placeholder="Provide constructive feedback..." 
                    value={confirmAction.comment}
                    onChange={(e) => setConfirmAction({...confirmAction, comment: e.target.value})}
                  />
                </div>
              )}
            </div>
          }
          confirmLabel={confirmAction.action}
          onConfirm={executeAction}
          variant={confirmAction.action === 'Rejected' ? 'destructive' : 'default'}
          disabled={confirmAction.action !== 'Approved' && !confirmAction.comment}
        />
      )}
    </div>
  );
}
