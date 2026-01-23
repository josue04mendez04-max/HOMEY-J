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
export async function processDailyCut(churchId, dateISO) {
  const [concepts, txs, rules, wallets] = await Promise.all([
    listFinanceConcepts(churchId),
    listFinanceRecords(churchId),
    listDistributionRules(churchId),
    listWallets(churchId)
  ])
  const targetDate = new Date(dateISO)
  const conceptById = Object.fromEntries(concepts.map(c => [c.id, c]))
  const walletById = Object.fromEntries(wallets.map(w => [w.id, w]))

  const todays = txs.filter(t => {
    if (t.kind !== 'ingreso') return false
    if (t.date) return t.date === dateISO
    return sameDay(t.createdAt, targetDate)
  })

  const byBehavior = {}
  const detailsByBehavior = {}
  todays.forEach(t => {
    const concept = conceptById[t.concept_id || t.conceptId]
    const behavior = concept?.system_behavior || 'GENERAL_INCOME'
    const amount = Number(t.amount || t.cantidad || 0)
    byBehavior[behavior] = (byBehavior[behavior] || 0) + amount
    if (!detailsByBehavior[behavior]) detailsByBehavior[behavior] = []
    detailsByBehavior[behavior].push({
      conceptName: concept?.name || t.concepto || 'Sin concepto',
      amount,
      responsable: t.responsable || '—'
    })
  })

  const total_ingresado = Object.values(byBehavior).reduce((sum, v) => sum + v, 0)
  const distribucion_sugerida = []

  Object.entries(byBehavior).forEach(([behavior, total]) => {
    const behaviorRules = rules
      .filter(r => r.applies_to_behavior === behavior)
      .sort((a, b) => (a.priority || 0) - (b.priority || 0))

    let remaining = total
    const percentageRules = behaviorRules.filter(r => !r.is_remainder)
    const remainderRules = behaviorRules.filter(r => r.is_remainder)

    percentageRules.forEach(r => {
      const amount = Math.round((total * Number(r.percentage || 0)) / 100 * 100) / 100
      remaining -= amount
      const targetWallet = walletById[r.target_wallet_id]
      const target_wallet_name = r.is_outflow ? 'Salida' : targetWallet?.name || 'Caja desconocida'
      distribucion_sugerida.push({
        from_behavior_label: BEHAVIOR_LABELS[behavior] || behavior,
        target_wallet_name,
        target_wallet_id: r.is_outflow ? null : r.target_wallet_id,
        amount,
        percentage: r.percentage,
        is_remainder: false,
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
        from_behavior_label: BEHAVIOR_LABELS[behavior] || behavior,
        target_wallet_name,
        target_wallet_id: r.is_outflow ? null : r.target_wallet_id,
        amount,
        percentage: 0,
        is_remainder: true,
        behavior,
        is_outflow: !!r.is_outflow,
        outflow_concept_id: r.outflow_concept_id || null,
        outflow_concept_label: r.outflow_concept_label || null
      })
    })

    if (behaviorRules.length === 0 && total > 0) {
      distribucion_sugerida.push({
        from_behavior_label: BEHAVIOR_LABELS[behavior] || behavior,
        target_wallet_name: '(Sin regla definida)',
        target_wallet_id: null,
        amount: total,
        percentage: 100,
        is_remainder: false,
        behavior
      })
    }
  })

  return {
    date: dateISO,
    total_ingresado,
    resumen_por_tipo: Object.entries(byBehavior).map(([k, v]) => ({
      label: BEHAVIOR_LABELS[k] || k,
      behavior: k,
      total: v,
      detalles: detailsByBehavior[k] || []
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
