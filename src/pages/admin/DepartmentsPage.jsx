import { useState, useEffect } from 'react';
import DataTable from '@/components/shared/DataTable';
import { adminService } from '@/services/api';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/toast';

const columns = [
  { accessorKey: 'name', header: 'Department' },
  { accessorKey: 'employee_count', header: 'Total Employees' },
  { accessorKey: 'goalsSubmitted', header: 'Goals Submitted' },
  { accessorKey: 'goalsApproved', header: 'Goals Approved' },
  { accessorKey: 'avgCompletion', header: 'Avg Completion (%)' },
];

export default function DepartmentsPage() {
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const { data } = await adminService.getDepartmentStats();
      setStats(data);
    } catch (err) {
      console.error(err);
      addToast({ title: 'Error', description: 'Failed to load department stats', variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div><h2 className="text-lg font-semibold">Department Overview</h2></div>
      <DataTable columns={columns} data={stats} searchPlaceholder="Search departments..." />
    </div>
  );
}
