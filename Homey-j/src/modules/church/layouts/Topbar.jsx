import { useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { UserRound } from 'lucide-react'
import Card from '../../../shared/ui/Card'

function Topbar({ churchName }) {
  const { churchId } = useParams()

  const displayName = useMemo(() => churchName || `Iglesia ${churchId}`, [churchName, churchId])

  return (
    <header className="flex items-center justify-between px-6 py-4">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-gold">Área de cliente</p>
        <h2 className="text-2xl font-serif text-navy">{displayName}</h2>
      </div>
      <Card className="flex items-center gap-3 px-4 py-2 bg-white/70">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-hunter/15 text-hunter">
          <UserRound size={18} />
        </div>
        <div className="leading-tight">
          <p className="text-sm text-navy font-medium">Usuario actual</p>
          <p className="text-xs text-navy/60">Rol: Pastor</p>
        </div>
      </Card>
    </header>
  )
}

export default Topbar
