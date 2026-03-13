"use client";
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

interface Customer {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  type?: string;
  notes?: string;
  created_at: string;
}

interface Debt {
  id: number;
  invoice_number?: string;
  description: string;
  original_amount: number;
  remaining_amount: number;
  due_date: string;
  status: string;
  related_to?: string;
  created_at: string;
}

export default function CustomerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCustomerData();
  }, []);

  const fetchCustomerData = async () => {
    setLoading(true);
    
    // Fetch customer details
    const { data: customerData } = await supabase
      .from('customers')
      .select('*')
      .eq('id', params.id)
      .single();
    
    setCustomer(customerData);

    // Fetch customer's debts
    const { data: debtsData } = await supabase
      .from('debts')
      .select('*')
      .eq('customer_id', params.id)
      .order('due_date', { ascending: true });
    
    setDebts(debtsData || []);
    setLoading(false);
  };

  const totalOwed = debts.reduce((sum, d) => sum + d.remaining_amount, 0);
  const totalOriginal = debts.reduce((sum, d) => sum + d.original_amount, 0);
  const totalPaid = totalOriginal - totalOwed;

  if (loading) return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-48 mb-6"></div>
        <div className="h-64 bg-gray-200 rounded"></div>
      </div>
    </div>
  );

  if (!customer) return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto text-center">
        <p className="text-gray-500 text-lg">Customer not found</p>
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
        <div className="mb-6">
          <Link href="/admin/debtors" className="text-blue-600 hover:underline text-sm">
            ← Back to Debtors
          </Link>
        </div>

        {/* Customer Profile */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h1 className="text-2xl font-bold mb-4">{customer.name}</h1>
          
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-gray-500">Email</p>
              <p className="font-medium">{customer.email || 'N/A'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Phone</p>
              <p className="font-medium">{customer.phone || 'N/A'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Customer Since</p>
              <p className="font-medium">{new Date(customer.created_at).toLocaleDateString()}</p>
            </div>
            {customer.address && (
              <div className="md:col-span-3">
                <p className="text-xs text-gray-500">Address</p>
                <p className="font-medium">{customer.address}</p>
              </div>
            )}
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <p className="text-xs text-gray-500">Total Owed</p>
            <p className="text-2xl font-bold text-red-600">₦{totalOwed.toLocaleString()}</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <p className="text-xs text-gray-500">Total Paid</p>
            <p className="text-2xl font-bold text-green-600">₦{totalPaid.toLocaleString()}</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <p className="text-xs text-gray-500">Active Debts</p>
            <p className="text-2xl font-bold text-gray-900">{debts.filter(d => d.status !== 'paid').length}</p>
          </div>
        </div>

        {/* Debts Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b bg-gray-50">
            <h2 className="font-bold">Debt History</h2>
          </div>
          
          {debts.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No debts for this customer
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-3 text-left">Invoice</th>
                  <th className="p-3 text-left">Description</th>
                  <th className="p-3 text-right">Original</th>
                  <th className="p-3 text-right">Remaining</th>
                  <th className="p-3 text-left">Due Date</th>
                  <th className="p-3 text-left">Status</th>
                  <th className="p-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {debts.map((debt) => (
                  <tr key={debt.id} className="border-t hover:bg-gray-50">
                    <td className="p-3 font-mono text-sm">{debt.invoice_number || '-'}</td>
                    <td className="p-3">
                      <p className="font-medium">{debt.description}</p>
                      {debt.related_to && <p className="text-xs text-gray-500">{debt.related_to}</p>}
                    </td>
                    <td className="p-3 text-right">₦{debt.original_amount.toLocaleString()}</td>
                    <td className="p-3 text-right font-bold text-red-600">₦{debt.remaining_amount.toLocaleString()}</td>
                    <td className="p-3">
                      <span className={new Date(debt.due_date) < new Date() && debt.status !== 'paid' ? 'text-red-600' : ''}>
                        {new Date(debt.due_date).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        debt.status === 'paid' ? 'bg-green-100 text-green-800' :
                        debt.status === 'partial' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {debt.status}
                      </span>
                    </td>
                    <td className="p-3">
                      <Link
                        href={`/admin/debtors/${debt.id}`}
                        className="text-blue-600 hover:underline text-sm"
                      >
                        View
                      </Link>
                    </td>
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