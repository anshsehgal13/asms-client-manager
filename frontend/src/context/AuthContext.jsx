/**
 * AuthContext - Global authentication state
 * Provides user info, login/logout functions to the whole app
 */
import { createContext, useContext, useState, useEffect } from 'react'
import api from '../utils/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true) // checking stored token

  // On mount: restore session from localStorage
  useEffect(() => {
    const token = localStorage.getItem('token')
    const storedUser = localStorage.getItem('user')
    if (token && storedUser) {
      try {
        setUser(JSON.parse(storedUser))
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`
      } catch {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
      }
    }
    setLoading(false)
  }, [])

  const login = (token, userData) => {
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(userData))
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`
    setUser(userData)
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    delete api.defaults.headers.common['Authorization']
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, isAuthenticated: !!user, isAdmin: !!user?.is_admin }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
