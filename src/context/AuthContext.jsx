import { createContext, useContext, useEffect, useState } from 'react'
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from 'firebase/auth'
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore'
import { auth, db, isFirebaseConfigured } from '../lib/firebase'
import { DEMO_CREDENTIALS } from '../lib/constants'

const AuthContext = createContext(null)
const SESSION_KEY = 'ecash:session'

function prettyName(email) {
  const base = email.split('@')[0].replace(/[._-]+/g, ' ').trim()
  return base.replace(/\b\w/g, (char) => char.toUpperCase()) || 'Kasir Demo'
}

function validateEmail(email) {
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isFirebaseConfigured) {
      try {
        const raw = localStorage.getItem(SESSION_KEY)
        if (raw) setUser(JSON.parse(raw))
      } catch {
        /* ignore */
      }
      setLoading(false)
      return undefined
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setUser(null)
        setLoading(false)
        return
      }
      let profile = null
      try {
        const ref = doc(db, 'users', firebaseUser.uid)
        const snapshot = await getDoc(ref)
        if (snapshot.exists()) {
          profile = snapshot.data()
        } else {
          const fallback = {
            name: firebaseUser.displayName || prettyName(firebaseUser.email || 'kasir'),
            email: firebaseUser.email || '',
            role: 'owner',
          }
          await setDoc(ref, { ...fallback, createdAt: serverTimestamp() })
          profile = fallback
        }
      } catch (error) {
        console.error('[e-cash] gagal memuat profil', error)
      }
      setUser({
        uid: firebaseUser.uid,
        email: firebaseUser.email || '',
        name: profile?.name || firebaseUser.displayName || 'Pengguna',
        role: profile?.role || 'owner',
      })
      setLoading(false)
    })

    return unsubscribe
  }, [])

  async function login(email, password) {
    const cleanEmail = String(email || '').trim().toLowerCase()
    if (!cleanEmail || !password) throw new Error('Email dan password wajib diisi.')
    if (!validateEmail(cleanEmail)) throw new Error('Format email tidak valid.')
    if (String(password).length < 6) throw new Error('Password minimal 6 karakter.')

    if (isFirebaseConfigured) {
      await signInWithEmailAndPassword(auth, cleanEmail, password)
      return
    }

    const demoUser = {
      uid: 'demo-owner',
      email: cleanEmail,
      name: cleanEmail === DEMO_CREDENTIALS.email ? 'Rina Demo' : prettyName(cleanEmail),
      role: 'owner',
    }
    localStorage.setItem(SESSION_KEY, JSON.stringify(demoUser))
    setUser(demoUser)
  }

  async function register(name, email, password) {
    const cleanEmail = String(email || '').trim().toLowerCase()
    const cleanName = String(name || '').trim()
    if (!cleanName) throw new Error('Nama wajib diisi.')
    if (!validateEmail(cleanEmail)) throw new Error('Format email tidak valid.')
    if (String(password).length < 6) throw new Error('Password minimal 6 karakter.')

    if (isFirebaseConfigured) {
      const credential = await createUserWithEmailAndPassword(auth, cleanEmail, password)
      await updateProfile(credential.user, { displayName: cleanName })
      await setDoc(doc(db, 'users', credential.user.uid), {
        name: cleanName,
        email: cleanEmail,
        role: 'owner',
        createdAt: serverTimestamp(),
      })
      return
    }

    const demoUser = { uid: 'demo-owner', email: cleanEmail, name: cleanName, role: 'owner' }
    localStorage.setItem(SESSION_KEY, JSON.stringify(demoUser))
    setUser(demoUser)
  }

  async function logout() {
    if (isFirebaseConfigured) {
      await signOut(auth)
    } else {
      localStorage.removeItem(SESSION_KEY)
      setUser(null)
    }
  }

  return (
    <AuthContext.Provider
      value={{ user, loading, login, register, logout, isDemo: !isFirebaseConfigured }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth harus dipakai di dalam AuthProvider')
  return context
}
