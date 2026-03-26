import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { AppSidebar } from './Sidebar'
import { Outlet } from 'react-router-dom'

export default function AppLayout() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
