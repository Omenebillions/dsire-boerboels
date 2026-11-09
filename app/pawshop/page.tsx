// app/pawshop/page.tsx
"use client";
import { useState, useEffect } from 'react';
import ResponsiveShop from '@/app/pawshop/ResponsiveShop';
import { supabase } from '@/lib/supabase';
import type { Product, ProductVariation } from '@/lib/productTypes';
import { getActivePromotion, type ActivePromotion } from '@/lib/promotions';

interface SupabaseProduct {
  id: number;
  name: string;
  price: number | string;
  compare_price?: number | string;
  description: string;
  images: string[];
  category: string;
  in_stock: boolean | string | null;
  featured: boolean | string | null;
  stock: number | string | null;
  weight?: string;
  brand?: string;
  variations?: Array<Record<string, unknown>>;
  created_at?: string;
}

export default function PawshopPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [activePromo, setActivePromo] = useState<ActivePromotion | null>(null);
  const [categories, setCategories] = useState<string[]>(['all']);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [cartCount, setCartCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const asNumber = (value: unknown): number => {
    if (typeof value === 'number') {
      return value;
    }
    if (typeof value === 'string') {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : 0;
    }
    return 0;
  };

  const normalizeProduct = (product: SupabaseProduct): Product => ({
    ...product,
    stock: asNumber(product.stock),
    in_stock: product.in_stock === true,
    featured: product.featured === true,
    price: asNumber(product.price),
    compare_price: product.compare_price ? asNumber(product.compare_price) : undefined,
    variations: (product.variations || []).map((variation) => ({
      ...variation,
      size: typeof variation.size === 'string' ? variation.size : '',
      stock: asNumber(variation.stock),
      price: asNumber(variation.price),
      compare_price: variation.compare_price ? asNumber(variation.compare_price) : undefined,
    })) as ProductVariation[],
  });

  const loadProducts = async () => {
    setLoading(true);

    const { data: productsData, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading products:', error);
      setProducts([]);
      setCategories(['all']);
      setLoading(false);
      return;
    }

    if (productsData) {
      const normalizedProducts = productsData.map((product) => normalizeProduct(product as SupabaseProduct));
      setProducts(normalizedProducts);
      setAllProducts(normalizedProducts);

      const uniqueCategories = ['all', ...new Set(productsData.map((product) => product.category))];
      setCategories(uniqueCategories);
    }

    setLoading(false);
  };

  const updateCartCount = () => {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]') as Array<{ quantity: number }>;
    const count = cart.reduce((sum: number, item) => sum + item.quantity, 0);
    setCartCount(count);
  };

  useEffect(() => {
    const initialize = async () => {
      await loadProducts();
      updateCartCount();
    };

    void initialize();

    window.addEventListener('cartUpdated', updateCartCount);
    return () => window.removeEventListener('cartUpdated', updateCartCount);
  }, []);

  useEffect(() => {
    let isMounted = true;
    getActivePromotion()
      .then((promotion) => {
        if (isMounted) setActivePromo(promotion);
      })
      .catch((error: unknown) => {
        console.error('Error loading active promotion:', error);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!activePromo) return;
    const expirePromotion = () => {
      if (Date.parse(activePromo.end_time) <= Date.now()) setActivePromo(null);
    };
    const intervalId = window.setInterval(expirePromotion, 1000);
    return () => window.clearInterval(intervalId);
  }, [activePromo]);

  useEffect(() => {
    const filterProducts = async () => {
      if (selectedCategory === 'all') {
        await loadProducts();
      } else {
        setLoading(true);
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('category', selectedCategory)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error loading products by category:', error);
          setProducts([]);
        } else {
          const normalizedProducts = (data || []).map((product) => normalizeProduct(product as SupabaseProduct));
          setProducts(normalizedProducts);
        }

        setLoading(false);
      }
    };

    void filterProducts();
  }, [selectedCategory]);

  const filteredProducts = products.filter((product) =>
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
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
              {[...Array(8)].map((_, index) => (
                <div key={index} className="bg-gray-200 rounded-xl h-64"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ResponsiveShop
      products={filteredProducts}
      allProducts={allProducts}
      categories={categories}
      selectedCategory={selectedCategory}
      onSelectCategory={setSelectedCategory}
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      cartCount={cartCount}
      promo={activePromo}
    />
  );
}
