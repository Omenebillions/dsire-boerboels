// app/admin/products/page.tsx
"use client";
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import Image from 'next/image';

interface Variation {
  size: string;
  price: number;
  stock: number;
}

interface Product {
  id: number;
  name: string;
  price: number;
  category: string;
  stock: number;
  in_stock: boolean;
  featured: boolean;
  images?: string[];
  variations?: Variation[];
  created_at?: string;
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [stockFilter, setStockFilter] = useState('all');

  useEffect(() => {
    fetchProducts();
  }, [categoryFilter, stockFilter]);

  const fetchProducts = async () => {
    setLoading(true);
    let query = supabase.from('products').select('*');
    
    if (categoryFilter !== 'all') {
      query = query.eq('category', categoryFilter);
    }
    
    const { data } = await query.order('created_at', { ascending: false });
    let allProducts = (data as Product[]) || [];
    
    // Apply stock filter after fetching
    if (stockFilter !== 'all') {
      allProducts = allProducts.filter(product => {
        const hasVariations = product.variations && product.variations.length > 0;
        
        if (hasVariations) {
          const totalStock = product.variations!.reduce((sum, v) => sum + (Number(v.stock) || 0), 0);
          
          if (stockFilter === 'in-stock') return totalStock > 0;
          if (stockFilter === 'low-stock') {
            const hasLowStock = product.variations!.some(v => Number(v.stock) > 0 && Number(v.stock) < 5);
            return hasLowStock;
          }
          if (stockFilter === 'out-of-stock') return totalStock === 0;
        } else {
          const productStock = Number(product.stock) || 0;
          if (stockFilter === 'in-stock') return product.in_stock && productStock > 0;
          if (stockFilter === 'low-stock') return productStock > 0 && productStock < 5;
          if (stockFilter === 'out-of-stock') return !product.in_stock || productStock === 0;
        }
        return true;
      });
    }
    
    setProducts(allProducts);
    setLoading(false);
  };

