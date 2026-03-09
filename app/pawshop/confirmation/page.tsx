// app/pawshop/confirmation/page.tsx
"use client";
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "2347019996837";

export default function ConfirmationPage() {
  const router = useRouter();
  const [orderNumber, setOrderNumber] = useState('');
  const [countdown, setCountdown] = useState(10);

  useEffect(() => {
    // Generate a random order number
    setOrderNumber(`DS-${Math.random().toString(36).substring(2, 10).toUpperCase()}`);
    
    // Redirect to home after 10 seconds
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          router.push('/');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [router]);

  const handleWhatsApp = () => {
    const message = `Hello! I just placed an order (${orderNumber}). I have a question about my order.`;
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-16">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {/* Success Header */}
          <div className="bg-green-600 p-8 text-center">
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Order Confirmed! 🎉</h1>
            <p className="text-green-100">Thank you for your purchase</p>
          </div>

          {/* Order Details */}
          <div className="p-8">
            <div className="text-center mb-8">
              <p className="text-gray-500 mb-2">Order Number</p>
              <p className="text-2xl font-bold font-mono bg-gray-100 px-4 py-2 rounded-lg inline-block">
                {orderNumber}
              </p>
            </div>

            <div className="space-y-4 mb-8">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h2 className="font-bold text-blue-800 mb-2 flex items-center gap-2">
                  <span>📧</span> What Happens Next?
                </h2>
                <ul className="text-sm text-blue-700 space-y-2">
                  <li className="flex items-start gap-2">
                    <span>1.</span>
                    <span>You'll receive a confirmation email shortly</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span>2.</span>
                    <span>We'll verify your order and contact you within 24 hours</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span>3.</span>
                    <span>For bank transfers, use the account details we'll send via WhatsApp</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span>4.</span>
                    <span>Your items will be prepared for delivery or pickup</span>
                  </li>
                </ul>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h2 className="font-bold text-yellow-800 mb-2 flex items-center gap-2">
                  <span>💡</span> Need Help?
                </h2>
                <p className="text-sm text-yellow-700 mb-3">
                  If you have any questions about your order, chat with us on WhatsApp.
                </p>
                <button
                  onClick={handleWhatsApp}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-green-700 transition text-sm inline-flex items-center gap-2"
                >
                  <span>💬</span> Chat on WhatsApp
                </button>
              </div>
            </div>

            {/* Payment Instructions */}
            <div className="border-t pt-6 mb-6">
              <h2 className="font-bold text-lg mb-3">💰 Payment Instructions</h2>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-2">
                  <span className="font-bold">Bank Transfer:</span> Use your order number as reference
                </p>
                <div className="bg-white p-3 rounded border space-y-1 text-sm">
                  <p><span className="font-medium">Bank:</span> GTBank</p>
                  <p><span className="font-medium">Account Name:</span> Dsire Boerboels</p>
                  <p><span className="font-medium">Account Number:</span> 0123456789</p>
                  <p><span className="font-medium">Amount:</span> Use the total from checkout</p>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  ⚡ Send payment proof to our WhatsApp for faster processing
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/pawshop"
                className="flex-1 bg-black text-white text-center py-3 rounded-lg font-bold hover:bg-gray-800 transition"
              >
                Continue Shopping
              </Link>
              <Link
                href="/"
                className="flex-1 bg-gray-200 text-gray-800 text-center py-3 rounded-lg font-bold hover:bg-gray-300 transition"
              >
                Back to Home
              </Link>
            </div>

            {/* Auto-redirect message */}
            <p className="text-xs text-gray-400 text-center mt-4">
              You'll be redirected to the homepage in {countdown} seconds
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}