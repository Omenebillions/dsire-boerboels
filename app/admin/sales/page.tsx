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
  source?: 'sales_table' | 'orders_table';
}

// Define Order interface
interface Order {
  id: number;
  order_reference: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  total_amount: number;
  payment_status: string;
  payment_method: string;
  items: any[];
  created_at: string;
  source: 'orders_table';
}

export default function AdminSalesPage() {
  const [sales, setSales] = useState<(Sale | Order)[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('month');
  const [viewMode, setViewMode] = useState('combined'); // 'combined', 'sales', 'orders'

  useEffect(() => {
    fetchAllSales();
  }, [period]);

  const fetchAllSales = async () => {
    setLoading(true);
    
    // Date filtering
    const now = new Date();
    let startDate: Date | null = null;
    
    if (period === 'week') {
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 7);
    } else if (period === 'month') {
      startDate = new Date(now);
      startDate.setMonth(startDate.getMonth() - 1);
    } else if (period === 'year') {
      startDate = new Date(now);
      startDate.setFullYear(startDate.getFullYear() - 1);
    }

    try {
      // Fetch from sales table
      let salesQuery = supabase.from('sales').select('*');
      if (startDate) {
        salesQuery = salesQuery.gte('created_at', startDate.toISOString());
      }
      const { data: salesData } = await salesQuery.order('created_at', { ascending: false });

      // Fetch from orders table
      let ordersQuery = supabase.from('orders').select('*');
      if (startDate) {
        ordersQuery = ordersQuery.gte('created_at', startDate.toISOString());
      }
      const { data: ordersData } = await ordersQuery.order('created_at', { ascending: false });

      // Transform orders to match sale-like structure
      const transformedOrders: Sale[] = (ordersData || []).map((order: any) => ({
        id: order.id,
        item_type: 'order',
        item_id: order.id,
        item_name: `Order #${order.order_reference}`,
        customer_name: order.customer_name,
        customer_email: order.customer_email,
        customer_phone: order.customer_phone,
        quantity: 1,
        price: order.total_amount,
        cost: 0,
        profit: 0,
        payment_method: order.payment_method,
        payment_status: order.payment_status,
        sale_date: new Date(order.created_at).toISOString().split('T')[0],
        created_at: order.created_at,
        notes: `${order.items?.length || 0} items`,
        source: 'orders_table'
      }));

      // Combine both sources
      const combined = [
        ...(salesData || []).map(s => ({ ...s, source: 'sales_table' })),
        ...transformedOrders
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setSales(combined);
    } catch (error) {
      console.error('Error fetching sales:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter based on view mode
  const filteredSales = viewMode === 'combined' 
    ? sales 
    : viewMode === 'sales' 
      ? sales.filter(s => s.source === 'sales_table')
      : sales.filter(s => s.source === 'orders_table');

  // Calculate totals
  const totals = filteredSales.reduce((acc: any, sale: any) => ({
    revenue: acc.revenue + (sale.price || sale.total_amount || 0),
    profit: acc.profit + (sale.profit || 0),
    count: acc.count + 1,
    pendingCount: acc.pendingCount + (sale.payment_status === 'pending' ? 1 : 0)
  }), { revenue: 0, profit: 0, count: 0, pendingCount: 0 });

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
          <h1 className="text-3xl font-bold">💰 Sales & Orders</h1>
          <div className="flex gap-2">
            <Link href="/admin/sales/new" className="bg-black text-white px-4 py-2 rounded-lg">
              + Record Sale
            </Link>
          </div>
        </div>

        {/* View Mode Tabs */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setViewMode('combined')}
            className={`px-4 py-2 rounded-lg font-medium ${
              viewMode === 'combined' ? 'bg-black text-white' : 'bg-gray-200 text-gray-700'
            }`}
          >
            All Transactions
          </button>
          <button
            onClick={() => setViewMode('sales')}
            className={`px-4 py-2 rounded-lg font-medium ${
              viewMode === 'sales' ? 'bg-black text-white' : 'bg-gray-200 text-gray-700'
            }`}
          >
            Manual Sales
          </button>
          <button
            onClick={() => setViewMode('orders')}
            className={`px-4 py-2 rounded-lg font-medium ${
              viewMode === 'orders' ? 'bg-black text-white' : 'bg-gray-200 text-gray-700'
            }`}
          >
            Online Orders
          </button>
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
            <p className="text-sm text-gray-500">Total Transactions</p>
            <p className="text-3xl font-bold">{totals.count}</p>
            <p className="text-xs text-gray-400 mt-1">{totals.pendingCount} pending</p>
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
                  <th className="p-3 text-left">Type</th>
                  <th className="p-3 text-left">Item/Order</th>
                  <th className="p-3 text-left">Customer</th>
                  <th className="p-3 text-right">Amount</th>
                  <th className="p-3 text-left">Status</th>
                  <th className="p-3 text-left">Payment</th>
                  <th className="p-3 text-left">Source</th>
                </tr>
              </thead>
              <tbody>
                {filteredSales.map((sale: any) => {
                  const isOrder = sale.source === 'orders_table';
                  const statusColor = 
                    sale.payment_status === 'paid' ? 'bg-green-100 text-green-800' :
                    sale.payment_status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800';
                  
                  return (
                    <tr key={`${sale.source}-${sale.id}`} className="border-t hover:bg-gray-50">
                      <td className="p-3">
                        {new Date(sale.created_at || sale.sale_date).toLocaleDateString()}
                      </td>
                      <td className="p-3">
                        {isOrder ? (
                          <span className="px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-800">
                            Online Order
                          </span>
                        ) : (
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            sale.item_type === 'dog' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                          }`}>
                            {sale.item_type}
                          </span>
                        )}
                      </td>
                      <td className="p-3 font-medium">
                        {isOrder ? (
                          <Link href={`/admin/orders/${sale.id}`} className="text-blue-600 hover:underline">
                            #{sale.order_reference || `Order-${sale.id}`}
                          </Link>
                        ) : (
                          sale.item_name || 'Sale'
                        )}
                        {isOrder && sale.notes && (
                          <span className="text-xs text-gray-500 block">({sale.notes})</span>
                        )}
                      </td>
                      <td className="p-3">
                        <div>
                          <p className="font-medium">{sale.customer_name}</p>
                          <p className="text-xs text-gray-500">{sale.customer_phone}</p>
                        </div>
                      </td>
                      <td className="p-3 text-right font-bold">
                        ₦{(sale.price || sale.total_amount || 0).toLocaleString()}
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${statusColor}`}>
                          {sale.payment_status}
                        </span>
                      </td>
                      <td className="p-3">{sale.payment_method || 'transfer'}</td>
                      <td className="p-3">
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          sale.source === 'orders_table' 
                            ? 'bg-purple-100 text-purple-700' 
                            : 'bg-gray-100 text-gray-700'
                        }`}>
                          {sale.source === 'orders_table' ? '🛒 Order' : '📝 Manual'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {filteredSales.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No sales or orders found</p>
              <div className="mt-4 flex gap-2 justify-center">
                <Link href="/admin/sales/new" className="bg-black text-white px-4 py-2 rounded-lg">
                  Record Manual Sale
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}