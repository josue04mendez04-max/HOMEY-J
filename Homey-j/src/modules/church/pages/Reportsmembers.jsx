import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { listMembers } from '../../../core/data/membersService'
import { listChurches } from '../../../core/data/churchesService'
import { Combobox } from '@headlessui/react'
import { searchMembersByName } from '../../../core/data/membersService'
import { addReportMember } from '../../../core/data/reportsService'
import Spinner from '../../../shared/ui/Spinner'

function Reportsmembers() {
  const { churchId } = useParams()
  const [members, setMembers] = useState([])
  const [churchName, setChurchName] = useState('Iglesia')
  const [localNames, setLocalNames] = useState([])
  const [showNameSelector, setShowNameSelector] = useState(false)
  const [form, setForm] = useState({
    name: '',
    ministry: '',
    capitulos: 0,
    horas: 0,
    ayunos: 0,
    almas: 0,
    altar: '',
  })
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [nameQuery, setNameQuery] = useState('')
  const [nameOptions, setNameOptions] = useState([])
  const [loadingNames, setLoadingNames] = useState(false)

  useEffect(() => {
    listMembers(churchId).then(setMembers)
    listChurches().then(churches => {
      const found = churches.find(c => c.id === churchId)
      setChurchName(found?.name || 'Iglesia')
    })
    // Persistencia local
    const saved = localStorage.getItem('homeyj.reportmember')
    if (saved) {
      const { name, ministry } = JSON.parse(saved)
      setForm(f => ({ ...f, name, ministry }))
    }
    const usedNames = localStorage.getItem('homeyj.reportmember.names')
    if (usedNames) setLocalNames(JSON.parse(usedNames))
  }, [churchId])

  useEffect(() => {
    let active = true
    if (nameQuery.length < 2) {
      setNameOptions([])
      return
    }
    setLoadingNames(true)
    searchMembersByName(churchId, nameQuery).then(res => {
      if (active) setNameOptions(res)
      setLoadingNames(false)
    })
    return () => { active = false }
  }, [nameQuery, churchId])

  const saveLocalName = (name, ministry) => {
    localStorage.setItem('homeyj.reportmember', JSON.stringify({ name, ministry }))
    setLocalNames(prev => {
      const arr = prev.includes(name) ? prev : [...prev, name]
      localStorage.setItem('homeyj.reportmember.names', JSON.stringify(arr))
      return arr
    })
  }

  const handleChange = e => {
    const { name, value, type } = e.target
    setForm({ ...form, [name]: type === 'number' ? Number(value) : value })
    if (name === 'name') {
      const m = members.find(mem => mem.name === value)
      if (m) setForm(f => ({ ...f, ministry: m.ministry || '' }))
    }
  }

  const handlePop = (field, delta) => {
    setForm(f => ({ ...f, [field]: Math.max(0, Number(f[field] || 0) + delta) }))
  }

  const handleSubmit = async e => {
    e.preventDefault()
    setLoading(true)
    try {
      await addReportMember(churchId, form)
      setSent(true)
      saveLocalName(form.name, form.ministry)
    } finally {
      setLoading(false)
    }
  }

  const handleAddPerson = () => {
    if (localNames.length > 1) {
      setShowNameSelector(true)
    } else {
      setForm({ name: '', ministry: '', capitulos: 0, horas: 0, ayunos: 0, almas: 0, altar: '' })
    }
  }

  const handleSelectPrevName = (name) => {
    const m = members.find(mem => mem.name === name)
    setForm(f => ({
      ...f,
      name,
      ministry: m?.ministry || ''
    }))
    setShowNameSelector(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-cream">
      <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-2xl relative">
        <h2 className="text-2xl font-bold mb-4 text-center">{churchName}</h2>
        <h3 className="text-xl font-semibold mb-4 text-center">
          {form.name ? `¡Hola, ${form.name}!` : 'Reporte de miembros'}
        </h3>
        {sent ? (
          <div className="text-green-700 font-semibold text-lg">¡Reporte enviado correctamente!</div>
        ) : loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Spinner size={48} />
            <span className="mt-4 text-navy/80 font-medium">Enviando reporte...</span>
          </div>
        ) : (
          <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-navy font-semibold mb-1">Nombre</label>
              <Combobox value={form.name} onChange={val => {
                setForm(f => ({ ...f, name: val }))
                // Buscar solo el primer match exacto por nombre
                const m = nameOptions.find(opt => opt.name === val) || members.find(mem => mem.name === val)
                if (m) setForm(f => ({ ...f, ministry: m.ministry || '' }))
              }}>
                <div className="relative">
                  <Combobox.Input
                    className="border rounded px-3 py-2 w-full"
                    displayValue={v => v}
                    onChange={e => {
                      setNameQuery(e.target.value)
                      setForm(f => ({ ...f, name: e.target.value }))
                    }}
                    placeholder="Nombre del miembro"
                    required
                  />
                  <Combobox.Options className="absolute z-10 mt-1 w-full bg-white border rounded shadow max-h-60 overflow-auto">
                    {loadingNames && (
                      <div className="px-4 py-2 text-navy">Buscando...</div>
                    )}
                    {!loadingNames && nameOptions.length === 0 && nameQuery.length >= 2 && (
                      <div className="px-4 py-2 text-navy">Sin resultados</div>
                    )}
                    {/* Mostrar solo el primer nombre exacto si hay duplicados */}
                    {Array.from(new Set(nameOptions.map(opt => opt.name))).map((name, idx) => {
                      const opt = nameOptions.find(o => o.name === name)
                      return (
                        <Combobox.Option key={opt.id || name + idx} value={name} className={({ active }) => `px-4 py-2 cursor-pointer ${active ? 'bg-hunter text-cream' : ''}`}>
                          {name}
                        </Combobox.Option>
                      )
                    })}
                  </Combobox.Options>
                </div>
              </Combobox>
            </div>
            <div>
              <label className="block text-navy font-semibold mb-1">Ministerio</label>
              <input
                name="ministry"
                value={form.ministry}
                onChange={handleChange}
                list="report-ministries"
                className="border rounded px-3 py-2 w-full"
                placeholder="Ministerio"
                required
              />
              <datalist id="report-ministries">
                {[...new Set(members.map(m => m.ministry).filter(Boolean))].map(min => <option key={min} value={min} />)}
              </datalist>
            </div>
            <div className="flex flex-col items-center mb-2">
              <button
                type="button"
                onClick={handleAddPerson}
                className="px-4 py-2 bg-navy text-cream rounded shadow hover:bg-navy/80 font-semibold mb-2"
              >
                Agregar Persona / Hacer Reporte de otra persona
              </button>
              {showNameSelector && (
                <div className="bg-white border rounded shadow p-4 flex flex-col gap-2 z-10">
                  <div className="font-semibold mb-2 text-navy">Selecciona un nombre usado:</div>
                  {localNames.map(n => (
                    <button
                      key={n}
                      type="button"
                      className="px-3 py-1 rounded bg-hunter text-cream hover:bg-hunter/80"
                      onClick={() => handleSelectPrevName(n)}
                    >
                      {n}
                    </button>
                  ))}
                  <button
                    type="button"
                    className="mt-2 px-3 py-1 rounded bg-navy text-cream hover:bg-navy/80"
                    onClick={() => {
                      setForm({ name: '', ministry: '', capitulos: 0, horas: 0, ayunos: 0, almas: 0, altar: '' })
                      setShowNameSelector(false)
                    }}
                  >
                    Nuevo nombre
                  </button>
                </div>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-navy font-semibold mb-1">Capítulos leídos</label>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => handlePop('capitulos', -1)} className="px-2 py-1 bg-navy text-cream rounded-full text-lg">-</button>
                  <input name="capitulos" value={form.capitulos} onChange={handleChange} type="number" min="0" className="border rounded px-3 py-2 w-20 text-center" required />
                  <button type="button" onClick={() => handlePop('capitulos', 1)} className="px-2 py-1 bg-hunter text-cream rounded-full text-lg">+</button>
                </div>
              </div>
              <div>
                <label className="block text-navy font-semibold mb-1">Horas de oración</label>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => handlePop('horas', -1)} className="px-2 py-1 bg-navy text-cream rounded-full text-lg">-</button>
                  <input name="horas" value={form.horas} onChange={handleChange} type="number" min="0" className="border rounded px-3 py-2 w-20 text-center" required />
                  <button type="button" onClick={() => handlePop('horas', 1)} className="px-2 py-1 bg-hunter text-cream rounded-full text-lg">+</button>
                </div>
              </div>
              <div>
                <label className="block text-navy font-semibold mb-1">Ayunos</label>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => handlePop('ayunos', -1)} className="px-2 py-1 bg-navy text-cream rounded-full text-lg">-</button>
                  <input name="ayunos" value={form.ayunos} onChange={handleChange} type="number" min="0" className="border rounded px-3 py-2 w-20 text-center" required />
                  <button type="button" onClick={() => handlePop('ayunos', 1)} className="px-2 py-1 bg-hunter text-cream rounded-full text-lg">+</button>
                </div>
              </div>
              <div>
                <label className="block text-navy font-semibold mb-1">Almas evangelizadas</label>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => handlePop('almas', -1)} className="px-2 py-1 bg-navy text-cream rounded-full text-lg">-</button>
                  <input name="almas" value={form.almas} onChange={handleChange} type="number" min="0" className="border rounded px-3 py-2 w-20 text-center" required />
                  <button type="button" onClick={() => handlePop('almas', 1)} className="px-2 py-1 bg-hunter text-cream rounded-full text-lg">+</button>
                </div>
              </div>
              <div className="md:col-span-2">
                <label className="block text-navy font-semibold mb-1">Altar Familiar</label>
                <div className="flex gap-4 mt-1">
                  <button
                    type="button"
                    className={`px-6 py-2 rounded-full font-bold border transition ${form.altar === 'Sí' ? 'bg-hunter text-cream border-hunter' : 'bg-cream text-navy border-navy hover:bg-hunter/10'}`}
                    onClick={() => setForm(f => ({ ...f, altar: 'Sí' }))}
                  >
                    Sí
                  </button>
                  <button
                    type="button"
                    className={`px-6 py-2 rounded-full font-bold border transition ${form.altar === 'No' ? 'bg-red-600 text-cream border-red-600' : 'bg-cream text-navy border-navy hover:bg-red-100'}`}
                    onClick={() => setForm(f => ({ ...f, altar: 'No' }))}
                  >
                    No
                  </button>
                </div>
              </div>
            </div>
            <div className="flex gap-2 justify-end mt-4">
              <button type="submit" className="px-4 py-2 rounded bg-hunter text-cream">Enviar reporte</button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

export default Reportsmembers
