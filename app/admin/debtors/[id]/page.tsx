"use client";
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

interface DebtDetail {
  id: number;
  customer_id: number;
  invoice_number?: string;
  description: string;
  original_amount: number;
  remaining_amount: number;
  due_date: string;
  status: string;
  related_to?: string;
  related_item_id?: number;
  notes?: string;
  created_at: string;
  customers?: {
    id: number;
    name: string;
    email?: string;
    phone?: string;
  };
}

interface Payment {
  id: number;
  debt_id: number;
  amount: number;
  payment_date: string;
  payment_method: string;
  reference?: string;
  notes?: string;
  created_at: string;
}

export default function DebtDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [debt, setDebt] = useState<DebtDetail | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchDebtData();
  }, []);

  const fetchDebtData = async () => {
    setLoading(true);
    
    // Fetch debt details with customer
    const { data: debtData } = await supabase
      .from('debts')
      .select(`
        *,
        customers (*)
      `)
      .eq('id', params.id)
      .single();
    
    setDebt(debtData);

    // Fetch payment history
    const { data: paymentsData } = await supabase
      .from('debt_payments')
      .select('*')
      .eq('debt_id', params.id)
      .order('payment_date', { ascending: false });
    
    setPayments(paymentsData || []);
    setLoading(false);
  };

  const updateStatus = async (newStatus: string) => {
    if (!debt) return;
    setUpdating(true);
    
    const { error } = await supabase
      .from('debts')
      .update({ status: newStatus })
      .eq('id', debt.id);

    if (!error) {
      setDebt({ ...debt, status: newStatus });
    }
    setUpdating(false);
  };

  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);

  if (loading) return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-48 mb-6"></div>
        <div className="h-64 bg-gray-200 rounded"></div>
      </div>
    </div>
  );

  if (!debt) return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto text-center">
        <p className="text-gray-500 text-lg">Debt not found</p>
        <Link href="/admin/debtors" className="text-blue-600 hover:underline mt-4 block">
          ← Back to Debtors
        </Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex justify-between items-center">
          <Link href="/admin/debtors" className="text-blue-600 hover:underline text-sm">
            ← Back to Debtors
          </Link>
          <div className="flex gap-2">
            <Link
              href={`/admin/debtors/${debt.id}/payment`}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-bold"
            >
              + Record Payment
            </Link>
          </div>
        </div>

        {/* Debt Overview */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h1 className="text-2xl font-bold mb-4">Debt Details</h1>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <p className="text-xs text-gray-500">Customer</p>
              <Link href={`/admin/debtors/customers/${debt.customer_id}`} className="text-lg font-bold text-blue-600 hover:underline">
                {debt.customers?.name}
              </Link>
              <p className="text-sm text-gray-600">{debt.customers?.phone}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Invoice Number</p>
              <p className="text-lg font-mono font-bold">{debt.invoice_number || 'N/A'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Description</p>
              <p className="font-medium">{debt.description}</p>
              {debt.related_to && <p className="text-sm text-gray-500 mt-1">Related: {debt.related_to}</p>}
            </div>
            <div>
              <p className="text-xs text-gray-500">Due Date</p>
              <p className={`font-bold ${new Date(debt.due_date) < new Date() && debt.status !== 'paid' ? 'text-red-600' : ''}`}>
                {new Date(debt.due_date).toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Financial Summary */}
          <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t">
            <div>
              <p className="text-xs text-gray-500">Original Amount</p>
              <p className="text-xl font-bold text-gray-900">₦{debt.original_amount.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Total Paid</p>
              <p className="text-xl font-bold text-green-600">₦{totalPaid.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Remaining</p>
              <p className="text-xl font-bold text-red-600">₦{(debt.original_amount - totalPaid).toLocaleString()}</p>
            </div>
          </div>

          {/* Status Update */}
          <div className="mt-6 pt-6 border-t flex items-center gap-4">
            <p className="text-sm font-medium">Status:</p>
            <select
              value={debt.status}
              onChange={(e) => updateStatus(e.target.value)}
              disabled={updating}
              className={`border rounded-lg px-3 py-1.5 text-sm font-medium ${
                debt.status === 'paid' ? 'bg-green-50 text-green-700' :
                debt.status === 'partial' ? 'bg-yellow-50 text-yellow-700' :
                'bg-gray-50 text-gray-700'
              }`}
            >
              <option value="pending">Pending</option>
              <option value="partial">Partial</option>
              <option value="paid">Paid</option>
            </select>
          </div>
        </div>

        {/* Payment History */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b bg-gray-50">
            <h2 className="font-bold">Payment History</h2>
          </div>
          
          {payments.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No payments recorded yet
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-3 text-left">Date</th>
                  <th className="p-3 text-left">Amount</th>
                  <th className="p-3 text-left">Method</th>
                  <th className="p-3 text-left">Reference</th>
                  <th className="p-3 text-left">Notes</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment) => (
                  <tr key={payment.id} className="border-t hover:bg-gray-50">
                    <td className="p-3">{new Date(payment.payment_date).toLocaleDateString()}</td>
                    <td className="p-3 font-bold text-green-600">₦{payment.amount.toLocaleString()}</td>
                    <td className="p-3 capitalize">{payment.payment_method}</td>
                    <td className="p-3 font-mono text-sm">{payment.reference || '-'}</td>
                    <td className="p-3 text-sm text-gray-500">{payment.notes || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}