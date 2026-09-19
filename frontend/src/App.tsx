import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import AppLayout from './components/layout/AppLayout'
import ProtectedRoute from './components/ProtectedRoute'
import { AuthProvider } from './context/AuthContext'
import Dashboard from './pages/Dashboard'
import Applications from './pages/Applications'
import Login from './pages/Login'
import Register from './pages/Register'
import Profiles from './pages/Profiles'
import Devices from './pages/Devices'
import Backups from './pages/Backups'
import Admin from './pages/Admin'
import AdminRoute from './components/admin/AdminRoute'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/profiles" element={<Profiles />} />
              <Route path="/devices" element={<Devices />} />
              <Route path="/applications" element={<Applications />} />
              <Route path="/backups" element={<Backups />} />
              <Route path="/stats" element={<Dashboard />} />
              <Route element={<AdminRoute />}>
                <Route path="/admin/*" element={<Admin />} />
              </Route>
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
