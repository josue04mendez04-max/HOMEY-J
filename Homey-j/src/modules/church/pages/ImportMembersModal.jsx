
import { useRef, useState } from 'react'
import * as XLSX from 'xlsx'

const EXCEL_TEMPLATE_URL = '/plantilla_miembros.xlsx'
const phrases = [
  'Leyendo nombres del libro de la vida...',
  'Mirando entre los próximos ángeles...',
  'Consultando el registro celestial...',
  'Buscando ovejas para el rebaño...',
  'Verificando ministerios y roles...',
]

function normalize(str) {
  return (str || '').normalize('NFD').replace(/\p{Diacritic}/gu, '').trim().toLowerCase()
}

function ImportMembersModal({ open, onClose, onImport }) {
  const [loading, setLoading] = useState(false)
  const [phraseIdx, setPhraseIdx] = useState(0)
  const fileInput = useRef()

  const handleFile = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setLoading(true)
    setPhraseIdx(0)
    let idx = 0
    const interval = setInterval(() => {
      setPhraseIdx((p) => (p + 1) % phrases.length)
    }, 1500)

    const reader = new FileReader()
    reader.onload = (evt) => {
      const data = new Uint8Array(evt.target.result)
      const workbook = XLSX.read(data, { type: 'array' })
      const sheet = workbook.Sheets[workbook.SheetNames[0]]
      const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 })
      const headers = rows[0].map(h => normalize(h))
      const members = rows.slice(1).map(row => {
        const obj = {}
        headers.forEach((h, i) => {
          obj[h] = row[i] || ''
        })
        return {
          name: obj['nombre'] || '',
          birth: obj['fecha de nacimiento'] || '',
          ministry: obj['ministerio'] || '',
          role: obj['rol'] || '',
          phone: obj['numero de telefono'] || '',
        }
      })
      setTimeout(() => {
        clearInterval(interval)
        setLoading(false)
        onImport && onImport(members)
        onClose()
      }, 3500)
    }
    reader.readAsArrayBuffer(file)
  }

  if (!open) return null
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md">
        <h2 className="text-xl font-serif mb-4">Importar miembros</h2>
        <div className="flex flex-col gap-4">
          <a href={EXCEL_TEMPLATE_URL} download className="bg-hunter text-cream px-4 py-2 rounded-md text-center font-medium hover:bg-hunter/90">Descargar plantilla Excel</a>
          <label className="bg-navy text-cream px-4 py-2 rounded-md text-center font-medium hover:bg-navy/90 cursor-pointer">
            Importar archivo Excel
            <input type="file" accept=".xlsx,.xls" className="hidden" ref={fileInput} onChange={handleFile} />
          </label>
        </div>
        {loading && (
          <div className="flex flex-col items-center gap-3 mt-6">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 150" width="80" height="40"><path fill="none" stroke="#0A1A2E" strokeWidth="15" strokeLinecap="round" strokeDasharray="300 385" strokeDashoffset="0" d="M275 75c0 31-27 50-50 50-58 0-92-100-150-100-28 0-50 22-50 50s23 50 50 50c58 0 92-100 150-100 24 0 50 19 50 50Z"><animate attributeName="stroke-dashoffset" calcMode="spline" dur="2" values="685;-685" keySplines="0 0 1 1" repeatCount="indefinite"></animate></path></svg>
            <span className="text-navy font-serif text-lg text-center">{phrases[phraseIdx]}</span>
          </div>
        )}
        <div className="flex gap-2 justify-end mt-6">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded bg-navy text-cream">Cerrar</button>
        </div>
      </div>
    </div>
  )
}

export default ImportMembersModal;
