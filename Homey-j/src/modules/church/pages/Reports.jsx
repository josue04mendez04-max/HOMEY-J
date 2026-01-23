import { useState } from 'react'
import { useParams } from 'react-router-dom'

function Reports() {
  const [showReport, setShowReport] = useState(false)
  const { churchId } = useParams()
  const [reportLink, setReportLink] = useState('')

  const handleGenerateLink = () => {
    setReportLink(window.location.origin + `/app/${churchId}/reportsmembers`)
  }

  return (
    <div className="p-6 flex flex-col gap-6 max-w-xl mx-auto">
      <button
        className="px-4 py-2 rounded bg-hunter text-cream font-semibold hover:bg-hunter/90 transition w-fit"
        onClick={handleGenerateLink}
      >
        Generar link para reportes
      </button>
      {reportLink && (
        <div className="text-sm text-navy break-all">Link generado: <a href={reportLink} className="underline text-hunter" target="_blank" rel="noopener noreferrer">{reportLink}</a></div>
      )}
      <a
        href={`/app/${churchId}/reportsmembers`}
        className="px-4 py-2 bg-hunter text-cream rounded shadow hover:bg-hunter/80 w-fit"
      >
        Llenar reporte de miembro
      </a>
    </div>
  )
}

export default Reports;
