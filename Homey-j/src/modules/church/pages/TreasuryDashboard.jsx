import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { listFinanceRecords } from '../../../core/data/financesService'

function TreasuryDashboard() {
  const { churchId } = useParams()
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [totalIncome, setTotalIncome] = useState(0)
  const [totalExpense, setTotalExpense] = useState(0)

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      const data = await listFinanceRecords(churchId)
      setRecords(data)
      setTotalIncome(data.filter(r => r.kind === 'ingreso').reduce((sum, r) => sum + Number(r.cantidad || 0), 0))
      setTotalExpense(data.filter(r => r.kind === 'egreso').reduce((sum, r) => sum + Number(r.cantidad || 0), 0))
      setLoading(false)
    }
    fetchData()
  }, [churchId])

  return (
    <div className="min-h-screen bg-[#f8fafc] px-4 sm:px-8 py-8 text-[#0f172a]">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
          <p className="text-xs uppercase tracking-[0.2em] text-[#94a3b8]">Tesorería</p>
          <h2 className="text-3xl font-semibold mt-1">Dashboard financiero</h2>
          <p className="text-sm text-[#475569] mt-1">Resumen de ingresos, egresos y movimientos recientes.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-8 fade-in-up">
          <div className="bg-white rounded-xl shadow p-6 flex flex-col items-center">
            <p className="text-xs text-[#94a3b8]">Total Ingresos</p>
            <span className="text-3xl font-bold text-[#0ea5e9]">${'{'}totalIncome{'}'}</span>
          </div>
          <div className="bg-white rounded-xl shadow p-6 flex flex-col items-center">
            <p className="text-xs text-[#94a3b8]">Total Egresos</p>
            <span className="text-3xl font-bold text-[#ef4444]">${'{'}totalExpense{'}'}</span>
          </div>
          <div className="bg-white rounded-xl shadow p-6 flex flex-col items-center">
            <p className="text-xs text-[#94a3b8]">Balance</p>
            <span className="text-3xl font-bold text-[#16a34a]">${'{'}totalIncome - totalExpense{'}'}</span>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow p-6 fade-in-up-delayed">
          <h3 className="text-lg font-semibold mb-4">Movimientos recientes</h3>
          {loading ? (
            <div className="text-[#94a3b8]">Cargando...</div>
          ) : records.length === 0 ? (
            <div className="text-[#94a3b8]">No hay registros aún.</div>
          ) : (
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-[#e2e8f0] text-[#94a3b8] bg-[#f8fafc]">
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
                  <tr key={r.id} className={`border-b border-[#f1f5f9] hover:bg-[#f8fafc] transition duration-150 ease-out ${r.kind === 'ingreso' ? 'bg-[#ecfeff]' : r.kind === 'egreso' ? 'bg-[#fef2f2]' : ''}`}>
                    <td className="py-2 px-4 font-mono text-xs text-[#0f172a]">{r.id}</td>
                    <td className="py-2 px-4 capitalize text-[#334155]">{r.kind}</td>
                    <td className="py-2 px-4 text-[#334155]">{r.cantidad}</td>
                    <td className="py-2 px-4 text-[#334155]">{r.concepto}</td>
                    <td className="py-2 px-4 text-[#334155]">{r.responsable}</td>
                    <td className="py-2 px-4 text-[#334155]">{r.fecha || (r.createdAt && new Date(r.createdAt.seconds * 1000).toLocaleDateString())}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        {/* Aquí puedes adjuntar las ofrendas de los líderes si tienes esa colección */}
      </div>
    </div>
  )
}

export default TreasuryDashboard
