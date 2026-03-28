// app/admin/sales/page.tsx
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
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSales, setSelectedSales] = useState<number[]>([]);
  
  // Edit modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingSale, setEditingSale] = useState<Sale | null>(null);
  const [editForm, setEditForm] = useState({
    customer_name: '',
    customer_phone: '',
    customer_email: '',
    price: '',
    cost: '',
    payment_method: '',
    payment_status: '',
    sale_date: '',
    notes: ''
  });
  
  // Delete modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingSale, setDeletingSale] = useState<Sale | null>(null);
  const [submitting, setSubmitting] = useState(false);

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

  // Update sale
  const updateSale = async () => {
    if (!editingSale) return;
    setSubmitting(true);
    
    try {
      const newProfit = Number(editForm.price) - Number(editForm.cost);
      
      const updateData = {
        customer_name: editForm.customer_name,
        customer_phone: editForm.customer_phone || null,
        customer_email: editForm.customer_email || null,
        price: Number(editForm.price),
        cost: Number(editForm.cost) || null,
        profit: newProfit,
        payment_method: editForm.payment_method,
        payment_status: editForm.payment_status,
        sale_date: editForm.sale_date,
        notes: editForm.notes || null
      };
      
      const { error } = await supabase
        .from('sales')
        .update(updateData)
        .eq('id', editingSale.id);
      
      if (error) throw error;
      
      alert('✅ Sale updated successfully!');
      setShowEditModal(false);
      setEditingSale(null);
      fetchAllSales();
      
    } catch (error: any) {
      console.error('Error updating sale:', error);
      alert('Error updating sale: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Delete sale
  const deleteSale = async () => {
    if (!deletingSale) return;
    
    if (!confirm(`⚠️ Are you sure you want to permanently delete this sale?\n\nItem: ${deletingSale.item_name}\nAmount: ₦${deletingSale.price.toLocaleString()}\nCustomer: ${deletingSale.customer_name}\n\nThis action cannot be undone!`)) return;
    
    setSubmitting(true);
    
    try {
      // Check if this sale is linked to a dog
      if (deletingSale.source === 'dog_reserve' || deletingSale.source === 'dog_sold') {
        // Find the dog and update its status back to available
        const { data: dog } = await supabase
          .from('dogs')
          .select('id, status')
          .eq('id', deletingSale.item_id)
          .single();
        
        if (dog && dog.status === 'reserved') {
          await supabase
            .from('dogs')
            .update({ status: 'available' })
            .eq('id', deletingSale.item_id);
        }
      }
      
      // Delete the sale
      const { error } = await supabase
        .from('sales')
        .delete()
        .eq('id', deletingSale.id);
      
      if (error) throw error;
      
      alert('✅ Sale deleted successfully!');
      setShowDeleteModal(false);
      setDeletingSale(null);
      fetchAllSales();
      
    } catch (error: any) {
      console.error('Error deleting sale:', error);
      alert('Error deleting sale: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Bulk delete sales
  const bulkDeleteSales = async () => {
    if (selectedSales.length === 0) return;
    
    if (!confirm(`⚠️ Are you sure you want to delete ${selectedSales.length} selected sale(s)? This action cannot be undone!`)) return;
    
    setSubmitting(true);
    
    try {
      for (const saleId of selectedSales) {
        const sale = sales.find(s => s.id === saleId);
        if (sale) {
          // Check if linked to dog
          if (sale.source === 'dog_reserve' || sale.source === 'dog_sold') {
            const { data: dog } = await supabase
              .from('dogs')
              .select('id, status')
              .eq('id', sale.item_id)
              .single();
            
            if (dog && dog.status === 'reserved') {
              await supabase
                .from('dogs')
                .update({ status: 'available' })
                .eq('id', sale.item_id);
            }
          }
          
          await supabase.from('sales').delete().eq('id', saleId);
        }
      }
      
      alert(`✅ ${selectedSales.length} sale(s) deleted successfully!`);
      setSelectedSales([]);
      fetchAllSales();
      
    } catch (error: any) {
      console.error('Error bulk deleting sales:', error);
      alert('Error bulk deleting sales: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Toggle select all
  const toggleSelectAll = () => {
    if (selectedSales.length === filteredSales.length) {
      setSelectedSales([]);
    } else {
      setSelectedSales(filteredSales.map(s => s.id));
    }
  };

  // Toggle select single
  const toggleSelectSale = (saleId: number) => {
    setSelectedSales(prev =>
      prev.includes(saleId)
        ? prev.filter(id => id !== saleId)
        : [...prev, saleId]
    );
  };

  // Open edit modal
  const openEditModal = (sale: Sale) => {
    setEditingSale(sale);
    setEditForm({
      customer_name: sale.customer_name,
      customer_phone: sale.customer_phone || '',
      customer_email: sale.customer_email || '',
      price: sale.price.toString(),
      cost: sale.cost?.toString() || '',
      payment_method: sale.payment_method || 'transfer',
      payment_status: sale.payment_status,
      sale_date: sale.sale_date,
      notes: sale.notes || ''
    });
    setShowEditModal(true);
  };

  // Open delete modal
  const openDeleteModal = (sale: Sale) => {
    setDeletingSale(sale);
    setShowDeleteModal(true);
  };

  // Export to CSV
  const exportSales = () => {
    const headers = ['Date', 'Item', 'Customer', 'Phone', 'Amount', 'Cost', 'Profit', 'Margin', 'Status', 'Source'];
    const rows = filteredSales.map(s => {
      const profit = s.profit || 0;
      const margin = s.price > 0 ? (profit / s.price) * 100 : 0;
      return [
        new Date(s.sale_date).toLocaleDateString(),
        s.item_name || s.source,
        s.customer_name,
        s.customer_phone || '',
        s.price,
        s.cost || 0,
        profit,
        margin.toFixed(1) + '%',
        s.payment_status,
        s.source
      ];
    });
    
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sales-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const filteredSales = sourceFilter === 'all'
    ? sales.filter(s => 
        s.item_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.customer_phone?.includes(searchTerm)
      )
    : sales.filter(s => 
        s.source === sourceFilter && (
          s.item_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          s.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          s.customer_phone?.includes(searchTerm)
        )
      );

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
      setSubmitting(true);
      try {
        const { data: order } = await supabase
          .from('orders')
          .select('*')
          .eq('id', sale.id)
          .single();

        if (!order) return;

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

        const profit = order.total_amount - totalCost;

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
          profit: profit,
          payment_status: 'paid',
          payment_method: order.payment_method || 'transfer',
          sale_date: new Date().toISOString().split('T')[0],
          created_at: new Date().toISOString(),
          notes: `${items.length} items`
        }]);

        await supabase.from('orders').update({ payment_status: 'paid' }).eq('id', order.id);

        alert(`✅ Order #${order.order_reference} marked as paid. Profit: ₦${profit.toLocaleString()}`);
        fetchAllSales();
      } catch (err) {
        console.error(err);
        alert('Error marking as paid: ' + (err as Error).message);
      } finally {
        setSubmitting(false);
      }
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="animate-pulse text-center">
        <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-500 font-semibold">Loading sales ledger...</p>
      </div>
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
          <div className="flex gap-3">
            <button
              onClick={exportSales}
              className="bg-gray-600 hover:bg-gray-700 text-white font-bold px-5 py-2.5 rounded-lg flex items-center gap-2 shadow-md transition-all"
            >
              <span>📥</span> Export CSV
            </button>
            <Link
              href="/admin/sales/new"
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3 rounded-xl flex items-center gap-2 shadow-lg transition-all transform hover:scale-105"
            >
              <span className="text-lg">➕</span> Record Manual Sale
            </Link>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <input
              type="text"
              placeholder="Search by item, customer, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              className="p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="all">All Sources</option>
              <option value="dog_reserve">Dog Deposits</option>
              <option value="dog_sold">Dog Sales</option>
              <option value="shop_order">Shop Orders</option>
              <option value="manual_sale">Manual Sales</option>
            </select>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value as any)}
              className="p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="week">Last 7 Days</option>
              <option value="month">Last 30 Days</option>
              <option value="year">Last 12 Months</option>
              <option value="all">All Time</option>
            </select>
            <div className="flex gap-2">
              {selectedSales.length > 0 && (
                <button
                  onClick={bulkDeleteSales}
                  disabled={submitting}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-red-700 disabled:opacity-50 w-full"
                >
                  Delete {selectedSales.length} Selected
                </button>
              )}
            </div>
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
                  <th className="p-4 w-10">
                    <input
                      type="checkbox"
                      checked={selectedSales.length === filteredSales.length && filteredSales.length > 0}
                      onChange={toggleSelectAll}
                      className="w-4 h-4"
                    />
                  </th>
                  <th className="p-4 text-xs font-black text-slate-500 uppercase tracking-tighter">Date</th>
                  <th className="p-4 text-xs font-black text-slate-500 uppercase tracking-tighter">Item / Source</th>
                  <th className="p-4 text-xs font-black text-slate-500 uppercase tracking-tighter">Customer</th>
                  <th className="p-4 text-xs font-black text-slate-500 uppercase tracking-tighter text-right">Amount</th>
                  <th className="p-4 text-xs font-black text-slate-500 uppercase tracking-tighter text-right">Profit</th>
                  <th className="p-4 text-xs font-black text-slate-500 uppercase tracking-tighter text-right">Margin</th>
                  <th className="p-4 text-xs font-black text-slate-500 uppercase tracking-tighter">Status</th>
                  <th className="p-4 text-xs font-black text-slate-500 uppercase tracking-tighter text-center">Actions</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSales.map((s) => {
                  const profit = s.profit || 0;
                  const margin = s.price > 0 ? (profit / s.price) * 100 : 0;
                  return (
                    <tr key={`${s.source}-${s.id}`} className="hover:bg-slate-50 transition-colors">
                      <td className="p-4">
                        <input
                          type="checkbox"
                          checked={selectedSales.includes(s.id)}
                          onChange={() => toggleSelectSale(s.id)}
                          className="w-4 h-4"
                        />
                      </td>
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
                        {profit !== undefined && profit !== null ? `₦${profit.toLocaleString()}` : '-'}
                      </td>
                      <td className="p-4 text-right font-medium text-emerald-600">
                        {margin > 0 ? `${margin.toFixed(1)}%` : '-'}
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${getStatusStyle(s.payment_status)}`}>
                          {s.payment_status}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex justify-center gap-2">
                          {s.payment_status === 'pending' && s.source === 'shop_order' ? (
                            <button
                              onClick={() => handleMarkPaid(s)}
                              disabled={submitting}
                              className="text-xs font-black bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full hover:bg-emerald-200 transition"
                            >
                              ✓ Mark Paid
                            </button>
                          ) : (
                            <>
                              <button
                                onClick={() => openEditModal(s)}
                                className="text-blue-600 hover:text-blue-800 text-xs font-black px-2 py-1 rounded hover:bg-blue-50 transition"
                                title="Edit Sale"
                              >
                                ✏️
                              </button>
                              <button
                                onClick={() => openDeleteModal(s)}
                                className="text-red-600 hover:text-red-800 text-xs font-black px-2 py-1 rounded hover:bg-red-50 transition"
                                title="Delete Sale"
                              >
                                🗑️
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
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

      {/* Edit Modal */}
      {showEditModal && editingSale && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-2">Edit Sale</h2>
              <p className="text-gray-600 mb-4">Update sale details</p>
              
              <div className="space-y-4">
                <div>
                  <label className="block font-medium mb-1">Item</label>
                  <input
                    type="text"
                    value={editingSale.item_name || editingSale.source}
                    disabled
                    className="w-full p-2 border rounded bg-gray-50"
                  />
                </div>
                
                <div>
                  <label className="block font-medium mb-1">Customer Name *</label>
                  <input
                    type="text"
                    required
                    value={editForm.customer_name}
                    onChange={(e) => setEditForm({...editForm, customer_name: e.target.value})}
                    className="w-full p-2 border rounded"
                  />
                </div>
                
                <div>
                  <label className="block font-medium mb-1">Phone Number</label>
                  <input
                    type="tel"
                    value={editForm.customer_phone}
                    onChange={(e) => setEditForm({...editForm, customer_phone: e.target.value})}
                    className="w-full p-2 border rounded"
                  />
                </div>
                
                <div>
                  <label className="block font-medium mb-1">Email</label>
                  <input
                    type="email"
                    value={editForm.customer_email}
                    onChange={(e) => setEditForm({...editForm, customer_email: e.target.value})}
                    className="w-full p-2 border rounded"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-medium mb-1">Amount (₦) *</label>
                    <input
                      type="number"
                      required
                      value={editForm.price}
                      onChange={(e) => setEditForm({...editForm, price: e.target.value})}
                      className="w-full p-2 border rounded"
                    />
                  </div>
                  <div>
                    <label className="block font-medium mb-1">Cost (₦)</label>
                    <input
                      type="number"
                      value={editForm.cost}
                      onChange={(e) => setEditForm({...editForm, cost: e.target.value})}
                      className="w-full p-2 border rounded"
                      placeholder="Your cost"
                    />
                  </div>
                </div>
                
                {Number(editForm.price) > 0 && Number(editForm.cost) > 0 && (
                  <div className="bg-emerald-50 p-3 rounded-lg">
                    <p className="text-sm font-medium">Profit Preview:</p>
                    <p className="text-lg font-bold text-emerald-600">
                      ₦{(Number(editForm.price) - Number(editForm.cost)).toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-500">
                      Margin: {((Number(editForm.price) - Number(editForm.cost)) / Number(editForm.price) * 100).toFixed(1)}%
                    </p>
                  </div>
                )}
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-medium mb-1">Payment Method</label>
                    <select
                      value={editForm.payment_method}
                      onChange={(e) => setEditForm({...editForm, payment_method: e.target.value})}
                      className="w-full p-2 border rounded"
                    >
                      <option value="cash">Cash</option>
                      <option value="transfer">Bank Transfer</option>
                      <option value="pos">POS</option>
                      <option value="online">Online Payment</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-medium mb-1">Payment Status</label>
                    <select
                      value={editForm.payment_status}
                      onChange={(e) => setEditForm({...editForm, payment_status: e.target.value})}
                      className="w-full p-2 border rounded"
                    >
                      <option value="paid">Paid</option>
                      <option value="partial">Partial</option>
                      <option value="pending">Pending</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="block font-medium mb-1">Sale Date</label>
                  <input
                    type="date"
                    value={editForm.sale_date}
                    onChange={(e) => setEditForm({...editForm, sale_date: e.target.value})}
                    className="w-full p-2 border rounded"
                  />
                </div>
                
                <div>
                  <label className="block font-medium mb-1">Notes</label>
                  <textarea
                    rows={3}
                    value={editForm.notes}
                    onChange={(e) => setEditForm({...editForm, notes: e.target.value})}
                    className="w-full p-2 border rounded"
                  />
                </div>
              </div>
              
              <div className="flex gap-3 mt-6">
                <button
                  onClick={updateSale}
                  disabled={submitting}
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-bold hover:bg-blue-700 disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && deletingSale && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full">
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-2 text-red-600">Delete Sale</h2>
              <p className="text-gray-600 mb-4">Are you sure you want to delete this sale?</p>
              
              <div className="bg-gray-50 p-4 rounded-lg mb-4 space-y-2">
                <p><strong>Item:</strong> {deletingSale.item_name || deletingSale.source}</p>
                <p><strong>Customer:</strong> {deletingSale.customer_name}</p>
                <p><strong>Amount:</strong> ₦{deletingSale.price.toLocaleString()}</p>
                <p><strong>Profit:</strong> {deletingSale.profit ? `₦${deletingSale.profit.toLocaleString()}` : '-'}</p>
                <p><strong>Date:</strong> {new Date(deletingSale.sale_date).toLocaleDateString()}</p>
              </div>
              
              <div className="bg-red-50 p-3 rounded-lg mb-4">
                <p className="text-sm text-red-800">
                  ⚠️ This action cannot be undone. The sale will be permanently removed.
                  {deletingSale.source === 'dog_reserve' && ' The dog will be set back to available.'}
                </p>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={deleteSale}
                  disabled={submitting}
                  className="flex-1 bg-red-600 text-white py-2 rounded-lg font-bold hover:bg-red-700 disabled:opacity-50"
                >
                  {submitting ? 'Deleting...' : 'Yes, Delete Sale'}
                </button>
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}