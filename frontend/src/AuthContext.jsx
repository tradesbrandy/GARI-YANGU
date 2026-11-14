import { createContext, useContext, useState, useCallback } from 'react'
import * as api from './api.js'

// The signed-in user is cached in localStorage for instant page loads; the JWT itself is
// kept by api.js. refresh() re-validates both against the backend.
const AuthContext = createContext(null)
const KEY = 'gariyangu_user'

const readStored = () => {
  try { return JSON.parse(localStorage.getItem(KEY)) } catch { return null }
}
const store = (u) => {
  try { u ? localStorage.setItem(KEY, JSON.stringify(u)) : localStorage.removeItem(KEY) } catch { /* ignore */ }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readStored)

  const set = (u) => { setUser(u); store(u); return u }

  const login = async (email, password) => set(await api.login(email, password))
  const register = async (data) => set(await api.register(data))
  const logout = () => { api.logout(); set(null) }
  // Re-read the user (e.g. dealer status changed after admin review).
  const refresh = useCallback(async () => {
    if (!readStored()) return null
    try { return set(await api.getUser()) } catch { return set(null) }
  }, [])

  return <AuthContext.Provider value={{ user, login, register, logout, refresh }}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)

export const homeFor = (user) =>
  user?.role === 'dealer' ? '/dealer' : user?.role === 'admin' ? '/admin/dealers' : '/my-offers'
