import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/integrations/supabase/client"
import { Users, Plus, Settings } from "lucide-react"

interface Profile {
  id: string
  user_id: string
  name: string
  role: 'admin' | 'cartomante'
  cartomante_id?: string
  created_at: string
}

const UserManagement = () => {
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newUserEmail, setNewUserEmail] = useState('')
  const [newUserName, setNewUserName] = useState('')
  const [newUserPassword, setNewUserPassword] = useState('')
  const [newUserRole, setNewUserRole] = useState<'admin' | 'cartomante'>('cartomante')
  const [newUserCartomanteId, setNewUserCartomanteId] = useState('')
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    loadProfiles()
  }, [])

  const loadProfiles = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      setProfiles((data || []) as Profile[])
    } catch (error) {
      console.error('Error loading profiles:', error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar os usuários.",
        variant: "destructive"
      })
    }
  }

  const createUser = async () => {
    if (!newUserEmail || !newUserName || !newUserPassword || newUserPassword.length < 6) {
      toast({
        title: "Campos obrigatórios",
        description: "Email, nome e senha (mín. 6 caracteres) são obrigatórios.",
        variant: "destructive"
      })
      return
    }

    if (newUserRole === 'cartomante' && !newUserCartomanteId) {
      toast({
        title: "Campo obrigatório",
        description: "ID da cartomante é obrigatório para usuários cartomante.",
        variant: "destructive"
      })
      return
    }

    setLoading(true)
    try {
      // Call edge function to create user
      const { data, error } = await supabase.functions.invoke('create-user', {
        body: {
          email: newUserEmail,
          name: newUserName,
          password: newUserPassword,
          role: newUserRole,
          cartomante_id: newUserRole === 'cartomante' ? newUserCartomanteId : null
        }
      })

      if (error) throw error

      toast({
        title: "Usuário criado",
        description: `Usuário ${newUserName} criado com sucesso.`,
      })

      // Reset form
      setNewUserEmail('')
      setNewUserName('')
      setNewUserPassword('')
      setNewUserRole('cartomante')
      setNewUserCartomanteId('')
      setShowCreateForm(false)
      loadProfiles()
    } catch (error) {
      console.error('Error creating user:', error)
      toast({
        title: "Erro",
        description: "Não foi possível criar o usuário.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-primary">
            Gerenciamento de Usuários
          </h1>
          <p className="text-muted-foreground">
            Crie e gerencie usuários do sistema
          </p>
        </div>
        <Button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="bg-primary text-primary-foreground"
        >
          <Plus className="h-4 w-4 mr-2" />
          Novo Usuário
        </Button>
      </div>

      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>Criar Novo Usuário</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  placeholder="usuario@exemplo.com"
                />
              </div>
              <div>
                <Label htmlFor="name">Nome</Label>
                <Input
                  id="name"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  placeholder="Nome do usuário"
                />
              </div>
              <div>
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  value={newUserPassword}
                  onChange={(e) => setNewUserPassword(e.target.value)}
                  placeholder="Defina uma senha"
                />
              </div>
              <div>
                <Label htmlFor="role">Tipo de Usuário</Label>
                <Select value={newUserRole} onValueChange={(value: 'admin' | 'cartomante') => setNewUserRole(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Administrador</SelectItem>
                    <SelectItem value="cartomante">Cartomante</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {newUserRole === 'cartomante' && (
                <div>
                  <Label htmlFor="cartomante">Cartomante</Label>
                  <Select value={newUserCartomanteId} onValueChange={setNewUserCartomanteId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a cartomante" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="vanessa_barreto">Vanessa Barreto</SelectItem>
                      <SelectItem value="alana_cerqueira">Alana Cerqueira</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <Button onClick={createUser} disabled={loading}>
                {loading ? 'Criando...' : 'Criar Usuário'}
              </Button>
              <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5 text-primary" />
            <span>Usuários do Sistema</span>
            <Badge variant="secondary">{profiles.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {profiles.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Nenhum usuário encontrado</p>
            </div>
          ) : (
            <div className="space-y-3">
              {profiles.map((profile) => (
                <div key={profile.id} className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center justify-center w-10 h-10 bg-primary text-primary-foreground rounded-full text-sm font-bold">
                      {profile.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold">{profile.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {profile.role === 'admin' ? 'Administrador' : 'Cartomante'}
                        {profile.cartomante_id && ` • ${profile.cartomante_id === 'vanessa_barreto' ? 'Vanessa Barreto' : 'Alana Cerqueira'}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant={profile.role === 'admin' ? 'default' : 'secondary'}>
                      {profile.role === 'admin' ? 'Admin' : 'Cartomante'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default UserManagement