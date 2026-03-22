import type { ReactNode } from 'react'

import { cn } from '@/utils/cn'

export interface DashboardPreviewProps {
  title: string
  description: string
  /** Public URL (e.g. `/Finance.png`) — full product screenshot */
  imageSrc?: string
  imageAlt?: string
  /** Custom inner content when not using `imageSrc` */
  imagePlaceholder?: ReactNode
  className?: string
}

export function DashboardPreview({
  title,
  description,
  imageSrc,
  imageAlt,
  imagePlaceholder,
  className,
}: DashboardPreviewProps) {
  const useScreenshot = Boolean(imageSrc)

  return (
    <div className={cn('space-y-4', className)}>
      <div className="space-y-1">
        <h3 className="text-lg font-semibold tracking-tight text-foreground">
          {title}
        </h3>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {description}
        </p>
      </div>
      <div
        className={cn(
          'relative w-full overflow-hidden rounded-xl border border-border bg-muted/40 shadow-sm dark:bg-muted/20',
          useScreenshot ? 'aspect-16/10' : 'aspect-16/10 bg-linear-to-br from-muted/80 via-muted/40 to-muted/60 dark:from-muted/30 dark:via-muted/15 dark:to-muted/25'
        )}
        role="img"
        aria-label={imageAlt ?? `Preview: ${title}`}
      >
        {useScreenshot ? (
          <img
            src={imageSrc}
            alt={imageAlt ?? title}
            className="size-full object-cover object-top"
            loading="lazy"
            decoding="async"
          />
        ) : (
          <>
            <div className="absolute inset-x-0 top-0 flex h-9 items-center gap-1.5 border-b border-border/80 bg-card/80 px-3 backdrop-blur-sm">
              <span className="size-2.5 rounded-full bg-red-400/80" />
              <span className="size-2.5 rounded-full bg-amber-400/80" />
              <span className="size-2.5 rounded-full bg-emerald-400/80" />
            </div>
            <div className="flex h-full min-h-[200px] items-center justify-center pt-9">
              {imagePlaceholder ?? (
                <div className="flex flex-col items-center gap-2 px-6 text-center">
                  <div className="rounded-md border border-dashed border-border bg-background/60 px-4 py-2 text-xs font-medium text-muted-foreground">
                    Screenshot placeholder
                  </div>
                  <p className="max-w-xs text-xs text-muted-foreground">
                    Replace this area with your product screenshot
                  </p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
