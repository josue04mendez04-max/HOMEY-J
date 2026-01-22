import { Routes, Route, Navigate } from 'react-router-dom'
import AdminPage from './modules/superAdmin/AdminPage'
import LandingPage from './modules/LandingPage'
import ChurchLayout from './modules/church/layouts/ChurchLayout'
import PastorDashboard from './modules/church/pages/PastorDashboard'

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/admin" element={<AdminPage />} />
      <Route path="/app/:churchId" element={<ChurchLayout />}>
        <Route index element={<PastorDashboard />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
