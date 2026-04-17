// app/pawshop/checkout/page.tsx
"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';

interface CartItem {
  id: number;
  name: string;
  price: number;
  image: string;
  quantity: number;
}

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  deliveryMethod: 'pickup' | 'delivery';
  shippingZone: string;
  notes: string;
}

interface ShippingZone {
  id: string;
  name: string;
  price: number;
  areas: string[];
}

const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "2347019996837";

// Bank account details
const BANK_DETAILS = {
  accountNumber: "0603275787",
  accountName: "Dsire Kennel",
  bankName: "GTBank"
};

// Shipping zones configuration
const shippingZones: ShippingZone[] = [
  {
    id: 'zone1',
    name: 'Maitama, Gwarinpa, Dawaki, Lugbe, Kubwa, Karu',
    price: 5500,
    areas: ['Maitama', 'Gwarinpa', 'Dawaki', 'Lugbe', 'Kubwa', 'Karu']
  },
  {
    id: 'zone2',
    name: 'Lokogoma, Gudu, Apo, Gaduwa, Durumi, Games village, Suncity, Sunnyvale',
    price: 4000,
    areas: ['Lokogoma', 'Gudu', 'Apo', 'Gaduwa', 'Durumi', 'Games village', 'Suncity', 'Sunnyvale']
  },
  {
    id: 'zone3',
    name: 'All States Outside Abuja (0-2kg, pickup at closest bus terminal)',
    price: 8000,
    areas: []
  }
];

