

import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { listMembers } from '../../../core/data/membersService'

function PastorDashboard() {
  const { churchId } = useParams()
  const [counts, setCounts] = useState({ miembros: 0, creyentes: 0, visitantes: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchCounts() {
      setLoading(true)
      const members = await listMembers(churchId)
      let miembros = 0, creyentes = 0, visitantes = 0
      for (const m of members) {
        if (m.role === 'Miembro') miembros++
        else if (m.role === 'Creyente') creyentes++
        else if (m.role === 'Visitante') visitantes++
      }
      setCounts({ miembros, creyentes, visitantes })
      setLoading(false)
    }
    fetchCounts()
  }, [churchId])

  return (
    <div className="p-6">
      <h2 className="text-2xl font-serif mb-4">Dashboard de la iglesia</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6 flex flex-col items-center">
          <span className="text-3xl font-bold text-hunter">{loading ? '...' : counts.miembros}</span>
          <span className="text-navy/80 mt-2">Miembros</span>
        </div>
        <div className="bg-white rounded-lg shadow p-6 flex flex-col items-center">
          <span className="text-3xl font-bold text-navy">{loading ? '...' : counts.creyentes}</span>
          <span className="text-navy/80 mt-2">Creyentes</span>
        </div>
        <div className="bg-white rounded-lg shadow p-6 flex flex-col items-center">
          <span className="text-3xl font-bold text-gold">{loading ? '...' : counts.visitantes}</span>
          <span className="text-navy/80 mt-2">Visitantes</span>
        </div>
      </div>
    </div>
  )
}

export default PastorDashboard
