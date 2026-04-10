// Simple toast helper that integrates with shadcn Toast
import { useToast as useRadixToast } from '@/components/ui/use-toast'
export { useToast } from '@/components/ui/use-toast'

// Static toast for use outside components (e.g. in react-query callbacks)
let _toast: ReturnType<typeof useRadixToast>['toast'] | null = null

export function registerToast(fn: typeof _toast) { _toast = fn }

export function toast(opts: { title: string; description?: string; variant?: 'default' | 'destructive' }) {
  _toast?.(opts)
}
