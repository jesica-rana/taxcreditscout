import { useEffect, useState, useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

export function useAuth() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me')
      if (!res.ok) {
        setUser(null)
        return null
      }
      const data = await res.json()
      setUser(data?.user ?? null)
      return data?.user ?? null
    } catch {
      setUser(null)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  return { user, loading, refresh }
}

// Bounce unauthenticated visitors to /login?next=<current path>
export function useRequireAuth() {
  const auth = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    if (!auth.loading && !auth.user) {
      const next = encodeURIComponent(`${location.pathname}${location.search}`)
      navigate(`/login?next=${next}`, { replace: true })
    }
  }, [auth.loading, auth.user, navigate, location])

  return auth
}

export async function signOut() {
  try {
    await fetch('/api/auth/logout', { method: 'POST' })
  } catch {
    // ignore — local state will reset on next page load anyway
  }
}
