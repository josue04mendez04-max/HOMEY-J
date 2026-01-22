import { Link } from 'react-router-dom'
import Card from '../shared/ui/Card'
import Button from '../shared/ui/Button'

function LandingPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12 bg-cream text-navy">
      <Card className="max-w-2xl w-full text-center">
        <p className="text-sm uppercase tracking-[0.2em] text-gold mb-3">Homey'J</p>
        <h1 className="text-4xl font-serif mb-4">Gestión eclesiástica, sin ruido</h1>
        <p className="text-lg text-navy/80 mb-8">
          Un panel claro para el dueño y un espacio seguro para cada iglesia. Multi-tenant desde el día uno.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/admin">
            <Button variant="primary">Entrar como SuperAdmin</Button>
          </Link>
          <Link to="/app/demo-church">
            <Button variant="ghost">Ver demo /app/:churchId</Button>
          </Link>
        </div>
      </Card>
    </div>
  )
}

export default LandingPage
