import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  variant?: 'default' | 'success' | 'warning' | 'danger';
}

const variantStyles = {
  default: 'border-slate-700 text-blue-400',
  success: 'border-green-800/60 text-green-400',
  warning: 'border-amber-800/60 text-amber-400',
  danger:  'border-red-800/60 text-red-400',
};

export function StatsCard({
  label,
  value,
  icon: Icon,
  trend,
  variant = 'default',
}: StatsCardProps) {
  return (
    <div className={cn(
      'rounded-xl border bg-slate-800 p-5 flex items-start gap-4',
      variantStyles[variant],
    )}>
      <div className={cn('rounded-lg p-2 bg-slate-700/50', variantStyles[variant])}>
        <Icon className="w-5 h-5" />
      </div>

      <div className="min-w-0">
        <p className="text-xs text-slate-400 uppercase tracking-wide">{label}</p>
        <p className="mt-1 text-2xl font-bold text-white">{value}</p>
        {trend && <p className="mt-1 text-xs text-slate-500">{trend}</p>}
      </div>
    </div>
  );
}
