
import { Outlet, useParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import Sidebar from './Sidebar'
import Topbar from './Topbar'
import { listChurches } from '../../../core/data/churchesService.js'

function ChurchLayout() {
  const { churchId } = useParams()
  const [churchName, setChurchName] = useState('Iglesia')

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

  return (
    <div className="min-h-screen bg-cream text-navy flex">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Topbar churchName={churchName} />
        <main className="px-6 pb-10">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default ChurchLayout
