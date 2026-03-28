import { Routes, Route } from 'react-router-dom'
import AppLayout from '@/components/layout/AppLayout'
import DashboardPage from '@/pages/DashboardPage'
import TemplateListPage from '@/pages/TemplateListPage'
import InvoiceEditorPage from '@/pages/InvoiceEditorPage'
import TemplateEditorPage from '@/pages/TemplateEditorPage'
import FontManagementPage from '@/pages/FontManagementPage'
import { Toaster } from '@/components/ui/sonner'
import { ThemeProvider } from '@/components/theme-provider'

export default function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/templates" element={<TemplateListPage />} />
          <Route path="/templates/new" element={<TemplateEditorPage />} />
          <Route path="/templates/:id/edit" element={<TemplateEditorPage />} />
          <Route path="/invoices/new" element={<InvoiceEditorPage />} />
          <Route path="/invoices/:id/edit" element={<InvoiceEditorPage />} />
          <Route path="/fonts" element={<FontManagementPage />} />
        </Route>
      </Routes>
      <Toaster />
    </ThemeProvider>
  )
}
