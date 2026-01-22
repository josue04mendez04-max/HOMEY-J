import { Outlet, useParams } from 'react-router-dom'
import Sidebar from './Sidebar'
import Topbar from './Topbar'

function ChurchLayout() {
  const { churchId } = useParams()
  // TODO: cargar datos reales de la iglesia desde Firestore con churchId.
  const churchName = `Parroquia ${churchId}`

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
