// app/pawshop/cart/page.tsx
"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

interface CartItem {
  id: number;
  name: string;
  price: number;
  image: string;
  quantity: number;
}

export default function CartPage() {
  const router = useRouter();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [imageErrors, setImageErrors] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    loadCart();
  }, []);

  const loadCart = () => {
    const savedCart = JSON.parse(localStorage.getItem('cart') || '[]');
    setCart(savedCart);
    setLoading(false);
  };

  const updateQuantity = (id: number, newQuantity: number) => {
    if (newQuantity < 1) return;
    
    const updatedCart = cart.map(item => 
      item.id === id ? { ...item, quantity: newQuantity } : item
    );
    
    setCart(updatedCart);
    localStorage.setItem('cart', JSON.stringify(updatedCart));
    window.dispatchEvent(new Event('cartUpdated'));
  };

  const removeItem = (id: number) => {
    const updatedCart = cart.filter(item => item.id !== id);
    setCart(updatedCart);
    localStorage.setItem('cart', JSON.stringify(updatedCart));
    window.dispatchEvent(new Event('cartUpdated'));
  };

  const clearCart = () => {
    if (confirm('Clear all items from your cart?')) {
      setCart([]);
      localStorage.removeItem('cart');
      window.dispatchEvent(new Event('cartUpdated'));
    }
  };

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const total = subtotal;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-48 mb-8"></div>
            <div className="space-y-4">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="bg-white rounded-2xl shadow-sm border border-dashed border-gray-300 p-12 max-w-lg mx-auto">
            <div className="text-7xl mb-4">🛒</div>
            <h1 className="text-3xl font-bold mb-3">Your Cart is Empty</h1>
            <p className="text-gray-500 mb-8">Looks like you haven't added any items yet.</p>
            <Link 
              href="/pawshop" 
              className="inline-block bg-black text-white px-8 py-3 rounded-full font-bold hover:bg-gray-800 transition shadow-lg"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Shopping Cart</h1>
          <button
            onClick={clearCart}
            className="text-sm text-red-600 hover:text-red-700 flex items-center gap-1"
          >
            <span>🗑️</span> Clear Cart
          </button>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {cart.map((item) => (
              <div key={item.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex gap-4 hover:shadow-md transition">
                {/* Product Image */}
                <Link href={`/pawshop/product/${item.id}`} className="flex-shrink-0">
                  <div className="w-24 h-24 bg-gray-100 rounded-lg overflow-hidden relative">
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
                </Link>

                {/* Product Details */}
                <div className="flex-1">
                  <Link href={`/pawshop/product/${item.id}`}>
                    <h3 className="font-bold text-lg hover:text-yellow-600 transition line-clamp-1">
                      {item.name}
                    </h3>
                  </Link>
                  <p className="text-green-600 font-bold mt-1">₦{item.price.toLocaleString()}</p>
                  
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center border rounded-lg overflow-hidden">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="px-3 py-1 bg-gray-100 hover:bg-gray-200 transition font-bold"
                      >
                        -
                      </button>
                      <span className="px-4 py-1 font-medium">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="px-3 py-1 bg-gray-100 hover:bg-gray-200 transition font-bold"
                      >
                        +
                      </button>
                    </div>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="text-red-500 hover:text-red-600 text-sm flex items-center gap-1"
                    >
                      <span>✕</span> Remove
                    </button>
                  </div>
                </div>

                {/* Item Total */}
                <div className="text-right min-w-[100px]">
                  <p className="text-sm text-gray-500">Total</p>
                  <p className="font-bold text-lg">₦{(item.price * item.quantity).toLocaleString()}</p>
                </div>
              </div>
            ))}

            {/* Continue Shopping Link */}
            <Link 
              href="/pawshop" 
              className="inline-flex items-center gap-2 text-gray-600 hover:text-black transition mt-4"
            >
              <span>←</span> Continue Shopping
            </Link>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 sticky top-24">
              <h2 className="text-xl font-bold mb-4">Order Summary</h2>
              
              <div className="space-y-3 mb-4">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal ({cart.reduce((sum, i) => sum + i.quantity, 0)} items)</span>
                  <span className="font-medium">₦{subtotal.toLocaleString()}</span>
                </div>
                <div className="border-t pt-3 mt-3">
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span className="text-green-600">₦{total.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <Link
                href="/pawshop/checkout"
                className="w-full bg-green-600 text-white py-4 rounded-xl font-bold hover:bg-green-700 transition shadow-lg text-lg mb-3 text-center block"
              >
                Proceed to Checkout
              </Link>

              {/* Payment Methods */}
              <div className="mt-4 pt-4 border-t">
                <p className="text-xs text-gray-500 text-center mb-2">We accept:</p>
                <div className="flex justify-center gap-3 text-sm">
                  <span className="bg-gray-100 px-2 py-1 rounded">💵 Cash</span>
                  <span className="bg-gray-100 px-2 py-1 rounded">📲 Transfer</span>
                  <span className="bg-gray-100 px-2 py-1 rounded">💳 POS</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}