// app/admin/debtors/page.tsx
"use client";
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

// Define types
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
  customers?: Customer;
}

export default function DebtorsPage() {
  const [debts, setDebts] = useState<Debt[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchData();
  }, [filter]);

  const fetchData = async () => {
    setLoading(true);
    
    // Fetch customers
    const { data: customersData } = await supabase
      .from('customers')
      .select('*')
      .order('name');
    
    setCustomers((customersData as Customer[]) || []);

    // Fetch debts with filters
    let query = supabase
      .from('debts')
      .select(`
        *,
        customers (*)
      `)
      .order('due_date', { ascending: true });
    
    if (filter === 'pending') {
      query = query.in('status', ['pending', 'partial']);
    } else if (filter === 'overdue') {
      query = query.lt('due_date', new Date().toISOString().split('T')[0])
                   .in('status', ['pending', 'partial']);
    } else if (filter === 'paid') {
      query = query.eq('status', 'paid');
    }
    
    const { data: debtsData } = await query;
    setDebts((debtsData as Debt[]) || []);
    setLoading(false);
  };

  // Calculate summary stats
  const totalOutstanding = debts
    .filter(d => d.status !== 'paid')
    .reduce((sum, d) => sum + d.remaining_amount, 0);
  
  const overdueDebts = debts.filter(d => 
    d.status !== 'paid' && 
    new Date(d.due_date) < new Date()
  );
  
  const overdueTotal = overdueDebts.reduce((sum, d) => sum + d.remaining_amount, 0);
  
  const upcomingDebts = debts.filter(d => 
    d.status !== 'paid' && 
    new Date(d.due_date) > new Date() &&
    new Date(d.due_date) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  );

  if (loading) return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-64 mb-6"></div>
          <div className="grid grid-cols-4 gap-4 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold">💰 Debts & Debtors</h1>
            <p className="text-gray-500 text-sm mt-1">Track who owes you money</p>
          </div>
          <div className="flex gap-2">
            <Link
              href="/admin/debtors/new"
              className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 flex items-center gap-2"
            >
              <span>➕</span> New Debt
            </Link>
            <Link
              href="/admin/debtors/customers/new"
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <span>👤</span> New Customer
            </Link>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-6 rounded-lg shadow border-l-4 border-blue-500">
            <p className="text-sm text-gray-500">Total Outstanding</p>
            <p className="text-3xl font-bold text-blue-600">₦{totalOutstanding.toLocaleString()}</p>
            <p className="text-xs text-gray-400 mt-1">{debts.filter(d => d.status !== 'paid').length} active debts</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow border-l-4 border-red-500">
            <p className="text-sm text-gray-500">Overdue</p>
            <p className="text-3xl font-bold text-red-600">₦{overdueTotal.toLocaleString()}</p>
            <p className="text-xs text-gray-400 mt-1">{overdueDebts.length} overdue debts</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow border-l-4 border-yellow-500">
            <p className="text-sm text-gray-500">Due This Week</p>
            <p className="text-3xl font-bold text-yellow-600">
              ₦{upcomingDebts.reduce((sum, d) => sum + d.remaining_amount, 0).toLocaleString()}
            </p>
            <p className="text-xs text-gray-400 mt-1">{upcomingDebts.length} payments due</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow border-l-4 border-green-500">
            <p className="text-sm text-gray-500">Total Customers</p>
            <p className="text-3xl font-bold text-green-600">{customers.length}</p>
            <p className="text-xs text-gray-400 mt-1">with active accounts</p>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white p-4 rounded-lg shadow mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search by customer name or invoice..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full p-2 border rounded"
              />
            </div>
            <div className="flex gap-2">
              {['all', 'pending', 'overdue', 'paid'].map((status) => (
                <button
                  key={status}
                  onClick={() => setFilter(status)}
                  className={`px-4 py-2 rounded-lg capitalize ${
                    filter === status 
                      ? 'bg-black text-white' 
                      : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Debts Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-3 text-left">Customer</th>
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
                {debts
                  .filter(debt => 
                    debt.customers?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    debt.invoice_number?.toLowerCase().includes(searchTerm.toLowerCase())
                  )
                  .map((debt: Debt) => {
                    const isOverdue = new Date(debt.due_date) < new Date() && debt.status !== 'paid';
                    const dueDate = new Date(debt.due_date);
                    const today = new Date();
                    const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 3600 * 24));
                    
                    return (
                      <tr key={debt.id} className="border-t hover:bg-gray-50">
                        <td className="p-3">
                          <div>
                            <p className="font-medium">{debt.customers?.name}</p>
                            <p className="text-xs text-gray-500">{debt.customers?.phone}</p>
                          </div>
                        </td>
                        <td className="p-3 font-mono text-sm">{debt.invoice_number || '-'}</td>
                        <td className="p-3 max-w-xs">
                          <p className="truncate">{debt.description}</p>
                          <p className="text-xs text-gray-500">{debt.related_to}</p>
                        </td>
                        <td className="p-3 text-right">₦{debt.original_amount.toLocaleString()}</td>
                        <td className="p-3 text-right font-bold text-red-600">
                          ₦{debt.remaining_amount.toLocaleString()}
                        </td>
                        <td className="p-3">
                          <div>
                            <p className={isOverdue ? 'text-red-600 font-bold' : ''}>
                              {dueDate.toLocaleDateString()}
                            </p>
                            {!isOverdue && debt.status !== 'paid' && (
                              <p className="text-xs text-gray-500">
                                {daysUntilDue === 0 ? 'Today' : `${daysUntilDue} days left`}
                              </p>
                            )}
                            {isOverdue && (
                              <p className="text-xs text-red-500 font-bold">OVERDUE</p>
                            )}
                          </div>
                        </td>
                        <td className="p-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            debt.status === 'paid' ? 'bg-green-100 text-green-800' :
                            debt.status === 'partial' ? 'bg-yellow-100 text-yellow-800' :
                            debt.status === 'overdue' ? 'bg-red-100 text-red-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {debt.status}
                          </span>
                        </td>
                        <td className="p-3">
                          <div className="flex gap-2">
                            <Link
                              href={`/admin/debtors/${debt.id}`}
                              className="text-blue-600 hover:underline text-sm"
                            >
                              View
                            </Link>
                            <Link
                              href={`/admin/debtors/${debt.id}/payment`}
                              className="text-green-600 hover:underline text-sm"
                            >
                              Payment
                            </Link>
                            <button
                              onClick={() => alert('Send reminder - coming soon')}
                              className="text-yellow-600 hover:underline text-sm"
                              title="Send payment reminder"
                            >
                              🔔
                            </button>
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
              <Link href="/admin/debtors/new" className="text-blue-600 hover:underline mt-2 block">
                Create your first debt record
              </Link>
            </div>
          )}
        </div>

        {/* Customers Overview */}
        <div className="mt-8">
          <h2 className="text-xl font-bold mb-4">👥 Customers Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {customers.slice(0, 6).map((customer: Customer) => {
              const customerDebts = debts.filter(d => d.customer_id === customer.id);
              const totalOwed = customerDebts.reduce((sum, d) => sum + d.remaining_amount, 0);
              
              return (
                <Link
                  key={customer.id}
                  href={`/admin/debtors/customers/${customer.id}`}
                  className="bg-white p-4 rounded-lg shadow hover:shadow-md transition"
                >
                  <p className="font-bold">{customer.name}</p>
                  <p className="text-sm text-gray-500">{customer.phone || 'No phone'}</p>
                  <div className="mt-2 flex justify-between items-center">
                    <span className="text-xs text-gray-500">{customerDebts.length} debts</span>
                    {totalOwed > 0 && (
                      <span className="text-red-600 font-bold">₦{totalOwed.toLocaleString()}</span>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
          {customers.length > 6 && (
            <div className="text-center mt-4">
              <Link href="/admin/debtors/customers" className="text-blue-600 hover:underline">
                View all {customers.length} customers →
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}