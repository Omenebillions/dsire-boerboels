import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, password, role, permissions } = body

    // 1. Create the user in Supabase Auth
    // Use the admin client to bypass RLS and auto-confirm the email
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { role } 
    })

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 })
    }

    // 2. Insert the user's role and permissions into the admin_roles table
    const { error: roleError } = await supabaseAdmin
      .from('admin_roles')
      .insert([
        {
          user_id: authData.user.id,
          email: email,
          role: role,
          permissions: permissions // This accepts the JSON object from your frontend
        }
      ])

    if (roleError) {
      // Rollback: If the role insert fails, delete the auth user 
      // so we don't have "ghost" users in the system
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
      return NextResponse.json({ error: "Role Assignment Error: " + roleError.message }, { status: 400 })
    }

    return NextResponse.json({ 
      success: true, 
      message: 'User and permissions created successfully',
      user: authData.user 
    })

  } catch (error: any) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}