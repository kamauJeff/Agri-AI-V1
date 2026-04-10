import { useToast } from './use-toast'
import { X, CheckCircle2, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

export function Toaster() {
  const { toasts } = useToast()

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 w-80">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={cn(
            'flex items-start gap-3 rounded-xl border bg-white dark:bg-card shadow-lg px-4 py-3 transition-all',
            t.open ? 'animate-fade-in opacity-100' : 'opacity-0',
            t.variant === 'destructive' && 'border-red-200 bg-red-50 dark:bg-red-900/20',
          )}
        >
          {t.variant === 'destructive'
            ? <AlertCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
            : <CheckCircle2 className="h-4 w-4 text-brand-600 shrink-0 mt-0.5" />}
          <div className="flex-1 min-w-0">
            {t.title && <p className="text-sm font-medium">{t.title}</p>}
            {t.description && <p className="text-xs text-muted-foreground mt-0.5">{t.description}</p>}
          </div>
        </div>
      ))}
    </div>
  )
}
