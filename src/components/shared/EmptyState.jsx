import { cn } from '@/lib/utils';
import { FileX } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function EmptyState({ icon: Icon = FileX, title, description, action, actionLabel, className }) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-16 px-6 text-center', className)}>
      <div className="p-4 rounded-2xl bg-[hsl(var(--color-muted))] mb-4">
        <Icon className="h-10 w-10 text-[hsl(var(--color-muted-foreground))]" />
      </div>
      <h3 className="text-lg font-semibold mb-1">{title}</h3>
      <p className="text-sm text-[hsl(var(--color-muted-foreground))] max-w-sm mb-6">{description}</p>
      {action && (
        <Button onClick={action}>{actionLabel || 'Get Started'}</Button>
      )}
    </div>
  );
}
