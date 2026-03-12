// app/api/admin/users/delete/route.ts
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(request: Request) {
  try {
    const { userId, adminRoleId } = await request.json();

    // 1. Delete from admin_roles first (foreign key constraint)
    const { error: roleError } = await supabaseAdmin
      .from('admin_roles')
      .delete()
      .eq('id', adminRoleId);
    
    if (roleError) throw roleError;

    // 2. Delete from auth.users
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (authError) throw authError;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}