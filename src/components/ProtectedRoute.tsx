import { useAuth } from '@/contexts/AuthContext'
import { Navigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { supabase } from '@/integrations/supabase/client'

interface ProtectedRouteProps {
  children: React.ReactNode
  adminOnly?: boolean
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, adminOnly = false }) => {
  const { user, loading } = useAuth()
  const [userRole, setUserRole] = useState<string | null>(null)
  const [roleLoading, setRoleLoading] = useState(true)

  useEffect(() => {
    if (user) {
      getUserRole()
    } else {
      setRoleLoading(false)
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
      setUserRole(null)
    } finally {
      setRoleLoading(false)
    }
  }

  if (loading || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/auth" replace />
  }

  // Redirect cartomante users to their specific dashboard
  if (userRole === 'cartomante' && window.location.pathname !== '/cartomante-dashboard' && window.location.pathname !== '/auth') {
    return <Navigate to="/cartomante-dashboard" replace />
  }

  // Redirect admin users away from cartomante dashboard
  if (userRole === 'admin' && window.location.pathname === '/cartomante-dashboard') {
    return <Navigate to="/" replace />
  }

  if (adminOnly && userRole !== 'admin') {
    return <Navigate to="/cartomante-dashboard" replace />
  }

  return <>{children}</>
}

export default ProtectedRoute