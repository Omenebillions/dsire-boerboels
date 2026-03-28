// app/admin/debtors/page.tsx
"use client";
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Customer {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  type?: string;
}

interface Debt {
  id: number;
  customer_id: number;
  sale_id?: number;
  reservation_id?: number;
  invoice_number: string;
  description: string;
  original_amount: number;
  amount_paid: number;
  remaining_amount: number;
  due_date: string;
  status: 'pending' | 'partial' | 'paid' | 'overdue';  // ← This is the union type
  related_type?: string;
  related_id?: number;
  notes?: string;
  created_at: string;
  updated_at?: string;
  customers?: Customer;
}

interface PaymentRecord {
  id: number;
  debt_id: number;
  amount: number;
  payment_method: string;
  payment_date: string;
  notes?: string;
  created_at: string;
}

export default function DebtorsPage() {
  const router = useRouter();
  const [debts, setDebts] = useState<Debt[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedDebt, setSelectedDebt] = useState<Debt | null>(null);
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    payment_method: 'cash',
    payment_date: new Date().toISOString().split('T')[0],
    notes: ''
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, [filter]);

  const fetchData = async () => {
    setLoading(true);
    
    try {
      // Fetch customers
      const { data: customersData } = await supabase
        .from('customers')
        .select('*')
        .order('name');
      
      setCustomers((customersData as Customer[]) || []);

      // Fetch debts with filters
      let query = supabase
        .from('debtors')
        .select(`
          *,
          customers (*)
        `)
        .order('due_date', { ascending: true });
      
      if (filter === 'pending') {
        query = query.in('status', ['pending', 'partial']);
      } else if (filter === 'overdue') {
        query = query.eq('status', 'pending').lt('due_date', new Date().toISOString().split('T')[0]);
      } else if (filter === 'paid') {
        query = query.eq('status', 'paid');
      }
      
      const { data: debtsData, error } = await query;
      
      if (error) throw error;
      
      // Update overdue status and cast status to correct type
      const today = new Date().toISOString().split('T')[0];
      const updatedDebts: Debt[] = (debtsData as any[])?.map(debt => {
        let status: Debt['status'] = debt.status;
        
        // Update status if overdue
        if (debt.status !== 'paid' && debt.due_date && debt.due_date < today) {
          status = 'overdue';
        }
        
        return {
          ...debt,
          status,
        };
      }) || [];
      
      setDebts(updatedDebts);
      
    } catch (error: any) {
      console.error('Error fetching data:', error);
      alert('Error loading debtors data: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Record payment on a debt
  const recordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDebt) return;
    
    setSubmitting(true);
    
    const paymentAmount = Number(paymentForm.amount);
    if (paymentAmount <= 0) {
      alert('Please enter a valid payment amount');
      setSubmitting(false);
      return;
    }
    
    if (paymentAmount > selectedDebt.remaining_amount) {
      alert(`Payment amount cannot exceed remaining balance of ₦${selectedDebt.remaining_amount.toLocaleString()}`);
      setSubmitting(false);
      return;
    }
    
    try {
      const newRemaining = selectedDebt.remaining_amount - paymentAmount;
      const newStatus: Debt['status'] = newRemaining === 0 ? 'paid' : 'partial';
      
      // 1. Update debt record
      const { error: debtError } = await supabase
        .from('debtors')
        .update({
          amount_paid: selectedDebt.amount_paid + paymentAmount,
          remaining_amount: newRemaining,
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedDebt.id);
      
      if (debtError) throw debtError;
      
      // 2. Create payment record
      const { error: paymentError } = await supabase
        .from('debt_payments')
        .insert([{
          debt_id: selectedDebt.id,
          amount: paymentAmount,
          payment_method: paymentForm.payment_method,
          payment_date: paymentForm.payment_date,
          notes: paymentForm.notes || null
        }]);
      
      if (paymentError) console.error('Payment record error:', paymentError);
      
      // 3. If related to a sale, update the sale record
      if (selectedDebt.sale_id) {
        await supabase
          .from('sales')
          .update({
            payment_status: newStatus === 'paid' ? 'paid' : 'partial',
            deposit_amount: selectedDebt.amount_paid + paymentAmount,
            notes: `${selectedDebt.notes || ''} | Payment of ₦${paymentAmount.toLocaleString()} recorded on ${paymentForm.payment_date}`
          })
          .eq('id', selectedDebt.sale_id);
      }
      
      alert(`✅ Payment of ₦${paymentAmount.toLocaleString()} recorded successfully!`);
      setShowPaymentModal(false);
      setSelectedDebt(null);
      setPaymentForm({
        amount: '',
        payment_method: 'cash',
        payment_date: new Date().toISOString().split('T')[0],
        notes: ''
      });
      fetchData();
      
    } catch (error: any) {
      console.error('Error recording payment:', error);
      alert('Error recording payment: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Mark debt as paid in full
  const markAsPaid = async (debt: Debt) => {
    if (!confirm(`Mark debt #${debt.invoice_number} as paid in full?`)) return;
    
    setUpdatingId(debt.id);
    
    try {
      const remainingToPay = debt.remaining_amount;
      
      const { error } = await supabase
        .from('debtors')
        .update({
          status: 'paid',
          remaining_amount: 0,
          amount_paid: debt.original_amount,
          updated_at: new Date().toISOString()
        })
        .eq('id', debt.id);
      
      if (error) throw error;
      
      // Also update related sale if exists
      if (debt.sale_id) {
        await supabase
          .from('sales')
          .update({
            payment_status: 'paid',
            notes: `${debt.notes || ''} | Marked as paid in full`
          })
          .eq('id', debt.sale_id);
      }
      
      alert(`✅ Debt #${debt.invoice_number} marked as paid. ₦${remainingToPay.toLocaleString()} recorded.`);
      fetchData();
      
    } catch (error: any) {
      console.error('Error marking debt as paid:', error);
      alert('Error marking debt as paid: ' + error.message);
    } finally {
      setUpdatingId(null);
    }
  };

  // Delete debt (only if not paid)
  const deleteDebt = async (debt: Debt) => {
    if (debt.status === 'paid') {
      alert('Cannot delete a paid debt. Consider archiving instead.');
      return;
    }
    
    if (!confirm(`⚠️ Are you sure you want to delete debt #${debt.invoice_number}? This action cannot be undone.`)) return;
    
    setUpdatingId(debt.id);
    
    try {
      const { error } = await supabase
        .from('debtors')
        .delete()
        .eq('id', debt.id);
      
      if (error) throw error;
      
      alert(`✅ Debt #${debt.invoice_number} deleted successfully`);
      fetchData();
      
    } catch (error: any) {
      console.error('Error deleting debt:', error);
      alert('Error deleting debt: ' + error.message);
    } finally {
      setUpdatingId(null);
    }
  };

  // Export to CSV
  const exportDebts = () => {
    const headers = ['Invoice', 'Customer', 'Description', 'Original', 'Paid', 'Remaining', 'Due Date', 'Status'];
    const rows = debts.map(debt => [
      debt.invoice_number,
      debt.customers?.name || 'Unknown',
      debt.description,
      debt.original_amount,
      debt.amount_paid,
      debt.remaining_amount,
      debt.due_date ? new Date(debt.due_date).toLocaleDateString() : 'Not set',
      debt.status
    ]);
    
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `debtors-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Calculate summary stats
  const totalOutstanding = debts
    .filter(d => d.status !== 'paid')
    .reduce((sum, d) => sum + d.remaining_amount, 0);
  
  const overdueDebts = debts.filter(d => d.status === 'overdue');
  const overdueTotal = overdueDebts.reduce((sum, d) => sum + d.remaining_amount, 0);
  
  const upcomingDebts = debts.filter(d => 
    d.status === 'pending' && 
    d.due_date && 
    new Date(d.due_date) > new Date() &&
    new Date(d.due_date) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  );

  const getStatusBadge = (status: Debt['status']) => {
    switch(status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'partial':
        return 'bg-yellow-100 text-yellow-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
      <div className="animate-pulse text-center">
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="mt-4 text-gray-500">Loading debtors data...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">💰 Debtors Management</h1>
            <p className="text-gray-600 text-sm mt-1">Track and manage all outstanding balances from partial payments</p>
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={exportDebts}
              className="bg-gray-600 hover:bg-gray-700 text-white font-bold px-5 py-2.5 rounded-lg flex items-center gap-2 shadow-md transition-all"
            >
              <span>📥</span> Export CSV
            </button>
            <Link
              href="/admin/sales/new"
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2.5 rounded-lg flex items-center gap-2 shadow-md transition-all transform hover:scale-105"
            >
              <span className="text-lg">➕</span>
              <span>New Sale</span>
            </Link>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-blue-500">
            <p className="text-sm text-gray-500">Total Outstanding</p>
            <p className="text-3xl font-bold text-blue-600">₦{totalOutstanding.toLocaleString()}</p>
            <p className="text-xs text-gray-400 mt-1">{debts.filter(d => d.status !== 'paid').length} active debts</p>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-red-500">
            <p className="text-sm text-gray-500">Overdue</p>
            <p className="text-3xl font-bold text-red-600">₦{overdueTotal.toLocaleString()}</p>
            <p className="text-xs text-gray-400 mt-1">{overdueDebts.length} overdue debts</p>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-yellow-500">
            <p className="text-sm text-gray-500">Due This Week</p>
            <p className="text-3xl font-bold text-yellow-600">
              ₦{upcomingDebts.reduce((sum, d) => sum + d.remaining_amount, 0).toLocaleString()}
            </p>
            <p className="text-xs text-gray-400 mt-1">{upcomingDebts.length} payments due</p>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-green-500">
            <p className="text-sm text-gray-500">Total Customers</p>
            <p className="text-3xl font-bold text-green-600">{customers.length}</p>
            <p className="text-xs text-gray-400 mt-1">with accounts</p>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white p-4 rounded-xl shadow-sm mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search by invoice, customer name, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div className="flex gap-2">
              {['all', 'pending', 'overdue', 'paid'].map((status) => (
                <button
                  key={status}
                  onClick={() => setFilter(status)}
                  className={`px-4 py-2 rounded-lg capitalize font-medium transition ${
                    filter === status 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                >
                  {status === 'all' ? 'All' : status}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Debts Table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px]">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="p-4 text-left text-sm font-semibold text-gray-600">Invoice</th>
                  <th className="p-4 text-left text-sm font-semibold text-gray-600">Customer</th>
                  <th className="p-4 text-left text-sm font-semibold text-gray-600">Description</th>
                  <th className="p-4 text-right text-sm font-semibold text-gray-600">Original</th>
                  <th className="p-4 text-right text-sm font-semibold text-gray-600">Paid</th>
                  <th className="p-4 text-right text-sm font-semibold text-gray-600">Remaining</th>
                  <th className="p-4 text-left text-sm font-semibold text-gray-600">Due Date</th>
                  <th className="p-4 text-left text-sm font-semibold text-gray-600">Status</th>
                  <th className="p-4 text-center text-sm font-semibold text-gray-600">Actions</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {debts
                  .filter(debt => 
                    debt.invoice_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    debt.customers?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    debt.customers?.phone?.includes(searchTerm)
                  )
                  .map((debt) => {
                    const dueDate = debt.due_date ? new Date(debt.due_date) : null;
                    const today = new Date();
                    const daysUntilDue = dueDate ? Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 3600 * 24)) : null;
                    
                    return (
                      <tr key={debt.id} className="hover:bg-gray-50 transition">
                        <td className="p-4">
                          <span className="font-mono text-sm font-bold text-gray-700">
                            {debt.invoice_number}
                          </span>
                          {debt.related_type && (
                            <p className="text-xs text-gray-400 mt-1 capitalize">{debt.related_type}</p>
                          )}
                        </td>
                        <td className="p-4">
                          <Link href={`/admin/debtors/customers/${debt.customer_id}`} className="hover:text-blue-600">
                            <p className="font-medium text-gray-900">{debt.customers?.name || 'Unknown'}</p>
                            <p className="text-xs text-gray-500">{debt.customers?.phone}</p>
                          </Link>
                        </td>
                        <td className="p-4">
                          <p className="text-sm text-gray-700 max-w-xs truncate">{debt.description}</p>
                          {debt.notes && (
                            <p className="text-xs text-gray-400 mt-1 truncate">{debt.notes}</p>
                          )}
                        </td>
                        <td className="p-4 text-right font-medium">₦{debt.original_amount.toLocaleString()}</td>
                        <td className="p-4 text-right text-green-600 font-medium">₦{debt.amount_paid.toLocaleString()}</td>
                        <td className="p-4 text-right font-bold text-red-600">₦{debt.remaining_amount.toLocaleString()}</td>
                        <td className="p-4">
                          {dueDate ? (
                            <div>
                              <p className={debt.status === 'overdue' ? 'text-red-600 font-bold' : 'text-gray-700'}>
                                {dueDate.toLocaleDateString()}
                              </p>
                              {debt.status === 'pending' && daysUntilDue !== null && daysUntilDue > 0 && daysUntilDue <= 7 && (
                                <p className="text-xs text-yellow-600 font-medium mt-1">
                                  Due in {daysUntilDue} days
                                </p>
                              )}
                              {debt.status === 'overdue' && (
                                <p className="text-xs text-red-500 font-bold mt-1">OVERDUE</p>
                              )}
                            </div>
                          ) : (
                            <span className="text-gray-400 text-sm">Not set</span>
                          )}
                        </td>
                        <td className="p-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusBadge(debt.status)}`}>
                            {debt.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex justify-center gap-2">
                            {debt.status !== 'paid' && (
                              <button
                                onClick={() => {
                                  setSelectedDebt(debt);
                                  setShowPaymentModal(true);
                                }}
                                disabled={updatingId === debt.id}
                                className="bg-green-100 text-green-700 px-3 py-1 rounded-lg text-xs font-bold hover:bg-green-200 transition"
                                title="Record Payment"
                              >
                                💰 Pay
                              </button>
                            )}
                            {debt.status !== 'paid' && debt.remaining_amount > 0 && (
                              <button
                                onClick={() => markAsPaid(debt)}
                                disabled={updatingId === debt.id}
                                className="bg-blue-100 text-blue-700 px-3 py-1 rounded-lg text-xs font-bold hover:bg-blue-200 transition"
                                title="Mark as Paid"
                              >
                                ✓ Mark Paid
                              </button>
                            )}
                            <Link
                              href={`/admin/debtors/${debt.id}`}
                              className="bg-gray-100 text-gray-700 px-3 py-1 rounded-lg text-xs font-bold hover:bg-gray-200 transition"
                              title="View Details"
                            >
                              👁️
                            </Link>
                            {debt.status !== 'paid' && (
                              <button
                                onClick={() => deleteDebt(debt)}
                                disabled={updatingId === debt.id}
                                className="bg-red-100 text-red-700 px-3 py-1 rounded-lg text-xs font-bold hover:bg-red-200 transition"
                                title="Delete Debt"
                              >
                                🗑️
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>

          {debts.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No debts found</p>
              <p className="text-gray-400 text-sm mt-2">When you record a partial payment, it will appear here.</p>
              <Link href="/admin/sales/new" className="text-blue-600 hover:underline mt-4 inline-block">
                Record a Sale with Partial Payment →
              </Link>
            </div>
          )}
        </div>

        {/* Customers with Outstanding Balances */}
        <div className="mt-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">👥 Customers with Outstanding Balances</h2>
            <Link href="/admin/customers" className="text-blue-600 hover:underline text-sm">
              View All Customers →
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {customers
              .map(customer => {
                const customerDebts = debts.filter(d => d.customer_id === customer.id && d.status !== 'paid');
                const totalOwed = customerDebts.reduce((sum, d) => sum + d.remaining_amount, 0);
                if (totalOwed === 0) return null;
                
                return (
                  <Link
                    key={customer.id}
                    href={`/admin/debtors/customers/${customer.id}`}
                    className="bg-white p-4 rounded-xl shadow-sm hover:shadow-md transition border border-gray-100"
                  >
                    <p className="font-bold text-gray-900">{customer.name}</p>
                    <p className="text-sm text-gray-500">{customer.phone || 'No phone'}</p>
                    <div className="mt-2 flex justify-between items-center">
                      <span className="text-xs text-gray-500">{customerDebts.length} active debt(s)</span>
                      <span className="text-red-600 font-bold">₦{totalOwed.toLocaleString()}</span>
                    </div>
                  </Link>
                );
              })
              .filter(Boolean)
              .slice(0, 6)}
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && selectedDebt && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full">
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-2">Record Payment</h2>
              <p className="text-gray-600 mb-4">
                Invoice: <span className="font-mono font-bold">{selectedDebt.invoice_number}</span>
              </p>
              
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600">Original Amount:</span>
                  <span className="font-bold">₦{selectedDebt.original_amount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600">Already Paid:</span>
                  <span className="font-bold text-green-600">₦{selectedDebt.amount_paid.toLocaleString()}</span>
                </div>
                <div className="flex justify-between pt-2 border-t">
                  <span className="font-bold">Remaining Balance:</span>
                  <span className="font-bold text-red-600">₦{selectedDebt.remaining_amount.toLocaleString()}</span>
                </div>
              </div>
              
              <form onSubmit={recordPayment} className="space-y-4">
                <div>
                  <label className="block font-medium mb-1">Payment Amount *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    max={selectedDebt.remaining_amount}
                    value={paymentForm.amount}
                    onChange={(e) => setPaymentForm({...paymentForm, amount: e.target.value})}
                    className="w-full p-2 border rounded-lg"
                    placeholder={`Max: ₦${selectedDebt.remaining_amount.toLocaleString()}`}
                  />
                </div>
                
                <div>
                  <label className="block font-medium mb-1">Payment Method</label>
                  <select
                    value={paymentForm.payment_method}
                    onChange={(e) => setPaymentForm({...paymentForm, payment_method: e.target.value})}
                    className="w-full p-2 border rounded-lg"
                  >
                    <option value="cash">💵 Cash</option>
                    <option value="transfer">📲 Bank Transfer</option>
                    <option value="pos">💳 POS</option>
                    <option value="check">📝 Check</option>
                  </select>
                </div>
                
                <div>
                  <label className="block font-medium mb-1">Payment Date</label>
                  <input
                    type="date"
                    value={paymentForm.payment_date}
                    onChange={(e) => setPaymentForm({...paymentForm, payment_date: e.target.value})}
                    className="w-full p-2 border rounded-lg"
                  />
                </div>
                
                <div>
                  <label className="block font-medium mb-1">Notes (Optional)</label>
                  <textarea
                    rows={2}
                    value={paymentForm.notes}
                    onChange={(e) => setPaymentForm({...paymentForm, notes: e.target.value})}
                    className="w-full p-2 border rounded-lg"
                    placeholder="Payment reference, receipt number, etc."
                  />
                </div>
                
                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 bg-green-600 text-white py-2 rounded-lg font-bold hover:bg-green-700 disabled:opacity-50"
                  >
                    {submitting ? 'Processing...' : 'Record Payment'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowPaymentModal(false)}
                    className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}