import { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { Shield, Users, HandHeart, Smile } from 'lucide-react'
import LeadershipSectorDashboard from './LeadershipSectorDashboard'

const sectors = [
  {
    key: 'caballeros',
    label: 'Caballeros',
    icon: <Shield className="w-10 h-10 text-[#8c7a3f]" />
  },
  {
    key: 'damas',
    label: 'Damas',
    icon: <Users className="w-10 h-10 text-[#8c7a3f]" />
  },
  {
    key: 'ninos',
    label: 'Niños',
    icon: <Smile className="w-10 h-10 text-[#8c7a3f]" />
  },
  {
    key: 'jovenes',
    label: 'Jóvenes',
    icon: <HandHeart className="w-10 h-10 text-[#8c7a3f]" />
  },
]

function Leadership() {
  const [selected, setSelected] = useState(null)
  const { churchId } = useParams()
  const [searchParams] = useSearchParams()

  useEffect(() => {
    const sectorParam = searchParams.get('sector')
    if (sectorParam) {
      const match = sectors.find(s => s.key === sectorParam.toLowerCase())
      if (match) setSelected(match.key)
    }
  }, [searchParams])
  if (selected) {
    return <LeadershipSectorDashboard sector={selected} churchId={churchId} onBack={() => setSelected(null)} />
  }
  return (
    <div className="min-h-screen bg-[#f8fafc] px-4 sm:px-8 py-8 text-[#0f172a]">
      <div className="mb-6">
        <p className="text-xs uppercase tracking-[0.2em] text-[#94a3b8]">Liderazgo</p>
        <h1 className="text-3xl font-semibold mt-1">Sectores de la iglesia</h1>
        <p className="text-sm text-[#475569] mt-1">Selecciona un sector para ver o gestionar su información.</p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-6 fade-in-up">
        {sectors.map(sector => (
          <button
            key={sector.key}
            className={`flex flex-col items-center p-6 rounded-xl border transition-all shadow-sm hover:shadow-lg hover:-translate-y-0.5 focus:outline-none bg-white ${selected === sector.key ? 'border-[#0ea5e9] ring-2 ring-[#0ea5e9]/40' : 'border-[#e2e8f0] hover:border-[#cbd5e1]'}`}
            onClick={() => setSelected(sector.key)}
          >
            {sector.icon}
            <span className="mt-3 text-lg font-semibold text-[#0f172a]">{sector.label}</span>
            <span className="text-sm text-[#475569]">Ministerio de {sector.label}</span>
          </button>
        ))}
      </div>
      <div className="bg-white rounded-xl shadow p-5 text-center text-[#475569] text-sm max-w-2xl mx-auto">
        Cada sector representa un área clave de la iglesia: Caballeros, Damas, Niños y Jóvenes.
      </div>
    </div>
  )
}
export default Leadership;
