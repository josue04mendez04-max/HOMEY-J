import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, serverTimestamp, where, query } from 'firebase/firestore'
import { db } from '../firebase'

const path = (churchId) => collection(db, `churches_data/${churchId}/wallets`)

export async function listWallets(churchId, includeInactive = false) {
  const snapshot = await getDocs(path(churchId))
  let wallets = snapshot.docs.map(d => ({ id: d.id, ...d.data() }))
  
  // Por defecto, solo mostrar carteras activas
  if (!includeInactive) {
    wallets = wallets.filter(w => w.is_active !== false)
  }
  
  return wallets
}

export async function listAllWallets(churchId) {
  return listWallets(churchId, true)
}

export async function createWallet(churchId, wallet) {
  const ref = await addDoc(path(churchId), { 
    ...wallet, 
    is_active: true, 
    createdAt: serverTimestamp(),
    archivedAt: null
  })
  return { id: ref.id, ...wallet, is_active: true }
}

export async function updateWallet(churchId, walletId, wallet) {
  const ref = doc(db, `churches_data/${churchId}/wallets/${walletId}`)
  await updateDoc(ref, { ...wallet, updatedAt: serverTimestamp() })
}

export async function archiveWallet(churchId, walletId) {
  const ref = doc(db, `churches_data/${churchId}/wallets/${walletId}`)
  await updateDoc(ref, { 
    is_active: false, 
    archivedAt: serverTimestamp() 
  })
}

export async function restoreWallet(churchId, walletId) {
  const ref = doc(db, `churches_data/${churchId}/wallets/${walletId}`)
  await updateDoc(ref, { 
    is_active: true, 
    archivedAt: null 
  })
}

// Solo borrar si no tiene movimientos
export async function deleteWallet(churchId, walletId) {
  const ref = doc(db, `churches_data/${churchId}/wallets/${walletId}`)
  await deleteDoc(ref)
}
