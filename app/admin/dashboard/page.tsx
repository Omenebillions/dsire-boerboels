// app/admin/dashboard/page.tsx
"use client";
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import Image from 'next/image';

// --- Types ---
interface Sale {
  id: number;
  item_name?: string;
  price: number;
  created_at: string;
  customers?: { name: string } | null;
}

interface Expense {
  id: number;
  description: string;
  amount: number;
  category: string;
  date: string;
}

interface PendingItem {
  id: number;
  type: 'dog' | 'order';
  name: string;
  subtext: string;
  amount: number;
}

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [greeting, setGreeting] = useState('');
  const [currentTime, setCurrentTime] = useState('');

  // KPI state
  const [revenueMonth, setRevenueMonth] = useState(0);
  const [expensesMonth, setExpensesMonth] = useState(0);
  const [profitMonth, setProfitMonth] = useState(0);
  const [pendingTotal, setPendingTotal] = useState(0);
  const [pendingItems, setPendingItems] = useState<PendingItem[]>([]);
  const [recentSales, setRecentSales] = useState<Sale[]>([]);
  const [recentExpenses, setRecentExpenses] = useState<Expense[]>([]);

  // For collections tab inside dashboard
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
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    try {
      // 1. Sales this month (realized revenue = paid)
      const { data: monthSales } = await supabase
        .from('sales')
        .select('price, profit')
        .gte('created_at', startOfMonth)
        .in('payment_status', ['paid', 'completed']);
      const rev = monthSales?.reduce((acc, s) => acc + (s.price || 0), 0) || 0;
      const prof = monthSales?.reduce((acc, s) => acc + (s.profit || 0), 0) || 0;

      // 2. Expenses this month
      const { data: monthExp } = await supabase
        .from('expenses')
        .select('amount')
        .gte('date', startOfMonth.split('T')[0]);
      const exp = monthExp?.reduce((acc, e) => acc + (e.amount || 0), 0) || 0;

      // 3. Pending balances (reserved dogs + unpaid orders)
      // ✅ FIX: include 'id' in select
      const { data: dogs } = await supabase
        .from('dogs')
        .select('id, name, price, status');
      const { data: orders } = await supabase
        .from('orders')
        .select('*')
        .neq('payment_status', 'paid');

      const pending: PendingItem[] = [];

      dogs?.filter(d => d.status === 'reserved').forEach(d => {
        const balance = (d.price || 0) - 100000;
        if (balance > 0) {
          pending.push({
            id: d.id,
            type: 'dog',
            name: d.name,
            subtext: 'Dog Balance Due',
            amount: balance,
          });
        }
      });

      orders?.forEach(o => {
        pending.push({
          id: o.id,
          type: 'order',
          name: `Order #${o.id.toString().slice(-4)}`,
          subtext: o.customer_name || 'Web Customer',
          amount: o.total_amount || 0,
        });
      });

      const totalPending = pending.reduce((sum, i) => sum + i.amount, 0);

      // 4. Recent sales
      const { data: recentS } = await supabase
        .from('sales')
        .select('*, customers(name)')
        .order('created_at', { ascending: false })
        .limit(5);
      // 5. Recent expenses
      const { data: recentE } = await supabase
        .from('expenses')
        .select('*')
        .order('date', { ascending: false })
        .limit(5);

      setRevenueMonth(rev);
      setExpensesMonth(exp);
      setProfitMonth(prof);
      setPendingTotal(totalPending);
      setPendingItems(pending);
      setRecentSales(recentS || []);
      setRecentExpenses(recentE || []);
    } catch (err) {
      console.error('Dashboard error:', err);
    } finally {
      setLoading(false);
    }
  };

  const clearItem = async (item: PendingItem) => {
    const today = new Date().toISOString().split('T')[0];
    if (item.type === 'dog') {
      await supabase.from('dogs').update({ status: 'sold' }).eq('id', item.id);
      await supabase.from('sales').insert([{
        item_type: 'dog',
        item_id: item.id,
        item_name: item.name,
        price: item.amount,
        payment_status: 'paid',
        sale_date: today,
        notes: `Balance cleared via dashboard`
      }]);
    } else {
      await supabase.from('orders').update({ payment_status: 'paid' }).eq('id', item.id);
      await supabase.from('sales').insert([{
        source: 'shop_order',
        item_type: 'order',
        item_id: item.id,
        item_name: item.name,
        price: item.amount,
        payment_status: 'paid',
        sale_date: today,
        notes: `Order marked paid via dashboard`
      }]);
    }
    fetchDashboardData();
  };

  const handleBulkClear = async () => {
    if (!confirm(`Clear all ${pendingItems.length} pending items?`)) return;
    setLoading(true);
    await Promise.all(pendingItems.map(item => clearItem(item)));
    setLoading(false);
  };

  const filteredPending = pendingItems.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.subtext.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-pulse text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500 font-semibold">Loading dashboard...</p>
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
              <div className="w-16 h-16 bg-gray-100 rounded-xl overflow-hidden border-2 border-gray-200">
                <Image src="/logo.png" alt="Logo" width={64} height={64} className="object-contain p-2" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{greeting}, Breeder</h1>
                <p className="text-sm text-gray-500">{currentTime}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Link href="/" className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
                👁️ View Site
              </Link>
              <button onClick={fetchDashboardData} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                🔄 Refresh
              </button>
            </div>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 text-white shadow-lg">
            <p className="text-sm opacity-90 mb-1">Revenue (this month)</p>
            <p className="text-3xl font-bold">₦{revenueMonth.toLocaleString()}</p>
            <p className="text-xs opacity-75 mt-2">Profit: ₦{profitMonth.toLocaleString()}</p>
          </div>
          <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-2xl p-6 text-white shadow-lg">
            <p className="text-sm opacity-90 mb-1">Expenses (this month)</p>
            <p className="text-3xl font-bold">₦{expensesMonth.toLocaleString()}</p>
            <p className="text-xs opacity-75 mt-2">Net: ₦{(revenueMonth - expensesMonth).toLocaleString()}</p>
          </div>
          <div
            className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-6 text-white shadow-lg cursor-pointer hover:opacity-90"
            onClick={() => setShowCollections(!showCollections)}
          >
            <p className="text-sm opacity-90 mb-1">Pending Receivables</p>
            <p className="text-3xl font-bold">₦{pendingTotal.toLocaleString()}</p>
            <p className="text-xs opacity-75 mt-2">{pendingItems.length} items</p>
          </div>
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg">
            <p className="text-sm opacity-90 mb-1">Quick Actions</p>
            <div className="flex gap-2 mt-2">
              <Link href="/admin/dogs/new" className="text-xs bg-white/20 px-2 py-1 rounded">🐕 Add Dog</Link>
              <Link href="/admin/products/new" className="text-xs bg-white/20 px-2 py-1 rounded">🛍️ Add Product</Link>
            </div>
          </div>
        </div>

        {/* Collections Section (if expanded) */}
        {showCollections && (
          <div className="bg-white rounded-2xl shadow-md border border-gray-200 mb-6 overflow-hidden">
            <div className="bg-gray-900 p-4 flex flex-col md:flex-row justify-between gap-4">
              <input
                type="text"
                placeholder="Search pending items..."
                className="bg-gray-800 text-white text-sm p-2 rounded-lg border-none w-full md:w-64"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button
                onClick={handleBulkClear}
                className="bg-emerald-500 text-white text-xs font-bold px-5 py-2 rounded-lg hover:bg-emerald-600"
              >
                Bulk Clear All (₦{pendingTotal.toLocaleString()})
              </button>
            </div>
            <div className="divide-y">
              {filteredPending.map((item) => (
                <div key={`${item.type}-${item.id}`} className="p-4 flex justify-between items-center hover:bg-gray-50">
                  <div>
                    <p className="font-bold text-gray-900">{item.name}</p>
                    <p className="text-xs text-gray-500">{item.subtext}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <p className="font-bold text-gray-900">₦{item.amount.toLocaleString()}</p>
                    <button
                      onClick={() => { clearItem(item); }}
                      className="text-xs text-emerald-600 hover:underline font-semibold"
                    >
                      Received
                    </button>
                  </div>
                </div>
              ))}
              {filteredPending.length === 0 && (
                <div className="p-8 text-center text-gray-400 font-semibold">No pending items match.</div>
              )}
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
            <div className="space-y-3">
              {recentSales.map(s => (
                <div key={s.id} className="flex justify-between items-center p-2 hover:bg-gray-50 rounded">
                  <div>
                    <p className="font-medium">{s.item_name || 'Sale'}</p>
                    <p className="text-xs text-gray-500">{s.customers?.name || 'Customer'}</p>
                  </div>
                  <p className="font-bold text-green-600">₦{s.price.toLocaleString()}</p>
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
            <div className="space-y-3">
              {recentExpenses.map(e => (
                <div key={e.id} className="flex justify-between items-center p-2 hover:bg-gray-50 rounded">
                  <div>
                    <p className="font-medium">{e.description}</p>
                    <p className="text-xs text-gray-500">{e.category}</p>
                  </div>
                  <p className="font-bold text-red-600">-₦{e.amount.toLocaleString()}</p>
                </div>
              ))}
              {recentExpenses.length === 0 && <p className="text-gray-400 text-center py-4">No recent expenses</p>}
            </div>
          </div>
        </div>

        {/* Quick Actions Grid */}
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
          <Link href="/admin/sales/new" className="bg-blue-600 text-white p-4 rounded-xl text-center hover:bg-blue-700 transition">
            <span className="text-2xl block">💰</span> Record Sale
          </Link>
          <Link href="/admin/expenses/new" className="bg-red-600 text-white p-4 rounded-xl text-center hover:bg-red-700 transition">
            <span className="text-2xl block">📝</span> Add Expense
          </Link>
          <Link href="/admin/debtors/new" className="bg-purple-600 text-white p-4 rounded-xl text-center hover:bg-purple-700 transition">
            <span className="text-2xl block">📋</span> New Debt
          </Link>
          <Link href="/admin/debtors/customers/new" className="bg-indigo-600 text-white p-4 rounded-xl text-center hover:bg-indigo-700 transition">
            <span className="text-2xl block">👤</span> New Customer
          </Link>
        </div>
      </div>
    </div>
  );
}