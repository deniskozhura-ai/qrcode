import { LucideIcon } from 'lucide-react'

interface Props {
  label: string
  value: string | number
  sub?: string
  icon?: LucideIcon
  badge?: string
  badgeVariant?: 'neutral' | 'success' | 'warning' | 'info'
}

export default function StatCard({ label, value, sub, icon: Icon, badge, badgeVariant = 'neutral' }: Props) {
  const badgeColors = {
    neutral: 'bg-muted text-muted-foreground border-border',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200/60 dark:bg-emerald-950/40 dark:text-emerald-400',
    warning: 'bg-amber-50 text-amber-700 border-amber-200/60 dark:bg-amber-950/40 dark:text-amber-400',
    info: 'bg-blue-50 text-blue-700 border-blue-200/60 dark:bg-blue-950/40 dark:text-blue-400',
  }

  return (
    <div className="bg-card rounded-2xl border border-border/80 p-5 shadow-2xs card-hover flex flex-col justify-between">
      <div className="flex items-center justify-between gap-2 mb-3">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</span>
        {Icon && (
          <div className="w-8 h-8 rounded-lg bg-muted/60 border border-border/60 flex items-center justify-center text-muted-foreground shrink-0 shadow-2xs">
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>

      <div>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold tracking-tight text-foreground">{value}</span>
          {badge && (
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${badgeColors[badgeVariant]}`}>
              {badge}
            </span>
          )}
        </div>
        {sub && <p className="text-xs text-muted-foreground mt-1.5 font-normal">{sub}</p>}
      </div>
    </div>
  )
}
