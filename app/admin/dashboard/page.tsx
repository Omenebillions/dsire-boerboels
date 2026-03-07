// app/admin/dashboard/page.tsx
"use client";
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import Image from 'next/image';

// Define types for all data structures
interface Sale {
  id: number;
  item_name?: string;
  price: number;
  profit?: number;
  created_at: string;
  customers?: {
    name: string;
  } | null;
}

interface Expense {
  id: number;
  description: string;
  amount: number;
  category: string;
  date: string;
}

interface FemaleDog {
  id: number;
  name: string;
  next_heat?: string | null;
}

interface DashboardStats {
  totalDogs: number;
  availablePuppies: number;
  reservedPuppies: number;
  soldPuppies: number;
  totalStuds: number;
  totalFemales: number;
  totalProducts: number;
  lowStockProducts: number;
  outOfStockProducts: number;
  monthlyRevenue: number;
  monthlyProfit: number;
  monthlyExpenses: number;
  pendingPayments: number;
  totalDebt: number;
  overdueDebt: number;
  recentSales: Sale[];
  recentExpenses: Expense[];
  upcomingHeat: FemaleDog[];
}

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalDogs: 0,
    availablePuppies: 0,
    reservedPuppies: 0,
    soldPuppies: 0,
    totalStuds: 0,
    totalFemales: 0,
    totalProducts: 0,
    lowStockProducts: 0,
    outOfStockProducts: 0,
    monthlyRevenue: 0,
    monthlyProfit: 0,
    monthlyExpenses: 0,
    pendingPayments: 0,
    totalDebt: 0,
    overdueDebt: 0,
    recentSales: [],
    recentExpenses: [],
    upcomingHeat: []
  });

  const [greeting, setGreeting] = useState('');
  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => {
    fetchDashboardData();
    setGreeting(getGreeting());
    setCurrentTime(new Date().toLocaleTimeString());
    
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 60000);
    
    return () => clearInterval(timer);
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const fetchDashboardData = async () => {
    setLoading(true);
    
    try {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfMonthStr = startOfMonth.toISOString();

      // Fetch all stats in parallel
      const [
        dogsData,
        availablePuppiesData,
        reservedPuppiesData,
        soldPuppiesData,
        studsData,
        femalesData,
        productsData,
        lowStockData,
        outOfStockData,
        monthlySalesData,
        monthlyExpensesData,
        debtsData,
        overdueDebtsData,
        recentSalesData,
        recentExpensesData,
        upcomingHeatData
      ] = await Promise.all([
        supabase.from('dogs').select('*', { count: 'exact', head: true }),
        supabase.from('dogs').select('*', { count: 'exact', head: true }).eq('type', 'puppy').eq('status', 'available'),
        supabase.from('dogs').select('*', { count: 'exact', head: true }).eq('type', 'puppy').eq('status', 'reserved'),
        supabase.from('dogs').select('*', { count: 'exact', head: true }).eq('type', 'puppy').eq('status', 'sold'),
        supabase.from('dogs').select('*', { count: 'exact', head: true }).eq('type', 'stud'),
        supabase.from('dogs').select('*', { count: 'exact', head: true }).eq('type', 'female'),
        
        supabase.from('products').select('*', { count: 'exact', head: true }),
        supabase.from('products').select('*', { count: 'exact', head: true }).lt('stock', 5).gt('stock', 0),
        supabase.from('products').select('*', { count: 'exact', head: true }).eq('in_stock', false),
        
        supabase.from('sales').select('price, profit').gte('created_at', startOfMonthStr),
        supabase.from('expenses').select('amount').gte('date', startOfMonthStr),
        
        supabase.from('debts').select('remaining_amount').neq('status', 'paid'),
        supabase.from('debts').select('remaining_amount').lt('due_date', now.toISOString()).neq('status', 'paid'),
        
        supabase.from('sales').select('*, customers(name)').order('created_at', { ascending: false }).limit(5),
        supabase.from('expenses').select('*').order('date', { ascending: false }).limit(5),
        supabase.from('dogs').select('id, name, next_heat').eq('type', 'female').not('next_heat', 'is', null).order('next_heat').limit(5)
      ]);

      // Safely calculate financial totals with proper null checks
      const monthlyRevenue = (monthlySalesData.data || []).reduce((sum: number, item: any) => 
        sum + (item?.price || 0), 0);
      
      const monthlyProfit = (monthlySalesData.data || []).reduce((sum: number, item: any) => 
        sum + (item?.profit || 0), 0);
      
      const monthlyExpenses = (monthlyExpensesData.data || []).reduce((sum: number, item: any) => 
        sum + (item?.amount || 0), 0);
      
      const totalDebt = (debtsData.data || []).reduce((sum: number, item: any) => 
        sum + (item?.remaining_amount || 0), 0);
      
      const overdueDebt = (overdueDebtsData.data || []).reduce((sum: number, item: any) => 
        sum + (item?.remaining_amount || 0), 0);

      // Update state with proper type casting
      setStats({
        totalDogs: dogsData.count || 0,
        availablePuppies: availablePuppiesData.count || 0,
        reservedPuppies: reservedPuppiesData.count || 0,
        soldPuppies: soldPuppiesData.count || 0,
        totalStuds: studsData.count || 0,
        totalFemales: femalesData.count || 0,
        
        totalProducts: productsData.count || 0,
        lowStockProducts: lowStockData.count || 0,
        outOfStockProducts: outOfStockData.count || 0,
        
        monthlyRevenue,
        monthlyProfit,
        monthlyExpenses,
        pendingPayments: totalDebt,
        
        totalDebt,
        overdueDebt,
        
        // Explicitly cast the data to the correct types
        recentSales: (recentSalesData.data || []) as Sale[],
        recentExpenses: (recentExpensesData.data || []) as Expense[],
        upcomingHeat: (upcomingHeatData.data || []) as FemaleDog[]
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-20 bg-white rounded-xl mb-6"></div>
            <div className="grid grid-cols-4 gap-6 mb-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-white rounded-xl"></div>
              ))}
            </div>
            <div className="h-64 bg-white rounded-xl mb-6"></div>
            <div className="grid grid-cols-2 gap-6">
              <div className="h-48 bg-white rounded-xl"></div>
              <div className="h-48 bg-white rounded-xl"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header with Logo and Welcome */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border border-gray-100">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center gap-4 mb-4 md:mb-0">
              <div className="relative w-16 h-16 bg-gray-100 rounded-xl overflow-hidden border-2 border-gray-200">
                <Image
                  src="/logo.png"
                  alt="Dsire Boerboels"
                  fill
                  className="object-contain p-2"
                />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
                  {greeting}, <span className="text-blue-600">Breeder</span>
                </h1>
                <p className="text-gray-500 flex items-center gap-2">
                  <span>Dsire Boerboels Admin</span>
                  <span className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded-full">
                    {currentTime}
                  </span>
                </p>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Link
                href="/"
                target="_blank"
                className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition flex items-center gap-2"
              >
                <span>👁️</span> View Site
              </Link>
              <button
                onClick={fetchDashboardData}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
              >
                <span>🔄</span> Refresh
              </button>
            </div>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          {/* Revenue Card */}
          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl shadow-lg p-6 text-white transform hover:scale-105 transition">
            <div className="flex justify-between items-start mb-4">
              <div className="bg-white/20 p-3 rounded-xl">
                <span className="text-2xl">💰</span>
              </div>
              <span className="text-xs bg-white/30 px-2 py-1 rounded-full">This Month</span>
            </div>
            <p className="text-sm opacity-90 mb-1">Revenue</p>
            <p className="text-3xl font-bold mb-2">₦{stats.monthlyRevenue.toLocaleString()}</p>
            <p className="text-xs opacity-75">Profit: ₦{stats.monthlyProfit.toLocaleString()}</p>
          </div>

          {/* Expenses Card */}
          <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-2xl shadow-lg p-6 text-white transform hover:scale-105 transition">
            <div className="flex justify-between items-start mb-4">
              <div className="bg-white/20 p-3 rounded-xl">
                <span className="text-2xl">📝</span>
              </div>
              <span className="text-xs bg-white/30 px-2 py-1 rounded-full">This Month</span>
            </div>
            <p className="text-sm opacity-90 mb-1">Expenses</p>
            <p className="text-3xl font-bold mb-2">₦{stats.monthlyExpenses.toLocaleString()}</p>
            <p className="text-xs opacity-75">Net: ₦{(stats.monthlyRevenue - stats.monthlyExpenses).toLocaleString()}</p>
          </div>

          {/* Debt Card */}
          <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl shadow-lg p-6 text-white transform hover:scale-105 transition">
            <div className="flex justify-between items-start mb-4">
              <div className="bg-white/20 p-3 rounded-xl">
                <span className="text-2xl">📋</span>
              </div>
              <span className="text-xs bg-white/30 px-2 py-1 rounded-full">Outstanding</span>
            </div>
            <p className="text-sm opacity-90 mb-1">Debts Owed</p>
            <p className="text-3xl font-bold mb-2">₦{stats.totalDebt.toLocaleString()}</p>
            <p className="text-xs opacity-75">Overdue: ₦{stats.overdueDebt.toLocaleString()}</p>
          </div>

          {/* Puppies Card */}
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl shadow-lg p-6 text-white transform hover:scale-105 transition">
            <div className="flex justify-between items-start mb-4">
              <div className="bg-white/20 p-3 rounded-xl">
                <span className="text-2xl">🐕</span>
              </div>
            </div>
            <p className="text-sm opacity-90 mb-1">Available Puppies</p>
            <p className="text-3xl font-bold mb-2">{stats.availablePuppies}</p>
            <p className="text-xs opacity-75">{stats.reservedPuppies} reserved • {stats.soldPuppies} sold</p>
          </div>
        </div>

        {/* Second Row Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {/* Dogs Overview */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
              <span className="bg-blue-100 p-2 rounded-lg">🐕</span>
              Breeding Stock
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total Dogs</span>
                <span className="font-bold text-xl">{stats.totalDogs}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">👑 Studs</span>
                <span className="font-bold">{stats.totalStuds}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">🐩 Females</span>
                <span className="font-bold">{stats.totalFemales}</span>
              </div>
              <div className="pt-3 mt-3 border-t border-gray-100">
                <Link href="/admin/dogs" className="text-blue-600 hover:text-blue-700 text-sm flex items-center gap-1">
                  Manage Dogs <span>→</span>
                </Link>
              </div>
            </div>
          </div>

          {/* Products Overview */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
              <span className="bg-green-100 p-2 rounded-lg">🛍️</span>
              Pawshop Inventory
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total Products</span>
                <span className="font-bold text-xl">{stats.totalProducts}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-yellow-600">⚠️ Low Stock</span>
                <span className="font-bold text-yellow-600">{stats.lowStockProducts}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-red-600">❌ Out of Stock</span>
                <span className="font-bold text-red-600">{stats.outOfStockProducts}</span>
              </div>
              <div className="pt-3 mt-3 border-t border-gray-100">
                <Link href="/admin/products" className="text-blue-600 hover:text-blue-700 text-sm flex items-center gap-1">
                  Manage Products <span>→</span>
                </Link>
              </div>
            </div>
          </div>

          {/* Upcoming Heat Cycles */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
              <span className="bg-pink-100 p-2 rounded-lg">🔥</span>
              Upcoming Heat Cycles
            </h3>
            <div className="space-y-3">
              {stats.upcomingHeat.length > 0 ? (
                stats.upcomingHeat.slice(0, 3).map((dog: FemaleDog) => (
                  <div key={dog.id} className="flex justify-between items-center">
                    <span className="text-gray-600">{dog.name}</span>
                    <span className="text-sm bg-pink-100 text-pink-600 px-2 py-1 rounded">
                      {dog.next_heat ? new Date(dog.next_heat).toLocaleDateString() : 'TBD'}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-gray-400 text-center py-4">No upcoming heat cycles</p>
              )}
              <div className="pt-3 mt-3 border-t border-gray-100">
                <Link href="/admin/dogs?type=female" className="text-blue-600 hover:text-blue-700 text-sm flex items-center gap-1">
                  View All Females <span>→</span>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Recent Sales */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
                <span className="bg-green-100 p-2 rounded-lg">💰</span>
                Recent Sales
              </h3>
              <Link href="/admin/sales" className="text-sm text-gray-500 hover:text-gray-700">
                View All →
              </Link>
            </div>
            <div className="space-y-3">
              {stats.recentSales.length > 0 ? (
                stats.recentSales.map((sale: Sale) => (
                  <div key={sale.id} className="flex justify-between items-center p-2 hover:bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">{sale.item_name || 'Sale'}</p>
                      <p className="text-xs text-gray-500">{sale.customers?.name || 'Customer'}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-600">₦{sale.price.toLocaleString()}</p>
                      <p className="text-xs text-gray-400">{new Date(sale.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-400 text-center py-4">No recent sales</p>
              )}
            </div>
          </div>

          {/* Recent Expenses */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
                <span className="bg-red-100 p-2 rounded-lg">📝</span>
                Recent Expenses
              </h3>
              <Link href="/admin/expenses" className="text-sm text-gray-500 hover:text-gray-700">
                View All →
              </Link>
            </div>
            <div className="space-y-3">
              {stats.recentExpenses.length > 0 ? (
                stats.recentExpenses.map((expense: Expense) => (
                  <div key={expense.id} className="flex justify-between items-center p-2 hover:bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">{expense.description}</p>
                      <p className="text-xs text-gray-500">{expense.category}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-red-600">-₦{expense.amount.toLocaleString()}</p>
                      <p className="text-xs text-gray-400">{new Date(expense.date).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-400 text-center py-4">No recent expenses</p>
              )}
            </div>
          </div>
        </div>

        {/* Quick Action Buttons */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link
              href="/admin/dogs/new"
              className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-4 rounded-xl text-center hover:shadow-lg transform hover:scale-105 transition"
            >
              <div className="text-2xl mb-2">🐕</div>
              <div className="font-medium">Add New Dog</div>
            </Link>
            <Link
              href="/admin/products/new"
              className="bg-gradient-to-br from-green-500 to-green-600 text-white p-4 rounded-xl text-center hover:shadow-lg transform hover:scale-105 transition"
            >
              <div className="text-2xl mb-2">🛍️</div>
              <div className="font-medium">Add Product</div>
            </Link>
            <Link
              href="/admin/sales/new"
              className="bg-gradient-to-br from-yellow-500 to-yellow-600 text-white p-4 rounded-xl text-center hover:shadow-lg transform hover:scale-105 transition"
            >
              <div className="text-2xl mb-2">💰</div>
              <div className="font-medium">Record Sale</div>
            </Link>
            <Link
              href="/admin/debtors/new"
              className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-4 rounded-xl text-center hover:shadow-lg transform hover:scale-105 transition"
            >
              <div className="text-2xl mb-2">📋</div>
              <div className="font-medium">New Debt</div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}