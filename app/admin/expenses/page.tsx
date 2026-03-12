"use client";
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

interface Expense {
  id: number;
  category: string;
  description: string;
  amount: number;
  date: string;
  receipt_url?: string;
  notes?: string;
}

export default function AdminExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [categoryFilter, setCategoryFilter] = useState('all');

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
    const startDate = new Date(selectedYear, selectedMonth, 1).toISOString().split('T')[0];
    const endDate = new Date(selectedYear, selectedMonth + 1, 0).toISOString().split('T')[0];
    
    let query = supabase.from('expenses').select('*').gte('date', startDate).lte('date', endDate);
    if (categoryFilter !== 'all') query = query.eq('category', categoryFilter);
    
    const { data } = await query.order('date', { ascending: false });
    setExpenses((data as Expense[]) || []);
    setLoading(false);
  };

  const totalExpenses = expenses.reduce((sum, exp) => sum + Number(exp.amount), 0);
  const categoryTotals = expenses.reduce((acc: any, exp) => {
    acc[exp.category] = (acc[exp.category] || 0) + Number(exp.amount);
    return acc;
  }, {});

  if (loading) return (
    <div className="min-h-screen bg-slate-50 p-10 flex items-center justify-center font-black text-slate-400 animate-pulse">
      LOADING EXPENDITURE...
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
              onClick={() => {
                const csv = expenses.map(e => `${e.date},${e.category},${e.description},${e.amount}`).join('\n');
                const blob = new Blob([`Date,Category,Description,Amount\n${csv}`], { type: 'text/csv' });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `Expenses-${selectedMonth + 1}-${selectedYear}.csv`;
                a.click();
              }}
              className="flex-1 md:flex-none bg-white border border-slate-200 text-slate-600 px-6 py-3 rounded-xl font-bold text-xs hover:bg-slate-50 transition-all uppercase tracking-widest"
            >
              Export CSV
            </button>
            <Link href="/admin/expenses/new" className="flex-1 md:flex-none bg-slate-900 text-white px-8 py-3 rounded-xl font-bold text-xs hover:bg-slate-800 transition-all shadow-lg uppercase tracking-widest text-center">
              + New Expense
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
            </div>

            <div className="bg-rose-600 p-8 rounded-3xl shadow-xl shadow-rose-100">
              <p className="text-[10px] font-black text-rose-200 uppercase tracking-widest mb-1">Total Burn</p>
              <p className="text-4xl font-black text-white">₦{totalExpenses.toLocaleString()}</p>
              <div className="mt-4 pt-4 border-t border-rose-500 flex justify-between">
                <span className="text-xs font-bold text-rose-200 uppercase">{expenses.length} Receipts</span>
              </div>
            </div>
          </div>

          {/* Breakdown Visuals */}
          <div className="lg:col-span-2 bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Category Distribution</h3>
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
            </div>
          </div>
        </div>

        {/* LEDGER TABLE */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</th>
                <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Description</th>
                <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Category</th>
                <th className="p-5 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Amount</th>
                <th className="p-5 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Proof</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {expenses.map((exp) => {
                const catInfo = categories.find(c => c.value === exp.category) || categories[7];
                return (
                  <tr key={exp.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="p-5 text-sm font-bold text-slate-600">
                      {new Date(exp.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                    </td>
                    <td className="p-5">
                      <p className="text-sm font-black text-slate-800">{exp.description}</p>
                      {exp.notes && <p className="text-[10px] text-slate-400 font-medium italic">{exp.notes}</p>}
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
                        <a href={exp.receipt_url} target="_blank" className="text-indigo-600 hover:text-indigo-800 text-xs font-black underline underline-offset-4">VIEW</a>
                      ) : (
                        <span className="text-slate-300 text-[10px] font-bold">N/A</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {expenses.length === 0 && (
            <div className="p-20 text-center">
              <p className="text-slate-300 font-black tracking-widest">NO RECORDS FOR THIS PERIOD</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}