import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn, statusColors, uomColors } from '@/lib/utils';
import { Lock, Users } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

export function StatusBadge({ status }) {
  return (
    <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold', statusColors[status] || statusColors['Draft'])}>
      {status}
    </span>
  );
}

export function UomBadge({ type }) {
  return (
    <span className={cn('inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium', uomColors[type] || 'bg-gray-100 text-gray-600')}>
      {type}
    </span>
  );
}

export function GoalProgress({ achievement, target, compact = false }) {
  const pct = Math.min((achievement / 100) * 100, 100);
  return (
    <div className={cn('space-y-1', compact ? 'w-24' : 'w-full')}>
      <Progress value={pct} className={compact ? 'h-1.5' : 'h-2'} />
      {!compact && (
        <p className="text-xs text-[hsl(var(--color-muted-foreground))]">{achievement}% completed</p>
      )}
    </div>
  );
}

export function GoalCardMini({ goal, locked = false }) {
  return (
    <div className={cn(
      'p-4 rounded-xl border border-[hsl(var(--color-border))] bg-[hsl(var(--color-card))] space-y-3 transition-all hover:shadow-md',
      locked && 'opacity-75'
    )}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="text-sm font-semibold truncate">{goal.title}</h4>
            {goal.isShared && (
              <span className="inline-flex items-center gap-1 text-[10px] text-teal-700 dark:text-indigo-400">
                <Users className="h-3 w-3" />
                Shared
              </span>
            )}
            {locked && <Lock className="h-3.5 w-3.5 text-[hsl(var(--color-muted-foreground))]" />}
          </div>
          <p className="text-xs text-[hsl(var(--color-muted-foreground))] mb-2">{goal.thrustArea}</p>
        </div>
        <StatusBadge status={goal.status} />
      </div>
      <div className="flex items-center gap-3">
        <UomBadge type={goal.uomType} />
        <span className="text-xs text-[hsl(var(--color-muted-foreground))]">Target: {goal.target}</span>
        <span className="text-xs font-medium ml-auto">{goal.weightage}%</span>
      </div>
      <GoalProgress achievement={goal.achievement} />
    </div>
  );
}

export function WeightageWidget({ goals, maxGoals = 8, minWeightage = 10 }) {
  const total = goals.reduce((sum, g) => sum + (parseFloat(g.weightage) || 0), 0);
  const isValid = total === 100;
  const tooMany = goals.length > maxGoals;
  const underMin = goals.some((g) => parseFloat(g.weightage) > 0 && parseFloat(g.weightage) < minWeightage);

  // Colors for the pie chart
  const COLORS = ['#0d9488', '#8b5cf6', '#10b981', '#0ea5e9', '#14b8a6', '#f59e0b', '#ec4899', '#f43f5e'];

  // Map goals to data points for Recharts
  const data = goals.map((g, idx) => ({
    name: g.title || `Goal ${idx + 1}`,
    value: parseFloat(g.weightage) || 0,
    fill: COLORS[idx % COLORS.length]
  }));

  if (total < 100) {
    data.push({ name: 'Remaining', value: 100 - total, fill: 'hsl(var(--color-muted))' });
  }

  return (
    <div className={cn(
      'rounded-2xl border p-5 space-y-5 transition-all shadow-sm',
      isValid && !tooMany && !underMin
        ? 'border-emerald-200 bg-emerald-50/30 dark:border-emerald-800/50 dark:bg-emerald-950/20'
        : 'border-stone-200 bg-gradient-to-br from-stone-50 to-teal-50/50 dark:border-slate-800 dark:bg-slate-900/50'
    )}>
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Weightage Distribution</h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Total must equal 100%</p>
        </div>
        <span className={cn(
          'text-2xl font-black tabular-nums tracking-tight',
          isValid ? 'text-emerald-600 dark:text-emerald-400' : 
            total > 100 ? 'text-red-500' : 'text-slate-700 dark:text-slate-300'
        )}>
          {total}%
        </span>
      </div>
      
      <div className="h-48 relative flex items-center justify-center">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              innerRadius={55}
              outerRadius={75}
              paddingAngle={2}
              dataKey="value"
              stroke="none"
              animationBegin={0}
              animationDuration={800}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} className="transition-all duration-300 hover:opacity-80 outline-none" />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)', background: 'hsl(var(--color-card))', color: 'hsl(var(--color-foreground))' }}
              itemStyle={{ fontSize: '13px', fontWeight: 600 }}
              formatter={(value) => [`${value}%`, 'Weightage']}
            />
          </PieChart>
        </ResponsiveContainer>
        
        {/* Center overlay label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Total</span>
          <span className={cn("text-xl font-bold", total === 100 ? "text-emerald-500" : "text-slate-900 dark:text-slate-100")}>{total}%</span>
        </div>
      </div>

      <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
        <ValidationRule passed={isValid} label={`Total weightage = 100%`} />
        <ValidationRule passed={!tooMany} label={`Maximum ${maxGoals} goals (currently ${goals.length})`} />
        <ValidationRule passed={!underMin} label={`Minimum ${minWeightage}% per goal`} />
        <ValidationRule passed={goals.length > 0} label="At least 1 goal added" />
      </div>
    </div>
  );
}

function ValidationRule({ passed, label }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <div className={cn(
        'w-4 h-4 rounded-full flex items-center justify-center text-white text-[10px] font-bold',
        passed ? 'bg-emerald-500' : 'bg-amber-500'
      )}>
        {passed ? '✓' : '!'}
      </div>
      <span className={cn(passed ? 'text-emerald-700 dark:text-emerald-400' : 'text-amber-700 dark:text-amber-400')}>
        {label}
      </span>
    </div>
  );
}
