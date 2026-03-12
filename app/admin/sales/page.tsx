"use client";
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

// --- INTERFACES ---
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
  source: 'sales_table' | 'orders_table';
  order_reference?: string;
}

export default function AdminSalesPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('month');
  const [viewMode, setViewMode] = useState('combined'); 

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
      // 1. Fetch Products for Cost Lookups (To calculate accurate profit on online orders)
      const { data: products } = await supabase.from('products').select('id, cost');

      // 2. Fetch Manual Sales
      let salesQuery = supabase.from('sales').select('*');
      if (startDate && period !== 'all') {
        salesQuery = salesQuery.gte('created_at', startDate.toISOString());
      }
      const { data: salesData } = await salesQuery.order('created_at', { ascending: false });

      // 3. Fetch Online Orders
      let ordersQuery = supabase.from('orders').select('*');
      if (startDate && period !== 'all') {
        ordersQuery = ordersQuery.gte('created_at', startDate.toISOString());
      }
      const { data: ordersData } = await ordersQuery.order('created_at', { ascending: false });

      // 4. Transform Orders into Sale format with profit calculation
      const transformedOrders: Sale[] = (ordersData || []).map((order: any) => {
        const orderTotal = Number(order.total_amount || 0);
        
        // Accurate cost calculation for the order
        const totalOrderCost = (order.items || []).reduce((sum: number, item: any) => {
          const product = products?.find(p => p.id === item.product_id);
          const unitCost = product?.cost || (Number(item.price || 0) * 0.6); // 40% margin fallback
          return sum + (unitCost * (Number(item.quantity) || 1));
        }, 0);

        return {
          id: order.id,
          item_type: 'order',
          item_id: order.id,
          item_name: `Order #${order.order_reference}`,
          order_reference: order.order_reference,
          customer_name: order.customer_name,
          customer_email: order.customer_email,
          customer_phone: order.customer_phone,
          quantity: order.items?.length || 1,
          price: orderTotal,
          cost: totalOrderCost,
          profit: orderTotal - totalOrderCost,
          payment_method: order.payment_method,
          payment_status: order.payment_status?.toLowerCase(),
          sale_date: order.created_at,
          created_at: order.created_at,
          notes: `${order.items?.length || 0} items from PawShop`,
          source: 'orders_table'
        };
      });

      // 5. Combine and Sort
      const combined = [
        ...(salesData || []).map(s => ({ 
          ...s, 
          source: 'sales_table' as const,
          payment_status: s.payment_status?.toLowerCase() 
        })),
        ...transformedOrders
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setSales(combined);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredSales = sales.filter(s => {
    if (viewMode === 'combined') return true;
    if (viewMode === 'sales') return s.source === 'sales_table';
    if (viewMode === 'orders') return s.source === 'orders_table';
    return true;
  });

  const totals = filteredSales.reduce((acc, sale) => {
    const isPaid = sale.payment_status === 'paid' || sale.payment_status === 'completed';
    
    // Revenue Logic: If not fully paid, only count the deposit
    const realizedRev = (sale.source === 'sales_table' && !isPaid) 
      ? Number(sale.deposit_amount || 0) 
      : Number(sale.price || 0);

    return {
      revenue: acc.revenue + realizedRev,
      profit: acc.profit + Number(sale.profit || 0),
      count: acc.count + 1,
      pendingCount: acc.pendingCount + (isPaid ? 0 : 1)
    };
  }, { revenue: 0, profit: 0, count: 0, pendingCount: 0 });

  const getStatusStyle = (status: string) => {
    const s = status?.toLowerCase();
    if (s === 'paid' || s === 'completed') return 'bg-emerald-100 text-emerald-800';
    if (s === 'pending') return 'bg-amber-100 text-amber-800';
    if (s === 'reserved' || s === 'partial') return 'bg-blue-100 text-blue-800';
    return 'bg-slate-100 text-slate-800';
  };

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <p className="font-black text-slate-400 animate-pulse tracking-widest">SYNCING TRANSACTIONS...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-900">SALES & ORDERS</h1>
            <p className="text-slate-500 font-medium">Unified ledger for Kennel and PawShop</p>
          </div>
          <Link href="/admin/sales/new" className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-200">
            + Record Manual Sale
          </Link>
        </div>

        {/* FILTERS */}
        <div className="flex flex-wrap gap-4 mb-8">
          <div className="bg-white p-1 rounded-xl border border-slate-200 flex shadow-sm">
            {['combined', 'sales', 'orders'].map(m => (
              <button key={m} onClick={() => setViewMode(m)} className={`px-4 py-2 rounded-lg text-xs font-black transition-all ${viewMode === m ? 'bg-slate-900 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}>
                {m.toUpperCase()}
              </button>
            ))}
          </div>
          <div className="bg-white p-1 rounded-xl border border-slate-200 flex shadow-sm">
            {['week', 'month', 'year', 'all'].map(p => (
              <button key={p} onClick={() => setPeriod(p)} className={`px-4 py-2 rounded-lg text-xs font-black transition-all ${period === p ? 'bg-slate-900 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}>
                {p.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* SUMMARY CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Realized Revenue</p>
            <p className="text-2xl font-black text-slate-900">₦{totals.revenue.toLocaleString()}</p>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Gross Profit</p>
            <p className="text-2xl font-black text-emerald-600">₦{totals.profit.toLocaleString()}</p>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Profit Margin</p>
            <p className="text-2xl font-black text-slate-900">{totals.revenue > 0 ? ((totals.profit / totals.revenue) * 100).toFixed(1) : 0}%</p>
          </div>
          <div className="bg-amber-50 p-6 rounded-2xl border border-amber-100 shadow-sm">
            <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-1">Unpaid / Partial</p>
            <p className="text-2xl font-black text-amber-900">{totals.pendingCount}</p>
          </div>
        </div>

        {/* LEDGER TABLE */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-tighter">Date</th>
                  <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-tighter">Item / Order</th>
                  <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-tighter">Customer</th>
                  <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-tighter text-right">Amount</th>
                  <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-tighter">Status</th>
                  <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-tighter text-center">Source</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredSales.map((sale) => (
                  <tr key={`${sale.source}-${sale.id}`} className="hover:bg-slate-50 transition-colors group">
                    <td className="p-4">
                      <p className="text-sm font-bold text-slate-700">{new Date(sale.created_at).toLocaleDateString()}</p>
                      <p className="text-[10px] text-slate-400 font-medium italic">{new Date(sale.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    </td>
                    <td className="p-4">
                      {sale.source === 'orders_table' ? (
                        <Link href={`/admin/orders/${sale.id}`} className="text-sm font-black text-indigo-600 hover:underline">
                          #{sale.order_reference}
                        </Link>
                      ) : (
                        <p className="text-sm font-black text-slate-800">{sale.item_name}</p>
                      )}
                      <p className="text-[10px] text-slate-500 font-bold uppercase">{sale.item_type}</p>
                    </td>
                    <td className="p-4">
                      <p className="text-sm font-bold text-slate-700">{sale.customer_name}</p>
                      <p className="text-[10px] text-slate-400 font-medium">{sale.customer_phone || 'N/A'}</p>
                    </td>
                    <td className="p-4 text-right">
                      <p className="text-sm font-black text-slate-900">₦{sale.price.toLocaleString()}</p>
                      {sale.deposit_amount && sale.payment_status !== 'paid' && (
                        <p className="text-[10px] text-emerald-600 font-bold">Paid: ₦{sale.deposit_amount.toLocaleString()}</p>
                      )}
                    </td>
                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${getStatusStyle(sale.payment_status)}`}>
                        {sale.payment_status}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <span className={`text-[10px] font-black px-2 py-1 rounded-md ${sale.source === 'orders_table' ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-100 text-slate-500'}`}>
                        {sale.source === 'orders_table' ? '🛒 SHOP' : '📝 KENNEL'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredSales.length === 0 && (
            <div className="p-20 text-center">
              <p className="text-slate-400 font-bold tracking-widest">ZERO TRANSACTIONS FOUND</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}