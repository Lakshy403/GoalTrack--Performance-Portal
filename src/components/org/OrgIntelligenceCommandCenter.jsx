import { useCallback, useEffect, useMemo, useState } from 'react';
import { ReactFlow, Background, Controls, MiniMap, Handle, MarkerType, Position, useEdgesState, useNodesState } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Bar, BarChart, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Bell, GitBranch, GitPullRequest, History, Loader2, Network, Send, ShieldCheck, Siren, Sparkles, Target, TrendingUp, Users } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/toast';
import { masterService, orgIntelligenceService } from '@/services/api';
import useAuthStore from '@/store/authStore';
import { cn } from '@/lib/utils';

const STATUS_COLORS = { not_started: '#fecaca', on_track: '#f59e0b', completed: '#10b981' };
const PIE_COLORS = ['#f87171', '#f59e0b', '#10b981', '#0d9488'];
const nodeTypes = { orgNode: OrgNode };

function layoutNodes(rawNodes) {
  const grouped = rawNodes.reduce((acc, node) => {
    const level = node.role === 'admin' ? 0 : node.role === 'manager' ? 1 : 2;
    acc[level] = acc[level] || [];
    acc[level].push(node);
    return acc;
  }, {});
  return rawNodes.map((node) => {
    const level = node.role === 'admin' ? 0 : node.role === 'manager' ? 1 : 2;
    const siblings = grouped[level] || [];
    const index = siblings.findIndex((entry) => entry.id === node.id);
    const spread = Math.max(siblings.length - 1, 1);
    return { id: node.id, type: 'orgNode', position: { x: index * 290 - spread * 145, y: level * 230 }, data: node };
  });
}

function OrgNode({ data }) {
  const color = STATUS_COLORS[data.status] || STATUS_COLORS.not_started;
  const offset = 96 - (96 * data.completion) / 100;
  const attention = data.escalations > 0 || data.sheetStatus === 'missing';
  return (
    <button className={cn('group w-[248px] rounded-lg border bg-[hsl(var(--color-card))] p-4 text-left shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl', attention && 'ring-2 ring-red-400/50')} style={{ borderColor: color }}>
      <Handle type="target" position={Position.Top} className="!bg-slate-400" />
      <div className="flex items-start gap-3">
        <div className="relative h-12 w-12 shrink-0">
          <svg viewBox="0 0 40 40" className="h-12 w-12 -rotate-90">
            <circle cx="20" cy="20" r="15" fill="none" stroke="rgba(148,163,184,.25)" strokeWidth="4" />
            <circle cx="20" cy="20" r="15" fill="none" stroke={color} strokeWidth="4" strokeDasharray="96" strokeDashoffset={offset} strokeLinecap="round" />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-[11px] font-bold">{data.completion}%</span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-semibold">{data.name}</p>
            {data.linkedGoals > 0 && <Badge className="h-5 px-1.5 text-[10px]">Linked KPI</Badge>}
          </div>
          <p className="truncate text-xs capitalize text-[hsl(var(--color-muted-foreground))]">{data.role} · {data.department}</p>
          <p className="truncate text-[11px] text-[hsl(var(--color-muted-foreground))]">{data.designation}</p>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2 text-center">
        <NodeMetric label="Goals" value={data.activeGoals} />
        <NodeMetric label="Review" value={data.pendingApprovals} />
        <NodeMetric label="Esc" value={data.escalations} urgent={data.escalations > 0} />
      </div>
      <div className="mt-3 flex items-center justify-between text-[11px]">
        <span className="capitalize text-[hsl(var(--color-muted-foreground))]">{String(data.sheetStatus).replace('_', ' ')}</span>
        {attention && <span className="animate-pulse rounded-full bg-red-100 px-2 py-0.5 font-medium text-red-700 dark:bg-red-950 dark:text-red-300">watch</span>}
      </div>
      <Handle type="source" position={Position.Bottom} className="!bg-slate-400" />
    </button>
  );
}

