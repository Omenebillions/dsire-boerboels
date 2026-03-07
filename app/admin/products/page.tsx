// app/admin/products/page.tsx
"use client";
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import Image from 'next/image';

// Define the Product interface
interface Product {
  id: number;
  name: string;
  description?: string;
  price: number;
  cost?: number;
  compare_price?: number;
  category: string;
  images?: string[];
  stock: number;
  in_stock: boolean;
  featured?: boolean;
  weight?: string;
  brand?: string;
  sku?: string;
  created_at?: string;
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    const { data } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });
    
    setProducts((data as Product[]) || []);
    setLoading(false);
  };

  const deleteProduct = async (id: number, name: string) => {
    if (confirm(`Delete ${name}?`)) {
      await supabase.from('products').delete().eq('id', id);
      fetchProducts();
    }
  };

  const toggleFeatured = async (id: number, current: boolean) => {
    await supabase
      .from('products')
      .update({ featured: !current })
      .eq('id', id);
    fetchProducts();
  };

  const filteredProducts = products.filter((p: Product) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    total: products.length,
    inStock: products.filter((p: Product) => p.in_stock).length,
    outOfStock: products.filter((p: Product) => !p.in_stock).length,
    featured: products.filter((p: Product) => p.featured).length,
    totalValue: products.reduce((sum: number, p: Product) => sum + (p.price * p.stock), 0)
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-48 mb-6"></div>
          <div className="grid grid-cols-5 gap-4 mb-6">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">🛍️ Products</h1>
            <p className="text-gray-500">Manage your pawshop inventory</p>
          </div>
          <Link
            href="/admin/products/new"
            className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800"
          >
            + Add Product
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-sm text-gray-500">Total Products</p>
            <p className="text-2xl font-bold">{stats.total}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border-l-4 border-green-500">
            <p className="text-sm text-gray-500">In Stock</p>
            <p className="text-2xl font-bold text-green-600">{stats.inStock}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border-l-4 border-red-500">
            <p className="text-sm text-gray-500">Out of Stock</p>
            <p className="text-2xl font-bold text-red-600">{stats.outOfStock}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border-l-4 border-yellow-500">
            <p className="text-sm text-gray-500">Featured</p>
            <p className="text-2xl font-bold text-yellow-600">{stats.featured}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border-l-4 border-blue-500">
            <p className="text-sm text-gray-500">Inventory Value</p>
            <p className="text-2xl font-bold text-blue-600">₦{stats.totalValue.toLocaleString()}</p>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white p-4 rounded-lg shadow mb-6">
          <input
            type="text"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-2 border rounded"
          />
        </div>

        {/* Products Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-3 text-left">Image</th>
                  <th className="p-3 text-left">Name</th>
                  <th className="p-3 text-left">Category</th>
                  <th className="p-3 text-left">Price</th>
                  <th className="p-3 text-left">Cost</th>
                  <th className="p-3 text-left">Profit</th>
                  <th className="p-3 text-left">Stock</th>
                  <th className="p-3 text-left">Status</th>
                  <th className="p-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product: Product) => {
                  const profit = product.price - (product.cost || 0);
                  const margin = product.cost ? ((profit / product.price) * 100).toFixed(0) : 0;
                  
                  return (
                    <tr key={product.id} className="border-t hover:bg-gray-50">
                      <td className="p-2">
                        <div className="w-12 h-12 bg-gray-200 rounded overflow-hidden">
                          {product.images?.[0] ? (
                            <Image 
                              src={product.images[0]} 
                              alt={product.name} 
                              width={48} 
                              height={48} 
                              className="object-cover w-full h-full"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-2xl">🛍️</div>
                          )}
                        </div>
                      </td>
                      <td className="p-3 font-medium">
                        {product.name}
                        {product.featured && <span className="ml-2 text-yellow-500">⭐</span>}
                      </td>
                      <td className="p-3">{product.category}</td>
                      <td className="p-3">₦{product.price.toLocaleString()}</td>
                      <td className="p-3">{product.cost ? `₦${product.cost.toLocaleString()}` : '-'}</td>
                      <td className="p-3">
                        <span className={profit > 0 ? 'text-green-600' : 'text-red-600'}>
                          ₦{profit.toLocaleString()} ({margin}%)
                        </span>
                      </td>
                      <td className="p-3">
                        <span className={product.stock > 5 ? 'text-green-600' : product.stock > 0 ? 'text-yellow-600' : 'text-red-600'}>
                          {product.stock}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          product.in_stock ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {product.in_stock ? 'In Stock' : 'Out of Stock'}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="flex gap-2">
                          <button
                            onClick={() => toggleFeatured(product.id, product.featured || false)}
                            className="text-yellow-600 hover:text-yellow-700"
                            title={product.featured ? 'Remove featured' : 'Mark featured'}
                          >
                            ⭐
                          </button>
                          <Link href={`/admin/products/edit/${product.id}`} className="text-blue-600 hover:underline">Edit</Link>
                          <button onClick={() => deleteProduct(product.id, product.name)} className="text-red-600 hover:underline">Delete</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {filteredProducts.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No products found</p>
              <Link href="/admin/products/new" className="text-blue-600 hover:underline mt-2 block">
                Add your first product
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}