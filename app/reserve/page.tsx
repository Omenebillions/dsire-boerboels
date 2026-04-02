// app/reserve/page.tsx
"use client";
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

// Bank account details
const BANK_DETAILS = {
  accountNumber: "0603275787",
  accountName: "Dsire Kennels",
  bankName: "GTBank"
};

// WhatsApp number for payment proof
const WHATSAPP_NUMBER = "2347019996837";

// Generate clean reference code (e.g., DSK-240415-123)
const generateReference = () => {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const random = Math.floor(Math.random() * 900 + 100).toString();
  return `DSK-${year}${month}${day}-${random}`;
};

// Sanitize input - remove harmful characters
const sanitizeInput = (input: string): string => {
  return input
    .trim()
    .replace(/[<>]/g, '')
    .replace(/[&]/g, 'and')
    .slice(0, 255);
};

// Validate email format
const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@([^\s@.,]+\.)+[^\s@.,]{2,}$/;
  return emailRegex.test(email);
};

// Validate phone number
const isValidPhone = (phone: string): boolean => {
  const phoneRegex = /^[0-9]{10,11}$/;
  return phoneRegex.test(phone.replace(/\D/g, ''));
};

// Copy to clipboard function
const copyToClipboard = (text: string, message: string = "✅ Copied to clipboard!") => {
  navigator.clipboard.writeText(text);
  alert(message);
};

