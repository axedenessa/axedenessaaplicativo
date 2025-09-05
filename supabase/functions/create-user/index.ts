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

    // Parse the request body
    const { email, name, role, cartomante_id, password } = await req.json()

    // Try to create the new user
    let { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        name
      }
    })

    // If email already exists, update the existing user
    if (authError && authError.message.includes('email_exists')) {
      // Get the existing user by email
      const { data: existingUser, error: getUserError } = await supabaseAdmin.auth.admin.listUsers({
        page: 1,
        perPage: 1000
      })

      if (getUserError) {
        throw getUserError
      }

      const userToUpdate = existingUser.users.find(u => u.email === email)
      if (!userToUpdate) {
        throw new Error('User not found')
      }

      // Update the existing user's password and metadata
      const { data: updatedUser, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        userToUpdate.id,
        {
          password,
          user_metadata: {
            name
          }
        }
      )

      if (updateError) {
        throw updateError
      }

      authData = { user: updatedUser.user }
    } else if (authError) {
      throw authError
    }

    // Update/insert the profile with role information
    if (authData.user) {
      const { error: profileUpsertError } = await supabaseAdmin
        .from('profiles')
        .upsert({
          user_id: authData.user.id,
          name,
          role,
          cartomante_id: role === 'cartomante' ? cartomante_id : null
        })

      if (profileUpsertError) {
        throw profileUpsertError
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