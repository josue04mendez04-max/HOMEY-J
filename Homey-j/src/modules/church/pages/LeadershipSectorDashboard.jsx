import { useState, useEffect, useMemo } from 'react'
import { listMembers } from '../../../core/data/membersService'
import { listReportMembers } from '../../../core/data/reportsService'
import { addFinanceRecord, listFinanceRecords } from '../../../core/data/financesService'

function LeadershipSectorDashboard({ sector, churchId, onBack }) {
  const [offerModal, setOfferModal] = useState(false)
  const [offers, setOffers] = useState([])
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingReports, setLoadingReports] = useState(true)
  const [offerForm, setOfferForm] = useState({ date: '', concept: '', amount: '' })
  const [reports, setReports] = useState([])
  const [birthdayFilter, setBirthdayFilter] = useState('mes') // mes | semana | dia
  const [upcomingBirthdays, setUpcomingBirthdays] = useState([])

  useEffect(() => {
    async function fetchMembers() {
      setLoading(true)
      const all = await listMembers(churchId)
      setMembers(all.filter(m => (m.ministry || '').toLowerCase() === sector.toLowerCase()))
      setLoading(false)
    }
    fetchMembers()
  }, [sector, churchId])

  useEffect(() => {
    if (members.length === 0) return setUpcomingBirthdays([])
    const now = new Date()
    const currentMonth = now.getMonth()
    const currentDay = now.getDate()

    let filtered = members.filter(m => m.birth && typeof m.birth === 'string')
    filtered = filtered.map(m => {
      const parts = m.birth.split('/')
      if (parts.length < 2) return null
      const day = parseInt(parts[0], 10)
      const month = parseInt(parts[1], 10)
      if (!day || !month || day < 1 || day > 31 || month < 1 || month > 12) return null
      let birthDate = new Date(now.getFullYear(), month - 1, day)
      if (birthDate < now) {
        birthDate = new Date(now.getFullYear() + 1, month - 1, day)
      }
      return { ...m, proximoCumple: birthDate, birthMonth: month, birthDay: day }
    }).filter(Boolean)

    if (birthdayFilter === 'mes') {
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      filtered = filtered.filter(m => m.proximoCumple <= endOfMonth)
    } else if (birthdayFilter === 'semana') {
      const endOfWeek = new Date(now)
      endOfWeek.setDate(now.getDate() + 7)
      filtered = filtered.filter(m => m.proximoCumple <= endOfWeek)
    } else if (birthdayFilter === 'dia') {
      filtered = filtered.filter(m => m.birthMonth === (currentMonth + 1) && m.birthDay === currentDay)
    }

    filtered.sort((a, b) => a.proximoCumple - b.proximoCumple)
    setUpcomingBirthdays(filtered)
  }, [members, birthdayFilter])

  useEffect(() => {
    async function fetchReports() {
      setLoadingReports(true)
      const all = await listReportMembers(churchId)
      const filtered = all.filter(r => (r.ministry || '').toLowerCase() === sector.toLowerCase())
      setReports(filtered)
      setLoadingReports(false)
    }
    fetchReports()
  }, [sector, churchId])

  useEffect(() => {
    async function fetchOffers() {
      const all = await listFinanceRecords(churchId)
      const filtered = all.filter(o => (o.kind || '').toLowerCase() === 'ofrenda' && (o.ministry || '').toLowerCase() === sector.toLowerCase())
      setOffers(filtered)
    }
    fetchOffers()
  }, [sector, churchId])

  const reportTotals = useMemo(() => {
    return reports.reduce((acc, r) => {
      acc.capitulos += Number(r.capitulos || 0)
      acc.horas += Number(r.horas || 0)
      acc.ayunos += Number(r.ayunos || 0)
      acc.almas += Number(r.almas || 0)
      return acc
    }, { capitulos: 0, horas: 0, ayunos: 0, almas: 0 })
  }, [reports])

  const formatMoney = (num) => Number(num || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  const formatDate = (ts) => {
    if (!ts) return '—'
    if (ts.toDate) {
      return ts.toDate().toLocaleDateString()
    }
    if (ts.seconds) {
      return new Date(ts.seconds * 1000).toLocaleDateString()
    }
    return '—'
  }

  const countByRole = (role) => members.filter(m => m.role === role).length
  const totalOffers = offers.reduce((sum, o) => sum + Number(o.amount || 0), 0)

  const handleOfferChange = e => {
    setOfferForm({ ...offerForm, [e.target.name]: e.target.value })
  }

  const handleOfferSubmit = e => {
    e.preventDefault()
    const payload = { ...offerForm, ministry: sector }
    addFinanceRecord(churchId, 'ofrenda', payload).then(() => {
      setOfferModal(false)
      setOfferForm({ date: '', concept: '', amount: '' })
      // Refrescar lista
      listFinanceRecords(churchId).then(all => {
        const filtered = all.filter(o => (o.kind || '').toLowerCase() === 'ofrenda' && (o.ministry || '').toLowerCase() === sector.toLowerCase())
        setOffers(filtered)
      })
    })
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] px-4 sm:px-8 py-8 text-[#0f172a]">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-[#94a3b8]">Liderazgo</p>
          <h2 className="text-3xl font-semibold mt-1">Dashboard de {sector}</h2>
        </div>
        <button className="bg-[#0ea5e9] text-white px-4 py-2 rounded-lg shadow hover:bg-[#0284c7] transition" onClick={() => setOfferModal(true)}>Agregar ofrenda</button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-8">
        <div className="bg-white rounded-xl shadow p-6 flex flex-col items-center">
          <span className="text-3xl font-bold text-[#0ea5e9]">{loading ? '...' : countByRole('Miembro')}</span>
          <span className="text-[#475569] mt-2">Miembros</span>
        </div>
        <div className="bg-white rounded-xl shadow p-6 flex flex-col items-center">
          <span className="text-3xl font-bold text-[#0f172a]">{loading ? '...' : countByRole('Creyente')}</span>
          <span className="text-[#475569] mt-2">Creyentes</span>
        </div>
        <div className="bg-white rounded-xl shadow p-6 flex flex-col items-center">
          <span className="text-3xl font-bold text-green-700">{totalOffers.toFixed(2)}</span>
          <span className="text-[#475569] mt-2">Total ofrendas</span>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow p-6 mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <div>
            <h3 className="text-lg font-semibold">Reportes del ministerio</h3>
            <p className="text-sm text-[#475569]">Resumen y detalle de reportes enviados por {sector}.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-lg px-4 py-2 text-center">
              <p className="text-xs text-[#64748b]">Total reportes</p>
              <p className="text-xl font-bold text-[#0f172a]">{loadingReports ? '...' : reports.length}</p>
            </div>
            <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-lg px-4 py-2 text-center">
              <p className="text-xs text-[#64748b]">Capítulos</p>
              <p className="text-xl font-bold text-[#0ea5e9]">{loadingReports ? '...' : reportTotals.capitulos}</p>
            </div>
            <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-lg px-4 py-2 text-center">
              <p className="text-xs text-[#64748b]">Horas</p>
              <p className="text-xl font-bold text-[#0ea5e9]">{loadingReports ? '...' : reportTotals.horas}</p>
            </div>
            <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-lg px-4 py-2 text-center">
              <p className="text-xs text-[#64748b]">Ayunos</p>
              <p className="text-xl font-bold text-[#0ea5e9]">{loadingReports ? '...' : reportTotals.ayunos}</p>
            </div>
            <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-lg px-4 py-2 text-center">
              <p className="text-xs text-[#64748b]">Almas</p>
              <p className="text-xl font-bold text-[#0ea5e9]">{loadingReports ? '...' : reportTotals.almas}</p>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto border border-[#e2e8f0] rounded-lg">
          {loadingReports ? (
            <div className="p-6 text-[#94a3b8]">Cargando reportes...</div>
          ) : reports.length === 0 ? (
            <div className="p-6 text-[#94a3b8]">No hay reportes para este ministerio.</div>
          ) : (
            <table className="min-w-full divide-y divide-[#e2e8f0] text-sm">
              <thead className="bg-[#f8fafc] text-[#475569]">
                <tr>
                  <th className="px-4 py-2 text-left font-semibold">Nombre</th>
                  <th className="px-4 py-2 text-left font-semibold">Fecha</th>
                  <th className="px-4 py-2 text-left font-semibold">Capítulos</th>
                  <th className="px-4 py-2 text-left font-semibold">Horas</th>
                  <th className="px-4 py-2 text-left font-semibold">Ayunos</th>
                  <th className="px-4 py-2 text-left font-semibold">Almas</th>
                  <th className="px-4 py-2 text-left font-semibold">Altar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e2e8f0] text-[#0f172a]">
                {reports.map(r => (
                  <tr key={r.id} className="hover:bg-[#f8fafc] transition">
                    <td className="px-4 py-2 font-medium">{r.name || '—'}</td>
                    <td className="px-4 py-2">{formatDate(r.createdAt)}</td>
                    <td className="px-4 py-2">{r.capitulos ?? '—'}</td>
                    <td className="px-4 py-2">{r.horas ?? '—'}</td>
                    <td className="px-4 py-2">{r.ayunos ?? '—'}</td>
                    <td className="px-4 py-2">{r.almas ?? '—'}</td>
                    <td className="px-4 py-2">{r.altar || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow p-6 mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <div>
            <h3 className="text-lg font-semibold">Ofrendas del ministerio</h3>
            <p className="text-sm text-[#475569]">Listado y control de las ofrendas registradas en este sector.</p>
          </div>
          <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-lg px-4 py-2 text-center">
            <p className="text-xs text-[#64748b]">Total ofrendas</p>
            <p className="text-xl font-bold text-green-700">${formatMoney(totalOffers)}</p>
          </div>
        </div>
        <div className="overflow-x-auto border border-[#e2e8f0] rounded-lg">
          {offers.length === 0 ? (
            <div className="p-6 text-[#94a3b8]">No hay ofrendas registradas.</div>
          ) : (
            <table className="min-w-full divide-y divide-[#e2e8f0] text-sm">
              <thead className="bg-[#f8fafc] text-[#475569]">
                <tr>
                  <th className="px-4 py-2 text-left font-semibold">Fecha</th>
                  <th className="px-4 py-2 text-left font-semibold">Concepto</th>
                  <th className="px-4 py-2 text-left font-semibold">Monto</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e2e8f0] text-[#0f172a]">
                {[...offers].sort((a, b) => {
                  const da = a.createdAt?.seconds ? a.createdAt.seconds : 0
                  const db = b.createdAt?.seconds ? b.createdAt.seconds : 0
                  return db - da
                }).map((o, idx) => (
                  <tr key={o.id || idx} className="hover:bg-[#f8fafc] transition">
                    <td className="px-4 py-2">{formatDate(o.createdAt)}</td>
                    <td className="px-4 py-2 font-medium">{o.concept || '—'}</td>
                    <td className="px-4 py-2 text-green-700">${formatMoney(o.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
      <div className="bg-white rounded-xl shadow p-6 mb-8">
        <div className="flex flex-wrap gap-2 mb-4 items-center">
          <span className="font-semibold text-[#0f172a]">🎂 Cumpleaños en {sector}</span>
          <div className="flex gap-2">
            <button
              className={`px-3 py-1 rounded text-sm font-medium ${birthdayFilter === 'mes' ? 'bg-[#0ea5e9] text-white' : 'bg-[#e2e8f0] text-[#0f172a]'}`}
              onClick={() => setBirthdayFilter('mes')}
            >
              Mes
            </button>
            <button
              className={`px-3 py-1 rounded text-sm font-medium ${birthdayFilter === 'semana' ? 'bg-[#0ea5e9] text-white' : 'bg-[#e2e8f0] text-[#0f172a]'}`}
              onClick={() => setBirthdayFilter('semana')}
            >
              Semana
            </button>
            <button
              className={`px-3 py-1 rounded text-sm font-medium ${birthdayFilter === 'dia' ? 'bg-[#0ea5e9] text-white' : 'bg-[#e2e8f0] text-[#0f172a]'}`}
              onClick={() => setBirthdayFilter('dia')}
            >
              Hoy
            </button>
          </div>
        </div>
        {upcomingBirthdays.length === 0 ? (
          <div className="text-[#94a3b8]">No hay cumpleaños en este período.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-[#e2e8f0] text-[#475569] bg-[#f8fafc]">
                  <th className="py-2 px-4 text-left">Nombre</th>
                  <th className="py-2 px-4 text-left">Fecha de nacimiento</th>
                  <th className="py-2 px-4 text-left">Próximo cumpleaños</th>
                  <th className="py-2 px-4 text-left">Teléfono</th>
                </tr>
              </thead>
              <tbody>
                {upcomingBirthdays.map((m, i) => (
                  <tr key={m.id || i} className="border-b border-[#f1f5f9] hover:bg-[#f8fafc] transition duration-150 ease-out">
                    <td className="py-2 px-4 font-medium text-[#0f172a]">{m.name}</td>
                    <td className="py-2 px-4 text-[#334155]">{m.birth}</td>
                    <td className="py-2 px-4 text-[#334155]">{m.proximoCumple.toLocaleDateString('es-ES', { weekday: 'short', month: 'short', day: 'numeric' })}</td>
                    <td className="py-2 px-4 text-[#334155]">{m.phone || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-2">Personas en el ministerio</h3>
        {loading ? (
          <div className="text-[#94a3b8]">Cargando...</div>
        ) : members.length === 0 ? (
          <div className="text-[#94a3b8]">No hay personas en este ministerio.</div>
        ) : (
          <ul className="divide-y divide-[#e2e8f0] bg-white rounded-lg shadow fade-in-up">
            {members.map(m => (
              <li key={m.id} className="px-4 py-2 flex flex-col md:flex-row md:items-center md:justify-between hover:bg-[#f8fafc] transition duration-150 ease-out">
                <span className="font-medium text-[#0f172a]">{m.name}</span>
                <span className="text-[#475569] text-sm">{m.role}</span>
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
              <input type="date" name="date" value={offerForm.date} onChange={handleOfferChange} className="border border-[#e2e8f0] rounded px-3 py-2" required />
              <input type="text" name="concept" value={offerForm.concept} onChange={handleOfferChange} placeholder="Concepto" className="border border-[#e2e8f0] rounded px-3 py-2" required />
              <input type="number" name="amount" value={offerForm.amount} onChange={handleOfferChange} placeholder="Cantidad" className="border border-[#e2e8f0] rounded px-3 py-2" required min="0" step="0.01" />
              <div className="flex gap-2 justify-end mt-2">
                <button type="button" onClick={() => setOfferModal(false)} className="px-4 py-2 rounded bg-[#0f172a] text-white hover:bg-black">Cancelar</button>
                <button type="submit" className="px-4 py-2 rounded bg-[#0ea5e9] text-white hover:bg-[#0284c7]">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default LeadershipSectorDashboard