function NodeMetric({ label, value, urgent }) {
  return (
    <div className={cn('rounded-md bg-[hsl(var(--color-muted))]/45 px-2 py-1', urgent && 'bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-300')}>
      <p className="text-sm font-bold">{value}</p>
      <p className="text-[10px] text-[hsl(var(--color-muted-foreground))]">{label}</p>
    </div>
  );
}

export default function OrgIntelligenceCommandCenter({ scope = 'admin' }) {
  const { user } = useAuthStore();
  const { addToast } = useToast();
  const [data, setData] = useState(null);
  const [thrustAreas, setThrustAreas] = useState([]);
  const [selectedNode, setSelectedNode] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [demoMode, setDemoMode] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', thrustAreaId: '', targetValue: '', uomType: 'percentage', weightage: 10, assigneeId: '' });
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [{ data: dashboard }, { data: thrusts }] = await Promise.all([orgIntelligenceService.getDashboard(), masterService.getThrustAreas()]);
      setData(dashboard);
      setThrustAreas(thrusts);
      setNodes(layoutNodes(dashboard.nodes));
      setEdges(dashboard.edges.map((edge) => ({ ...edge, markerEnd: { type: MarkerType.ArrowClosed }, style: { strokeWidth: 2, stroke: '#94a3b8' } })));
      const defaultAssignee = dashboard.nodes.find((node) => node.role === 'manager') || dashboard.nodes.find((node) => node.role === 'admin');
      setForm((current) => ({ ...current, assigneeId: defaultAssignee ? String(defaultAssignee.userId) : '' }));
    } catch (err) {
      addToast({ title: 'Org Intelligence Unavailable', description: err.response?.data?.error || 'Could not load command center data.', variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [addToast, setEdges, setNodes]);

  useEffect(() => { load(); }, [load]);

  const dashboard = useMemo(() => data || {
    nodes: [],
    analytics: { totals: {}, managerEffectiveness: [], departmentCompletion: [], statusCounts: [], sharedDistribution: [], quarterlyTrends: [], leaderboard: [] },
    notifications: [],
    auditLogs: [],
    escalations: [],
    timelines: [],
  }, [data]);

  const cascadeGoal = async () => {
    if (!form.assigneeId || !form.title || !form.thrustAreaId || !form.targetValue) {
      addToast({ title: 'Missing KPI Fields', description: 'Select an assignee, thrust area, title, and target.', variant: 'warning' });
      return;
    }
    setSaving(true);
    try {
      const { data: result } = await orgIntelligenceService.cascadeGoal({
        ...form,
        assigneeId: Number(form.assigneeId),
        thrustAreaId: Number(form.thrustAreaId),
        weightage: Number(form.weightage),
      });
      addToast({ title: 'Cascading KPI Assigned', description: `Created ${result.created} linked employee goals.`, variant: 'success' });
      setForm((current) => ({ ...current, title: '', description: '', targetValue: '' }));
      await load();
    } catch (err) {
      addToast({ title: 'Cascade Failed', description: err.response?.data?.error || 'Could not cascade KPI.', variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <CommandCenterSkeleton />;

  return (
    <div className="space-y-6">
      <section className="rounded-lg border bg-[hsl(var(--color-card))] p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Network className="h-5 w-5 text-teal-600 dark:text-indigo-400" />
              <h2 className="text-xl font-semibold">Cascading Goal Graph & Organizational Intelligence</h2>
            </div>
            <p className="mt-1 text-sm text-[hsl(var(--color-muted-foreground))]">
              {scope === 'admin' ? 'Executive command center' : 'Manager team command center'} for {user?.department || 'the organization'}.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => setDemoMode((value) => !value)}><Sparkles className="mr-2 h-4 w-4" />{demoMode ? 'Live Data' : 'Demo Mode'}</Button>
            <Button variant="outline" onClick={load}><TrendingUp className="mr-2 h-4 w-4" />Refresh</Button>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-6">
        <Kpi icon={Users} label="People" value={dashboard.analytics.totals.people || 0} />
        <Kpi icon={ShieldCheck} label="Managers" value={dashboard.analytics.totals.managers || 0} />
        <Kpi icon={Target} label="Avg Completion" value={`${dashboard.analytics.totals.avgCompletion || 0}%`} />
        <Kpi icon={GitBranch} label="Shared KPIs" value={dashboard.analytics.totals.sharedGoals || 0} />
        <Kpi icon={Siren} label="Escalations" value={dashboard.analytics.totals.openEscalations || 0} />
        <Kpi icon={Bell} label="Alerts" value={dashboard.notifications.filter((item) => !item.is_read).length} />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Card className="overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Organizational Graph Visualizer</CardTitle>
              <CardDescription>Zoom, pan, inspect hierarchy, heatmap health, linked KPI distribution, and escalation risk.</CardDescription>
            </div>
            <Badge variant="outline">{dashboard.nodes.length} nodes</Badge>
          </CardHeader>
          <CardContent className="h-[610px] p-0">
            <ReactFlow
              nodes={nodes}
              edges={edges}
              nodeTypes={nodeTypes}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onNodeClick={(_, node) => setSelectedNode(node.data)}
              fitView
              minZoom={0.35}
              maxZoom={1.6}
              className="bg-[radial-gradient(circle_at_1px_1px,rgba(148,163,184,.24)_1px,transparent_0)] [background-size:24px_24px]"
            >
              <Background gap={18} color="rgba(148,163,184,.35)" />
              <Controls />
              <MiniMap nodeColor={(node) => STATUS_COLORS[node.data?.status] || '#94a3b8'} pannable zoomable />
            </ReactFlow>
          </CardContent>
        </Card>

        <aside className="space-y-6">
          <CascadingKpiPanel form={form} setForm={setForm} nodes={dashboard.nodes} thrustAreas={thrustAreas} onSubmit={cascadeGoal} saving={saving} />
          <InspectorPanel selectedNode={selectedNode} />
        </aside>
      </div>

      <AnalyticsGrid dashboard={dashboard} />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <NotificationCenter notifications={dashboard.notifications} />
        <AuditLedger auditLogs={dashboard.auditLogs} />
        <GoalTimeline timelines={dashboard.timelines} />
      </div>

      <EscalationPanel escalations={dashboard.escalations} />
    </div>
  );
}

function CommandCenterSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-28 w-full" />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-6">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-24" />)}</div>
      <Skeleton className="h-[640px] w-full" />
    </div>
  );
}

function Kpi({ icon: Icon, label, value }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className="rounded-md bg-gradient-to-br from-teal-50 to-emerald-50/50 p-2 text-teal-600 dark:bg-none dark:bg-[#1E293B] dark:text-blue-400"><Icon className="h-4 w-4" /></div>
          <div><p className="text-xs text-[hsl(var(--color-muted-foreground))]">{label}</p><p className="text-xl font-bold">{value}</p></div>
        </div>
      </CardContent>
    </Card>
  );
}

function CascadingKpiPanel({ form, setForm, nodes, thrustAreas, onSubmit, saving }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Send className="h-5 w-5" /> Cascading Shared Goal</CardTitle>
        <CardDescription>Assign a departmental KPI to a manager node and cascade linked goals to child employees.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Assignee Node</Label>
          <Select value={form.assigneeId} onValueChange={(value) => setForm((current) => ({ ...current, assigneeId: value }))}>
            <SelectTrigger><SelectValue placeholder="Choose manager" /></SelectTrigger>
            <SelectContent>{nodes.filter((node) => node.role !== 'employee').map((node) => <SelectItem key={node.userId} value={String(node.userId)}>{node.name} · {node.role}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Thrust Area</Label>
          <Select value={form.thrustAreaId} onValueChange={(value) => setForm((current) => ({ ...current, thrustAreaId: value }))}>
            <SelectTrigger><SelectValue placeholder="Select thrust area" /></SelectTrigger>
            <SelectContent>{thrustAreas.map((area) => <SelectItem key={area.id} value={String(area.id)}>{area.name}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <Field label="KPI Title" value={form.title} onChange={(value) => setForm((current) => ({ ...current, title: value }))} />
        <Field label="Target" value={form.targetValue} onChange={(value) => setForm((current) => ({ ...current, targetValue: value }))} />
        <Field label="Default Weightage" type="number" value={form.weightage} onChange={(value) => setForm((current) => ({ ...current, weightage: value }))} />
        <div className="space-y-2"><Label>Description</Label><Textarea value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} rows={3} /></div>
        <Button className="w-full" onClick={onSubmit} disabled={saving}>{saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <GitBranch className="mr-2 h-4 w-4" />}Cascade KPI</Button>
      </CardContent>
    </Card>
  );
}

function Field({ label, value, onChange, type = 'text' }) {
  return <div className="space-y-2"><Label>{label}</Label><Input type={type} value={value} onChange={(event) => onChange(event.target.value)} /></div>;
}

function InspectorPanel({ selectedNode }) {
  return (
    <Card>
      <CardHeader><CardTitle>Graph Inspector</CardTitle><CardDescription>Click a node to inspect goal health and governance state.</CardDescription></CardHeader>
      <CardContent>
        {selectedNode ? (
          <div className="space-y-4">
            <div><p className="font-semibold">{selectedNode.name}</p><p className="text-sm capitalize text-[hsl(var(--color-muted-foreground))]">{selectedNode.role} · {selectedNode.department}</p></div>
            <Progress value={selectedNode.completion} className="h-2" />
            <div className="grid grid-cols-2 gap-2 text-sm">
              <NodeMetric label="Active Goals" value={selectedNode.activeGoals} />
              <NodeMetric label="Linked KPIs" value={selectedNode.linkedGoals} />
              <NodeMetric label="Pending" value={selectedNode.pendingApprovals} />
              <NodeMetric label="Escalations" value={selectedNode.escalations} urgent={selectedNode.escalations > 0} />
            </div>
          </div>
        ) : <p className="text-sm text-[hsl(var(--color-muted-foreground))]">Select a graph node to open the intelligence side panel.</p>}
      </CardContent>
    </Card>
  );
}

function AnalyticsGrid({ dashboard }) {
  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
      <ChartCard title="Manager Effectiveness"><ResponsiveContainer width="100%" height={240}><BarChart data={dashboard.analytics.managerEffectiveness}><XAxis dataKey="name" tick={{ fontSize: 11 }} /><YAxis domain={[0, 100]} tick={{ fontSize: 11 }} /><Tooltip /><Bar dataKey="completion" fill="#0d9488" radius={[6, 6, 0, 0]} /></BarChart></ResponsiveContainer></ChartCard>
      <ChartCard title="Quarterly Goal Trends"><ResponsiveContainer width="100%" height={240}><LineChart data={dashboard.analytics.quarterlyTrends}><XAxis dataKey="quarter" tick={{ fontSize: 11 }} /><YAxis domain={[0, 100]} tick={{ fontSize: 11 }} /><Tooltip /><Line dataKey="completion" stroke="#10b981" strokeWidth={3} dot /></LineChart></ResponsiveContainer></ChartCard>
      <ChartCard title="Goal Status Distribution"><ResponsiveContainer width="100%" height={240}><PieChart><Pie data={dashboard.analytics.statusCounts} dataKey="value" nameKey="name" innerRadius={52} outerRadius={86}>{dashboard.analytics.statusCounts.map((_, index) => <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer></ChartCard>
      <ChartCard title="Department Completion Heatmap"><div className="grid grid-cols-1 gap-3">{dashboard.analytics.departmentCompletion.map((item) => <div key={item.department} className="rounded-md border p-3"><div className="mb-2 flex items-center justify-between text-sm"><span className="font-medium">{item.department}</span><span>{item.completion}%</span></div><Progress value={item.completion} className="h-2" /></div>)}</div></ChartCard>
      <ChartCard title="Shared Goal Distribution"><ResponsiveContainer width="100%" height={240}><BarChart data={dashboard.analytics.sharedDistribution}><XAxis dataKey="department" tick={{ fontSize: 10 }} /><YAxis tick={{ fontSize: 11 }} /><Tooltip /><Bar dataKey="linked" fill="#0ea5e9" radius={[6, 6, 0, 0]} /></BarChart></ResponsiveContainer></ChartCard>
      <ChartCard title="Completion Leaderboard"><div className="space-y-3">{dashboard.analytics.leaderboard.map((node, index) => <div key={node.id} className="flex items-center gap-3"><span className="flex h-7 w-7 items-center justify-center rounded-md bg-[hsl(var(--color-muted))] text-xs font-bold">{index + 1}</span><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{node.name}</p><Progress value={node.completion} className="mt-1 h-1.5" /></div><span className="text-sm font-semibold">{node.completion}%</span></div>)}</div></ChartCard>
    </div>
  );
}

function ChartCard({ title, children }) {
  return <Card><CardHeader><CardTitle className="text-base">{title}</CardTitle></CardHeader><CardContent>{children}</CardContent></Card>;
}

function NotificationCenter({ notifications }) {
  return (
    <Card>
      <CardHeader><CardTitle className="flex items-center gap-2"><Bell className="h-5 w-5" /> Teams-Style Notifications</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        {notifications.slice(0, 6).map((item) => <div key={item.id} className="rounded-md border p-3"><div className="mb-2 flex items-center justify-between"><Badge variant="outline">{item.type.replace('_', ' ')}</Badge>{!item.is_read && <span className="h-2 w-2 rounded-full bg-teal-500 dark:bg-blue-500" />}</div><p className="text-sm font-semibold">{item.title}</p><p className="mt-1 text-xs text-[hsl(var(--color-muted-foreground))]">{item.message}</p>{item.link && <Button size="sm" variant="outline" className="mt-3 h-8">Open workflow</Button>}</div>)}
      </CardContent>
    </Card>
  );
}

function AuditLedger({ auditLogs }) {
  return (
    <Card className="flex flex-col h-full">
      <CardHeader className="border-b bg-[hsl(var(--color-muted)/0.3)] px-4 py-3">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          <GitPullRequest className="h-4 w-4 text-[hsl(var(--color-primary))]" /> 
          Git-Diff Audit Ledger
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 space-y-4 p-4 overflow-auto">
        {auditLogs.slice(0, 6).map((log, index) => {
          let metadata = null;
          try { metadata = typeof log.metadata === 'string' ? JSON.parse(log.metadata) : log.metadata; } catch { metadata = null; }
          const logsToShow = auditLogs.slice(0, 6);
          return (
            <div key={log.id} className="relative pl-7">
              {/* Timeline line */}
              {index !== logsToShow.length - 1 && (
                <div className="absolute left-[11px] top-6 bottom-[-16px] w-[2px] bg-slate-200 dark:bg-slate-800" />
              )}
              {/* Timeline dot */}
              <div className="absolute left-0 top-1 h-[24px] w-[24px] rounded-full bg-[hsl(var(--color-background))] border-2 border-slate-200 dark:border-slate-800 flex items-center justify-center z-10">
                <div className="h-1.5 w-1.5 rounded-full bg-slate-400 dark:bg-slate-500" />
              </div>
              
              <div className="rounded-md border bg-[hsl(var(--color-card))] p-3 shadow-sm">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <p className="text-sm font-semibold leading-none mb-1.5">{log.action}</p>
                    <p className="text-xs text-[hsl(var(--color-muted-foreground))] leading-none">
                      <span className="font-medium text-slate-700 dark:text-slate-300">{log.actor_name || 'System'}</span> · {log.target_label || log.entity_type}
                    </p>
                  </div>
                  <span className="text-[10px] text-[hsl(var(--color-muted-foreground))] whitespace-nowrap">
                    {new Date(log.created_at).toLocaleDateString()}
                  </span>
                </div>
                
                <div className="rounded border border-slate-100 dark:border-slate-800 overflow-hidden font-mono text-[11px] leading-relaxed tracking-tight">
                  <div className="bg-red-50/50 dark:bg-red-950/20 px-3 py-1.5 text-red-700 dark:text-red-400 border-b border-red-100/50 dark:border-red-900/30 flex gap-3">
                    <span className="select-none opacity-40">-</span>
                    <span className="break-all">{metadata?.before ? JSON.stringify(metadata.before) : 'previous state'}</span>
                  </div>
                  <div className="bg-emerald-50/50 dark:bg-emerald-950/20 px-3 py-1.5 text-emerald-700 dark:text-emerald-400 flex gap-3">
                    <span className="select-none opacity-40">+</span>
                    <span className="break-all">{metadata?.after ? JSON.stringify(metadata.after) : log.details || 'updated state'}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        {!auditLogs.length && (
          <p className="text-sm text-[hsl(var(--color-muted-foreground))]">No governance audit logs recorded yet.</p>
        )}
      </CardContent>
    </Card>
  );
}

function GoalTimeline({ timelines }) {
  const timeline = timelines[0];
  return (
    <Card>
      <CardHeader><CardTitle className="flex items-center gap-2"><History className="h-5 w-5" /> Goal Lifecycle Timeline</CardTitle><CardDescription>{timeline?.employeeName || 'Latest goal sheet'}</CardDescription></CardHeader>
      <CardContent>{timeline ? <div className="space-y-4">{timeline.events.map((event, index) => <div key={`${event.stage}-${index}`} className="relative border-l pl-4"><span className="absolute -left-[5px] top-1.5 h-2.5 w-2.5 rounded-full bg-teal-500 dark:bg-blue-500" /><p className="text-sm font-semibold">{event.stage}</p><p className="text-xs text-[hsl(var(--color-muted-foreground))]">{event.actor} · {event.timestamp ? new Date(event.timestamp).toLocaleString() : 'Pending'}</p>{event.comment && <p className="mt-1 text-xs">{event.comment}</p>}</div>)}</div> : <p className="text-sm text-[hsl(var(--color-muted-foreground))]">No lifecycle events yet.</p>}</CardContent>
    </Card>
  );
}

function EscalationPanel({ escalations }) {
  return (
    <Card>
      <CardHeader><CardTitle className="flex items-center gap-2"><Siren className="h-5 w-5" /> Escalation Engine</CardTitle><CardDescription>Rule-based monitoring for missing submissions, approvals, and quarterly updates.</CardDescription></CardHeader>
      <CardContent className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        {escalations.length ? escalations.slice(0, 6).map((item) => <div key={item.id} className="rounded-md border p-3"><div className="mb-2 flex items-center justify-between"><Badge className={cn(item.priority === 'critical' && 'bg-red-600')}>{item.priority}</Badge><span className="text-xs text-[hsl(var(--color-muted-foreground))]">{item.days_overdue}d overdue</span></div><p className="text-sm font-semibold">{item.employee_name}</p><p className="mt-1 text-xs text-[hsl(var(--color-muted-foreground))]">{item.reason}</p><p className="mt-2 text-xs">Route: Employee → Manager → HR</p></div>) : <div className="rounded-md border p-4 text-sm text-[hsl(var(--color-muted-foreground))]">No active escalations. Governance checks are green.</div>}
      </CardContent>
    </Card>
  );
}
