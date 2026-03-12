// app/api/admin/create-user/route.ts
import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function POST(request: Request) {
  try {
    const { email, password, role, permissions } = await request.json()

    // Create user with admin client (server-side only)
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    })

    if (authError) throw authError

    // Add to admin_roles table
    const { error: roleError } = await supabaseAdmin
      .from('admin_roles')
      .insert([{
        user_id: authData.user.id,
        email,
        role,
        permissions
      }])

    if (roleError) throw roleError

    return NextResponse.json({ success: true, user: authData.user })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}