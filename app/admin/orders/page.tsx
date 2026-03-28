"use client";
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

interface Order {
  id: number;
  order_reference: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  delivery_address: string;
  delivery_method: 'pickup' | 'delivery';
  payment_method: string;
  payment_status: 'pending' | 'paid' | 'failed' | 'cancelled';
  total_amount: number;
  items: any[];
  notes: string;
  created_at: string;
  updated_at?: string;
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrders, setSelectedOrders] = useState<number[]>([]);
  
  // Edit form state
  const [editForm, setEditForm] = useState({
    customer_name: '',
    customer_phone: '',
    customer_email: '',
    delivery_address: '',
    delivery_method: 'pickup' as 'pickup' | 'delivery',
    notes: ''
  });

  useEffect(() => {
    fetchOrders();
  }, [statusFilter]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (statusFilter !== 'all') {
        query = query.eq('payment_status', statusFilter);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      setOrders((data as Order[]) || []);
    } catch (error: any) {
      console.error('Error fetching orders:', error);
      alert('Error loading orders: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Mark order as paid - insert into sales table
  const markAsPaid = async (orderId: number) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    setSubmitting(true);
    
    try {
      const { error: updateError } = await supabase
        .from('orders')
        .update({ 
          payment_status: 'paid',
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);

      if (updateError) throw updateError;

      // Record sale in sales table
      const today = new Date().toISOString().split('T')[0];
      const items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
      
      // Calculate cost and profit
      const { data: products } = await supabase
        .from('products')
        .select('id, cost');
      
      let totalCost = 0;
      items.forEach((item: any) => {
        const prod = products?.find(p => p.id === item.product_id);
        const cost = prod?.cost || (item.price * 0.6);
        totalCost += cost * (item.quantity || 1);
      });

      // Insert into sales
      const { error: saleError } = await supabase.from('sales').insert([{
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
        payment_method: order.payment_method,
        sale_date: today,
        notes: `${items.length} items - Order from pawshop`
      }]);

      if (saleError) throw saleError;

      // Update product stock
      for (const item of items) {
        const { data: product } = await supabase
          .from('products')
          .select('stock')
          .eq('id', item.product_id)
          .single();
        
        const newStock = (product?.stock || 0) - item.quantity;
        await supabase
          .from('products')
          .update({ 
            stock: newStock,
            in_stock: newStock > 0
          })
          .eq('id', item.product_id);
      }

      alert(`✅ Order #${order.order_reference} marked as PAID. Sale recorded.`);
      await fetchOrders();
      
    } catch (error: any) {
      console.error('Error marking order as paid:', error);
      alert('Error marking order as paid: ' + error.message);
    } finally {
      setSubmitting(false);
      setShowDetailsModal(false);
    }
  };

  // Cancel order - restore stock
  const cancelOrder = async (orderId: number) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    setSubmitting(true);
    
    try {
      const { error: updateError } = await supabase
        .from('orders')
        .update({ 
          payment_status: 'cancelled',
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);

      if (updateError) throw updateError;

      // Restore product stock if order was pending
      if (order.payment_status === 'pending') {
        const items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
        
        for (const item of items) {
          const { data: product } = await supabase
            .from('products')
            .select('stock')
            .eq('id', item.product_id)
            .single();
          
          const newStock = (product?.stock || 0) + item.quantity;
          await supabase
            .from('products')
            .update({ stock: newStock })
            .eq('id', item.product_id);
        }
      }

      // If it was paid, mark as refunded in sales
      if (order.payment_status === 'paid') {
        await supabase
          .from('sales')
          .update({ 
            notes: `CANCELLED - Order #${order.order_reference} - Refund issued`,
            payment_status: 'refunded'
          })
          .eq('source', 'shop_order')
          .eq('item_id', order.id);
      }

      alert(`✅ Order #${order.order_reference} cancelled. Stock restored.`);
      await fetchOrders();
      
    } catch (error: any) {
      console.error('Error cancelling order:', error);
      alert('Error cancelling order: ' + error.message);
    } finally {
      setSubmitting(false);
      setShowCancelModal(false);
      setSelectedOrder(null);
    }
  };

  // Edit order details
  const updateOrder = async () => {
    if (!selectedOrder) return;
    setSubmitting(true);
    
    try {
      const { error } = await supabase
        .from('orders')
        .update({
          customer_name: editForm.customer_name,
          customer_phone: editForm.customer_phone,
          customer_email: editForm.customer_email,
          delivery_address: editForm.delivery_address,
          delivery_method: editForm.delivery_method,
          notes: editForm.notes,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedOrder.id);

      if (error) throw error;
      
      alert(`✅ Order #${selectedOrder.order_reference} updated successfully`);
      setShowEditModal(false);
      await fetchOrders();
      
    } catch (error: any) {
      console.error('Error updating order:', error);
      alert('Error updating order: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Delete order (only for pending/cancelled)
  const deleteOrder = async () => {
    if (!selectedOrder) return;
    
    if (selectedOrder.payment_status === 'paid') {
      alert('Cannot delete a paid order. Please cancel it first.');
      return;
    }
    
    if (!confirm(`⚠️ Are you sure you want to permanently delete order #${selectedOrder.order_reference}? This cannot be undone.`)) return;
    
    setSubmitting(true);
    
    try {
      // Restore stock if pending
      if (selectedOrder.payment_status === 'pending') {
        const items = typeof selectedOrder.items === 'string' 
          ? JSON.parse(selectedOrder.items) 
          : selectedOrder.items;
        
        for (const item of items) {
          const { data: product } = await supabase
            .from('products')
            .select('stock')
            .eq('id', item.product_id)
            .single();
          
          const newStock = (product?.stock || 0) + item.quantity;
          await supabase
            .from('products')
            .update({ stock: newStock })
            .eq('id', item.product_id);
        }
      }
      
      const { error } = await supabase
        .from('orders')
        .delete()
        .eq('id', selectedOrder.id);
      
      if (error) throw error;
      
      alert(`✅ Order #${selectedOrder.order_reference} deleted successfully`);
      setShowDeleteModal(false);
      await fetchOrders();
      
    } catch (error: any) {
      console.error('Error deleting order:', error);
      alert('Error deleting order: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Bulk actions
  const handleBulkAction = async (action: string) => {
    if (selectedOrders.length === 0) {
      alert('Please select at least one order');
      return;
    }
    
    if (!confirm(`Are you sure you want to ${action} ${selectedOrders.length} order(s)?`)) return;
    
    setSubmitting(true);
    
    try {
      for (const orderId of selectedOrders) {
        const order = orders.find(o => o.id === orderId);
        if (order) {
          if (action === 'mark-paid') {
            await markAsPaid(orderId);
          } else if (action === 'cancel') {
            await cancelOrder(orderId);
          } else if (action === 'delete') {
            if (order.payment_status !== 'paid') {
              // Delete pending/cancelled orders
              await supabase.from('orders').delete().eq('id', orderId);
            }
          }
        }
      }
      
      alert(`✅ Bulk action completed`);
      setSelectedOrders([]);
      await fetchOrders();
      
    } catch (error: any) {
      console.error('Bulk action error:', error);
      alert('Error performing bulk action: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Export orders to CSV
  const exportOrders = () => {
    const headers = ['Reference', 'Customer', 'Phone', 'Amount', 'Status', 'Date', 'Items Count'];
    const rows = filteredOrders.map(order => [
      order.order_reference,
      order.customer_name,
      order.customer_phone,
      order.total_amount,
      order.payment_status,
      new Date(order.created_at).toLocaleDateString(),
      (typeof order.items === 'string' ? JSON.parse(order.items) : order.items).length
    ]);
    
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `orders-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const openEditModal = (order: Order) => {
    setSelectedOrder(order);
    setEditForm({
      customer_name: order.customer_name,
      customer_phone: order.customer_phone,
      customer_email: order.customer_email,
      delivery_address: order.delivery_address,
      delivery_method: order.delivery_method,
      notes: order.notes || ''
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (order: Order) => {
    if (order.payment_status === 'paid') {
      alert('Cannot delete a paid order. Please cancel it first.');
      return;
    }
    setSelectedOrder(order);
    setShowDeleteModal(true);
  };

  const openCancelModal = (order: Order) => {
    setSelectedOrder(order);
    setShowCancelModal(true);
  };

  const toggleSelectOrder = (orderId: number) => {
    setSelectedOrders(prev =>
      prev.includes(orderId)
        ? prev.filter(id => id !== orderId)
        : [...prev, orderId]
    );
  };

  const filteredOrders = orders.filter(order =>
    order.order_reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.customer_phone.includes(searchTerm)
  );

  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.payment_status === 'pending').length,
    paid: orders.filter(o => o.payment_status === 'paid').length,
    cancelled: orders.filter(o => o.payment_status === 'cancelled').length,
    totalRevenue: orders.filter(o => o.payment_status === 'paid').reduce((sum, o) => sum + o.total_amount, 0)
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'paid':
        return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'pending':
        return 'bg-amber-50 text-amber-700 border-amber-100';
      case 'cancelled':
        return 'bg-red-50 text-red-700 border-red-100';
      case 'failed':
        return 'bg-gray-50 text-gray-700 border-gray-100';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-100';
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="animate-pulse text-center">
        <div className="w-16 h-16 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="mt-4 text-gray-500">Loading orders...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-10">
      <div className="max-w-7xl mx-auto">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">ORDERS</h1>
            <p className="text-slate-500 font-medium">Manage e-commerce sales & logistics</p>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={exportOrders}
              className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-black uppercase tracking-wider hover:bg-slate-50 transition"
            >
              📥 Export CSV
            </button>
          </div>
        </div>

        {/* STATS CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <p className="text-xs font-black text-slate-400 uppercase">Total Orders</p>
            <p className="text-2xl font-black">{stats.total}</p>
          </div>
          <div className="bg-amber-50 p-4 rounded-xl border border-amber-100">
            <p className="text-xs font-black text-amber-600 uppercase">Pending</p>
            <p className="text-2xl font-black text-amber-700">{stats.pending}</p>
          </div>
          <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100">
            <p className="text-xs font-black text-emerald-600 uppercase">Paid</p>
            <p className="text-2xl font-black text-emerald-700">{stats.paid}</p>
          </div>
          <div className="bg-red-50 p-4 rounded-xl border border-red-100">
            <p className="text-xs font-black text-red-600 uppercase">Cancelled</p>
            <p className="text-2xl font-black text-red-700">{stats.cancelled}</p>
          </div>
          <div className="bg-purple-50 p-4 rounded-xl border border-purple-100">
            <p className="text-xs font-black text-purple-600 uppercase">Revenue</p>
            <p className="text-2xl font-black text-purple-700">₦{stats.totalRevenue.toLocaleString()}</p>
          </div>
        </div>

        {/* BULK ACTIONS & SEARCH */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-6">
          <div className="flex flex-wrap gap-3 items-center justify-between">
            <div className="flex gap-2">
              {selectedOrders.length > 0 && (
                <>
                  <span className="text-sm font-bold bg-slate-100 px-3 py-1 rounded-full">
                    {selectedOrders.length} selected
                  </span>
                  <button
                    onClick={() => handleBulkAction('mark-paid')}
                    className="px-3 py-1 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700"
                  >
                    Mark Paid
                  </button>
                  <button
                    onClick={() => handleBulkAction('cancel')}
                    className="px-3 py-1 bg-amber-600 text-white rounded-lg text-xs font-bold hover:bg-amber-700"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleBulkAction('delete')}
                    className="px-3 py-1 bg-red-600 text-white rounded-lg text-xs font-bold hover:bg-red-700"
                  >
                    Delete
                  </button>
                </>
              )}
            </div>
            
            <input
              type="text"
              placeholder="Search by reference, name, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-4 py-2 border rounded-xl text-sm w-full md:w-64"
            />
          </div>
        </div>

        {/* STATUS FILTER */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {['all', 'pending', 'paid', 'cancelled', 'failed'].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase transition-all ${
                statusFilter === s 
                  ? 'bg-slate-900 text-white' 
                  : 'bg-white text-slate-400 hover:text-slate-600 border border-slate-200'
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        {/* ORDERS TABLE */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px] text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="p-5 w-10">
                    <input
                      type="checkbox"
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedOrders(filteredOrders.map(o => o.id));
                        } else {
                          setSelectedOrders([]);
                        }
                      }}
                      className="w-4 h-4"
                    />
                  </th>
                  <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Order Ref</th>
                  <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Customer</th>
                  <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Amount</th>
                  <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                  <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Actions</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-5">
                      <input
                        type="checkbox"
                        checked={selectedOrders.includes(order.id)}
                        onChange={() => toggleSelectOrder(order.id)}
                        className="w-4 h-4"
                      />
                    </td>
                    <td className="p-5">
                      <span className="font-mono text-xs font-bold text-slate-400">#{order.order_reference}</span>
                      <p className="text-[10px] text-slate-400 font-bold mt-1">
                        {new Date(order.created_at).toLocaleDateString()}
                      </p>
                    </td>
                    <td className="p-5">
                      <p className="text-sm font-black text-slate-800 uppercase tracking-tight">{order.customer_name}</p>
                      <p className="text-xs font-medium text-slate-500">{order.customer_phone}</p>
                    </td>
                    <td className="p-5 text-right font-black text-slate-900">
                      ₦{order.total_amount.toLocaleString()}
                    </td>
                    <td className="p-5">
                      <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase border ${getStatusBadge(order.payment_status)}`}>
                        {order.payment_status}
                      </span>
                    </td>
                    <td className="p-5">
                      <div className="flex justify-center gap-2">
                        <button 
                          onClick={() => { setSelectedOrder(order); setShowDetailsModal(true); }}
                          className="p-2 hover:bg-slate-100 rounded-lg transition-all text-slate-600"
                          title="View Details"
                        >
                          👁️
                        </button>
                        
                        <button 
                          onClick={() => openEditModal(order)}
                          className="p-2 hover:bg-blue-100 rounded-lg transition-all text-blue-600"
                          title="Edit Order"
                        >
                          ✏️
                        </button>
                        
                        {order.payment_status === 'pending' && (
                          <>
                            <button
                              onClick={() => markAsPaid(order.id)}
                              disabled={submitting}
                              className="p-2 bg-emerald-100 text-emerald-700 rounded-lg text-xs font-bold hover:bg-emerald-200"
                              title="Mark Paid"
                            >
                              💰
                            </button>
                            <button
                              onClick={() => openCancelModal(order)}
                              className="p-2 bg-amber-100 text-amber-700 rounded-lg text-xs font-bold hover:bg-amber-200"
                              title="Cancel Order"
                            >
                              ❌
                            </button>
                          </>
                        )}
                        
                        <button
                          onClick={() => openDeleteModal(order)}
                          className="p-2 hover:bg-red-100 rounded-lg transition-all text-red-600"
                          title="Delete Order"
                        >
                          🗑️
                        </button>
                        
                        <a 
                          href={`https://wa.me/${order.customer_phone.replace(/\D/g, '')}`} 
                          target="_blank"
                          className="p-2 bg-emerald-100 text-emerald-700 rounded-lg"
                          title="WhatsApp Customer"
                        >
                          💬
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {filteredOrders.length === 0 && (
            <div className="p-12 text-center">
              <p className="text-slate-400 font-black tracking-widest">NO ORDERS FOUND</p>
            </div>
          )}
        </div>
      </div>

      {/* DETAILS MODAL */}
      {showDetailsModal && selectedOrder && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-[40px] max-w-2xl w-full p-8 shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-black tracking-tighter">ORDER DETAILS</h2>
              <button onClick={() => setShowDetailsModal(false)} className="text-slate-300 hover:text-slate-900 font-black text-2xl">✕</button>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-4 rounded-2xl">
                  <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Reference</p>
                  <p className="text-sm font-black text-slate-800 font-mono">#{selectedOrder.order_reference}</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl">
                  <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Date</p>
                  <p className="text-sm font-black text-slate-800">{new Date(selectedOrder.created_at).toLocaleString()}</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl">
                  <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Delivery</p>
                  <p className="text-sm font-black text-slate-800 uppercase">{selectedOrder.delivery_method}</p>
                  <p className="text-xs text-slate-500 mt-1">{selectedOrder.delivery_address}</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl">
                  <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Payment</p>
                  <p className="text-sm font-black text-slate-800">{selectedOrder.payment_method}</p>
                  <p className={`text-xs font-bold mt-1 ${
                    selectedOrder.payment_status === 'paid' ? 'text-emerald-600' : 
                    selectedOrder.payment_status === 'cancelled' ? 'text-red-600' : 'text-amber-600'
                  }`}>{selectedOrder.payment_status.toUpperCase()}</p>
                </div>
              </div>

              <div className="border border-slate-100 rounded-2xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-400">
                    <tr>
                      <th className="p-4 text-left">Item</th>
                      <th className="p-4 text-center">Qty</th>
                      <th className="p-4 text-right">Price</th>
                      <th className="p-4 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {(typeof selectedOrder.items === 'string' ? JSON.parse(selectedOrder.items) : selectedOrder.items).map((item: any, idx: number) => (
                      <tr key={idx}>
                        <td className="p-4 font-bold text-slate-700">
                          {item.product_name}
                          {item.variation?.size && (
                            <span className="text-xs text-slate-400 block">Size: {item.variation.size}</span>
                          )}
                        </td>
                        <td className="p-4 text-center font-bold">{item.quantity}</td>
                        <td className="p-4 text-right font-bold">₦{item.price.toLocaleString()}</td>
                        <td className="p-4 text-right font-black">₦{(item.price * item.quantity).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {selectedOrder.notes && (
                <div className="bg-slate-50 p-4 rounded-2xl">
                  <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Notes</p>
                  <p className="text-sm text-slate-700">{selectedOrder.notes}</p>
                </div>
              )}

              <div className="flex justify-between items-center bg-slate-900 p-6 rounded-3xl text-white">
                <span className="font-black tracking-widest uppercase text-xs opacity-60">Total Bill</span>
                <span className="text-3xl font-black">₦{selectedOrder.total_amount.toLocaleString()}</span>
              </div>

              <div className="flex gap-3">
                <button onClick={() => setShowDetailsModal(false)} className="flex-1 py-4 font-black text-xs uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-all">Close</button>
                {selectedOrder.payment_status === 'pending' && (
                  <button 
                    onClick={() => markAsPaid(selectedOrder.id)} 
                    disabled={submitting}
                    className="flex-[2] py-4 bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg hover:bg-emerald-700 transition-all"
                  >
                    Confirm Payment Received
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {showEditModal && selectedOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-2">Edit Order</h2>
              <p className="text-gray-600 mb-4">Update order #<span className="font-mono">{selectedOrder.order_reference}</span></p>
              
              <div className="space-y-4">
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
                  <label className="block font-medium mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    required
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
                
                <div>
                  <label className="block font-medium mb-1">Delivery Method</label>
                  <select
                    value={editForm.delivery_method}
                    onChange={(e) => setEditForm({...editForm, delivery_method: e.target.value as 'pickup' | 'delivery'})}
                    className="w-full p-2 border rounded"
                  >
                    <option value="pickup">Pickup</option>
                    <option value="delivery">Delivery</option>
                  </select>
                </div>
                
                <div>
                  <label className="block font-medium mb-1">Delivery Address</label>
                  <textarea
                    rows={2}
                    value={editForm.delivery_address}
                    onChange={(e) => setEditForm({...editForm, delivery_address: e.target.value})}
                    className="w-full p-2 border rounded"
                  />
                </div>
                
                <div>
                  <label className="block font-medium mb-1">Notes</label>
                  <textarea
                    rows={2}
                    value={editForm.notes}
                    onChange={(e) => setEditForm({...editForm, notes: e.target.value})}
                    className="w-full p-2 border rounded"
                  />
                </div>
              </div>
              
              <div className="flex gap-3 mt-6">
                <button
                  onClick={updateOrder}
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

      {/* CANCEL MODAL */}
      {showCancelModal && selectedOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full">
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-2 text-amber-600">Cancel Order</h2>
              <p className="text-gray-600 mb-4">Are you sure you want to cancel order #{selectedOrder.order_reference}?</p>
              
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <p><strong>Customer:</strong> {selectedOrder.customer_name}</p>
                <p><strong>Amount:</strong> ₦{selectedOrder.total_amount.toLocaleString()}</p>
                <p><strong>Status:</strong> {selectedOrder.payment_status}</p>
              </div>
              
              <div className="bg-yellow-50 p-3 rounded-lg mb-4">
                <p className="text-sm text-yellow-800">
                  ⚠️ Cancelling this order will restore product stock.
                </p>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => cancelOrder(selectedOrder.id)}
                  disabled={submitting}
                  className="flex-1 bg-amber-600 text-white py-2 rounded-lg font-bold hover:bg-amber-700 disabled:opacity-50"
                >
                  {submitting ? 'Processing...' : 'Yes, Cancel Order'}
                </button>
                <button
                  onClick={() => setShowCancelModal(false)}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  No, Go Back
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DELETE MODAL */}
      {showDeleteModal && selectedOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full">
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-2 text-red-600">Delete Order</h2>
              <p className="text-gray-600 mb-4">Are you sure you want to permanently delete order #{selectedOrder.order_reference}?</p>
              
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <p><strong>Customer:</strong> {selectedOrder.customer_name}</p>
                <p><strong>Amount:</strong> ₦{selectedOrder.total_amount.toLocaleString()}</p>
                <p><strong>Status:</strong> {selectedOrder.payment_status}</p>
              </div>
              
              <div className="bg-red-50 p-3 rounded-lg mb-4">
                <p className="text-sm text-red-800">
                  ⚠️ This action cannot be undone. The order will be permanently removed.
                </p>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={deleteOrder}
                  disabled={submitting}
                  className="flex-1 bg-red-600 text-white py-2 rounded-lg font-bold hover:bg-red-700 disabled:opacity-50"
                >
                  {submitting ? 'Processing...' : 'Yes, Permanently Delete'}
                </button>
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  No, Keep It
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}