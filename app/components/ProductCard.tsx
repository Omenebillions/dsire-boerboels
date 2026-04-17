// app/components/Shop/ProductCard.tsx
"use client";
import Image from "next/image";
import Link from "next/link";

interface Variation {
  size: string;
  price: number;
  compare_price?: number;
  stock: number;
  in_stock?: boolean;  // ← Made optional to match page
  sku?: string;
  weight?: string;
}

interface Product {
  id: number | string;
  name: string;
  price: number;
  compare_price?: number;
  images?: string[];
  image?: string;
  category: string;
  in_stock: boolean;
  stock?: number;
  featured?: boolean;
  brand?: string;
  variations?: Variation[];
  description?: string;
  weight?: string;
}

export default function ProductCard({ product }: { product: Product }) {
  const hasVariations = Boolean(product.variations?.length);

  // Price range
  const prices = hasVariations 
    ? product.variations!.map(v => v.price) 
    : [product.price];
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const hasMultiplePrices = hasVariations && minPrice !== maxPrice;
  const priceDisplay = hasMultiplePrices
    ? `₦${minPrice.toLocaleString()} - ₦${maxPrice.toLocaleString()}`
    : `₦${minPrice.toLocaleString()}`;

  // Stock availability – only check stock > 0, ignore in_stock flag
  const isInStock = hasVariations
    ? product.variations!.some((v) => (v.stock || 0) > 0)
    : Boolean(product.in_stock && (product.stock || 0) > 0);

  // Discount (only for non-variation)
  const discountPercentage = !hasVariations && 
    product.compare_price && 
    product.compare_price > product.price
    ? Math.round(((product.compare_price - product.price) / product.compare_price) * 100)
    : 0;

  const imageSrc = product.images?.[0] || product.image || "/product-placeholder.jpg";

  return (
    <Link href={`/pawshop/product/${product.id}`} className="group block">
      <div className="bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 h-full flex flex-col">
        <div className="relative aspect-square overflow-hidden bg-gray-100">
          <Image
            src={imageSrc}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
            priority={false}
          />
          <span className="absolute top-3 left-3 bg-white/95 backdrop-blur-sm text-xs font-semibold px-3 py-1 rounded-full shadow-sm z-10">
            {product.category}
          </span>
          {discountPercentage > 0 && !hasVariations && (
            <span className="absolute top-3 right-3 bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full z-10">
              -{discountPercentage}%
            </span>
          )}
          {hasVariations && isInStock && (
            <span className="absolute bottom-3 left-3 bg-black/80 text-white text-xs font-medium px-3 py-1 rounded-full z-10">
              {product.variations!.length} sizes
            </span>
          )}
          {!isInStock && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-20">
              <span className="bg-white text-black px-6 py-2 rounded-full text-sm font-bold tracking-wider">
                OUT OF STOCK
              </span>
            </div>
          )}
        </div>
        <div className="p-4 flex flex-col flex-1">
          {product.brand && <p className="text-xs text-gray-500 mb-1 font-medium">{product.brand}</p>}
          <h3 className="font-semibold text-lg leading-tight mb-3 line-clamp-2 group-hover:text-black transition-colors">
            {product.name}
          </h3>
          <div className="flex items-baseline gap-2 mb-4">
            <span className="text-2xl font-bold text-gray-900">{priceDisplay}</span>
            {discountPercentage > 0 && !hasVariations && (
              <span className="text-sm text-gray-400 line-through">
                ₦{product.compare_price!.toLocaleString()}
              </span>
            )}
          </div>
          {hasVariations && (
            <p className="text-xs text-gray-500 mb-4">
              Select from {product.variations!.length} size options
            </p>
          )}
          <div className="mt-auto pt-2">
            <button
              className={`w-full py-3 rounded-xl font-semibold text-sm transition-all ${
                isInStock
                  ? "bg-black text-white hover:bg-gray-800 active:bg-gray-900"
                  : "bg-gray-100 text-gray-400 cursor-not-allowed"
              }`}
              onClick={(e) => {
                e.preventDefault();
                if (isInStock) {
                  window.location.href = `/pawshop/product/${product.id}`;
                }
              }}
              disabled={!isInStock}
            >
              {isInStock
                ? hasVariations 
                  ? "Choose Size & Add" 
                  : "Add to Cart"
                : "Out of Stock"}
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
}