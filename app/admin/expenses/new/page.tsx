// app/admin/expenses/new/page.tsx
"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function NewExpensePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    category: 'supplies',
    description: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    notes: '',
    receipt_url: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.from('expenses').insert([{
      category: formData.category,
      description: formData.description,
      amount: Number(formData.amount),
      date: formData.date,
      notes: formData.notes,
      receipt_url: formData.receipt_url || null
    }]);

    if (error) {
      alert('Error adding expense: ' + error.message);
    } else {
      alert('Expense added successfully!');
      router.push('/admin/expenses');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <h1 className="text-3xl font-bold mb-6">Add New Expense</h1>

        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow space-y-4">
          {/* Category */}
          <div>
            <label className="block font-medium mb-1">Category *</label>
            <select
              required
              value={formData.category}
              onChange={(e) => setFormData({...formData, category: e.target.value})}
              className="w-full p-2 border rounded"
            >
              <option value="food">🍖 Food</option>
              <option value="vaccines">💉 Vaccines</option>
              <option value="supplies">📦 Supplies</option>
              <option value="vet">🏥 Vet</option>
              <option value="marketing">📢 Marketing</option>
              <option value="staff">👥 Staff</option>
              <option value="utilities">💡 Utilities</option>
              <option value="other">📌 Other</option>
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block font-medium mb-1">Description *</label>
            <input
              type="text"
              required
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="w-full p-2 border rounded"
              placeholder="e.g., Dog food for March, Vet checkup, etc."
            />
          </div>

          {/* Amount & Date */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-medium mb-1">Amount (₦) *</label>
              <input
                type="number"
                required
                value={formData.amount}
                onChange={(e) => setFormData({...formData, amount: e.target.value})}
                className="w-full p-2 border rounded"
                placeholder="5000"
              />
            </div>
            <div>
              <label className="block font-medium mb-1">Date *</label>
              <input
                type="date"
                required
                value={formData.date}
                onChange={(e) => setFormData({...formData, date: e.target.value})}
                className="w-full p-2 border rounded"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block font-medium mb-1">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              rows={3}
              className="w-full p-2 border rounded"
              placeholder="Additional details..."
            />
          </div>

          {/* Receipt URL */}
          <div>
            <label className="block font-medium mb-1">Receipt URL (optional)</label>
            <input
              type="url"
              value={formData.receipt_url}
              onChange={(e) => setFormData({...formData, receipt_url: e.target.value})}
              className="w-full p-2 border rounded"
              placeholder="https://..."
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black text-white py-3 rounded-lg hover:bg-gray-800 disabled:opacity-50"
          >
            {loading ? 'Adding...' : 'Add Expense'}
          </button>
        </form>
      </div>
    </div>
  );
}