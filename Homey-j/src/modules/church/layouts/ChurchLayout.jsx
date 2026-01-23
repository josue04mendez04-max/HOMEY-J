
import { Outlet, useParams, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import Sidebar from './Sidebar'
import Topbar from './Topbar'
import { listChurches } from '../../../core/data/churchesService.js'

function ChurchLayout() {
  const { churchId } = useParams()
  const location = useLocation()
  const [churchName, setChurchName] = useState('Iglesia')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    async function fetchName() {
      const churches = await listChurches()
      const found = churches.find(c => c.id === churchId)
      setChurchName(found?.name || 'Iglesia')
      // También actualiza el nombre en el sidebar
      const sidebarName = document.getElementById('sidebar-church-name')
      if (sidebarName) sidebarName.textContent = found?.name || 'Iglesia'
    }
    fetchName()
  }, [churchId])

  // Detectar si estamos en cualquier ruta de dashboard
  const isDashboard = /\/dashboard$/.test(location.pathname)

  return (
    <div className="min-h-screen bg-cream text-navy flex relative">
      {/* Overlay móvil */}
      {!isDashboard && sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      {!isDashboard && <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />}
      <div className="flex-1 flex flex-col min-h-screen">
        {!isDashboard && <Topbar churchName={churchName} onOpenSidebar={() => setSidebarOpen(true)} />}
        <main className="px-4 sm:px-6 pb-10">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default ChurchLayout
