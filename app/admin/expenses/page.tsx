// app/admin/expenses/page.tsx
"use client";
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

// Define the Expense interface
interface Expense {
  id: number;
  category: string;
  description: string;
  amount: number;
  date: string;
  receipt_url?: string;
  notes?: string;
  created_at?: string;
}

export default function AdminExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [categoryFilter, setCategoryFilter] = useState('all');

  useEffect(() => {
    fetchExpenses();
  }, [selectedMonth, selectedYear, categoryFilter]);

  const fetchExpenses = async () => {
    setLoading(true);
    
    // Date range for selected month
    const startDate = new Date(selectedYear, selectedMonth, 1);
    const endDate = new Date(selectedYear, selectedMonth + 1, 0);
    
    let query = supabase
      .from('expenses')
      .select('*')
      .gte('date', startDate.toISOString().split('T')[0])
      .lte('date', endDate.toISOString().split('T')[0]);
    
    if (categoryFilter !== 'all') {
      query = query.eq('category', categoryFilter);
    }
    
    const { data } = await query.order('date', { ascending: false });
    setExpenses((data as Expense[]) || []);
    setLoading(false);
  };

  const deleteExpense = async (id: number, description: string) => {
    if (confirm(`Delete expense: ${description}?`)) {
      await supabase.from('expenses').delete().eq('id', id);
      fetchExpenses();
    }
  };

  // Calculate totals by category
  const categoryTotals = expenses.reduce((acc: Record<string, number>, exp: Expense) => {
    const cat = exp.category;
    if (!acc[cat]) acc[cat] = 0;
    acc[cat] += exp.amount;
    return acc;
  }, {});

  const totalExpenses = expenses.reduce((sum: number, exp: Expense) => sum + exp.amount, 0);

  // Month selector
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Available years
  const currentYear = new Date().getFullYear();
  const years = [currentYear - 1, currentYear, currentYear + 1];

  const categories = [
    { value: 'food', label: '🍖 Food', color: 'bg-orange-100 text-orange-800' },
    { value: 'vaccines', label: '💉 Vaccines', color: 'bg-blue-100 text-blue-800' },
    { value: 'supplies', label: '📦 Supplies', color: 'bg-purple-100 text-purple-800' },
    { value: 'vet', label: '🏥 Vet', color: 'bg-green-100 text-green-800' },
    { value: 'marketing', label: '📢 Marketing', color: 'bg-pink-100 text-pink-800' },
    { value: 'staff', label: '👥 Staff', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'utilities', label: '💡 Utilities', color: 'bg-gray-100 text-gray-800' },
    { value: 'other', label: '📌 Other', color: 'bg-indigo-100 text-indigo-800' }
  ];

  if (loading) return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-48 mb-6"></div>
          <div className="grid grid-cols-4 gap-4 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-96 bg-gray-200 rounded"></div>
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
            <h1 className="text-3xl font-bold">📝 Expenses</h1>
            <p className="text-gray-500 text-sm mt-1">Track all business expenses</p>
          </div>
          <div className="flex gap-2">
            <Link
              href="/admin/expenses/new"
              className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 flex items-center gap-2"
            >
              <span>➕</span> Add Expense
            </Link>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-lg shadow mb-6">
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Month</label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="w-full p-2 border rounded"
              >
                {months.map((month, index) => (
                  <option key={month} value={index}>{month}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="w-full p-2 border rounded"
              >
                {years.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full p-2 border rounded"
              >
                <option value="all">All Categories</option>
                {categories.map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-6 rounded-lg shadow border-l-4 border-red-500">
            <p className="text-sm text-gray-500">Total Expenses</p>
            <p className="text-3xl font-bold text-red-600">₦{totalExpenses.toLocaleString()}</p>
            <p className="text-xs text-gray-400 mt-1">{months[selectedMonth]} {selectedYear}</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow border-l-4 border-orange-500">
            <p className="text-sm text-gray-500">Highest Category</p>
            {Object.entries(categoryTotals).length > 0 ? (
              <>
                <p className="text-2xl font-bold text-orange-600">
                  {categories.find(c => c.value === Object.entries(categoryTotals)
                    .sort((a: any, b: any) => b[1] - a[1])[0]?.[0])?.label || 'N/A'}
                </p>
                <p className="text-sm text-gray-600">
                  ₦{Math.max(...Object.values(categoryTotals)).toLocaleString()}
                </p>
              </>
            ) : (
              <p className="text-gray-400">No data</p>
            )}
          </div>

          <div className="bg-white p-6 rounded-lg shadow border-l-4 border-green-500">
            <p className="text-sm text-gray-500">Categories</p>
            <p className="text-3xl font-bold text-green-600">{Object.keys(categoryTotals).length}</p>
            <p className="text-xs text-gray-400 mt-1">Active categories</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow border-l-4 border-blue-500">
            <p className="text-sm text-gray-500">Transactions</p>
            <p className="text-3xl font-bold text-blue-600">{expenses.length}</p>
            <p className="text-xs text-gray-400 mt-1">This month</p>
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-lg font-bold mb-4">Category Breakdown</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {categories.map(cat => {
              const amount = categoryTotals[cat.value] || 0;
              const percentage = totalExpenses ? ((amount / totalExpenses) * 100).toFixed(1) : 0;
              
              return (
                <div key={cat.value} className={`p-3 rounded-lg ${cat.color}`}>
                  <p className="text-sm font-medium">{cat.label}</p>
                  <p className="text-lg font-bold">₦{amount.toLocaleString()}</p>
                  <p className="text-xs opacity-75">{percentage}% of total</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Expenses Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-3 text-left">Date</th>
                  <th className="p-3 text-left">Category</th>
                  <th className="p-3 text-left">Description</th>
                  <th className="p-3 text-right">Amount</th>
                  <th className="p-3 text-left">Notes</th>
                  <th className="p-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((expense: Expense) => {
                  const category = categories.find(c => c.value === expense.category) || categories[7];
                  
                  return (
                    <tr key={expense.id} className="border-t hover:bg-gray-50">
                      <td className="p-3">
                        {new Date(expense.date).toLocaleDateString()}
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${category.color}`}>
                          {category.label}
                        </span>
                      </td>
                      <td className="p-3 font-medium">{expense.description}</td>
                      <td className="p-3 text-right font-bold text-red-600">
                        ₦{expense.amount.toLocaleString()}
                      </td>
                      <td className="p-3 text-sm text-gray-500 max-w-xs truncate">
                        {expense.notes || '-'}
                      </td>
                      <td className="p-3">
                        <div className="flex gap-2">
                          <Link
                            href={`/admin/expenses/edit/${expense.id}`}
                            className="text-blue-600 hover:underline text-sm"
                          >
                            Edit
                          </Link>
                          <button
                            onClick={() => deleteExpense(expense.id, expense.description)}
                            className="text-red-600 hover:underline text-sm"
                          >
                            Delete
                          </button>
                          {expense.receipt_url && (
                            <a
                              href={expense.receipt_url}
                              target="_blank"
                              className="text-gray-600 hover:underline text-sm"
                            >
                              Receipt
                            </a>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-gray-50 font-bold">
                <tr>
                  <td colSpan={3} className="p-3 text-right">Total:</td>
                  <td className="p-3 text-right text-red-600">₦{totalExpenses.toLocaleString()}</td>
                  <td colSpan={2}></td>
                </tr>
              </tfoot>
            </table>
          </div>

          {expenses.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No expenses found for this period</p>
              <p className="text-gray-400 text-sm mt-1">Try adjusting your filters</p>
              <Link
                href="/admin/expenses/new"
                className="inline-block mt-4 bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800"
              >
                Add your first expense
              </Link>
            </div>
          )}
        </div>

        {/* Export Button */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={() => {
              const csv = expenses.map(e => 
                `${e.date},${e.category},${e.description},${e.amount},${e.notes || ''}`
              ).join('\n');
              
              const blob = new Blob([`Date,Category,Description,Amount,Notes\n${csv}`], { type: 'text/csv' });
              const url = window.URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `expenses-${selectedYear}-${selectedMonth + 1}.csv`;
              a.click();
            }}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 text-sm"
          >
            📥 Export CSV
          </button>
        </div>
      </div>
    </div>
  );
}