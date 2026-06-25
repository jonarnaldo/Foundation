import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AppLayout } from './components/layout/AppLayout'
import { ScheduleBuilderPage } from './pages/ScheduleBuilderPage'
import { FinancialDashboardPage } from './pages/FinancialDashboardPage'
import { BankSyncPage } from './pages/BankSyncPage'
import { SettingsPage } from './pages/SettingsPage'
import { ProjectProvider } from './context/ProjectContext'
import { ThemeProvider } from './context/ThemeContext'

export default function App() {
  return (
    <ThemeProvider>
      <ProjectProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<AppLayout />}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<FinancialDashboardPage />} />
              <Route path="schedule" element={<ScheduleBuilderPage />} />
              <Route path="bank-sync" element={<BankSyncPage />} />
              <Route path="settings" element={<SettingsPage />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </ProjectProvider>
    </ThemeProvider>
  )
}
