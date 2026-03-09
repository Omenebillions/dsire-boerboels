// app/admin/reports/page.tsx
"use client";
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default function ReportsPage() {
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('month');
  const [data, setData] = useState({
    sales: { count: 0, revenue: 0, profit: 0 },
    expenses: { count: 0, total: 0 },
    dogs: { total: 0, available: 0, sold: 0 },
    products: { total: 0, sold: 0 },
    topProducts: [] as any[],
    recentActivity: [] as any[]
  });

  useEffect(() => {
    fetchReports();
  }, [period]);

  const fetchReports = async () => {
    setLoading(true);
    
    // Date range
    const now = new Date();
    let startDate = new Date();
    if (period === 'week') startDate.setDate(now.getDate() - 7);
    else if (period === 'month') startDate.setMonth(now.getMonth() - 1);
    else if (period === 'year') startDate.setFullYear(now.getFullYear() - 1);

    // Fetch all data
    const [salesData, expensesData, dogsData, productsData, recentSales] = await Promise.all([
      supabase.from('sales').select('*').gte('created_at', startDate.toISOString()),
      supabase.from('expenses').select('*').gte('date', startDate.toISOString().split('T')[0]),
      supabase.from('dogs').select('*'),
      supabase.from('products').select('*'),
      supabase.from('sales').select('*, customers(name)').order('created_at', { ascending: false }).limit(10)
    ]);

    // Calculate stats
    const sales = salesData.data || [];
    const expenses = expensesData.data || [];
    const dogs = dogsData.data || [];
    const products = productsData.data || [];

    setData({
      sales: {
        count: sales.length,
        revenue: sales.reduce((sum, s) => sum + s.price, 0),
        profit: sales.reduce((sum, s) => sum + (s.profit || 0), 0)
      },
      expenses: {
        count: expenses.length,
        total: expenses.reduce((sum, e) => sum + e.amount, 0)
      },
      dogs: {
        total: dogs.length,
        available: dogs.filter(d => d.status === 'available').length,
        sold: dogs.filter(d => d.status === 'sold').length
      },
      products: {
        total: products.length,
        sold: products.filter(p => !p.in_stock).length
      },
      topProducts: sales.reduce((acc: any, sale) => {
        const existing = acc.find((a: any) => a.name === sale.item_name);
        if (existing) existing.count++;
        else acc.push({ name: sale.item_name, count: 1 });
        return acc.sort((a: any, b: any) => b.count - a.count).slice(0, 5);
      }, []),
      recentActivity: recentSales.data || []
    });

    setLoading(false);
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-gray-200 rounded w-48"></div>
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-gray-200 rounded"></div>)}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">📊 Business Reports</h1>
          <div className="flex gap-2">
            {['week', 'month', 'year'].map(p => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-4 py-2 rounded ${
                  period === p ? 'bg-black text-white' : 'bg-white border'
                }`}
              >
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <p className="text-sm text-gray-500">Revenue</p>
            <p className="text-3xl font-bold text-green-600">₦{data.sales.revenue.toLocaleString()}</p>
            <p className="text-xs text-gray-400">{data.sales.count} transactions</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <p className="text-sm text-gray-500">Profit</p>
            <p className="text-3xl font-bold text-blue-600">₦{data.sales.profit.toLocaleString()}</p>
            <p className="text-xs text-gray-400">Margin: {data.sales.revenue ? ((data.sales.profit / data.sales.revenue) * 100).toFixed(1) : 0}%</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <p className="text-sm text-gray-500">Expenses</p>
            <p className="text-3xl font-bold text-red-600">₦{data.expenses.total.toLocaleString()}</p>
            <p className="text-xs text-gray-400">{data.expenses.count} entries</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <p className="text-sm text-gray-500">Net Income</p>
            <p className="text-3xl font-bold text-purple-600">₦{(data.sales.profit - data.expenses.total).toLocaleString()}</p>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {/* Sales vs Expenses */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-bold mb-4">Revenue vs Expenses</h2>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Revenue</span>
                  <span className="font-bold text-green-600">₦{data.sales.revenue.toLocaleString()}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-green-600 h-2 rounded-full" style={{ width: '100%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Expenses</span>
                  <span className="font-bold text-red-600">₦{data.expenses.total.toLocaleString()}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-red-600 h-2 rounded-full" style={{ width: `${(data.expenses.total / data.sales.revenue) * 100}%` }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Profit</span>
                  <span className="font-bold text-blue-600">₦{data.sales.profit.toLocaleString()}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${(data.sales.profit / data.sales.revenue) * 100}%` }}></div>
                </div>
              </div>
            </div>
          </div>

          {/* Inventory Stats */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-bold mb-4">Inventory Overview</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-blue-50 rounded">
                <p className="text-2xl font-bold text-blue-600">{data.dogs.total}</p>
                <p className="text-sm text-gray-600">Total Dogs</p>
              </div>
              <div className="text-center p-3 bg-green-50 rounded">
                <p className="text-2xl font-bold text-green-600">{data.dogs.available}</p>
                <p className="text-sm text-gray-600">Available</p>
              </div>
              <div className="text-center p-3 bg-purple-50 rounded">
                <p className="text-2xl font-bold text-purple-600">{data.products.total}</p>
                <p className="text-sm text-gray-600">Products</p>
              </div>
              <div className="text-center p-3 bg-yellow-50 rounded">
                <p className="text-2xl font-bold text-yellow-600">{data.products.sold}</p>
                <p className="text-sm text-gray-600">Sold Out</p>
              </div>
            </div>
          </div>
        </div>

        {/* Top Products */}
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-lg font-bold mb-4">Top Selling Items</h2>
          <div className="space-y-3">
            {data.topProducts.map((item: any, idx: number) => (
              <div key={idx} className="flex justify-between items-center">
                <span className="font-medium">{item.name}</span>
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">{item.count} sold</span>
              </div>
            ))}
            {data.topProducts.length === 0 && (
              <p className="text-gray-400 text-center py-4">No sales data</p>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-bold mb-4">Recent Activity</h2>
          <div className="space-y-3">
            {data.recentActivity.map((item: any) => (
              <div key={item.id} className="flex justify-between items-center border-b pb-2">
                <div>
                  <p className="font-medium">{item.item_name || 'Sale'}</p>
                  <p className="text-xs text-gray-500">{item.customer_name}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-green-600">₦{item.price.toLocaleString()}</p>
                  <p className="text-xs text-gray-400">{new Date(item.created_at).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}