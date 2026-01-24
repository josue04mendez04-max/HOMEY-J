import jsPDF from 'jspdf'
import 'jspdf-autotable'

export function generateCutReceiptPDF({ churchName, date, totalIngreso, totalEgreso, movimientos, reglas }) {
  const doc = new jsPDF()
  doc.setFontSize(18)
  doc.text('Recibo de Corte - Tesorería', 14, 18)
  doc.setFontSize(12)
  doc.text(`Iglesia: ${churchName || ''}`, 14, 28)
  doc.text(`Fecha: ${date || ''}`, 14, 36)
  doc.text(`Total Ingresos: $${Number(totalIngreso).toFixed(2)}`, 14, 44)
  doc.text(`Total Egresos: $${Number(totalEgreso).toFixed(2)}`, 14, 52)

  doc.setFontSize(14)
  doc.text('Movimientos', 14, 62)
  doc.autoTable({
    startY: 66,
    head: [['Nombre', 'Concepto', 'Monto', 'Fecha']],
    body: movimientos.map(m => [
      m.responsable || '—',
      m.conceptName || m.concepto || '—',
      `$${Number(m.amount).toFixed(2)}`,
      m.date || ''
    ]),
    theme: 'grid',
    styles: { fontSize: 10 }
  })

  let reglasStartY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 10 : 80
  doc.setFontSize(14)
  doc.text('Reglas Aplicadas', 14, reglasStartY)
  doc.setFontSize(10)
  reglas.forEach((r, i) => {
    doc.text(
      `${i + 1}. ${r.name || 'Regla'}: ${r.percentage || 0}% ➜ ${r.is_outflow ? (r.outflow_concept_label || 'Salida') : r.target_wallet_name || 'Caja'} (${r.enabled !== false ? 'Activa' : 'Desactivada'})`,
      14,
      reglasStartY + 8 + i * 6
    )
  })

  doc.save(`recibo-corte-${date || ''}.pdf`)
}
