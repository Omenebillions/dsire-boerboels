// app/components/Shop/ProductCard.tsx
"use client";
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { hasProductStock } from '@/lib/productStock';
import type { Product } from '@/lib/productTypes';

interface ProductCardProps {
  product: Product;
  promo?: { override_before_price: number; override_after_price: number } | null;
  themeColor?: string;
  compact?: boolean;
}

export default function ProductCard({ product, promo, themeColor, compact = false }: ProductCardProps) {
  const [isAdding, setIsAdding] = useState(false);

  // Check if product has variations
  const variations = product.variations ?? [];
  const hasVariations = variations.length > 0;

  // Discount calculation (only for non-variation products)
  const activePromo = promo && promo.override_after_price < promo.override_before_price
    ? promo
    : null;

  const discount = activePromo
    ? Math.round(
        ((activePromo.override_before_price - activePromo.override_after_price) /
          activePromo.override_before_price) *
          100
      )
    : product.compare_price && product.compare_price > product.price && !hasVariations
    ? Math.round(((product.compare_price - product.price) / product.compare_price) * 100)
    : 0;

  const isInStock = hasProductStock(product);

  // Price display with range support for variations
  const minPrice = hasVariations
    ? Math.min(...variations.map((v) => Number(v.price ?? 0)))
    : product.price;

  const maxPrice = hasVariations
    ? Math.max(...variations.map((v) => Number(v.price ?? 0)))
    : product.price;

  const hasMultiplePrices = hasVariations && minPrice !== maxPrice;

  const priceDisplay = activePromo
    ? `₦${activePromo.override_after_price.toLocaleString()}`
    : hasMultiplePrices
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
      id: number | string;
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
        price: activePromo?.override_after_price ?? product.price,
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
    <div className={`group overflow-hidden border border-gray-100 bg-white transition-all duration-300 ${
      compact
        ? 'rounded-xl shadow-sm hover:shadow-md'
        : 'rounded-xl shadow-md hover:shadow-xl'
    }`}>
      {/* Image Section */}
      <div className={`relative block overflow-hidden bg-gray-100 ${compact ? 'aspect-[4/3]' : 'aspect-square'}`}>
        <Link href={`/pawshop/product/${product.id}`} className="absolute inset-0">
          <Image
            src={product.images?.[0] || '/shop/placeholder.jpg'}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-110 transition duration-500"
          />

          {/* Discount Badge - only for non-variation products */}
          {discount > 0 && (
            <span
              className={`absolute top-2 ${activePromo ? 'right-2' : 'left-2 bg-red-500'} text-white text-xs font-bold px-2 py-1 rounded`}
              style={{ backgroundColor: activePromo ? themeColor || '#a31542' : undefined }}
            >
              -{discount}%
            </span>
          )}

          {/* Variations Badge */}
          {hasVariations && isInStock && (
            <span className="absolute bottom-2 left-2 bg-black/70 text-white text-xs font-semibold px-2 py-1 rounded-full">
              {variations.length} sizes
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

        {compact && isInStock && (
          <button
            type="button"
            onClick={addToCart}
            disabled={isAdding}
            aria-label={hasVariations ? `Choose a size for ${product.name}` : `Add ${product.name} to cart`}
            className="absolute bottom-2 right-2 flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-gray-900 text-2xl leading-none text-white shadow-lg hover:bg-gray-700 disabled:opacity-70"
          >
            {isAdding ? '✓' : '+'}
          </button>
        )}
      </div>

      {/* Content Section */}
      <div className={compact ? 'p-3' : 'p-4'}>
        {!compact && <p className="mb-1 text-sm text-gray-500">{product.category}</p>}

        <Link href={`/pawshop/product/${product.id}`}>
          <h3 className={`mb-2 font-bold hover:text-yellow-600 transition line-clamp-2 ${
            compact ? 'min-h-10 text-sm' : 'text-lg'
          }`}>
            {product.name}
          </h3>
        </Link>

        {/* Price Display */}
        <div className={`mb-3 flex flex-wrap items-center gap-2 ${compact ? 'min-h-7' : ''}`}>
          <span
            className={`${compact ? 'text-base' : 'text-xl'} font-bold ${activePromo ? '' : 'text-green-600'}`}
            style={activePromo ? { color: themeColor || '#a31542' } : undefined}
          >
            {priceDisplay}
          </span>
          {activePromo ? (
            <span className="text-sm text-gray-400 line-through">
              ₦{activePromo.override_before_price.toLocaleString()}
            </span>
          ) : product.compare_price && product.compare_price > product.price && !hasVariations ? (
            <span className="text-sm text-gray-400 line-through">
              ₦{product.compare_price.toLocaleString()}
            </span>
          ) : null}
        </div>

        {/* Action Button */}
        {!compact && <button
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
        </button>}
      </div>
    </div>
  );
}