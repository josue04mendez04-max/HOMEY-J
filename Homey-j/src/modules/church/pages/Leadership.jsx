import { useState } from 'react'
import { useParams } from 'react-router-dom'
import LeadershipSectorDashboard from './LeadershipSectorDashboard'

const sectors = [
  {
    key: 'caballeros',
    label: 'Caballeros',
    icon: (
      <svg className="w-10 h-10 text-blue-700" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="7" r="4"/><path d="M5.5 21v-2a4.5 4.5 0 019 0v2"/></svg>
    )
  },
  {
    key: 'damas',
    label: 'Damas',
    icon: (
      <svg className="w-10 h-10 text-pink-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="7" r="4"/><path d="M12 11v7M9 21h6"/></svg>
    )
  },
  {
    key: 'ninos',
    label: 'Niños',
    icon: (
      <svg className="w-10 h-10 text-yellow-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="7" r="4"/><path d="M5 21c0-2 2-4 7-4s7 2 7 4"/></svg>
    )
  },
  {
    key: 'jovenes',
    label: 'Jóvenes',
    icon: (
      <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="7" r="4"/><path d="M8 21v-2a4 4 0 018 0v2"/></svg>
    )
  },
]

function Leadership() {
  const [selected, setSelected] = useState(null)
  const { churchId } = useParams()
  if (selected) {
    return <LeadershipSectorDashboard sector={selected} churchId={churchId} onBack={() => setSelected(null)} />
  }
  return (
    <div className="p-6">
      <h2 className="text-2xl font-serif mb-6">Liderazgo</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
        {sectors.map(sector => (
          <button
            key={sector.key}
            className={`flex flex-col items-center p-6 rounded-xl border-2 transition-all shadow hover:shadow-lg focus:outline-none ${selected === sector.key ? 'border-hunter bg-hunter/10' : 'border-navy/10 bg-white'}`}
            onClick={() => setSelected(sector.key)}
          >
            {sector.icon}
            <span className="mt-3 text-lg font-semibold">{sector.label}</span>
          </button>
        ))}
      </div>
      <div className="text-center text-navy/70 text-sm max-w-xl mx-auto">
        Selecciona un sector para ver o gestionar su información. Cada sector representa un área clave de la iglesia: Caballeros, Damas, Niños y Jóvenes.
      </div>
    </div>
  )
}
export default Leadership;