export default function CheckoutPage() {
  const router = useRouter();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderReference, setOrderReference] = useState('');
  const [imageErrors, setImageErrors] = useState<{ [key: string]: boolean }>({});

  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: 'Lagos',
    deliveryMethod: 'delivery',
    shippingZone: '',
    notes: '',
  });

  const states = [
    'Abia', 'Abuja', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue',
    'Borno', 'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'Gombe',
    'Imo', 'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi', 'Kwara',
    'Lagos', 'Nasarawa', 'Niger', 'Ogun', 'Ondo', 'Osun', 'Oyo', 'Plateau',
    'Rivers', 'Sokoto', 'Taraba', 'Yobe', 'Zamfara'
  ];

  useEffect(() => {
    loadCart();
    setOrderReference(`DS-${Date.now()}-${Math.random().toString(36).substring(7).toUpperCase()}`);
  }, []);

  const loadCart = () => {
    const savedCart = JSON.parse(localStorage.getItem('cart') || '[]');
    if (savedCart.length === 0) {
      router.push('/pawshop');
      return;
    }
    setCart(savedCart);
    setLoading(false);
  };

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const shippingCost = formData.deliveryMethod === 'delivery' && formData.shippingZone
    ? shippingZones.find(z => z.id === formData.shippingZone)?.price || 0
    : 0;
  const total = subtotal + shippingCost;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const placeOrder = async () => {
    setSubmitting(true);

    const selectedZone = shippingZones.find(z => z.id === formData.shippingZone);
    const shippingInfo = selectedZone ? `${selectedZone.name} - ₦${selectedZone.price.toLocaleString()}` : 'Pickup';

    const orderData = {
      order_reference: orderReference,
      customer_name: `${formData.firstName} ${formData.lastName}`,
      customer_email: formData.email,
      customer_phone: formData.phone,
      delivery_address: formData.deliveryMethod === 'delivery' 
        ? `${formData.address}, ${formData.city}, ${formData.state}`
        : 'Pickup from kennel',
      delivery_method: formData.deliveryMethod,
      payment_method: 'transfer',
      payment_status: 'pending',
      subtotal_amount: subtotal,
      shipping_amount: shippingCost,
      total_amount: total,
      shipping_zone: shippingInfo,
      items: cart.map(item => ({
        product_id: item.id,
        product_name: item.name,
        quantity: item.quantity,
        price: item.price
      })),
      notes: formData.notes
    };

    const { error } = await supabase.from('orders').insert([orderData]);

    if (error) {
      console.error('Error placing order:', error);
      alert('Error placing order: ' + error.message);
      setSubmitting(false);
      return false;
    }

    for (const item of cart) {
      const { data: product } = await supabase
        .from('products')
        .select('stock')
        .eq('id', item.id)
        .single();
      
      const newStock = (product?.stock || 0) - item.quantity;
      
      await supabase
        .from('products')
        .update({ 
          stock: newStock,
          in_stock: newStock > 0
        })
        .eq('id', item.id);
    }

    setSubmitting(false);
    setOrderPlaced(true);
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await placeOrder();
  };

  const handlePaymentProof = () => {
    const itemsList = cart.map(item => 
      `• ${item.name} x${item.quantity} - ₦${(item.price * item.quantity).toLocaleString()}`
    ).join('%0A');
    
    const deliveryInfo = formData.deliveryMethod === 'delivery' 
      ? `${formData.address}, ${formData.city}, ${formData.state}`
      : 'Pickup from Kennel (Abuja)';
    
    const selectedZone = shippingZones.find(z => z.id === formData.shippingZone);
    const shippingInfo = selectedZone ? `${selectedZone.name} - ₦${selectedZone.price.toLocaleString()}` : 'Pickup';
    
    const message = `🔔 *NEW ORDER RECEIVED!* 🔔%0A%0A` +
      `━━━━━━━━━━━━━━━━━━━━━%0A` +
      `📋 *ORDER REFERENCE:*%0A${orderReference}%0A%0A` +
      `━━━━━━━━━━━━━━━━━━━━━%0A` +
      `🛍️ *ITEMS PURCHASED:*%0A${itemsList}%0A%0A` +
      `💰 *SUBTOTAL:*%0A₦${subtotal.toLocaleString()}%0A` +
      `🚚 *SHIPPING:*%0A₦${shippingCost.toLocaleString()}%0A` +
      `💵 *TOTAL:*%0A₦${total.toLocaleString()}%0A%0A` +
      `━━━━━━━━━━━━━━━━━━━━━%0A` +
      `👤 *CUSTOMER DETAILS:*%0A` +
      `Name: ${formData.firstName} ${formData.lastName}%0A` +
      `Phone: ${formData.phone}%0A` +
      `Email: ${formData.email}%0A%0A` +
      `━━━━━━━━━━━━━━━━━━━━━%0A` +
      `🚚 *DELIVERY INFORMATION:*%0A` +
      `Method: ${formData.deliveryMethod === 'delivery' ? 'Door Delivery' : 'Pickup'}%0A` +
      `Shipping Zone: ${shippingInfo}%0A` +
      `Address: ${deliveryInfo}%0A%0A` +
      `📝 *NOTES:*%0A${formData.notes || 'No special instructions'}%0A%0A` +
      `━━━━━━━━━━━━━━━━━━━━━%0A` +
      `💳 *PAYMENT DETAILS:*%0A` +
      `Bank: ${BANK_DETAILS.bankName}%0A` +
      `Account Number: ${BANK_DETAILS.accountNumber}%0A` +
      `Account Name: ${BANK_DETAILS.accountName}%0A` +
      `Amount to Pay: ₦${total.toLocaleString()}%0A%0A` +
      `━━━━━━━━━━━━━━━━━━━━━%0A` +
      `✅ *ACTION REQUIRED:*%0A` +
      `Customer has placed this order and will attach payment proof. Please verify and confirm.`;
    
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${message}`, '_blank');
    
    localStorage.removeItem('cart');
    window.dispatchEvent(new Event('cartUpdated'));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-48 mb-8"></div>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="h-96 bg-gray-200 rounded"></div>
            <div className="h-96 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (orderPlaced) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-2xl mx-auto px-4">
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="bg-green-600 p-6 text-center">
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">✅</span>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Order Placed!</h2>
              <p className="text-green-100">Reference: {orderReference}</p>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                  <span>🏦</span> Bank Transfer Details
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
                    <span className="font-bold text-green-600">₦{total.toLocaleString()}</span>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-3">
                  ⚡ Use your order reference <span className="font-mono bg-gray-100 px-1">{orderReference}</span> as payment description
                </p>
              </div>

              <button
                onClick={handlePaymentProof}
                className="w-full bg-green-600 text-white py-4 rounded-xl font-bold hover:bg-green-700 transition flex items-center justify-center gap-2 text-lg"
              >
                <span>📱</span> I've Made Payment - Send Proof
              </button>

              <p className="text-xs text-gray-400 text-center">
                You'll be redirected to WhatsApp. Please attach your payment receipt/screenshot.
              </p>

              <div className="border-t pt-4">
                <h4 className="font-bold mb-2">Order Summary:</h4>
                {cart.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-sm text-gray-600">
                    <span>{item.name} x{item.quantity}</span>
                    <span>₦{(item.price * item.quantity).toLocaleString()}</span>
                  </div>
                ))}
                <div className="flex justify-between text-sm text-gray-600 pt-2">
                  <span>Subtotal</span>
                  <span>₦{subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Shipping</span>
                  <span>₦{shippingCost.toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-bold mt-2 pt-2 border-t">
                  <span>Total</span>
                  <span className="text-green-600">₦{total.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-6">
          <Link href="/pawshop/cart" className="text-gray-600 hover:text-black transition">
            ← Back to Cart
          </Link>
        </div>

        <h1 className="text-3xl font-bold mb-8">Checkout</h1>

        <form onSubmit={handleSubmit}>
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-xl font-bold mb-4">Contact Information</h2>
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
                      className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-black"
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
                      className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-black"
                    />
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
                      className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-black"
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
                      className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-black"
                      placeholder="08012345678"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-xl font-bold mb-4">Delivery Information</h2>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Delivery Method *
                  </label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="deliveryMethod"
                        value="delivery"
                        checked={formData.deliveryMethod === 'delivery'}
                        onChange={handleInputChange}
                        className="w-4 h-4"
                      />
                      <span>Door Delivery</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="deliveryMethod"
                        value="pickup"
                        checked={formData.deliveryMethod === 'pickup'}
                        onChange={handleInputChange}
                        className="w-4 h-4"
                      />
                      <span>Pickup from Kennel (Free)</span>
                    </label>
                  </div>
                </div>

                {formData.deliveryMethod === 'delivery' && (
                  <div className="space-y-4">
                    {/* Address Fields */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Address *
                      </label>
                      <input
                        type="text"
                        name="address"
                        required
                        value={formData.address}
                        onChange={handleInputChange}
                        className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-black"
                        placeholder="Street address"
                      />
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          City *
                        </label>
                        <input
                          type="text"
                          name="city"
                          required
                          value={formData.city}
                          onChange={handleInputChange}
                          className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-black"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          State *
                        </label>
                        <select
                          name="state"
                          required
                          value={formData.state}
                          onChange={handleInputChange}
                          className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-black"
                        >
                          {states.map(state => (
                            <option key={state} value={state}>{state}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Shipping Zone Selection */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        Select Shipping Zone *
                      </label>
                      <div className="space-y-3">
                        {shippingZones.map((zone) => (
                          <label
                            key={zone.id}
                            className={`flex items-start gap-3 p-4 border rounded-xl cursor-pointer transition-all ${
                              formData.shippingZone === zone.id
                                ? 'border-green-500 bg-green-50'
                                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            <input
                              type="radio"
                              name="shippingZone"
                              value={zone.id}
                              checked={formData.shippingZone === zone.id}
                              onChange={handleInputChange}
                              className="mt-1 w-4 h-4"
                              required
                            />
                            <div className="flex-1">
                              <p className="font-medium text-sm">{zone.name}</p>
                              <p className="text-green-600 font-bold text-base mt-1">
                                ₦{zone.price.toLocaleString()}
                              </p>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {formData.deliveryMethod === 'pickup' && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-800">
                      📍 Pickup Location: Dsire Kennel, Abuja
                    </p>
                    <p className="text-xs text-blue-600 mt-1">
                      Free pickup - No shipping fee
                    </p>
                  </div>
                )}
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-xl font-bold mb-4">Payment Method</h2>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="font-medium text-blue-800 mb-2">💳 Bank Transfer Only</p>
                  <p className="text-sm text-blue-700">
                    After placing your order, you'll receive bank details to complete your payment.
                    Then simply send your proof of payment via WhatsApp.
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Order Notes (Optional)
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-black"
                  placeholder="Any special instructions for delivery?"
                />
              </div>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 sticky top-24">
                <h2 className="text-xl font-bold mb-4">Your Order</h2>

                <div className="mb-4 p-2 bg-gray-50 rounded text-xs font-mono">
                  Ref: {orderReference}
                </div>

                <div className="space-y-3 mb-4 max-h-96 overflow-y-auto">
                  {cart.map((item) => (
                    <div key={item.id} className="flex gap-3">
                      <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden relative flex-shrink-0">
                        {!imageErrors[item.id] ? (
                          <Image
                            src={item.image || '/shop/placeholder.jpg'}
                            alt={item.name}
                            fill
                            className="object-cover"
                            onError={() => setImageErrors(prev => ({ ...prev, [item.id]: true }))}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-2xl text-gray-400">
                            🛍️
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-sm line-clamp-2">{item.name}</p>
                        <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                        <p className="text-sm font-bold text-green-600">
                          ₦{(item.price * item.quantity).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="space-y-2 pt-4 border-t">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal</span>
                    <span className="font-medium">₦{subtotal.toLocaleString()}</span>
                  </div>
                  {formData.deliveryMethod === 'delivery' && formData.shippingZone && (
                    <div className="flex justify-between text-gray-600">
                      <span>Shipping</span>
                      <span className="font-medium">₦{shippingCost.toLocaleString()}</span>
                    </div>
                  )}
                  {formData.deliveryMethod === 'pickup' && (
                    <div className="flex justify-between text-gray-600">
                      <span>Shipping</span>
                      <span className="font-medium text-green-600">Free Pickup</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-lg pt-2 border-t">
                    <span>Total</span>
                    <span className="text-green-600">₦{total.toLocaleString()}</span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-green-600 text-white py-4 rounded-xl font-bold hover:bg-green-700 transition disabled:opacity-50 mt-6 text-lg"
                >
                  {submitting ? 'Processing...' : 'Place Order'}
                </button>

                <p className="text-xs text-gray-400 text-center mt-4">
                  By placing your order, you agree to our Terms of Service and Privacy Policy
                </p>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}