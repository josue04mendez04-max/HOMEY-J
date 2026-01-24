import { listFinanceConcepts } from './financeConceptsService'
import { listFinanceRecords, addTransaction } from './financesService'
import { listDistributionRules } from './distributionRulesService'
import { listWallets } from './walletsService'

const BEHAVIOR_LABELS = {
  TITHE: 'Diezmos',
  OFFERING: 'Ofrendas',
  GENERAL_INCOME: 'Ingresos Generales',
  INCOME: 'Ingresos',
  EXPENSE: 'Egresos'
}

function sameDay(ts, targetDate) {
  const d = ts?.toDate ? ts.toDate() : ts?.seconds ? new Date(ts.seconds * 1000) : null
  if (!d) return false
  return d.getFullYear() === targetDate.getFullYear() && d.getMonth() === targetDate.getMonth() && d.getDate() === targetDate.getDate()
}

// Calcula la distribución sugerida para un corte diario
export async function processDailyCut(churchId, dateISO, applyRules = true) {
  const [concepts, txs, rulesRaw, wallets] = await Promise.all([
    listFinanceConcepts(churchId),
    listFinanceRecords(churchId),
    applyRules ? listDistributionRules(churchId) : Promise.resolve([]),
    listWallets(churchId)
  ])
  const rules = applyRules ? rulesRaw.filter(r => r.enabled !== false) : []
  const targetDate = new Date(dateISO)
  const conceptById = Object.fromEntries(concepts.map(c => [c.id, c]))
  const walletById = Object.fromEntries(wallets.map(w => [w.id, w]))

  const todays = txs.filter(t => {
    if (t.kind !== 'ingreso') return false
    if (t.date) return t.date === dateISO
    return sameDay(t.createdAt, targetDate)
  })

  // Agrupar por concepto individual
  const byConcept = {}
  const detailsByConcept = {}
  let transfer_total = 0
  todays.forEach(t => {
    const conceptId = t.concept_id || t.conceptId
    const concept = conceptById[conceptId]
    const amount = Number(t.amount || t.cantidad || 0)
    const transactionType = t.transactionType || t.tipoTransaccion || ''
    if (transactionType === 'BANCARIA') {
      transfer_total += amount
    }
    byConcept[conceptId] = (byConcept[conceptId] || 0) + amount
    if (!detailsByConcept[conceptId]) detailsByConcept[conceptId] = []
    detailsByConcept[conceptId].push({
      conceptName: concept?.name || t.concepto || 'Sin concepto',
      amount,
      responsable: t.responsable || '—',
      transactionType
    })
  })

  const total_ingresado = Object.values(byConcept).reduce((sum, v) => sum + v, 0)
  const distribucion_sugerida = []

  Object.entries(byConcept).forEach(([conceptId, total]) => {
    const concept = conceptById[conceptId]
    const behavior = concept?.system_behavior || 'GENERAL_INCOME'
    // Reglas que aplican a este concepto
    const conceptRules = rules
      .filter(r => r.concept_id === conceptId)
      .sort((a, b) => (a.priority || 0) - (b.priority || 0))

    let remaining = total
    const percentageRules = conceptRules.filter(r => !r.is_remainder)
    const remainderRules = conceptRules.filter(r => r.is_remainder)

    percentageRules.forEach(r => {
      const amount = Math.round((total * Number(r.percentage || 0)) / 100 * 100) / 100
      remaining -= amount
      const targetWallet = walletById[r.target_wallet_id]
      const target_wallet_name = r.is_outflow ? 'Salida' : targetWallet?.name || 'Caja desconocida'
      distribucion_sugerida.push({
        from_concept_label: concept?.name || conceptId,
        target_wallet_name,
        target_wallet_id: r.is_outflow ? null : r.target_wallet_id,
        amount,
        percentage: r.percentage,
        is_remainder: false,
        conceptId,
        behavior,
        is_outflow: !!r.is_outflow,
        outflow_concept_id: r.outflow_concept_id || null,
        outflow_concept_label: r.outflow_concept_label || null
      })
    })

    remainderRules.forEach(r => {
      const amount = Math.max(0, Math.round(remaining * 100) / 100)
      remaining = 0
      const targetWallet = walletById[r.target_wallet_id]
      const target_wallet_name = r.is_outflow ? 'Salida' : targetWallet?.name || 'Caja desconocida'
      distribucion_sugerida.push({
        from_concept_label: concept?.name || conceptId,
        target_wallet_name,
        target_wallet_id: r.is_outflow ? null : r.target_wallet_id,
        amount,
        percentage: 0,
        is_remainder: true,
        conceptId,
        behavior,
        is_outflow: !!r.is_outflow,
        outflow_concept_id: r.outflow_concept_id || null,
        outflow_concept_label: r.outflow_concept_label || null
      })
    })

    if (conceptRules.length === 0 && total > 0) {
      distribucion_sugerida.push({
        from_concept_label: concept?.name || conceptId,
        target_wallet_name: '(Sin regla definida)',
        target_wallet_id: null,
        amount: total,
        percentage: 100,
        is_remainder: false,
        conceptId,
        behavior
      })
    }
  })

  return {
    date: dateISO,
    total_ingresado,
      transfer_total,
    resumen_por_concepto: Object.entries(byConcept).map(([k, v]) => ({
      label: conceptById[k]?.name || k,
      conceptId: k,
      behavior: conceptById[k]?.system_behavior || 'GENERAL_INCOME',
      total: v,
      detalles: detailsByConcept[k] || []
    })),
    distribucion_sugerida,
    wallets
  }
}

export async function commitCut(churchId, distribucion_sugerida, dateISO) {
  const results = []
  for (const item of distribucion_sugerida) {
    if (!item.target_wallet_id || item.amount <= 0) continue
    const wallet_snapshot = item.target_wallet_name ? { id: item.target_wallet_id, name: item.target_wallet_name } : null
    const tx = await addTransaction(churchId, {
      kind: 'transferencia',
      amount: item.amount,
      wallet_id: item.target_wallet_id,
      concept_id: null,
      date: dateISO,
      responsable: 'Corte automático',
      source_behavior: item.behavior,
      reason: item.reason,
      wallet_snapshot
    })
    results.push(tx)
  }
  return results
}

export const calculateDailyCut = processDailyCut
