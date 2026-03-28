"use client";
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import Image from 'next/image';

interface Reservation {
  id: number;
  reference: string;
  dog_id: number;
  dog_name: string;
  customer_name: string;
  customer_email?: string;
  customer_phone: string;
  deposit_amount: number;
  total_price: number;
  remaining_balance: number;
  status: 'pending' | 'completed' | 'cancelled';
  payment_method: string;
  payment_status: string;
  reservation_date: string;
  confirmed_at?: string;
  notes?: string;
  created_at: string;
  dogs?: {
    name: string;
    images?: string[];
  };
}

export default function AdminReservationsPage() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editForm, setEditForm] = useState({
    customer_name: '',
    customer_phone: '',
    customer_email: '',
    deposit_amount: 0,
    notes: ''
  });

  useEffect(() => {
    fetchReservations();
  }, [statusFilter]);

  const fetchReservations = async () => {
    setLoading(true);
    let query = supabase
      .from('reservations')
      .select(`
        *,
        dogs (
          name,
          images
        )
      `)
      .order('created_at', { ascending: false });

    if (statusFilter !== 'all') {
      query = query.eq('status', statusFilter);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching reservations:', error);
      alert('Error loading reservations: ' + error.message);
    } else {
      setReservations(data || []);
    }
    setLoading(false);
  };

  // Edit Reservation
  const openEditModal = (reservation: Reservation) => {
    setSelectedReservation(reservation);
    setEditForm({
      customer_name: reservation.customer_name,
      customer_phone: reservation.customer_phone,
      customer_email: reservation.customer_email || '',
      deposit_amount: reservation.deposit_amount,
      notes: reservation.notes || ''
    });
    setShowEditModal(true);
  };

  const updateReservation = async () => {
    if (!selectedReservation) return;
    setSubmitting(true);

    try {
      const newDepositAmount = editForm.deposit_amount;
      const newRemainingBalance = selectedReservation.total_price - newDepositAmount;

      // 1. Update reservation
      const { error: updateError } = await supabase
        .from('reservations')
        .update({
          customer_name: editForm.customer_name,
          customer_phone: editForm.customer_phone,
          customer_email: editForm.customer_email || null,
          deposit_amount: newDepositAmount,
          remaining_balance: newRemainingBalance,
          notes: editForm.notes || null
        })
        .eq('id', selectedReservation.id);

      if (updateError) throw updateError;

      // 2. Update the corresponding sales record for deposit
      const { error: saleError } = await supabase
        .from('sales')
        .update({
          price: newDepositAmount,
          customer_name: editForm.customer_name,
          customer_phone: editForm.customer_phone,
          notes: `EDITED: ${selectedReservation.reference} - Deposit updated from ₦${selectedReservation.deposit_amount.toLocaleString()} to ₦${newDepositAmount.toLocaleString()}`
        })
        .eq('source', 'dog_reserve')
        .eq('item_id', selectedReservation.dog_id)
        .eq('payment_status', 'partial');

      if (saleError) console.error('Error updating sales record:', saleError);

      alert(`✅ Reservation ${selectedReservation.reference} updated successfully!`);
      fetchReservations();
      setShowEditModal(false);
      setSelectedReservation(null);

    } catch (error: any) {
      console.error('Error updating reservation:', error);
      alert('Error updating reservation: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Reservation (only if pending)
  const deleteReservation = async () => {
    if (!selectedReservation) return;
    if (selectedReservation.status !== 'pending') {
      alert('Only pending reservations can be deleted. For completed/cancelled, use cancellation instead.');
      return;
    }
    
    setSubmitting(true);

    try {
      // 1. Delete the corresponding sales record for deposit
      const { error: saleError } = await supabase
        .from('sales')
        .delete()
        .eq('source', 'dog_reserve')
        .eq('item_id', selectedReservation.dog_id)
        .eq('payment_status', 'partial')
        .eq('item_name', selectedReservation.dog_name);

      if (saleError) console.error('Error deleting sales record:', saleError);

      // 2. Delete the reservation
      const { error: deleteError } = await supabase
        .from('reservations')
        .delete()
        .eq('id', selectedReservation.id);

      if (deleteError) throw deleteError;

      // 3. Reset dog status back to available
      await supabase
        .from('dogs')
        .update({ status: 'available' })
        .eq('id', selectedReservation.dog_id);

      alert(`✅ Reservation ${selectedReservation.reference} deleted successfully! Dog is now available.`);
      fetchReservations();
      setShowDeleteModal(false);
      setSelectedReservation(null);

    } catch (error: any) {
      console.error('Error deleting reservation:', error);
      alert('Error deleting reservation: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const completeReservation = async (reservation: Reservation) => {
    setSubmitting(true);
    const today = new Date().toISOString().split('T')[0];

    try {
      // 1. Update reservation status
      const { error: updateError } = await supabase
        .from('reservations')
        .update({ 
          status: 'completed',
          confirmed_at: new Date().toISOString()
        })
        .eq('id', reservation.id);

      if (updateError) throw updateError;

      // 2. Update dog status to 'sold'
      const { error: dogError } = await supabase
        .from('dogs')
        .update({ status: 'sold' })
        .eq('id', reservation.dog_id);

      if (dogError) throw dogError;

      // 3. Insert final payment into sales table
      if (reservation.remaining_balance > 0) {
        const { error: saleError } = await supabase
          .from('sales')
          .insert([{
            source: 'dog_sold',
            item_type: 'dog',
            item_id: reservation.dog_id,
            item_name: reservation.dog_name,
            price: reservation.remaining_balance,
            customer_name: reservation.customer_name,
            customer_phone: reservation.customer_phone,
            payment_status: 'paid',
            payment_method: reservation.payment_method,
            sale_date: today,
            notes: `Reservation ${reservation.reference} - Final payment for ${reservation.dog_name}`
          }]);

        if (saleError) throw saleError;
      }

      alert(`✅ Reservation ${reservation.reference} completed! Final payment recorded.`);
      fetchReservations();
      setShowConfirmModal(false);
      setSelectedReservation(null);

    } catch (error: any) {
      console.error('Error completing reservation:', error);
      alert('Error completing reservation: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const cancelReservation = async (reservation: Reservation) => {
    setSubmitting(true);

    try {
      // 1. Update reservation status
      const { error: updateError } = await supabase
        .from('reservations')
        .update({ status: 'cancelled' })
        .eq('id', reservation.id);

      if (updateError) throw updateError;

      // 2. Update dog status back to 'available'
      const { error: dogError } = await supabase
        .from('dogs')
        .update({ status: 'available' })
        .eq('id', reservation.dog_id);

      if (dogError) throw dogError;

      // 3. Mark the deposit as cancelled in sales
      const { error: updateSaleError } = await supabase
        .from('sales')
        .update({ 
          notes: `CANCELLED - ${reservation.reference} - ${reservation.customer_name} cancelled reservation` 
        })
        .eq('source', 'dog_reserve')
        .eq('item_id', reservation.dog_id)
        .eq('payment_status', 'partial');

      if (updateSaleError) console.error('Error updating sale note:', updateSaleError);

      alert(`✅ Reservation ${reservation.reference} cancelled. Dog is now available again.`);
      fetchReservations();
      setShowCancelModal(false);
      setSelectedReservation(null);

    } catch (error: any) {
      console.error('Error cancelling reservation:', error);
      alert('Error cancelling reservation: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <span className="px-2 py-1 rounded-full text-xs font-bold bg-yellow-100 text-yellow-800">⏳ Pending</span>;
      case 'completed':
        return <span className="px-2 py-1 rounded-full text-xs font-bold bg-green-100 text-green-800">✅ Completed</span>;
      case 'cancelled':
        return <span className="px-2 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800">❌ Cancelled</span>;
      default:
        return <span className="px-2 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-800">{status}</span>;
    }
  };

  const getPaymentStatusBadge = (status: string) => {
    if (status === 'partial') {
      return <span className="px-2 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800">💰 Partial</span>;
    } else if (status === 'paid') {
      return <span className="px-2 py-1 rounded-full text-xs font-bold bg-green-100 text-green-800">✅ Paid</span>;
    }
    return <span className="px-2 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-800">{status}</span>;
  };

  const filteredReservations = reservations.filter(res =>
    res.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
    res.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    res.dog_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    res.customer_phone.includes(searchTerm)
  );

  const stats = {
    total: reservations.length,
    pending: reservations.filter(r => r.status === 'pending').length,
    completed: reservations.filter(r => r.status === 'completed').length,
    cancelled: reservations.filter(r => r.status === 'cancelled').length,
    totalRevenue: reservations
      .filter(r => r.status === 'completed')
      .reduce((sum, r) => sum + r.total_price, 0),
    totalDeposits: reservations
      .filter(r => r.status === 'completed')
      .reduce((sum, r) => sum + r.deposit_amount, 0),
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-pulse text-center">
          <div className="w-16 h-16 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-500">Loading reservations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">📋 Reservations</h1>
            <p className="text-gray-600 text-sm mt-1">Manage dog reservations, deposits, and final payments</p>
          </div>
          <Link 
            href="/admin/dogs" 
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2.5 rounded-lg flex items-center gap-2 shadow-md transition-all"
          >
            <span>🐕</span> <span>Back to Dogs</span>
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
          <div className="bg-white p-4 rounded-lg shadow-sm text-center">
            <p className="text-xs text-gray-500">Total</p>
            <p className="text-2xl font-bold">{stats.total}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm text-center border-l-4 border-yellow-500">
            <p className="text-xs text-gray-500">Pending</p>
            <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm text-center border-l-4 border-green-500">
            <p className="text-xs text-gray-500">Completed</p>
            <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm text-center border-l-4 border-red-500">
            <p className="text-xs text-gray-500">Cancelled</p>
            <p className="text-2xl font-bold text-red-600">{stats.cancelled}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm text-center border-l-4 border-purple-500">
            <p className="text-xs text-gray-500">Total Revenue</p>
            <p className="text-2xl font-bold text-purple-600">₦{stats.totalRevenue.toLocaleString()}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-lg shadow-sm mb-6 grid md:grid-cols-2 gap-4">
          <input 
            type="text" 
            placeholder="Search by reference, customer name, dog name, or phone..." 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
            className="p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
          />
          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)} 
            className="p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        {/* Reservations Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1200px]">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="p-4 text-left text-sm font-semibold text-gray-600">Reference</th>
                  <th className="p-4 text-left text-sm font-semibold text-gray-600">Dog</th>
                  <th className="p-4 text-left text-sm font-semibold text-gray-600">Customer</th>
                  <th className="p-4 text-left text-sm font-semibold text-gray-600">Contact</th>
                  <th className="p-4 text-left text-sm font-semibold text-gray-600">Deposit</th>
                  <th className="p-4 text-left text-sm font-semibold text-gray-600">Balance</th>
                  <th className="p-4 text-left text-sm font-semibold text-gray-600">Total</th>
                  <th className="p-4 text-left text-sm font-semibold text-gray-600">Status</th>
                  <th className="p-4 text-left text-sm font-semibold text-gray-600">Date</th>
                  <th className="p-4 text-left text-sm font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredReservations.map((res) => (
                  <tr key={res.id} className="border-b hover:bg-gray-50 transition">
                    <td className="p-4">
                      <code className="text-xs font-mono font-bold bg-gray-100 px-2 py-1 rounded">
                        {res.reference}
                      </code>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        {res.dogs?.images?.[0] && (
                          <div className="w-8 h-8 rounded-full overflow-hidden relative">
                            <Image src={res.dogs.images[0]} alt={res.dog_name} fill className="object-cover" />
                          </div>
                        )}
                        <span className="font-medium text-gray-900">{res.dog_name}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div>
                        <p className="font-medium">{res.customer_name}</p>
                        {res.customer_email && (
                          <p className="text-xs text-gray-500">{res.customer_email}</p>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <p className="text-sm">{res.customer_phone}</p>
                    </td>
                    <td className="p-4">
                      <p className="font-medium text-green-600">₦{res.deposit_amount.toLocaleString()}</p>
                    </td>
                    <td className="p-4">
                      <p className="font-medium text-yellow-600">₦{res.remaining_balance.toLocaleString()}</p>
                    </td>
                    <td className="p-4">
                      <p className="font-bold">₦{res.total_price.toLocaleString()}</p>
                    </td>
                    <td className="p-4">
                      <div className="space-y-1">
                        {getStatusBadge(res.status)}
                        <div>{getPaymentStatusBadge(res.payment_status)}</div>
                      </div>
                    </td>
                    <td className="p-4 text-sm">
                      {new Date(res.reservation_date).toLocaleDateString()}
                    </td>
                    <td className="p-4">
                      {res.status === 'pending' && (
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => openEditModal(res)}
                            className="bg-blue-600 text-white px-3 py-1 rounded-lg text-xs font-medium hover:bg-blue-700 transition"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => {
                              setSelectedReservation(res);
                              setShowConfirmModal(true);
                            }}
                            className="bg-green-600 text-white px-3 py-1 rounded-lg text-xs font-medium hover:bg-green-700 transition"
                          >
                            Complete
                          </button>
                          <button
                            onClick={() => {
                              setSelectedReservation(res);
                              setShowCancelModal(true);
                            }}
                            className="bg-yellow-600 text-white px-3 py-1 rounded-lg text-xs font-medium hover:bg-yellow-700 transition"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => {
                              setSelectedReservation(res);
                              setShowDeleteModal(true);
                            }}
                            className="bg-red-600 text-white px-3 py-1 rounded-lg text-xs font-medium hover:bg-red-700 transition"
                          >
                            Delete
                          </button>
                        </div>
                      )}
                      {res.status === 'completed' && (
                        <span className="text-xs text-gray-400">Completed</span>
                      )}
                      {res.status === 'cancelled' && (
                        <span className="text-xs text-gray-400">Cancelled</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredReservations.length === 0 && (
            <div className="p-12 text-center text-gray-500">
              <p className="text-lg">No reservations found</p>
              <p className="text-sm mt-1">Create a reservation by marking a dog as "Reserved" in Dog Management</p>
            </div>
          )}
        </div>
      </div>

      {/* Edit Reservation Modal */}
      {showEditModal && selectedReservation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-2">Edit Reservation</h2>
              <p className="text-gray-600 mb-4">Update reservation details</p>
              
              <div className="space-y-4">
                <div>
                  <label className="block font-medium mb-1">Reference</label>
                  <input
                    type="text"
                    value={selectedReservation.reference}
                    disabled
                    className="w-full p-2 border rounded bg-gray-50 font-mono text-sm"
                  />
                </div>
                
                <div>
                  <label className="block font-medium mb-1">Dog</label>
                  <input
                    type="text"
                    value={selectedReservation.dog_name}
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
                  <label className="block font-medium mb-1">Deposit Amount (₦)</label>
                  <input
                    type="number"
                    value={editForm.deposit_amount}
                    onChange={(e) => setEditForm({...editForm, deposit_amount: Number(e.target.value)})}
                    className="w-full p-2 border rounded"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Total Price: ₦{selectedReservation.total_price.toLocaleString()} | 
                    New Balance: ₦{(selectedReservation.total_price - editForm.deposit_amount).toLocaleString()}
                  </p>
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
                  onClick={updateReservation}
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

      {/* Confirm Complete Modal */}
      {showConfirmModal && selectedReservation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full">
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-2">Complete Reservation</h2>
              <p className="text-gray-600 mb-4">Record final payment and complete the sale</p>
              
              <div className="bg-gray-50 p-4 rounded-lg mb-4 space-y-2">
                <p><strong>Reference:</strong> <code>{selectedReservation.reference}</code></p>
                <p><strong>Dog:</strong> {selectedReservation.dog_name}</p>
                <p><strong>Customer:</strong> {selectedReservation.customer_name}</p>
                <p><strong>Phone:</strong> {selectedReservation.customer_phone}</p>
                <p><strong>Deposit Paid:</strong> ₦{selectedReservation.deposit_amount.toLocaleString()}</p>
                <p className="text-lg font-bold text-green-600">
                  Remaining Balance: ₦{selectedReservation.remaining_balance.toLocaleString()}
                </p>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => completeReservation(selectedReservation)}
                  disabled={submitting}
                  className="flex-1 bg-green-600 text-white py-2 rounded-lg font-bold hover:bg-green-700 disabled:opacity-50"
                >
                  {submitting ? 'Processing...' : 'Complete & Record Payment'}
                </button>
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Cancel Modal */}
      {showCancelModal && selectedReservation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full">
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-2 text-red-600">Cancel Reservation</h2>
              <p className="text-gray-600 mb-4">This will cancel the reservation and make the dog available again.</p>
              
              <div className="bg-gray-50 p-4 rounded-lg mb-4 space-y-2">
                <p><strong>Reference:</strong> <code>{selectedReservation.reference}</code></p>
                <p><strong>Dog:</strong> {selectedReservation.dog_name}</p>
                <p><strong>Customer:</strong> {selectedReservation.customer_name}</p>
                <p><strong>Deposit Paid:</strong> ₦{selectedReservation.deposit_amount.toLocaleString()}</p>
              </div>
              
              <div className="bg-yellow-50 p-3 rounded-lg mb-4">
                <p className="text-sm text-yellow-800">
                  ⚠️ Note: The deposit will remain in the sales record but marked as cancelled.
                  The dog will be set back to "Available" status.
                </p>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => cancelReservation(selectedReservation)}
                  disabled={submitting}
                  className="flex-1 bg-red-600 text-white py-2 rounded-lg font-bold hover:bg-red-700 disabled:opacity-50"
                >
                  {submitting ? 'Processing...' : 'Yes, Cancel Reservation'}
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

      {/* Confirm Delete Modal */}
      {showDeleteModal && selectedReservation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full">
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-2 text-red-600">Delete Reservation</h2>
              <p className="text-gray-600 mb-4">
                This will permanently delete this reservation and remove the deposit from sales records.
                <strong className="block mt-2 text-red-600">This action cannot be undone!</strong>
              </p>
              
              <div className="bg-gray-50 p-4 rounded-lg mb-4 space-y-2">
                <p><strong>Reference:</strong> <code>{selectedReservation.reference}</code></p>
                <p><strong>Dog:</strong> {selectedReservation.dog_name}</p>
                <p><strong>Customer:</strong> {selectedReservation.customer_name}</p>
                <p><strong>Deposit Paid:</strong> ₦{selectedReservation.deposit_amount.toLocaleString()}</p>
              </div>
              
              <div className="bg-red-50 p-3 rounded-lg mb-4">
                <p className="text-sm text-red-800">
                  ⚠️ Warning: This will:
                  <br />- Delete the reservation record
                  <br />- Remove the deposit from sales records
                  <br />- Set the dog back to "Available" status
                </p>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={deleteReservation}
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