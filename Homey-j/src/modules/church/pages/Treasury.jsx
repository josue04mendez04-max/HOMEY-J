import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Combobox } from '@headlessui/react'
import { addTransaction, listFinanceRecords, updateTransaction, deleteTransaction } from '../../../core/data/financesService'
import { listMembers, searchMembersByName } from '../../../core/data/membersService'
import { listWallets, createWallet, updateWallet, deleteWallet } from '../../../core/data/walletsService'
import { listFinanceConcepts, createFinanceConcept, updateFinanceConcept } from '../../../core/data/financeConceptsService'
import { processDailyCut, commitCut } from '../../../core/data/financeEngine'
import { saveCutReceipt } from '../../../core/data/cutsHistoryService'
import { listCutReceipts } from '../../../core/data/cutsHistoryService'
import { generateCutReceiptPDF } from '../../../shared/utils/generateCutReceiptPDF'
import { listDistributionRules, createDistributionRule, deleteDistributionRule } from '../../../core/data/distributionRulesService'
import EditWalletModal from './EditWalletModal'
import EditConceptModal from './EditConceptModal'

function Treasury() {
      const [searchName, setSearchName] = useState('')
      const [searchStart, setSearchStart] = useState('')
      const [searchEnd, setSearchEnd] = useState('')
      const [filteredMovements, setFilteredMovements] = useState([])
    const [cutsHistory, setCutsHistory] = useState([])
    const [loadingCutsHistory, setLoadingCutsHistory] = useState(false)
  const { churchId } = useParams()
  const effectiveChurchId = churchId || 'demo'
  const today = new Date().toISOString().slice(0, 10)

  const [tab, setTab] = useState('contabilidad')
  const [configSubTab, setConfigSubTab] = useState('wallets')
  const [loading, setLoading] = useState(true)

  const [records, setRecords] = useState([])
  const [wallets, setWallets] = useState([])
  const [concepts, setConcepts] = useState([])
  const [rules, setRules] = useState([])
  const [members, setMembers] = useState([])

  const [income, setIncome] = useState({ amount: '', walletId: '', conceptId: '', date: today, responsable: '', responsableId: '', transactionType: '' })
  const [expense, setExpense] = useState({ amount: '', walletId: '', conceptId: '', date: today, responsable: '', responsableId: '', transactionType: '' })
  const [editMovement, setEditMovement] = useState(null)

  const [cutDate, setCutDate] = useState(today)
  const [cutPreview, setCutPreview] = useState(null)
  const [loadingCut, setLoadingCut] = useState(false)
  const [applyRules, setApplyRules] = useState(true)
  const [cutReceipt, setCutReceipt] = useState(null)
  const [lastCutDate, setLastCutDate] = useState('')
  const [subtractTransfers, setSubtractTransfers] = useState(false)

  const [newWallet, setNewWallet] = useState({ name: '', type: 'CASH', is_default: false, balance: 0 })
  const [editWallet, setEditWallet] = useState(null)
  const [editConcept, setEditConcept] = useState(null)
  const [showConceptModal, setShowConceptModal] = useState(false)
  const [newRule, setNewRule] = useState({ concept_id: '', target_wallet_id: '', percentage: 10, is_remainder: false, is_outflow: false, outflow_concept_label: '' })

  const [incomeQuery, setIncomeQuery] = useState('')
  const [incomeOptions, setIncomeOptions] = useState([])

  // Generar PDF automáticamente cuando se genera el recibo
  useEffect(() => {
    if (cutReceipt && cutReceipt.movimientos && cutReceipt.movimientos.length > 0) {
      generateCutReceiptPDF({
        churchName: 'Nombre de la Iglesia', // Puedes obtenerlo dinámicamente si lo tienes
        date: cutReceipt.date,
        totalIngreso: cutReceipt.total,
        totalEgreso: 0, // Si tienes egresos, pásalos aquí
        movimientos: cutReceipt.movimientos,
        reglas: rules
      })
    }
  }, [cutReceipt, rules])

  // Filtrar movimientos por nombre y fecha
  useEffect(() => {
    if (!searchName && !searchStart && !searchEnd) {
      setFilteredMovements([])
      return
    }
    // Movimientos provenientes de cortes
    let allMovs = cutsHistory.flatMap(cut =>
      (cut.movimientos || []).map(m => ({ ...m, fecha: cut.date, fuente: 'corte' }))
    )
    // Movimientos individuales (historial completo)
    const recordMovs = records.map(r => ({
      ...r,
      fecha: r.date || (r.createdAt && new Date(r.createdAt.seconds * 1000).toISOString().slice(0, 10)) || '',
      conceptName: concepts.find(c => c.id === (r.concept_id || r.conceptId))?.name || r.concepto || r.concept_snapshot?.name || '—',
      fuente: 'movimiento'
    }))
    allMovs = allMovs.concat(recordMovs)

    if (searchName) {
      allMovs = allMovs.filter(m => (m.responsable || '').toLowerCase().includes(searchName.toLowerCase()))
    }
    if (searchStart) {
      allMovs = allMovs.filter(m => m.fecha && m.fecha >= searchStart)
    }
    if (searchEnd) {
      allMovs = allMovs.filter(m => m.fecha && m.fecha <= searchEnd)
    }
    setFilteredMovements(allMovs)
  }, [searchName, searchStart, searchEnd, cutsHistory, records, concepts])

  // Cargar historial de cortes al entrar a la pestaña historial
  useEffect(() => {
    if (tab === 'historial') {
      setLoadingCutsHistory(true)
      listCutReceipts(effectiveChurchId).then(data => {
        setCutsHistory(data)
        setLoadingCutsHistory(false)
        const latest = data[0]?.date || ''
        if (latest) setLastCutDate(latest)
      })
    }
  }, [tab, effectiveChurchId])

  // Cargar la última fecha de corte también al iniciar para filtrar recientes
  useEffect(() => {
    listCutReceipts(effectiveChurchId).then(data => {
      const latest = data[0]?.date || ''
      if (latest) setLastCutDate(latest)
    })
  }, [effectiveChurchId])

  const normalizeWallet = (w) => ({
    ...w,
    status: w.is_active === false ? 'archived' : 'active',
    typeLabel: w.type === 'BANK' ? 'banco' : 'efectivo'
  })

  const refreshAllData = async () => {
    setLoading(true)
    try {
      const [data, mems, wls, cpts, rls] = await Promise.all([
        listFinanceRecords(effectiveChurchId),
        listMembers(effectiveChurchId),
        listWallets(effectiveChurchId, true),
        listFinanceConcepts(effectiveChurchId),
        listDistributionRules(effectiveChurchId)
      ])

      const normalizedWallets = wls.map(normalizeWallet)
      setRecords(data.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)))
      setMembers(mems)
      setWallets(normalizedWallets)
      setConcepts(cpts)
      setRules(rls)

      const activeWalletsLocal = normalizedWallets.filter(w => w.status !== 'archived')
      const defaultWallet = activeWalletsLocal.find(w => w.is_default) || activeWalletsLocal[0]
      setIncome(prev => {
        let walletId = prev.walletId && activeWalletsLocal.some(w => w.id === prev.walletId) ? prev.walletId : defaultWallet?.id || ''
        let conceptId = prev.conceptId && cpts.some(c => c.id === prev.conceptId && c.system_behavior !== 'EXPENSE') ? prev.conceptId : (cpts.find(c => c.system_behavior !== 'EXPENSE') || cpts[0])?.id || ''
        let transactionType = prev.transactionType || ''
        return { ...prev, walletId, conceptId, transactionType }
      })
      setExpense(prev => {
        let walletId = prev.walletId && activeWalletsLocal.some(w => w.id === prev.walletId) ? prev.walletId : defaultWallet?.id || ''
        let conceptId = prev.conceptId && cpts.some(c => c.id === prev.conceptId && c.system_behavior === 'EXPENSE') ? prev.conceptId : (cpts.find(c => c.system_behavior === 'EXPENSE') || cpts[0])?.id || ''
        let transactionType = prev.transactionType || ''
        return { ...prev, walletId, conceptId, transactionType }
      })
    } catch (error) {
      console.error('Error cargando datos', error)
    }
    setLoading(false)
  }

  useEffect(() => {
    refreshAllData()
  }, [effectiveChurchId])

  useEffect(() => {
    if (incomeQuery.length > 1) {
      searchMembersByName(effectiveChurchId, incomeQuery).then(setIncomeOptions)
    } else {
      setIncomeOptions([])
    }
  }, [incomeQuery, effectiveChurchId])

  // Selección de miembro para responsable y guardar id
  const handleSelectResponsable = (name) => {
    const member = members.find(m => m.name === name)
    setIncome(prev => ({ ...prev, responsable: name, responsableId: member?.id || '' }))
    setExpense(prev => ({ ...prev, responsable: name, responsableId: member?.id || '' }))
  }

  const handleCalculateCut = async () => {
    setLoadingCut(true)
    try {
      const result = await processDailyCut(effectiveChurchId, cutDate, applyRules)
      setCutPreview(result)
    } catch (error) {
      console.error('Error calculando el corte', error)
      alert('Error calculando el corte.')
    }
    setLoadingCut(false)
  }

  const handleCommitCut = async () => {
    if (!cutPreview) return
    if (!window.confirm('¿Confirmar distribución y generar movimientos?')) return
    setLoadingCut(true)
    const results = await commitCut(effectiveChurchId, cutPreview.distribucion_sugerida, cutDate)
    const recibo = {
      date: cutDate,
      total: cutPreview.total_ingresado,
      transfer_total: cutPreview.transfer_total || 0,
      total_balance: cutPreview.total_ingresado - (subtractTransfers ? cutPreview.transfer_total || 0 : 0),
      distribucion: cutPreview.distribucion_sugerida,
      resumen: cutPreview.resumen_por_concepto,
      movimientos: results
    }
    await saveCutReceipt(effectiveChurchId, recibo)
    setCutReceipt(recibo)
    setCutPreview(null)
    setTab('historial')
    await refreshAllData()
    setLoadingCut(false)
  }

  const handleCreateWallet = async (e) => {
    e.preventDefault()
    await createWallet(effectiveChurchId, newWallet)
    setNewWallet({ name: '', type: 'CASH', is_default: false, balance: 0 })
    refreshAllData()
  }

  const handleEditWallet = async (form) => {
    await updateWallet(effectiveChurchId, editWallet.id, form)
    setEditWallet(null)
    refreshAllData()
  }

  const handleSetPrincipalWallet = async (wallet) => {
    for (const w of wallets) {
      if (w.id !== wallet.id && w.is_default) {
        await updateWallet(effectiveChurchId, w.id, { ...w, is_default: false })
      }
    }
    await updateWallet(effectiveChurchId, wallet.id, { ...wallet, is_default: true })
    refreshAllData()
  }

  const handleToggleWalletStatus = async (wallet) => {
    const confirmed = window.confirm('¿Eliminar esta caja de forma permanente? No se podrá recuperar y ya no aparecerá en nuevos ingresos.')
    if (!confirmed) return
    await deleteWallet(effectiveChurchId, wallet.id)
    refreshAllData()
  }

  const handleCreateConcept = async (form) => {
    await createFinanceConcept(effectiveChurchId, { ...form })
    setShowConceptModal(false)
    refreshAllData()
  }

  const handleEditConcept = async (form) => {
    await updateFinanceConcept(effectiveChurchId, editConcept.id, form)
    setEditConcept(null)
    refreshAllData()
  }

  const handleAddRule = async (e) => {
    e.preventDefault()
    if (!newRule.is_outflow && !newRule.target_wallet_id) {
      alert('Selecciona la caja destino o marca como salida')
      return
    }

    const concept = concepts.find(c => c.id === newRule.concept_id)
    const applies_to_behavior = concept?.system_behavior || 'GENERAL_INCOME'

    await createDistributionRule(effectiveChurchId, {
      ...newRule,
      target_wallet_id: newRule.is_outflow ? null : newRule.target_wallet_id,
      outflow_concept_label: newRule.outflow_concept_label?.trim() || null,
      percentage: Number(newRule.percentage || 0),
      applies_to_behavior
    })
    setNewRule({ concept_id: '', target_wallet_id: '', percentage: 10, is_remainder: false, is_outflow: false, outflow_concept_label: '' })
    refreshAllData()
  }

  const handleDeleteRule = async (id) => {
    if (!window.confirm('¿Borrar esta regla?')) return
    await deleteDistributionRule(effectiveChurchId, id)
    refreshAllData()
  }

  const handleIncomeSubmit = async (e) => {
    e.preventDefault()
    const wallet = wallets.find(w => w.id === income.walletId)
    const concept = concepts.find(c => c.id === income.conceptId)
    await addTransaction(effectiveChurchId, {
      ...income,
      kind: 'ingreso',
      amount: Number(income.amount || 0),
      responsable: '',
      responsableId: income.responsableId,
      churchId: effectiveChurchId,
      wallet_snapshot: wallet ? { id: wallet.id, name: walletLabel(wallet), type: wallet.type, typeLabel: wallet.typeLabel } : null,
      concept_snapshot: concept ? { id: concept.id, name: concept.name, behavior: concept.system_behavior } : null
    })
    setIncome(prev => ({ ...prev, amount: '' }))
    refreshAllData()
  }

  const handleExpenseSubmit = async (e) => {
    e.preventDefault()
    const wallet = wallets.find(w => w.id === expense.walletId)
    const concept = concepts.find(c => c.id === expense.conceptId)
    await addTransaction(effectiveChurchId, {
      ...expense,
      kind: 'egreso',
      amount: Number(expense.amount || 0),
      responsable: '',
      responsableId: expense.responsableId,
      churchId: effectiveChurchId,
      wallet_snapshot: wallet ? { id: wallet.id, name: walletLabel(wallet), type: wallet.type, typeLabel: wallet.typeLabel } : null,
      concept_snapshot: concept ? { id: concept.id, name: concept.name, behavior: concept.system_behavior } : null
    })
    setExpense(prev => ({ ...prev, amount: '' }))
    refreshAllData()
  }

  const activeWallets = wallets.filter(w => w.status !== 'archived')
  const walletLabel = (w) => w?.name || w?.nombre || w?.title || 'Caja sin nombre'
  const incomeConcepts = concepts.filter(c => c.system_behavior !== 'EXPENSE')
  const expenseConcepts = concepts.filter(c => c.system_behavior === 'EXPENSE')

  if (loading) return <div className="p-10 text-center text-gray-500">Cargando sistema financiero...</div>

  return (
    <>
    <div className="min-h-screen bg-[#f8fafc] px-4 sm:px-8 py-8 text-[#0f172a]">
      <div className="mb-6">
        <p className="text-xs uppercase tracking-[0.2em] text-[#94a3b8]">Tesorería</p>
        <h1 className="text-3xl font-semibold mt-1">Finanzas Inteligentes</h1>
        <p className="text-sm text-[#475569] mt-1">Gestión de cajas, reglas de distribución y contabilidad.</p>
      </div>

      <div className="flex flex-wrap gap-2 mb-8 border-b border-gray-200 pb-1">
        {[{ id: 'corte', label: '✂️ Corte y Distribución' }, { id: 'contabilidad', label: '📝 Registrar Movimientos' }, { id: 'historial', label: '📊 Historial' }, { id: 'config', label: '⚙️ Configuración' }].map(item => (
          <button
            key={item.id}
            onClick={() => setTab(item.id)}
            className={`px-5 py-2 rounded-t-lg font-semibold transition-all relative top-[1px] ${tab === item.id ? 'bg-white text-[#0f172a] border border-gray-200 border-b-white shadow-sm' : 'text-gray-500 hover:text-[#0f172a] hover:bg-gray-50'}`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === 'config' && (
        <div className="animate-fade-in-up">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-3">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-2">
                <button onClick={() => setConfigSubTab('wallets')} className={`w-full text-left px-4 py-3 rounded-lg font-medium mb-1 transition ${configSubTab === 'wallets' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'}`}>💰 Cajas y Cuentas</button>
                <button onClick={() => setConfigSubTab('rules')} className={`w-full text-left px-4 py-3 rounded-lg font-medium transition ${configSubTab === 'rules' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'}`}>⚖️ Reglas de Distribución</button>
              </div>
              <div className="mt-6 bg-blue-50 rounded-lg p-4 text-xs text-blue-800 border border-blue-100">
                <strong>Nota:</strong>
                <p className="mt-1">Los cambios que realices aquí afectarán a los cortes de caja futuros, no al historial pasado.</p>
              </div>
            </div>

            <div className="lg:col-span-9">
              {configSubTab === 'wallets' && (
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h2 className="text-xl font-bold text-[#0f172a] mb-6">Mis Cajas y Cuentas</h2>

                  <form onSubmit={handleCreateWallet} className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-8 flex flex-wrap gap-4 items-end">
                    <div className="flex-1 min-w-[200px]">
                      <label className="text-xs font-bold text-gray-500 mb-1 block">Nombre de la Caja</label>
                      <input value={newWallet.name} onChange={e => setNewWallet({ ...newWallet, name: e.target.value })} placeholder="Ej: Caja Chica, Banco Nacional..." className="w-full border rounded px-3 py-2" required />
                    </div>
                    <div className="w-40">
                      <label className="text-xs font-bold text-gray-500 mb-1 block">Tipo</label>
                      <select value={newWallet.type} onChange={e => setNewWallet({ ...newWallet, type: e.target.value })} className="w-full border rounded px-3 py-2">
                        <option value="CASH">Efectivo</option>
                        <option value="BANK">Banco/Digital</option>
                      </select>
                    </div>
                    <div className="w-40">
                      <label className="text-xs font-bold text-gray-500 mb-1 block">Balance Inicial</label>
                      <input type="number" value={newWallet.balance} onChange={e => setNewWallet({ ...newWallet, balance: parseFloat(e.target.value) || 0 })} className="w-full border rounded px-3 py-2" min="0" placeholder="0" />
                    </div>
                    <label className="flex items-center gap-2 text-xs text-gray-600">
                      <input type="checkbox" checked={newWallet.is_default} onChange={e => setNewWallet({ ...newWallet, is_default: e.target.checked })} />
                      <span>Marcar como principal</span>
                    </label>
                    <button className="bg-[#0f172a] hover:bg-slate-800 text-white px-6 py-2 rounded font-semibold h-[42px] border border-slate-300">Crear Caja</button>
                  </form>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
                    {wallets.map(wallet => (
                      <div key={wallet.id} className={`border rounded-lg p-4 flex justify-between items-center ${wallet.status === 'archived' ? 'bg-gray-50 opacity-75' : 'bg-white hover:shadow-md transition'}`}>
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${wallet.type === 'BANK' ? 'bg-purple-100 text-purple-600' : 'bg-green-100 text-green-600'}`}>
                            {wallet.type === 'BANK' ? '🏦' : '💵'}
                          </div>
                          <div>
                            <p className="font-bold text-[#0f172a] flex items-center gap-2">
                              {wallet.name}
                              {wallet.is_default && <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full uppercase">Principal</span>}
                            </p>
                            <p className="text-xs text-gray-500 capitalize">{wallet.typeLabel} • {wallet.status === 'archived' ? 'Archivada' : 'Activa'}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button onClick={() => setEditWallet(wallet)} className="text-xs font-medium px-3 py-1 rounded-full border border-blue-200 text-blue-600 hover:bg-blue-50">Editar</button>
                          <button onClick={() => handleSetPrincipalWallet(wallet)} disabled={wallet.is_default} className="text-xs font-medium px-3 py-1 rounded-full border border-green-200 text-green-600 hover:bg-green-50 disabled:opacity-50">Principal</button>
                          <button onClick={() => handleToggleWalletStatus(wallet)} className="text-xs font-medium px-3 py-1 rounded-full border transition border-red-100 text-red-500 hover:bg-red-50">
                            Eliminar
                          </button>
                        </div>
                      </div>
                    ))}
                    {wallets.length === 0 && <p className="text-sm text-gray-500">Aún no tienes cajas creadas.</p>}
                  </div>

                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold">Conceptos</h3>
                    <button onClick={() => setShowConceptModal(true)} className="bg-blue-100 text-blue-700 px-4 py-2 rounded font-semibold">+ Nuevo Concepto</button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {concepts.map(concept => (
                      <div key={concept.id} className="border rounded-lg p-3 flex justify-between items-center bg-gray-50">
                        <div>
                          <div className="font-semibold text-[#0f172a]">{concept.name}</div>
                          <div className="text-xs text-gray-500">{concept.reason}</div>
                          <div className="text-xs text-gray-400 italic">{concept.system_behavior === 'EXPENSE' ? 'Gasto' : concept.system_behavior === 'SPECIAL_EXPENSE' ? 'Gasto Especial' : 'Ingreso'}</div>
                        </div>
                        <button onClick={() => setEditConcept(concept)} className="text-xs text-blue-600 hover:underline">Editar</button>
                      </div>
                    ))}
                    {concepts.length === 0 && <p className="text-sm text-gray-500">No hay conceptos.</p>}
                  </div>
                  {showConceptModal && (
                    <EditConceptModal concept={{}} onSave={handleCreateConcept} onClose={() => setShowConceptModal(false)} allowExpense allowSpecialExpense />
                  )}
                  {editConcept && (
                    <EditConceptModal concept={editConcept} onSave={handleEditConcept} onClose={() => setEditConcept(null)} allowExpense allowSpecialExpense />
                  )}
                </div>
              )}

              {configSubTab === 'rules' && (
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-[#0f172a]">Reglas de Distribución</h2>
                    <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">Se ejecutan en el Corte</span>
                  </div>

                  <form onSubmit={handleAddRule} className="bg-gray-50 p-5 rounded-xl border border-gray-200 mb-8">
                    <h3 className="text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">Nueva Regla Lógica</h3>
                    <div className="flex flex-col md:flex-row items-center gap-3">
                      <div className="flex-1 w-full bg-white p-2 rounded border border-gray-200 shadow-sm">
                        <span className="text-[10px] text-gray-400 font-bold block mb-1">SI ENTRA CONCEPTO...</span>
                        <select className="w-full font-semibold text-[#0f172a] outline-none" value={newRule.concept_id} onChange={e => setNewRule({ ...newRule, concept_id: e.target.value })} required>
                          <option value="">Seleccionar concepto...</option>
                          {concepts.filter(c => c.system_behavior !== 'EXPENSE').map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                        </select>
                      </div>

                      <div className="text-gray-400">➜</div>

                      <div className="flex-1 w-full bg-white p-2 rounded border border-gray-200 shadow-sm">
                        <span className="text-[10px] text-gray-400 font-bold block mb-1">TOMAR...</span>
                        <div className="flex items-center gap-2">
                          {!newRule.is_remainder ? (
                            <div className="relative w-full">
                              <input type="number" className="w-full font-bold text-[#0f172a] outline-none pr-4" placeholder="10" value={newRule.percentage} onChange={e => setNewRule({ ...newRule, percentage: parseFloat(e.target.value) })} />
                              <span className="absolute right-0 top-0 text-gray-400">%</span>
                            </div>
                          ) : (
                            <span className="font-bold text-orange-600 text-sm w-full">El Remanente (Todo lo que sobre)</span>
                          )}
                        </div>
                        <label className="flex items-center gap-1 mt-1 cursor-pointer">
                          <input type="checkbox" checked={newRule.is_remainder} onChange={e => setNewRule({ ...newRule, is_remainder: e.target.checked })} className="rounded border-gray-300 text-[#0f172a] focus:ring-[#0f172a]" />
                          <span className="text-[10px] text-gray-500">Es remanente</span>
                        </label>
                      </div>

                      <div className="text-gray-400">➜</div>

                      <div className="flex-1 w-full bg-white p-2 rounded border border-gray-200 shadow-sm">
                        <span className="text-[10px] text-gray-400 font-bold block mb-1">MOVER A CAJA...</span>
                        <select
                          className="w-full font-semibold text-blue-600 outline-none disabled:text-gray-300"
                          value={newRule.target_wallet_id || ''}
                          onChange={e => setNewRule({ ...newRule, target_wallet_id: e.target.value })}
                          disabled={newRule.is_outflow}
                          required={!newRule.is_outflow}
                        >
                          <option value="">Seleccionar...</option>
                          {activeWallets.map(w => (
                            <option key={w.id} value={w.id}>{walletLabel(w)}</option>
                          ))}
                        </select>
                        <label className="flex items-center gap-2 text-[11px] text-gray-600 mt-1">
                          <input
                            type="checkbox"
                            checked={newRule.is_outflow}
                            onChange={e => {
                              if (e.target.checked) {
                                setNewRule({ ...newRule, is_outflow: true, target_wallet_id: '', outflow_concept_label: '' })
                              } else {
                                setNewRule({ ...newRule, is_outflow: false, target_wallet_id: '', outflow_concept_label: '' })
                              }
                            }}
                          />
                          <span>Marcar como salida (sale de sistema)</span>
                        </label>
                        {newRule.is_outflow && (
                          <div className="mt-2">
                            <span className="text-[10px] text-gray-400 font-bold block mb-1">Concepto de salida (opcional)</span>
                            <input
                              className="w-full border rounded px-2 py-2 text-sm"
                              value={newRule.outflow_concept_label}
                              onChange={e => setNewRule({ ...newRule, outflow_concept_label: e.target.value })}
                              placeholder="Ej: Diezmo hacia sede, Transferencia externa"
                            />
                          </div>
                        )}
                      </div>

                      <button className="w-full md:w-auto bg-[#0ea5e9] hover:bg-[#0284c7] text-white px-6 py-3 rounded-lg font-bold shadow-md transition whitespace-nowrap">+ Agregar</button>
                    </div>
                  </form>

                  <div className="space-y-3">
                    {rules.map((rule, idx) => {
                      const walletName = rule.is_outflow ? 'Salida' : walletLabel(wallets.find(w => w.id === rule.target_wallet_id))
                      const outflowConcept = rule.outflow_concept_label || null
                      const conceptName = concepts.find(c => c.id === rule.concept_id)?.name || 'Concepto desconocido'
                      return (
                        <div key={rule.id} className="flex items-center justify-between p-4 border rounded-lg hover:shadow-md transition bg-white group">
                          <div className="flex items-center gap-4 flex-wrap">
                            <span className="text-xs font-bold text-gray-400 mr-2">#{idx + 1}</span>
                            <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700">{conceptName}</span>
                            <span className="text-gray-300">➜</span>
                            {rule.is_remainder ? <span className="font-bold text-orange-600 text-sm">Todo el resto</span> : <span className="font-bold text-[#0f172a] text-sm">{rule.percentage}%</span>}
                            <span className="text-gray-300">➜</span>
                            {rule.is_outflow ? (
                              <div className="flex items-center gap-2 text-red-600 font-medium bg-red-50 px-3 py-1 rounded border border-red-100">
                                <span>↗</span> {walletName}
                                {outflowConcept && <span className="text-[10px] bg-white/70 text-red-700 px-2 py-0.5 rounded-full border border-red-100">{outflowConcept}</span>}
                              </div>
                            ) : (
                              <div className="flex items-center gap-2 text-blue-700 font-medium bg-blue-50 px-3 py-1 rounded border border-blue-100">
                                <span>🏦</span> {walletName}
                              </div>
                            )}
                          </div>
                          <label className="flex items-center gap-2 text-xs mr-2">
                            <input type="checkbox" checked={rule.enabled !== false} onChange={async e => {
                              await updateDistributionRule(effectiveChurchId, rule.id, { ...rule, enabled: e.target.checked })
                              refreshAllData()
                            }} />
                            <span>{rule.enabled !== false ? 'Activa' : 'Desactivada'}</span>
                          </label>
                          <button onClick={() => handleDeleteRule(rule.id)} className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition px-2" title="Eliminar regla">🗑</button>
                        </div>
                      )
                    })}
                    {rules.length === 0 && <p className="text-center text-gray-400 py-8">No hay reglas configuradas. El dinero se quedará en la caja donde ingresó.</p>}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {tab === 'corte' && (
        <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg p-8 animate-fade-in-up">
          <div className="text-center mb-8">
            <div className="inline-block p-3 rounded-full bg-blue-50 text-blue-500 text-3xl mb-4">✂️</div>
            <h2 className="text-2xl font-bold text-[#0f172a]">Corte de Caja Diario</h2>
            <p className="text-gray-500">El sistema agrupará los ingresos y aplicará tus reglas de distribución.</p>
          </div>

          <div className="flex justify-center items-end gap-4 mb-10 bg-gray-50 p-6 rounded-xl border border-gray-100">
            <div className="text-left">
              <label className="block text-xs font-bold text-gray-500 mb-1">Fecha del Corte</label>
              <input type="date" value={cutDate} onChange={e => setCutDate(e.target.value)} className="border rounded px-4 py-2 text-lg font-medium text-[#0f172a] shadow-sm" />
            </div>
            <label className="flex items-center gap-2 text-sm text-gray-700 bg-white px-3 py-2 rounded border border-gray-200">
              <input type="checkbox" checked={applyRules} onChange={e => setApplyRules(e.target.checked)} />
              <span>Aplicar reglas (recomendado)</span>
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700 bg-white px-3 py-2 rounded border border-gray-200">
              <input type="checkbox" checked={subtractTransfers} onChange={e => setSubtractTransfers(e.target.checked)} />
              <span>Restar transferencias bancarias</span>
            </label>
            <button onClick={handleCalculateCut} disabled={loadingCut} className="bg-[#0f172a] hover:bg-slate-800 text-white px-8 py-3 rounded-lg font-bold shadow-lg transition transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed border border-slate-300">
              {loadingCut ? 'Calculando...' : 'Calcular Distribución'}
            </button>
          </div>

          {cutPreview && (
            <div className="animate-fade-in-up">
              <h3 className="font-bold text-lg text-[#0f172a] mb-4 border-b pb-2">Vista Previa de Transferencias</h3>

              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
                <p className="text-sm text-yellow-800"><strong>Total Ingresado: </strong><span className="text-lg font-bold">${cutPreview.total_ingresado?.toFixed(2)}</span></p>
                {cutPreview.transfer_total ? (
                  <p className="text-xs text-gray-600 mt-1">Transferencias bancarias detectadas: ${cutPreview.transfer_total.toFixed(2)}</p>
                ) : null}
                <p className="text-sm text-yellow-800 mt-1"><strong>Total para balance: </strong><span className="text-lg font-bold">${(cutPreview.total_ingresado - (subtractTransfers ? (cutPreview.transfer_total || 0) : 0)).toFixed(2)}</span></p>
              </div>

              {/* Mostrar operaciones separadas por concepto y reglas aplicadas, usando resumen_por_concepto */}
              {cutPreview.resumen_por_concepto?.map((r, idx) => {
                // Reglas para este concepto
                const conceptRules = rules.filter(rule => rule.concept_id === r.conceptId)
                // Movimientos para este concepto
                const detalles = r.detalles || []
                return (
                  <div key={idx} className="mb-8 border rounded-lg p-4 bg-gray-50">
                    <h4 className="text-lg font-bold text-blue-700 mb-2">{r.label}</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
                      <div>
                        <p className="text-xs font-bold text-gray-500 mb-2">Reglas que se aplicarán</p>
                        <ul className="text-sm space-y-1">
                          {conceptRules.length > 0 ? conceptRules.map((rule, i) => (
                            <li key={i} className="flex flex-col gap-1 text-gray-700">
                              <div className="flex items-center justify-between">
                                <span>
                                  <span className="font-bold text-blue-700 mr-2">{rule.name || 'Regla'}</span>
                                  {rule.percentage}% ➜ {rule.is_outflow ? (rule.outflow_concept_label || 'Salida') : walletLabel(wallets.find(w => w.id === rule.target_wallet_id))}
                                </span>
                                <span className={`text-xs px-2 py-1 rounded ${rule.enabled !== false ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-500'}`}>{rule.enabled !== false ? 'Activa' : 'Desactivada'}</span>
                              </div>
                            </li>
                          )) : <li className="text-gray-400">Sin reglas para este concepto</li>}
                        </ul>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-500 mb-2">Movimientos encontrados</p>
                        <ul className="text-sm space-y-1">
                          {detalles.length > 0 ? detalles.map((d, i) => (
                            <li key={i} className="flex justify-between text-gray-700">
                              <span>
                                {d.responsable ? <span className="font-bold text-blue-800 mr-1">{d.responsable}</span> : <span className="font-bold text-gray-400 mr-1">Sin nombre</span>}
                                {d.conceptName ? <span className="text-gray-600">• {d.conceptName}</span> : null}
                              </span>
                              <span className="font-semibold">${Number(d.amount).toFixed(2)}</span>
                            </li>
                          )) : <li className="text-gray-400">Sin movimientos para este concepto</li>}
                        </ul>
                      </div>
                    </div>
                  </div>
                )
              })}

              <div className="overflow-hidden rounded-lg border border-gray-200 mb-8">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50 text-gray-500 font-medium">
                    <tr>
                      <th className="py-3 px-4 text-left">Concepto Origen</th>
                      <th className="py-3 px-4 text-center">Regla</th>
                      <th className="py-3 px-4 text-left">Caja Destino</th>
                      <th className="py-3 px-4 text-right">Monto</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {cutPreview.distribucion_sugerida?.map((item, idx) => {
                      // Buscar el nombre de la regla aplicada
                      const rule = rules.find(r => r.concept_id === item.conceptId && ((r.percentage === item.percentage && !item.is_remainder) || (r.is_remainder && item.is_remainder)))
                      return (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="py-3 px-4 font-medium text-gray-700">{item.from_concept_label || item.from_behavior_label}</td>
                          <td className="py-3 px-4 text-center text-xs">
                            {rule?.name && <span className="font-bold text-blue-700 mr-1">{rule.name}</span>}
                            {item.is_remainder ? <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded font-bold">Remanente</span> : `${item.percentage}%`}
                          </td>
                          <td className="py-3 px-4 text-blue-600 font-medium">{item.target_wallet_name}</td>
                          <td className="py-3 px-4 text-right font-bold text-green-700">+ ${Number(item.amount).toFixed(2)}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              <button onClick={handleCommitCut} disabled={loadingCut} className="w-full bg-green-600 hover:bg-green-700 text-white py-4 rounded-xl font-bold text-lg shadow-xl transition transform hover:scale-[1.01]">✅ Confirmar y Generar Movimientos</button>
            </div>
          )}
        </div>
      )}

      {tab === 'corte' && cutReceipt && (
        <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg p-6 mt-6 border border-gray-100 animate-fade-in-up">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-xl font-bold text-[#0f172a]">Recibo de Corte</h3>
              <p className="text-sm text-gray-500">Fecha: {cutReceipt.date}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Total contabilizado</p>
              <p className="text-2xl font-bold text-green-700">${cutReceipt.total?.toFixed(2)}</p>
              {cutReceipt.transfer_total ? (
                <p className="text-xs text-gray-500 mt-1">Transferencias: -${cutReceipt.transfer_total.toFixed(2)}</p>
              ) : null}
              <p className="text-sm text-gray-700 mt-1 font-semibold">Balance tras transferencias: ${ (cutReceipt.total_balance ?? cutReceipt.total)?.toFixed(2) }</p>
            </div>
          </div>
          <button
            className="mb-4 bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded font-bold shadow"
            onClick={() => {
              generateCutReceiptPDF({
                churchName: 'Nombre de la Iglesia', // Puedes obtenerlo dinámicamente si lo tienes
                date: cutReceipt.date,
                totalIngreso: cutReceipt.total_balance ?? cutReceipt.total,
                totalEgreso: 0, // Si tienes egresos, pásalos aquí
                movimientos: cutReceipt.movimientos,
                reglas: rules
              })
            }}
          >Descargar Recibo PDF</button>
          {cutReceipt.resumen.map((r, idx) => {
            // Para cada concepto, mostrar reglas y opción de activar/desactivar
            const conceptRules = rules.filter(rule => rule.applies_to_behavior === r.behavior)
            return (
              <div key={idx} className="mb-6">
                <h4 className="text-lg font-bold text-blue-700 mb-2">{r.label}</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                    <p className="text-xs font-bold text-gray-500 mb-2">Reglas para este concepto</p>
                    <ul className="text-sm space-y-1">
                      {conceptRules.map((rule, i) => (
                        <li key={i} className="flex items-center justify-between text-gray-700">
                          <span>{rule.percentage}% ➜ {rule.is_outflow ? (rule.outflow_concept_label || 'Salida') : walletLabel(wallets.find(w => w.id === rule.target_wallet_id))}</span>
                          <label className="flex items-center gap-2 text-xs">
                            <input type="checkbox" checked={rule.enabled !== false} onChange={async e => {
                              await updateDistributionRule(effectiveChurchId, rule.id, { ...rule, enabled: e.target.checked })
                              refreshAllData()
                            }} />
                            <span>{rule.enabled !== false ? 'Activa' : 'Desactivada'}</span>
                          </label>
                        </li>
                      ))}
                      {conceptRules.length === 0 && <li className="text-gray-400">Sin reglas para este concepto</li>}
                    </ul>
                  </div>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                    <p className="text-xs font-bold text-gray-500 mb-2">Detalle de ingresos</p>
                    <ul className="text-sm space-y-1">
                      {(r.detalles || []).map((d, i) => (
                        <li key={i} className="flex justify-between text-gray-700">
                          <span>
                            {d.responsable ? <span className="font-bold text-blue-800 mr-1">{d.responsable}</span> : <span className="font-bold text-gray-400 mr-1">Sin nombre</span>}
                            {d.conceptName ? <span className="text-gray-600">• {d.conceptName}</span> : null}
                          </span>
                          <span className="font-semibold">${Number(d.amount).toFixed(2)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                  <p className="text-xs font-bold text-gray-500 mb-2">Movimientos generados</p>
                  <ul className="text-sm divide-y divide-gray-200">
                    {cutReceipt.movimientos.filter(m => m.source_behavior === r.behavior).map((m, i) => {
                      const walletName = walletLabel(wallets.find(w => w.id === (m.wallet_id || m.walletId)) || m.wallet_snapshot)
                      return (
                        <li key={i} className="py-2 flex justify-between text-gray-700">
                          <span>{m.date || cutReceipt.date} • {walletName} • {m.responsable || 'Corte automático'}</span>
                          <span className="font-semibold">${Number(m.amount).toFixed(2)}</span>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {tab === 'contabilidad' && (
        <div className="animate-fade-in-up">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white rounded-xl shadow-lg p-8 border border-green-100">
              <h2 className="text-xl font-bold mb-6 text-green-800 flex items-center gap-2"><span className="bg-green-100 p-2 rounded-lg">📥</span> Registrar Ingreso</h2>
              <form onSubmit={handleIncomeSubmit} className="flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <input name="amount" value={income.amount} onChange={e => setIncome({ ...income, amount: e.target.value })} type="number" placeholder="Monto" className="border rounded px-3 py-2" required />
                  <input type="date" value={income.date} onChange={e => setIncome({ ...income, date: e.target.value })} className="border rounded px-3 py-2" required />
                </div>
                <label className="text-xs font-bold text-gray-500 mb-1 block">Caja (opciones: nuestras cajas guardadas)</label>
                <select value={income.walletId} onChange={e => setIncome({ ...income, walletId: e.target.value })} className="border rounded px-3 py-2 w-full" required>
                  <option value="">Selecciona caja/cuenta</option>
                  {activeWallets.map(w => (
                    <option key={w.id} value={w.id}>{walletLabel(w)} ({w.typeLabel})</option>
                  ))}
                </select>
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-gray-500 mb-1 block">Tipo de transacción</label>
                  <select value={income.transactionType || ''} onChange={e => setIncome({ ...income, transactionType: e.target.value })} className="border rounded px-3 py-2 w-full" required>
                    <option value="">Selecciona tipo...</option>
                    <option value="FISICA">Física</option>
                    <option value="BANCARIA">Bancaria</option>
                    <option value="PERMANENCIA">Permanencia en caja</option>
                  </select>
                </div>
                <div className="flex flex-col gap-2">
                  {incomeConcepts.length === 0 ? (
                    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 rounded flex flex-col items-start gap-2">
                      <span className="text-yellow-800 text-sm">No hay conceptos de ingreso disponibles.<br/>Crea un concepto para poder registrar ingresos.</span>
                      <button type="button" onClick={() => { setTab('config'); setConfigSubTab('wallets'); setShowConceptModal(true); }} className="bg-blue-100 text-blue-700 px-4 py-2 rounded font-semibold">+ Crear Concepto</button>
                    </div>
                  ) : (
                    <select value={income.conceptId} onChange={e => setIncome({ ...income, conceptId: e.target.value })} className="border rounded px-3 py-2 w-full" required>
                      <option value="">Concepto...</option>
                      {incomeConcepts.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  )}
                </div>
                <Combobox value={income.responsable} onChange={handleSelectResponsable}>
                  <div className="relative">
                    <Combobox.Input className="border rounded px-3 py-2 w-full" onChange={e => setIncomeQuery(e.target.value)} placeholder="Responsable (Miembro)" />
                    <Combobox.Options className="absolute z-10 w-full bg-white border shadow-lg max-h-40 overflow-auto">
                      {incomeOptions.map(opt => (
                        <Combobox.Option key={opt.id} value={opt.name} className="px-4 py-2 hover:bg-green-50 cursor-pointer">{opt.name}</Combobox.Option>
                      ))}
                    </Combobox.Options>
                  </div>
                </Combobox>
                <button type="submit" className="bg-green-700 hover:bg-green-800 text-white py-3 rounded-lg font-bold shadow mt-2">Guardar Ingreso</button>
              </form>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-8 border border-red-100">
              <h2 className="text-xl font-bold mb-6 text-red-800 flex items-center gap-2"><span className="bg-red-100 p-2 rounded-lg">📤</span> Registrar Gasto</h2>
              <form onSubmit={handleExpenseSubmit} className="flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <input name="amount" value={expense.amount} onChange={e => setExpense({ ...expense, amount: e.target.value })} type="number" placeholder="Monto" className="border rounded px-3 py-2" required />
                  <input type="date" value={expense.date} onChange={e => setExpense({ ...expense, date: e.target.value })} className="border rounded px-3 py-2" required />
                </div>
                <label className="text-xs font-bold text-gray-500 mb-1 block">Caja (opciones: nuestras cajas guardadas)</label>
                <select value={expense.walletId} onChange={e => setExpense({ ...expense, walletId: e.target.value })} className="border rounded px-3 py-2 w-full" required>
                  <option value="">Selecciona caja/cuenta</option>
                  {activeWallets.map(w => (
                    <option key={w.id} value={w.id}>{walletLabel(w)} ({w.typeLabel})</option>
                  ))}
                </select>
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-gray-500 mb-1 block">Tipo de transacción</label>
                  <select value={expense.transactionType || ''} onChange={e => setExpense({ ...expense, transactionType: e.target.value })} className="border rounded px-3 py-2 w-full" required>
                    <option value="">Selecciona tipo...</option>
                    <option value="FISICA">Física</option>
                    <option value="BANCARIA">Bancaria</option>
                    <option value="PERMANENCIA">Permanencia en caja</option>
                  </select>
                </div>
                <div className="flex flex-col gap-2">
                  {expenseConcepts.length === 0 ? (
                    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 rounded flex flex-col items-start gap-2">
                      <span className="text-yellow-800 text-sm">No hay conceptos de gasto disponibles.<br/>Crea un concepto de gasto para poder registrar egresos.</span>
                      <button type="button" onClick={() => setShowConceptModal(true)} className="bg-blue-100 text-blue-700 px-4 py-2 rounded font-semibold">+ Crear Concepto</button>
                    </div>
                  ) : (
                    <select value={expense.conceptId} onChange={e => setExpense({ ...expense, conceptId: e.target.value })} className="border rounded px-3 py-2 w-full" required>
                      <option value="">Concepto de Gasto...</option>
                      {expenseConcepts.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  )}
                </div>
                <Combobox value={expense.responsable} onChange={handleSelectResponsable}>
                  <div className="relative">
                    <Combobox.Input className="border rounded px-3 py-2 w-full" onChange={e => setIncomeQuery(e.target.value)} placeholder="Autorizado por..." />
                    <Combobox.Options className="absolute z-10 w-full bg-white border shadow-lg max-h-40 overflow-auto">
                      {incomeOptions.map(opt => (
                        <Combobox.Option key={opt.id} value={opt.name} className="px-4 py-2 hover:bg-green-50 cursor-pointer">{opt.name}</Combobox.Option>
                      ))}
                    </Combobox.Options>
                  </div>
                </Combobox>
                <button type="submit" className="bg-red-700 hover:bg-red-800 text-white py-3 rounded-lg font-bold shadow mt-2">Guardar Egreso</button>
              </form>
            </div>
          </div>
          <div className="mt-10 bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <h3 className="text-lg font-bold mb-4 text-[#0f172a]">Movimientos recientes</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="py-3 px-4 text-left text-gray-500">Fecha</th>
                    <th className="py-3 px-4 text-left text-gray-500">Concepto</th>
                    <th className="py-3 px-4 text-left text-gray-500">Caja</th>
                    <th className="py-3 px-4 text-left text-gray-500">Tipo</th>
                    <th className="py-3 px-4 text-right text-gray-500">Monto</th>
                  </tr>
                </thead>
                <tbody>
                  {records
                    .filter(r => {
                      if (!lastCutDate) return true
                      const recDate = r.date || (r.createdAt && new Date(r.createdAt.seconds * 1000).toISOString().slice(0, 10))
                      return !recDate || recDate > lastCutDate
                    })
                    .slice(0, 10)
                    .map(r => {
                    const conceptId = r.concept_id || r.conceptId
                    const walletId = r.wallet_id || r.walletId
                    const conceptName = concepts.find(c => c.id === conceptId)?.name || r.concept_snapshot?.name || r.concepto || '—'
                    const walletName = walletLabel(wallets.find(w => w.id === walletId) || r.wallet_snapshot)
                    return (
                      <tr key={r.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4">{r.date || (r.createdAt && new Date(r.createdAt.seconds * 1000).toLocaleDateString())}</td>
                        <td className="py-3 px-4 font-medium text-[#0f172a]">{conceptName}<div className="text-xs text-gray-400 font-normal">{r.responsable}</div></td>
                        <td className="py-3 px-4 text-gray-600">{walletName}</td>
                        <td className="py-3 px-4 text-gray-600">
                          {r.transactionType === 'BANCARIA' ? (
                            <span className="inline-block bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs font-semibold">Transferencia</span>
                          ) : (
                            <span className="inline-block bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-xs font-semibold">Efectivo</span>
                          )}
                        </td>
                        <td className={`py-3 px-4 text-right font-bold ${r.kind === 'ingreso' ? 'text-green-600' : 'text-red-600'}`}>{r.kind === 'ingreso' ? '+' : '-'} ${r.amount || r.cantidad}</td>
                        <td className="py-3 px-4 text-right">
                          <button className="text-xs text-blue-600 underline" onClick={() => setEditMovement({ ...r, wallet_id: walletId, concept_id: conceptId })}>Editar</button>
                        </td>
                      </tr>
                    )
                  })}
                  {records.filter(r => {
                    if (!lastCutDate) return true
                    const recDate = r.date || (r.createdAt && new Date(r.createdAt.seconds * 1000).toISOString().slice(0, 10))
                    return !recDate || recDate > lastCutDate
                  }).length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-4 text-center text-gray-400">
                        Sin movimientos desde el último corte. Registra nuevos ingresos/egresos.
                      </td>
                    </tr>
                  )}
                      {/* Modal para editar movimiento */}
                      {editMovement && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
                          <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md relative">
                            <button className="absolute top-2 right-2 text-gray-400 hover:text-red-500" onClick={() => setEditMovement(null)}>✕</button>
                            <h3 className="text-lg font-bold mb-4">Editar Movimiento</h3>
                            <form onSubmit={async e => {
                              e.preventDefault()
                              await updateTransaction(effectiveChurchId, editMovement.id, {
                                amount: Number(editMovement.amount),
                                kind: editMovement.kind,
                                concept_id: editMovement.concept_id,
                                responsable: editMovement.responsable,
                                responsableId: editMovement.responsableId,
                                wallet_id: editMovement.wallet_id
                              })
                              setEditMovement(null)
                              refreshAllData()
                            }} className="flex flex-col gap-4">
                              <input type="number" value={editMovement.amount} onChange={e => setEditMovement({ ...editMovement, amount: e.target.value })} className="border rounded px-3 py-2" placeholder="Monto" required />
                              <label className="text-xs font-bold text-gray-500 mb-1 block">Tipo de movimiento</label>
                              <select value={editMovement.kind} onChange={e => setEditMovement({ ...editMovement, kind: e.target.value })} className="border rounded px-3 py-2" required>
                                <option value="ingreso">Ingreso</option>
                                <option value="egreso">Egreso</option>
                              </select>
                              <label className="text-xs font-bold text-gray-500 mb-1 block">Concepto (opciones: conceptos registrados)</label>
                              <select value={editMovement.concept_id} onChange={e => setEditMovement({ ...editMovement, concept_id: e.target.value })} className="border rounded px-3 py-2" required>
                                <option value="">Concepto...</option>
                                {concepts.map(c => (
                                  <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                              </select>
                              <label className="text-xs font-bold text-gray-500 mb-1 block">Caja (opciones: nuestras cajas guardadas)</label>
                              <select value={editMovement.wallet_id} onChange={e => setEditMovement({ ...editMovement, wallet_id: e.target.value })} className="border rounded px-3 py-2" required>
                                <option value="">Caja/Cuenta...</option>
                                {activeWallets.map(w => (
                                  <option key={w.id} value={w.id}>{walletLabel(w)}</option>
                                ))}
                              </select>
                              <input value={editMovement.responsable} onChange={e => setEditMovement({ ...editMovement, responsable: e.target.value })} className="border rounded px-3 py-2" placeholder="Responsable" />
                              <div className="flex gap-2 mt-2">
                                <button type="submit" className="bg-blue-700 hover:bg-blue-800 text-white py-3 rounded-lg font-bold shadow">Guardar Cambios</button>
                                <button type="button" className="bg-red-600 hover:bg-red-700 text-white py-3 rounded-lg font-bold shadow" onClick={async () => {
                                  if (window.confirm('¿Eliminar este movimiento? Esta acción no se puede deshacer.')) {
                                    await deleteTransaction(effectiveChurchId, editMovement.id)
                                    setEditMovement(null)
                                    refreshAllData()
                                    setTimeout(() => {
                                      alert('Movimiento eliminado correctamente.')
                                    }, 100)
                                  }
                                }}>Eliminar</button>
                              </div>
                            </form>
                          </div>
                        </div>
                      )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {tab === 'historial' && (
        <div className="bg-white rounded-xl shadow-lg p-6 animate-fade-in-up">
          <h3 className="text-lg font-bold mb-4 text-[#0f172a]">Historial de Cortes de Caja</h3>
          <div className="mb-4 flex flex-wrap gap-2 items-end">
            <input
              type="text"
              placeholder="Buscar por nombre de miembro..."
              value={searchName}
              onChange={e => setSearchName(e.target.value)}
              className="border rounded px-3 py-2 text-sm"
            />
            <label className="text-xs text-gray-500">Desde
              <input type="date" value={searchStart} onChange={e => setSearchStart(e.target.value)} className="ml-1 border rounded px-2 py-1 text-sm" />
            </label>
            <label className="text-xs text-gray-500">Hasta
              <input type="date" value={searchEnd} onChange={e => setSearchEnd(e.target.value)} className="ml-1 border rounded px-2 py-1 text-sm" />
            </label>
          </div>
          {filteredMovements.length > 0 ? (
            <div className="overflow-x-auto mb-8">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="py-3 px-4 text-left text-gray-500">Fecha</th>
                    <th className="py-3 px-4 text-left text-gray-500">Responsable</th>
                    <th className="py-3 px-4 text-left text-gray-500">Concepto</th>
                    <th className="py-3 px-4 text-right text-gray-500">Monto</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMovements.map((m, i) => (
                    <tr key={i} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">{m.fecha || '—'}</td>
                      <td className="py-3 px-4">{m.responsable || '—'}</td>
                      <td className="py-3 px-4">{m.conceptName || m.concepto || '—'}</td>
                      <td className="py-3 px-4 text-right">${Number(m.amount).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
          {loadingCutsHistory ? (
            <div className="text-center text-gray-400 py-8">Cargando historial...</div>
          ) : filteredMovements.length === 0 && (searchName || searchStart || searchEnd) ? (
            <div className="text-center text-gray-400 py-8">No se encontraron movimientos con esos filtros.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="py-3 px-4 text-left text-gray-500">Fecha</th>
                    <th className="py-3 px-4 text-left text-gray-500">Total</th>
                    <th className="py-3 px-4 text-left text-gray-500">Movimientos</th>
                  </tr>
                </thead>
                <tbody>
                  {cutsHistory.map(cut => (
                    <tr key={cut.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium">{cut.date}</td>
                      <td className="py-3 px-4">${Number(cut.total).toFixed(2)}</td>
                      <td className="py-3 px-4">{cut.movimientos?.length || 0}</td>
                    </tr>
                  ))}
                  {cutsHistory.length === 0 && (
                    <tr><td colSpan={3} className="text-center text-gray-400 py-8">No hay cortes registrados.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
    {editWallet && (
      <EditWalletModal wallet={editWallet} onSave={handleEditWallet} onClose={() => setEditWallet(null)} />
    )}
    {showConceptModal && (
      <EditConceptModal concept={{}} onSave={handleCreateConcept} onClose={() => setShowConceptModal(false)} allowExpense allowSpecialExpense />
    )}
    {editConcept && (
      <EditConceptModal concept={editConcept} onSave={handleEditConcept} onClose={() => setEditConcept(null)} allowExpense allowSpecialExpense />
    )}
    </>
  )
}

export default Treasury
