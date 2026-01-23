import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { addTransaction, listFinanceRecords } from '../../../core/data/financesService'
import { listMembers, searchMembersByName } from '../../../core/data/membersService'
import { listWallets } from '../../../core/data/walletsService'
import { listFinanceConcepts, createFinanceConcept } from '../../../core/data/financeConceptsService'
import { processDailyCut, commitCut } from '../../../core/data/financeEngine'
import { createWallet, archiveWallet, restoreWallet, updateWallet } from '../../../core/data/walletsService'
import { listDistributionRules, createDistributionRule, deleteDistributionRule, updateDistributionRule, reorderRules } from '../../../core/data/distributionRulesService'
import { Combobox } from '@headlessui/react'

function Treasury() {
  const { churchId } = useParams()
  const today = new Date().toISOString().slice(0, 10)
  const [income, setIncome] = useState({ amount: '', walletId: '', conceptId: '', date: today, responsable: '' })
  const [expense, setExpense] = useState({ amount: '', walletId: '', conceptId: '', date: today, responsable: '' })
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [members, setMembers] = useState([])
  const [tab, setTab] = useState('contabilidad')
  const [wallets, setWallets] = useState([])
  const [concepts, setConcepts] = useState([])
  const [conceptModalOpen, setConceptModalOpen] = useState(false)
  const [newConcept, setNewConcept] = useState({ name: '', system_behavior: 'GENERAL_INCOME' })
  // Corte de caja
  const [cutDate, setCutDate] = useState(today)
  const [cutResult, setCutResult] = useState(null)
  const [cutLoading, setCutLoading] = useState(false)
  const [cutCommitting, setCutCommitting] = useState(false)
  const [cutDone, setCutDone] = useState(false)
  // Config modals
  const [walletModalOpen, setWalletModalOpen] = useState(false)
  const [newWallet, setNewWallet] = useState({ name: '', type: 'CASH', is_default: false })
  const [rulesModalOpen, setRulesModalOpen] = useState(false)
  const [rules, setRules] = useState([])
  const [newRule, setNewRule] = useState({ applies_to_behavior: 'TITHE', target_wallet_id: '', percentage: '', is_remainder: false, priority: 1 })
  // Edición inline de carteras y reglas
  const [editingWalletId, setEditingWalletId] = useState(null)
  const [editingWalletName, setEditingWalletName] = useState('')
  const [editingRuleId, setEditingRuleId] = useState(null)
  const [editingRule, setEditingRule] = useState(null)
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
      const [data, mems, wls, cpts] = await Promise.all([
        listFinanceRecords(churchId),
        listMembers(churchId),
        listWallets(churchId),
        listFinanceConcepts(churchId)
      ])
      setRecords(data.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)))
      setMembers(mems)
      setWallets(wls)
      setConcepts(cpts)
      const defaultWallet = wls.find(w => w.is_default) || wls[0]
      setIncome(i => ({ ...i, walletId: defaultWallet?.id || '', conceptId: cpts[0]?.id || '' }))
      setExpense(e => ({ ...e, walletId: defaultWallet?.id || '', conceptId: cpts[0]?.id || '' }))
      setLoading(false)
    }
    fetchAll()
  }, [churchId])

  // Cargar reglas cuando se abre el modal
  useEffect(() => {
    if (rulesModalOpen) {
      listDistributionRules(churchId).then(setRules)
    }
  }, [rulesModalOpen, churchId])

  // Cargar todas las carteras (incluyendo archivadas) cuando se abre el modal
  useEffect(() => {
    if (walletModalOpen) {
      listWallets(churchId, true).then(setWallets)
    }
  }, [walletModalOpen, churchId])

  const handleCalculateCut = async () => {
    setCutLoading(true)
    setCutDone(false)
    const result = await processDailyCut(churchId, cutDate)
    setCutResult(result)
    setCutLoading(false)
  }

  const handleCommitCut = async () => {
    if (!cutResult) return
    setCutCommitting(true)
    await commitCut(churchId, cutResult.distribucion_sugerida, cutDate)
    setCutCommitting(false)
    setCutDone(true)
    // Refrescar registros
    const data = await listFinanceRecords(churchId)
    setRecords(data.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)))
  }

  const handleCreateWallet = async (e) => {
    e.preventDefault()
    await createWallet(churchId, newWallet)
    const wls = await listWallets(churchId)
    setWallets(wls)
    setNewWallet({ name: '', type: 'CASH', is_default: false })
    setWalletModalOpen(false)
  }

  const handleCreateRule = async (e) => {
    e.preventDefault()
    await createDistributionRule(churchId, { ...newRule, percentage: Number(newRule.percentage || 0) })
    const updated = await listDistributionRules(churchId)
    setRules(updated)
    setNewRule({ applies_to_behavior: 'TITHE', target_wallet_id: '', percentage: '', is_remainder: false, priority: 1 })
  }

  const handleDeleteRule = async (id) => {
    await deleteDistributionRule(churchId, id)
    const updated = await listDistributionRules(churchId)
    setRules(updated)
  }

  const handleArchiveWallet = async (walletId) => {
    await archiveWallet(churchId, walletId)
    const wls = await listWallets(churchId)
    setWallets(wls)
  }

  const handleRestoreWallet = async (walletId) => {
    await restoreWallet(churchId, walletId)
    const wls = await listWallets(churchId, true)
    setWallets(wls)
  }

  const handleEditWalletName = async (walletId) => {
    if (!editingWalletName.trim()) return
    await updateWallet(churchId, walletId, { name: editingWalletName })
    const wls = await listWallets(churchId, true)
    setWallets(wls)
    setEditingWalletId(null)
    setEditingWalletName('')
  }

  const handleEditRule = async () => {
    if (!editingRuleId) return
    await updateDistributionRule(churchId, editingRuleId, editingRule)
    const updated = await listDistributionRules(churchId)
    setRules(updated)
    setEditingRuleId(null)
    setEditingRule(null)
  }

  const handleMoveRuleUp = async (idx) => {
    if (idx === 0) return
    const newRules = [...rules]
    [newRules[idx], newRules[idx - 1]] = [newRules[idx - 1], newRules[idx]]
    await reorderRules(churchId, newRules)
    setRules(newRules)
  }

  const handleMoveRuleDown = async (idx) => {
    if (idx === rules.length - 1) return
    const newRules = [...rules]
    [newRules[idx], newRules[idx + 1]] = [newRules[idx + 1], newRules[idx]]
    await reorderRules(churchId, newRules)
    setRules(newRules)
  }

  const handleIncomeChange = e => {
    setIncome({ ...income, [e.target.name]: e.target.value })
  }
  const handleExpenseChange = e => {
    setExpense({ ...expense, [e.target.name]: e.target.value })
  }

  const handleCreateConcept = async (e) => {
    e.preventDefault()
    const saved = await createFinanceConcept(churchId, newConcept)
    const refreshed = await listFinanceConcepts(churchId)
    setConcepts(refreshed)
    setIncome(i => ({ ...i, conceptId: saved.id }))
    setExpense(s => ({ ...s, conceptId: saved.id }))
    setNewConcept({ name: '', system_behavior: 'GENERAL_INCOME' })
    setConceptModalOpen(false)
  }

  const handleIncomeSubmit = async e => {
    e.preventDefault()
    await addTransaction(churchId, { ...income, kind: 'ingreso', amount: Number(income.amount || 0) })
    setIncome(i => ({ ...i, amount: '', date: today }))
    const data = await listFinanceRecords(churchId)
    setRecords(data.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)))
  }
  const handleExpenseSubmit = async e => {
    e.preventDefault()
    await addTransaction(churchId, { ...expense, kind: 'egreso', amount: Number(expense.amount || 0) })
    setExpense(s => ({ ...s, amount: '', date: today }))
    const data = await listFinanceRecords(churchId)
    setRecords(data.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)))
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] px-4 sm:px-8 py-8 text-[#0f172a]">
      <div className="mb-6">
        <p className="text-xs uppercase tracking-[0.2em] text-[#94a3b8]">Tesorería</p>
        <h1 className="text-3xl font-semibold mt-1">Finanzas y contabilidad</h1>
        <p className="text-sm text-[#475569] mt-1">Registra ingresos, egresos y consulta el historial financiero.</p>
      </div>
      <div className="flex flex-wrap gap-3 mb-8">
        <button
          className={`flex-1 sm:flex-none min-w-[140px] text-center px-4 py-2 rounded-lg font-semibold transition border shadow-sm hover:shadow-md ${tab === 'corte' ? 'bg-[#0ea5e9] text-white border-[#0ea5e9] ring-2 ring-[#0ea5e9]/20' : 'bg-white text-[#0ea5e9] border-[#bae6fd] hover:border-[#0ea5e9]'}`}
          onClick={() => setTab('corte')}
        >Corte de caja</button>
        <button
          className={`flex-1 sm:flex-none min-w-[140px] text-center px-4 py-2 rounded-lg font-semibold transition border shadow-sm hover:shadow-md ${tab === 'contabilidad' ? 'bg-[#0f172a] text-white border-[#0f172a] ring-2 ring-[#0f172a]/15' : 'bg-white text-[#0f172a] border-[#cbd5e1] hover:border-[#0f172a]'}`}
          onClick={() => setTab('contabilidad')}
        >Contabilidad</button>
        <button
          className={`flex-1 sm:flex-none min-w-[140px] text-center px-4 py-2 rounded-lg font-semibold transition border shadow-sm hover:shadow-md ${tab === 'historial' ? 'bg-[#f59e0b] text-[#0f172a] border-[#f59e0b] ring-2 ring-[#fbbf24]/30' : 'bg-white text-[#b45309] border-[#fde68a] hover:border-[#f59e0b]'}`}
          onClick={() => setTab('historial')}
        >Historial</button>
      </div>
      {tab === 'contabilidad' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 mb-10">
        {/* Modal de Ingreso */}
        <div className="bg-white rounded-xl shadow-lg p-8 w-full md:max-w-none mx-auto">
          <h2 className="text-xl font-bold mb-4 text-hunter">Registrar Ingreso</h2>
          <form className="flex flex-col gap-4" onSubmit={handleIncomeSubmit}>
            <input name="amount" value={income.amount} onChange={handleIncomeChange} type="number" min="0" step="0.01" placeholder="Cantidad" className="border rounded px-3 py-2" required />
            <div className="flex gap-2">
              <select name="walletId" value={income.walletId} onChange={handleIncomeChange} className="border rounded px-3 py-2 w-full" required>
                <option value="">Selecciona caja/cuenta</option>
                {wallets.map(w => (
                  <option key={w.id} value={w.id}>{w.name} ({w.type}){w.is_default ? ' • default' : ''}</option>
                ))}
              </select>
              <select name="conceptId" value={income.conceptId} onChange={handleIncomeChange} className="border rounded px-3 py-2 w-full" required>
                <option value="">Concepto</option>
                {concepts.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <button type="button" className="px-3 py-2 rounded bg-[#0ea5e9] text-white" onClick={() => setConceptModalOpen(true)}>+</button>
            </div>
            <input name="date" value={income.date} onChange={handleIncomeChange} type="date" className="border rounded px-3 py-2" required />
            <Combobox value={income.responsable} onChange={val => {
              setIncome(i => ({ ...i, responsable: val }))
              // Autorrelleno: buscar el primer miembro exacto
              const m = incomeOptions.find(opt => opt.name === val) || members.find(mem => mem.name === val)
              if (m) setIncome(i => ({ ...i, responsable: m.name }))
            }}>
              <div className="relative">
                <Combobox.Input
                  className="border rounded px-3 py-2 w-full"
                  displayValue={v => v}
                  onChange={e => {
                    setIncomeQuery(e.target.value)
                    setIncome(i => ({ ...i, responsable: e.target.value }))
                  }}
                  placeholder="Responsable"
                  autoComplete="off"
                  required
                />
                <Combobox.Options className="absolute z-10 mt-1 w-full bg-white border rounded shadow max-h-60 overflow-auto">
                  {loadingIncomeNames && (
                    <div className="px-4 py-2 text-navy">Buscando...</div>
                  )}
                  {!loadingIncomeNames && incomeOptions.length === 0 && incomeQuery.length >= 2 && (
                    <div className="px-4 py-2 text-navy">Sin resultados</div>
                  )}
                  {Array.from(new Set(incomeOptions.map(opt => opt.name))).map((name, idx) => {
                    const opt = incomeOptions.find(o => o.name === name)
                    return (
                      <Combobox.Option key={opt.id || name + idx} value={name} className={({ active }) => `px-4 py-2 cursor-pointer ${active ? 'bg-hunter text-cream' : ''}`}>
                        {name}
                      </Combobox.Option>
                    )
                  })}
                </Combobox.Options>
              </div>
            </Combobox>
            <button type="submit" className="px-4 py-2 rounded bg-hunter text-cream">Guardar ingreso</button>
          </form>
        </div>
        {/* Modal de Egreso */}
        <div className="bg-white rounded-xl shadow-lg p-8 w-full md:max-w-none mx-auto">
          <h2 className="text-xl font-bold mb-4 text-navy">Registrar Egreso</h2>
          <form className="flex flex-col gap-4" onSubmit={handleExpenseSubmit}>
            <input name="amount" value={expense.amount} onChange={handleExpenseChange} type="number" min="0" step="0.01" placeholder="Cantidad" className="border rounded px-3 py-2" required />
            <div className="flex gap-2">
              <select name="walletId" value={expense.walletId} onChange={handleExpenseChange} className="border rounded px-3 py-2 w-full" required>
                <option value="">Selecciona caja/cuenta</option>
                {wallets.map(w => (
                  <option key={w.id} value={w.id}>{w.name} ({w.type}){w.is_default ? ' • default' : ''}</option>
                ))}
              </select>
              <select name="conceptId" value={expense.conceptId} onChange={handleExpenseChange} className="border rounded px-3 py-2 w-full" required>
                <option value="">Concepto</option>
                {concepts.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <button type="button" className="px-3 py-2 rounded bg-[#0ea5e9] text-white" onClick={() => setConceptModalOpen(true)}>+</button>
            </div>
            <input name="date" value={expense.date} onChange={handleExpenseChange} type="date" className="border rounded px-3 py-2" required />
            <Combobox value={expense.responsable} onChange={val => {
              setExpense(e => ({ ...e, responsable: val }))
              // Autorrelleno: buscar el primer miembro exacto
              const m = expenseOptions.find(opt => opt.name === val) || members.find(mem => mem.name === val)
              if (m) setExpense(e => ({ ...e, responsable: m.name }))
            }}>
              <div className="relative">
                <Combobox.Input
                  className="border rounded px-3 py-2 w-full"
                  displayValue={v => v}
                  onChange={e => {
                    setExpenseQuery(e.target.value)
                    setExpense(ex => ({ ...ex, responsable: e.target.value }))
                  }}
                  placeholder="Responsable"
                  autoComplete="off"
                  required
                />
                <Combobox.Options className="absolute z-10 mt-1 w-full bg-white border rounded shadow max-h-60 overflow-auto">
                  {loadingExpenseNames && (
                    <div className="px-4 py-2 text-navy">Buscando...</div>
                  )}
                  {!loadingExpenseNames && expenseOptions.length === 0 && expenseQuery.length >= 2 && (
                    <div className="px-4 py-2 text-navy">Sin resultados</div>
                  )}
                  {Array.from(new Set(expenseOptions.map(opt => opt.name))).map((name, idx) => {
                    const opt = expenseOptions.find(o => o.name === name)
                    return (
                      <Combobox.Option key={opt.id || name + idx} value={name} className={({ active }) => `px-4 py-2 cursor-pointer ${active ? 'bg-navy text-cream' : ''}`}>
                        {name}
                      </Combobox.Option>
                    )
                  })}
                </Combobox.Options>
              </div>
            </Combobox>
            <button type="submit" className="px-4 py-2 rounded bg-navy text-cream">Guardar egreso</button>
          </form>
        </div>
      </div>
          <div className="bg-white rounded-xl shadow p-6 max-w-4xl mx-auto">
            <h3 className="text-lg font-bold mb-4">Registros recientes</h3>
            {loading ? (
              <div className="text-navy/60">Cargando...</div>
            ) : records.length === 0 ? (
              <div className="text-navy/60">No hay registros aún.</div>
            ) : (
              <>
                <div className="hidden md:block overflow-x-auto fade-in-up">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="border-b border-[#e2e8f0] text-[#94a3b8] bg-[#f8fafc]">
                        <th className="py-2 px-4">ID</th>
                        <th className="py-2 px-4">Tipo</th>
                        <th className="py-2 px-4">Cantidad</th>
                        <th className="py-2 px-4">Concepto</th>
                        <th className="py-2 px-4">Caja/Cta</th>
                        <th className="py-2 px-4">Responsable</th>
                        <th className="py-2 px-4">Fecha</th>
                      </tr>
                    </thead>
                    <tbody>
                      {records.map(r => (
                        <tr key={r.id} className={`border-b border-[#f1f5f9] hover:bg-[#f8fafc] transition duration-150 ease-out ${r.kind === 'ingreso' ? 'bg-green-50/80' : r.kind === 'egreso' ? 'bg-red-50/80' : ''}`}>
                          <td className="py-2 px-4 font-mono text-xs text-[#0f172a]">{r.id}</td>
                          <td className="py-2 px-4 capitalize text-[#334155]">{r.kind}</td>
                          <td className="py-2 px-4 text-[#334155]">{r.amount ?? r.cantidad}</td>
                          <td className="py-2 px-4 text-[#334155]">{concepts.find(c => c.id === r.concept_id)?.name || r.concepto || '—'}</td>
                          <td className="py-2 px-4 text-[#334155]">{wallets.find(w => w.id === r.wallet_id)?.name || '—'}</td>
                          <td className="py-2 px-4 text-[#334155]">{r.responsable}</td>
                          <td className="py-2 px-4 text-[#334155]">{r.date || r.fecha || (r.createdAt && new Date(r.createdAt.seconds * 1000).toLocaleDateString())}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="grid gap-3 md:hidden fade-in-up-delayed">
                  {records.map(r => (
                    <div key={r.id} className={`rounded-lg border border-navy/10 shadow-sm p-4 transition-transform duration-200 ease-out hover:-translate-y-0.5 hover:shadow-md ${r.kind === 'ingreso' ? 'bg-green-50/60' : r.kind === 'egreso' ? 'bg-red-50/70' : 'bg-white'}`}>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-semibold text-navy">{concepts.find(c => c.id === r.concept_id)?.name || r.concepto || 'Concepto'}</p>
                          <p className="text-xs text-navy/70">{wallets.find(w => w.id === r.wallet_id)?.name || 'Caja'}</p>
                          <p className="text-xs text-navy/70">{r.responsable}</p>
                        </div>
                        <span className="text-sm font-bold capitalize text-navy">{r.kind}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs text-navy/80 mt-3">
                        <span className="font-medium">Cantidad:</span><span>{r.amount ?? r.cantidad}</span>
                        <span className="font-medium">Fecha:</span><span>{r.date || r.fecha || (r.createdAt && new Date(r.createdAt.seconds * 1000).toLocaleDateString())}</span>
                        <span className="font-medium">ID:</span><span className="font-mono">{r.id}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </>
      )}

      {tab === 'corte' && (
        <div className="bg-white rounded-2xl p-6 shadow-lg fade-in-up max-w-4xl mx-auto">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <h2 className="text-xl font-bold">Corte de caja</h2>
            <div className="flex gap-2">
              <button className="text-sm px-3 py-1 rounded bg-[#e2e8f0] text-[#0f172a] hover:bg-[#cbd5e1]" onClick={() => setWalletModalOpen(true)}>+ Cartera</button>
              <button className="text-sm px-3 py-1 rounded bg-[#e2e8f0] text-[#0f172a] hover:bg-[#cbd5e1]" onClick={() => setRulesModalOpen(true)}>Reglas</button>
            </div>
          </div>
          <div className="flex flex-wrap gap-4 items-end mb-6">
            <div>
              <label className="block text-xs font-medium text-[#475569] mb-1">Fecha</label>
              <input
                type="date"
                className="border rounded px-3 py-2"
                value={cutDate}
                onChange={e => { setCutDate(e.target.value); setCutResult(null); setCutDone(false) }}
              />
            </div>
            <button
              className="px-5 py-2 rounded-lg bg-[#0ea5e9] text-white font-semibold hover:bg-[#0284c7] disabled:opacity-50"
              onClick={handleCalculateCut}
              disabled={cutLoading}
            >{cutLoading ? 'Calculando...' : 'Calcular distribución'}</button>
          </div>
          {cutResult && (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="rounded-lg bg-[#f1f5f9] p-4">
                  <p className="text-xs text-[#64748b]">Total ingresado</p>
                  <p className="text-2xl font-bold text-[#0f172a]">${cutResult.total_ingresado.toFixed(2)}</p>
                </div>
                {cutResult.resumen_por_tipo.map(rt => (
                  <div key={rt.behavior} className="rounded-lg bg-[#f1f5f9] p-4">
                    <p className="text-xs text-[#64748b]">{rt.label}</p>
                    <p className="text-xl font-semibold text-[#0f172a]">${rt.total.toFixed(2)}</p>
                  </div>
                ))}
              </div>
              <h3 className="font-semibold mb-2">Distribución sugerida</h3>
              <div className="overflow-x-auto mb-6">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b text-[#94a3b8] bg-[#f8fafc]">
                      <th className="py-2 px-4 text-left">Cartera destino</th>
                      <th className="py-2 px-4 text-left">Tipo origen</th>
                      <th className="py-2 px-4">Porcentaje</th>
                      <th className="py-2 px-4">Monto</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cutResult.distribucion_sugerida.map((d, i) => (
                      <tr key={i} className="border-b hover:bg-[#f8fafc]">
                        <td className="py-2 px-4">{d.target_wallet_name}</td>
                        <td className="py-2 px-4">{d.from_behavior_label}</td>
                        <td className="py-2 px-4 text-center">{d.is_remainder ? 'Resto' : `${d.percentage}%`}</td>
                        <td className="py-2 px-4 text-right font-semibold">${d.amount.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {cutDone ? (
                <p className="text-green-600 font-semibold">✔ Corte confirmado y movimientos registrados.</p>
              ) : (
                <button
                  className="px-5 py-2 rounded-lg bg-green-600 text-white font-semibold hover:bg-green-700 disabled:opacity-50"
                  onClick={handleCommitCut}
                  disabled={cutCommitting}
                >{cutCommitting ? 'Guardando...' : 'Confirmar y cerrar caja'}</button>
              )}
            </>
          )}
        </div>
      )}

      {walletModalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 overflow-auto py-8">
          <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-2xl relative">
            <button className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 text-2xl" onClick={() => setWalletModalOpen(false)}>&times;</button>
            <h3 className="text-lg font-bold mb-4">Gestión de Carteras/Cajas</h3>
            
            {/* Lista de Carteras Existentes */}
            <div className="mb-6">
              <h4 className="text-sm font-semibold text-[#475569] mb-2">Mis Carteras</h4>
              {wallets.length === 0 ? (
                <p className="text-xs text-[#94a3b8] italic">No hay carteras aún.</p>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto border rounded bg-[#f8fafc] p-3">
                  {wallets.map((w) => (
                    <div key={w.id} className={`flex items-center justify-between p-3 rounded border ${w.is_active !== false ? 'bg-white border-[#e2e8f0]' : 'bg-[#f1f5f9] border-[#cbd5e1]'}`}>
                      {editingWalletId === w.id ? (
                        <input
                          autoFocus
                          className="border rounded px-2 py-1 text-sm w-full"
                          value={editingWalletName}
                          onChange={e => setEditingWalletName(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter') handleEditWalletName(w.id)
                            if (e.key === 'Escape') setEditingWalletId(null)
                          }}
                        />
                      ) : (
                        <div className="flex-1">
                          <p className="text-sm font-medium text-[#0f172a]">{w.name}</p>
                          <p className="text-xs text-[#64748b]">{w.type === 'CASH' ? 'Efectivo' : 'Banco'}{w.is_default ? ' • Predeterminada' : ''}{w.is_active === false ? ' • Archivada' : ''}</p>
                        </div>
                      )}
                      <div className="flex gap-1">
                        {editingWalletId === w.id ? (
                          <>
                            <button className="text-xs px-2 py-1 rounded bg-green-500 text-white hover:bg-green-600" onClick={() => handleEditWalletName(w.id)}>✓</button>
                            <button className="text-xs px-2 py-1 rounded bg-gray-300 text-gray-700 hover:bg-gray-400" onClick={() => setEditingWalletId(null)}>✕</button>
                          </>
                        ) : (
                          <>
                            <button className="text-xs px-2 py-1 rounded bg-[#e2e8f0] text-[#0f172a] hover:bg-[#cbd5e1]" onClick={() => { setEditingWalletId(w.id); setEditingWalletName(w.name) }}>Editar</button>
                            {w.is_active !== false ? (
                              <button className="text-xs px-2 py-1 rounded bg-orange-100 text-orange-700 hover:bg-orange-200" onClick={() => handleArchiveWallet(w.id)}>Archivar</button>
                            ) : (
                              <button className="text-xs px-2 py-1 rounded bg-green-100 text-green-700 hover:bg-green-200" onClick={() => handleRestoreWallet(w.id)}>Restaurar</button>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <hr className="my-4" />

            {/* Formulario Nueva Cartera */}
            <h4 className="text-sm font-semibold text-[#475569] mb-2">Crear Nueva Cartera</h4>
            <form className="flex flex-col gap-3" onSubmit={handleCreateWallet}>
              <input
                className="border rounded px-3 py-2 text-sm"
                placeholder="Nombre de la cartera (ej: Caja Principal, Banco, etc)"
                value={newWallet.name}
                onChange={e => setNewWallet(w => ({ ...w, name: e.target.value }))}
                required
              />
              <select
                className="border rounded px-3 py-2 text-sm"
                value={newWallet.type}
                onChange={e => setNewWallet(w => ({ ...w, type: e.target.value }))}
              >
                <option value="CASH">Efectivo (Físico)</option>
                <option value="BANK">Banco (Digital)</option>
              </select>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={newWallet.is_default}
                  onChange={e => setNewWallet(w => ({ ...w, is_default: e.target.checked }))}
                />
                <span>Es la cartera predeterminada para recepción</span>
              </label>
              <div className="flex justify-end gap-2 mt-2">
                <button type="button" className="px-4 py-2 rounded bg-[#e2e8f0] text-[#0f172a] hover:bg-[#cbd5e1]" onClick={() => setWalletModalOpen(false)}>Cerrar</button>
                <button type="submit" className="px-4 py-2 rounded bg-[#0ea5e9] text-white hover:bg-[#0284c7]">+ Crear Cartera</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {rulesModalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 overflow-auto py-8">
          <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-3xl relative">
            <button className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 text-2xl" onClick={() => setRulesModalOpen(false)}>&times;</button>
            <h3 className="text-lg font-bold mb-4">Configurar Reglas de Distribución</h3>
            
            {/* Lista de Reglas Existentes */}
            <div className="mb-6">
              <h4 className="text-sm font-semibold text-[#475569] mb-2">Reglas Activas (Orden de Ejecución)</h4>
              {rules.length === 0 ? (
                <p className="text-xs text-[#94a3b8] italic bg-[#f8fafc] p-3 rounded">No hay reglas configuradas. Sin reglas, el dinero permanecerá en la cartera donde fue recibido.</p>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {rules.map((r, idx) => (
                    <div key={r.id} className={`p-3 rounded border ${editingRuleId === r.id ? 'bg-blue-50 border-blue-300' : 'bg-white border-[#e2e8f0]'}`}>
                      {editingRuleId === r.id ? (
                        <div className="flex flex-col gap-2">
                          <div className="text-sm font-medium text-[#0f172a] mb-2">Editando Regla #{idx + 1}</div>
                          <div className="grid grid-cols-3 gap-2">
                            <select
                              className="border rounded px-2 py-1 text-sm"
                              value={editingRule.applies_to_behavior}
                              onChange={e => setEditingRule({...editingRule, applies_to_behavior: e.target.value})}
                            >
                              <option value="TITHE">Diezmos</option>
                              <option value="OFFERING">Ofrendas</option>
                              <option value="GENERAL_INCOME">Ingresos Generales</option>
                            </select>
                            <select
                              className="border rounded px-2 py-1 text-sm"
                              value={editingRule.target_wallet_id}
                              onChange={e => setEditingRule({...editingRule, target_wallet_id: e.target.value})}
                            >
                              <option value="">Cartera destino</option>
                              {wallets.filter(w => w.is_active !== false).map(w => (
                                <option key={w.id} value={w.id}>{w.name}</option>
                              ))}
                            </select>
                            {!editingRule.is_remainder ? (
                              <input
                                type="number"
                                className="border rounded px-2 py-1 text-sm"
                                placeholder="%"
                                value={editingRule.percentage}
                                onChange={e => setEditingRule({...editingRule, percentage: e.target.value})}
                              />
                            ) : (
                              <div className="text-sm font-bold text-orange-600 py-1 px-2">Resto</div>
                            )}
                          </div>
                          <label className="flex items-center gap-1 text-sm">
                            <input
                              type="checkbox"
                              checked={editingRule.is_remainder}
                              onChange={e => setEditingRule({...editingRule, is_remainder: e.target.checked, percentage: e.target.checked ? '' : editingRule.percentage})}
                            />
                            <span>¿Es el remanente?</span>
                          </label>
                          <div className="flex gap-1 justify-end">
                            <button className="text-xs px-2 py-1 rounded bg-green-500 text-white hover:bg-green-600" onClick={handleEditRule}>✓ Guardar</button>
                            <button className="text-xs px-2 py-1 rounded bg-gray-300 text-gray-700 hover:bg-gray-400" onClick={() => setEditingRuleId(null)}>✕ Cancelar</button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="text-sm font-semibold text-[#0f172a]">
                              #{idx + 1} — Si entra dinero de <span className="text-blue-600">{r.applies_to_behavior === 'TITHE' ? 'Diezmos' : r.applies_to_behavior === 'OFFERING' ? 'Ofrendas' : 'Ingresos Generales'}</span>
                            </div>
                            <div className="text-sm text-[#475569] mt-1">
                              → Mover {r.is_remainder ? <span className="font-bold text-orange-600">TODO LO QUE SOBRE</span> : <span className="font-bold text-green-600">{r.percentage}%</span>} a <span className="font-semibold text-blue-600">{wallets.find(w => w.id === r.target_wallet_id)?.name || 'Cartera desconocida'}</span>
                            </div>
                          </div>
                          <div className="flex gap-1">
                            {idx > 0 && (
                              <button className="text-xs px-2 py-1 rounded bg-[#e2e8f0] text-[#0f172a] hover:bg-[#cbd5e1]" onClick={() => handleMoveRuleUp(idx)}>▲</button>
                            )}
                            {idx < rules.length - 1 && (
                              <button className="text-xs px-2 py-1 rounded bg-[#e2e8f0] text-[#0f172a] hover:bg-[#cbd5e1]" onClick={() => handleMoveRuleDown(idx)}>▼</button>
                            )}
                            <button className="text-xs px-2 py-1 rounded bg-[#e2e8f0] text-[#0f172a] hover:bg-[#cbd5e1]" onClick={() => { setEditingRuleId(r.id); setEditingRule({...r}) }}>Editar</button>
                            <button className="text-xs px-2 py-1 rounded bg-red-100 text-red-700 hover:bg-red-200" onClick={() => handleDeleteRule(r.id)}>Eliminar</button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <hr className="my-4" />

            {/* Formulario Nueva Regla */}
            <h4 className="text-sm font-semibold text-[#475569] mb-2">Agregar Nueva Regla</h4>
            <form className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end" onSubmit={handleCreateRule}>
              <div className="sm:col-span-3">
                <label className="text-xs block mb-1 font-semibold">Si entra:</label>
                <select
                  className="w-full border rounded px-2 py-2 text-sm"
                  value={newRule.applies_to_behavior}
                  onChange={e => setNewRule(r => ({ ...r, applies_to_behavior: e.target.value }))}
                >
                  <option value="TITHE">Diezmos</option>
                  <option value="OFFERING">Ofrendas</option>
                  <option value="GENERAL_INCOME">Ingresos Generales</option>
                </select>
              </div>
              
              <div className="sm:col-span-4">
                <label className="text-xs block mb-1 font-semibold">Mover a:</label>
                <select
                  className="w-full border rounded px-2 py-2 text-sm"
                  value={newRule.target_wallet_id}
                  onChange={e => setNewRule(r => ({ ...r, target_wallet_id: e.target.value }))}
                  required
                >
                  <option value="">Selecciona cartera...</option>
                  {wallets.filter(w => w.is_active !== false).map(w => (
                    <option key={w.id} value={w.id}>{w.name}</option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-3">
                <label className="text-xs block mb-1 font-semibold">Cantidad:</label>
                <div className="flex items-center gap-2">
                  {!newRule.is_remainder ? (
                    <div className="relative w-full">
                      <input
                        type="number"
                        className="w-full border rounded px-2 py-2 text-sm pr-6"
                        placeholder="10"
                        value={newRule.percentage}
                        onChange={e => setNewRule(r => ({ ...r, percentage: e.target.value }))}
                      />
                      <span className="absolute right-2 top-2 text-gray-500 text-xs">%</span>
                    </div>
                  ) : (
                    <span className="text-xs font-bold text-orange-600 py-2">Todo lo que sobre</span>
                  )}
                </div>
                <label className="flex items-center gap-1 mt-1">
                  <input
                    type="checkbox"
                    checked={newRule.is_remainder}
                    onChange={e => setNewRule(r => ({ ...r, is_remainder: e.target.checked, percentage: e.target.checked ? '' : newRule.percentage }))}
                  />
                  <span className="text-[10px] text-gray-600">Es remanente</span>
                </label>
              </div>

              <div className="sm:col-span-2">
                <button type="submit" className="w-full bg-[#0ea5e9] hover:bg-[#0284c7] text-white py-2 rounded text-sm font-bold shadow-sm">+ Agregar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {conceptModalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md relative">
            <button className="absolute top-3 right-3 text-gray-400 hover:text-gray-700" onClick={() => setConceptModalOpen(false)}>&times;</button>
            <h3 className="text-lg font-bold mb-4">Nuevo concepto</h3>
            <form className="flex flex-col gap-4" onSubmit={handleCreateConcept}>
              <input
                className="border rounded px-3 py-2"
                placeholder="Nombre del concepto"
                value={newConcept.name}
                onChange={e => setNewConcept(c => ({ ...c, name: e.target.value }))}
                required
              />
              <select
                className="border rounded px-3 py-2"
                value={newConcept.system_behavior}
                onChange={e => setNewConcept(c => ({ ...c, system_behavior: e.target.value }))}
              >
                <option value="TITHE">Diezmo</option>
                <option value="OFFERING">Ofrenda</option>
                <option value="GENERAL_INCOME">Ingreso general</option>
                <option value="EXPENSE">Egreso</option>
              </select>
              <div className="flex justify-end gap-2">
                <button type="button" className="px-4 py-2 rounded bg-[#e2e8f0] text-[#0f172a]" onClick={() => setConceptModalOpen(false)}>Cancelar</button>
                <button type="submit" className="px-4 py-2 rounded bg-[#0ea5e9] text-white">Crear</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
export default Treasury;
