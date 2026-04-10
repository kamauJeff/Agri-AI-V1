import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Leaf, Eye, EyeOff, Loader2 } from 'lucide-react'
import { authApi } from '@/api/endpoints'
import { useAuthStore } from '@/store/authStore'
import { cn } from '@/lib/utils'

export default function LoginPage() {
  const [form, setForm] = useState({ phone: '', password: '' })
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { setAuth } = useAuthStore()
  const navigate = useNavigate()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await authApi.login(form)
      const { user, tokens } = res.data.data
      setAuth(user, tokens.accessToken)
      navigate('/dashboard')
    } catch (err: any) {
      setError(err.response?.data?.error ?? 'Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen">
      {/* Left panel — decorative */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between bg-brand-900 p-12 text-white">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
            <Leaf className="h-5 w-5 text-white" />
          </div>
          <span className="font-display text-2xl font-semibold">AgriAI Africa</span>
        </div>
        <div>
          <blockquote className="font-display text-4xl font-light leading-tight text-white/90">
            "Empowering smallholder farmers with data-driven insights."
          </blockquote>
          <p className="mt-6 text-brand-300 text-sm">
            Weather forecasts · Market prices · Credit scoring · Loan access
          </p>
        </div>
        <div className="grid grid-cols-3 gap-4 text-center">
          {[['50K+', 'Farmers'], ['47', 'Counties'], ['KES 2M', 'Max loan']].map(([n, l]) => (
            <div key={l} className="rounded-xl bg-white/10 p-4">
              <div className="font-display text-2xl font-semibold">{n}</div>
              <div className="text-brand-300 text-xs mt-1">{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex flex-1 items-center justify-center bg-earth-50 px-8 py-12">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600">
              <Leaf className="h-5 w-5 text-white" />
            </div>
            <span className="font-display text-xl font-semibold text-brand-800">AgriAI Africa</span>
          </div>

          <h1 className="font-display text-3xl font-semibold text-foreground mb-1">Welcome back</h1>
          <p className="text-muted-foreground text-sm mb-8">Sign in to your farm dashboard</p>

          {error && (
            <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Phone number</label>
              <input
                type="tel"
                placeholder="+254712345678"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                required
                className="w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-500 transition"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                  className="w-full rounded-lg border bg-white px-3.5 py-2.5 pr-10 text-sm outline-none focus:ring-2 focus:ring-brand-500 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                >
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={cn(
                'flex w-full items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition',
                'hover:bg-brand-700 focus:ring-2 focus:ring-brand-500 focus:ring-offset-2',
                'disabled:opacity-60 disabled:cursor-not-allowed',
              )}
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Don't have an account?{' '}
            <Link to="/register" className="font-medium text-brand-600 hover:text-brand-700">
              Register
            </Link>
          </p>

          {/* Demo credentials hint */}
          <div className="mt-8 rounded-lg border border-dashed p-4 text-xs text-muted-foreground">
            <p className="font-medium mb-1">Demo account</p>
            <p>Phone: +254712345678</p>
            <p>Password: Farmer@1234</p>
          </div>
        </div>
      </div>
    </div>
  )
}
