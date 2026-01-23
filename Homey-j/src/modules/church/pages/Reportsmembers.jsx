import { useState, useEffect } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { listMembers } from '../../../core/data/membersService'
import { listChurches } from '../../../core/data/churchesService'
import { Combobox } from '@headlessui/react'
import { searchMembersByName } from '../../../core/data/membersService'
import { addReportMember, getReportTemplate } from '../../../core/data/reportsService'
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
  const [searchParams] = useSearchParams()
  const [customFields, setCustomFields] = useState([])
  const [customValues, setCustomValues] = useState({})

  useEffect(() => {
    listMembers(churchId).then(setMembers)
    listChurches().then(churches => {
      const found = churches.find(c => c.id === churchId)
      setChurchName(found?.name || 'Iglesia')
    })
    // Plantilla desde query param
    const tplParam = searchParams.get('tpl')
    if (tplParam) {
      try {
        const decoded = JSON.parse(atob(tplParam))
        if (Array.isArray(decoded)) setCustomFields(decoded.filter(Boolean))
      } catch (e) {
        console.warn('No se pudo leer la plantilla de campos personalizados')
      }
    } else {
      getReportTemplate(churchId).then(fields => setCustomFields(fields))
    }
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
      await addReportMember(churchId, { ...form, customFields: customValues })
      setSent(true)
      saveLocalName(form.name, form.ministry)
    } finally {
      setLoading(false)
    }
  }

  const handleCustomChange = (key, value) => {
    setCustomValues(prev => ({ ...prev, [key]: value }))
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
    <div className="min-h-screen bg-[#f8fafc] px-4 sm:px-8 py-8 flex items-center justify-center text-[#0f172a]">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-2xl relative">
        <div className="text-center mb-4">
          <p className="text-xs uppercase tracking-[0.2em] text-[#94a3b8]">Reporte semanal</p>
          <h2 className="text-2xl font-bold mt-1">{churchName}</h2>
          <h3 className="text-xl font-semibold mt-2">
            {form.name ? `¡Hola, ${form.name}!` : 'Reporte de miembros'}
          </h3>
        </div>
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
              <label className="block text-[#0f172a] font-semibold mb-1">Nombre</label>
              <Combobox value={form.name} onChange={val => {
                setForm(f => ({ ...f, name: val }))
                // Buscar solo el primer match exacto por nombre
                const m = nameOptions.find(opt => opt.name === val) || members.find(mem => mem.name === val)
                if (m) setForm(f => ({ ...f, ministry: m.ministry || '' }))
              }}>
                <div className="relative">
                  <Combobox.Input
                    className="border border-[#e2e8f0] rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-[#0ea5e9]/40"
                    displayValue={v => v}
                    onChange={e => {
                      setNameQuery(e.target.value)
                      setForm(f => ({ ...f, name: e.target.value }))
                    }}
                    placeholder="Nombre del miembro"
                    autoComplete="off"
                    spellCheck="false"
                    required
                  />
                  <Combobox.Options className="absolute z-10 mt-1 w-full bg-white border rounded shadow max-h-60 overflow-auto">
                    {loadingNames && (
                      <div className="px-4 py-2 text-[#475569]">Buscando...</div>
                    )}
                    {!loadingNames && nameOptions.length === 0 && nameQuery.length >= 2 && (
                      <div className="px-4 py-2 text-[#475569]">Sin resultados</div>
                    )}
                    {/* Mostrar solo el primer nombre exacto si hay duplicados */}
                    {Array.from(new Set(nameOptions.map(opt => opt.name))).map((name, idx) => {
                      const opt = nameOptions.find(o => o.name === name)
                      return (
                        <Combobox.Option
                          key={opt.id || name + idx}
                          value={name}
                          className={({ active }) => `mx-1 mt-1 px-4 py-2 rounded-lg cursor-pointer transition ${active ? 'bg-[#0ea5e9]/10 text-[#0f172a] ring-1 ring-[#0ea5e9]/30' : 'hover:bg-[#f8fafc]'}`}
                        >
                          {name}
                        </Combobox.Option>
                      )
                    })}
                  </Combobox.Options>
                </div>
              </Combobox>
            </div>
            <div>
              <label className="block text-[#0f172a] font-semibold mb-1">Ministerio</label>
              <input
                name="ministry"
                value={form.ministry}
                onChange={handleChange}
                list="report-ministries"
                className="border border-[#e2e8f0] rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-[#0ea5e9]/40"
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
                className="px-4 py-2 bg-[#0f172a] text-white rounded-lg shadow-md hover:shadow-lg hover:bg-black font-semibold mb-2 transition"
              >
                Agregar Persona / Hacer Reporte de otra persona
              </button>
              {showNameSelector && (
                <div className="bg-white border rounded shadow p-4 flex flex-col gap-2 z-10">
                  <div className="font-semibold mb-2 text-[#0f172a]">Selecciona un nombre usado:</div>
                  {localNames.map(n => (
                    <button
                      key={n}
                      type="button"
                      className="px-3 py-1 rounded-lg bg-[#0ea5e9] text-white shadow-sm hover:shadow-md hover:bg-[#0284c7] transition"
                      onClick={() => handleSelectPrevName(n)}
                    >
                      {n}
                    </button>
                  ))}
                  <button
                    type="button"
                    className="mt-2 px-3 py-1 rounded-lg bg-[#0f172a] text-white shadow-sm hover:shadow-md hover:bg-black transition"
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
              {customFields.map((field, idx) => (
                <div key={`${field}-${idx}`}>
                  <label className="block text-navy font-semibold mb-1">{field}</label>
                  <input
                    value={customValues[field] || ''}
                    onChange={e => handleCustomChange(field, e.target.value)}
                    className="border rounded px-3 py-2 w-full"
                    placeholder={field}
                  />
                </div>
              ))}
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
              <button type="submit" className="px-4 py-2 rounded-lg bg-[#0ea5e9] text-white font-semibold shadow-md hover:shadow-lg hover:bg-[#0284c7] transition">Enviar reporte</button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

export default Reportsmembers
