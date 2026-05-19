import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, CartesianGrid, Legend } from 'recharts';
import { managerService } from '@/services/api';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/toast';

const COLORS = ['#0d9488', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function ManagerAnalytics() {
  const [sheets, setSheets] = useState([]);
  const [loading, setLoading] = useState(true);
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
      addToast({ title: 'Error', description: 'Failed to load team analytics', variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin" /></div>;

  // Calculate Status Distribution
  const statusCounts = sheets.reduce((acc, sheet) => {
    const status = sheet.status === 'submitted' ? 'Submitted' : 
                   sheet.status === 'approved' ? 'Approved' : 
                   sheet.status === 'rework' ? 'Rework' : 'Draft';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});

  const statusDist = Object.keys(statusCounts).map(key => ({
    name: key, value: statusCounts[key],
  }));

  // Calculate Individual Performance
  // Only for approved sheets, or all sheets. Let's do all.
  const teamData = sheets.map(s => ({
    name: s.employee_first,
    completion: s.overall_score || 0,
    goals: s.goals?.length || 0
  })).sort((a, b) => b.completion - a.completion);

  const trendData = [
    { month: 'Jan', progress: 15 }, { month: 'Feb', progress: 35 }, { month: 'Mar', progress: 52 },
  ];

  return (
    <div className="space-y-6">
      <div><h2 className="text-lg font-semibold">Team Analytics</h2></div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>Goal Sheet Status</CardTitle></CardHeader>
          <CardContent>
            {statusDist.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart><Pie data={statusDist} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="value">
                    {statusDist.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie><Tooltip /></PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap gap-3 justify-center">
                  {statusDist.map((e, i) => (
                    <div key={e.name} className="flex items-center gap-1.5 text-xs">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i] }} />{e.name} ({e.value})
                    </div>
                  ))}
                </div>
              </>
            ) : (
               <div className="h-[250px] flex items-center justify-center text-[hsl(var(--color-muted-foreground))]">No data available</div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader><CardTitle>Team Progress Trend</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ borderRadius: '12px', fontSize: '12px' }} />
                <Line type="monotone" dataKey="progress" stroke="#0d9488" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Individual Performance</CardTitle></CardHeader>
          <CardContent>
            {teamData.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={teamData} barSize={24}>
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ borderRadius: '12px', fontSize: '12px' }} />
                  <Legend />
                  <Bar dataKey="completion" fill="#0d9488" radius={[4, 4, 0, 0]} name="Completion %" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[260px] flex items-center justify-center text-[hsl(var(--color-muted-foreground))]">No data available</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
