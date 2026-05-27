import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)
const STORAGE_KEY = 'mathsolve_session'

// Secure PBKDF2 hashing using the browser's built-in Web Crypto API
async function hashPassword(password, salt) {
  const encoder = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey(
    'raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits']
  )
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: encoder.encode(salt), iterations: 100000, hash: 'SHA-256' },
    keyMaterial, 256
  )
  return Array.from(new Uint8Array(bits))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)       // { user_id, email, username }
  const [profile, setProfile] = useState(null)  // full profile row
  const [loading, setLoading] = useState(true)

  // Restore session from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      try {
        const session = JSON.parse(saved)
        setUser(session)
        fetchProfile(session.user_id)
      } catch {
        localStorage.removeItem(STORAGE_KEY)
        setLoading(false)
      }
    } else {
      setLoading(false)
    }
  }, [])

  async function fetchProfile(userId) {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single()
    setProfile(data)
    setLoading(false)
  }

  async function signUp(email, password, username) {
    // Check if email already exists
    const { data: existing } = await supabase
      .from('profiles')
      .select('user_id')
      .eq('email', email)
      .maybeSingle()

    if (existing) throw new Error('An account with this email already exists. Please sign in instead.')

    const salt = crypto.randomUUID()
    const passwordHash = await hashPassword(password, salt)
    const userId = crypto.randomUUID()

    const { error } = await supabase.from('profiles').insert({
      user_id: userId,
      email,
      username,
      password_hash: passwordHash,
      salt,
      total_score: 0,
      elo_rating: 1000
    })

    if (error) throw new Error(error.message)

    const session = { user_id: userId, email, username }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
    setUser(session)
    await fetchProfile(userId)
    return session
  }

  async function signIn(email, password) {
    const { data: profileData, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', email)
      .maybeSingle()

    if (error) throw new Error(error.message)
    if (!profileData) throw new Error('No account found with this email address.')
    if (!profileData.password_hash) throw new Error('This account was created with a different method. Please contact support.')

    const passwordHash = await hashPassword(password, profileData.salt)
    if (passwordHash !== profileData.password_hash) {
      throw new Error('Incorrect password. Please try again.')
    }

    const session = { user_id: profileData.user_id, email, username: profileData.username }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
    setUser(session)
    setProfile(profileData)
    return session
  }

  async function signOut() {
    localStorage.removeItem(STORAGE_KEY)
    setUser(null)
    setProfile(null)
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, signUp, signIn, signOut, fetchProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
