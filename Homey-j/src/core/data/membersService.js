import { collection, addDoc, getDocs, serverTimestamp, doc, updateDoc, query, where } from 'firebase/firestore'

export async function updateMember(churchId, memberId, data) {
  const ref = doc(db, `churches_data/${churchId}/members/${memberId}`)
  // No se debe permitir cambiar el nombre
  const { name, ...rest } = data
  const updatePayload = {
    ...rest,
    ...(typeof name === 'string' ? { nameLower: name.toLowerCase() } : {})
  }
  await updateDoc(ref, updatePayload)
  return true
}
import { db } from '../firebase'

export async function addMember(churchId, member) {
  const ref = collection(db, `churches_data/${churchId}/members`)
  const payload = {
    ...member,
    nameLower: member.name ? member.name.toLowerCase() : '',
    createdAt: serverTimestamp(),
  }
  const docRef = await addDoc(ref, payload)
  return { id: docRef.id, ...payload }
}

export async function listMembers(churchId) {
  const ref = collection(db, `churches_data/${churchId}/members`)
  const snapshot = await getDocs(ref)
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() }))
}

export async function searchMembersByName(churchId, search) {
  if (!search) return [];
  const ref = collection(db, `churches_data/${churchId}/members`)
  const searchLower = search.toLowerCase();
  const q = query(ref, where('nameLower', '>=', searchLower), where('nameLower', '<=', searchLower + '\uf8ff'))
  const snapshot = await getDocs(q)
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() }))
}
