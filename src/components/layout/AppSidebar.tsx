import { NavLink, useLocation } from "react-router-dom"
import { useState, useEffect } from "react"
import {
  Calendar,
  BarChart3,
  UserPlus,
  DollarSign,
  TrendingUp,
  Home,
  Facebook,
  Users,
  Target,
  Timer,
  Play
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar"
import { useAuth } from "@/contexts/AuthContext"
import { supabase } from "@/integrations/supabase/client"

const adminNavigationItems = [
  {
    title: "Dashboard",
    url: "/",
    icon: Home,
  },
  {
    title: "Novo Jogo",
    url: "/novo-jogo",
    icon: UserPlus,
  },
  {
    title: "Ranking de Clientes",
    url: "/ranking",
    icon: Users,
  },
  {
    title: "Campanhas Facebook",
    url: "/campanhas",
    icon: Facebook,
  },
  {
    title: "Relatório Financeiro",
    url: "/relatorio-financeiro",
    icon: DollarSign,
  },
  {
    title: "Custos & Lucros",
    url: "/custos-lucros",
    icon: TrendingUp,
  },
  {
    title: "Gerenciar Usuários",
    url: "/usuarios",
    icon: Target,
  },
]

const cartomanteNavigationItems = [
  {
    title: "Meu Painel",
    url: "/cartomante-dashboard",
    icon: Home,
  },
]

export function AppSidebar() {
  const { state } = useSidebar()
  const { user } = useAuth()
  const location = useLocation()
  const currentPath = location.pathname
  const [userRole, setUserRole] = useState<string | null>(null)

  useEffect(() => {
    if (user) {
      getUserRole()
    }
  }, [user])

  const getUserRole = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('user_id', user?.id)
        .single()
      
      if (error) throw error
      setUserRole(data.role)
    } catch (error) {
      console.error('Error loading user role:', error)
    }
  }

  const isActive = (path: string) => currentPath === path
  
  const navigationItems = userRole === 'admin' ? adminNavigationItems : cartomanteNavigationItems

  return (
    <Sidebar className="border-r border-sidebar-border">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 bg-primary rounded flex-shrink-0 flex items-center justify-center overflow-hidden">
            <img 
              src="/lovable-uploads/6389b33f-0792-4890-b791-cec3fb95e502.png" 
              alt="Axe de Nessa" 
              className="h-full w-full object-cover"
            />
          </div>
          {state === "expanded" && (
            <div className="flex flex-col">
              <h1 className="text-lg font-semibold text-sidebar-foreground">
                Axe de Nessa
              </h1>
              <p className="text-xs text-sidebar-foreground/70">
                Sistema de Gestão
              </p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild 
                    isActive={isActive(item.url)}
                    className={isActive(item.url) ? "bg-primary text-primary-foreground font-medium" : ""}
                  >
                    <NavLink to={item.url}>
                      <item.icon className="h-4 w-4" />
                      {state === "expanded" && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}