import { NavLink, useParams } from 'react-router-dom'
import { LayoutDashboard, Users, Shield, Wallet, BarChart3 } from 'lucide-react'
import clsx from 'clsx'

const navItems = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '' },
  { label: 'Membresía', icon: Users, path: 'membership' },
  { label: 'Liderazgo', icon: Shield, path: 'leadership' },
  { label: 'Tesorería', icon: Wallet, path: 'treasury' },
  { label: 'Reportes', icon: BarChart3, path: 'reports' },
]

function Sidebar() {
  const { churchId } = useParams()

  return (
    <aside className="w-64 min-h-screen bg-[#0a1a2e] text-cream flex flex-col border-r border-cream/10">
      <div className="px-5 py-6 border-b border-cream/10">
        <p className="text-xs uppercase tracking-[0.2em] text-gold mb-2">Homey'J</p>
        <h1 className="text-xl font-serif leading-tight">Panel de Iglesia</h1>
        <p className="text-xs text-cream/70 mt-2" id="sidebar-church-name"></p>
      </div>
      <nav className="flex-1 py-4">
        <ul className="space-y-1">
          {navItems.map(({ label, icon: Icon, path }) => (
            <li key={label}>
              <NavLink
                to={`/app/${churchId}/${path}`}
                end={path === ''}
                className={({ isActive }) =>
                  clsx(
                    'mx-3 flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition',
                    isActive
                      ? 'bg-cream/10 text-cream shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]'
                      : 'text-cream/80 hover:bg-cream/5 hover:text-cream',
                  )
                }
              >
                <Icon size={18} />
                <span>{label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  )
}

export default Sidebar
