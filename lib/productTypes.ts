export interface ProductVariation {
  size?: string;
  price?: number;
  compare_price?: number;
  stock?: number;
  in_stock?: boolean;
  sku?: string;
  weight?: string;
}

export interface Product {
  id: number | string;
  name: string;
  price: number;
  compare_price?: number;
  description?: string;
  images: string[];
  image?: string;
  category: string;
  in_stock: boolean;
  stock: number;
  featured?: boolean;
  brand?: string;
  variations?: ProductVariation[];
  created_at?: string;
}
