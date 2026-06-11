// lib/products.ts
import { supabase } from './supabase';

export interface Variation {
  size: string;
  price: number;
  compare_price?: number;
  stock: number;
  sku?: string;
  weight?: string;
}

export interface Product {
  id: number;
  name: string;
  price: number;
  compare_price?: number;
  description: string;
  images: string[];
  category: string;
  in_stock: boolean;
  featured: boolean;
  stock: number;  // Total stock (sum of variations for variable products)
  weight?: string;
  brand?: string;
  variations?: Variation[];  // Add variations support
  created_at?: string;
}

export interface ProductVariationLike {
  stock?: number | string | null;
  in_stock?: boolean | null;
}

export interface ProductLike {
  in_stock?: boolean | null;
  stock?: number | string | null;
  variations?: ProductVariationLike[] | null;
}

export const hasVariationStock = (variation?: ProductVariationLike | null): boolean => {
  const stockValue = Number(variation?.stock ?? 0);

  if (stockValue > 0) {
    return true;
  }

  if (typeof variation?.in_stock === 'boolean') {
    return variation.in_stock && stockValue > 0;
  }

  return false;
};

export const hasProductStock = (product?: ProductLike | null): boolean => {
  if (!product) {
    return false;
  }

  if (Array.isArray(product.variations) && product.variations.length > 0) {
    return product.variations.some(hasVariationStock);
  }

  const stockValue = Number(product.stock ?? 0);

  if (stockValue > 0) {
    return true;
  }

  if (typeof product.in_stock === 'boolean') {
    return product.in_stock && stockValue > 0;
  }

  return false;
};

// Helper function to normalize product data (convert strings to numbers)
const normalizeProduct = (product: any): Product => {
  return {
    ...product,
    stock: Number(product.stock) || 0,
    in_stock: product.in_stock === true,
    featured: product.featured === true,
    price: Number(product.price) || 0,
    compare_price: product.compare_price ? Number(product.compare_price) : undefined,
    variations: product.variations?.map((v: any) => ({
      ...v,
      stock: Number(v.stock) || 0,
      price: Number(v.price) || 0,
      compare_price: v.compare_price ? Number(v.compare_price) : undefined
    }))
  };
};

// Get all products
export const getAllProducts = async (): Promise<Product[]> => {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching products:', error);
    return [];
  }
  
  // Normalize all products
  return (data || []).map(normalizeProduct);
};

// Get product by ID
export const getProductById = async (id: number): Promise<Product | null> => {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) {
    console.error('Error fetching product:', error);
    return null;
  }
  
  return data ? normalizeProduct(data) : null;
};

// Get products by category
export const getProductsByCategory = async (category: string): Promise<Product[]> => {
  let query = supabase.from('products').select('*');
  
  if (category !== 'all') {
    query = query.eq('category', category);
  }
  
  const { data, error } = await query.order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching products:', error);
    return [];
  }
  
  return (data || []).map(normalizeProduct);
};

// Get products by category with variations filter
export const getProductsByCategoryWithStock = async (category: string): Promise<Product[]> => {
  let query = supabase.from('products').select('*');
  
  if (category !== 'all') {
    query = query.eq('category', category);
  }
  
  const { data, error } = await query.order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching products:', error);
    return [];
  }
  
  // Filter to only show products with stock > 0
  const products = (data || []).map(normalizeProduct);
  return products.filter(p => p.stock > 0);
};

// Get featured products
export const getFeaturedProducts = async (): Promise<Product[]> => {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('featured', true)
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching featured products:', error);
    return [];
  }
  
  const products = (data || []).map(normalizeProduct);
  return products.filter(p => p.stock > 0);
};

// Get all unique categories
export const getCategories = async (): Promise<string[]> => {
  const { data, error } = await supabase
    .from('products')
    .select('category')
    .order('category');
  
  if (error) {
    console.error('Error fetching categories:', error);
    return ['all'];
  }
  
  const categories = [...new Set(data.map(item => item.category))];
  return ['all', ...categories];
};

// Search products by name or description
export const searchProducts = async (query: string): Promise<Product[]> => {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error searching products:', error);
    return [];
  }
  
  return (data || []).map(normalizeProduct);
};

// Get products with low stock (for admin)
export const getLowStockProducts = async (threshold: number = 5): Promise<Product[]> => {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .lt('stock', threshold)
    .order('stock', { ascending: true });
  
  if (error) {
    console.error('Error fetching low stock products:', error);
    return [];
  }
  
  return (data || []).map(normalizeProduct);
};

// Update product stock (for admin and orders)
export const updateProductStock = async (id: number, newStock: number): Promise<boolean> => {
  const { error } = await supabase
    .from('products')
    .update({ 
      stock: newStock,
      in_stock: newStock > 0
    })
    .eq('id', id);
  
  if (error) {
    console.error('Error updating product stock:', error);
    return false;
  }
  
  return true;
};

// Update variation stock (for products with variations)
export const updateVariationStock = async (
  productId: number, 
  variationSize: string, 
  newStock: number
): Promise<boolean> => {
  // First get the current product
  const { data: product, error: fetchError } = await supabase
    .from('products')
    .select('variations, stock')
    .eq('id', productId)
    .single();
  
  if (fetchError || !product) {
    console.error('Error fetching product for variation update:', fetchError);
    return false;
  }
  
  // Update the specific variation
  const updatedVariations = product.variations?.map((v: any) => {
    if (v.size === variationSize) {
      return { ...v, stock: newStock };
    }
    return v;
  });
  
  // Calculate new total stock
  const totalStock = updatedVariations?.reduce((sum: number, v: any) => sum + (v.stock || 0), 0) || 0;
  
  // Update the product
  const { error: updateError } = await supabase
    .from('products')
    .update({
      variations: updatedVariations,
      stock: totalStock,
      in_stock: totalStock > 0
    })
    .eq('id', productId);
  
  if (updateError) {
    console.error('Error updating variation stock:', updateError);
    return false;
  }
  
  return true;
};