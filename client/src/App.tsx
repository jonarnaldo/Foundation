import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AppLayout } from './components/layout/AppLayout'
import { ScheduleBuilderPage } from './pages/ScheduleBuilderPage'
import { FinancialDashboardPage } from './pages/FinancialDashboardPage'
import { BankSyncPage } from './pages/BankSyncPage'
import { SettingsPage } from './pages/SettingsPage'
import { LoginPage } from './pages/LoginPage'
import { ProjectProvider } from './context/ProjectContext'
import { ThemeProvider } from './context/ThemeContext'
import { AuthProvider, useAuth } from './context/AuthContext'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth()
  const location = useLocation()
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />
  }
  return <>{children}</>
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ProjectProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <AppLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path="dashboard" element={<FinancialDashboardPage />} />
                <Route path="schedule" element={<ScheduleBuilderPage />} />
                <Route path="bank-sync" element={<BankSyncPage />} />
                <Route path="settings" element={<SettingsPage />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </ProjectProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}
