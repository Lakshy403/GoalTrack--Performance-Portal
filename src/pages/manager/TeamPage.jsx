import { useState, useEffect } from 'react';
import DataTable from '@/components/shared/DataTable';
import { StatusBadge } from '@/components/shared/GoalComponents';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { managerService } from '@/services/api';
import { getInitials } from '@/lib/utils';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/toast';

const columns = [
  { accessorKey: 'name', header: 'Employee', cell: (row) => (
    <div className="flex items-center gap-3">
      <Avatar className="h-8 w-8"><AvatarFallback className="text-xs">{getInitials(row.employeeName)}</AvatarFallback></Avatar>
      <div><p className="text-sm font-medium">{row.employeeName}</p><p className="text-xs text-[hsl(var(--color-muted-foreground))]">{row.employee_code}</p></div>
    </div>
  )},
  { accessorKey: 'department_name', header: 'Department' },
  { accessorKey: 'goalsCount', header: 'Goals', cell: (row) => row.goals?.length || 0 },
  { accessorKey: 'status', header: 'Status', cell: (row) => <StatusBadge status={row.status} /> },
];

export default function TeamPage() {
  const [teamSheets, setTeamSheets] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();

  useEffect(() => {
    loadTeamData();
  }, []);

  const loadTeamData = async () => {
    try {
      const { data } = await managerService.getTeamGoalSheets();
      setTeamSheets(data);
    } catch (err) {
      console.error(err);
      addToast({ title: 'Error', description: 'Failed to load team data', variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">My Team</h2>
        <p className="text-sm text-[hsl(var(--color-muted-foreground))]">{teamSheets.length} direct reports with active sheets</p>
      </div>
      <DataTable columns={columns} data={teamSheets} searchPlaceholder="Search team members..." />
    </div>
  );
}
