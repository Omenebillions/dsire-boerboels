// app/admin/layout.tsx
"use client";
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push('/admin/login');
        return;
      }

      // Check if user is admin
      const { data: adminData } = await supabase
        .from('admin_roles')
        .select('*')
        .eq('user_id', session.user.id)
        .single();

      if (!adminData) {
        await supabase.auth.signOut();
        router.push('/admin/login');
        return;
      }

      setUser({ ...session.user, role: adminData.role, permissions: adminData.permissions });
    } catch (error) {
      router.push('/admin/login');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('admin-session');
    router.push('/admin/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Don't show layout on login page
  if (pathname === '/admin/login') {
    return children;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Admin Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-bold">Admin Dashboard</h1>
              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                {user?.role || 'Admin'}
              </span>
            </div>
            
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600 hidden md:block">
                {user?.email}
              </span>
              <button
                onClick={handleLogout}
                className="text-sm text-red-600 hover:text-red-700 transition flex items-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

<nav className="bg-white border-b">
  <div className="max-w-7xl mx-auto px-4">
    <div className="flex space-x-6 overflow-x-auto py-2">
      <Link 
        href="/admin/dogs" 
        className={`text-sm font-medium whitespace-nowrap ${
          pathname.includes('/admin/dogs') 
            ? 'text-blue-600 border-b-2 border-blue-600' 
            : 'text-gray-600 hover:text-gray-900'
        }`}
      >
        🐕 Dogs
      </Link>
      <Link 
        href="/admin/products" 
        className={`text-sm font-medium whitespace-nowrap ${
          pathname.includes('/admin/products') 
            ? 'text-blue-600 border-b-2 border-blue-600' 
            : 'text-gray-600 hover:text-gray-900'
        }`}
      >
        🛍️ Products
      </Link>
      <Link 
        href="/admin/sales" 
        className={`text-sm font-medium whitespace-nowrap ${
          pathname.includes('/admin/sales') 
            ? 'text-blue-600 border-b-2 border-blue-600' 
            : 'text-gray-600 hover:text-gray-900'
        }`}
      >
        💰 Sales
      </Link>
      {/* NEW: Debtors Link */}
      <Link 
        href="/admin/debtors" 
        className={`text-sm font-medium whitespace-nowrap ${
          pathname.includes('/admin/debtors') 
            ? 'text-blue-600 border-b-2 border-blue-600' 
            : 'text-gray-600 hover:text-gray-900'
        }`}
      >
        📋 Debtors
      </Link>
      <Link 
        href="/admin/expenses" 
        className={`text-sm font-medium whitespace-nowrap ${
          pathname.includes('/admin/expenses') 
            ? 'text-blue-600 border-b-2 border-blue-600' 
            : 'text-gray-600 hover:text-gray-900'
        }`}
      >
        📝 Expenses
      </Link>
      <Link 
        href="/admin/reports" 
        className={`text-sm font-medium whitespace-nowrap ${
          pathname.includes('/admin/reports') 
            ? 'text-blue-600 border-b-2 border-blue-600' 
            : 'text-gray-600 hover:text-gray-900'
        }`}
      >
        📊 Reports
      </Link>
      <Link 
        href="/admin/users" 
        className={`text-sm font-medium whitespace-nowrap ${
          pathname.includes('/admin/users') 
            ? 'text-blue-600 border-b-2 border-blue-600' 
            : 'text-gray-600 hover:text-gray-900'
        }`}
      >
        👥 Users
      </Link>
    </div>
  </div>
</nav>

      {/* Main Content */}
      <main className="py-6">
        {children}
      </main>
    </div>
  );
}