// app/puppies/reserve/[id]/page.tsx
"use client";
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import Image from 'next/image';

interface Puppy {
  id: number;
  name: string;
  price?: number;
  images?: string[];
  status: string;
}

const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "2347019996837";

// Bank account details
const BANK_DETAILS = {
  accountNumber: "0603275787",
  accountName: "Dsire Kennel",
  bankName: "GTBank"
};

export default function PuppyReservePage() {
  const router = useRouter();
  const params = useParams();
  const [puppy, setPuppy] = useState<Puppy | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [reservationComplete, setReservationComplete] = useState(false);
  const [reservationReference] = useState(`RES-${Date.now()}-${Math.random().toString(36).substring(7).toUpperCase()}`);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    notes: ''
  });

  useEffect(() => {
    fetchPuppy();
  }, []);

  const fetchPuppy = async () => {
    const { data } = await supabase
      .from('dogs')
      .select('id, name, price, images, status')
      .eq('id', params.id)
      .single();
    
    setPuppy(data);
    setLoading(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    
    // Simulate a short delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    setSubmitting(false);
    setReservationComplete(true);
  };

  const handlePaymentProof = () => {
    const message = `🔔 *NEW PUPPY RESERVATION!* 🔔%0A%0A` +
      `━━━━━━━━━━━━━━━━━━━━━%0A` +
      `📋 *RESERVATION REF:*%0A${reservationReference}%0A%0A` +
      `━━━━━━━━━━━━━━━━━━━━━%0A` +
      `🐕 *PUPPY DETAILS:*%0A` +
      `Name: ${puppy?.name}%0A` +
      `Full Price: ₦${puppy?.price?.toLocaleString() || 'Contact'}%0A` +
      `Deposit: ₦100,000%0A%0A` +
      `━━━━━━━━━━━━━━━━━━━━━%0A` +
      `👤 *CUSTOMER DETAILS:*%0A` +
      `Name: ${formData.firstName} ${formData.lastName}%0A` +
      `Phone: ${formData.phone}%0A` +
      `Email: ${formData.email}%0A%0A` +
      `━━━━━━━━━━━━━━━━━━━━━%0A` +
      `💳 *PAYMENT DETAILS:*%0A` +
      `Bank: ${BANK_DETAILS.bankName}%0A` +
      `Account: ${BANK_DETAILS.accountNumber}%0A` +
      `Name: ${BANK_DETAILS.accountName}%0A` +
      `Amount: ₦100,000%0A%0A` +
      `━━━━━━━━━━━━━━━━━━━━━%0A` +
      `✅ *ACTION REQUIRED:*%0A` +
      `Customer has reserved ${puppy?.name}. Please verify payment and mark as RESERVED in admin panel.%0A` +
      `👉 https://dsire-boerboels.vercel.app/admin/dogs`;

    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${message}`, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-2xl mx-auto px-4 animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-48 mb-6"></div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!puppy) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <h1 className="text-2xl font-bold">Puppy not found</h1>
          <Link href="/puppies" className="text-blue-600 hover:underline mt-4 block">
            ← Back to Puppies
          </Link>
        </div>
      </div>
    );
  }

  if (puppy.status !== 'available') {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <h1 className="text-2xl font-bold">Sorry, this puppy is no longer available</h1>
          <Link href="/puppies" className="text-blue-600 hover:underline mt-4 block">
            ← Back to Puppies
          </Link>
        </div>
      </div>
    );
  }

  if (reservationComplete) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-2xl mx-auto px-4">
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="bg-green-600 p-6 text-center">
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">✅</span>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Reservation Created!</h2>
              <p className="text-green-100">Ref: {reservationReference}</p>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Bank Details */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                  <span>🏦</span> Pay Your ₦100,000 Deposit
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between p-2 bg-white rounded">
                    <span className="font-medium">Bank:</span>
                    <span>{BANK_DETAILS.bankName}</span>
                  </div>
                  <div className="flex justify-between p-2 bg-white rounded">
                    <span className="font-medium">Account Number:</span>
                    <span className="font-mono font-bold">{BANK_DETAILS.accountNumber}</span>
                  </div>
                  <div className="flex justify-between p-2 bg-white rounded">
                    <span className="font-medium">Account Name:</span>
                    <span>{BANK_DETAILS.accountName}</span>
                  </div>
                  <div className="flex justify-between p-2 bg-white rounded">
                    <span className="font-medium">Amount:</span>
                    <span className="font-bold text-green-600">₦100,000</span>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-3">
                  ⚡ Use reference <span className="font-mono bg-gray-100 px-1">{reservationReference}</span> as payment description
                </p>
              </div>

              {/* WhatsApp Proof Button */}
              <button
                onClick={handlePaymentProof}
                className="w-full bg-green-600 text-white py-4 rounded-xl font-bold hover:bg-green-700 transition flex items-center justify-center gap-2 text-lg"
              >
                <span>📱</span> I've Made Payment - Send Proof
              </button>

              <p className="text-xs text-gray-400 text-center">
                You'll be redirected to WhatsApp. Please attach your payment receipt.
              </p>

              {/* Summary */}
              <div className="border-t pt-4">
                <h4 className="font-bold mb-2">Reservation Summary:</h4>
                <div className="space-y-1 text-sm">
                  <p><span className="font-medium">Puppy:</span> {puppy.name}</p>
                  <p><span className="font-medium">Deposit:</span> ₦100,000</p>
                  <p><span className="font-medium">Balance due:</span> ₦{((puppy.price || 0) - 100000).toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4">
        {/* Breadcrumb */}
        <div className="mb-6">
          <Link href="/puppies" className="text-gray-600 hover:text-black transition">
            ← Back to Puppies
          </Link>
        </div>

        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {/* Puppy Preview */}
          <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 p-6">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 bg-white/20 rounded-lg overflow-hidden">
                {puppy.images?.[0] ? (
                  <Image src={puppy.images[0]} alt={puppy.name} width={80} height={80} className="object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-3xl">🐕</div>
                )}
              </div>
              <div className="text-white">
                <h1 className="text-2xl font-bold">Reserve {puppy.name}</h1>
                <p className="opacity-90">Full price: ₦{puppy.price?.toLocaleString() || 'Contact'}</p>
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="p-6">
            <p className="text-sm text-gray-500 mb-6">
              A deposit of <span className="font-bold text-green-600">₦100,000</span> secures this puppy.
              Fill in your details to proceed.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    First Name *
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    required
                    value={formData.firstName}
                    onChange={handleInputChange}
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-yellow-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    required
                    value={formData.lastName}
                    onChange={handleInputChange}
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-yellow-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-yellow-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  name="phone"
                  required
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-yellow-500"
                  placeholder="08012345678"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes (Optional)
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-yellow-500"
                  placeholder="Any special requests?"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-yellow-600 text-white py-4 rounded-xl font-bold hover:bg-yellow-700 transition disabled:opacity-50 text-lg mt-4"
              >
                {submitting ? 'Processing...' : 'Continue'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}