// app/admin/expenses/page.tsx
"use client";
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Expense {
  id: number;
  category: string;
  description: string;
  amount: number;
  date: string;
  receipt_url?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export default function AdminExpensesPage() {
  const router = useRouter();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    category: '',
    description: '',
    amount: '',
    date: '',
    receipt_url: '',
    notes: ''
  });
  const [editing, setEditing] = useState(false);
  const [selectedExpenses, setSelectedExpenses] = useState<number[]>([]);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);

  const categories = [
    { value: 'food', label: '🍖 Food', color: 'bg-orange-50 text-orange-700 border-orange-100' },
    { value: 'vaccines', label: '💉 Vaccines', color: 'bg-blue-50 text-blue-700 border-blue-100' },
    { value: 'supplies', label: '📦 Supplies', color: 'bg-purple-50 text-purple-700 border-purple-100' },
    { value: 'vet', label: '🏥 Vet', color: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
    { value: 'marketing', label: '📢 Marketing', color: 'bg-pink-50 text-pink-700 border-pink-100' },
    { value: 'staff', label: '👥 Staff', color: 'bg-amber-50 text-amber-700 border-amber-100' },
    { value: 'utilities', label: '💡 Utilities', color: 'bg-slate-50 text-slate-700 border-slate-100' },
    { value: 'other', label: '📌 Other', color: 'bg-indigo-50 text-indigo-700 border-indigo-100' }
  ];

  useEffect(() => {
    fetchExpenses();
  }, [selectedMonth, selectedYear, categoryFilter]);

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const startDate = new Date(selectedYear, selectedMonth, 1).toISOString().split('T')[0];
      const endDate = new Date(selectedYear, selectedMonth + 1, 0).toISOString().split('T')[0];
      
      let query = supabase.from('expenses').select('*').gte('date', startDate).lte('date', endDate);
      if (categoryFilter !== 'all') query = query.eq('category', categoryFilter);
      
      const { data, error } = await query.order('date', { ascending: false });
      
      if (error) throw error;
      setExpenses((data as Expense[]) || []);
    } catch (error: any) {
      console.error('Error fetching expenses:', error);
      alert('Error loading expenses: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Delete single expense
  const deleteExpense = async () => {
    if (!selectedExpense) return;
    
    setDeleting(true);
    try {
      const { error } = await supabase.from('expenses').delete().eq('id', selectedExpense.id);
      
      if (error) throw error;
      
      alert(`✅ Expense "${selectedExpense.description}" deleted successfully!`);
      setShowDeleteModal(false);
      setSelectedExpense(null);
      fetchExpenses();
      
    } catch (error: any) {
      console.error('Error deleting expense:', error);
      alert('Error deleting expense: ' + error.message);
    } finally {
      setDeleting(false);
    }
  };

  // Bulk delete expenses
  const bulkDeleteExpenses = async () => {
    if (selectedExpenses.length === 0) return;
    
    setDeleting(true);
    try {
      const { error } = await supabase
        .from('expenses')
        .delete()
        .in('id', selectedExpenses);
      
      if (error) throw error;
      
      alert(`✅ ${selectedExpenses.length} expense(s) deleted successfully!`);
      setSelectedExpenses([]);
      setShowBulkDeleteModal(false);
      fetchExpenses();
      
    } catch (error: any) {
      console.error('Error bulk deleting expenses:', error);
      alert('Error deleting expenses: ' + error.message);
    } finally {
      setDeleting(false);
    }
  };

  // Update expense
  const updateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedExpense) return;
    
    setEditing(true);
    try {
      const updateData = {
        category: editForm.category,
        description: editForm.description,
        amount: Number(editForm.amount),
        date: editForm.date,
        receipt_url: editForm.receipt_url || null,
        notes: editForm.notes || null,
        updated_at: new Date().toISOString()
      };
      
      const { error } = await supabase
        .from('expenses')
        .update(updateData)
        .eq('id', selectedExpense.id);
      
      if (error) throw error;
      
      alert(`✅ Expense updated successfully!`);
      setShowEditModal(false);
      setSelectedExpense(null);
      fetchExpenses();
      
    } catch (error: any) {
      console.error('Error updating expense:', error);
      alert('Error updating expense: ' + error.message);
    } finally {
      setEditing(false);
    }
  };

  // Open edit modal
  const openEditModal = (expense: Expense) => {
    setSelectedExpense(expense);
    setEditForm({
      category: expense.category,
      description: expense.description,
      amount: expense.amount.toString(),
      date: expense.date,
      receipt_url: expense.receipt_url || '',
      notes: expense.notes || ''
    });
    setShowEditModal(true);
  };

  // Open delete modal
  const openDeleteModal = (expense: Expense) => {
    setSelectedExpense(expense);
    setShowDeleteModal(true);
  };

  // Toggle selection for bulk actions
  const toggleSelectExpense = (id: number) => {
    setSelectedExpenses(prev =>
      prev.includes(id)
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  };

  // Select all expenses
  const selectAll = () => {
    if (selectedExpenses.length === filteredExpenses.length) {
      setSelectedExpenses([]);
    } else {
      setSelectedExpenses(filteredExpenses.map(e => e.id));
    }
  };

  // Export to CSV
  const exportToCSV = () => {
    const headers = ['Date', 'Category', 'Description', 'Amount', 'Notes'];
    const rows = filteredExpenses.map(e => [
      e.date,
      categories.find(c => c.value === e.category)?.label || e.category,
      e.description,
      e.amount,
      e.notes || ''
    ]);
    
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `expenses-${selectedYear}-${selectedMonth + 1}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const totalExpenses = expenses.reduce((sum, exp) => sum + Number(exp.amount), 0);
  const categoryTotals = expenses.reduce((acc: any, exp) => {
    acc[exp.category] = (acc[exp.category] || 0) + Number(exp.amount);
    return acc;
  }, {});

  // Filter by search term
  const filteredExpenses = expenses.filter(exp =>
    exp.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    exp.notes?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return (
    <div className="min-h-screen bg-slate-50 p-10 flex items-center justify-center">
      <div className="animate-pulse text-center">
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="mt-4 text-gray-500 font-medium">Loading expenses...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-7xl mx-auto">
        
        {/* HEADER */}
        <header className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">EXPENSES</h1>
            <p className="text-slate-500 font-medium">Monthly Operational Overhead</p>
          </div>
          <div className="flex gap-3 w-full md:w-auto">
            <button 
              onClick={exportToCSV}
              className="flex-1 md:flex-none bg-white border border-slate-200 text-slate-600 px-6 py-3 rounded-xl font-bold text-xs hover:bg-slate-50 transition-all uppercase tracking-widest"
            >
              📥 Export CSV
            </button>
            <Link 
              href="/admin/expenses/new" 
              className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black text-xs transition-all shadow-lg flex items-center gap-2 transform hover:scale-105 uppercase tracking-widest"
            >
              <span className="text-base">➕</span>
              New Expense
            </Link>
          </div>
        </header>

        {/* FILTERS & SUMMARY */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          
          {/* Controls */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Timeframe Filter</h3>
              <div className="grid grid-cols-2 gap-3">
                <select 
                  value={selectedMonth} 
                  onChange={(e) => setSelectedMonth(Number(e.target.value))}
                  className="bg-slate-50 border-none rounded-xl font-bold text-slate-700 p-3 focus:ring-2 focus:ring-slate-200"
                >
                  {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((m, i) => (
                    <option key={m} value={i}>{m}</option>
                  ))}
                </select>
                <select 
                  value={selectedYear} 
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="bg-slate-50 border-none rounded-xl font-bold text-slate-700 p-3 focus:ring-2 focus:ring-slate-200"
                >
                  {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
              <select 
                value={categoryFilter} 
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full mt-3 bg-slate-50 border-none rounded-xl font-bold text-slate-700 p-3 focus:ring-2 focus:ring-slate-200"
              >
                <option value="all">All Categories</option>
                {categories.map(cat => <option key={cat.value} value={cat.value}>{cat.label}</option>)}
              </select>
              <div className="mt-4">
                <input
                  type="text"
                  placeholder="Search by description or notes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full p-3 bg-slate-50 border-none rounded-xl font-medium text-slate-700 focus:ring-2 focus:ring-slate-200"
                />
              </div>
            </div>

            <div className="bg-rose-600 p-8 rounded-3xl shadow-xl shadow-rose-100">
              <p className="text-[10px] font-black text-rose-200 uppercase tracking-widest mb-1">Total Burn</p>
              <p className="text-4xl font-black text-white">₦{totalExpenses.toLocaleString()}</p>
              <div className="mt-4 pt-4 border-t border-rose-500 flex justify-between">
                <span className="text-xs font-bold text-rose-200 uppercase">{expenses.length} Receipts</span>
                {selectedExpenses.length > 0 && (
                  <button
                    onClick={() => setShowBulkDeleteModal(true)}
                    className="text-xs font-bold bg-white/20 hover:bg-white/30 text-white px-3 py-1 rounded-lg transition"
                  >
                    Delete {selectedExpenses.length}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Breakdown Visuals */}
          <div className="lg:col-span-2 bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Category Distribution</h3>
              <button
                onClick={selectAll}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium"
              >
                {selectedExpenses.length === filteredExpenses.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {categories.map(cat => {
                const amount = categoryTotals[cat.value] || 0;
                const percent = totalExpenses ? (amount / totalExpenses) * 100 : 0;
                if (amount === 0) return null;
                return (
                  <div key={cat.value} className={`p-4 rounded-2xl border ${cat.color} flex justify-between items-center`}>
                    <div>
                      <p className="text-[10px] font-black uppercase opacity-60 mb-1">{cat.label}</p>
                      <p className="text-lg font-black tracking-tight">₦{amount.toLocaleString()}</p>
                    </div>
                    <div className="text-right font-black text-xl opacity-20">{percent.toFixed(0)}%</div>
                  </div>
                );
              })}
              {Object.keys(categoryTotals).length === 0 && (
                <div className="col-span-2 text-center py-8 text-gray-400">
                  No expenses for this period
                </div>
              )}
            </div>
          </div>
        </div>

        {/* LEDGER TABLE */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px] text-left">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="p-5 w-10">
                    <input
                      type="checkbox"
                      checked={selectedExpenses.length === filteredExpenses.length && filteredExpenses.length > 0}
                      onChange={selectAll}
                      className="w-4 h-4"
                    />
                  </th>
                  <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</th>
                  <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Description</th>
                  <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Category</th>
                  <th className="p-5 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Amount</th>
                  <th className="p-5 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Proof</th>
                  <th className="p-5 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Actions</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredExpenses.map((exp) => {
                  const catInfo = categories.find(c => c.value === exp.category) || categories[7];
                  return (
                    <tr key={exp.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="p-5">
                        <input
                          type="checkbox"
                          checked={selectedExpenses.includes(exp.id)}
                          onChange={() => toggleSelectExpense(exp.id)}
                          className="w-4 h-4"
                        />
                      </td>
                      <td className="p-5 text-sm font-bold text-slate-600">
                        {new Date(exp.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                      </td>
                      <td className="p-5">
                        <p className="text-sm font-black text-slate-800">{exp.description}</p>
                        {exp.notes && <p className="text-[10px] text-slate-400 font-medium italic mt-1">{exp.notes}</p>}
                      </td>
                      <td className="p-5">
                        <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase border ${catInfo.color}`}>
                          {catInfo.label}
                        </span>
                      </td>
                      <td className="p-5 text-right font-black text-rose-600">
                        ₦{exp.amount.toLocaleString()}
                      </td>
                      <td className="p-5 text-center">
                        {exp.receipt_url ? (
                          <a 
                            href={exp.receipt_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-indigo-600 hover:text-indigo-800 text-xs font-black underline underline-offset-4"
                          >
                            VIEW
                          </a>
                        ) : (
                          <span className="text-slate-300 text-[10px] font-bold">N/A</span>
                        )}
                      </td>
                      <td className="p-5 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => openEditModal(exp)}
                            className="text-blue-600 hover:text-blue-800 text-xs font-black px-2 py-1 rounded hover:bg-blue-50 transition"
                            title="Edit Expense"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => openDeleteModal(exp)}
                            className="text-red-600 hover:text-red-800 text-xs font-black px-2 py-1 rounded hover:bg-red-50 transition"
                            title="Delete Expense"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {filteredExpenses.length === 0 && (
            <div className="p-20 text-center">
              <p className="text-slate-300 font-black tracking-widest">NO RECORDS FOR THIS PERIOD</p>
              <Link href="/admin/expenses/new" className="text-blue-600 hover:underline mt-4 inline-block">
                Add your first expense →
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* EDIT MODAL */}
      {showEditModal && selectedExpense && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-2">Edit Expense</h2>
              <p className="text-gray-600 mb-4">Update expense details</p>
              
              <form onSubmit={updateExpense} className="space-y-4">
                <div>
                  <label className="block font-medium mb-1">Category *</label>
                  <select
                    required
                    value={editForm.category}
                    onChange={(e) => setEditForm({...editForm, category: e.target.value})}
                    className="w-full p-2 border rounded-lg"
                  >
                    {categories.map(cat => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block font-medium mb-1">Description *</label>
                  <input
                    type="text"
                    required
                    value={editForm.description}
                    onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                    className="w-full p-2 border rounded-lg"
                    placeholder="What was this expense for?"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-medium mb-1">Amount (₦) *</label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="0.01"
                      value={editForm.amount}
                      onChange={(e) => setEditForm({...editForm, amount: e.target.value})}
                      className="w-full p-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block font-medium mb-1">Date *</label>
                    <input
                      type="date"
                      required
                      value={editForm.date}
                      onChange={(e) => setEditForm({...editForm, date: e.target.value})}
                      className="w-full p-2 border rounded-lg"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block font-medium mb-1">Receipt URL</label>
                  <input
                    type="url"
                    value={editForm.receipt_url}
                    onChange={(e) => setEditForm({...editForm, receipt_url: e.target.value})}
                    className="w-full p-2 border rounded-lg"
                    placeholder="https://..."
                  />
                </div>
                
                <div>
                  <label className="block font-medium mb-1">Notes</label>
                  <textarea
                    rows={3}
                    value={editForm.notes}
                    onChange={(e) => setEditForm({...editForm, notes: e.target.value})}
                    className="w-full p-2 border rounded-lg"
                    placeholder="Additional details..."
                  />
                </div>
                
                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={editing}
                    className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-bold hover:bg-blue-700 disabled:opacity-50"
                  >
                    {editing ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
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

      {/* DELETE SINGLE MODAL */}
      {showDeleteModal && selectedExpense && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full">
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-2 text-red-600">Delete Expense</h2>
              <p className="text-gray-600 mb-4">Are you sure you want to delete this expense?</p>
              
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <p><strong>Description:</strong> {selectedExpense.description}</p>
                <p><strong>Amount:</strong> ₦{selectedExpense.amount.toLocaleString()}</p>
                <p><strong>Date:</strong> {new Date(selectedExpense.date).toLocaleDateString()}</p>
              </div>
              
              <div className="bg-red-50 p-3 rounded-lg mb-4">
                <p className="text-sm text-red-800">
                  ⚠️ This action cannot be undone. The expense will be permanently removed.
                </p>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={deleteExpense}
                  disabled={deleting}
                  className="flex-1 bg-red-600 text-white py-2 rounded-lg font-bold hover:bg-red-700 disabled:opacity-50"
                >
                  {deleting ? 'Deleting...' : 'Yes, Delete Expense'}
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

      {/* BULK DELETE MODAL */}
      {showBulkDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full">
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-2 text-red-600">Delete Multiple Expenses</h2>
              <p className="text-gray-600 mb-4">Are you sure you want to delete {selectedExpenses.length} expense(s)?</p>
              
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <p><strong>Selected:</strong> {selectedExpenses.length} expense(s)</p>
                <p><strong>Total Amount:</strong> ₦{selectedExpenses.reduce((sum, id) => {
                  const exp = expenses.find(e => e.id === id);
                  return sum + (exp?.amount || 0);
                }, 0).toLocaleString()}</p>
              </div>
              
              <div className="bg-red-50 p-3 rounded-lg mb-4">
                <p className="text-sm text-red-800">
                  ⚠️ This action cannot be undone. All selected expenses will be permanently removed.
                </p>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={bulkDeleteExpenses}
                  disabled={deleting}
                  className="flex-1 bg-red-600 text-white py-2 rounded-lg font-bold hover:bg-red-700 disabled:opacity-50"
                >
                  {deleting ? 'Deleting...' : `Delete ${selectedExpenses.length} Expense(s)`}
                </button>
                <button
                  onClick={() => setShowBulkDeleteModal(false)}
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