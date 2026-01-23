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
    <div className="min-h-screen bg-[#f8fafc] px-4 sm:px-8 py-8 text-[#0f172a]">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <p className="text-xs uppercase tracking-[0.2em] text-[#94a3b8]">Reportes</p>
          <h2 className="text-3xl font-semibold mt-1">Reportes de miembros</h2>
          <p className="text-sm text-[#475569] mt-1">Resumen de actividad espiritual enviada por los miembros.</p>
        </div>
        <div className="bg-white rounded-xl shadow overflow-hidden fade-in-up">
          {loading ? (
            <div className="p-6 text-[#94a3b8]">Cargando...</div>
          ) : reports.length === 0 ? (
            <div className="p-6 text-[#94a3b8]">No hay reportes aún.</div>
          ) : (
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-[#e2e8f0] text-[#94a3b8] bg-[#f8fafc]">
                  <th className="py-3 px-4">Nombre</th>
                  <th className="py-3 px-4">Ministerio</th>
                  <th className="py-3 px-4">Capítulos</th>
                  <th className="py-3 px-4">Horas</th>
                  <th className="py-3 px-4">Ayunos</th>
                  <th className="py-3 px-4">Almas</th>
                  <th className="py-3 px-4">Altar</th>
                  <th className="py-3 px-4">Fecha</th>
                </tr>
              </thead>
              <tbody>
                {reports.map(r => (
                  <tr key={r.id} className="border-b border-[#f1f5f9] hover:bg-[#f8fafc] transition duration-150 ease-out">
                    <td className="py-3 px-4 text-[#0f172a]">{r.name}</td>
                    <td className="py-3 px-4 text-[#334155]">{r.ministry}</td>
                    <td className="py-3 px-4 text-[#334155]">{r.capitulos}</td>
                    <td className="py-3 px-4 text-[#334155]">{r.horas}</td>
                    <td className="py-3 px-4 text-[#334155]">{r.ayunos}</td>
                    <td className="py-3 px-4 text-[#334155]">{r.almas}</td>
                    <td className="py-3 px-4 text-[#334155]">{r.altar}</td>
                    <td className="py-3 px-4 text-[#334155]">{r.createdAt ? new Date(r.createdAt.seconds * 1000).toLocaleDateString() : ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}

export default ReportsDashboard
