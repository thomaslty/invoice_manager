import { FileText, LayoutTemplate, Camera, Type, PanelLeft } from 'lucide-react'
import { useLocation, Link } from 'react-router-dom'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from '@/components/ui/sidebar'
import { NavUser } from '@/components/layout/NavUser'

const navItems = [
  { title: 'Invoices', path: '/', icon: FileText },
  { title: 'Templates', path: '/templates', icon: LayoutTemplate },
  { title: 'Snapshots', path: '/snapshots', icon: Camera },
  { title: 'Fonts', path: '/fonts', icon: Type },
]

export function AppSidebar() {
  const location = useLocation()
  const { toggleSidebar } = useSidebar()

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem className="flex flex-row items-center gap-2">
            <span className="flex-1 truncate px-2 text-lg font-semibold group-data-[collapsible=icon]:hidden">Invoice Manager</span>
            <SidebarMenuButton
              onClick={toggleSidebar}
              className="!size-8 !flex-none"
            >
              <PanelLeft />
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={location.pathname === item.path}
                  >
                    <Link to={item.path}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <NavUser />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
