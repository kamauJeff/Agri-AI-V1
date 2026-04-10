import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Leaf, Eye, EyeOff, Loader2, CheckCircle2, Circle } from 'lucide-react'
import { authApi } from '@/api/endpoints'
import { useAuthStore } from '@/store/authStore'
import { cn } from '@/lib/utils'

const PW_RULES = [
  { label: 'At least 8 characters', test: (p: string) => p.length >= 8 },
  { label: 'One uppercase letter', test: (p: string) => /[A-Z]/.test(p) },
  { label: 'One number', test: (p: string) => /[0-9]/.test(p) },
]

export default function RegisterPage() {
  const [form, setForm] = useState({ name: '', phone: '', email: '', password: '', role: 'FARMER' })
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { setAuth } = useAuthStore()
  const navigate = useNavigate()

  const pwStrength = PW_RULES.filter((r) => r.test(form.password)).length

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (pwStrength < 3) return setError('Please meet all password requirements.')
    setLoading(true)
    try {
      const res = await authApi.register(form)
      const { user, tokens } = res.data.data
      setAuth(user, tokens.accessToken)
      navigate('/dashboard')
    } catch (err: any) {
      const detail = err.response?.data?.details
      if (detail) {
        const msgs = Object.values(detail).flat().join('. ')
        setError(msgs)
      } else {
        setError(err.response?.data?.error ?? 'Registration failed.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-earth-50 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600">
            <Leaf className="h-5 w-5 text-white" />
          </div>
          <span className="font-display text-xl font-semibold text-brand-800">AgriAI Africa</span>
        </div>

        <div className="rounded-2xl border bg-white p-8 shadow-sm">
          <h1 className="font-display text-2xl font-semibold mb-1">Create your account</h1>
          <p className="text-sm text-muted-foreground mb-6">Start managing your farm smarter</p>

          {error && (
            <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="block text-sm font-medium mb-1.5">Full name</label>
                <input
                  type="text"
                  placeholder="John Kamau"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                  className="w-full rounded-lg border px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium mb-1.5">Phone number</label>
                <input
                  type="tel"
                  placeholder="+254712345678"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  required
                  className="w-full rounded-lg border px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium mb-1.5">Email <span className="text-muted-foreground">(optional)</span></label>
                <input
                  type="email"
                  placeholder="john@example.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full rounded-lg border px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium mb-1.5">I am a</label>
                <select
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                  className="w-full rounded-lg border px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-500 bg-white"
                >
                  <option value="FARMER">Farmer</option>
                  <option value="AGENT">Extension Agent</option>
                </select>
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium mb-1.5">Password</label>
                <div className="relative">
                  <input
                    type={showPw ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    required
                    className="w-full rounded-lg border px-3.5 py-2.5 pr-10 text-sm outline-none focus:ring-2 focus:ring-brand-500"
                  />
                  <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-2.5 text-muted-foreground">
                    {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {form.password && (
                  <ul className="mt-2 space-y-1">
                    {PW_RULES.map((r) => (
                      <li key={r.label} className={cn('flex items-center gap-1.5 text-xs', r.test(form.password) ? 'text-brand-700' : 'text-muted-foreground')}>
                        {r.test(form.password) ? <CheckCircle2 className="h-3 w-3" /> : <Circle className="h-3 w-3" />}
                        {r.label}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={cn(
                'flex w-full items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition',
                'hover:bg-brand-700 disabled:opacity-60 disabled:cursor-not-allowed',
              )}
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {loading ? 'Creating account…' : 'Create account'}
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-brand-600 hover:text-brand-700">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
