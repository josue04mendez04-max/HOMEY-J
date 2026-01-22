import { useState, useEffect } from 'react'
import { listMembers } from '../../../core/data/membersService'

function LeadershipSectorDashboard({ sector, churchId, onBack }) {
  const [offerModal, setOfferModal] = useState(false)
  const [offers, setOffers] = useState([])
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [offerForm, setOfferForm] = useState({ date: '', concept: '', amount: '' })

  useEffect(() => {
    async function fetchMembers() {
      setLoading(true)
      const all = await listMembers(churchId)
      setMembers(all.filter(m => (m.ministry || '').toLowerCase() === sector.toLowerCase()))
      setLoading(false)
    }
    fetchMembers()
  }, [sector, churchId])

  const countByRole = (role) => members.filter(m => m.role === role).length

  const handleOfferChange = e => {
    setOfferForm({ ...offerForm, [e.target.name]: e.target.value })
  }

  const handleOfferSubmit = e => {
    e.preventDefault()
    // Aquí deberías guardar la ofrenda en Firestore
    setOffers(prev => [...prev, { ...offerForm }])
    setOfferModal(false)
    setOfferForm({ date: '', concept: '', amount: '' })
  }

  return (
    <div className="p-6">
      <button onClick={onBack} className="mb-4 text-navy underline">&larr; Volver a sectores</button>
      <h2 className="text-2xl font-serif mb-4">Dashboard de {sector}</h2>
      <div className="flex gap-4 mb-6">
        <button className="bg-hunter text-cream px-4 py-2 rounded" onClick={() => setOfferModal(true)}>Agregar ofrenda</button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6 flex flex-col items-center">
          <span className="text-3xl font-bold text-hunter">{loading ? '...' : countByRole('Miembro')}</span>
          <span className="text-navy/80 mt-2">Miembros</span>
        </div>
        <div className="bg-white rounded-lg shadow p-6 flex flex-col items-center">
          <span className="text-3xl font-bold text-navy">{loading ? '...' : countByRole('Creyente')}</span>
          <span className="text-navy/80 mt-2">Creyentes</span>
        </div>
      </div>
      <div className="mb-8">
        <h3 className="text-lg font-bold mb-2">Personas en el ministerio</h3>
        {loading ? (
          <div className="text-navy/60">Cargando...</div>
        ) : members.length === 0 ? (
          <div className="text-navy/60">No hay personas en este ministerio.</div>
        ) : (
          <ul className="divide-y divide-navy/10 bg-white rounded-lg shadow">
            {members.map(m => (
              <li key={m.id} className="px-4 py-2 flex flex-col md:flex-row md:items-center md:justify-between">
                <span className="font-medium">{m.name}</span>
                <span className="text-navy/70 text-sm">{m.role}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
      {/* Modal para agregar ofrenda */}
      {offerModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">Agregar ofrenda</h3>
            <form className="flex flex-col gap-4" onSubmit={handleOfferSubmit}>
              <input type="date" name="date" value={offerForm.date} onChange={handleOfferChange} className="border rounded px-3 py-2" required />
              <input type="text" name="concept" value={offerForm.concept} onChange={handleOfferChange} placeholder="Concepto" className="border rounded px-3 py-2" required />
              <input type="number" name="amount" value={offerForm.amount} onChange={handleOfferChange} placeholder="Cantidad" className="border rounded px-3 py-2" required min="0" step="0.01" />
              <div className="flex gap-2 justify-end mt-2">
                <button type="button" onClick={() => setOfferModal(false)} className="px-4 py-2 rounded bg-navy text-cream">Cancelar</button>
                <button type="submit" className="px-4 py-2 rounded bg-hunter text-cream">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default LeadershipSectorDashboard
