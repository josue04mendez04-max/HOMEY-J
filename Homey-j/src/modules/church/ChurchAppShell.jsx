
import { useParams } from 'react-router-dom'
import Card from '../../shared/ui/Card'
import Button from '../../shared/ui/Button'
import { useState } from 'react'

function ChurchAppShell() {
  const { churchId } = useParams()
  // Datos simulados para demo visual
  const [metrics] = useState({ almas: 3, oracion: 11, capitulos: 13, altar: '1h 0m' })
  const [ofrendas] = useState({ caballeros: 0, damas: 0, jovenes: 0, ninos: 0 })
  const [reportes] = useState([
    { nombre: 'Ernesto Lopez Escalante', id: 'ABC6BF', ministerio: 'Caballeros', capitulos: 10, horas: '8:00', ayunos: 1, almas: 1, altar: 'Sí', fecha: '16/1/2026' },
    { nombre: 'Amelia', id: 'ABC6BF', ministerio: 'Damas', capitulos: 3, horas: '3:00', ayunos: 3, almas: 2, altar: 'Sí', fecha: '16/1/2026' },
  ])

  return (
    <div className="min-h-screen bg-[#f8fafc] px-4 sm:px-8 py-8 text-[#0f172a]">
      <div className="mb-6">
        <p className="text-xs uppercase tracking-[0.2em] text-[#94a3b8]">El Camino</p>
        <h1 className="text-3xl font-semibold mt-1">Reporte de Actividad Semanal</h1>
        <p className="text-sm text-[#64748b] mt-1">Revisando métricas espirituales de la semana de <span className="text-green-600 font-semibold">Esta semana</span>.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="p-4">
          <p className="text-xs text-[#94a3b8]">Almas evangelizadas</p>
          <p className="text-2xl font-bold">{metrics.almas}</p>
          <p className="text-xs text-green-600">+0%</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-[#94a3b8]">Horas de oración</p>
          <p className="text-2xl font-bold">{metrics.oracion}</p>
          <p className="text-xs text-green-600">+0%</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-[#94a3b8]">Capítulos leídos</p>
          <p className="text-2xl font-bold">{metrics.capitulos}</p>
          <p className="text-xs text-green-600">+0%</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-[#94a3b8]">Tiempo altar promedio</p>
          <p className="text-2xl font-bold">{metrics.altar}</p>
          <p className="text-xs text-red-600">-0%</p>
        </Card>
      </div>

      <Card className="mb-6">
        <h2 className="text-base font-semibold mb-2">Ofrendas por Ministerio</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-green-50 rounded-lg p-4 text-center">
            <p className="text-xs text-green-700">Caballeros</p>
            <p className="text-xl font-bold text-green-700">${ofrendas.caballeros.toFixed(2)}</p>
          </div>
          <div className="bg-green-50 rounded-lg p-4 text-center">
            <p className="text-xs text-green-700">Damas</p>
            <p className="text-xl font-bold text-green-700">${ofrendas.damas.toFixed(2)}</p>
          </div>
          <div className="bg-green-50 rounded-lg p-4 text-center">
            <p className="text-xs text-green-700">Jóvenes</p>
            <p className="text-xl font-bold text-green-700">${ofrendas.jovenes.toFixed(2)}</p>
          </div>
          <div className="bg-green-50 rounded-lg p-4 text-center">
            <p className="text-xs text-green-700">Niños</p>
            <p className="text-xl font-bold text-green-700">${ofrendas.ninos.toFixed(2)}</p>
          </div>
        </div>
      </Card>

      <Card>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
          <Input placeholder="Buscar por nombre, ministerio..." />
          <div className="flex gap-2 w-full md:w-auto">
            <Button variant="primary">Exportar</Button>
            <Button variant="secondary">Importar Miembros</Button>
            <Button variant="primary">+ Nuevo</Button>
          </div>
        </div>
        <div className="overflow-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[#e2e8f0] text-[#94a3b8]">
                <th className="py-2 pr-4">Reportante</th>
                <th className="py-2 pr-4">Ministerio</th>
                <th className="py-2 pr-4">Cap.</th>
                <th className="py-2 pr-4">Horas</th>
                <th className="py-2 pr-4">Ayunos</th>
                <th className="py-2 pr-4">Almas</th>
                <th className="py-2 pr-4">Altar</th>
                <th className="py-2 pr-4">Fecha</th>
                <th className="py-2 pr-4">Ver</th>
              </tr>
            </thead>
            <tbody>
              {reportes.map((r, idx) => (
                <tr key={idx} className="border-b border-[#f1f5f9]">
                  <td className="py-3 pr-4">
                    <div className="font-semibold text-[#0f172a]">{r.nombre}</div>
                    <div className="text-xs text-[#64748b]">ID: {r.id}</div>
                  </td>
                  <td className="py-3 pr-4">
                    <span className={`inline-block px-2 py-1 rounded bg-green-100 text-green-700 text-xs font-semibold`}>{r.ministerio}</span>
                  </td>
                  <td className="py-3 pr-4">{r.capitulos}</td>
                  <td className="py-3 pr-4">{r.horas}</td>
                  <td className="py-3 pr-4">{r.ayunos}</td>
                  <td className="py-3 pr-4">{r.almas}</td>
                  <td className="py-3 pr-4">{r.altar}</td>
                  <td className="py-3 pr-4">{r.fecha}</td>
                  <td className="py-3 pr-4 text-center">
                    <Button variant="ghost" className="px-2 py-1 text-xs">👁️</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}

export default ChurchAppShell
