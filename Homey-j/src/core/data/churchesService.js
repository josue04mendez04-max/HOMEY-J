import {
  addDoc,
  collection,
  doc,
  getDocs,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore'
import { db } from '../firebase'

const COLLECTION = 'churches_registry'

function fallbackStore() {
  const key = 'homeyj.churches'
  const stored = localStorage.getItem(key)
  const parsed = stored ? JSON.parse(stored) : []
  return {
    list: () => parsed,
    save: (list) => localStorage.setItem(key, JSON.stringify(list)),
  }
}

export async function listChurches() {
  try {
    const snapshot = await getDocs(collection(db, COLLECTION))
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))
  } catch (err) {
    console.warn('Usando fallback local para churches_registry:', err.message)
    const store = fallbackStore()
    return store.list()
  }
}

export async function createChurch({ name, pastor }) {
  const payload = {
    name,
    pastor,
    isLocked: false,
    createdAt: serverTimestamp(),
  }

  try {
    const ref = await addDoc(collection(db, COLLECTION), payload)
    return { id: ref.id, ...payload }
  } catch (err) {
    const store = fallbackStore()
    const current = store.list()
    const generatedId = crypto.randomUUID()
    const church = { ...payload, id: generatedId, createdAt: new Date().toISOString() }
    store.save([...current, church])
    return church
  }
}

export async function toggleLock({ id, isLocked }) {
  try {
    await updateDoc(doc(db, COLLECTION, id), { isLocked })
  } catch (err) {
    const store = fallbackStore()
    const current = store.list()
    const updated = current.map((c) => (c.id === id ? { ...c, isLocked } : c))
    store.save(updated)
  }
}
