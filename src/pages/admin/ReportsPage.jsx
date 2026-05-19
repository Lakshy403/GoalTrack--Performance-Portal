import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { FileDown, FileSpreadsheet, FileText, Download } from 'lucide-react';
import { adminService } from '@/services/api';
import { useState } from 'react';

const reports = [
  { title: 'Goal Completion Report', desc: 'All employee goal completion data across departments', icon: FileText },
  { title: 'Department Summary', desc: 'Aggregated department-level performance metrics', icon: FileSpreadsheet },
  { title: 'Escalation Report', desc: 'All open and resolved escalation records', icon: FileDown },
  { title: 'Check-in Report', desc: 'Quarterly check-in submissions and manager comments', icon: FileText },
  { title: 'Audit Trail Export', desc: 'Complete activity log for compliance', icon: FileSpreadsheet },
  { title: 'Manager Effectiveness', desc: 'Manager review turnaround and team performance', icon: FileDown },
];

export default function ReportsPage() {
  const { addToast } = useToast();
  const [downloading, setDownloading] = useState(null);

  const handleExport = async (title, format) => {
    setDownloading(title + format);
    addToast({ title: 'Export Started', description: `${title} (${format}) is being generated...`, variant: 'info' });
    
    try {
      const response = await adminService.exportReport(title, format);
      // Create blob link to download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${title.replace(/\s+/g, '_')}.${format.toLowerCase() === 'excel' ? 'xlsx' : 'csv'}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      addToast({ title: 'Export Complete', description: 'Your report has been downloaded.', variant: 'success' });
    } catch (err) {
      console.error(err);
      addToast({ title: 'Export Failed', description: 'Could not generate report at this time.', variant: 'error' });
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div className="space-y-6">
      <div><h2 className="text-lg font-semibold">Export Reports</h2><p className="text-sm text-[hsl(var(--color-muted-foreground))]">Download data in CSV or Excel format</p></div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {reports.map((r, i) => (
          <Card key={i}>
            <CardContent className="p-5 space-y-4">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-gradient-to-br from-teal-50 to-emerald-50/50 dark:from-slate-800 dark:to-slate-700"><r.icon className="h-5 w-5 text-teal-700 dark:text-indigo-400" /></div>
                <div><p className="font-semibold text-sm">{r.title}</p><p className="text-xs text-[hsl(var(--color-muted-foreground))] mt-0.5">{r.desc}</p></div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1" disabled={downloading === r.title + 'CSV'} onClick={() => handleExport(r.title, 'CSV')}><Download className="h-3.5 w-3.5 mr-1" />CSV</Button>
                <Button variant="outline" size="sm" className="flex-1" disabled={downloading === r.title + 'Excel'} onClick={() => handleExport(r.title, 'Excel')}><Download className="h-3.5 w-3.5 mr-1" />Excel</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
