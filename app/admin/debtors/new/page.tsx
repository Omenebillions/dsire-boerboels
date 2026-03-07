// app/admin/debtors/new/page.tsx
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
}

interface Product {
  id: number;
  name: string;
}

export default function NewDebtPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [dogs, setDogs] = useState<Dog[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  
  const [formData, setFormData] = useState({
    customer_id: '',
    invoice_number: '',
    description: '',
    original_amount: '',
    due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    related_to: 'puppy',
    related_item_id: '',
    notes: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    // Fetch customers
    const { data: customersData } = await supabase
      .from('customers')
      .select('*')
      .order('name');
    
    setCustomers((customersData as Customer[]) || []);

    // Fetch dogs for dropdown
    const { data: dogsData } = await supabase
      .from('dogs')
      .select('id, name, type')
      .eq('status', 'sold');
    
    setDogs((dogsData as Dog[]) || []);

    // Fetch products
    const { data: productsData } = await supabase
      .from('products')
      .select('id, name')
      .limit(50);
    
    setProducts((productsData as Product[]) || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const debtData = {
      customer_id: Number(formData.customer_id),
      invoice_number: formData.invoice_number || `INV-${Date.now()}`,
      description: formData.description,
      original_amount: Number(formData.original_amount),
      remaining_amount: Number(formData.original_amount),
      due_date: formData.due_date,
      status: 'pending',
      related_to: formData.related_to,
      related_item_id: formData.related_item_id ? Number(formData.related_item_id) : null,
      notes: formData.notes
    };

    const { error } = await supabase.from('debts').insert([debtData]);

    if (error) {
      alert('Error creating debt: ' + error.message);
    } else {
      alert('Debt recorded successfully!');
      router.push('/admin/debtors');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <h1 className="text-3xl font-bold mb-6">Record New Debt</h1>

        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow space-y-4">
          {/* Customer Selection */}
          <div>
            <label className="block font-medium mb-1">Customer *</label>
            <select
              required
              value={formData.customer_id}
              onChange={(e) => setFormData({...formData, customer_id: e.target.value})}
              className="w-full p-2 border rounded"
            >
              <option value="">Select customer</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>{c.name} {c.phone ? `- ${c.phone}` : ''}</option>
              ))}
            </select>
            <Link href="/admin/debtors/customers/new" className="text-sm text-blue-600 hover:underline mt-1 block">
              + Add new customer
            </Link>
          </div>

          {/* Invoice & Description */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-medium mb-1">Invoice Number</label>
              <input
                type="text"
                value={formData.invoice_number}
                onChange={(e) => setFormData({...formData, invoice_number: e.target.value})}
                className="w-full p-2 border rounded"
                placeholder="INV-2024-001"
              />
            </div>
            <div>
              <label className="block font-medium mb-1">Description *</label>
              <input
                type="text"
                required
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="w-full p-2 border rounded"
                placeholder="e.g., Puppy deposit, Stud fee"
              />
            </div>
          </div>

          {/* Amount & Due Date */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-medium mb-1">Amount (₦) *</label>
              <input
                type="number"
                required
                value={formData.original_amount}
                onChange={(e) => setFormData({...formData, original_amount: e.target.value})}
                className="w-full p-2 border rounded"
                placeholder="100000"
              />
            </div>
            <div>
              <label className="block font-medium mb-1">Due Date *</label>
              <input
                type="date"
                required
                value={formData.due_date}
                onChange={(e) => setFormData({...formData, due_date: e.target.value})}
                className="w-full p-2 border rounded"
              />
            </div>
          </div>

          {/* Related Item */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-medium mb-1">Related To</label>
              <select
                value={formData.related_to}
                onChange={(e) => setFormData({...formData, related_to: e.target.value, related_item_id: ''})}
                className="w-full p-2 border rounded"
              >
                <option value="puppy">🐕 Puppy</option>
                <option value="stud">👑 Stud Service</option>
                <option value="product">🛍️ Product</option>
                <option value="service">📋 Service</option>
              </select>
            </div>
            <div>
              <label className="block font-medium mb-1">Select Item</label>
              <select
                value={formData.related_item_id}
                onChange={(e) => setFormData({...formData, related_item_id: e.target.value})}
                className="w-full p-2 border rounded"
              >
                <option value="">None</option>
                {formData.related_to === 'puppy' && dogs.filter(d => d.type === 'puppy').map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
                {formData.related_to === 'stud' && dogs.filter(d => d.type === 'stud').map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
                {formData.related_to === 'product' && products.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
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
              placeholder="Additional payment terms or notes..."
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black text-white py-3 rounded-lg hover:bg-gray-800 disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create Debt Record'}
          </button>
        </form>
      </div>
    </div>
  );
}