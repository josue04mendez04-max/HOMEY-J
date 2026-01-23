import { useEffect, useState } from 'react'
import Button from '../../../shared/ui/Button'
import Card from '../../../shared/ui/Card'
import Input from '../../../shared/ui/Input'
import { createChurch, listChurches, toggleLock, setChurchPassword, deleteChurch } from '../../../core/data/churchesService'
  const handleDelete = async (id) => {
    if (window.confirm('¿Seguro que deseas borrar esta iglesia? Esta acción no se puede deshacer.')) {
      await deleteChurch(id)
      setChurches(prev => prev.filter(c => c.id !== id))
    }
  }

function AdminDashboard({ onLock }) {
  const [churches, setChurches] = useState([])
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState('')
  const [pastor, setPastor] = useState('')
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)

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
    } catch (err) {
      setError(err.message)
    }
  }

  const handleToggle = async (id, isLocked) => {
    await toggleLock({ id, isLocked })
    setChurches((prev) => prev.map((c) => (c.id === id ? { ...c, isLocked } : c)))
  }

  return (
    <div className="min-h-screen bg-cream px-6 py-10 text-navy">
      <div className="flex items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-serif mb-2">Bienvenido Josue Mendez</h1>
          <p className="text-lg font-serif text-hunter mb-1">Homey-j</p>
          <Card className="mb-2 bg-white/90 border-gold/40">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              <div>
                <p className="text-xs text-navy/70">Usuarios</p>
                <p className="text-xl font-bold text-navy">—</p>
              </div>
              <div>
                <p className="text-xs text-navy/70">Iglesias activas</p>
                <p className="text-xl font-bold text-navy">{churches.filter(c => !c.isLocked).length}</p>
              </div>
              <div>
                <p className="text-xs text-navy/70">Próximos pagos</p>
                <p className="text-xl font-bold text-navy">—</p>
              </div>
              <div>
                <p className="text-xs text-navy/70">Generado total</p>
                <p className="text-xl font-bold text-navy">—</p>
              </div>
              <div>
                <p className="text-xs text-navy/70">Total reportes</p>
                <p className="text-xl font-bold text-navy">—</p>
              </div>
            </div>
          </Card>
        </div>
        <Button variant="ghost" onClick={onLock}>
          Bloquear
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <h2 className="text-2xl font-serif mb-4">Registrar iglesia</h2>
          {!showForm ? (
            <Button variant="primary" onClick={() => setShowForm(true)}>
              Crear nueva iglesia
            </Button>
          ) : (
            <form className="flex flex-col gap-4" onSubmit={handleCreate}>
              <Input label="Nombre" value={name} onChange={(e) => setName(e.target.value)} />
              <Input label="Pastor" value={pastor} onChange={(e) => setPastor(e.target.value)} />
              {error && <p className="text-sm text-red-700">{error}</p>}
              <div className="flex gap-2">
                <Button type="submit">Crear</Button>
                <Button variant="ghost" type="button" onClick={() => setShowForm(false)}>
                  Cancelar
                </Button>
              </div>
            </form>
          )}
        </Card>

        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-serif">Iglesias</h2>
            {loading && <span className="text-sm text-navy/70">Cargando...</span>}
          </div>
          <div className="overflow-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-navy/10 text-navy/70">
                  <th className="py-2 pr-4">Nombre</th>
                  <th className="py-2 pr-4">Pastor</th>
                  <th className="py-2 pr-4">Usuarios</th>
                  <th className="py-2 pr-4">Reportes</th>
                  <th className="py-2 pr-4">Estado</th>
                  <th className="py-2 pr-4">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {churches.length === 0 && !loading && (
                  <tr>
                    <td colSpan={6} className="py-4 text-navy/60">
                      No hay iglesias registradas aún.
                    </td>
                  </tr>
                )}
                {churches.map((church) => (
                  <tr key={church.id} className="border-b border-navy/5">
                    <td className="py-2 pr-4 font-medium flex flex-col gap-1">
                      {church.name}
                      <a
                        href={`/app/${church.id}/dashboard`}
                        className="text-xs text-hunter underline hover:text-hunter/80"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Ir al dashboard
                      </a>
                    </td>
                    <td className="py-2 pr-4">{church.pastor}</td>
                    <td className="py-2 pr-4">—</td>
                    <td className="py-2 pr-4">—</td>
                    <td className="py-2 pr-4">
                      <span className={church.isLocked ? "text-red-700 flex items-center gap-1" : "text-hunter flex items-center gap-1"}>
                        {church.isLocked ? (
                          <>
                            <svg xmlns="http://www.w3.org/2000/svg" className="inline" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 17a2 2 0 100-4 2 2 0 000 4zm6-7V7a6 6 0 10-12 0v3M5 10h14a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2z" /></svg>
                            Bloqueada
                          </>
                        ) : (
                          <>
                            <svg xmlns="http://www.w3.org/2000/svg" className="inline" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 17a2 2 0 100-4 2 2 0 000 4zm6-7V7a6 6 0 10-12 0v3M5 10h14a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2z" /></svg>
                            Activa
                          </>
                        )}
                      </span>
                    </td>
                    <td className="py-2 pr-4">
                      <div className="flex gap-2">
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
        </Card>
      </div>
    </div>
  )
}

export default AdminDashboard
