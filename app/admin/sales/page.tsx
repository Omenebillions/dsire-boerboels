// app/admin/sales/page.tsx
"use client";
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

// Define the Sale interface
interface Sale {
  id: number;
  item_type: string;
  item_id: number;
  item_name?: string;
  customer_name: string;
  customer_email?: string;
  customer_phone?: string;
  quantity: number;
  price: number;
  cost?: number;
  profit?: number;
  payment_method?: string;
  payment_status: string;
  deposit_amount?: number;
  notes?: string;
  sale_date: string;
  created_at: string;
  customers?: {
    name: string;
  };
}

export default function AdminSalesPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('month');

  useEffect(() => {
    fetchSales();
  }, [period]);

  const fetchSales = async () => {
    setLoading(true);
    
    let query = supabase.from('sales').select('*');
    
    // Date filtering
    const now = new Date();
    if (period === 'week') {
      const weekAgo = new Date(now);
      weekAgo.setDate(weekAgo.getDate() - 7);
      query = query.gte('created_at', weekAgo.toISOString());
    } else if (period === 'month') {
      const monthAgo = new Date(now);
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      query = query.gte('created_at', monthAgo.toISOString());
    }
    
    const { data } = await query.order('created_at', { ascending: false });
    setSales((data as Sale[]) || []);
    setLoading(false);
  };

  const totals = sales.reduce((acc: any, sale: Sale) => ({
    revenue: acc.revenue + sale.price,
    profit: acc.profit + (sale.profit || 0),
    count: acc.count + 1
  }), { revenue: 0, profit: 0, count: 0 });

  if (loading) return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-48 mb-6"></div>
          <div className="flex gap-2 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-10 bg-gray-200 rounded w-20"></div>
            ))}
          </div>
          <div className="grid grid-cols-4 gap-4 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">💰 Sales</h1>
          <Link href="/admin/sales/new" className="bg-black text-white px-4 py-2 rounded-lg">
            + Record Sale
          </Link>
        </div>

        {/* Period Filter */}
        <div className="flex gap-2 mb-6">
          {['week', 'month', 'year', 'all'].map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-2 rounded-lg ${
                period === p ? 'bg-black text-white' : 'bg-white border'
              }`}
            >
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>

        {/* Summary Cards */}
        <div className="grid md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <p className="text-sm text-gray-500">Total Sales</p>
            <p className="text-3xl font-bold">{totals.count}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <p className="text-sm text-gray-500">Revenue</p>
            <p className="text-3xl font-bold text-green-600">₦{totals.revenue.toLocaleString()}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <p className="text-sm text-gray-500">Profit</p>
            <p className="text-3xl font-bold text-blue-600">₦{totals.profit.toLocaleString()}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <p className="text-sm text-gray-500">Margin</p>
            <p className="text-3xl font-bold">
              {totals.revenue ? ((totals.profit / totals.revenue) * 100).toFixed(1) : 0}%
            </p>
          </div>
        </div>

        {/* Sales Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-3 text-left">Date</th>
                  <th className="p-3 text-left">Item</th>
                  <th className="p-3 text-left">Customer</th>
                  <th className="p-3 text-left">Type</th>
                  <th className="p-3 text-right">Amount</th>
                  <th className="p-3 text-right">Profit</th>
                  <th className="p-3 text-left">Status</th>
                  <th className="p-3 text-left">Payment</th>
                </tr>
              </thead>
              <tbody>
                {sales.map((sale: Sale) => (
                  <tr key={sale.id} className="border-t hover:bg-gray-50">
                    <td className="p-3">{new Date(sale.sale_date).toLocaleDateString()}</td>
                    <td className="p-3 font-medium">{sale.item_name || 'Sale'}</td>
                    <td className="p-3">{sale.customer_name}</td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        sale.item_type === 'dog' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                      }`}>
                        {sale.item_type}
                      </span>
                    </td>
                    <td className="p-3 text-right">₦{sale.price.toLocaleString()}</td>
                    <td className="p-3 text-right text-green-600">₦{sale.profit?.toLocaleString() || 0}</td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        sale.payment_status === 'paid' ? 'bg-green-100 text-green-800' :
                        sale.payment_status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {sale.payment_status}
                      </span>
                    </td>
                    <td className="p-3">{sale.payment_method || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {sales.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No sales found</p>
              <Link href="/admin/sales/new" className="text-blue-600 hover:underline mt-2 block">
                Record your first sale
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}