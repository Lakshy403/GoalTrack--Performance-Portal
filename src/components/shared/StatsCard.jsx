import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export default function StatsCard({ title, value, subtitle, icon: Icon, trend, trendValue, className, iconClassName }) {
  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
            <p className="text-3xl font-bold tracking-tight text-slate-800 dark:text-slate-100">{value}</p>
            {subtitle && (
              <p className="text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>
            )}
            {trend && (
              <div className={cn(
                'inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full',
                trend === 'up' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400' : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400'
              )}>
                <span>{trend === 'up' ? '↑' : '↓'}</span>
                <span>{trendValue}</span>
              </div>
            )}
          </div>
          {Icon && (
            <div className={cn(
              'p-3 rounded-xl bg-gradient-to-br',
              iconClassName || 'from-teal-500/10 to-emerald-500/10 dark:from-blue-500/10 dark:to-indigo-500/10'
            )}>
              <Icon className="h-6 w-6 text-teal-700 dark:text-blue-400" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
