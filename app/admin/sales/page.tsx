"use client";
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

interface Sale {
  id: number;
  source: 'dog_reserve' | 'dog_sold' | 'shop_order' | 'manual_sale';
  item_type?: string;
  item_id?: number;
  item_name?: string;
  customer_name: string;
  customer_email?: string;
  customer_phone?: string;
  price: number;
  cost?: number;
  profit?: number;
  payment_method?: string;
  payment_status: string;
  sale_date: string;
  created_at: string;
  notes?: string;
  order_reference?: string;
}

export default function AdminSalesPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'week' | 'month' | 'year' | 'all'>('month');
  const [sourceFilter, setSourceFilter] = useState<string>('all');

  useEffect(() => {
    fetchAllSales();
  }, [period]);

  const fetchAllSales = async () => {
    setLoading(true);
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
      if (startDate) salesQuery = salesQuery.gte('created_at', startDate.toISOString());
      const { data: salesData } = await salesQuery.order('created_at', { ascending: false });

      // Fetch pending orders
      let ordersQuery = supabase.from('orders').select('*').eq('payment_status', 'pending');
      if (startDate) ordersQuery = ordersQuery.gte('created_at', startDate.toISOString());
      const { data: ordersData } = await ordersQuery.order('created_at', { ascending: false });

      // Transform orders into Sale-like structure
      const pendingOrders: Sale[] = (ordersData || []).map((o: any) => ({
        id: o.id,
        source: 'shop_order' as const,
        item_name: `Order #${o.order_reference || o.id}`,
        customer_name: o.customer_name,
        customer_email: o.customer_email,
        customer_phone: o.customer_phone,
        price: Number(o.total_amount || 0),
        payment_status: 'pending',
        sale_date: o.created_at,
        created_at: o.created_at,
        order_reference: o.order_reference,
      }));

      // Combine sales with profit calculation
      const combined = [
        ...(salesData || []).map(s => {
          const profit = s.profit ?? (s.cost ? Number(s.price) - Number(s.cost) : undefined);
          return { ...s, profit } as Sale;
        }),
        ...pendingOrders
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setSales(combined);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredSales = sourceFilter === 'all'
    ? sales
    : sales.filter(s => s.source === sourceFilter);

  const totals = filteredSales.reduce((acc, s) => {
    const amt = Number(s.price || 0);
    const profit = Number(s.profit || 0);
    const isPaid = s.payment_status === 'paid' || s.payment_status === 'completed';
    const isPending = s.payment_status === 'pending';

    if (s.source === 'dog_reserve' && isPaid) {
      acc.deposits += amt;
      acc.revenue += amt;
    } else if (s.source === 'dog_sold' && isPaid) {
      acc.dogSales += amt;
      acc.revenue += amt;
      acc.profit += profit;
    } else if (s.source === 'shop_order' || s.source === 'manual_sale') {
      if (isPaid) {
        acc.shopSales += amt;
        acc.revenue += amt;
        acc.profit += profit;
      } else if (isPending) {
        acc.pending += amt;
        acc.pendingCount += 1;
      }
    }
    acc.totalCount += 1;
    return acc;
  }, {
    revenue: 0,
    profit: 0,
    deposits: 0,
    dogSales: 0,
    shopSales: 0,
    pending: 0,
    pendingCount: 0,
    totalCount: 0
  });

  const getStatusStyle = (status: string) => {
    const s = status?.toLowerCase();
    if (s === 'paid' || s === 'completed') return 'bg-emerald-100 text-emerald-800';
    if (s === 'pending') return 'bg-amber-100 text-amber-800';
    if (s === 'partial') return 'bg-blue-100 text-blue-800';
    return 'bg-slate-100 text-slate-800';
  };

  const handleMarkPaid = async (sale: Sale) => {
    if (sale.source === 'shop_order' && sale.payment_status === 'pending') {
      try {
        const { data: order } = await supabase
          .from('orders')
          .select('*')
          .eq('id', sale.id)
          .single();

        if (!order) return;

        // Parse items if it's a string
        const items = typeof order.items === 'string' 
          ? JSON.parse(order.items) 
          : order.items || [];

        const { data: products } = await supabase.from('products').select('id, cost');
        let totalCost = 0;
        
        items.forEach((item: any) => {
          const prod = products?.find(p => p.id === item.product_id);
          const cost = prod?.cost || (item.price * 0.6);
          totalCost += cost * (item.quantity || 1);
        });

        await supabase.from('sales').insert([{
          source: 'shop_order',
          item_type: 'order',
          item_id: order.id,
          item_name: `Order #${order.order_reference}`,
          customer_name: order.customer_name,
          customer_email: order.customer_email,
          customer_phone: order.customer_phone,
          price: order.total_amount,
          cost: totalCost,
          profit: order.total_amount - totalCost,
          payment_status: 'paid',
          payment_method: order.payment_method || 'transfer',
          sale_date: new Date().toISOString().split('T')[0],
          created_at: new Date().toISOString(),
          notes: `${items.length} items`
        }]);

        await supabase.from('orders').update({ payment_status: 'paid' }).eq('id', order.id);

        alert('Order marked as paid and added to sales ledger.');
        fetchAllSales();
      } catch (err) {
        console.error(err);
        alert('Error marking as paid: ' + (err as Error).message);
      }
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <p className="font-black text-slate-400 animate-pulse tracking-widest">LOADING LEDGER...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-900">SALES LEDGER</h1>
            <p className="text-slate-500 font-medium">MBA‑grade profit & loss view</p>
          </div>
          <Link
            href="/admin/sales/new"
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3 rounded-xl flex items-center gap-2 shadow-lg transition-all transform hover:scale-105"
          >
            <span className="text-lg">➕</span> Record Manual Sale
          </Link>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-8">
          <div className="bg-white p-1 rounded-xl border border-slate-200 flex shadow-sm">
            {['all', 'dog_reserve', 'dog_sold', 'shop_order', 'manual_sale'].map(src => (
              <button
                key={src}
                onClick={() => setSourceFilter(src)}
                className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all ${
                  sourceFilter === src
                    ? 'bg-slate-900 text-white shadow-md'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {src.replace('_', ' ').toUpperCase()}
              </button>
            ))}
          </div>
          <div className="bg-white p-1 rounded-xl border border-slate-200 flex shadow-sm">
            {['week', 'month', 'year', 'all'].map(p => (
              <button
                key={p}
                onClick={() => setPeriod(p as any)}
                className={`px-4 py-2 rounded-lg text-xs font-black transition-all ${
                  period === p ? 'bg-slate-900 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                {p.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <p className="text-xs font-black text-slate-500 uppercase tracking-wide mb-1">Total Revenue</p>
            <p className="text-3xl font-black text-slate-900">₦{totals.revenue.toLocaleString()}</p>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <p className="text-xs font-black text-slate-500 uppercase tracking-wide mb-1">Gross Profit</p>
            <p className="text-3xl font-black text-emerald-600">₦{totals.profit.toLocaleString()}</p>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <p className="text-xs font-black text-slate-500 uppercase tracking-wide mb-1">Profit Margin</p>
            <p className="text-3xl font-black text-slate-900">
              {totals.revenue > 0 ? ((totals.profit / totals.revenue) * 100).toFixed(1) : 0}%
            </p>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <p className="text-xs font-black text-slate-500 uppercase tracking-wide mb-1">Pending Amount</p>
            <p className="text-3xl font-black text-amber-600">₦{totals.pending.toLocaleString()}</p>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <p className="text-xs font-black text-slate-500 uppercase tracking-wide mb-1">Pending Count</p>
            <p className="text-3xl font-black text-amber-600">{totals.pendingCount}</p>
          </div>
        </div>

        {/* Source breakdown */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8 text-xs font-black">
          <div className="bg-indigo-50 p-3 rounded-xl text-indigo-700 text-center">🐕 Deposits: ₦{totals.deposits.toLocaleString()}</div>
          <div className="bg-purple-50 p-3 rounded-xl text-purple-700 text-center">🐕 Final: ₦{totals.dogSales.toLocaleString()}</div>
          <div className="bg-emerald-50 p-3 rounded-xl text-emerald-700 text-center">🛒 Shop: ₦{totals.shopSales.toLocaleString()}</div>
        </div>

        {/* Ledger Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="p-4 text-xs font-black text-slate-500 uppercase tracking-tighter">Date</th>
                  <th className="p-4 text-xs font-black text-slate-500 uppercase tracking-tighter">Item / Source</th>
                  <th className="p-4 text-xs font-black text-slate-500 uppercase tracking-tighter">Customer</th>
                  <th className="p-4 text-xs font-black text-slate-500 uppercase tracking-tighter text-right">Amount</th>
                  <th className="p-4 text-xs font-black text-slate-500 uppercase tracking-tighter text-right">Profit</th>
                  <th className="p-4 text-xs font-black text-slate-500 uppercase tracking-tighter">Status</th>
                  <th className="p-4 text-xs font-black text-slate-500 uppercase tracking-tighter text-center">Actions</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSales.map((s) => (
                  <tr key={`${s.source}-${s.id}`} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 text-sm text-slate-700">
                      {new Date(s.sale_date || s.created_at).toLocaleDateString()}
                    </td>
                    <td className="p-4">
                      <div className="font-medium text-slate-900">
                        {s.item_name || s.source}
                      </div>
                      <div className="text-xs text-slate-500 capitalize">{s.source.replace('_', ' ')}</div>
                    </td>
                    <td className="p-4">
                      <div className="text-sm font-medium text-slate-800">{s.customer_name}</div>
                      {s.customer_phone && <div className="text-xs text-slate-500">{s.customer_phone}</div>}
                    </td>
                    <td className="p-4 text-right font-medium">
                      ₦{s.price.toLocaleString()}
                    </td>
                    <td className="p-4 text-right font-medium text-emerald-600">
                      {s.profit !== undefined && s.profit !== null ? `₦${s.profit.toLocaleString()}` : '-'}
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${getStatusStyle(s.payment_status)}`}>
                        {s.payment_status}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      {s.payment_status === 'pending' && s.source === 'shop_order' ? (
                        <button
                          onClick={() => handleMarkPaid(s)}
                          className="text-xs font-black bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full hover:bg-emerald-200 transition"
                        >
                          ✓ Mark Paid
                        </button>
                      ) : (
                        <span className="text-xs text-slate-400">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredSales.length === 0 && (
            <div className="p-16 text-center text-slate-400 font-bold tracking-widest">
              NO TRANSACTIONS FOUND
            </div>
          )}
        </div>
      </div>
    </div>
  );
}