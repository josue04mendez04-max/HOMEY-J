import { doc, getDoc, setDoc, updateDoc, arrayUnion } from 'firebase/firestore'
import { db } from '../firebase'

const CONFIG_DOC = 'super_admin_config/global'

export async function getMinistries() {
  const ref = doc(db, CONFIG_DOC)
  const snap = await getDoc(ref)
  return snap.exists() && snap.data().ministries ? snap.data().ministries : [
    'Caballeros', 'Damas', 'Jovenes', 'Niños', 'Otro'
  ]
}

export async function addMinistry(newMinistry) {
  const ref = doc(db, CONFIG_DOC)
  await setDoc(ref, { ministries: arrayUnion(newMinistry) }, { merge: true })
}

export async function getRoles() {
  const ref = doc(db, CONFIG_DOC)
  const snap = await getDoc(ref)
  return snap.exists() && snap.data().roles ? snap.data().roles : [
    'Pastor', 'Miembro', 'Lider', 'Otro'
  ]
}

export async function addRole(newRole) {
  const ref = doc(db, CONFIG_DOC)
  await setDoc(ref, { roles: arrayUnion(newRole) }, { merge: true })
}
