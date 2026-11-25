import { getApps, initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
}

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId,
)

let app = null
let auth = null
let db = null
let analytics = null

if (isFirebaseConfigured) {
  app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig)
  auth = getAuth(app)
  db = getFirestore(app)

  // Analytics dimuat terpisah agar tidak memperbesar bundle utama.
  if (firebaseConfig.measurementId && import.meta.env.PROD && typeof window !== 'undefined') {
    import('firebase/analytics')
      .then(({ getAnalytics, isSupported }) => isSupported().then((ok) => (ok ? getAnalytics(app) : null)))
      .then((instance) => {
        analytics = instance
      })
      .catch(() => {
        /* Analytics tidak tersedia di lingkungan ini */
      })
  }
}

export { app, auth, db, analytics }
