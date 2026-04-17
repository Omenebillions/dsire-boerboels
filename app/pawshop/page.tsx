// app/pawshop/page.tsx
"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import ProductCard from '@/app/components/Shop/ProductCard';
import { supabase } from '@/lib/supabase';

interface Variation {
  size: string;
  price: number;
  compare_price?: number;
  stock: number;
  in_stock: boolean;
  sku?: string;
  weight?: string;
}

interface Product {
  id: number;
  name: string;
  price: number;
  compare_price?: number;
  description: string;
  images: string[];
  category: string;
  in_stock: boolean;
  featured: boolean;
  stock: number;
  weight?: string;
  brand?: string;
  variations?: Variation[];
  created_at?: string;
}

const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "2347019996837";

export default function PawshopPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>(['all']);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [cartCount, setCartCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProducts();
    updateCartCount();
   
    window.addEventListener('cartUpdated', updateCartCount);
    return () => window.removeEventListener('cartUpdated', updateCartCount);
  }, []);

  const loadProducts = async () => {
    setLoading(true);
   
    const { data: productsData } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });
   
    setProducts((productsData as Product[]) || []);
   
    const uniqueCategories = productsData
      ? ['all', ...new Set(productsData.map((p: any) => p.category))]
      : ['all'];
   
    setCategories(uniqueCategories);
    setLoading(false);
  };

  useEffect(() => {
    const filterProducts = async () => {
      if (selectedCategory === 'all') {
        loadProducts();
      } else {
        setLoading(true);
        const { data } = await supabase
          .from('products')
          .select('*')
          .eq('category', selectedCategory)
          .order('created_at', { ascending: false });
       
        setProducts((data as Product[]) || []);
        setLoading(false);
      }
    };
   
    filterProducts();
  }, [selectedCategory]);

  const updateCartCount = () => {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const count = cart.reduce((sum: number, item: any) => sum + item.quantity, 0);
    setCartCount(count);
  };

  // Improved stock helper - respects per-variation in_stock
  const hasStock = (product: Product): boolean => {
    if (product.variations && product.variations.length > 0) {
      return product.variations.some(v => v.in_stock === true && v.stock > 0);
    }
    return product.in_stock && product.stock > 0;
  };

  // Filter by search
  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-48 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-64 mb-8"></div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-gray-200 rounded-xl h-64"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold">Dsire Pawshop</h1>
              <p className="text-gray-600">Everything your Pet needs</p>
            </div>
           
            <div className="flex items-center gap-4">
              {/* Search Bar */}
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full md:w-64 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-black"
              />
             
              {/* Cart Icon */}
              <Link href="/pawshop/cart" className="relative">
                <div className="bg-black text-white p-3 rounded-full hover:bg-gray-800 transition">
                  🛒
                  {cartCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-yellow-500 text-black text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center">
                      {cartCount}
                    </span>
                  )}
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Category Filter */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-full font-medium transition whitespace-nowrap ${
                selectedCategory === category
                  ? 'bg-black text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border'
              }`}
            >
              {category === 'all' ? 'All Products' : category}
            </button>
          ))}
        </div>
      </div>

      {/* Products Grid */}
      <div className="max-w-7xl mx-auto px-4 pb-12">
        {filteredProducts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No products found</p>
            <button
              onClick={() => {
                setSelectedCategory('all');
                setSearchQuery('');
              }}
              className="mt-4 text-black underline"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <>
            <div className="flex justify-between items-center mb-4">
              <p className="text-sm text-gray-500">
                {filteredProducts.length} products found
              </p>
              <p className="text-xs text-gray-400">
                {filteredProducts.filter(p => p.variations?.length).length} products have size options
              </p>
            </div>
           
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>

            {/* WhatsApp Contact Banner */}
            <div className="mt-12 bg-green-50 border border-green-200 rounded-xl p-6 text-center">
              <h3 className="font-bold text-lg mb-2">Need help choosing?</h3>
              <p className="text-gray-600 mb-4">
                Chat with us on WhatsApp for personalized recommendations or size guidance.
              </p>
              <a
                href={`https://wa.me/${WHATSAPP_NUMBER}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-green-700 transition shadow-md"
              >
                <span>💬</span> Chat on WhatsApp
              </a>
            </div>
          </>
        )}
      </div>
    </div>
  );
}