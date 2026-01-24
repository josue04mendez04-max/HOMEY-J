import { collection, addDoc, getDocs, query, where, orderBy } from 'firebase/firestore'
import { db } from '../firebase'

export async function saveCutReceipt(churchId, receipt) {
  const ref = collection(db, `churches_data/${churchId}/cuts_history`)
  await addDoc(ref, receipt)
}

export async function listCutReceipts(churchId, { startDate, endDate } = {}) {
  const ref = collection(db, `churches_data/${churchId}/cuts_history`)
  let q = ref
  if (startDate && endDate) {
    q = query(ref, where('date', '>=', startDate), where('date', '<=', endDate), orderBy('date', 'desc'))
  } else {
    q = query(ref, orderBy('date', 'desc'))
  }
  const snap = await getDocs(q)
  return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
}
