import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { listMembers } from '../../../core/data/membersService'
import { listChurches } from '../../../core/data/churchesService'
import { listReportMembers } from '../../../core/data/reportsService'
import { Combobox } from '@headlessui/react'
import { Settings, Lock, Search } from 'lucide-react'
import { db } from '../../../core/firebase'
import { doc, updateDoc } from 'firebase/firestore'

function PanelControl() {
  const { churchId } = useParams()
  const [counts, setCounts] = useState({ miembros: 0, creyentes: 0, visitantes: 0 })
  const [loading, setLoading] = useState(true)
  const [reports, setReports] = useState([])
  const [reportsLoading, setReportsLoading] = useState(false)
  const [filter, setFilter] = useState({ periodo: 'todas', ministerio: 'todos' })
  const [showVidaModal, setShowVidaModal] = useState(false)
  const [miembros, setMiembros] = useState([])
  const [searchMember, setSearchMember] = useState('')
  const [selectedMember, setSelectedMember] = useState(null)
  const [historial, setHistorial] = useState([])
  const [cumpledorFilter, setCumpledorFilter] = useState('mes') // mes | semana | dia
  const [cumpledores, setCumpledores] = useState([])
  const [showPassword, setShowPassword] = useState(false)
  const [passwordInput, setPasswordInput] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [pastorName, setPastorName] = useState('')
  const [showConfig, setShowConfig] = useState(false)
  const [saving, setSaving] = useState(false)
  const [passwords, setPasswords] = useState({
    password_panel: '',
    password_membership: '',
    password_leadership: '',
    password_treasury: '',
    password_reports: ''
  })

  useEffect(() => {
    async function fetchCounts() {
      setLoading(true)
      const churches = await listChurches()
      const church = churches.find(c => c.id === churchId)
      if (church && church.password_panel) {
        setShowPassword(true)
      }
      if (church && church.pastorName) {
        setPastorName(church.pastorName)
      }
      setPasswords({
        password_panel: church?.password_panel || '',
        password_membership: church?.password_membership || '',
        password_leadership: church?.password_leadership || '',
        password_treasury: church?.password_treasury || '',
        password_reports: church?.password_reports || ''
      })
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
      {/* Indicadores de miembros, creyentes y visitantes */}
      {/* Indicadores de miembros, creyentes y visitantes - ahora arriba y fuera de la tabla */}
      <div className="w-full flex flex-wrap justify-center gap-6 mb-10">
        <div className="bg-white rounded-lg shadow p-6 flex flex-col items-center min-w-[140px]">
          <span className="text-3xl font-bold text-hunter">{loading ? '...' : counts.miembros}</span>
          <span className="text-navy/80 mt-2">Miembros</span>
        </div>
        <div className="bg-white rounded-lg shadow p-6 flex flex-col items-center min-w-[140px]">
          <span className="text-3xl font-bold text-navy">{loading ? '...' : counts.creyentes}</span>
          <span className="text-navy/80 mt-2">Creyentes</span>
        </div>
        <div className="bg-white rounded-lg shadow p-6 flex flex-col items-center min-w-[140px]">
          <span className="text-3xl font-bold text-gold">{loading ? '...' : counts.visitantes}</span>
          <span className="text-navy/80 mt-2">Visitantes</span>
        </div>
      </div>
      if (filter.ministerio !== 'todos') {
        all = all.filter(r => r.ministry === filter.ministerio)
      }
      setReports(all)
      setReportsLoading(false)
    }
    fetchReports()
  }, [churchId, filter])

  // Buscar historial de un miembro
  useEffect(() => {
    if (!selectedMember) return setHistorial([])
    setHistorial(reports.filter(r => r.name === selectedMember.name))
  }, [selectedMember, reports])

  // Calcular cumpleaños próximos
  useEffect(() => {
    if (miembros.length === 0) return
    const now = new Date()
    const currentMonth = now.getMonth()
    const currentDay = now.getDate()
    
    let filtered = miembros.filter(m => m.birth && typeof m.birth === 'string') // Solo miembros con fecha de nacimiento válida
    filtered = filtered.map(m => {
      const parts = m.birth.split('/')
      if (parts.length < 2) return null
      const day = parseInt(parts[0], 10)
      const month = parseInt(parts[1], 10)
      if (!day || !month || day < 1 || day > 31 || month < 1 || month > 12) return null
      
      // Crear fecha de próximo cumpleaños (solo considerando mes y día)
      let birthDate = new Date(now.getFullYear(), month - 1, day)
      if (birthDate < now) {
        birthDate = new Date(now.getFullYear() + 1, month - 1, day)
      }
      return { ...m, proximoCumple: birthDate, birthMonth: month, birthDay: day }
    }).filter(Boolean)
    
    // Filtrar por período
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
    
    // Ordenar por fecha próxima
    filtered.sort((a, b) => a.proximoCumple - b.proximoCumple)
    setCumpledores(filtered)
  }, [miembros, cumpledorFilter])
  // Opciones de ministerio únicas
  const ministerios = Array.from(new Set(miembros.map(m => m.ministry).filter(Boolean)))
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

  const handlePasswordSubmit = async (e) => {
    e.preventDefault()
    setPasswordError('')
    const churches = await listChurches()
    const church = churches.find(c => c.id === churchId)
    if (church && church.password_panel !== passwordInput) {
      setPasswordError('Contraseña incorrecta.')
      return
    }
    setShowPassword(false)
  }

  async function handleSavePasswords(e) {
    e.preventDefault()
    setSaving(true)
    const ref = doc(db, 'churches_registry', churchId)
    await updateDoc(ref, {
      password_panel: passwords.password_panel,
      password_membership: passwords.password_membership,
      password_leadership: passwords.password_leadership,
      password_treasury: passwords.password_treasury,
      password_reports: passwords.password_reports
    })
    setSaving(false)
    setShowConfig(false)
  }

  return (
    <div className="p-6">
      {/* Modal de configuración */}
      {showConfig && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-lg relative">
            <button className="absolute top-3 right-3 text-gray-400 hover:text-gray-700" onClick={() => setShowConfig(false)}>&times;</button>
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2"><Lock size={22}/> Configuración de contraseñas</h2>
            <form className="flex flex-col gap-4" onSubmit={handleSavePasswords}>
              <label className="flex flex-col text-left">
                Panel de Control
                <input type="password" className="border rounded px-3 py-2 mt-1" value={passwords.password_panel} onChange={e => setPasswords(p => ({...p, password_panel: e.target.value}))} />
              </label>
              <label className="flex flex-col text-left">
                Membresía
                <input type="password" className="border rounded px-3 py-2 mt-1" value={passwords.password_membership} onChange={e => setPasswords(p => ({...p, password_membership: e.target.value}))} />
              </label>
              <label className="flex flex-col text-left">
                Liderazgo
                <input type="password" className="border rounded px-3 py-2 mt-1" value={passwords.password_leadership} onChange={e => setPasswords(p => ({...p, password_leadership: e.target.value}))} />
              </label>
              <label className="flex flex-col text-left">
                Tesorería
                <input type="password" className="border rounded px-3 py-2 mt-1" value={passwords.password_treasury} onChange={e => setPasswords(p => ({...p, password_treasury: e.target.value}))} />
              </label>
              <label className="flex flex-col text-left">
                Reporte
                <input type="password" className="border rounded px-3 py-2 mt-1" value={passwords.password_reports} onChange={e => setPasswords(p => ({...p, password_reports: e.target.value}))} />
              </label>
              <button type="submit" className="mt-2 px-6 py-2 rounded-full bg-green-500 text-white font-semibold shadow hover:bg-green-600 transition" disabled={saving}>{saving ? 'Guardando...' : 'Guardar'}</button>
            </form>
          </div>
        </div>
      )}

      {showPassword && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md">
            <h2 className="text-2xl font-bold mb-4 text-hunter">Ingresa la contraseña de tu iglesia</h2>
            <form className="flex flex-col gap-4" onSubmit={handlePasswordSubmit}>
              <input
                type="password"
                value={passwordInput}
                onChange={e => setPasswordInput(e.target.value)}
                className="border rounded px-3 py-2"
                placeholder="Contraseña"
                required
              />
              {passwordError && <p className="text-sm text-red-700">{passwordError}</p>}
              <button type="submit" className="px-4 py-2 rounded bg-hunter text-cream">Entrar</button>
            </form>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-serif">Panel de Control</h2>
        <button title="Configuración" className="p-2 rounded-full hover:bg-gray-100 transition" onClick={() => setShowConfig(true)}>
          <Settings size={26} className="text-bank-700" />
        </button>
      </div>
      {pastorName && (
        <div className="mb-6 text-lg font-semibold text-bank-700">¡Bienvenido, Pastor {pastorName}!</div>
      )}

      {/* Indicadores de miembros, creyentes y visitantes - ahora arriba y fuera de la tabla */}
      <div className="w-full flex flex-wrap justify-center gap-6 mb-10">
        <div className="bg-white rounded-lg shadow p-6 flex flex-col items-center min-w-[140px]">
          <span className="text-3xl font-bold text-hunter">{loading ? '...' : counts.miembros}</span>
          <span className="text-navy/80 mt-2">Miembros</span>
        </div>
        <div className="bg-white rounded-lg shadow p-6 flex flex-col items-center min-w-[140px]">
          <span className="text-3xl font-bold text-navy">{loading ? '...' : counts.creyentes}</span>
          <span className="text-navy/80 mt-2">Creyentes</span>
        </div>
        <div className="bg-white rounded-lg shadow p-6 flex flex-col items-center min-w-[140px]">
          <span className="text-3xl font-bold text-gold">{loading ? '...' : counts.visitantes}</span>
          <span className="text-navy/80 mt-2">Visitantes</span>
        </div>
      </div>

      {/* Sección de reportes */}
      <div className="bg-white rounded-xl shadow p-6 max-w-5xl mx-auto mb-8">
        <div className="flex flex-wrap gap-2 mb-4 items-center">
          <span className="font-semibold text-navy">Reportes de miembros</span>
          <select className="border rounded px-2 py-1" value={filter.periodo} onChange={e => setFilter(f => ({...f, periodo: e.target.value}))}>
            <option value="todas">Todas las fechas</option>
            <option value="semana">Esta semana</option>
            <option value="mes">Este mes</option>
          </select>
          <select className="border rounded px-2 py-1" value={filter.ministerio} onChange={e => setFilter(f => ({...f, ministerio: e.target.value}))}>
            <option value="todos">Todos los ministerios</option>
            {ministerios.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
          <button className="ml-auto px-4 py-2 rounded bg-hunter text-cream font-semibold hover:bg-hunter/90 flex items-center gap-2" onClick={() => setShowVidaModal(true)}>
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
                <tr className="border-b border-navy/10">
                  <th className="py-2 px-4">Nombre</th>
                  <th className="py-2 px-4">Fecha</th>
                  <th className="py-2 px-4">Ministerio</th>
                  <th className="py-2 px-4">Capítulos</th>
                  <th className="py-2 px-4">Horas</th>
                  <th className="py-2 px-4">Ayunos</th>
                  <th className="py-2 px-4">Almas</th>
                  <th className="py-2 px-4">Altar</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((r, i) => (
                  <tr key={r.id || i} className="border-b border-navy/5">
                    <td className="py-2 px-4">{r.name}</td>
                    <td className="py-2 px-4">{r.createdAt?.seconds ? new Date(r.createdAt.seconds * 1000).toLocaleDateString() : '—'}</td>
                    <td className="py-2 px-4">{r.ministry}</td>
                    <td className="py-2 px-4">{r.capitulos}</td>
                    <td className="py-2 px-4">{r.horas}</td>
                    <td className="py-2 px-4">{r.ayunos}</td>
                    <td className="py-2 px-4">{r.almas}</td>
                    <td className="py-2 px-4">{r.altar}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {showVidaModal && <VidaEspiritualModal />}

      {/* Widget de cumpleaños */}
      <div className="bg-white rounded-xl shadow p-6 max-w-5xl mx-auto mb-8">
        <div className="flex flex-wrap gap-2 mb-4 items-center">
          <span className="font-semibold text-navy">🎂 Cumpleaños próximos</span>
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
