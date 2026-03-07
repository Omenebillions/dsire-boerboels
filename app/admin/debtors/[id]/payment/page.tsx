// app/admin/debtors/[id]/payment/page.tsx
"use client";
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function RecordPaymentPage() {
  const router = useRouter();
  const params = useParams();
  const [loading, setLoading] = useState(false);
  const [debt, setDebt] = useState<any>(null);
  
  const [formData, setFormData] = useState({
    amount: '',
    payment_date: new Date().toISOString().split('T')[0],
    payment_method: 'transfer',
    reference: '',
    notes: ''
  });

  useEffect(() => {
    fetchDebt();
  }, []);

  const fetchDebt = async () => {
    const { data } = await supabase
      .from('debts')
      .select(`
        *,
        customers (*)
      `)
      .eq('id', params.id)
      .single();
    
    setDebt(data);
    // Suggest full remaining amount
    setFormData(prev => ({ ...prev, amount: data?.remaining_amount || '' }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const paymentAmount = Number(formData.amount);
    const newRemaining = debt.remaining_amount - paymentAmount;
    const newStatus = newRemaining <= 0 ? 'paid' : 'partial';

    // Record payment
    const { error: paymentError } = await supabase.from('debt_payments').insert([{
      debt_id: debt.id,
      amount: paymentAmount,
      payment_date: formData.payment_date,
      payment_method: formData.payment_method,
      reference: formData.reference,
      notes: formData.notes
    }]);

    if (paymentError) {
      alert('Error recording payment: ' + paymentError.message);
      setLoading(false);
      return;
    }

    // Update debt
    const { error: debtError } = await supabase
      .from('debts')
      .update({
        remaining_amount: newRemaining,
        status: newStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', debt.id);

    if (debtError) {
      alert('Error updating debt: ' + debtError.message);
    } else {
      alert('Payment recorded successfully!');
      router.push(`/admin/debtors/${debt.id}`);
    }
    setLoading(false);
  };

  if (!debt) return <div>Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <h1 className="text-3xl font-bold mb-2">Record Payment</h1>
        <p className="text-gray-600 mb-6">
          Customer: {debt.customers?.name} • Remaining: ₦{debt.remaining_amount.toLocaleString()}
        </p>

        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow space-y-4">
          {/* Payment Amount */}
          <div>
            <label className="block font-medium mb-1">Payment Amount (₦) *</label>
            <input
              type="number"
              required
              value={formData.amount}
              onChange={(e) => setFormData({...formData, amount: e.target.value})}
              max={debt.remaining_amount}
              className="w-full p-2 border rounded"
            />
            <p className="text-xs text-gray-500 mt-1">
              Remaining balance: ₦{debt.remaining_amount.toLocaleString()}
            </p>
          </div>

          {/* Payment Date & Method */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-medium mb-1">Payment Date *</label>
              <input
                type="date"
                required
                value={formData.payment_date}
                onChange={(e) => setFormData({...formData, payment_date: e.target.value})}
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label className="block font-medium mb-1">Payment Method *</label>
              <select
                required
                value={formData.payment_method}
                onChange={(e) => setFormData({...formData, payment_method: e.target.value})}
                className="w-full p-2 border rounded"
              >
                <option value="cash">💵 Cash</option>
                <option value="transfer">📲 Bank Transfer</option>
                <option value="pos">💳 POS</option>
                <option value="online">🌐 Online Payment</option>
              </select>
            </div>
          </div>

          {/* Reference */}
          <div>
            <label className="block font-medium mb-1">Reference Number</label>
            <input
              type="text"
              value={formData.reference}
              onChange={(e) => setFormData({...formData, reference: e.target.value})}
              className="w-full p-2 border rounded"
              placeholder="Transaction ID or reference"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block font-medium mb-1">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              rows={3}
              className="w-full p-2 border rounded"
              placeholder="Any additional notes..."
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? 'Processing...' : 'Record Payment'}
          </button>
        </form>
      </div>
    </div>
  );
}