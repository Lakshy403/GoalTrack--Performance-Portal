import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/shared/GoalComponents';
import { useToast } from '@/components/ui/toast';
import { adminService } from '@/services/api';
import { Unlock, Lock, Loader2 } from 'lucide-react';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import { formatDate } from '@/lib/utils';

export default function UnlockPage() {
  const [confirm, setConfirm] = useState(null);
  const [lockedSheets, setLockedSheets] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();

  useEffect(() => {
    loadLockedSheets();
  }, []);

  const loadLockedSheets = async () => {
    try {
      const { data } = await adminService.getLockedSheets();
      setLockedSheets(data);
    } catch (err) {
      console.error(err);
      addToast({ title: 'Error', description: 'Failed to load locked goal sheets', variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleUnlock = async () => {
    if (!confirm) return;
    try {
      await adminService.unlockGoalSheet(confirm.id);
      addToast({ title: 'Sheet Unlocked', description: `Successfully unlocked ${confirm.first_name}'s goal sheet.`, variant: 'success' });
      loadLockedSheets();
    } catch (err) {
      console.error(err);
      addToast({ title: 'Error', description: 'Failed to unlock goal sheet', variant: 'error' });
    } finally {
      setConfirm(null);
    }
  };

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div><h2 className="text-lg font-semibold">Unlock Goal Sheets</h2><p className="text-sm text-[hsl(var(--color-muted-foreground))]">Allow employees to modify approved goals</p></div>
      
      {lockedSheets.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-[hsl(var(--color-muted-foreground))]">No locked goal sheets found.</CardContent></Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {lockedSheets.map(sheet => (
            <Card key={sheet.id}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-semibold">{sheet.first_name} {sheet.last_name}</p>
                    <p className="text-xs text-[hsl(var(--color-muted-foreground))]">{sheet.department_name} · {sheet.quarter_label} {sheet.fy_label}</p>
                  </div>
                  <div className="flex items-center gap-2"><Lock className="h-4 w-4 text-[hsl(var(--color-muted-foreground))]" /><StatusBadge status={sheet.status} /></div>
                </div>
                <p className="text-xs text-[hsl(var(--color-muted-foreground))] mb-3">Approved {formatDate(sheet.reviewed_at)}</p>
                <Button variant="outline" size="sm" onClick={() => setConfirm(sheet)}><Unlock className="h-4 w-4 mr-1" />Unlock Sheet</Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <ConfirmDialog 
        open={!!confirm} 
        onOpenChange={(open) => !open && setConfirm(null)} 
        title="Unlock Goal Sheet?" 
        description={`This will allow ${confirm?.first_name} ${confirm?.last_name} to edit their approved goals.`} 
        confirmLabel="Unlock" 
        onConfirm={handleUnlock} 
        variant="default" 
      />
    </div>
  );
}
