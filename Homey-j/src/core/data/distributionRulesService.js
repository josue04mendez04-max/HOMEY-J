import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, serverTimestamp, getDoc } from 'firebase/firestore'
import { db } from '../firebase'
import { listWallets } from './walletsService'

const path = (churchId) => collection(db, `churches_data/${churchId}/distribution_rules`)

// Las reglas se almacenan en las wallets (campo distribution_rules).
// Se mantiene la colección legacy para compatibilidad.
export async function listDistributionRules(churchId) {
  const wallets = await listWallets(churchId, true)
  const fromWallets = wallets.flatMap(w => (w.distribution_rules || []).map(r => ({ ...r, target_wallet_id: r.is_outflow ? null : (r.target_wallet_id || w.id), enabled: r.enabled !== false })))

  if (fromWallets.length > 0) {
    return fromWallets.sort((a, b) => (a.priority || 0) - (b.priority || 0))
  }

  const snapshot = await getDocs(path(churchId))
  const rules = snapshot.docs.map(d => ({ id: d.id, ...d.data() }))
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
    const ruleWithId = { id: ref.id, ...rule, priority }

    // Sincronizar con la wallet destino (se guarda en el documento de wallet)
    if (rule.target_wallet_id) {
      const walletRef = doc(db, `churches_data/${churchId}/wallets/${rule.target_wallet_id}`)
      const snap = await getDoc(walletRef)
      if (snap.exists()) {
        const current = snap.data().distribution_rules || []
        await updateDoc(walletRef, { distribution_rules: [...current, { ...ruleWithId, enabled: true }] })
      }
    }

    return ruleWithId
}

export async function updateDistributionRule(churchId, ruleId, rule) {
  const ref = doc(db, `churches_data/${churchId}/distribution_rules/${ruleId}`)
  await updateDoc(ref, { ...rule, updatedAt: serverTimestamp() })
  // Actualizar en wallet
  if (rule.target_wallet_id) {
    const walletRef = doc(db, `churches_data/${churchId}/wallets/${rule.target_wallet_id}`)
    const snap = await getDoc(walletRef)
    if (snap.exists()) {
      const current = snap.data().distribution_rules || []
      await updateDoc(walletRef, { distribution_rules: current.map(r => r.id === ruleId ? { ...r, ...rule } : r) })
    }
  }
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

  // Remover de cualquier wallet que lo tenga
  const wallets = await listWallets(churchId, true)
  for (const w of wallets) {
    const rules = w.distribution_rules || []
    if (rules.some(r => r.id === ruleId)) {
      const walletRef = doc(db, `churches_data/${churchId}/wallets/${w.id}`)
      await updateDoc(walletRef, { distribution_rules: rules.filter(r => r.id !== ruleId) })
    }
  }
}