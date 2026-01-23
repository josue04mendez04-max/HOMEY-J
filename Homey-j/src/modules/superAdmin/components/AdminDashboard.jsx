import { useEffect, useState } from 'react'
import Button from '../../../shared/ui/Button'
import Card from '../../../shared/ui/Card'
import Input from '../../../shared/ui/Input'
import { createChurch, listChurches, toggleLock, deleteChurch } from '../../../core/data/churchesService'

function AdminDashboard({ onLock }) {
  const [churches, setChurches] = useState([])
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState('')
  const [pastor, setPastor] = useState('')
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [search, setSearch] = useState('')

  useEffect(() => {
    const load = async () => {
      try {
        const data = await listChurches()
        setChurches(data)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const handleCreate = async (e) => {
    e.preventDefault()
    setError('')
    if (!name.trim() || !pastor.trim()) {
      setError('Completa nombre y pastor')
      return
    }
    try {
      const created = await createChurch({ name: name.trim(), pastor: pastor.trim() })
      setChurches((prev) => [...prev, created])
      setName('')
      setPastor('')
      setShowForm(false)
    } catch (err) {
      setError(err.message)
    }
  }

  const handleToggle = async (id, isLocked) => {
    await toggleLock({ id, isLocked })
    setChurches((prev) => prev.map((c) => (c.id === id ? { ...c, isLocked } : c)))
  }

  const handleDelete = async (id) => {
    if (window.confirm('¿Seguro que deseas borrar esta iglesia? Esta acción no se puede deshacer.')) {
      await deleteChurch(id)
      setChurches(prev => prev.filter(c => c.id !== id))
    }
  }

  const totalChurches = churches.length
  const activeChurches = churches.filter(c => !c.isLocked).length
  const lockedChurches = churches.filter(c => c.isLocked).length
  const totalReports = 0 // Placeholder hasta que se integren reportes globales
  const totalPrayer = '11.0k' // Placeholder visual

  const filtered = churches.filter(c => {
    const term = search.trim().toLowerCase()
    if (!term) return true
    return (
      c.name?.toLowerCase().includes(term) ||
      c.id?.toLowerCase().includes(term) ||
      c.pastor?.toLowerCase().includes(term)
    )
  })

  return (
    <div className="min-h-screen bg-[#f8fafc] px-4 sm:px-8 py-8 text-[#0f172a]">
      <div className="flex items-center justify-between gap-4 mb-6">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-[#94a3b8]">Dashboard ▸ Iglesias</p>
          <h1 className="text-3xl font-semibold mt-1">Directorio de Iglesias</h1>
          <p className="text-sm text-[#64748b] mt-1">Supervisa iglesias, reportes semanales y credenciales de acceso.</p>
        </div>
        <Button variant="ghost" onClick={onLock}>
          Bloquear
        </Button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[2fr_1fr] gap-6 mb-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4 bg-white shadow-sm border border-[#e2e8f0]">
            <p className="text-xs text-[#94a3b8]">Total de Iglesias</p>
            <p className="text-2xl font-bold">{totalChurches}</p>
            <p className="text-xs text-green-600">Activo {activeChurches}</p>
          </Card>
          <Card className="p-4 bg-white shadow-sm border border-[#e2e8f0]">
            <p className="text-xs text-[#94a3b8]">Reportes Totales</p>
            <p className="text-2xl font-bold">{totalReports}</p>
            <p className="text-xs text-green-600">+5%</p>
          </Card>
          <Card className="p-4 bg-white shadow-sm border border-[#e2e8f0]">
            <p className="text-xs text-[#94a3b8]">Horas de oración</p>
            <p className="text-2xl font-bold">{totalPrayer}</p>
            <p className="text-xs text-green-600">0%</p>
          </Card>
          <Card className="p-4 bg-white shadow-sm border border-[#e2e8f0]">
            <p className="text-xs text-[#94a3b8]">En revisión</p>
            <p className="text-2xl font-bold">{lockedChurches}</p>
            <p className="text-xs text-amber-600">Acción necesaria</p>
          </Card>
        </div>

        <Card className="p-4 bg-white shadow-sm border border-[#e2e8f0]">
          <h3 className="text-base font-semibold mb-2">Centro de Soporte</h3>
          <p className="text-xs text-[#94a3b8] mb-3">Solicitudes de ayuda de las iglesias</p>
          <div className="h-24 flex items-center justify-center text-[#94a3b8] text-sm border border-dashed border-[#e2e8f0] rounded-lg">No hay solicitudes de soporte</div>
        </Card>
      </div>

      <div className="bg-white border border-[#e2e8f0] rounded-xl shadow-sm p-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
          <div className="flex items-center gap-2 w-full md:w-auto">
            <Input
              placeholder="Buscar por nombre, ID o pastor"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <Button variant="primary" className="w-full md:w-auto" onClick={() => setShowForm((v) => !v)}>
              Registrar nueva
            </Button>
          </div>
        </div>

        {showForm && (
          <div className="mb-4 border border-[#e2e8f0] rounded-lg p-3 bg-[#f8fafc]">
            <form className="grid grid-cols-1 md:grid-cols-3 gap-3" onSubmit={handleCreate}>
              <Input placeholder="Nombre de iglesia" value={name} onChange={(e) => setName(e.target.value)} />
              <Input placeholder="Nombre del pastor" value={pastor} onChange={(e) => setPastor(e.target.value)} />
              <div className="flex gap-2">
                <Button type="submit" className="w-full">Crear</Button>
                <Button type="button" variant="ghost" className="w-full" onClick={() => setShowForm(false)}>Cancelar</Button>
              </div>
            </form>
            {error && <p className="text-sm text-red-700 mt-2">{error}</p>}
          </div>
        )}

        <div className="overflow-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[#e2e8f0] text-[#94a3b8]">
                <th className="py-2 pr-4">Nombre de iglesia</th>
                <th className="py-2 pr-4">Pastor</th>
                <th className="py-2 pr-4">ID único</th>
                <th className="py-2 pr-4">Estado</th>
                <th className="py-2 pr-4">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && !loading && (
                <tr>
                  <td colSpan={5} className="py-4 text-center text-[#94a3b8]">No hay iglesias que coincidan.</td>
                </tr>
              )}
              {loading && (
                <tr>
                  <td colSpan={5} className="py-4 text-center text-[#94a3b8]">Cargando...</td>
                </tr>
              )}
              {filtered.map((church) => (
                <tr key={church.id} className="border-b border-[#f1f5f9]">
                  <td className="py-3 pr-4">
                    <div className="font-semibold text-[#0f172a]">{church.name || '—'}</div>
                    <div className="text-xs text-[#64748b]">{church.address || 'Sin dirección'}</div>
                    <a
                      href={`/app/${church.id}/dashboard`}
                      className="text-xs text-[#0ea5e9] underline hover:text-[#0284c7]"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Ver dashboard
                    </a>
                  </td>
                  <td className="py-3 pr-4 text-[#0f172a]">{church.pastor || '—'}</td>
                  <td className="py-3 pr-4 text-[#64748b]">{church.id}</td>
                  <td className="py-3 pr-4">
                    <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold ${church.isLocked ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                      {church.isLocked ? 'Inactiva' : 'Activa'}
                    </span>
                  </td>
                  <td className="py-3 pr-4">
                    <div className="flex gap-2 flex-wrap">
                      <Button
                        variant="ghost"
                        className="px-3 py-1 text-sm"
                        onClick={() => handleToggle(church.id, !church.isLocked)}
                      >
                        {church.isLocked ? 'Desbloquear' : 'Bloquear'}
                      </Button>
                      <Button
                        variant="ghost"
                        className="px-3 py-1 text-sm text-red-700"
                        onClick={() => handleDelete(church.id)}
                      >
                        Borrar
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard
