import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { addFinanceRecord, listFinanceRecords } from '../../../core/data/financesService'
import { listMembers, searchMembersByName } from '../../../core/data/membersService'
import { Combobox } from '@headlessui/react'

function Treasury() {
  const { churchId } = useParams()
  const [income, setIncome] = useState({ cantidad: '', tipo: 'efectivo', concepto: '', fecha: new Date().toISOString().slice(0, 10), responsable: '' })
  const [expense, setExpense] = useState({ cantidad: '', tipo: 'efectivo', concepto: '', fecha: new Date().toISOString().slice(0, 10), responsable: '' })
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [members, setMembers] = useState([])
  const [tab, setTab] = useState('contabilidad')
  // Para Combobox de responsable
  const [incomeQuery, setIncomeQuery] = useState('')
  const [incomeOptions, setIncomeOptions] = useState([])
  const [loadingIncomeNames, setLoadingIncomeNames] = useState(false)
  const [expenseQuery, setExpenseQuery] = useState('')
  const [expenseOptions, setExpenseOptions] = useState([])
  const [loadingExpenseNames, setLoadingExpenseNames] = useState(false)
  // Efecto para buscar responsables en ingresos
  useEffect(() => {
    let active = true
    if (incomeQuery.length < 2) {
      setIncomeOptions([])
      return
    }
    setLoadingIncomeNames(true)
    searchMembersByName(churchId, incomeQuery).then(res => {
      if (active) setIncomeOptions(res)
      setLoadingIncomeNames(false)
    })
    return () => { active = false }
  }, [incomeQuery, churchId])

  // Efecto para buscar responsables en egresos
  useEffect(() => {
    let active = true
    if (expenseQuery.length < 2) {
      setExpenseOptions([])
      return
    }
    setLoadingExpenseNames(true)
    searchMembersByName(churchId, expenseQuery).then(res => {
      if (active) setExpenseOptions(res)
      setLoadingExpenseNames(false)
    })
    return () => { active = false }
  }, [expenseQuery, churchId])

  useEffect(() => {
    async function fetchAll() {
      setLoading(true)
      const [data, mems] = await Promise.all([
        listFinanceRecords(churchId),
        listMembers(churchId)
      ])
      setRecords(data.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)))
      setMembers(mems)
      setLoading(false)
    }
    fetchAll()
  }, [churchId])

  // Relleno automático reactivo para responsable (ingreso)
  useEffect(() => {
    if (members.length > 0 && !income.responsable) {
      setIncome(i => ({ ...i, responsable: members[0].name }))
    }
  }, [members, income.responsable])

  // Relleno automático reactivo para responsable (egreso)
  useEffect(() => {
    if (members.length > 0 && !expense.responsable) {
      setExpense(e => ({ ...e, responsable: members[0].name }))
    }
  }, [members, expense.responsable])

  const handleIncomeChange = e => {
    setIncome({ ...income, [e.target.name]: e.target.value })
  }
  const handleExpenseChange = e => {
    setExpense({ ...expense, [e.target.name]: e.target.value })
  }

  const handleIncomeSubmit = async e => {
    e.preventDefault()
    await addFinanceRecord(churchId, 'ingreso', income)
    setIncome(i => ({ ...i, cantidad: '', tipo: 'efectivo', concepto: '', fecha: new Date().toISOString().slice(0, 10) }))
    const data = await listFinanceRecords(churchId)
    setRecords(data.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)))
    // Autorelleno responsable
    if (members.length > 0) setIncome(i => ({ ...i, responsable: members[0].name }))
  }
  const handleExpenseSubmit = async e => {
    e.preventDefault()
    await addFinanceRecord(churchId, 'egreso', expense)
    setExpense(e => ({ ...e, cantidad: '', tipo: 'efectivo', concepto: '', fecha: new Date().toISOString().slice(0, 10) }))
    const data = await listFinanceRecords(churchId)
    setRecords(data.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)))
    // Autorelleno responsable
    if (members.length > 0) setExpense(e => ({ ...e, responsable: members[0].name }))
  }

  return (
    <div className="p-6">
      <div className="flex gap-4 mb-8">
        <button
          className={`px-4 py-2 rounded font-semibold transition ${tab === 'corte' ? 'bg-hunter text-cream' : 'bg-hunter/10 text-hunter'}`}
          onClick={() => setTab('corte')}
        >Corte de caja</button>
        <button
          className={`px-4 py-2 rounded font-semibold transition ${tab === 'contabilidad' ? 'bg-navy text-cream' : 'bg-navy/10 text-navy'}`}
          onClick={() => setTab('contabilidad')}
        >Contabilidad</button>
        <button
          className={`px-4 py-2 rounded font-semibold transition ${tab === 'historial' ? 'bg-gold text-navy' : 'bg-gold/10 text-gold'}`}
          onClick={() => setTab('historial')}
        >Historial</button>
      </div>
      {tab === 'contabilidad' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
        {/* Modal de Ingreso */}
        <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md mx-auto">
          <h2 className="text-xl font-bold mb-4 text-hunter">Registrar Ingreso</h2>
          <form className="flex flex-col gap-4" onSubmit={handleIncomeSubmit}>
            <input name="cantidad" value={income.cantidad} onChange={handleIncomeChange} type="number" min="0" step="0.01" placeholder="Cantidad" className="border rounded px-3 py-2" required />
            <select name="tipo" value={income.tipo} onChange={handleIncomeChange} className="border rounded px-3 py-2" required>
              <option value="efectivo">Efectivo</option>
              <option value="transferencia">Transferencia</option>
            </select>
            <input name="concepto" value={income.concepto} onChange={handleIncomeChange} placeholder="Concepto" className="border rounded px-3 py-2" required />
            <input name="fecha" value={income.fecha} onChange={handleIncomeChange} type="date" className="border rounded px-3 py-2" required />
            <Combobox value={income.responsable} onChange={val => setIncome(i => ({ ...i, responsable: val }))}>
              <div className="relative">
                <Combobox.Input
                  className="border rounded px-3 py-2 w-full"
                  displayValue={v => v}
                  onChange={e => {
                    setIncomeQuery(e.target.value)
                    setIncome(i => ({ ...i, responsable: e.target.value }))
                  }}
                  placeholder="Responsable"
                  required
                />
                <Combobox.Options className="absolute z-10 mt-1 w-full bg-white border rounded shadow max-h-60 overflow-auto">
                  {loadingIncomeNames && (
                    <div className="px-4 py-2 text-navy">Buscando...</div>
                  )}
                  {!loadingIncomeNames && incomeOptions.length === 0 && incomeQuery.length >= 2 && (
                    <div className="px-4 py-2 text-navy">Sin resultados</div>
                  )}
                  {incomeOptions.map(opt => (
                    <Combobox.Option key={opt.id} value={opt.name} className={({ active }) => `px-4 py-2 cursor-pointer ${active ? 'bg-hunter text-cream' : ''}`}>
                      {opt.name}
                    </Combobox.Option>
                  ))}
                </Combobox.Options>
              </div>
            </Combobox>
            <button type="submit" className="px-4 py-2 rounded bg-hunter text-cream">Guardar ingreso</button>
          </form>
        </div>
        {/* Modal de Egreso */}
        <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md mx-auto">
          <h2 className="text-xl font-bold mb-4 text-navy">Registrar Egreso</h2>
          <form className="flex flex-col gap-4" onSubmit={handleExpenseSubmit}>
            <input name="cantidad" value={expense.cantidad} onChange={handleExpenseChange} type="number" min="0" step="0.01" placeholder="Cantidad" className="border rounded px-3 py-2" required />
            <select name="tipo" value={expense.tipo} onChange={handleExpenseChange} className="border rounded px-3 py-2" required>
              <option value="efectivo">Efectivo</option>
              <option value="transferencia">Transferencia</option>
            </select>
            <input name="concepto" value={expense.concepto} onChange={handleExpenseChange} placeholder="Concepto" className="border rounded px-3 py-2" required />
            <input name="fecha" value={expense.fecha} onChange={handleExpenseChange} type="date" className="border rounded px-3 py-2" required />
            <Combobox value={expense.responsable} onChange={val => setExpense(e => ({ ...e, responsable: val }))}>
              <div className="relative">
                <Combobox.Input
                  className="border rounded px-3 py-2 w-full"
                  displayValue={v => v}
                  onChange={e => {
                    setExpenseQuery(e.target.value)
                    setExpense(ex => ({ ...ex, responsable: e.target.value }))
                  }}
                  placeholder="Responsable"
                  required
                />
                <Combobox.Options className="absolute z-10 mt-1 w-full bg-white border rounded shadow max-h-60 overflow-auto">
                  {loadingExpenseNames && (
                    <div className="px-4 py-2 text-navy">Buscando...</div>
                  )}
                  {!loadingExpenseNames && expenseOptions.length === 0 && expenseQuery.length >= 2 && (
                    <div className="px-4 py-2 text-navy">Sin resultados</div>
                  )}
                  {expenseOptions.map(opt => (
                    <Combobox.Option key={opt.id} value={opt.name} className={({ active }) => `px-4 py-2 cursor-pointer ${active ? 'bg-navy text-cream' : ''}`}>
                      {opt.name}
                    </Combobox.Option>
                  ))}
                </Combobox.Options>
              </div>
            </Combobox>
            <button type="submit" className="px-4 py-2 rounded bg-navy text-cream">Guardar egreso</button>
          </form>
        </div>
      </div>
          <div className="bg-white rounded-xl shadow p-6 max-w-3xl mx-auto">
            <h3 className="text-lg font-bold mb-4">Registros recientes</h3>
            {loading ? (
              <div className="text-navy/60">Cargando...</div>
            ) : records.length === 0 ? (
              <div className="text-navy/60">No hay registros aún.</div>
            ) : (
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-navy/10">
                    <th className="py-2 px-4">ID</th>
                    <th className="py-2 px-4">Tipo</th>
                    <th className="py-2 px-4">Cantidad</th>
                    <th className="py-2 px-4">Concepto</th>
                    <th className="py-2 px-4">Responsable</th>
                    <th className="py-2 px-4">Fecha</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map(r => (
                    <tr key={r.id} className={`border-b border-navy/5 ${r.kind === 'ingreso' ? 'bg-green-50' : r.kind === 'egreso' ? 'bg-red-50' : ''}`}> 
                      <td className="py-2 px-4 font-mono text-xs">{r.id}</td>
                      <td className="py-2 px-4 capitalize">{r.kind}</td>
                      <td className="py-2 px-4">{r.cantidad}</td>
                      <td className="py-2 px-4">{r.concepto}</td>
                      <td className="py-2 px-4">{r.responsable}</td>
                      <td className="py-2 px-4">{r.fecha || (r.createdAt && new Date(r.createdAt.seconds * 1000).toLocaleDateString())}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  )
}
export default Treasury;
