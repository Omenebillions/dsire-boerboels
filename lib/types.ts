// lib/types.ts
export interface ProductVariation {
  size: 'Small' | 'Medium' | 'Large' | string;
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
  cost?: number;
  description: string;
  images: string[];
  category: string;
  in_stock: boolean;
  featured: boolean;
  stock: number;
  weight?: string;
  brand?: string;
  sku?: string;
  variations?: ProductVariation[];  // NEW FIELD
  created_at?: string;
}