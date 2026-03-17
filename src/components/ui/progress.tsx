import * as React from 'react'
import { cn } from '@/utils/cn'

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number
}

export function Progress({ value = 0, className, ...props }: ProgressProps) {
  const clamped = Math.min(Math.max(value, 0), 100)

  return (
    <div
      className={cn('relative h-2 w-full overflow-hidden rounded-full bg-muted', className)}
      {...props}
    >
      <div
        className="h-full w-full flex-1 rounded-full bg-primary transition-all"
        style={{ transform: `translateX(${clamped - 100}%)` }}
      />
    </div>
  )
}

