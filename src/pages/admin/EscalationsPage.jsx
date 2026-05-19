import { useState, useEffect } from 'react';
import DataTable from '@/components/shared/DataTable';
import { StatusBadge } from '@/components/shared/GoalComponents';
import { Badge } from '@/components/ui/badge';
import { adminService } from '@/services/api';
import { formatDate } from '@/lib/utils';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/toast';

const priorityColors = { High: 'destructive', Medium: 'warning', Low: 'secondary' };
const columns = [
  { accessorKey: 'employee', header: 'Employee', cell: (row) => `${row.emp_first} ${row.emp_last}` },
  { accessorKey: 'manager', header: 'Manager', cell: (row) => row.mgr_first ? `${row.mgr_first} ${row.mgr_last}` : 'N/A' },
  { accessorKey: 'days_pending', header: 'Days Overdue', cell: (row) => <span className="font-semibold text-red-500">{row.days_pending}</span> },
  { accessorKey: 'priority', header: 'Priority', cell: (row) => <Badge variant={row.days_pending > 14 ? 'destructive' : 'warning'}>{row.days_pending > 14 ? 'High' : 'Medium'}</Badge> },
  { accessorKey: 'status', header: 'Status', cell: (row) => <StatusBadge status={'At Risk'} /> },
  { accessorKey: 'submitted_at', header: 'Submitted At', cell: (row) => formatDate(row.submitted_at) },
];

export default function EscalationsPage() {
  const [escalations, setEscalations] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();

  useEffect(() => {
    loadEscalations();
  }, []);

  const loadEscalations = async () => {
    try {
      const { data } = await adminService.getEscalations();
      setEscalations(data);
    } catch (err) {
      console.error(err);
      addToast({ title: 'Error', description: 'Failed to load escalations', variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div><h2 className="text-lg font-semibold">Escalation Tracking</h2><p className="text-sm text-[hsl(var(--color-muted-foreground))]">{escalations.length} open escalations</p></div>
      <DataTable columns={columns} data={escalations} searchPlaceholder="Search escalations..." />
    </div>
  );
}
