import { useParams } from 'react-router-dom'
import Card from '../../shared/ui/Card'
import Button from '../../shared/ui/Button'

function ChurchAppShell() {
  const { churchId } = useParams()

  return (
    <div className="min-h-screen bg-cream px-6 py-12 flex items-center justify-center text-navy">
      <Card className="max-w-2xl w-full text-center">
        <p className="text-sm uppercase tracking-[0.2em] text-gold mb-2">Área de cliente</p>
        <h1 className="text-4xl font-serif mb-4">Iglesia: {churchId}</h1>
        <p className="text-lg text-navy/80 mb-6">
          Aquí vivirá el producto multi-tenant. Todo lo que ocurra en esta ruta debe leer/escribir usando el
          churchId de la URL.
        </p>
        <div className="flex gap-3 justify-center">
          <Button variant="secondary">Acción principal</Button>
          <Button variant="ghost">Ver detalle</Button>
        </div>
      </Card>
    </div>
  )
}

export default ChurchAppShell
