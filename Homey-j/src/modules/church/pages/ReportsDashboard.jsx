import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { listReportMembers } from '../../../core/data/reportsService'

function ReportsDashboard() {
  const { churchId } = useParams()
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    listReportMembers(churchId).then(data => {
      setReports(data.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)))
      setLoading(false)
    })
  }, [churchId])

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-navy">Reportes de miembros</h2>
      {loading ? (
        <div className="text-navy/60">Cargando...</div>
      ) : reports.length === 0 ? (
        <div className="text-navy/60">No hay reportes aún.</div>
      ) : (
        <table className="min-w-full text-sm bg-white rounded-xl shadow overflow-hidden">
          <thead>
            <tr className="border-b border-navy/10">
              <th className="py-2 px-4">Nombre</th>
              <th className="py-2 px-4">Ministerio</th>
              <th className="py-2 px-4">Capítulos</th>
              <th className="py-2 px-4">Horas</th>
              <th className="py-2 px-4">Ayunos</th>
              <th className="py-2 px-4">Almas</th>
              <th className="py-2 px-4">Altar</th>
              <th className="py-2 px-4">Fecha</th>
            </tr>
          </thead>
          <tbody>
            {reports.map(r => (
              <tr key={r.id} className="border-b border-navy/5">
                <td className="py-2 px-4">{r.name}</td>
                <td className="py-2 px-4">{r.ministry}</td>
                <td className="py-2 px-4">{r.capitulos}</td>
                <td className="py-2 px-4">{r.horas}</td>
                <td className="py-2 px-4">{r.ayunos}</td>
                <td className="py-2 px-4">{r.almas}</td>
                <td className="py-2 px-4">{r.altar}</td>
                <td className="py-2 px-4">{r.createdAt ? new Date(r.createdAt.seconds * 1000).toLocaleDateString() : ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

export default ReportsDashboard
