import { collection, addDoc, getDocs, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'

export async function addFinanceRecord(churchId, type, data) {
  const ref = collection(db, `churches_data/${churchId}/finances`)
  const payload = {
    ...data,
    kind: type, // 'ingreso' o 'egreso'
    createdAt: serverTimestamp(),
  }
  const docRef = await addDoc(ref, payload)
  return { id: docRef.id, ...payload }
}

export async function listFinanceRecords(churchId) {
  const ref = collection(db, `churches_data/${churchId}/finances`)
  const snapshot = await getDocs(ref)
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() }))
}
