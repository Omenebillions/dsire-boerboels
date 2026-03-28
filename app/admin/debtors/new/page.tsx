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
  price?: number;
  status?: string;
}

interface Product {
  id: number;
  name: string;
  price?: number;
}

interface Sale {
  id: number;
  item_name: string;
  price: number;
  customer_name: string;
  payment_status: string;
}

export default function NewDebtPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [dogs, setDogs] = useState<Dog[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [pendingSales, setPendingSales] = useState<Sale[]>([]);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [createdDebt, setCreatedDebt] = useState<any>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  
  const [formData, setFormData] = useState({
    customer_id: '',
    invoice_number: '',
    description: '',
    original_amount: '',
    amount_paid: '0',
    due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    related_to: 'puppy',
    related_item_id: '',
    sale_id: '',
    notes: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch customers
      const { data: customersData } = await supabase
        .from('customers')
        .select('*')
        .order('name');
      setCustomers((customersData as Customer[]) || []);

      // Fetch dogs (all types, not just sold)
      const { data: dogsData } = await supabase
        .from('dogs')
        .select('id, name, type, price, status')
        .order('name');
      setDogs((dogsData as Dog[]) || []);

      // Fetch products
      const { data: productsData } = await supabase
        .from('products')
        .select('id, name, price')
        .order('name');
      setProducts((productsData as Product[]) || []);

      // Fetch pending sales that might have partial payments
      const { data: salesData } = await supabase
        .from('sales')
        .select('id, item_name, price, customer_name, payment_status')
        .in('payment_status', ['partial', 'pending'])
        .order('created_at', { ascending: false })
        .limit(20);
      setPendingSales((salesData as Sale[]) || []);

    } catch (error: any) {
      console.error('Error fetching data:', error);
      alert('Error loading data: ' + error.message);
    }
  };

  // Generate unique invoice number
  const generateInvoiceNumber = () => {
    const prefix = 'INV';
    const timestamp = Date.now().toString().slice(-8);
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${prefix}-${timestamp}-${random}`;
  };

  // Auto-generate invoice number on load
  useEffect(() => {
    if (!formData.invoice_number) {
      setFormData(prev => ({ ...prev, invoice_number: generateInvoiceNumber() }));
    }
  }, []);

  // Auto-fill description based on selection
  useEffect(() => {
    if (formData.related_to === 'puppy' || formData.related_to === 'stud') {
      const selectedDog = dogs.find(d => d.id === Number(formData.related_item_id));
      if (selectedDog) {
        const typeLabel = formData.related_to === 'puppy' ? 'Puppy' : 'Stud Service';
        setFormData(prev => ({
          ...prev,
          description: `${typeLabel}: ${selectedDog.name}`
        }));
      }
    } else if (formData.related_to === 'product') {
      const selectedProduct = products.find(p => p.id === Number(formData.related_item_id));
      if (selectedProduct) {
        setFormData(prev => ({
          ...prev,
          description: `Product: ${selectedProduct.name}`
        }));
      }
    }
  }, [formData.related_item_id, formData.related_to, dogs, products]);

  // Validate form before submission
  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    if (!formData.customer_id) {
      errors.customer_id = 'Please select a customer';
    }
    if (!formData.description) {
      errors.description = 'Please enter a description';
    }
    if (!formData.original_amount || Number(formData.original_amount) <= 0) {
      errors.original_amount = 'Please enter a valid amount greater than 0';
    }
    if (!formData.due_date) {
      errors.due_date = 'Please select a due date';
    }
    if (formData.amount_paid && Number(formData.amount_paid) > Number(formData.original_amount)) {
      errors.amount_paid = 'Amount paid cannot exceed total amount';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);

    const originalAmount = Number(formData.original_amount);
    const amountPaid = Number(formData.amount_paid) || 0;
    const remainingAmount = originalAmount - amountPaid;
    const status = remainingAmount === 0 ? 'paid' : 'pending';

    const invoiceNumber = formData.invoice_number || generateInvoiceNumber();

    const debtData = {
      customer_id: Number(formData.customer_id),
      invoice_number: invoiceNumber,
      description: formData.description,
      original_amount: originalAmount,
      amount_paid: amountPaid,
      remaining_amount: remainingAmount,
      due_date: formData.due_date,
      status: status,
      related_type: formData.related_to,
      related_id: formData.related_item_id ? Number(formData.related_item_id) : null,
      sale_id: formData.sale_id ? Number(formData.sale_id) : null,
      notes: formData.notes || null,
      created_at: new Date().toISOString()
    };

    try {
      // Use 'debtors' table (not 'debts')
      const { data, error } = await supabase
        .from('debtors')
        .insert([debtData])
        .select()
        .single();

      if (error) throw error;

      // If there's a related sale, update its notes
      if (formData.sale_id) {
        await supabase
          .from('sales')
          .update({
            notes: `Debt recorded: ${invoiceNumber} - ${formData.description}`
          })
          .eq('id', formData.sale_id);
      }

      setCreatedDebt(data);
      setShowSuccessModal(true);
      
    } catch (error: any) {
      console.error('Error creating debt:', error);
      alert('Error creating debt: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCloseSuccess = () => {
    setShowSuccessModal(false);
    router.push('/admin/debtors');
  };

  // Get filtered items based on type
  const getFilteredDogs = () => {
    if (formData.related_to === 'puppy') {
      return dogs.filter(d => d.type === 'puppy');
    } else if (formData.related_to === 'stud') {
      return dogs.filter(d => d.type === 'stud');
    }
    return [];
  };

  // Get available sales for this customer
  const getAvailableSales = () => {
    if (!formData.customer_id) return [];
    const selectedCustomer = customers.find(c => c.id === Number(formData.customer_id));
    return pendingSales.filter(s => s.customer_name === selectedCustomer?.name);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        {/* Header */}
        <div className="mb-6">
          <Link href="/admin/debtors" className="text-gray-500 hover:text-gray-700 text-sm mb-2 inline-block">
            ← Back to Debtors
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Record New Debt</h1>
          <p className="text-gray-500 text-sm mt-1">Create a new debt record for a customer</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-5">
          {/* Customer Selection */}
          <div>
            <label className="block font-medium mb-1 text-gray-700">
              Customer <span className="text-red-500">*</span>
            </label>
            <select
              required
              value={formData.customer_id}
              onChange={(e) => setFormData({...formData, customer_id: e.target.value})}
              className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none ${
                formErrors.customer_id ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="">Select customer</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>{c.name} {c.phone ? `- ${c.phone}` : ''}</option>
              ))}
            </select>
            {formErrors.customer_id && (
              <p className="text-red-500 text-xs mt-1">{formErrors.customer_id}</p>
            )}
            <Link href="/admin/debtors/customers/new" className="text-sm text-blue-600 hover:underline mt-1 inline-block">
              + Add new customer
            </Link>
          </div>

          {/* Invoice & Description */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-medium mb-1 text-gray-700">Invoice Number</label>
              <input
                type="text"
                value={formData.invoice_number}
                onChange={(e) => setFormData({...formData, invoice_number: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-mono text-sm"
                placeholder="Auto-generated"
              />
              <p className="text-xs text-gray-400 mt-1">Leave blank for auto-generated</p>
            </div>
            <div>
              <label className="block font-medium mb-1 text-gray-700">
                Description <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none ${
                  formErrors.description ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="e.g., Puppy deposit, Stud fee"
              />
              {formErrors.description && (
                <p className="text-red-500 text-xs mt-1">{formErrors.description}</p>
              )}
            </div>
          </div>

          {/* Amount & Due Date */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-medium mb-1 text-gray-700">
                Total Amount (₦) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                required
                min="1"
                step="1000"
                value={formData.original_amount}
                onChange={(e) => setFormData({...formData, original_amount: e.target.value})}
                className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none ${
                  formErrors.original_amount ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="100000"
              />
              {formErrors.original_amount && (
                <p className="text-red-500 text-xs mt-1">{formErrors.original_amount}</p>
              )}
            </div>
            <div>
              <label className="block font-medium mb-1 text-gray-700">
                Amount Paid (₦)
              </label>
              <input
                type="number"
                min="0"
                step="1000"
                value={formData.amount_paid}
                onChange={(e) => setFormData({...formData, amount_paid: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="0"
              />
              <p className="text-xs text-gray-400 mt-1">If payment made now</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-medium mb-1 text-gray-700">
                Due Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                value={formData.due_date}
                onChange={(e) => setFormData({...formData, due_date: e.target.value})}
                className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none ${
                  formErrors.due_date ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {formErrors.due_date && (
                <p className="text-red-500 text-xs mt-1">{formErrors.due_date}</p>
              )}
            </div>
            <div>
              <label className="block font-medium mb-1 text-gray-700">Related To</label>
              <select
                value={formData.related_to}
                onChange={(e) => setFormData({...formData, related_to: e.target.value, related_item_id: ''})}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="puppy">🐕 Puppy</option>
                <option value="stud">👑 Stud Service</option>
                <option value="product">🛍️ Product</option>
                <option value="service">📋 Service</option>
                <option value="other">📌 Other</option>
              </select>
            </div>
          </div>

          {/* Related Item Selection */}
          {formData.related_to !== 'other' && (
            <div>
              <label className="block font-medium mb-1 text-gray-700">Select Item</label>
              <select
                value={formData.related_item_id}
                onChange={(e) => setFormData({...formData, related_item_id: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="">-- Select --</option>
                {formData.related_to === 'product' && products.map((p) => (
                  <option key={p.id} value={p.id}>{p.name} {p.price ? `- ₦${p.price.toLocaleString()}` : ''}</option>
                ))}
                {(formData.related_to === 'puppy' || formData.related_to === 'stud') && 
                  getFilteredDogs().map((d) => (
                    <option key={d.id} value={d.id}>{d.name} {d.price ? `- ₦${d.price.toLocaleString()}` : ''}</option>
                  ))
                }
              </select>
            </div>
          )}

          {/* Link to Existing Sale */}
          {getAvailableSales().length > 0 && (
            <div>
              <label className="block font-medium mb-1 text-gray-700">Link to Existing Sale</label>
              <select
                value={formData.sale_id}
                onChange={(e) => setFormData({...formData, sale_id: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="">-- Not linked --</option>
                {getAvailableSales().map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.item_name} - ₦{s.price.toLocaleString()} ({s.payment_status})
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-400 mt-1">Link this debt to an existing partial payment</p>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block font-medium mb-1 text-gray-700">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              rows={3}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="Additional payment terms, agreement details, or special notes..."
            />
          </div>

          {/* Summary for Partial Payment */}
          {Number(formData.amount_paid) > 0 && Number(formData.original_amount) > 0 && (
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h3 className="font-bold text-blue-800 mb-2">📋 Payment Summary</h3>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Total Amount:</span>
                  <span className="font-bold">₦{Number(formData.original_amount).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Amount Paid Now:</span>
                  <span className="font-bold text-green-600">₦{Number(formData.amount_paid).toLocaleString()}</span>
                </div>
                <div className="flex justify-between pt-2 border-t">
                  <span className="font-bold">Remaining Balance:</span>
                  <span className="font-bold text-red-600">
                    ₦{(Number(formData.original_amount) - Number(formData.amount_paid)).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Due Date:</span>
                  <span>{new Date(formData.due_date).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-black text-white py-3 rounded-lg font-bold hover:bg-gray-800 disabled:opacity-50 transition"
            >
              {loading ? 'Creating...' : 'Create Debt Record'}
            </button>
            <Link
              href="/admin/debtors"
              className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-center"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>

      {/* Success Modal */}
      {showSuccessModal && createdDebt && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">✅</span>
              </div>
              <h2 className="text-2xl font-bold mb-2">Debt Recorded!</h2>
              <p className="text-gray-600 mb-4">The debt has been successfully recorded.</p>
              
              <div className="bg-gray-50 p-4 rounded-lg mb-4 text-left">
                <p><strong>Invoice:</strong> <span className="font-mono">{createdDebt.invoice_number}</span></p>
                <p><strong>Customer:</strong> {customers.find(c => c.id === createdDebt.customer_id)?.name}</p>
                <p><strong>Amount:</strong> ₦{createdDebt.original_amount.toLocaleString()}</p>
                <p><strong>Due Date:</strong> {new Date(createdDebt.due_date).toLocaleDateString()}</p>
                <p><strong>Balance:</strong> ₦{createdDebt.remaining_amount.toLocaleString()}</p>
              </div>
              
              <div className="flex gap-3">
                <Link
                  href={`/admin/debtors/${createdDebt.id}`}
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-bold hover:bg-blue-700"
                >
                  View Details
                </Link>
                <button
                  onClick={handleCloseSuccess}
                  className="flex-1 border border-gray-300 py-2 rounded-lg hover:bg-gray-50 transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}