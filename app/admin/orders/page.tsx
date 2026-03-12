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
  payment_status: 'pending' | 'paid' | 'failed';
  total_amount: number;
  items: any[];
  notes: string;
  created_at: string;
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });
    
    setOrders((data as Order[]) || []);
    setLoading(false);
  };

  const updatePaymentStatus = async (orderId: number, newStatus: string) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    const { error } = await supabase
      .from('orders')
      .update({ payment_status: newStatus })
      .eq('id', orderId);

    if (!error) {
      if (newStatus === 'paid') {
        // Log individual items into Sales table for accounting
        const saleEntries = order.items.map(item => ({
          order_reference: order.order_reference,
          item_type: 'product',
          item_id: item.product_id,
          item_name: item.product_name,
          quantity: item.quantity,
          price: item.price,
          customer_name: order.customer_name,
          customer_phone: order.customer_phone,
          payment_status: 'paid',
          sale_date: new Date().toISOString().split('T')[0]
        }));

        await supabase.from('sales').insert(saleEntries);
      }
      fetchOrders();
    }
  };

  const filteredOrders = statusFilter === 'all' 
    ? orders 
    : orders.filter(o => o.payment_status === statusFilter);

  if (loading) return <div className="p-10 text-center font-bold animate-pulse text-slate-400">LOADING ORDERS...</div>;

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-10">
      <div className="max-w-7xl mx-auto">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">ORDERS</h1>
            <p className="text-slate-500 font-medium">Manage e-commerce sales & logistics</p>
          </div>
          
          <div className="flex bg-white p-1 rounded-xl shadow-sm border border-slate-200">
            {['all', 'pending', 'paid'].map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-4 py-2 rounded-lg text-xs font-black uppercase transition-all ${
                  statusFilter === s ? 'bg-slate-900 text-white' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* REVENUE OVERVIEW */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Total Volume</p>
            <p className="text-3xl font-black text-slate-900">{orders.length}</p>
          </div>
          <div className="bg-amber-50 p-6 rounded-3xl border border-amber-100 shadow-sm">
            <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-2">Awaiting Payment</p>
            <p className="text-3xl font-black text-amber-700">{orders.filter(o => o.payment_status === 'pending').length}</p>
          </div>
          <div className="bg-emerald-600 p-6 rounded-3xl shadow-lg shadow-emerald-100">
            <p className="text-[10px] font-black text-emerald-100 uppercase tracking-widest mb-2">Confirmed Revenue</p>
            <p className="text-3xl font-black text-white">
              ₦{orders.filter(o => o.payment_status === 'paid').reduce((sum, o) => sum + o.total_amount, 0).toLocaleString()}
            </p>
          </div>
        </div>

        {/* ORDERS TABLE */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
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
                    <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase border ${
                      order.payment_status === 'paid' 
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                        : 'bg-amber-50 text-amber-700 border-amber-100'
                    }`}>
                      {order.payment_status}
                    </span>
                  </td>
                  <td className="p-5">
                    <div className="flex justify-center gap-3">
                      <button 
                        onClick={() => { setSelectedOrder(order); setShowDetailsModal(true); }}
                        className="p-2 hover:bg-slate-100 rounded-lg transition-all text-slate-600 font-bold text-xs uppercase"
                      >
                        Details
                      </button>
                      {order.payment_status === 'pending' && (
                        <a 
                          href={`https://wa.me/${order.customer_phone.replace(/\D/g, '')}`} 
                          target="_blank"
                          className="p-2 bg-emerald-100 text-emerald-700 rounded-lg text-xs font-black uppercase tracking-tighter"
                        >
                          WhatsApp
                        </a>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL */}
      {showDetailsModal && selectedOrder && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-[40px] max-w-2xl w-full p-8 shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-black tracking-tighter">ORDER DETAILS</h2>
              <button onClick={() => setShowDetailsModal(false)} className="text-slate-300 hover:text-slate-900 font-black">✕</button>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-4 rounded-2xl">
                  <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Logistics</p>
                  <p className="text-sm font-black text-slate-800 uppercase">{selectedOrder.delivery_method}</p>
                  <p className="text-xs text-slate-500 mt-1">{selectedOrder.delivery_address}</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl">
                  <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Customer Email</p>
                  <p className="text-sm font-bold text-slate-800">{selectedOrder.customer_email}</p>
                </div>
              </div>

              <div className="border border-slate-100 rounded-2xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-400">
                    <tr>
                      <th className="p-4 text-left">Item</th>
                      <th className="p-4 text-center">Qty</th>
                      <th className="p-4 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {selectedOrder.items.map((item, idx) => (
                      <tr key={idx}>
                        <td className="p-4 font-bold text-slate-700">{item.product_name}</td>
                        <td className="p-4 text-center font-bold">{item.quantity}</td>
                        <td className="p-4 text-right font-black">₦{(item.price * item.quantity).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-between items-center bg-slate-900 p-6 rounded-3xl text-white">
                <span className="font-black tracking-widest uppercase text-xs opacity-60">Total Bill</span>
                <span className="text-3xl font-black">₦{selectedOrder.total_amount.toLocaleString()}</span>
              </div>

              <div className="flex gap-3">
                <button onClick={() => setShowDetailsModal(false)} className="flex-1 py-4 font-black text-xs uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-all">Close</button>
                {selectedOrder.payment_status === 'pending' && (
                  <button 
                    onClick={() => { updatePaymentStatus(selectedOrder.id, 'paid'); setShowDetailsModal(false); }}
                    className="flex-[2] py-4 bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition-all"
                  >
                    Confirm Payment Received
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}