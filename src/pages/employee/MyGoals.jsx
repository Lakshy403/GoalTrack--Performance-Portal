import { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { StatusBadge, UomBadge, GoalProgress } from '@/components/shared/GoalComponents';
import useGoalStore from '@/store/goalStore';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Target, Lock, Users, Search, Filter, Loader2, FileX } from 'lucide-react';

const STATUS_OPTIONS = ['all', 'not_started', 'on_track', 'at_risk', 'completed', 'overdue'];
const STATUS_LABEL = { not_started: 'Not Started', on_track: 'On Track', at_risk: 'At Risk', completed: 'Completed', overdue: 'Overdue' };

export default function MyGoals() {
  const { currentSheet, goals, fetchCurrentSheet, fetchAllSheets, allSheets, isLoading } = useGoalStore();
  const [loaded, setLoaded] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('order');

  useEffect(() => {
    const load = async () => {
      await Promise.all([fetchCurrentSheet(), fetchAllSheets()]);
      setLoaded(true);
    };
    load();
  }, []);

  const isLocked = currentSheet && ['submitted', 'under_review', 'approved'].includes(currentSheet.status);

  // Filter and sort
  const filtered = useMemo(() => {
    let result = [...goals];
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(g => g.title.toLowerCase().includes(q) || (g.thrust_area_name || '').toLowerCase().includes(q));
    }
    if (statusFilter !== 'all') {
      result = result.filter(g => g.status === statusFilter);
    }
    switch (sortBy) {
      case 'weightage': result.sort((a, b) => parseFloat(b.weightage) - parseFloat(a.weightage)); break;
      case 'progress': result.sort((a, b) => parseFloat(b.achievement || 0) - parseFloat(a.achievement || 0)); break;
      case 'title': result.sort((a, b) => a.title.localeCompare(b.title)); break;
      default: result.sort((a, b) => a.sort_order - b.sort_order);
    }
    return result;
  }, [goals, search, statusFilter, sortBy]);

  const totalWeightage = goals.reduce((s, g) => s + parseFloat(g.weightage || 0), 0);
  const avgProgress = goals.length > 0 ? Math.round(goals.reduce((s, g) => s + parseFloat(g.achievement || 0), 0) / goals.length) : 0;

  if (!loaded || isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-[hsl(var(--color-muted-foreground))]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            My Goals
            {isLocked && <Lock className="h-4 w-4 text-[hsl(var(--color-muted-foreground))]" />}
          </h2>
          <p className="text-sm text-[hsl(var(--color-muted-foreground))]">
            {currentSheet ? `${currentSheet.period} · ${goals.length} goals · ${totalWeightage}% weightage` : 'No active goal sheet'}
          </p>
        </div>
        {currentSheet && (
          <StatusBadge status={currentSheet.status?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())} />
        )}
      </div>

      {/* Manager review comments */}
      {currentSheet?.review_comments && currentSheet.status === 'rework' && (
        <Card className="border-amber-300 dark:border-amber-700 bg-amber-50/50 dark:bg-amber-950/30">
          <CardContent className="p-4">
            <p className="text-sm font-semibold text-amber-700 dark:text-amber-300 mb-1">Manager Feedback — Rework Required</p>
            <p className="text-sm">{currentSheet.review_comments}</p>
            {currentSheet.reviewerName && (
              <p className="text-xs text-[hsl(var(--color-muted-foreground))] mt-1">— {currentSheet.reviewerName}</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Summary bar */}
      {goals.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card><CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{goals.length}</p><p className="text-xs text-[hsl(var(--color-muted-foreground))]">Total Goals</p>
          </CardContent></Card>
          <Card><CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{totalWeightage}%</p><p className="text-xs text-[hsl(var(--color-muted-foreground))]">Total Weightage</p>
          </CardContent></Card>
          <Card><CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{goals.filter(g => g.status === 'completed').length}</p><p className="text-xs text-[hsl(var(--color-muted-foreground))]">Completed</p>
          </CardContent></Card>
          <Card><CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{avgProgress}%</p><p className="text-xs text-[hsl(var(--color-muted-foreground))]">Avg Progress</p>
          </CardContent></Card>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[hsl(var(--color-muted-foreground))]" />
          <Input placeholder="Search goals..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]"><Filter className="h-4 w-4 mr-1" /><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {STATUS_OPTIONS.filter(s => s !== 'all').map(s => (
              <SelectItem key={s} value={s}>{STATUS_LABEL[s]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="order">Sort: Order</SelectItem>
            <SelectItem value="weightage">Sort: Weightage</SelectItem>
            <SelectItem value="progress">Sort: Progress</SelectItem>
            <SelectItem value="title">Sort: Title</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Goals List */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtered.map((goal) => (
            <Card key={goal.id} className={`overflow-hidden transition-all hover:shadow-md ${isLocked ? 'opacity-90' : ''}`}>
              <CardContent className="p-5 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-sm font-semibold truncate">{goal.title}</h4>
                      {goal.is_shared ? (
                        <span className="inline-flex items-center gap-1 text-[10px] text-teal-700 dark:text-indigo-400 font-medium">
                          <Users className="h-3 w-3" /> Shared
                        </span>
                      ) : null}
                      {isLocked && <Lock className="h-3.5 w-3.5 text-[hsl(var(--color-muted-foreground))]" />}
                    </div>
                    <p className="text-xs text-[hsl(var(--color-muted-foreground))]">{goal.thrust_area_name}</p>
                  </div>
                  <StatusBadge status={STATUS_LABEL[goal.status] || goal.status} />
                </div>
                {goal.description && (
                  <p className="text-xs text-[hsl(var(--color-muted-foreground))] line-clamp-2">{goal.description}</p>
                )}
                <div className="flex items-center gap-3 flex-wrap">
                  <UomBadge type={goal.uom_type} />
                  <span className="text-xs text-[hsl(var(--color-muted-foreground))]">Target: {goal.target_value}</span>
                  <span className="text-xs font-medium ml-auto">{parseFloat(goal.weightage)}%</span>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-[hsl(var(--color-muted-foreground))]">Achievement</span>
                    <span className="font-medium">{parseFloat(goal.achievement || 0)}%</span>
                  </div>
                  <Progress value={parseFloat(goal.achievement || 0)} className="h-2" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-[hsl(var(--color-muted-foreground))]">
            <FileX className="h-12 w-12 mb-3 opacity-30" />
            <p className="text-lg font-medium mb-1">No Goals Found</p>
            <p className="text-sm">{search || statusFilter !== 'all' ? 'Try adjusting your filters' : 'Create a goal sheet to get started'}</p>
          </CardContent>
        </Card>
      )}

      {/* Historical sheets */}
      {allSheets.length > 1 && (
        <Card>
          <CardHeader><CardTitle>Previous Quarters</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {allSheets.filter(s => s.id !== currentSheet?.id).map(sheet => (
              <div key={sheet.id} className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-white/40 to-emerald-50/30 dark:from-slate-800/40 dark:to-slate-800/30 border border-teal-50/60 dark:border-slate-700/30">
                <div>
                  <p className="text-sm font-medium">{sheet.period}</p>
                  <p className="text-xs text-[hsl(var(--color-muted-foreground))]">{sheet.goal_count} goals · v{sheet.version}</p>
                </div>
                <StatusBadge status={sheet.status?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())} />
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
