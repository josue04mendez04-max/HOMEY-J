import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'

const path = (churchId) => collection(db, `churches_data/${churchId}/finance_concepts`)

export async function listFinanceConcepts(churchId) {
  const snapshot = await getDocs(path(churchId))
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() }))
}

export async function createFinanceConcept(churchId, concept) {
  const ref = await addDoc(path(churchId), { ...concept, createdAt: serverTimestamp() })
  return { id: ref.id, ...concept }
}

export async function updateFinanceConcept(churchId, conceptId, concept) {
  const ref = doc(db, `churches_data/${churchId}/finance_concepts/${conceptId}`)
  await updateDoc(ref, concept)
}

export async function deleteFinanceConcept(churchId, conceptId) {
  const ref = doc(db, `churches_data/${churchId}/finance_concepts/${conceptId}`)
  await deleteDoc(ref)
}
