// app/components/Shop/ProductCard.tsx
"use client";
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { hasProductStock } from '@/lib/productStock';

// Define types locally if no central file exists
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
  description?: string;
  images: string[];
  category: string;
  in_stock: boolean;
  stock: number;
  featured?: boolean;
  brand?: string;
  variations?: Variation[];
}

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const [isAdding, setIsAdding] = useState(false);

  // Check if product has variations
  const hasVariations = product.variations && product.variations.length > 0;

  // Discount calculation (only for non-variation products)
  const discount = product.compare_price && product.compare_price > product.price && !hasVariations
    ? Math.round(((product.compare_price - product.price) / product.compare_price) * 100)
    : 0;

  const isInStock = hasProductStock(product);

  // Price display with range support for variations
  const minPrice = hasVariations
    ? Math.min(...product.variations!.map((v) => v.price))
    : product.price;

  const maxPrice = hasVariations
    ? Math.max(...product.variations!.map((v) => v.price))
    : product.price;

  const hasMultiplePrices = hasVariations && minPrice !== maxPrice;

  const priceDisplay = hasMultiplePrices
    ? `₦${minPrice.toLocaleString()} - ₦${maxPrice.toLocaleString()}`
    : `₦${minPrice.toLocaleString()}`;

  // Add to Cart - Fixed for variations
  const addToCart = () => {
    // If product has variations, navigate to product page for size selection
    if (hasVariations) {
      window.location.href = `/pawshop/product/${product.id}`;
      return;
    }

    // Only proceed with direct add for non-variation products
    setIsAdding(true);

    const cart = JSON.parse(localStorage.getItem('cart') || '[]') as Array<{
      id: number;
      name: string;
      price: number;
      image: string;
      quantity: number;
    }>;
    const existingItem = cart.find((item) => item.id === product.id);

    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      cart.push({
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.images?.[0] || '/shop/placeholder.jpg',
        quantity: 1,
      });
    }

    localStorage.setItem('cart', JSON.stringify(cart));

    setTimeout(() => {
      setIsAdding(false);
      window.dispatchEvent(new Event('cartUpdated'));
    }, 500);
  };

  return (
    <div className="group bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100">
      {/* Image Section */}
      <Link href={`/pawshop/product/${product.id}`} className="relative aspect-square overflow-hidden bg-gray-100 block">
        <Image
          src={product.images?.[0] || '/shop/placeholder.jpg'}
          alt={product.name}
          fill
          className="object-cover group-hover:scale-110 transition duration-500"
        />

        {/* Discount Badge - only for non-variation products */}
        {discount > 0 && (
          <span className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
            -{discount}%
          </span>
        )}

        {/* Variations Badge */}
        {hasVariations && isInStock && (
          <span className="absolute bottom-2 left-2 bg-black/70 text-white text-xs font-semibold px-2 py-1 rounded-full">
            {product.variations!.length} sizes
          </span>
        )}

        {/* Out of Stock Overlay */}
        {!isInStock && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="bg-white text-black px-3 py-1 rounded-full text-sm font-bold">
              Out of Stock
            </span>
          </div>
        )}
      </Link>

      {/* Content Section */}
      <div className="p-4">
        <p className="text-sm text-gray-500 mb-1">{product.category}</p>

        <Link href={`/pawshop/product/${product.id}`}>
          <h3 className="font-bold text-lg mb-2 hover:text-yellow-600 transition line-clamp-2">
            {product.name}
          </h3>
        </Link>

        {/* Price Display */}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xl font-bold text-green-600">
            {priceDisplay}
          </span>
          {product.compare_price && product.compare_price > product.price && !hasVariations && (
            <span className="text-sm text-gray-400 line-through">
              ₦{product.compare_price.toLocaleString()}
            </span>
          )}
        </div>

        {/* Action Button */}
        <button
          onClick={addToCart}
          disabled={!isInStock || isAdding}
          className={`w-full py-2 rounded-lg font-medium transition flex items-center justify-center gap-2 ${
            isInStock
              ? isAdding
                ? 'bg-green-500 text-white'
                : 'bg-black text-white hover:bg-gray-800'
              : 'bg-gray-200 text-gray-500 cursor-not-allowed'
          }`}
        >
          {isAdding 
            ? '✓ Added' 
            : hasVariations 
              ? 'Choose Size' 
              : '🛒 Add to Cart'
          }
        </button>
      </div>
    </div>
  );
}