  const deleteProduct = async (id: number, name: string) => {
    if (!confirm(`Are you sure you want to delete ${name}?`)) return;
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (!error) {
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

  // Get accurate product stock info
  const getProductStockInfo = (product: Product) => {
    const hasVariations = product.variations && product.variations.length > 0;
    
    if (hasVariations) {
      // Calculate total stock from all variations
      const totalStock = product.variations!.reduce((sum, v) => sum + (Number(v.stock) || 0), 0);
      const sizesWithStock = product.variations!.filter(v => (Number(v.stock) || 0) > 0).length;
      const isInStock = totalStock > 0;
      
      return {
        totalStock,
        isInStock,
        displayText: totalStock > 0 ? `${sizesWithStock}/${product.variations!.length} sizes (${totalStock} units)` : 'Out of stock',
        stockClass: totalStock > 0 ? 'text-green-600' : 'text-red-600'
      };
    }
    
    const productStock = Number(product.stock) || 0;
    return {
      totalStock: productStock,
      isInStock: product.in_stock && productStock > 0,
      displayText: productStock.toString(),
      stockClass: productStock > 5 ? 'text-green-600' : productStock > 0 ? 'text-yellow-600' : 'text-red-600'
    };
  };

  // Get unique categories
  const categories = ['all', ...new Set(products.map(p => p.category))];

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    total: products.length,
    inStock: products.filter(p => {
      const info = getProductStockInfo(p);
      return info.isInStock;
    }).length,
    lowStock: products.filter(p => {
      const hasVariations = p.variations && p.variations.length > 0;
      if (hasVariations) {
        return p.variations!.some(v => Number(v.stock) > 0 && Number(v.stock) < 5);
      }
      return (Number(p.stock) || 0) > 0 && (Number(p.stock) || 0) < 5;
    }).length,
    outOfStock: products.filter(p => {
      const info = getProductStockInfo(p);
      return !info.isInStock;
    }).length,
    featured: products.filter(p => p.featured).length,
    withVariations: products.filter(p => p.variations && p.variations.length > 0).length
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-50 p-8 flex items-center justify-center">
      <p className="animate-pulse text-xl font-semibold">Loading Products...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">🛍️ Products</h1>
            <p className="text-gray-600 text-sm mt-1">Manage your pawshop inventory</p>
          </div>
          <Link 
            href="/admin/products/new" 
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2.5 rounded-lg flex items-center gap-2 shadow-md transition-all transform hover:scale-105"
          >
            <span>➕</span> <span>Add Product</span>
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
          <div className="bg-white p-4 rounded-lg shadow-sm text-center">
            <p className="text-xs text-gray-500">Total</p>
            <p className="text-2xl font-bold">{stats.total}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm text-center border-l-4 border-green-500">
            <p className="text-xs text-gray-500">In Stock</p>
            <p className="text-2xl font-bold text-green-600">{stats.inStock}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm text-center border-l-4 border-yellow-500">
            <p className="text-xs text-gray-500">Low Stock</p>
            <p className="text-2xl font-bold text-yellow-600">{stats.lowStock}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm text-center border-l-4 border-red-500">
            <p className="text-xs text-gray-500">Out of Stock</p>
            <p className="text-2xl font-bold text-red-600">{stats.outOfStock}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm text-center border-l-4 border-purple-500">
            <p className="text-xs text-gray-500">With Sizes</p>
            <p className="text-2xl font-bold text-purple-600">{stats.withVariations}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-lg shadow-sm mb-6 grid md:grid-cols-4 gap-3">
          <input 
            type="text" 
            placeholder="Search products..." 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
            className="p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none md:col-span-2" 
          />
          <select 
            value={categoryFilter} 
            onChange={(e) => setCategoryFilter(e.target.value)} 
            className="p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="all">All Categories</option>
            {categories.filter(c => c !== 'all').map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          <select 
            value={stockFilter} 
            onChange={(e) => setStockFilter(e.target.value)} 
            className="p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="all">All Stock</option>
            <option value="in-stock">In Stock</option>
            <option value="low-stock">Low Stock</option>
            <option value="out-of-stock">Out of Stock</option>
          </select>
        </div>

        {/* Products Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px]">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="p-4 text-left text-sm font-semibold text-gray-600">Image</th>
                  <th className="p-4 text-left text-sm font-semibold text-gray-600">Name</th>
                  <th className="p-4 text-left text-sm font-semibold text-gray-600">Category</th>
                  <th className="p-4 text-left text-sm font-semibold text-gray-600">Price</th>
                  <th className="p-4 text-left text-sm font-semibold text-gray-600">Stock</th>
                  <th className="p-4 text-left text-sm font-semibold text-gray-600">Status</th>
                  <th className="p-4 text-left text-sm font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product) => {
                  const stockInfo = getProductStockInfo(product);
                  const hasVariations = product.variations && product.variations.length > 0;
                  
                  return (
                    <tr key={product.id} className="border-b hover:bg-gray-50 transition">
                      <td className="p-4">
                        <div className="w-10 h-10 bg-gray-100 rounded-lg overflow-hidden relative">
                          {product.images?.[0] ? (
                            <Image src={product.images[0]} alt={product.name} fill className="object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-lg">🛍️</div>
                          )}
                        </div>
                      </td>
                      <td className="p-4 font-medium text-gray-900">
                        <div className="flex items-center gap-2 flex-wrap">
                          {product.name}
                          {product.featured && <span className="text-yellow-500 text-xs">⭐</span>}
                          {hasVariations && (
                            <span className="bg-purple-100 text-purple-600 text-xs px-2 py-0.5 rounded-full whitespace-nowrap">
                              📦 {product.variations!.length} sizes
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-4 text-gray-700">{product.category}</td>
                      <td className="p-4 font-medium text-gray-900">
                        {hasVariations ? (
                          <span className="text-sm">
                            ₦{Math.min(...product.variations!.map(v => Number(v.price))).toLocaleString()}
                            {Math.min(...product.variations!.map(v => Number(v.price))) !== Math.max(...product.variations!.map(v => Number(v.price))) && 
                              ` - ₦${Math.max(...product.variations!.map(v => Number(v.price))).toLocaleString()}`
                            }
                          </span>
                        ) : (
                          `₦${Number(product.price).toLocaleString()}`
                        )}
                      </td>
                      <td className="p-4">
                        <span className={`font-medium ${stockInfo.stockClass}`}>
                          {stockInfo.displayText}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                          stockInfo.isInStock ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {stockInfo.isInStock ? '✅ In Stock' : '❌ Out of Stock'}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => toggleFeatured(product.id, product.featured)}
                            className={`text-xs font-medium ${product.featured ? 'text-yellow-600' : 'text-gray-400'}`}
                            title={product.featured ? 'Remove featured' : 'Mark featured'}
                          >
                            ⭐
                          </button>
                          <Link 
                            href={`/admin/products/edit/${product.id}`} 
                            className="text-blue-600 hover:underline text-xs font-medium"
                          >
                            Edit
                          </Link>
                          <button 
                            onClick={() => deleteProduct(product.id, product.name)} 
                            className="text-red-600 hover:underline text-xs font-medium"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {filteredProducts.length === 0 && (
            <div className="p-12 text-center text-gray-500">
              <p className="text-lg">No products found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}