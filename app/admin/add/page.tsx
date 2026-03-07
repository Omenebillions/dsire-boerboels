// app/admin/add/page.tsx
"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function AddPage() {
  const router = useRouter();
  const [type, setType] = useState<'dog' | 'product'>('dog');
  const [loading, setLoading] = useState(false);

  // Dog form fields
  const [dogData, setDogData] = useState({
    name: '',
    type: 'puppy',
    gender: 'male',
    price: '',
    status: 'available',
    age: '',
    color: '',
    description: ''
  });

  // Product form fields
  const [productData, setProductData] = useState({
    name: '',
    price: '',
    cost: '',
    category: 'Food',
    stock: '10',
    description: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (type === 'dog') {
      const { error } = await supabase.from('dogs').insert([{
        name: dogData.name,
        type: dogData.type,
        gender: dogData.gender,
        price: dogData.price ? Number(dogData.price) : null,
        status: dogData.status,
        age: dogData.age,
        color: dogData.color,
        description: dogData.description
      }]);

      if (error) {
        alert('Error adding dog: ' + error.message);
      } else {
        alert('Dog added successfully!');
        router.push('/admin/dogs');
      }
    } else {
      const { error } = await supabase.from('products').insert([{
        name: productData.name,
        price: Number(productData.price),
        cost: productData.cost ? Number(productData.cost) : null,
        category: productData.category,
        stock: Number(productData.stock),
        description: productData.description
      }]);

      if (error) {
        alert('Error adding product: ' + error.message);
      } else {
        alert('Product added successfully!');
        router.push('/admin/products');
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4">
        <h1 className="text-3xl font-bold mb-6">Add New Item</h1>

        {/* Type Selector */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setType('dog')}
            className={`flex-1 py-3 rounded-lg font-bold ${
              type === 'dog' 
                ? 'bg-black text-white' 
                : 'bg-gray-200 text-gray-700'
            }`}
          >
            🐕 Add Dog
          </button>
          <button
            onClick={() => setType('product')}
            className={`flex-1 py-3 rounded-lg font-bold ${
              type === 'product' 
                ? 'bg-black text-white' 
                : 'bg-gray-200 text-gray-700'
            }`}
          >
            🛍️ Add Product
          </button>
        </div>

        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow">
          {type === 'dog' ? (
            // Dog Form
            <div className="space-y-4">
              <h2 className="text-xl font-bold">Add New Dog</h2>
              
              <div>
                <label className="block font-medium mb-1">Dog Name *</label>
                <input
                  type="text"
                  required
                  value={dogData.name}
                  onChange={(e) => setDogData({...dogData, name: e.target.value})}
                  className="w-full p-2 border rounded"
                  placeholder="e.g., King Max"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium mb-1">Type</label>
                  <select
                    value={dogData.type}
                    onChange={(e) => setDogData({...dogData, type: e.target.value})}
                    className="w-full p-2 border rounded"
                  >
                    <option value="puppy">🐕 Puppy</option>
                    <option value="stud">👑 Stud</option>
                    <option value="female">🐩 Female</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium mb-1">Gender</label>
                  <select
                    value={dogData.gender}
                    onChange={(e) => setDogData({...dogData, gender: e.target.value})}
                    className="w-full p-2 border rounded"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium mb-1">Price (₦)</label>
                  <input
                    type="number"
                    value={dogData.price}
                    onChange={(e) => setDogData({...dogData, price: e.target.value})}
                    className="w-full p-2 border rounded"
                    placeholder="e.g., 1500000"
                  />
                </div>
                <div>
                  <label className="block font-medium mb-1">Status</label>
                  <select
                    value={dogData.status}
                    onChange={(e) => setDogData({...dogData, status: e.target.value})}
                    className="w-full p-2 border rounded"
                  >
                    <option value="available">✅ Available</option>
                    <option value="reserved">⏳ Reserved</option>
                    <option value="sold">💰 Sold</option>
                    <option value="retired">👴 Retired</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium mb-1">Age</label>
                  <input
                    type="text"
                    value={dogData.age}
                    onChange={(e) => setDogData({...dogData, age: e.target.value})}
                    className="w-full p-2 border rounded"
                    placeholder="e.g., 8 weeks"
                  />
                </div>
                <div>
                  <label className="block font-medium mb-1">Color</label>
                  <input
                    type="text"
                    value={dogData.color}
                    onChange={(e) => setDogData({...dogData, color: e.target.value})}
                    className="w-full p-2 border rounded"
                    placeholder="e.g., Brown Brindle"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium mb-1">Description</label>
                <textarea
                  value={dogData.description}
                  onChange={(e) => setDogData({...dogData, description: e.target.value})}
                  rows={4}
                  className="w-full p-2 border rounded"
                  placeholder="Describe the dog's temperament, health, etc."
                />
              </div>
            </div>
          ) : (
            // Product Form
            <div className="space-y-4">
              <h2 className="text-xl font-bold">Add New Product</h2>
              
              <div>
                <label className="block font-medium mb-1">Product Name *</label>
                <input
                  type="text"
                  required
                  value={productData.name}
                  onChange={(e) => setProductData({...productData, name: e.target.value})}
                  className="w-full p-2 border rounded"
                  placeholder="e.g., Premium Dog Food"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium mb-1">Price (₦) *</label>
                  <input
                    type="number"
                    required
                    value={productData.price}
                    onChange={(e) => setProductData({...productData, price: e.target.value})}
                    className="w-full p-2 border rounded"
                  />
                </div>
                <div>
                  <label className="block font-medium mb-1">Cost (₦)</label>
                  <input
                    type="number"
                    value={productData.cost}
                    onChange={(e) => setProductData({...productData, cost: e.target.value})}
                    className="w-full p-2 border rounded"
                    placeholder="For profit calc"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium mb-1">Category</label>
                  <select
                    value={productData.category}
                    onChange={(e) => setProductData({...productData, category: e.target.value})}
                    className="w-full p-2 border rounded"
                  >
                    <option>Food</option>
                    <option>Toys</option>
                    <option>Grooming</option>
                    <option>Treats</option>
                    <option>Accessories</option>
                    <option>Health</option>
                    <option>Supplies</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium mb-1">Stock</label>
                  <input
                    type="number"
                    value={productData.stock}
                    onChange={(e) => setProductData({...productData, stock: e.target.value})}
                    className="w-full p-2 border rounded"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium mb-1">Description</label>
                <textarea
                  value={productData.description}
                  onChange={(e) => setProductData({...productData, description: e.target.value})}
                  rows={4}
                  className="w-full p-2 border rounded"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black text-white py-3 rounded-lg hover:bg-gray-800 disabled:opacity-50 mt-6"
          >
            {loading ? 'Adding...' : `Add ${type === 'dog' ? 'Dog' : 'Product'}`}
          </button>
        </form>
      </div>
    </div>
  );
}