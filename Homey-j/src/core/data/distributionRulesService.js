import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'

const path = (churchId) => collection(db, `churches_data/${churchId}/distribution_rules`)

export async function listDistributionRules(churchId) {
  const snapshot = await getDocs(path(churchId))
  const rules = snapshot.docs.map(d => ({ id: d.id, ...d.data() }))
  // Ordenar por prioridad
  return rules.sort((a, b) => (a.priority || 0) - (b.priority || 0))
}

export async function createDistributionRule(churchId, rule) {
  // Si no hay prioridad, asignamos la siguiente disponible
  let priority = rule.priority
  if (priority === undefined || priority === null) {
    const existing = await listDistributionRules(churchId)
    priority = Math.max(...existing.map(r => r.priority || 0), 0) + 1
  }
  
  const ref = await addDoc(path(churchId), { 
    ...rule, 
    priority,
    createdAt: serverTimestamp() 
  })
  return { id: ref.id, ...rule, priority }
}

export async function updateDistributionRule(churchId, ruleId, rule) {
  const ref = doc(db, `churches_data/${churchId}/distribution_rules/${ruleId}`)
  await updateDoc(ref, { ...rule, updatedAt: serverTimestamp() })
}

export async function reorderRules(churchId, rules) {
  // Recibe array de {id, priority} y actualiza todos
  const updates = rules.map(async (r, idx) => {
    const ref = doc(db, `churches_data/${churchId}/distribution_rules/${r.id}`)
    await updateDoc(ref, { priority: idx, updatedAt: serverTimestamp() })
  })
  await Promise.all(updates)}

export async function deleteDistributionRule(churchId, ruleId) {
  const ref = doc(db, `churches_data/${churchId}/distribution_rules/${ruleId}`)
  await deleteDoc(ref)
}