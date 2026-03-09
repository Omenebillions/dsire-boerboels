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
  paymentMethod: 'transfer' | 'paystack';
  notes: string;
}

const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "2347019996837";

export default function CheckoutPage() {
  const router = useRouter();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
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
    paymentMethod: 'transfer',
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
  const shipping = formData.deliveryMethod === 'delivery' ? (subtotal > 50000 ? 0 : 2500) : 0;
  const total = subtotal + shipping;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePayWithPaystack = () => {
    // This would integrate with Paystack API
    alert('Paystack integration will go here. In production, this would open a secure payment popup.');
    // After successful payment, you'd call placeOrder()
  };

  const placeOrder = async (paymentReference?: string) => {
    setSubmitting(true);

    // Create order in database
    const orderData = {
      customer_name: `${formData.firstName} ${formData.lastName}`,
      customer_email: formData.email,
      customer_phone: formData.phone,
      delivery_address: formData.deliveryMethod === 'delivery' 
        ? `${formData.address}, ${formData.city}, ${formData.state}`
        : 'Pickup from kennel',
      delivery_method: formData.deliveryMethod,
      payment_method: formData.paymentMethod,
      payment_status: formData.paymentMethod === 'transfer' ? 'pending' : 'paid',
      payment_reference: paymentReference || null,
      total_amount: total,
      items: cart.map(item => ({
        product_id: item.id,
        product_name: item.name,
        quantity: item.quantity,
        price: item.price
      })),
      notes: formData.notes
    };

    // Save to Supabase
    const { error } = await supabase.from('orders').insert([orderData]);

    if (error) {
      alert('Error placing order: ' + error.message);
    } else {
      // Update product stock
      for (const item of cart) {
        await supabase
          .from('products')
          .update({ 
            stock: supabase.rpc('decrement', { amount: item.quantity }),
            in_stock: supabase.rpc('check_stock')
          })
          .eq('id', item.id);
      }

      // Clear cart
      localStorage.removeItem('cart');
      window.dispatchEvent(new Event('cartUpdated'));
      
      // Redirect to confirmation
      router.push('/pawshop/confirmation');
    }
    setSubmitting(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.paymentMethod === 'transfer') {
      // For transfer, just place order
      await placeOrder();
      
      // Show transfer instructions
      const message = `Hello! I've placed an order:%0A%0A${cart.map(item => 
        `${item.name} (x${item.quantity}) - ₦${(item.price * item.quantity).toLocaleString()}`
      ).join('%0A')}%0A%0ATotal: ₦${total.toLocaleString()}%0A%0ADelivery: ${formData.deliveryMethod}%0AName: ${formData.firstName} ${formData.lastName}%0APhone: ${formData.phone}%0AEmail: ${formData.email}%0A%0AI'll make a bank transfer. Please provide account details.`;
      
      window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${message}`, '_blank');
    } else {
      // For Paystack, open payment modal
      handlePayWithPaystack();
    }
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

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Breadcrumb */}
        <div className="mb-6">
          <Link href="/pawshop/cart" className="text-gray-600 hover:text-black transition">
            ← Back to Cart
          </Link>
        </div>

        <h1 className="text-3xl font-bold mb-8">Checkout</h1>

        <form onSubmit={handleSubmit}>
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Billing Form */}
            <div className="lg:col-span-2 space-y-6">
              {/* Contact Information */}
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

              {/* Delivery Information */}
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
                      <span>Pickup from Kennel</span>
                    </label>
                  </div>
                </div>

                {formData.deliveryMethod === 'delivery' && (
                  <div className="space-y-4">
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
                  </div>
                )}

                {formData.deliveryMethod === 'pickup' && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-800">
                      📍 Pickup Location: Dsire Boerboels Kennel, Lagos
                    </p>
                  </div>
                )}
              </div>

              {/* Payment Method */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-xl font-bold mb-4">Payment Method</h2>
                
                <div className="space-y-3">
                  <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="transfer"
                      checked={formData.paymentMethod === 'transfer'}
                      onChange={handleInputChange}
                      className="w-4 h-4"
                    />
                    <div>
                      <span className="font-medium">Bank Transfer</span>
                      <p className="text-sm text-gray-500">Pay via bank transfer. You'll receive account details after order.</p>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="paystack"
                      checked={formData.paymentMethod === 'paystack'}
                      onChange={handleInputChange}
                      className="w-4 h-4"
                    />
                    <div>
                      <span className="font-medium">Pay with Paystack</span>
                      <p className="text-sm text-gray-500">Secure online payment via card, USSD, or bank transfer.</p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Additional Notes */}
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

                {/* Order Items */}
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

                {/* Totals */}
                <div className="space-y-2 pt-4 border-t">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal</span>
                    <span className="font-medium">₦{subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Shipping</span>
                    <span className="font-medium">{shipping === 0 ? 'FREE' : `₦${shipping.toLocaleString()}`}</span>
                  </div>
                  {shipping > 0 && (
                    <p className="text-xs text-gray-500">
                      Free shipping on orders over ₦50,000
                    </p>
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
                  {submitting ? 'Processing...' : formData.paymentMethod === 'transfer' ? 'Place Order' : 'Pay Now'}
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