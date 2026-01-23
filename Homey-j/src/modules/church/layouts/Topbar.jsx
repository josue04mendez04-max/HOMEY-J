import { useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { UserRound, ArrowLeft } from 'lucide-react'
import Card from '../../../shared/ui/Card'

function Topbar({ churchName }) {
  const { churchId } = useParams();
  const navigate = useNavigate();

  const displayName = useMemo(() => churchName || 'Iglesia', [churchName, churchId]);

  return (
    <header className="flex items-center justify-between px-4 sm:px-6 py-4 gap-3 bg-transparent">
      <div className="flex items-center gap-3">
        <button
          className="md:hidden inline-flex h-10 w-10 items-center justify-center rounded-lg border border-navy/10 bg-white/80 text-navy shadow-sm"
          aria-label="Volver al dashboard"
          onClick={() => navigate(`/app/${churchId}/dashboard`)}
        >
          <ArrowLeft size={20} />
        </button>
        <img src="/logo_sin_fondo.svg" alt="Homey-J" className="h-12 w-12 object-contain" />
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-gold">Área de cliente</p>
          <h2 className="text-2xl font-serif text-navy">{displayName}</h2>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <button
          className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg bg-[#0ea5e9] text-white font-semibold shadow-sm hover:shadow-md hover:bg-[#0284c7] transition"
          onClick={() => navigate(`/app/${churchId}/dashboard`)}
        >
          <ArrowLeft size={18} />
          <span className="hidden sm:inline">Dashboard</span>
        </button>
        <Card className="flex items-center gap-3 px-4 py-2 bg-white/70">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-hunter/15 text-hunter">
            <UserRound size={18} />
          </div>
          <div className="leading-tight">
            <p className="text-sm text-navy font-medium">Usuario actual</p>
            <p className="text-xs text-navy/60">Rol: Pastor</p>
          </div>
        </Card>
      </div>
    </header>
  );
}

export default Topbar
