import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { StatusBadge, GoalProgress, UomBadge } from '@/components/shared/GoalComponents';
import { useToast } from '@/components/ui/toast';
import useGoalStore from '@/store/goalStore';
import { Calendar, MessageSquare, Save, Loader2, AlertCircle } from 'lucide-react';

const STATUS_OPTIONS = ['not_started', 'on_track', 'completed'];
const STATUS_LABELS = { not_started: 'Not Started', on_track: 'On Track', at_risk: 'At Risk', completed: 'Completed' };
const SCORE_METHOD_LABELS = {
  min: 'Higher is better: actual divided by target',
  max: 'Lower is better: target divided by actual',
  timeline: 'Timeline: completion date on or before deadline',
  zero: 'Zero-based: zero actual equals 100%',
};

export default function CheckIn() {
  const { addToast } = useToast();
  const { currentSheet, goals, checkins, fetchCurrentSheet, fetchCheckins, createCheckin, isLoading, isSaving } = useGoalStore();
  const [loaded, setLoaded] = useState(false);

  const [selectedGoalId, setSelectedGoalId] = useState('');
  const [achievement, setAchievement] = useState('');
  const [status, setStatus] = useState('');
  const [comment, setComment] = useState('');

  useEffect(() => {
    const load = async () => {
      const sheet = await fetchCurrentSheet();
      setLoaded(true);
      if (sheet?.goals?.length > 0) {
        setSelectedGoalId(String(sheet.goals[0].id));
      }
    };
    load();
  }, []);

  // When goal changes, fetch its check-in history
  useEffect(() => {
    if (selectedGoalId) {
      fetchCheckins(selectedGoalId);
      // Auto-fill current values
      const g = goals.find(x => String(x.id) === selectedGoalId);
      if (g) {
        setAchievement(g.achievement || '');
        setStatus(g.status || 'not_started');
        setComment('');
      }
    }
  }, [selectedGoalId, goals]);

  const goal = goals.find(g => String(g.id) === selectedGoalId);
  const goalCheckins = checkins[selectedGoalId] || [];

  const handleSave = async () => {
    if (!achievement || !status || !comment.trim()) {
      addToast({ title: 'Missing fields', description: 'Please fill in all check-in fields.', variant: 'warning' });
      return;
    }

    const result = await createCheckin({
      goalId: parseInt(selectedGoalId),
      quarterId: currentSheet.quarter_id,
      achievementValue: parseFloat(achievement),
      status,
      employeeComment: comment
    });

    if (result) {
      addToast({ title: 'Check-in Saved', description: `Progress updated for "${goal?.title}"`, variant: 'success' });
      setComment('');
    }
  };

  if (!loaded || isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-[hsl(var(--color-muted-foreground))]" />
      </div>
    );
  }

  if (!currentSheet || currentSheet.status !== 'approved') {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16 text-[hsl(var(--color-muted-foreground))]">
          <AlertCircle className="h-10 w-10 mb-3 opacity-30" />
          <p className="text-lg font-medium mb-1">Check-in Not Available</p>
          <p className="text-sm">You can only submit check-ins for approved goal sheets.</p>
        </CardContent>
      </Card>
    );
  }

  if (goals.length === 0) return null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* CHECK-IN FORM (2/3) */}
      <div className="lg:col-span-2 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Quarterly Check-in</CardTitle>
            <CardDescription>Update your progress for {currentSheet.period}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Goal Selector */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Goal</label>
              <Select value={selectedGoalId} onValueChange={setSelectedGoalId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a goal" />
                </SelectTrigger>
                <SelectContent>
                  {goals.map(g => (
                    <SelectItem key={g.id} value={String(g.id)}>{g.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Selected Goal Snapshot */}
            {goal && (
              <div className="p-4 rounded-xl bg-gradient-to-br from-white/50 via-emerald-50/30 to-teal-50/20 dark:from-slate-800/40 dark:to-slate-800/20 border border-teal-100/60 dark:border-slate-700 space-y-3">
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <span className="text-sm font-bold block mb-1">{goal.title}</span>
                    <div className="flex items-center gap-2 flex-wrap">
                      <UomBadge type={goal.uom_type} />
                      <span className="text-xs text-[hsl(var(--color-muted-foreground))]">Target: {goal.target_value}</span>
                      <span className="text-xs text-[hsl(var(--color-muted-foreground))]">{SCORE_METHOD_LABELS[goal.score_method] || SCORE_METHOD_LABELS.min}</span>
                    </div>
                  </div>
                  <StatusBadge status={STATUS_LABELS[goal.status] || goal.status} />
                </div>
                <div className="pt-2">
                  <div className="flex justify-between text-xs mb-1">
                    <span>Computed Progress Score</span>
                    <span className="font-medium">{parseFloat(goal.achievement || 0)}%</span>
                  </div>
                  <GoalProgress achievement={goal.achievement} />
                </div>
              </div>
            )}

            {/* Update Form */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Actual Achievement *</label>
                <Input 
                  type="number" min={0}
                  value={achievement} onChange={e => setAchievement(e.target.value)} 
                  placeholder="Enter actual value" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">New Status *</label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger><SelectValue placeholder="Update status" /></SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map(s => (
                      <SelectItem key={s} value={s}>{STATUS_LABELS[s]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Progress Notes *</label>
              <Textarea 
                value={comment} onChange={e => setComment(e.target.value)} 
                placeholder="Describe what you've accomplished since the last check-in..." 
                rows={4} 
              />
            </div>

            <Button onClick={handleSave} disabled={isSaving || !goal}>
              {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              Save Check-in
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* HISTORY (1/3) */}
      <div className="space-y-4">
        <Card className="sticky top-20">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Calendar className="h-4 w-4" /> Check-in History
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 max-h-[500px] overflow-y-auto">
            {goalCheckins.length > 0 ? (
              goalCheckins.map((entry) => (
                <div key={entry.id} className="p-3 rounded-lg border border-teal-100/60 dark:border-slate-700 bg-gradient-to-br from-white/50 to-emerald-50/20 dark:from-slate-800/50 dark:to-slate-800/30 space-y-2 shadow-sm">
                  <div className="flex items-center justify-between text-xs text-[hsl(var(--color-muted-foreground))]">
                    <span className="font-medium">{new Date(entry.checkin_date || entry.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    <StatusBadge status={STATUS_LABELS[entry.status] || entry.status} />
                  </div>
                  
                  <div className="flex items-center justify-between text-xs font-semibold bg-gradient-to-r from-teal-50/50 to-emerald-50/30 dark:from-slate-700/50 dark:to-slate-700/30 px-2 py-1 rounded">
                    <span>Actual Achievement:</span>
                    <span>{parseFloat(entry.achievement_value)}%</span>
                  </div>
                  
                  <p className="text-xs leading-relaxed">{entry.employee_comment}</p>
                  
                  {entry.manager_comment && (
                    <div className="flex items-start gap-2 pt-2 mt-2 border-t border-[hsl(var(--color-border))]">
                      <div className="p-1 rounded bg-teal-100 dark:bg-blue-900/40 shrink-0">
                        <MessageSquare className="h-3 w-3 text-teal-700 dark:text-blue-400" />
                      </div>
                      <div>
                        <p className="text-[10px] font-medium text-[hsl(var(--color-muted-foreground))] mb-0.5">Manager Reply</p>
                        <p className="text-xs text-teal-800 dark:text-blue-300 italic">"{entry.manager_comment}"</p>
                      </div>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <p className="text-sm text-[hsl(var(--color-muted-foreground))]">No history yet</p>
                <p className="text-xs text-[hsl(var(--color-muted-foreground))]/70 mt-1">Submit your first check-in to see history.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
