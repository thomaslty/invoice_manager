import { Routes, Route } from 'react-router-dom'
import AppLayout from '@/components/layout/AppLayout'
import DashboardPage from '@/pages/DashboardPage'
import InvoiceEditorPage from '@/pages/InvoiceEditorPage'
import InvoiceViewerPage from '@/pages/InvoiceViewerPage'
import FontManagementPage from '@/pages/FontManagementPage'
import LoginPage from '@/components/auth/LoginPage'
import { Toaster } from '@/components/ui/sonner'
import { ThemeProvider } from '@/components/theme-provider'
import { AuthProvider } from '@/components/auth/AuthProvider'

export default function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
      <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<AppLayout />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/invoices/new" element={<InvoiceEditorPage />} />
          <Route path="/invoices/:id/edit" element={<InvoiceEditorPage />} />
          <Route path="/invoices/:id/view" element={<InvoiceViewerPage />} />
          <Route path="/fonts" element={<FontManagementPage />} />
        </Route>
      </Routes>
      <Toaster />
      </AuthProvider>
    </ThemeProvider>
  )
}
