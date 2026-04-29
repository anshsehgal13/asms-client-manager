/**
 * SignupPage — New user registration
 */
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { MessageSquare, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { Spinner } from '../components/ui/index'
import { getErrorMessage } from '../utils/helpers'
import api from '../utils/api'
import toast from 'react-hot-toast'

export default function SignupPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})

  const set = (f) => (e) => {
    setForm((p) => ({ ...p, [f]: e.target.value }))
    if (errors[f]) setErrors((p) => ({ ...p, [f]: null }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = {}
    if (!form.name.trim()) errs.name = 'Name is required'
    if (!form.email) errs.email = 'Email is required'
    if (!form.password || form.password.length < 6) errs.password = 'Password must be at least 6 characters'
    if (Object.keys(errs).length) { setErrors(errs); return }

    setLoading(true)
    try {
      const { data } = await api.post('/auth/signup', form)
      login(data.access_token, data.user)
      toast.success(`Welcome, ${data.user.name}!`)
      navigate('/')
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-surface-50 to-brand-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <img src="/asms_logo.png" alt="Logo" className="w-60 object-contain mb-0" />
          <h1 className="text-xl font-bold text-slate-800">Create Account</h1>
          <p className="text-sm text-slate-500 mt-1">Start managing your clients</p>
        </div>

        <div className="card p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Full Name</label>
              <input
                className={`input ${errors.name ? 'border-red-300' : ''}`}
                placeholder="Your name"
                value={form.name}
                onChange={set('name')}
                disabled={loading}
              />
              {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
            </div>

            <div>
              <label className="label">Email</label>
              <input
                type="email"
                className={`input ${errors.email ? 'border-red-300' : ''}`}
                placeholder="you@example.com"
                value={form.email}
                onChange={set('email')}
                disabled={loading}
              />
              {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
            </div>

            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  className={`input pr-10 ${errors.password ? 'border-red-300' : ''}`}
                  placeholder="Min. 6 characters"
                  value={form.password}
                  onChange={set('password')}
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password}</p>}
            </div>

            <button type="submit" className="btn-primary w-full justify-center py-2.5" disabled={loading}>
              {loading ? <Spinner size="sm" /> : 'Create Account'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-slate-500 mt-4">
          Already have an account?{' '}
          <Link to="/login" className="text-brand-600 font-medium hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
