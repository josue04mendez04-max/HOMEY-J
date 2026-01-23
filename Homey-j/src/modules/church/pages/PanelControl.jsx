import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { listMembers } from '../../../core/data/membersService'
import { listChurches } from '../../../core/data/churchesService'
import { listReportMembers } from '../../../core/data/reportsService'
import { listFinanceRecords } from '../../../core/data/financesService'
import { Combobox } from '@headlessui/react'
import { Search } from 'lucide-react'

function PanelControl() {
  const { churchId } = useParams()
  const [counts, setCounts] = useState({ miembros: 0, creyentes: 0, visitantes: 0 })
  const [loading, setLoading] = useState(true)
  const [reports, setReports] = useState([])
  const [reportsLoading, setReportsLoading] = useState(false)
  const [offers, setOffers] = useState([])
  const [offersLoading, setOffersLoading] = useState(false)
  const [filter, setFilter] = useState({ periodo: 'todas', ministerio: 'todos' })
  const [showVidaModal, setShowVidaModal] = useState(false)
  const [miembros, setMiembros] = useState([])
  const [searchMember, setSearchMember] = useState('')
  const [selectedMember, setSelectedMember] = useState(null)
  const [historial, setHistorial] = useState([])
  const [cumpledorFilter, setCumpledorFilter] = useState('mes') // mes | semana | dia
  const [cumpledores, setCumpledores] = useState([])
  const [birthdaySector, setBirthdaySector] = useState('todos')
  const [pastorName, setPastorName] = useState('')

  useEffect(() => {
    async function fetchCounts() {
      setLoading(true)
      const churches = await listChurches()
      const church = churches.find(c => c.id === churchId)
      if (church && church.pastorName) {
        setPastorName(church.pastorName)
      }
      const members = await listMembers(churchId)
      setMiembros(members)
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

  // Cargar reportes
  useEffect(() => {
    async function fetchReports() {
      setReportsLoading(true)
      let all = await listReportMembers(churchId)
      if (filter.ministerio !== 'todos') {
        all = all.filter(r => (r.ministry || '').toLowerCase() === filter.ministerio.toLowerCase())
      }
      if (filter.periodo !== 'todas') {
        const now = new Date()
        const start = new Date(now)
        if (filter.periodo === 'semana') {
          start.setDate(now.getDate() - 7)
        } else if (filter.periodo === 'mes') {
          start.setMonth(now.getMonth() - 1)
        }
        all = all.filter(r => {
          if (r.createdAt?.toDate) {
            const d = r.createdAt.toDate()
            return d >= start && d <= now
          }
          if (r.createdAt?.seconds) {
            const d = new Date(r.createdAt.seconds * 1000)
            return d >= start && d <= now
          }
          return true
        })
      }
      setReports(all)
      setReportsLoading(false)
    }
    fetchReports()
  }, [churchId, filter])

  // Cargar ofrendas desde finanzas
  useEffect(() => {
    async function fetchOffers() {
      setOffersLoading(true)
      let all = await listFinanceRecords(churchId)
      all = all.filter(o => (o.kind || '').toLowerCase() === 'ofrenda')
      setOffers(all)
      setOffersLoading(false)
    }
    fetchOffers()
  }, [churchId])

  // Buscar historial de un miembro
  useEffect(() => {
    if (!selectedMember) return setHistorial([])
    setHistorial(reports.filter(r => r.name === selectedMember.name))
  }, [selectedMember, reports])

  // Calcular cumpleaños próximos (global con filtro por sector)
  useEffect(() => {
    if (miembros.length === 0) return
    const now = new Date()
    const currentMonth = now.getMonth()
    const currentDay = now.getDate()
    
    let filtered = miembros.filter(m => m.birth && typeof m.birth === 'string')
    if (birthdaySector !== 'todos') {
      filtered = filtered.filter(m => (m.ministry || '').toLowerCase() === birthdaySector.toLowerCase())
    }
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
    
    if (cumpledorFilter === 'mes') {
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      filtered = filtered.filter(m => m.proximoCumple <= endOfMonth)
    } else if (cumpledorFilter === 'semana') {
      const endOfWeek = new Date(now)
      endOfWeek.setDate(now.getDate() + 7)
      filtered = filtered.filter(m => m.proximoCumple <= endOfWeek)
    } else if (cumpledorFilter === 'dia') {
      filtered = filtered.filter(m => m.birthMonth === (currentMonth + 1) && m.birthDay === currentDay)
    }
    
    filtered.sort((a, b) => a.proximoCumple - b.proximoCumple)
    setCumpledores(filtered)
  }, [miembros, cumpledorFilter, birthdaySector])
  // Opciones de ministerio únicas
  const ministerios = Array.from(new Set(miembros.map(m => m.ministry).filter(Boolean)))
  const filteredOffers = useMemo(() => {
    return offers.filter(o => filter.ministerio === 'todos' ? true : (o.ministry || '').toLowerCase() === filter.ministerio.toLowerCase())
  }, [offers, filter.ministerio])
  const offersTotal = useMemo(() => filteredOffers.reduce((sum, o) => sum + Number(o.amount || 0), 0), [filteredOffers])
  // Renderiza el modal de vida espiritual
  function VidaEspiritualModal() {
    return (
      <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-lg relative">
          <button className="absolute top-3 right-3 text-gray-400 hover:text-gray-700" onClick={() => setShowVidaModal(false)}>&times;</button>
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><Search size={20}/> Ver Vida Espiritual</h2>
          <Combobox value={selectedMember} onChange={setSelectedMember}>
            <div className="relative mb-4">
              <Combobox.Input
                className="border rounded px-3 py-2 w-full"
                displayValue={v => v?.name || ''}
                onChange={e => setSearchMember(e.target.value)}
                placeholder="Buscar miembro..."
              />
              <Combobox.Options className="absolute z-10 mt-1 w-full bg-white border rounded shadow max-h-60 overflow-auto">
                {miembros.filter(m => m.name.toLowerCase().includes(searchMember.toLowerCase())).map(m => (
                  <Combobox.Option key={m.id} value={m} className={({ active }) => `px-4 py-2 cursor-pointer ${active ? 'bg-hunter text-cream' : ''}`}>
                    {m.name}
                  </Combobox.Option>
                ))}
              </Combobox.Options>
            </div>
          </Combobox>
          {selectedMember && (
            <div>
              <h3 className="font-semibold mb-2">Historial de reportes de {selectedMember.name}:</h3>
              <div className="max-h-60 overflow-y-auto">
                {historial.length === 0 ? <div className="text-navy/60">Sin reportes.</div> : (
                  <ul className="text-sm space-y-2">
                    {historial.map((r, i) => (
                      <li key={i} className="border-b pb-2">
                        <div><b>Fecha:</b> {r.createdAt?.seconds ? new Date(r.createdAt.seconds * 1000).toLocaleDateString() : '—'}</div>
                        <div><b>Ministerio:</b> {r.ministry || '—'}</div>
                        <div><b>Capítulos:</b> {r.capitulos} | <b>Horas:</b> {r.horas} | <b>Ayunos:</b> {r.ayunos} | <b>Almas:</b> {r.almas} | <b>Altar:</b> {r.altar}</div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] px-4 sm:px-8 py-8 text-[#0f172a]">
      <div className="mb-6">
        <p className="text-xs uppercase tracking-[0.2em] text-[#94a3b8]">Panel de Control</p>
        <h1 className="text-3xl font-semibold mt-1">Reporte de Actividad Semanal</h1>
        {pastorName && (
          <div className="text-lg font-semibold text-bank-700">¡Bienvenido, Pastor {pastorName}!</div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6 fade-in-up">
        <div className="bg-white rounded-lg shadow p-6 flex flex-col items-center transition-transform duration-200 ease-out hover:-translate-y-0.5 hover:shadow-md">
          <p className="text-xs text-[#94a3b8]">Miembros</p>
          <span className="text-2xl font-bold text-hunter">{loading ? '...' : counts.miembros}</span>
        </div>
        <div className="bg-white rounded-lg shadow p-6 flex flex-col items-center transition-transform duration-200 ease-out hover:-translate-y-0.5 hover:shadow-md">
          <p className="text-xs text-[#94a3b8]">Creyentes</p>
          <span className="text-2xl font-bold text-navy">{loading ? '...' : counts.creyentes}</span>
        </div>
        <div className="bg-white rounded-lg shadow p-6 flex flex-col items-center transition-transform duration-200 ease-out hover:-translate-y-0.5 hover:shadow-md">
          <p className="text-xs text-[#94a3b8]">Visitantes</p>
          <span className="text-2xl font-bold text-gold">{loading ? '...' : counts.visitantes}</span>
        </div>
        <div className="bg-white rounded-lg shadow p-6 flex flex-col items-center transition-transform duration-200 ease-out hover:-translate-y-0.5 hover:shadow-md">
          <p className="text-xs text-[#94a3b8]">Total reportes</p>
          <span className="text-2xl font-bold text-green-700">{reports.length}</span>
        </div>
        <div className="bg-white rounded-lg shadow p-6 flex flex-col items-center transition-transform duration-200 ease-out hover:-translate-y-0.5 hover:shadow-md">
          <p className="text-xs text-[#94a3b8]">Total ofrendas</p>
          <span className="text-2xl font-bold text-green-700">{offersLoading ? '...' : offersTotal.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow p-6 max-w-5xl mx-auto mb-8 fade-in-up-delayed">
        <div className="flex flex-wrap gap-2 mb-4 items-center">
          <span className="font-semibold text-navy">Reportes de miembros</span>
          <select className="border border-[#cbd5e1] rounded-lg px-3 py-2 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-[#0ea5e9]/30 focus:border-[#0ea5e9] transition" value={filter.periodo} onChange={e => setFilter(f => ({...f, periodo: e.target.value}))}>
            <option value="todas">Todas las fechas</option>
            <option value="semana">Esta semana</option>
            <option value="mes">Este mes</option>
          </select>
          <select className="border border-[#cbd5e1] rounded-lg px-3 py-2 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-[#0ea5e9]/30 focus:border-[#0ea5e9] transition" value={filter.ministerio} onChange={e => setFilter(f => ({...f, ministerio: e.target.value}))}>
            <option value="todos">Todos los ministerios</option>
            {ministerios.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
          <button className="ml-auto px-4 py-2 rounded-lg bg-[#0ea5e9] text-white font-semibold shadow-sm hover:shadow-md hover:bg-[#0284c7] transition flex items-center gap-2" onClick={() => setShowVidaModal(true)}>
            <Search size={18}/> Ver Vida Espiritual
          </button>
        </div>
        {reportsLoading ? (
          <div className="text-navy/60">Cargando reportes...</div>
        ) : reports.length === 0 ? (
          <div className="text-navy/60">No hay reportes registrados.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-[#e2e8f0] text-[#94a3b8] bg-[#f8fafc]">
                  <th className="py-3 px-4 text-left">Nombre</th>
                  <th className="py-3 px-4 text-left">Fecha</th>
                  <th className="py-3 px-4 text-left">Ministerio</th>
                  <th className="py-3 px-4 text-left">Capítulos</th>
                  <th className="py-3 px-4 text-left">Horas</th>
                  <th className="py-3 px-4 text-left">Ayunos</th>
                  <th className="py-3 px-4 text-left">Almas</th>
                  <th className="py-3 px-4 text-left">Altar</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((r, i) => (
                  <tr key={r.id || i} className="border-b border-[#f1f5f9] hover:bg-[#f8fafc] transition duration-150 ease-out">
                    <td className="py-3 px-4 text-[#0f172a]">{r.name}</td>
                    <td className="py-3 px-4 text-[#334155]">{r.createdAt?.seconds ? new Date(r.createdAt.seconds * 1000).toLocaleDateString() : '—'}</td>
                    <td className="py-3 px-4 text-[#334155]">{r.ministry}</td>
                    <td className="py-3 px-4 text-[#334155]">{r.capitulos}</td>
                    <td className="py-3 px-4 text-[#334155]">{r.horas}</td>
                    <td className="py-3 px-4 text-[#334155]">{r.ayunos}</td>
                    <td className="py-3 px-4 text-[#334155]">{r.almas}</td>
                    <td className="py-3 px-4 text-[#334155]">{r.altar}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {showVidaModal && <VidaEspiritualModal />}

      {/* Ofrendas globales */}
      <div className="bg-white rounded-xl shadow p-6 max-w-5xl mx-auto mb-8 fade-in-up">
        <div className="flex flex-wrap gap-2 mb-4 items-center">
          <span className="font-semibold text-navy">Ofrendas registradas</span>
          <span className="text-sm text-[#475569]">Filtra por sector arriba para ver solo un ministerio.</span>
        </div>
        {offersLoading ? (
          <div className="text-navy/60">Cargando ofrendas...</div>
        ) : filteredOffers.length === 0 ? (
          <div className="text-navy/60">No hay ofrendas registradas.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-[#e2e8f0] text-[#94a3b8] bg-[#f8fafc]">
                  <th className="py-3 px-4 text-left">Fecha</th>
                  <th className="py-3 px-4 text-left">Concepto</th>
                  <th className="py-3 px-4 text-left">Ministerio</th>
                  <th className="py-3 px-4 text-left">Monto</th>
                </tr>
              </thead>
              <tbody>
                {[...filteredOffers].sort((a, b) => {
                  const da = a.createdAt?.seconds ? a.createdAt.seconds : 0
                  const db = b.createdAt?.seconds ? b.createdAt.seconds : 0
                  return db - da
                }).map((o, i) => (
                  <tr key={o.id || i} className="border-b border-[#f1f5f9] hover:bg-[#f8fafc] transition duration-150 ease-out">
                    <td className="py-3 px-4 text-[#334155]">{o.createdAt?.seconds ? new Date(o.createdAt.seconds * 1000).toLocaleDateString() : '—'}</td>
                    <td className="py-3 px-4 text-[#0f172a] font-medium">{o.concept || '—'}</td>
                    <td className="py-3 px-4 text-[#334155]">{o.ministry || '—'}</td>
                    <td className="py-3 px-4 text-green-700">${Number(o.amount || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Widget de cumpleaños */}
      <div className="bg-white rounded-xl shadow p-6 max-w-5xl mx-auto mb-8">
        <div className="flex flex-wrap gap-3 mb-4 items-center">
          <span className="font-semibold text-navy">🎂 Cumpleaños próximos</span>
          <select
            className="border border-[#cbd5e1] rounded-lg px-3 py-1 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-[#0ea5e9]/30"
            value={birthdaySector}
            onChange={e => setBirthdaySector(e.target.value)}
          >
            <option value="todos">Todos los sectores</option>
            {ministerios.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
          <div className="flex gap-2">
            <button 
              className={`px-3 py-1 rounded text-sm font-medium ${cumpledorFilter === 'mes' ? 'bg-hunter text-cream' : 'bg-hunter/10 text-hunter'}`}
              onClick={() => setCumpledorFilter('mes')}
            >
              Mes
            </button>
            <button 
              className={`px-3 py-1 rounded text-sm font-medium ${cumpledorFilter === 'semana' ? 'bg-navy text-cream' : 'bg-navy/10 text-navy'}`}
              onClick={() => setCumpledorFilter('semana')}
            >
              Semana
            </button>
            <button 
              className={`px-3 py-1 rounded text-sm font-medium ${cumpledorFilter === 'dia' ? 'bg-gold text-navy' : 'bg-gold/10 text-gold'}`}
              onClick={() => setCumpledorFilter('dia')}
            >
              Hoy
            </button>
          </div>
        </div>
        {cumpledores.length === 0 ? (
          <div className="text-navy/60">No hay cumpleaños próximos en este período.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-navy/10">
                  <th className="py-2 px-4 text-left">Nombre</th>
                  <th className="py-2 px-4 text-left">Fecha de nacimiento</th>
                  <th className="py-2 px-4 text-left">Próximo cumpleaños</th>
                  <th className="py-2 px-4 text-left">Ministerio</th>
                  <th className="py-2 px-4 text-left">Teléfono</th>
                </tr>
              </thead>
              <tbody>
                {cumpledores.map((m, i) => (
                  <tr key={m.id || i} className="border-b border-navy/5 hover:bg-cream/30">
                    <td className="py-2 px-4 font-medium">{m.name}</td>
                    <td className="py-2 px-4">{m.birth}</td>
                    <td className="py-2 px-4">{m.proximoCumple.toLocaleDateString('es-ES', { weekday: 'short', month: 'short', day: 'numeric' })}</td>
                    <td className="py-2 px-4">{m.ministry || '—'}</td>
                    <td className="py-2 px-4">{m.phone || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default PanelControl
