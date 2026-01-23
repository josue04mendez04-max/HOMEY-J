import { NavLink, useParams } from 'react-router-dom'
import { LayoutDashboard, Users, Shield, Wallet, BarChart3, X, PanelTop } from 'lucide-react'
import clsx from 'clsx'

const navItems = [
  { label: 'Panel de Control', icon: PanelTop, path: '' },
  { label: 'Membresía', icon: Users, path: 'membership' },
  { label: 'Liderazgo', icon: Shield, path: 'leadership' },
  { label: 'Tesorería', icon: Wallet, path: 'treasury' },
  { label: 'Reportes', icon: BarChart3, path: 'reports' },
]

function Sidebar({ open, onClose }) {
  const { churchId } = useParams()

  return (
    <aside
      className={clsx(
        'fixed inset-y-0 left-0 z-40 w-64 bg-white text-[#0f172a] flex flex-col border-r border-[#e5e7eb] transform transition-transform duration-200 md:static md:translate-x-0 md:shadow-none shadow-bankSoft',
        open ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      )}
    >
      <div className="px-5 py-6 border-b border-[#e5e7eb] flex items-start justify-between gap-3">
        <p className="text-xs uppercase tracking-[0.2em] text-[#6b7280] mb-2">Homey'J</p>
        <h1 className="text-xl font-serif leading-tight">Panel de Iglesia</h1>
        <p className="text-xs text-[#6b7280] mt-2" id="sidebar-church-name"></p>
        <button
          className="md:hidden text-[#6b7280] hover:text-[#0f172a]"
          aria-label="Cerrar menú"
          onClick={onClose}
        >
          <X size={18} />
        </button>
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
                    'mx-3 flex items-center gap-3 rounded-[12px] px-3 py-2 text-sm font-medium transition',
                    isActive
                      ? 'bg-[#e3f2eb] text-[#0f6b4b] shadow-inner border border-[#d7dde4]'
                      : 'text-[#0f172a] hover:bg-[#f0f4f7] hover:text-[#0f6b4b]',
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
