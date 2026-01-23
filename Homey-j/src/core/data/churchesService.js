import {
  addDoc,
  collection,
  doc,
  getDocs,
  serverTimestamp,
  updateDoc,
  deleteDoc,
  getFirestore,
  writeBatch,
} from 'firebase/firestore'
export async function deleteChurch(id) {
  // Borrar iglesia en churches_registry
  await deleteDoc(doc(db, COLLECTION, id))
  // Borrar toda la data aislada en /churches_data/{id}
  const churchDataRef = collection(db, `churches_data/${id}/members`)
  const membersSnap = await getDocs(churchDataRef)
  const batch = writeBatch(db)
  membersSnap.forEach(docu => batch.delete(docu.ref))
  const financesRef = collection(db, `churches_data/${id}/finances`)
  const financesSnap = await getDocs(financesRef)
  financesSnap.forEach(docu => batch.delete(docu.ref))
  const reportsRef = collection(db, `churches_data/${id}/reports`)
  const reportsSnap = await getDocs(reportsRef)
  reportsSnap.forEach(docu => batch.delete(docu.ref))
  await batch.commit()
}
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

export async function createChurch({ name, plan = 'Básico', password = '' }) {
  const payload = {
    name,
    isLocked: false,
    plan,
    password,
    createdAt: serverTimestamp(),
  }
  const ref = await addDoc(collection(db, COLLECTION), payload)
  return { id: ref.id, ...payload }
}

export async function setChurchPassword(id, password) {
  await updateDoc(doc(db, COLLECTION, id), { password })
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
