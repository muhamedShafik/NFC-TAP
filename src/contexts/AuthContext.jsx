import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase, supabaseConfigured } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(undefined) // undefined = loading
  const [isDemoUser, setIsDemoUser] = useState(false)

  useEffect(() => {
    // Check if demo session is stored in localStorage
    const savedDemo = localStorage.getItem('nfc_demo_session')
    if (savedDemo === 'true') {
      setIsDemoUser(true)
      setSession({ user: { email: 'admin@demo.com', id: 'demo-admin' } })
      return
    }

    if (!supabaseConfigured) {
      setSession(null)
      return
    }

    try {
      supabase.auth.getSession()
        .then(({ data }) => {
          setSession(data?.session || null)
        })
        .catch(() => setSession(null))

      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
        setSession(newSession)
      })

      return () => subscription?.unsubscribe()
    } catch {
      setSession(null)
    }
  }, [])

  const demoSignIn = () => {
    localStorage.setItem('nfc_demo_session', 'true')
    setIsDemoUser(true)
    setSession({ user: { email: 'admin@demo.com', id: 'demo-admin' } })
  }

  const demoSignOut = () => {
    localStorage.removeItem('nfc_demo_session')
    setIsDemoUser(false)
    setSession(null)
  }

  return (
    <AuthContext.Provider value={{
      session,
      isDemoUser,
      loading: session === undefined,
      demoSignIn,
      demoSignOut,
      supabaseConfigured
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
