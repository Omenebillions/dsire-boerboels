// app/admin/dashboard/page.tsx
"use client";
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import Image from 'next/image';

interface Sale {
  id: number;
  item_name?: string;
  price: number;
  source: string;
  payment_status: string;
  created_at: string;
  customer_name: string;
}

interface Expense {
  id: number;
  description: string;
  amount: number;
  category: string;
  date: string;
}

interface Debtor {
  id: number;
  invoice_number: string;
  customer_name: string;
  remaining_amount: number;
  due_date: string;
  status: string;
}

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [greeting, setGreeting] = useState('');
  const [currentTime, setCurrentTime] = useState('');

  // KPI state
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [revenueThisMonth, setRevenueThisMonth] = useState(0);
  const [revenueToday, setRevenueToday] = useState(0);
  const [revenueThisWeek, setRevenueThisWeek] = useState(0);
  
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [expensesThisMonth, setExpensesThisMonth] = useState(0);
  const [expensesToday, setExpensesToday] = useState(0);
  const [expensesThisWeek, setExpensesThisWeek] = useState(0);
  
  const [totalProfit, setTotalProfit] = useState(0);
  const [profitThisMonth, setProfitThisMonth] = useState(0);
  const [profitMargin, setProfitMargin] = useState(0);
  
  const [totalOutstanding, setTotalOutstanding] = useState(0);
  const [overdueAmount, setOverdueAmount] = useState(0);
  const [overdueCount, setOverdueCount] = useState(0);
  
  const [dogReserves, setDogReserves] = useState(0);
  const [dogSales, setDogSales] = useState(0);
  const [shopSales, setShopSales] = useState(0);
  const [manualSales, setManualSales] = useState(0);
  
  const [recentSales, setRecentSales] = useState<Sale[]>([]);
  const [recentExpenses, setRecentExpenses] = useState<Expense[]>([]);
  const [recentDebtors, setRecentDebtors] = useState<Debtor[]>([]);
  const [showCollections, setShowCollections] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchDashboardData();
    setGreeting(getGreeting());
    setCurrentTime(new Date().toLocaleTimeString());
    const timer = setInterval(() => setCurrentTime(new Date().toLocaleTimeString()), 60000);
    return () => clearInterval(timer);
  }, []);

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good Morning';
    if (h < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const fetchDashboardData = async () => {
    setLoading(true);
    
    try {
      const now = new Date();
      const today = now.toISOString().split('T')[0];
      const weekAgo = new Date(now);
      weekAgo.setDate(now.getDate() - 7);
      const weekStart = weekAgo.toISOString().split('T')[0];
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      
      // 1. Fetch ALL paid sales
      const { data: allSales } = await supabase
        .from('sales')
        .select('price, source, created_at, payment_status')
        .in('payment_status', ['paid', 'completed']);
      
      const paidSales = allSales || [];
      
      // 2. Fetch ALL expenses
      const { data: allExpenses } = await supabase
        .from('expenses')
        .select('amount, date');
      
      const expenses = allExpenses || [];
      
      // 3. Fetch debtors
      const { data: allDebtors } = await supabase
        .from('debtors')
        .select('*')
        .neq('status', 'paid');
      
      const debtors = allDebtors || [];
      
      // Calculate totals
      const totalRev = paidSales.reduce((sum, s) => sum + (Number(s.price) || 0), 0);
      const totalExp = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
      const totalProf = totalRev - totalExp;
      
      // Today's calculations
      const revToday = paidSales
        .filter(s => s.created_at?.split('T')[0] === today)
        .reduce((sum, s) => sum + (Number(s.price) || 0), 0);
      const expToday = expenses
        .filter(e => e.date === today)
        .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
      
      // This week
      const revWeek = paidSales
        .filter(s => s.created_at?.split('T')[0] >= weekStart)
        .reduce((sum, s) => sum + (Number(s.price) || 0), 0);
      const expWeek = expenses
        .filter(e => e.date >= weekStart)
        .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
      
      // This month
      const revMonth = paidSales
        .filter(s => s.created_at?.split('T')[0] >= monthStart)
        .reduce((sum, s) => sum + (Number(s.price) || 0), 0);
      const expMonth = expenses
        .filter(e => e.date >= monthStart)
        .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
      
      // Sales by source
      const dogRes = paidSales
        .filter(s => s.source === 'dog_reserve')
        .reduce((sum, s) => sum + (Number(s.price) || 0), 0);
      const dogSld = paidSales
        .filter(s => s.source === 'dog_sold')
        .reduce((sum, s) => sum + (Number(s.price) || 0), 0);
      const shopSld = paidSales
        .filter(s => s.source === 'shop_order')
        .reduce((sum, s) => sum + (Number(s.price) || 0), 0);
      const manualSld = paidSales
        .filter(s => s.source === 'manual_sale')
        .reduce((sum, s) => sum + (Number(s.price) || 0), 0);
      
      // Debtor calculations
      const totalOut = debtors.reduce((sum, d) => sum + (Number(d.remaining_amount) || 0), 0);
      const todayDate = new Date().toISOString().split('T')[0];
      const overdue = debtors.filter(d => d.due_date && d.due_date < todayDate);
      const overdueTotal = overdue.reduce((sum, d) => sum + (Number(d.remaining_amount) || 0), 0);
      
      // Recent data
      const { data: recentS } = await supabase
        .from('sales')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(8);
      
      const { data: recentE } = await supabase
        .from('expenses')
        .select('*')
        .order('date', { ascending: false })
        .limit(8);
      
      const { data: recentD } = await supabase
        .from('debtors')
        .select('*')
        .order('due_date', { ascending: true })
        .limit(5);
      
      // Set state
      setTotalRevenue(totalRev);
      setRevenueToday(revToday);
      setRevenueThisWeek(revWeek);
      setRevenueThisMonth(revMonth);
      
      setTotalExpenses(totalExp);
      setExpensesToday(expToday);
      setExpensesThisWeek(expWeek);
      setExpensesThisMonth(expMonth);
      
      setTotalProfit(totalProf);
      setProfitThisMonth(revMonth - expMonth);
      setProfitMargin(totalRev > 0 ? (totalProf / totalRev) * 100 : 0);
      
      setTotalOutstanding(totalOut);
      setOverdueAmount(overdueTotal);
      setOverdueCount(overdue.length);
      
      setDogReserves(dogRes);
      setDogSales(dogSld);
      setShopSales(shopSld);
      setManualSales(manualSld);
      
      setRecentSales(recentS || []);
      setRecentExpenses(recentE || []);
      setRecentDebtors(recentD || []);
      
    } catch (error: any) {
      console.error('Dashboard error:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return `₦${amount.toLocaleString()}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-pulse text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500 font-semibold">Loading financial dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gray-100 rounded-xl overflow-hidden border-2 border-gray-200 flex items-center justify-center">
                <span className="text-3xl">🐕</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{greeting}, Mr Nwosu Obinna</h1>
                <p className="text-sm text-gray-500">{currentTime}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={fetchDashboardData} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                🔄 Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Main KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 text-white shadow-lg">
            <p className="text-sm opacity-90 mb-1">Total Revenue (All Time)</p>
            <p className="text-3xl font-bold">{formatCurrency(totalRevenue)}</p>
            <div className="mt-3 pt-3 border-t border-green-400 grid grid-cols-2 gap-2 text-xs">
              <div>
                <p className="opacity-75">This Month</p>
                <p className="font-bold">{formatCurrency(revenueThisMonth)}</p>
              </div>
              <div>
                <p className="opacity-75">Today</p>
                <p className="font-bold">{formatCurrency(revenueToday)}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-2xl p-6 text-white shadow-lg">
            <p className="text-sm opacity-90 mb-1">Total Expenses (All Time)</p>
            <p className="text-3xl font-bold">{formatCurrency(totalExpenses)}</p>
            <div className="mt-3 pt-3 border-t border-red-400 grid grid-cols-2 gap-2 text-xs">
              <div>
                <p className="opacity-75">This Month</p>
                <p className="font-bold">{formatCurrency(expensesThisMonth)}</p>
              </div>
              <div>
                <p className="opacity-75">Today</p>
                <p className="font-bold">{formatCurrency(expensesToday)}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg">
            <p className="text-sm opacity-90 mb-1">Net Profit (All Time)</p>
            <p className="text-3xl font-bold">{formatCurrency(totalProfit)}</p>
            <div className="mt-3 pt-3 border-t border-purple-400 grid grid-cols-2 gap-2 text-xs">
              <div>
                <p className="opacity-75">Margin</p>
                <p className="font-bold">{profitMargin.toFixed(1)}%</p>
              </div>
              <div>
                <p className="opacity-75">This Month</p>
                <p className="font-bold">{formatCurrency(profitThisMonth)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Secondary KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
            <p className="text-xs text-gray-500 uppercase tracking-wider">This Week Revenue</p>
            <p className="text-xl font-bold text-green-600">{formatCurrency(revenueThisWeek)}</p>
            <p className="text-xs text-gray-400 mt-1">Expenses: {formatCurrency(expensesThisWeek)}</p>
          </div>
          <div 
            className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 cursor-pointer hover:shadow-md transition"
            onClick={() => setShowCollections(!showCollections)}
          >
            <p className="text-xs text-gray-500 uppercase tracking-wider">Outstanding Debt</p>
            <p className="text-xl font-bold text-orange-600">{formatCurrency(totalOutstanding)}</p>
            <p className="text-xs text-red-500 mt-1">Overdue: {formatCurrency(overdueAmount)} ({overdueCount})</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
            <p className="text-xs text-gray-500 uppercase tracking-wider">Profit Margin</p>
            <p className={`text-xl font-bold ${profitMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {profitMargin.toFixed(1)}%
            </p>
            <p className="text-xs text-gray-400 mt-1">Gross: {formatCurrency(totalRevenue - totalExpenses)}</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
            <p className="text-xs text-gray-500 uppercase tracking-wider">Total Transactions</p>
            <p className="text-xl font-bold text-blue-600">{recentSales.length + recentExpenses.length}</p>
            <p className="text-xs text-gray-400 mt-1">Sales: {recentSales.length} | Expenses: {recentExpenses.length}</p>
          </div>
        </div>

        {/* Revenue Breakdown */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="bg-indigo-50 p-3 rounded-xl text-indigo-700 text-center">
            <p className="text-xs font-bold">🐕 Deposits</p>
            <p className="text-lg font-bold">{formatCurrency(dogReserves)}</p>
          </div>
          <div className="bg-purple-50 p-3 rounded-xl text-purple-700 text-center">
            <p className="text-xs font-bold">🐕 Dog Sales</p>
            <p className="text-lg font-bold">{formatCurrency(dogSales)}</p>
          </div>
          <div className="bg-emerald-50 p-3 rounded-xl text-emerald-700 text-center">
            <p className="text-xs font-bold">🛒 Pawshop</p>
            <p className="text-lg font-bold">{formatCurrency(shopSales)}</p>
          </div>
          <div className="bg-gray-50 p-3 rounded-xl text-gray-700 text-center">
            <p className="text-xs font-bold">📝 Manual</p>
            <p className="text-lg font-bold">{formatCurrency(manualSales)}</p>
          </div>
        </div>

        {/* Collections Section */}
        {showCollections && (
          <div className="bg-white rounded-2xl shadow-md border border-gray-200 mb-6 overflow-hidden">
            <div className="bg-gray-900 p-4 flex flex-col md:flex-row justify-between gap-4">
              <h3 className="text-white font-bold">💰 Outstanding Debts</h3>
              <input
                type="text"
                placeholder="Search debts..."
                className="bg-gray-800 text-white text-sm p-2 rounded-lg border-none w-full md:w-64"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="divide-y">
              {recentDebtors
                .filter(d => d.invoice_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  d.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()))
                .map((debt) => (
                  <div key={debt.id} className="p-4 flex justify-between items-center hover:bg-gray-50">
                    <div>
                      <p className="font-bold text-gray-900">{debt.invoice_number}</p>
                      <p className="text-sm text-gray-600">{debt.customer_name}</p>
                      {debt.due_date && (
                        <p className="text-xs text-gray-400">Due: {new Date(debt.due_date).toLocaleDateString()}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-red-600">{formatCurrency(debt.remaining_amount)}</p>
                      {debt.status === 'overdue' && (
                        <span className="text-xs text-red-500 font-bold">OVERDUE</span>
                      )}
                    </div>
                  </div>
                ))}
              {recentDebtors.length === 0 && (
                <div className="p-8 text-center text-gray-400">No outstanding debts</div>
              )}
            </div>
            <div className="p-4 bg-gray-50 border-t">
              <Link href="/admin/debtors" className="text-blue-600 text-sm hover:underline">
                View All Debtors →
              </Link>
            </div>
          </div>
        )}

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Sales */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg">💰 Recent Sales</h3>
              <Link href="/admin/sales" className="text-sm text-blue-600 hover:underline">View All →</Link>
            </div>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {recentSales.map(s => (
                <div key={s.id} className="flex justify-between items-center p-3 hover:bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">{s.item_name || 'Sale'}</p>
                    <p className="text-xs text-gray-500">
                      {s.created_at ? new Date(s.created_at).toLocaleDateString() : 'Unknown'} • {s.customer_name || 'Walk-in'}
                    </p>
                    <span className="text-xs text-gray-400 capitalize">{s.source?.replace('_', ' ')}</span>
                  </div>
                  <p className="font-bold text-green-600">{formatCurrency(s.price)}</p>
                </div>
              ))}
              {recentSales.length === 0 && <p className="text-gray-400 text-center py-4">No recent sales</p>}
            </div>
          </div>

          {/* Recent Expenses */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg">📝 Recent Expenses</h3>
              <Link href="/admin/expenses" className="text-sm text-blue-600 hover:underline">View All →</Link>
            </div>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {recentExpenses.map(e => (
                <div key={e.id} className="flex justify-between items-center p-3 hover:bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">{e.description}</p>
                    <p className="text-xs text-gray-500">{e.category} • {new Date(e.date).toLocaleDateString()}</p>
                  </div>
                  <p className="font-bold text-red-600">-{formatCurrency(e.amount)}</p>
                </div>
              ))}
              {recentExpenses.length === 0 && <p className="text-gray-400 text-center py-4">No recent expenses</p>}
            </div>
          </div>
        </div>

        {/* Financial Summary */}
        <div className="mt-6 bg-gradient-to-r from-gray-800 to-gray-900 rounded-2xl p-6 text-white">
          <h3 className="font-bold text-lg mb-4">📊 Financial Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-gray-400">Total Revenue</p>
              <p className="text-xl font-bold">{formatCurrency(totalRevenue)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Total Expenses</p>
              <p className="text-xl font-bold text-red-400">{formatCurrency(totalExpenses)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Net Profit</p>
              <p className={`text-xl font-bold ${totalProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {formatCurrency(totalProfit)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Profit Margin</p>
              <p className={`text-xl font-bold ${profitMargin >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {profitMargin.toFixed(1)}%
              </p>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-700 flex flex-wrap justify-between text-sm gap-2">
            <span>🏆 Outstanding Debt: {formatCurrency(totalOutstanding)}</span>
            <span>⚠️ Overdue: {formatCurrency(overdueAmount)}</span>
            <span>📦 Total Transactions: {recentSales.length + recentExpenses.length}</span>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
          <Link href="/admin/sales/new" className="bg-blue-600 text-white p-4 rounded-xl text-center hover:bg-blue-700 transition">
            <span className="text-2xl block">💰</span> Record Sale
          </Link>
          <Link href="/admin/expenses/new" className="bg-red-600 text-white p-4 rounded-xl text-center hover:bg-red-700 transition">
            <span className="text-2xl block">📝</span> Add Expense
          </Link>
          <Link href="/admin/debtors" className="bg-orange-600 text-white p-4 rounded-xl text-center hover:bg-orange-700 transition">
            <span className="text-2xl block">📋</span> Manage Debts
          </Link>
          <Link href="/admin/reports" className="bg-purple-600 text-white p-4 rounded-xl text-center hover:bg-purple-700 transition">
            <span className="text-2xl block">📊</span> Full Reports
          </Link>
        </div>
      </div>
    </div>
  );
}