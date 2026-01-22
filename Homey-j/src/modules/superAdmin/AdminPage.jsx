import { useMemo, useState } from 'react'
import LockScreen from './components/LockScreen'
import AdminDashboard from './components/AdminDashboard'

const MASTER_KEY = import.meta.env.VITE_MASTER_KEY || '00000000000000000000'
const STORAGE_KEY = 'homeyj:admin:unlocked'

function AdminPage() {
  const [isUnlocked, setIsUnlocked] = useState(() => localStorage.getItem(STORAGE_KEY) === 'true')

  const maskedKey = useMemo(
    () => `${MASTER_KEY.slice(0, 2)}················${MASTER_KEY.slice(-2)}`,
    [],
  )

  const handleUnlock = (value) => {
    const isValidLength = /^\d{20}$/.test(value)
    if (!isValidLength) {
      throw new Error('La Master Key debe tener exactamente 20 dígitos numéricos.')
    }
    if (value !== MASTER_KEY) {
      throw new Error('Master Key incorrecta.')
    }
    localStorage.setItem(STORAGE_KEY, 'true')
    setIsUnlocked(true)
  }

  const handleLock = () => {
    localStorage.removeItem(STORAGE_KEY)
    setIsUnlocked(false)
  }

  if (!isUnlocked) {
    return <LockScreen onUnlock={handleUnlock} maskedKey={maskedKey} />
  }

  return <AdminDashboard onLock={handleLock} />
}

export default AdminPage
