import { isFirebaseConfigured } from './firebase'
import * as demoApi from './demoApi'
import * as firebaseApi from './firebaseApi'

export const dataMode = isFirebaseConfigured ? 'firebase' : 'demo'

/**
 * Satu kontrak data untuk dua implementasi:
 * - firebaseApi: Cloud Firestore (produksi)
 * - demoApi: localStorage (demo tanpa konfigurasi)
 */
export const api = isFirebaseConfigured ? firebaseApi : demoApi

export { isFirebaseConfigured }
