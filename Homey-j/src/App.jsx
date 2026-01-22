
import { Routes, Route, Navigate } from 'react-router-dom'
import LandingPage from './modules/LandingPage'
import AdminPage from './modules/superAdmin/AdminPage'
import ChurchLayout from './modules/church/layouts/ChurchLayout'
import PastorDashboard from './modules/church/pages/PastorDashboard'
import Membership from './modules/church/pages/Membership'
import Leadership from './modules/church/pages/Leadership'
import Treasury from './modules/church/pages/Treasury'
import Reports from './modules/church/pages/Reports'
import Reportsmembers from './modules/church/pages/Reportsmembers'

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/admin" element={<AdminPage />} />
      <Route path="/app/:churchId" element={<ChurchLayout />}>
        <Route index element={<PastorDashboard />} />
        <Route path="membership" element={<Membership />} />
        <Route path="leadership" element={<Leadership />} />
        <Route path="treasury" element={<Treasury />} />
        <Route path="reports" element={<Reports />} />
      </Route>
      <Route path="/app/:churchId/reportsmembers" element={<Reportsmembers />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
