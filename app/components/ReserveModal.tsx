// This is a conceptual example for your ReserveModal component
"use client";
import { useState } from 'react';
import { supabase } from '@/lib/supabase';

interface ReserveModalProps {
  puppyId: number;
  puppyName: string;
  puppyPrice: number;
  onClose: () => void;
}

export default function ReserveModal({ puppyId, puppyName, puppyPrice, onClose }: ReserveModalProps) {
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const depositAmount = 100000; // Fixed deposit

  const handleBankTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    // 1. Save the reservation to Supabase with 'pending' status
    const { error } = await supabase.from('sales').insert({
      item_type: 'dog',
      item_id: puppyId,
      customer_name: customerName,
      customer_phone: customerPhone,
      sale_price: puppyPrice,
      deposit_amount: depositAmount,
      payment_status: 'pending',
      payment_method: 'transfer'
    });

    if (!error) {
      // 2. Show the bank details to the customer
      alert(`Please transfer ₦${depositAmount.toLocaleString()} to:\n\nAccount Name: Dsire Boerboels\nAccount Number: 0123456789\nBank: GTBank\n\nAfter payment, send a message to our WhatsApp with the receipt.`);
      // 3. Optionally update the puppy status to 'reserved' in the 'dogs' table
      await supabase.from('dogs').update({ status: 'reserved' }).eq('id', puppyId);
    }
    setIsProcessing(false);
    onClose();
  };

  const handlePaystackPayment = () => {
    // This would initialize Paystack's inline checkout
    alert('Paystack integration will go here. It will open a secure payment popup.');
    // On successful payment, you'd call a function to update the DB.
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <h2 className="text-2xl font-bold mb-4">Reserve {puppyName}</h2>
        <p className="mb-4">A deposit of <span className="font-bold text-green-600">₦{depositAmount.toLocaleString()}</span> secures this puppy.</p>
        
        <form onSubmit={handleBankTransfer} className="space-y-4">
          <input type="text" placeholder="Your Full Name" required className="w-full p-2 border rounded" value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
          <input type="tel" placeholder="Your Phone Number" required className="w-full p-2 border rounded" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} />
          
          <div className="flex gap-2">
            <button type="submit" disabled={isProcessing} className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700">
              Pay via Transfer
            </button>
            <button type="button" onClick={handlePaystackPayment} className="flex-1 bg-green-600 text-white py-2 rounded hover:bg-green-700">
              Pay with Paystack
            </button>
          </div>
          <button type="button" onClick={onClose} className="w-full text-gray-500 text-sm mt-2">Cancel</button>
        </form>
      </div>
    </div>
  );
}