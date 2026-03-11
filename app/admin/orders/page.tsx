// app/admin/orders/page.tsx
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
    const { error } = await supabase
      .from('orders')
      .update({ payment_status: newStatus })
      .eq('id', orderId);

    if (!error) {
      fetchOrders();
      if (newStatus === 'paid') {
        // Also update the sales table when order is marked as paid
        const order = orders.find(o => o.id === orderId);
        if (order) {
          // Insert into sales table for each item
          for (const item of order.items) {
            await supabase.from('sales').insert([{
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
            }]);
          }
        }
      }
    }
  };

  const filteredOrders = statusFilter === 'all' 
    ? orders 
    : orders.filter(o => o.payment_status === statusFilter);

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'paid': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-48 mb-6"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">📦 Orders</h1>
            <p className="text-gray-500 text-sm mt-1">Manage customer orders and payments</p>
          </div>
          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border rounded-lg px-4 py-2 bg-white"
            >
              <option value="all">All Orders</option>
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
              <option value="failed">Failed</option>
            </select>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-sm text-gray-500">Total Orders</p>
            <p className="text-2xl font-bold">{orders.length}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border-l-4 border-yellow-500">
            <p className="text-sm text-gray-500">Pending</p>
            <p className="text-2xl font-bold text-yellow-600">
              {orders.filter(o => o.payment_status === 'pending').length}
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border-l-4 border-green-500">
            <p className="text-sm text-gray-500">Paid</p>
            <p className="text-2xl font-bold text-green-600">
              {orders.filter(o => o.payment_status === 'paid').length}
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border-l-4 border-blue-500">
            <p className="text-sm text-gray-500">Revenue</p>
            <p className="text-2xl font-bold text-blue-600">
              ₦{orders.filter(o => o.payment_status === 'paid')
                .reduce((sum, o) => sum + o.total_amount, 0)
                .toLocaleString()}
            </p>
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-3 text-left">Order #</th>
                  <th className="p-3 text-left">Date</th>
                  <th className="p-3 text-left">Customer</th>
                  <th className="p-3 text-left">Items</th>
                  <th className="p-3 text-right">Amount</th>
                  <th className="p-3 text-left">Status</th>
                  <th className="p-3 text-left">Payment</th>
                  <th className="p-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="border-t hover:bg-gray-50">
                    <td className="p-3 font-mono text-sm">
                      <Link 
                        href={`/admin/orders/${order.id}`}
                        className="text-blue-600 hover:underline"
                      >
                        {order.order_reference}
                      </Link>
                    </td>
                    <td className="p-3 text-sm">
                      {new Date(order.created_at).toLocaleDateString()}
                    </td>
                    <td className="p-3">
                      <div>
                        <p className="font-medium">{order.customer_name}</p>
                        <p className="text-xs text-gray-500">{order.customer_phone}</p>
                      </div>
                    </td>
                    <td className="p-3 text-sm">
                      {order.items?.length || 0} items
                    </td>
                    <td className="p-3 text-right font-bold">
                      ₦{order.total_amount.toLocaleString()}
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusBadge(order.payment_status)}`}>
                        {order.payment_status}
                      </span>
                    </td>
                    <td className="p-3 text-sm">
                      {order.payment_method || 'transfer'}
                    </td>
                    <td className="p-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setSelectedOrder(order);
                            setShowDetailsModal(true);
                          }}
                          className="text-blue-600 hover:underline text-sm"
                        >
                          View
                        </button>
                        {order.payment_status === 'pending' && (
                          <>
                            <button
                              onClick={() => updatePaymentStatus(order.id, 'paid')}
                              className="text-green-600 hover:underline text-sm"
                            >
                              Mark Paid
                            </button>
                            <Link
                              href={`https://wa.me/${order.customer_phone}`}
                              target="_blank"
                              className="text-green-600 hover:underline text-sm"
                            >
                              WhatsApp
                            </Link>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredOrders.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No orders found</p>
            </div>
          )}
        </div>
      </div>

      {/* Order Details Modal */}
      {showDetailsModal && selectedOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-2xl font-bold">Order Details</h2>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-500">Order Reference</p>
                  <p className="font-mono font-bold">{selectedOrder.order_reference}</p>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-500">Customer</p>
                    <p className="font-bold">{selectedOrder.customer_name}</p>
                    <p>{selectedOrder.customer_email}</p>
                    <p>{selectedOrder.customer_phone}</p>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-500">Delivery</p>
                    <p className="font-bold">{selectedOrder.delivery_method}</p>
                    <p className="text-sm">{selectedOrder.delivery_address}</p>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-500 mb-2">Items</p>
                  <table className="w-full">
                    <thead>
                      <tr className="text-xs text-gray-500">
                        <th className="text-left">Product</th>
                        <th className="text-center">Qty</th>
                        <th className="text-right">Price</th>
                        <th className="text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedOrder.items?.map((item, idx) => (
                        <tr key={idx} className="border-t">
                          <td className="py-2">{item.product_name}</td>
                          <td className="py-2 text-center">{item.quantity}</td>
                          <td className="py-2 text-right">₦{item.price.toLocaleString()}</td>
                          <td className="py-2 text-right font-bold">₦{(item.price * item.quantity).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t font-bold">
                        <td colSpan={3} className="py-2 text-right">Total:</td>
                        <td className="py-2 text-right">₦{selectedOrder.total_amount.toLocaleString()}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {selectedOrder.notes && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-500">Notes</p>
                    <p>{selectedOrder.notes}</p>
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-4 border-t">
                  <button
                    onClick={() => setShowDetailsModal(false)}
                    className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                  >
                    Close
                  </button>
                  {selectedOrder.payment_status === 'pending' && (
                    <button
                      onClick={() => {
                        updatePaymentStatus(selectedOrder.id, 'paid');
                        setShowDetailsModal(false);
                      }}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                      Mark as Paid
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}