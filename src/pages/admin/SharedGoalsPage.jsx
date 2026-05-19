import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/toast';
import { Send, Users, Loader2 } from 'lucide-react';

const UOM_TYPES = ['percentage', 'number', 'currency', 'rating', 'boolean', 'date'];
import { adminService, masterService } from '@/services/api';

export default function SharedGoalsPage() {
  const { addToast } = useToast();
  const [form, setForm] = useState({ title: '', thrustArea: '', uomType: '', target: '', department: '', description: '' });
  const [sharedGoals, setSharedGoals] = useState([]);
  const [thrustAreas, setThrustAreas] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pushing, setPushing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [goalsRes, thrustRes, deptRes] = await Promise.all([
        adminService.getSharedGoals(),
        masterService.getThrustAreas(),
        adminService.getDepartmentStats()
      ]);
      setSharedGoals(goalsRes.data);
      setThrustAreas(thrustRes.data);
      setDepartments(deptRes.data);
    } catch (err) {
      addToast({ title: 'Error', description: 'Failed to load data', variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handlePush = async () => {
    if (!form.title || !form.thrustArea || !form.uomType || !form.target) {
      return addToast({ title: 'Validation Error', description: 'Please fill all required fields.', variant: 'error' });
    }

    setPushing(true);
    try {
      await adminService.pushSharedGoal({
        title: form.title,
        description: form.description,
        thrustAreaId: parseInt(form.thrustArea),
        uomType: form.uomType,
        targetValue: form.target,
        departmentId: form.department && form.department !== 'all' ? parseInt(form.department) : null,
      });
      
      const deptName = form.department && form.department !== 'all' ? departments.find(d => d.id === parseInt(form.department))?.name : 'All';
      addToast({ title: 'Shared Goal Pushed', description: `"${form.title}" pushed to ${deptName} department(s)`, variant: 'success' });
      setForm({ title: '', thrustArea: '', uomType: '', target: '', department: '', description: '' });
      loadData();
    } catch (err) {
      addToast({ title: 'Error', description: err.response?.data?.error || 'Failed to push shared goal', variant: 'error' });
    } finally {
      setPushing(false);
    }
  };

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin" /></div>;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader><CardTitle>Push Shared Goal</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2"><Label>Goal Title *</Label><Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Enter goal title" /></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Thrust Area *</Label><Select value={form.thrustArea} onValueChange={v => setForm({ ...form, thrustArea: v })}><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger><SelectContent>{thrustAreas.map(a => <SelectItem key={a.id} value={a.id.toString()}>{a.name}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-2"><Label>UoM Type *</Label><Select value={form.uomType} onValueChange={v => setForm({ ...form, uomType: v })}><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger><SelectContent>{UOM_TYPES.map(u => <SelectItem key={u} value={u}>{u.charAt(0).toUpperCase() + u.slice(1)}</SelectItem>)}</SelectContent></Select></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Target *</Label><Input value={form.target} onChange={e => setForm({ ...form, target: e.target.value })} placeholder="e.g., 95%" /></div>
            <div className="space-y-2"><Label>Department</Label><Select value={form.department} onValueChange={v => setForm({ ...form, department: v })}><SelectTrigger><SelectValue placeholder="All Departments" /></SelectTrigger><SelectContent><SelectItem value="all">All Departments</SelectItem>{departments.map(d => <SelectItem key={d.id} value={d.id.toString()}>{d.name}</SelectItem>)}</SelectContent></Select></div>
          </div>
          <div className="space-y-2"><Label>Description</Label><Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Describe this shared goal..." /></div>
          <Button onClick={handlePush} disabled={pushing || !form.title || !form.thrustArea || !form.uomType || !form.target}>{pushing ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Send className="h-4 w-4 mr-1" />}Push to Teams</Button>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Active Shared Goals</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {sharedGoals.length === 0 ? (
            <p className="text-sm text-[hsl(var(--color-muted-foreground))]">No active shared goals.</p>
          ) : sharedGoals.map((g, i) => (
            <div key={i} className="p-4 rounded-xl bg-gradient-to-br from-white/50 to-emerald-50/20 dark:from-slate-800/40 dark:to-slate-800/20 border border-teal-100/40 dark:border-slate-700/30 space-y-1">
              <div className="flex items-center gap-2"><Users className="h-4 w-4 text-teal-600 dark:text-indigo-400" /><p className="text-sm font-semibold">{g.title}</p></div>
              <p className="text-xs text-[hsl(var(--color-muted-foreground))]">Department: {g.department || 'All'} · Target: {g.target_value} · {g.uom_type}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
