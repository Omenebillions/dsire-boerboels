// app/admin/products/new/page.tsx
"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default function NewProductPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    cost: '',
    compare_price: '',
    description: '',
    category: 'Food',
    stock: '10',
    in_stock: true,
    featured: false,
    weight: '',
    brand: '',
    sku: '',
    images: ['']
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const productData = {
      name: formData.name,
      price: Number(formData.price),
      cost: formData.cost ? Number(formData.cost) : null,
      compare_price: formData.compare_price ? Number(formData.compare_price) : null,
      description: formData.description,
      category: formData.category,
      stock: Number(formData.stock),
      in_stock: formData.in_stock,
      featured: formData.featured,
      weight: formData.weight || null,
      brand: formData.brand || null,
      sku: formData.sku || `PRD-${Date.now()}`,
      images: formData.images.filter(img => img.trim() !== '')
    };

    const { error } = await supabase
      .from('products')
      .insert([productData]);

    if (error) {
      alert('Error adding product: ' + error.message);
    } else {
      alert('Product added successfully!');
      router.push('/admin/products');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Add New Product</h1>
          <p className="text-gray-500">Add a new product to your pawshop inventory</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold border-b pb-2">Basic Information</h2>
            
            <div>
              <label className="block font-medium mb-1">Product Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Premium Dog Food - Large Breed"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-medium mb-1">Price (₦) *</label>
                <input
                  type="number"
                  required
                  value={formData.price}
                  onChange={(e) => setFormData({...formData, price: e.target.value})}
                  className="w-full p-2 border rounded"
                  placeholder="45000"
                />
              </div>
              <div>
                <label className="block font-medium mb-1">Cost (₦)</label>
                <input
                  type="number"
                  value={formData.cost}
                  onChange={(e) => setFormData({...formData, cost: e.target.value})}
                  className="w-full p-2 border rounded"
                  placeholder="35000 (for profit calc)"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-medium mb-1">Compare Price (₦)</label>
                <input
                  type="number"
                  value={formData.compare_price}
                  onChange={(e) => setFormData({...formData, compare_price: e.target.value})}
                  className="w-full p-2 border rounded"
                  placeholder="55000 (for discount)"
                />
              </div>
              <div>
                <label className="block font-medium mb-1">Category *</label>
                <select
                  required
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                  className="w-full p-2 border rounded"
                >
                  <option value="Food">🍖 Food</option>
                  <option value="Toys">🧸 Toys</option>
                  <option value="Grooming">✂️ Grooming</option>
                  <option value="Treats">🦴 Treats</option>
                  <option value="Accessories">🪢 Accessories</option>
                  <option value="Health">💊 Health</option>
                  <option value="Bundles">📦 Bundles</option>
                  <option value="Training">🎯 Training</option>
                  <option value="Books">📚 Books</option>
                </select>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold border-b pb-2">Description & Details</h2>
            
            <div>
              <label className="block font-medium mb-1">Description *</label>
              <textarea
                required
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                rows={4}
                className="w-full p-2 border rounded"
                placeholder="Product description, features, benefits..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-medium mb-1">Weight</label>
                <input
                  type="text"
                  value={formData.weight}
                  onChange={(e) => setFormData({...formData, weight: e.target.value})}
                  className="w-full p-2 border rounded"
                  placeholder="e.g., 15kg"
                />
              </div>
              <div>
                <label className="block font-medium mb-1">Brand</label>
                <input
                  type="text"
                  value={formData.brand}
                  onChange={(e) => setFormData({...formData, brand: e.target.value})}
                  className="w-full p-2 border rounded"
                  placeholder="e.g., Royal Canin"
                />
              </div>
            </div>

            <div>
              <label className="block font-medium mb-1">SKU (Stock Keeping Unit)</label>
              <input
                type="text"
                value={formData.sku}
                onChange={(e) => setFormData({...formData, sku: e.target.value})}
                className="w-full p-2 border rounded"
                placeholder="PRD-001 (auto-generated if empty)"
              />
            </div>
          </div>

          {/* Inventory */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold border-b pb-2">Inventory</h2>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-medium mb-1">Stock Quantity *</label>
                <input
                  type="number"
                  required
                  value={formData.stock}
                  onChange={(e) => setFormData({...formData, stock: e.target.value})}
                  className="w-full p-2 border rounded"
                  placeholder="10"
                />
              </div>
              <div className="flex items-end gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.in_stock}
                    onChange={(e) => setFormData({...formData, in_stock: e.target.checked})}
                    className="w-4 h-4"
                  />
                  <span>In Stock</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.featured}
                    onChange={(e) => setFormData({...formData, featured: e.target.checked})}
                    className="w-4 h-4"
                  />
                  <span>Featured Product</span>
                </label>
              </div>
            </div>
          </div>

          {/* Images */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold border-b pb-2">Images</h2>
            
            <div>
              <label className="block font-medium mb-1">Main Image URL *</label>
              <input
                type="text"
                required
                value={formData.images[0]}
                onChange={(e) => setFormData({...formData, images: [e.target.value]})}
                className="w-full p-2 border rounded"
                placeholder="/shop/product-image.jpg"
              />
              <p className="text-xs text-gray-500 mt-1">
                Place image in /public/shop/ folder first
              </p>
            </div>

            {formData.images[0] && (
              <div className="mt-2 p-2 bg-gray-50 rounded">
                <p className="text-sm font-medium">Preview:</p>
                <img 
                  src={formData.images[0]} 
                  alt="Preview" 
                  className="mt-2 h-20 w-20 object-cover rounded border"
                  onError={(e) => (e.currentTarget.style.display = 'none')}
                />
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-black text-white py-3 rounded-lg hover:bg-gray-800 disabled:opacity-50 transition"
            >
              {loading ? 'Adding Product...' : 'Add Product'}
            </button>
            <Link
              href="/admin/products"
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