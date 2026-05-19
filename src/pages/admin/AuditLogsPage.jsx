import { useState, useEffect } from 'react';
import DataTable from '@/components/shared/DataTable';
import { Badge } from '@/components/ui/badge';
import { adminService } from '@/services/api';
import { formatDate } from '@/lib/utils';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/toast';

const actionColors = {
  'Goal Sheet Submitted': 'info',
  'Goal Sheet Approved': 'success',
  'Goal Sheet Returned': 'warning',
  'Shared Goal Pushed': 'default',
  'Goal Sheet Unlocked': 'secondary',
  'Check-in Updated': 'info',
  'Goal Achievement Updated': 'success',
  'Escalation Created': 'destructive',
  'Report Exported': 'secondary',
  'Goal Sheet Unlocked (Admin)': 'secondary',
};

const columns = [
  { accessorKey: 'action', header: 'Action', cell: (row) => <Badge variant={actionColors[row.action] || 'secondary'}>{row.action}</Badge> },
  { accessorKey: 'user', header: 'User', cell: (row) => `${row.first_name} ${row.last_name}` },
  { accessorKey: 'target', header: 'Target', cell: (row) => row.target_label || row.entity_type },
  { accessorKey: 'details', header: 'Details', cell: (row) => <span className="text-xs text-[hsl(var(--color-muted-foreground))] max-w-xs truncate block">{row.details}</span> },
  { accessorKey: 'timestamp', header: 'Timestamp', cell: (row) => formatDate(row.created_at) },
];

export default function AuditLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    try {
      const { data } = await adminService.getAuditLogs();
      setLogs(data);
    } catch (err) {
      console.error(err);
      addToast({ title: 'Error', description: 'Failed to load audit logs', variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div><h2 className="text-lg font-semibold">Audit Logs</h2><p className="text-sm text-[hsl(var(--color-muted-foreground))]">Complete activity trail</p></div>
      <DataTable columns={columns} data={logs} searchPlaceholder="Search logs..." pageSize={10} />
    </div>
  );
}
