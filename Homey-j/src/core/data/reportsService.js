import { collection, addDoc, getDocs, serverTimestamp, doc, setDoc, getDoc } from 'firebase/firestore'
import { db } from '../firebase'

// Guarda un reporte de miembro en la subcolección reports de la iglesia
export async function addReportMember(churchId, report) {
  const ref = collection(db, `churches_data/${churchId}/reports`)
  const payload = {
    ...report,
    createdAt: serverTimestamp(),
  }
  const docRef = await addDoc(ref, payload)
  return { id: docRef.id, ...payload }
}

// Lista todos los reportes de miembros de una iglesia
export async function listReportMembers(churchId) {
  const ref = collection(db, `churches_data/${churchId}/reports`)
  const snapshot = await getDocs(ref)
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() }))
}

// Guarda plantilla de campos extra para reportes de miembros
export async function setReportTemplate(churchId, fields = []) {
  const ref = doc(db, `churches_data/${churchId}/reportTemplate`)
  await setDoc(ref, { fields, updatedAt: serverTimestamp() })
  return fields
}

// Obtiene plantilla de campos extra para reportes de miembros
export async function getReportTemplate(churchId) {
  const ref = doc(db, `churches_data/${churchId}/reportTemplate`)
  const snap = await getDoc(ref)
  if (!snap.exists()) return []
  const data = snap.data()
  return Array.isArray(data.fields) ? data.fields : []
}
