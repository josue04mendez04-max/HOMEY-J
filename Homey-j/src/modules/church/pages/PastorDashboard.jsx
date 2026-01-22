import Card from '../../../shared/ui/Card'
import Button from '../../../shared/ui/Button'

const kpis = [
  { label: 'Asistencia', value: '328', caption: 'Domingo anterior', trend: '+4%' },
  { label: 'Finanzas', value: '$12,430', caption: 'Ingresos mes', trend: '+8%' },
  { label: 'Nuevos Miembros', value: '18', caption: 'Últimos 30 días', trend: '+2%' },
  { label: 'Grupos Activos', value: '24', caption: 'En marcha', trend: '—' },
]

function PastorDashboard() {
  return (
    <div className="space-y-8">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi) => (
          <Card key={kpi.label} className="bg-white/80 border-gold/30">
            <p className="text-xs uppercase tracking-[0.2em] text-gold mb-2">{kpi.label}</p>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-serif text-navy">{kpi.value}</span>
              <span className="text-sm text-hunter/80">{kpi.trend}</span>
            </div>
            <p className="text-sm text-navy/70 mt-1">{kpi.caption}</p>
          </Card>
        ))}
      </section>

      <section>
        <h3 className="text-xl font-serif text-navy mb-4">Acciones rápidas</h3>
        <div className="flex flex-wrap gap-3">
          <Button variant="primary" className="px-5 py-3">Crear nuevo reporte</Button>
          <Button variant="secondary" className="px-5 py-3">Registrar miembro</Button>
          <Button variant="ghost" className="px-5 py-3">Ver finanzas</Button>
        </div>
      </section>

      <section>
        <Card className="bg-white/75 border-gold/25">
          <h4 className="text-lg font-serif text-navy mb-2">Próximos pasos</h4>
          <p className="text-sm text-navy/75">
            Este dashboard usa datos mock mientras conectamos la API real. Usa el contexto churchId para leer/escribir
            en Firebase y mostrar estadísticas reales de asistencia, finanzas y membresía.
          </p>
        </Card>
      </section>
    </div>
  )
}

export default PastorDashboard
