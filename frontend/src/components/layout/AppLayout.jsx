/**
 * AppLayout — Persistent sidebar navigation + content area
 */
import { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import {
  LayoutDashboard, Users, LogOut, Menu, X,
  MessageSquare, ChevronRight
} from 'lucide-react'

const NAV_LINKS = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/clients', label: 'Clients', icon: Users },
]

export default function AppLayout() {
  const { user, logout } = useAuth()
  const isAdmin = !!user?.is_admin
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <img src="/asms_logo.png" alt="Logo" className="w-20 object-contain flex-shrink-0" />
          <div>
            <p className="text-sm font-bold text-slate-800 leading-tight">SMS Client Manager</p>
            <p className="text-[10px] text-slate-400 font-medium tracking-wide uppercase">Client CRM</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {NAV_LINKS.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group ${
                isActive
                  ? 'bg-brand-50 text-brand-700'
                  : 'text-slate-600 hover:bg-surface-100 hover:text-slate-800'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-brand-600' : 'text-slate-400 group-hover:text-slate-600'}`} />
                {label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User info + logout */}
      <div className="px-3 pb-4 border-t border-slate-100 pt-3">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg">
          <div className="w-7 h-7 rounded-full bg-brand-100 flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-bold text-brand-700">
              {user?.name?.[0]?.toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="text-sm font-medium text-slate-700 truncate">{user?.name}</p>
              {isAdmin && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-brand-100 text-brand-700 flex-shrink-0">
                  ADMIN
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 truncate">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-500 hover:bg-red-50 hover:text-red-600 transition-colors mt-0.5"
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </button>
      </div>
    </div>
  )

  return (
    <div className="flex h-screen bg-surface-50 overflow-hidden">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-56 flex-col bg-white border-r border-slate-100 flex-shrink-0">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-56 bg-white shadow-xl animate-slide-in-right">
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile topbar */}
        <header className="md:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-brand-600 rounded-lg flex items-center justify-center">
              <MessageSquare className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-bold text-slate-800 text-sm">SMS Manager</span>
          </div>
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-1.5 rounded-lg text-slate-500 hover:bg-surface-100"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
