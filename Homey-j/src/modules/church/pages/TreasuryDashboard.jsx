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
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">Dashboard de Tesorería</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-green-50 rounded-lg shadow p-6 flex flex-col items-center">
          <span className="text-3xl font-bold text-hunter">${'{'}totalIncome{'}'}</span>
          <span className="text-navy/80 mt-2">Total Ingresos</span>
        </div>
        <div className="bg-red-50 rounded-lg shadow p-6 flex flex-col items-center">
          <span className="text-3xl font-bold text-navy">${'{'}totalExpense{'}'}</span>
          <span className="text-navy/80 mt-2">Total Egresos</span>
        </div>
        <div className="bg-gold/20 rounded-lg shadow p-6 flex flex-col items-center">
          <span className="text-3xl font-bold text-gold">${'{'}totalIncome - totalExpense{'}'}</span>
          <span className="text-navy/80 mt-2">Balance</span>
        </div>
      </div>
      <div className="bg-white rounded-xl shadow p-6 max-w-3xl mx-auto">
        <h3 className="text-lg font-bold mb-4">Movimientos recientes</h3>
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
      {/* Aquí puedes adjuntar las ofrendas de los líderes si tienes esa colección */}
    </div>
  )
}

export default TreasuryDashboard
