import { useEffect, useState } from 'react'
import Button from '../../../shared/ui/Button'
import Card from '../../../shared/ui/Card'
import Input from '../../../shared/ui/Input'
import { createChurch, listChurches, toggleLock } from '../../../core/data/churchesService'

function AdminDashboard({ onLock }) {
  const [churches, setChurches] = useState([])
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState('')
  const [pastor, setPastor] = useState('')
  const [error, setError] = useState('')

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
          <p className="text-sm uppercase tracking-[0.2em] text-gold">SuperAdmin</p>
          <h1 className="text-3xl font-serif">Panel de iglesias</h1>
        </div>
        <Button variant="ghost" onClick={onLock}>
          Bloquear
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <h2 className="text-2xl font-serif mb-4">Registrar iglesia</h2>
          <form className="flex flex-col gap-4" onSubmit={handleCreate}>
            <Input label="Nombre" value={name} onChange={(e) => setName(e.target.value)} />
            <Input label="Pastor" value={pastor} onChange={(e) => setPastor(e.target.value)} />
            {error && <p className="text-sm text-red-700">{error}</p>}
            <Button type="submit">Crear</Button>
          </form>
        </Card>

        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-serif">Iglesias registradas</h2>
            {loading && <span className="text-sm text-navy/70">Cargando...</span>}
          </div>
          <div className="overflow-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-navy/10 text-navy/70">
                  <th className="py-2 pr-4">Nombre</th>
                  <th className="py-2 pr-4">Pastor</th>
                  <th className="py-2 pr-4">Estado</th>
                  <th className="py-2 pr-4">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {churches.length === 0 && !loading && (
                  <tr>
                    <td colSpan={4} className="py-4 text-navy/60">
                      No hay iglesias registradas aún.
                    </td>
                  </tr>
                )}
                {churches.map((church) => (
                  <tr key={church.id} className="border-b border-navy/5">
                    <td className="py-2 pr-4 font-medium">{church.name}</td>
                    <td className="py-2 pr-4">{church.pastor}</td>
                    <td className="py-2 pr-4">
                      {church.isLocked ? (
                        <span className="text-red-700">Bloqueada</span>
                      ) : (
                        <span className="text-hunter">Activa</span>
                      )}
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
