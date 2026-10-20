import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase, supabaseConfigured } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(undefined) // undefined = loading
  const [isDemoUser, setIsDemoUser] = useState(false)

  useEffect(() => {
    // Check if admin session is stored in localStorage
    const savedAdmin = localStorage.getItem('nfc_admin_session')
    if (savedAdmin) {
      setSession({ user: { email: savedAdmin, id: 'admin' } })
      return
    }

    const savedDemo = localStorage.getItem('nfc_demo_session')
    if (savedDemo === 'true') {
      setIsDemoUser(true)
      setSession({ user: { email: 'muhammedshafik9544@gmail.com', id: 'admin' } })
      return
    }

    if (!supabaseConfigured) {
      setSession(null)
      return
    }

    try {
      supabase.auth.getSession()
        .then(({ data }) => {
          if (data?.session) {
            setSession(data.session)
          } else {
            setSession(null)
          }
        })
        .catch(() => setSession(null))

      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
        if (newSession) {
          setSession(newSession)
        } else if (!localStorage.getItem('nfc_admin_session')) {
          setSession(null)
        }
      })

      return () => subscription?.unsubscribe()
    } catch {
      setSession(null)
    }
  }, [])

  const signIn = (userOrSession) => {
    let email = 'muhammedshafik9544@gmail.com'
    if (typeof userOrSession === 'string') {
      email = userOrSession
    } else if (userOrSession?.user?.email) {
      email = userOrSession.user.email
    } else if (userOrSession?.email) {
      email = userOrSession.email
    }
    localStorage.setItem('nfc_admin_session', email)
    setSession({ user: { email, id: 'admin' }, ...(typeof userOrSession === 'object' ? userOrSession : {}) })
  }

  const signOut = () => {
    localStorage.removeItem('nfc_admin_session')
    localStorage.removeItem('nfc_demo_session')
    setIsDemoUser(false)
    if (supabaseConfigured) {
      try { supabase.auth.signOut() } catch {}
    }
    setSession(null)
  }

  return (
    <AuthContext.Provider value={{
      session,
      isDemoUser,
      loading: session === undefined,
      signIn,
      signOut,
      demoSignOut: signOut,
      supabaseConfigured
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
