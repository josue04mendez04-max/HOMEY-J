import { Routes, Route, Navigate } from 'react-router-dom'
import LandingPage from './modules/LandingPage'
import AdminPage from './modules/superAdmin/AdminPage'
import ChurchLayout from './modules/church/layouts/ChurchLayout'
import PanelControl from './modules/church/pages/PanelControl'
import Membership from './modules/church/pages/Membership'
import Leadership from './modules/church/pages/Leadership'
import Treasury from './modules/church/pages/Treasury'
import Reports from './modules/church/pages/Reports'
import Reportsmembers from './modules/church/pages/Reportsmembers'
import ReportsDashboard from './modules/church/pages/ReportsDashboard'
import Dashboard from './modules/church/pages/Dashboard'

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/admin" element={<AdminPage />} />
      {/* Dashboard SIN layout */}
      <Route path="/app/:churchId/dashboard" element={<Dashboard />} />
      {/* Resto de rutas CON layout */}
      <Route path="/app/:churchId" element={<ChurchLayout />}>
        <Route index element={<PanelControl />} />
        <Route path="membership" element={<Membership />} />
        <Route path="leadership" element={<Leadership />} />
        <Route path="treasury" element={<Treasury />} />
        <Route path="reports" element={<Reports />} />
      </Route>
      <Route path="/app/:churchId/reportsmembers" element={<Reportsmembers />} />
      <Route path="/app/:churchId/reportsdashboard" element={<ReportsDashboard />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