export default function GeneralReservePage() {
  const [submitting, setSubmitting] = useState(false);
  const [reservationComplete, setReservationComplete] = useState(false);
  const [reservationReference, setReservationReference] = useState('');
  const [emailSent, setEmailSent] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    whatsapp: '',
    message: ''
  });
  const [sameAsPhone, setSameAsPhone] = useState(true);

  // Auto-fill WhatsApp when sameAsPhone is checked
  useEffect(() => {
    if (sameAsPhone) {
      setFormData(prev => ({ ...prev, whatsapp: prev.phone }));
    }
  }, [formData.phone, sameAsPhone]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    const sanitizedValue = sanitizeInput(value);
    setFormData(prev => ({ ...prev, [name]: sanitizedValue }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};
    
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    } else if (formData.firstName.length < 2) {
      newErrors.firstName = 'First name must be at least 2 characters';
    }
    
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    } else if (formData.lastName.length < 2) {
      newErrors.lastName = 'Last name must be at least 2 characters';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email address is required';
    } else if (!isValidEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!isValidPhone(formData.phone)) {
      newErrors.phone = 'Please enter a valid phone number (10-11 digits)';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Send email via secure API route - UPDATED with to_email
  const sendEmailNotifications = async (reference: string) => {
    const fullName = `${formData.firstName} ${formData.lastName}`;
    
    const templateParams = {
      to_email: formData.email,  // ← CRITICAL: Added this line
      customer_name: fullName,
      customer_email: formData.email,
      customer_phone: formData.phone,
      customer_whatsapp: formData.whatsapp,
      reference: reference,
      deposit_amount: '100,000',
      bank_name: BANK_DETAILS.bankName,
      account_number: BANK_DETAILS.accountNumber,
      account_name: BANK_DETAILS.accountName,
      message: formData.message?.substring(0, 500) || 'No message',
      year: new Date().getFullYear(),
      whatsapp_number: WHATSAPP_NUMBER
    };

    try {
      const response = await fetch('/api/send-reservation-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ templateParams }),
      });

      const data = await response.json();
      
      if (data.success) {
        setEmailSent(true);
        console.log('Email sent successfully!');
        return true;
      } else {
        console.error('Email failed:', data.error);
        return false;
      }
    } catch (error) {
      console.error('Email sending failed:', error);
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setSubmitting(true);

    const reference = generateReference();
    const today = new Date().toISOString().split('T')[0];
    const fullName = `${formData.firstName} ${formData.lastName}`;
    const depositAmount = 100000;

    try {
      // Match your exact table columns with defaults for ALL required fields
      const reservationData = {
        reference: reference,
        dog_name: "Waiting List - Any Available Puppy", // Default for NOT NULL
        customer_name: fullName.substring(0, 100),
        customer_email: formData.email.toLowerCase().substring(0, 255),
        customer_phone: formData.phone.replace(/\D/g, '').substring(0, 15),
        customer_whatsapp: formData.whatsapp.replace(/\D/g, '').substring(0, 15),
        deposit_amount: depositAmount,
        total_price: 0, // Default value for NOT NULL (will be updated when dog is assigned)
        remaining_balance: 0, // Default value for NOT NULL (will be updated when dog is assigned)
        status: 'pending',
        payment_status: 'pending',
        reservation_date: today,
        message: formData.message?.substring(0, 500) || null,
        created_at: new Date().toISOString()
      };

      console.log('Inserting data:', reservationData);

      const { error: reservationError } = await supabase
        .from('reservations')
        .insert([reservationData]);

      if (reservationError) {
        console.error('Supabase error details:', reservationError);
        throw new Error(reservationError.message);
      }

      // Send email notification
      sendEmailNotifications(reference);

      setReservationReference(reference);
      setReservationComplete(true);

    } catch (error: any) {
      console.error('Error creating reservation:', error);
      
      if (error.message?.includes('row-level security')) {
        alert('Unable to create reservation. Please contact support.');
      } else if (error.message?.includes('null value in column')) {
        alert('System error. Please contact support with your reference number.');
      } else {
        alert('Unable to create reservation. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handlePaymentProof = () => {
    const message = `🔔 *PAYMENT PROOF - RESERVATION* 🔔%0A%0A` +
      `━━━━━━━━━━━━━━━━━━━━━%0A` +
      `📋 *REFERENCE:*%0A${reservationReference}%0A%0A` +
      `━━━━━━━━━━━━━━━━━━━━━%0A` +
      `👤 *CUSTOMER DETAILS:*%0A` +
      `Name: ${formData.firstName} ${formData.lastName}%0A` +
      `Phone: ${formData.phone}%0A` +
      `WhatsApp: ${formData.whatsapp}%0A` +
      `Email: ${formData.email}%0A%0A` +
      `━━━━━━━━━━━━━━━━━━━━━%0A` +
      `💳 *PAYMENT DETAILS:*%0A` +
      `Amount Paid: ₦100,000%0A` +
      `Payment Method: Bank Transfer%0A` +
      `Date: ${new Date().toLocaleDateString()}%0A%0A` +
      `━━━━━━━━━━━━━━━━━━━━━%0A` +
      `✅ *ACTION REQUIRED:*%0A` +
      `Please verify this payment and confirm the reservation.%0A` +
      `👉 Admin Panel: https://dsirekennel.com/admin/reservations`;
    
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${message}`, '_blank');
  };

  if (reservationComplete) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-2xl mx-auto px-4">
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="bg-green-600 p-6 text-center">
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">✅</span>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Reservation Request Received!</h2>
              <div className="flex items-center justify-center gap-2 mt-2">
                <p className="text-green-100 font-mono text-lg">{reservationReference}</p>
                <button
                  onClick={() => copyToClipboard(reservationReference, "✅ Reference code copied!")}
                  className="bg-white/20 hover:bg-white/30 text-white p-2 rounded-lg transition"
                  title="Copy reference code"
                >
                  📋
                </button>
              </div>
              {emailSent && (
                <p className="text-green-100 text-sm mt-2">📧 Confirmation email sent to {formData.email}</p>
              )}
            </div>
           
            <div className="p-6 space-y-6">
              {/* Bank Details */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                  <span>🏦</span> Pay Your ₦100,000 Deposit
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                    <span className="font-medium">Bank:</span>
                    <span>{BANK_DETAILS.bankName}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                    <span className="font-medium">Account Number:</span>
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-bold text-lg">{BANK_DETAILS.accountNumber}</span>
                      <button 
                        onClick={() => copyToClipboard(BANK_DETAILS.accountNumber, "✅ Account number copied!")}
                        className="text-blue-600 hover:text-blue-800 px-2 py-1 rounded hover:bg-blue-50 transition"
                        title="Copy account number"
                      >
                        📋 Copy
                      </button>
                    </div>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                    <span className="font-medium">Account Name:</span>
                    <span>{BANK_DETAILS.accountName}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                    <span className="font-medium">Amount:</span>
                    <span className="font-bold text-green-600 text-lg">₦100,000</span>
                  </div>
                </div>
                <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                  <p className="text-sm font-medium text-yellow-800">
                    ⚡ IMPORTANT: Use reference <span className="font-mono bg-yellow-100 px-2 py-0.5 rounded font-bold">{reservationReference}</span> as payment description
                  </p>
                </div>
              </div>

              {/* Payment Proof Button */}
              <button
                onClick={handlePaymentProof}
                className="w-full bg-green-600 text-white py-4 rounded-xl font-bold hover:bg-green-700 transition flex items-center justify-center gap-2 text-lg shadow-md"
              >
                <span className="text-2xl">📱</span> I've Made Payment - Send Proof
              </button>
              <p className="text-xs text-gray-400 text-center">
                Click to send your payment receipt via WhatsApp. Please attach a screenshot of your transfer.
              </p>

              {/* Reservation Summary */}
              <div className="border-t pt-4">
                <h4 className="font-bold text-lg mb-3">📋 Reservation Summary</h4>
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Reference:</span>
                    <div className="flex items-center gap-2">
                      <code className="bg-white px-2 py-1 rounded font-mono text-sm">{reservationReference}</code>
                      <button 
                        onClick={() => copyToClipboard(reservationReference, "✅ Reference code copied!")}
                        className="text-blue-600 hover:text-blue-800 text-sm px-2 py-1 rounded hover:bg-blue-50"
                        title="Copy reference"
                      >
                        📋 Copy
                      </button>
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Deposit:</span>
                    <span className="font-bold text-green-600">₦100,000</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Status:</span>
                    <span className="text-yellow-600 font-medium">⏳ Pending Payment Confirmation</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Email:</span>
                    <span>{formData.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Phone:</span>
                    <span>{formData.phone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">WhatsApp:</span>
                    <span>{formData.whatsapp}</span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-100 p-4 rounded-lg text-center">
                <p className="text-sm text-gray-600">
                  📧 A confirmation email has been sent to <strong>{formData.email}</strong>
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  💬 Once we confirm your payment, we'll contact you on WhatsApp to discuss available puppies.
                </p>
                <Link href="/" className="text-blue-600 text-sm hover:underline mt-3 inline-block">
                  ← Return to Homepage
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-yellow-100 rounded-full mb-4">
            <span className="text-3xl">🐕</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Reserve a Puppy</h1>
          <p className="text-gray-600 mt-2">Fill out the form below to start your reservation process</p>
          <div className="inline-block bg-green-100 text-green-700 px-4 py-2 rounded-full text-sm font-medium mt-3">
            Deposit: ₦100,000 (non-refundable)
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {/* Hero Banner */}
          <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 p-6 text-center">
            <h2 className="text-xl font-bold text-white">Reserve Your Future Companion</h2>
            <p className="text-yellow-100 text-sm mt-1">Get priority access to upcoming litters</p>
          </div>

          {/* Form */}
          <div className="p-6 md:p-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Name Fields */}
              <div className="grid md:grid-cols-2 gap-4">
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
                    className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none transition ${
                      errors.firstName ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="John"
                    maxLength={50}
                  />
                  {errors.firstName && (
                    <p className="text-red-500 text-xs mt-1">{errors.firstName}</p>
                  )}
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
                    className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none transition ${
                      errors.lastName ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Doe"
                    maxLength={50}
                  />
                  {errors.lastName && (
                    <p className="text-red-500 text-xs mt-1">{errors.lastName}</p>
                  )}
                </div>
              </div>

              {/* Contact Fields */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none transition ${
                    errors.email ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="john@example.com"
                  maxLength={255}
                />
                {errors.email && (
                  <p className="text-red-500 text-xs mt-1">{errors.email}</p>
                )}
                <p className="text-xs text-gray-500 mt-1">We'll send your reservation confirmation here</p>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
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
                    className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none transition ${
                      errors.phone ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="08012345678"
                    maxLength={15}
                  />
                  {errors.phone && (
                    <p className="text-red-500 text-xs mt-1">{errors.phone}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    WhatsApp Number *
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="tel"
                      name="whatsapp"
                      required
                      value={formData.whatsapp}
                      onChange={handleInputChange}
                      className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none transition"
                      placeholder="08012345678"
                      disabled={sameAsPhone}
                      maxLength={15}
                    />
                    <label className="flex items-center gap-1 whitespace-nowrap text-sm bg-gray-100 px-3 py-2 rounded-lg cursor-pointer">
                      <input
                        type="checkbox"
                        checked={sameAsPhone}
                        onChange={(e) => setSameAsPhone(e.target.checked)}
                        className="w-4 h-4"
                      />
                      Same as phone
                    </label>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">We'll contact you here for updates</p>
                </div>
              </div>

              {/* Message */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Additional Message (Optional)
                </label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleInputChange}
                  rows={3}
                  maxLength={500}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 outline-none transition"
                  placeholder="Any special requests or questions?"
                />
                <p className="text-xs text-gray-400 mt-1">
                  {formData.message.length}/500 characters
                </p>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-yellow-600 text-white py-4 rounded-xl font-bold hover:bg-yellow-700 transition disabled:opacity-50 text-lg mt-4 shadow-md"
              >
                {submitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </span>
                ) : (
                  'Continue to Payment'
                )}
              </button>

              <p className="text-xs text-gray-400 text-center">
                By submitting this form, you agree to our reservation terms. A non-refundable deposit of ₦100,000 is required.
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}