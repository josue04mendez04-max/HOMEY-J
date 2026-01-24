import { deleteDoc } from 'firebase/firestore'
export async function deleteTransaction(churchId, transactionId) {
  const ref = doc(db, `churches_data/${churchId}/finances/${transactionId}`)
  await deleteDoc(ref)
}

import { doc, updateDoc } from 'firebase/firestore'

export async function updateTransaction(churchId, transactionId, data) {
  const ref = doc(db, `churches_data/${churchId}/finances/${transactionId}`)
  await updateDoc(ref, { ...data })
}
import { collection, addDoc, getDocs, serverTimestamp, query, where } from 'firebase/firestore'
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

// Nuevo: transacciones con concepto y wallet
export async function addTransaction(churchId, payload) {
  const ref = collection(db, `churches_data/${churchId}/finances`)
  const normalized = {
    ...payload,
    churchId,
    kind: payload.kind || 'ingreso',
    amount: Number(payload.amount || 0),
    wallet_id: payload.wallet_id || payload.walletId || null,
    concept_id: payload.concept_id || payload.conceptId || null,
    responsable: payload.responsable || '',
    responsableId: payload.responsableId || '',
    transactionType: payload.transactionType || '',
    date: payload.date || new Date().toISOString().slice(0, 10),
    wallet_snapshot: payload.wallet_snapshot || null,
    concept_snapshot: payload.concept_snapshot || null,
    createdAt: serverTimestamp()
  }
  // Compatibilidad: mantener walletId/conceptId replicados si venían así
  if (!normalized.walletId) normalized.walletId = normalized.wallet_id
  if (!normalized.conceptId) normalized.conceptId = normalized.concept_id

  const docRef = await addDoc(ref, normalized)
  return { id: docRef.id, ...normalized }
}

export async function listTransactionsByDate(churchId, isoDate) {
  const ref = collection(db, `churches_data/${churchId}/finances`)
  // Nota: Firestore no indexa por fecha sin un campo específico; se espera que exista createdAt
  const snapshot = await getDocs(ref)
  const target = new Date(isoDate)
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() })).filter(t => {
    const d = t.createdAt?.toDate ? t.createdAt.toDate() : t.createdAt?.seconds ? new Date(t.createdAt.seconds * 1000) : null
    if (!d) return false
    return d.getFullYear() === target.getFullYear() && d.getMonth() === target.getMonth() && d.getDate() === target.getDate()
  })
}
