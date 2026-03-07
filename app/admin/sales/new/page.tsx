// app/admin/sales/new/page.tsx
"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

// Define types
interface Customer {
  id: number;
  name: string;
  phone?: string;
  email?: string;
}

interface Dog {
  id: number;
  name: string;
  type: string;
  price?: number;
}

interface Product {
  id: number;
  name: string;
  price: number;
  cost?: number;
}

export default function NewSalePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [dogs, setDogs] = useState<Dog[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  
  const [formData, setFormData] = useState({
    item_type: 'puppy',
    item_id: '',
    customer_id: '',
    customer_name: '',
    customer_phone: '',
    customer_email: '',
    quantity: '1',
    price: '',
    cost: '',
    payment_method: 'transfer',
    payment_status: 'paid',
    deposit_amount: '0',
    sale_date: new Date().toISOString().split('T')[0],
    notes: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    // Update price when item changes
    if (formData.item_type === 'puppy' || formData.item_type === 'stud') {
      const selectedDog = dogs.find(d => d.id === Number(formData.item_id));
      if (selectedDog?.price) {
        setFormData(prev => ({ ...prev, price: selectedDog.price?.toString() || '' }));
      }
    } else if (formData.item_type === 'product') {
      const selectedProduct = products.find(p => p.id === Number(formData.item_id));
      if (selectedProduct) {
        setFormData(prev => ({ 
          ...prev, 
          price: selectedProduct.price.toString(),
          cost: selectedProduct.cost?.toString() || ''
        }));
      }
    }
  }, [formData.item_id, formData.item_type]);

  const fetchData = async () => {
    // Fetch customers
    const { data: customersData } = await supabase
      .from('customers')
      .select('*')
      .order('name');
    setCustomers(customersData || []);

    // Fetch available dogs (puppies and studs)
    const { data: dogsData } = await supabase
      .from('dogs')
      .select('id, name, type, price')
      .in('type', ['puppy', 'stud'])
      .order('name');
    setDogs(dogsData || []);

    // Fetch products
    const { data: productsData } = await supabase
      .from('products')
      .select('id, name, price, cost')
      .eq('in_stock', true)
      .order('name');
    setProducts(productsData || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Get item details
    let itemName = '';
    let itemCost = formData.cost ? Number(formData.cost) : 0;
    
    if (formData.item_type === 'puppy' || formData.item_type === 'stud') {
      const dog = dogs.find(d => d.id === Number(formData.item_id));
      itemName = dog?.name || '';
    } else if (formData.item_type === 'product') {
      const product = products.find(p => p.id === Number(formData.item_id));
      itemName = product?.name || '';
    }

    // Prepare customer data
    let customerId = formData.customer_id ? Number(formData.customer_id) : null;
    
    // If no customer selected, create a new one
    if (!customerId && formData.customer_name) {
      const { data: newCustomer } = await supabase
        .from('customers')
        .insert([{
          name: formData.customer_name,
          phone: formData.customer_phone || null,
          email: formData.customer_email || null
        }])
        .select()
        .single();
      
      customerId = newCustomer?.id || null;
    }

    const saleData = {
      item_type: formData.item_type,
      item_id: Number(formData.item_id),
      item_name: itemName,
      customer_id: customerId,
      customer_name: formData.customer_name || 'Walk-in Customer',
      customer_phone: formData.customer_phone || null,
      customer_email: formData.customer_email || null,
      quantity: Number(formData.quantity),
      price: Number(formData.price),
      cost: itemCost,
      profit: Number(formData.price) - itemCost,
      payment_method: formData.payment_method,
      payment_status: formData.payment_status,
      deposit_amount: Number(formData.deposit_amount),
      sale_date: formData.sale_date,
      notes: formData.notes || null
    };

    const { error } = await supabase.from('sales').insert([saleData]);

    if (error) {
      alert('Error recording sale: ' + error.message);
    } else {
      // Update item status if needed
      if (formData.item_type === 'puppy') {
        await supabase
          .from('dogs')
          .update({ status: 'sold' })
          .eq('id', formData.item_id);
      } else if (formData.item_type === 'product') {
        const product = products.find(p => p.id === Number(formData.item_id));
        const newStock = (product?.stock || 1) - Number(formData.quantity);
        await supabase
          .from('products')
          .update({ 
            stock: newStock,
            in_stock: newStock > 0
          })
          .eq('id', formData.item_id);
      }

      alert('Sale recorded successfully!');
      router.push('/admin/sales');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Record New Sale</h1>
          <p className="text-gray-500">Record a sale for dogs, stud services, or products</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow space-y-6">
          {/* Item Type Selection */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold border-b pb-2">Item Details</h2>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-medium mb-1">Item Type *</label>
                <select
                  required
                  value={formData.item_type}
                  onChange={(e) => {
                    setFormData({...formData, item_type: e.target.value, item_id: ''});
                  }}
                  className="w-full p-2 border rounded"
                >
                  <option value="puppy">🐕 Puppy</option>
                  <option value="stud">👑 Stud Service</option>
                  <option value="product">🛍️ Product</option>
                </select>
              </div>

              <div>
                <label className="block font-medium mb-1">Select Item *</label>
                <select
                  required
                  value={formData.item_id}
                  onChange={(e) => setFormData({...formData, item_id: e.target.value})}
                  className="w-full p-2 border rounded"
                >
                  <option value="">Select...</option>
                  {(formData.item_type === 'puppy' || formData.item_type === 'stud') && 
                    dogs.filter(d => d.type === formData.item_type).map(dog => (
                      <option key={dog.id} value={dog.id}>
                        {dog.name} {dog.price ? `- ₦${dog.price.toLocaleString()}` : ''}
                      </option>
                    ))
                  }
                  {formData.item_type === 'product' && 
                    products.map(product => (
                      <option key={product.id} value={product.id}>
                        {product.name} - ₦{product.price.toLocaleString()}
                      </option>
                    ))
                  }
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-medium mb-1">Quantity</label>
                <input
                  type="number"
                  min="1"
                  value={formData.quantity}
                  onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div>
                <label className="block font-medium mb-1">Sale Price (₦) *</label>
                <input
                  type="number"
                  required
                  value={formData.price}
                  onChange={(e) => setFormData({...formData, price: e.target.value})}
                  className="w-full p-2 border rounded"
                  placeholder="0"
                />
              </div>
            </div>

            {formData.item_type === 'product' && (
              <div>
                <label className="block font-medium mb-1">Cost Price (₦)</label>
                <input
                  type="number"
                  value={formData.cost}
                  onChange={(e) => setFormData({...formData, cost: e.target.value})}
                  className="w-full p-2 border rounded"
                  placeholder="For profit calculation"
                />
              </div>
            )}
          </div>

          {/* Customer Information */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold border-b pb-2">Customer Information</h2>
            
            <div>
              <label className="block font-medium mb-1">Select Existing Customer</label>
              <select
                value={formData.customer_id}
                onChange={(e) => {
                  const selected = customers.find(c => c.id === Number(e.target.value));
                  setFormData({
                    ...formData, 
                    customer_id: e.target.value,
                    customer_name: selected?.name || '',
                    customer_phone: selected?.phone || '',
                    customer_email: selected?.email || ''
                  });
                }}
                className="w-full p-2 border rounded"
              >
                <option value="">New Customer (fill below)</option>
                {customers.map(c => (
                  <option key={c.id} value={c.id}>{c.name} {c.phone ? `- ${c.phone}` : ''}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-medium mb-1">Customer Name *</label>
                <input
                  type="text"
                  required
                  value={formData.customer_name}
                  onChange={(e) => setFormData({...formData, customer_name: e.target.value})}
                  className="w-full p-2 border rounded"
                  placeholder="John Doe"
                />
              </div>
              <div>
                <label className="block font-medium mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={formData.customer_phone}
                  onChange={(e) => setFormData({...formData, customer_phone: e.target.value})}
                  className="w-full p-2 border rounded"
                  placeholder="08012345678"
                />
              </div>
            </div>

            <div>
              <label className="block font-medium mb-1">Email</label>
              <input
                type="email"
                value={formData.customer_email}
                onChange={(e) => setFormData({...formData, customer_email: e.target.value})}
                className="w-full p-2 border rounded"
                placeholder="customer@example.com"
              />
            </div>
          </div>

          {/* Payment Information */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold border-b pb-2">Payment Information</h2>
            
            <div className="grid grid-cols-2 gap-4">
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

              <div>
                <label className="block font-medium mb-1">Payment Status *</label>
                <select
                  required
                  value={formData.payment_status}
                  onChange={(e) => setFormData({...formData, payment_status: e.target.value})}
                  className="w-full p-2 border rounded"
                >
                  <option value="paid">✅ Paid in Full</option>
                  <option value="partial">⏳ Partial Payment</option>
                  <option value="pending">⏱️ Pending</option>
                </select>
              </div>
            </div>

            {formData.payment_status === 'partial' && (
              <div>
                <label className="block font-medium mb-1">Deposit Amount (₦)</label>
                <input
                  type="number"
                  value={formData.deposit_amount}
                  onChange={(e) => setFormData({...formData, deposit_amount: e.target.value})}
                  className="w-full p-2 border rounded"
                  placeholder="50000"
                />
              </div>
            )}

            <div>
              <label className="block font-medium mb-1">Sale Date *</label>
              <input
                type="date"
                required
                value={formData.sale_date}
                onChange={(e) => setFormData({...formData, sale_date: e.target.value})}
                className="w-full p-2 border rounded"
              />
            </div>

            <div>
              <label className="block font-medium mb-1">Notes</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                rows={3}
                className="w-full p-2 border rounded"
                placeholder="Additional notes about the sale..."
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-black text-white py-3 rounded-lg hover:bg-gray-800 disabled:opacity-50 transition"
            >
              {loading ? 'Recording...' : 'Record Sale'}
            </button>
            <Link
              href="/admin/sales"
              className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}