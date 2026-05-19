import { useEffect, useState, useMemo } from 'react';
import StatsCard from '@/components/shared/StatsCard';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { StatusBadge, GoalCardMini } from '@/components/shared/GoalComponents';
import useAuthStore from '@/store/authStore';
import useGoalStore from '@/store/goalStore';
import { Target, CheckCircle, Clock, TrendingUp, ArrowRight, BarChart3, FileText, Users, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const STATUS_MAP = {
  not_started: 'Not Started', on_track: 'On Track', at_risk: 'At Risk',
  completed: 'Completed', overdue: 'Overdue',
};
const STATUS_COLORS = ['#0d9488', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function EmployeeDashboard() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { currentSheet, goals, sharedGoals, fetchCurrentSheet, fetchAllSheets, fetchNotifications, notifications, allSheets, isLoading } = useGoalStore();
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const load = async () => {
      await Promise.all([fetchCurrentSheet(), fetchAllSheets(), fetchNotifications()]);
      setLoaded(true);
    };
    load();
  }, []);

  // Computed stats
  const totalGoals = goals.length;
  const completedGoals = goals.filter(g => g.status === 'completed').length;
  const pendingGoals = goals.filter(g => g.status !== 'completed').length;
  const avgProgress = totalGoals > 0 ? Math.round(goals.reduce((s, g) => s + parseFloat(g.achievement || 0), 0) / totalGoals) : 0;
  const sheetStatus = currentSheet?.status || 'No Sheet';

  // Chart: goal progress
  const chartData = useMemo(() =>
    goals.filter(g => parseFloat(g.achievement || 0) > 0).map(g => ({
      name: g.title.length > 15 ? g.title.slice(0, 15) + '…' : g.title,
      progress: parseFloat(g.achievement || 0),
    })), [goals]
  );

  // Status distribution for pie-like display
  const statusDist = useMemo(() => {
    const map = {};
    goals.forEach(g => {
      const label = STATUS_MAP[g.status] || g.status;
      map[label] = (map[label] || 0) + 1;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [goals]);

  if (!loaded || isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-[hsl(var(--color-muted-foreground))]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-white/60 via-emerald-50/40 to-violet-50/30 dark:from-slate-900 dark:via-slate-900 dark:to-indigo-950 p-8 text-slate-800 dark:text-white border border-teal-100/60 dark:border-slate-800 shadow-sm">
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-teal-200/30 dark:bg-white/5 rounded-full blur-2xl" />
        <div className="absolute bottom-4 right-8 w-24 h-24 bg-violet-200/20 dark:bg-white/5 rounded-full blur-xl" />
        <div className="relative z-10">
          <h2 className="text-2xl font-bold mb-1 text-slate-800 dark:text-white">Welcome back, {user?.firstName || user?.name?.split(' ')[0]} 👋</h2>
          <p className="text-slate-500 dark:text-slate-300 mb-4">
            {currentSheet
              ? `${currentSheet.period} — Sheet Status: ${currentSheet.status?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}`
              : 'No goal sheet created yet for this quarter.'}
          </p>
          <div className="flex items-center gap-3">
            <div className="bg-white/50 dark:bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2 border border-teal-100/60 dark:border-white/10 shadow-sm">
              <p className="text-xs text-slate-500 dark:text-slate-400">Overall</p>
              <p className="text-xl font-bold text-teal-700 dark:text-white">{avgProgress}%</p>
            </div>
            <div className="bg-white/50 dark:bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2 border border-teal-100/60 dark:border-white/10 shadow-sm">
              <p className="text-xs text-slate-500 dark:text-slate-400">Goals</p>
              <p className="text-xl font-bold text-teal-700 dark:text-white">{completedGoals}/{totalGoals}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title="Total Goals" value={totalGoals} icon={Target} subtitle={`${currentSheet?.period || ''}`} />
        <StatsCard title="Completed" value={completedGoals} icon={CheckCircle}
          iconClassName="from-emerald-500/10 to-green-500/10" subtitle={totalGoals > 0 ? `${Math.round((completedGoals / totalGoals) * 100)}% done` : 'N/A'} />
        <StatsCard title="In Progress" value={pendingGoals} icon={Clock}
          iconClassName="from-amber-500/10 to-orange-500/10" subtitle={pendingGoals > 0 ? 'Keep it up!' : 'All done!'} />
        <StatsCard title="Avg Progress" value={`${avgProgress}%`} icon={TrendingUp}
          iconClassName="from-teal-500/10 to-emerald-500/10 dark:from-violet-500/10 dark:to-purple-500/10" trend={avgProgress >= 50 ? 'up' : 'down'} trendValue={`${avgProgress}% avg`} />
      </div>

      {/* Charts + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Goal Progress Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><BarChart3 className="h-5 w-5" /> Goal Progress</CardTitle>
            <CardDescription>Individual goal completion rates</CardDescription>
          </CardHeader>
          <CardContent>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={chartData} barSize={28}>
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} />
                  <Tooltip contentStyle={{ borderRadius: '12px', fontSize: '12px' }} formatter={(v) => `${v}%`} />
                  <Bar dataKey="progress" radius={[6, 6, 0, 0]}>
                    {chartData.map((_, i) => (
                      <Cell key={i} fill={STATUS_COLORS[i % STATUS_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-48 text-[hsl(var(--color-muted-foreground))]">
                <BarChart3 className="h-10 w-10 mb-2 opacity-30" />
                <p className="text-sm">No progress data yet</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Jump to common tasks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {!currentSheet || currentSheet.status === 'draft' || currentSheet.status === 'rework' ? (
              <Button className="w-full justify-start" onClick={() => navigate('/employee/goal-sheet')}>
                <FileText className="h-4 w-4 mr-2" />
                {currentSheet ? 'Edit Goal Sheet' : 'Create Goal Sheet'}
                <ArrowRight className="h-4 w-4 ml-auto" />
              </Button>
            ) : null}
            {currentSheet?.status === 'approved' && (
              <Button className="w-full justify-start" variant="outline" onClick={() => navigate('/employee/check-in')}>
                <TrendingUp className="h-4 w-4 mr-2" /> Quarterly Check-in <ArrowRight className="h-4 w-4 ml-auto" />
              </Button>
            )}
            <Button className="w-full justify-start" variant="outline" onClick={() => navigate('/employee/goals')}>
              <Target className="h-4 w-4 mr-2" /> View My Goals <ArrowRight className="h-4 w-4 ml-auto" />
            </Button>
            {sharedGoals.length > 0 && (
              <div className="mt-4 p-3 rounded-xl bg-gradient-to-r from-teal-50/60 to-emerald-50/40 dark:bg-indigo-950/20 border border-teal-200/60 dark:border-indigo-800">
                <div className="flex items-center gap-2 text-sm font-medium text-teal-800 dark:text-indigo-300">
                  <Users className="h-4 w-4" /> {sharedGoals.length} Shared Goal{sharedGoals.length > 1 ? 's' : ''} Available
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Assigned by admin for this quarter</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Goal Status Distribution + Submissions History */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>Goal Status Overview</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {statusDist.length > 0 ? statusDist.map((s, i) => (
              <div key={s.name} className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: STATUS_COLORS[i % STATUS_COLORS.length] }} />
                <span className="text-sm flex-1">{s.name}</span>
                <span className="text-sm font-bold">{s.value}</span>
              </div>
            )) : (
              <p className="text-sm text-[hsl(var(--color-muted-foreground))]">No goals to display</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div><CardTitle>Submission History</CardTitle><CardDescription>All quarters</CardDescription></div>
          </CardHeader>
          <CardContent className="space-y-3">
            {allSheets.length > 0 ? allSheets.slice(0, 5).map(sheet => (
              <div key={sheet.id} className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-white/40 to-emerald-50/30 dark:from-slate-800/40 dark:to-slate-800/30 border border-teal-50/60 dark:border-slate-700/30 hover:border-teal-200/60 dark:hover:border-slate-600/40 transition-colors">
                <div>
                  <p className="text-sm font-medium">{sheet.period}</p>
                  <p className="text-xs text-[hsl(var(--color-muted-foreground))]">{sheet.goal_count} goals · v{sheet.version}</p>
                </div>
                <StatusBadge status={sheet.status?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())} />
              </div>
            )) : (
              <p className="text-sm text-[hsl(var(--color-muted-foreground))]">No submissions yet</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest employee flow updates from the backend</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {notifications.length > 0 ? notifications.slice(0, 5).map(item => (
            <div key={item.id} className="flex items-start justify-between gap-3 p-3 rounded-lg bg-gradient-to-r from-white/40 to-violet-50/20 dark:from-slate-800/40 dark:to-slate-800/30 border border-violet-50/60 dark:border-slate-700/30">
              <div>
                <p className="text-sm font-medium">{item.title}</p>
                <p className="text-xs text-[hsl(var(--color-muted-foreground))] mt-1">{item.message}</p>
              </div>
              {!item.is_read && <span className="mt-1 h-2 w-2 rounded-full bg-violet-500 dark:bg-blue-500 shrink-0" />}
            </div>
          )) : (
            <p className="text-sm text-[hsl(var(--color-muted-foreground))]">No recent activity yet</p>
          )}
        </CardContent>
      </Card>

      {/* Manager Comments */}
      {currentSheet?.review_comments && (
        <Card className="border-amber-200 dark:border-amber-800 bg-amber-50/30 dark:bg-amber-950/20">
          <CardHeader>
            <CardTitle className="text-amber-700 dark:text-amber-300">Manager Feedback</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{currentSheet.review_comments}</p>
            {currentSheet.reviewerName && (
              <p className="text-xs text-[hsl(var(--color-muted-foreground))] mt-2">— {currentSheet.reviewerName}</p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
