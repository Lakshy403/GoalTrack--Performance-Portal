import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { StatusBadge, GoalProgress } from '@/components/shared/GoalComponents';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { getInitials } from '@/lib/utils';
import { MessageSquare, Send, Loader2 } from 'lucide-react';
import { managerService } from '@/services/api';
import { useToast } from '@/components/ui/toast';

export default function TeamCheckIns() {
  const [sheets, setSheets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState({});
  const [checkInComments, setCheckInComments] = useState({});
  const [sendingId, setSendingId] = useState(null);
  const { addToast } = useToast();

  useEffect(() => {
    loadSheets();
  }, []);

  const loadSheets = async () => {
    try {
      const { data } = await managerService.getTeamGoalSheets();
      setSheets(data);
    } catch (err) {
      console.error(err);
      addToast({ title: 'Error', description: 'Failed to load team goals', variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (sheetId) => {
    const message = messages[sheetId];
    if (!message?.trim()) return;

    try {
      setSendingId(sheetId);
      await managerService.sendMessage(sheetId, message);
      addToast({ title: 'Message Sent', description: 'Your message has been sent to the employee.', variant: 'success' });
      setMessages((prev) => ({ ...prev, [sheetId]: '' }));
    } catch (err) {
      console.error(err);
      addToast({ title: 'Error', description: 'Failed to send message', variant: 'error' });
    } finally {
      setSendingId(null);
    }
  };

  const handleCheckInComment = async (checkinId) => {
    const managerComment = checkInComments[checkinId];
    if (!managerComment?.trim()) return;

    try {
      setSendingId(`checkin-${checkinId}`);
      await managerService.addCheckInComment(checkinId, managerComment);
      addToast({ title: 'Check-in Comment Saved', description: 'The employee can now see your check-in note.', variant: 'success' });
      setCheckInComments((prev) => ({ ...prev, [checkinId]: '' }));
      loadSheets();
    } catch (err) {
      addToast({ title: 'Error', description: err.response?.data?.error || 'Failed to save check-in comment', variant: 'error' });
    } finally {
      setSendingId(null);
    }
  };

  if (loading) {
    return <div className="flex h-32 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  }

  const approvedSheets = sheets.filter(s => s.status === 'approved');

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Team Check-ins</h2>
        <p className="text-sm text-[hsl(var(--color-muted-foreground))]">Review quarterly progress updates</p>
      </div>
      
      {approvedSheets.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-[hsl(var(--color-muted-foreground))]">No approved goal sheets to review.</CardContent></Card>
      ) : (
        approvedSheets.map(sheet => (
          <Card key={sheet.id}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Avatar className="h-8 w-8"><AvatarFallback className="text-xs">{getInitials(sheet.employeeName)}</AvatarFallback></Avatar>
                <div>
                  <CardTitle className="text-base">{sheet.employeeName}</CardTitle>
                  <p className="text-xs text-[hsl(var(--color-muted-foreground))]">{sheet.department_name} · {sheet.period}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {sheet.goals?.slice(0, 4).map(g => {
                const latest = g.checkins?.[0];
                return (
                <div key={g.id} className="p-3 rounded-lg bg-gradient-to-r from-white/40 to-emerald-50/20 dark:from-slate-800/40 dark:to-slate-800/30 border border-teal-50/60 dark:border-slate-700/30 space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{g.title}</p>
                      <p className="text-xs text-[hsl(var(--color-muted-foreground))]">Planned target: {g.target_value} · Actual: {latest ? latest.achievement_value : 'Not updated'}</p>
                      <GoalProgress achievement={g.achievement || 0} compact />
                    </div>
                    <StatusBadge status={g.status || 'not_started'} />
                  </div>
                  {latest && (
                    <div className="rounded-md bg-[hsl(var(--color-muted))]/40 p-3 space-y-2">
                      <p className="text-xs text-[hsl(var(--color-muted-foreground))]">{latest.employee_comment}</p>
                      {latest.manager_comment && <p className="text-xs font-medium text-teal-700 dark:text-teal-300">Manager: {latest.manager_comment}</p>}
                      <div className="flex gap-2">
                        <Textarea
                          placeholder="Structured check-in comment..."
                          rows={2}
                          value={checkInComments[latest.id] || ''}
                          onChange={(e) => setCheckInComments({ ...checkInComments, [latest.id]: e.target.value })}
                        />
                        <Button size="sm" className="self-end" onClick={() => handleCheckInComment(latest.id)} disabled={sendingId === `checkin-${latest.id}` || !checkInComments[latest.id]?.trim()}>
                          {sendingId === `checkin-${latest.id}` ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              );})}
              {sheet.goals?.length > 3 && (
                <p className="text-xs text-[hsl(var(--color-muted-foreground))] text-center">+{sheet.goals.length - 3} more goals</p>
              )}
              
              <div className="flex gap-2 pt-2">
                <Textarea 
                  placeholder="Add manager comment..." 
                  className="flex-1" 
                  rows={2} 
                  value={messages[sheet.id] || ''}
                  onChange={(e) => setMessages({ ...messages, [sheet.id]: e.target.value })}
                />
                <Button 
                  size="sm" 
                  className="self-end" 
                  onClick={() => handleSendMessage(sheet.id)}
                  disabled={sendingId === sheet.id || !messages[sheet.id]?.trim()}
                >
                  {sendingId === sheet.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
