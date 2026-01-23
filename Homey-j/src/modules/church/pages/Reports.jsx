import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { getReportTemplate } from '../../../core/data/reportsService'
import Reportsmembers from './Reportsmembers'

function Reports() {
  const { churchId } = useParams()
  const [reportLink, setReportLink] = useState('')
  const [templateFields, setTemplateFields] = useState(() => [])

  const handleGenerateLink = () => {
    const tpl = templateFields.length ? `?tpl=${encodeURIComponent(btoa(JSON.stringify(templateFields)))}` : ''
    setReportLink(window.location.origin + `/app/${churchId}/reportsmembers${tpl}`)
  }

  useEffect(() => {
    async function loadTemplate() {
      const fields = await getReportTemplate(churchId)
      setTemplateFields(fields)
    }
    loadTemplate()
  }, [churchId])

  return (
    <div className="min-h-screen bg-[#f8fafc] px-4 sm:px-8 py-8 text-[#0f172a] flex flex-col items-center">
      <div className="w-full max-w-5xl flex flex-col gap-6">
        <div className="mb-2">
          <p className="text-xs uppercase tracking-[0.2em] text-[#94a3b8]">Reportes</p>
          <h1 className="text-3xl font-semibold mt-1">Envía el formulario a miembros</h1>
          <p className="text-sm text-[#475569] mt-1">Genera el link del formulario de reportes para compartir.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
          <div className="bg-white rounded-xl shadow p-6 flex flex-col gap-4">
            <div className="border border-[#e2e8f0] rounded-lg p-4 flex flex-col gap-3">
              <button
                className="px-4 py-2 rounded-lg bg-[#0ea5e9] text-white font-semibold shadow hover:bg-[#0284c7] transition w-fit"
                onClick={handleGenerateLink}
              >
                Generar link para reportes
              </button>
              {reportLink && (
                <div className="text-sm text-[#0f172a] break-all">Link generado: <a href={reportLink} className="underline text-[#0ea5e9]" target="_blank" rel="noopener noreferrer">{reportLink}</a></div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow p-4 lg:p-6 fade-in-up">
            <p className="text-sm font-semibold text-[#0f172a] mb-3">Vista previa en vivo</p>
            <div className="border border-[#e2e8f0] rounded-lg overflow-hidden">
              <Reportsmembers />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Reports;
