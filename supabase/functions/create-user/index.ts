import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get the authorization header from the request
    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')

    // Create a Supabase client with the service role key
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Verify the user making the request is an admin
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token)
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if user has admin role
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('user_id', user.id)
      .single()

    if (profileError || profile?.role !== 'admin') {
      return new Response(
        JSON.stringify({ error: 'Insufficient permissions' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Parse and sanitize request body
    const { email: rawEmail, name: rawName, role, cartomante_id, password } = await req.json()
    
    // Sanitize inputs
    const email = (rawEmail || '').trim().toLowerCase()
    const name = (rawName || '').trim()
    
    // Validate required fields
    if (!email) {
      return new Response(
        JSON.stringify({ error: 'Email é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    if (!name) {
      return new Response(
        JSON.stringify({ error: 'Nome é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    if (!password || password.length < 6) {
      return new Response(
        JSON.stringify({ error: 'Senha deve ter pelo menos 6 caracteres' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    if (!role) {
      return new Response(
        JSON.stringify({ error: 'Perfil é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    console.log('Creating user with email:', email, 'name:', name, 'role:', role)

    // Try to create the new user (or handle existing email)
    let { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name }
    })

    // Handle duplicate email by updating existing user
    if (authError) {
      console.log('Auth error occurred:', authError.status, authError.message)
      
      const msg = (authError.message || '').toLowerCase()
      const isDuplicate = authError.status === 422
        || msg.includes('already been registered')
        || msg.includes('already registered')
        || msg.includes('user already registered')
        || msg.includes('email exists')
        || msg.includes('email already')

      if (isDuplicate) {
        console.log('Email already exists, updating existing user...')
        
        // Find existing user by email
        const { data: userList, error: getUserError } = await supabaseAdmin.auth.admin.listUsers({
          page: 1,
          perPage: 1000,
        })
        if (getUserError) {
          console.error('Error listing users:', getUserError)
          throw new Error(`Erro ao buscar usuários: ${getUserError.message}`)
        }

        const userToUpdate = userList?.users?.find((u: any) => (u.email || '').toLowerCase() === email.toLowerCase())
        if (!userToUpdate) {
          console.error('User not found with email:', email)
          throw new Error('Usuário com este email não foi encontrado')
        }

        console.log('Found existing user, updating...')
        
        // Update password and metadata
        const { data: updatedUser, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(userToUpdate.id, {
          password,
          user_metadata: { name }
        })
        if (updateError) {
          console.error('Error updating user:', updateError)
          throw new Error(`Erro ao atualizar usuário: ${updateError.message}`)
        }

        console.log('User updated successfully')
        authData = { user: updatedUser.user }
      } else {
        console.error('Non-duplicate auth error:', authError)
        throw new Error(`Erro de autenticação: ${authError.message}`)
      }
    } else {
      console.log('New user created successfully')
    }

    // Ensure profile exists and is updated with role info
    if (authData.user) {
      // Try update first
      const { data: existingProfile, error: fetchProfileError } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('user_id', authData.user.id)
        .maybeSingle()
      if (fetchProfileError) throw fetchProfileError

      if (existingProfile) {
        const { error: profileUpdateError } = await supabaseAdmin
          .from('profiles')
          .update({
            name,
            role,
            cartomante_id: role === 'cartomante' ? cartomante_id : null
          })
          .eq('user_id', authData.user.id)
        if (profileUpdateError) throw profileUpdateError
      } else {
        const { error: profileInsertError } = await supabaseAdmin
          .from('profiles')
          .insert({
            user_id: authData.user.id,
            name,
            role,
            cartomante_id: role === 'cartomante' ? cartomante_id : null
          })
        if (profileInsertError) throw profileInsertError
      }
    }

    return new Response(
      JSON.stringify({ 
        message: 'User created successfully',
        user: authData.user 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error creating user:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})