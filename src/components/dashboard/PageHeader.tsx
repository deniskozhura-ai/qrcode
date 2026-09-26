import React from 'react'

interface Props {
  title: string
  description?: string
  badge?: React.ReactNode
  children?: React.ReactNode
}

export default function PageHeader({ title, description, badge, children }: Props) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8 pb-4 border-b border-border/40">
      <div>
        <div className="flex items-center gap-2.5">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">{title}</h1>
          {badge}
        </div>
        {description && <p className="text-sm text-muted-foreground mt-1 leading-normal">{description}</p>}
      </div>

      {children && <div className="flex items-center gap-2.5 shrink-0">{children}</div>}
    </div>
  )
}
