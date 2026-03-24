"use client";

import Image from "next/image";
import Link from "next/link";

interface Variation {
  size: string;
  price: number;
  stock: number;
}

interface Product {
  id: number | string;
  name: string;
  price: number;
  comparePrice?: number;
  image?: string;
  images?: string[];
  category: string;
  inStock: boolean;
  stock?: number;
  variations?: Variation[];
  brand?: string;
}

export default function ProductCard({ product }: { product: Product }) {
  const hasVariations = product.variations && product.variations.length > 0;
  
  // Calculate price range for variations
  const minPrice = hasVariations 
    ? Math.min(...product.variations!.map(v => v.price))
    : product.price;
  
  const maxPrice = hasVariations 
    ? Math.max(...product.variations!.map(v => v.price))
    : product.price;
  
  // Calculate total stock including variations
  const totalStock = hasVariations
    ? product.variations!.reduce((sum, v) => sum + v.stock, 0)
    : (product.inStock ? (product.stock || 0) : 0);
  
  const isInStock = totalStock > 0;
  const hasMultiplePrices = hasVariations && minPrice !== maxPrice;
  
  // Price display
  const priceDisplay = hasMultiplePrices
    ? `₦${minPrice.toLocaleString()} - ₦${maxPrice.toLocaleString()}`
    : `₦${minPrice.toLocaleString()}`;
  
  // Get image source
  const imageSrc = product.images?.[0] || product.image || "/product-placeholder.jpg";
  
  // Calculate discount if comparePrice exists and no variations
  const discount = !hasVariations && product.comparePrice && product.comparePrice > product.price
    ? Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100)
    : 0;

  return (
    <Link href={`/pawshop/${product.id}`} className="group block">
      <div className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100">
        <div className="relative aspect-square overflow-hidden bg-gray-100">
          <Image
            src={imageSrc}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-110 transition duration-500"
            sizes="(max-width: 768px) 50vw, 25vw"
          />
          
          {/* Category Badge */}
          <span className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm text-xs font-semibold px-2 py-1 rounded-full shadow-sm">
            {product.category}
          </span>
          
          {/* Discount Badge (only for non-variation products) */}
          {discount > 0 && !hasVariations && (
            <span className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
              -{discount}%
            </span>
          )}
          
          {/* Variation Badge */}
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
        </div>

        <div className="p-4">
          {/* Brand */}
          {product.brand && (
            <p className="text-xs text-gray-500 mb-1">{product.brand}</p>
          )}
          
          {/* Category (fallback if no brand) */}
          {!product.brand && (
            <p className="text-xs text-gray-500 mb-1">{product.category}</p>
          )}
          
          {/* Product Name */}
          <h3 className="font-bold text-lg mb-2 line-clamp-2 group-hover:text-yellow-600 transition">
            {product.name}
          </h3>
          
          {/* Price */}
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <span className={`text-xl font-bold ${hasVariations ? 'text-gray-800' : 'text-green-600'}`}>
              {priceDisplay}
            </span>
            {!hasVariations && product.comparePrice && product.comparePrice > product.price && (
              <span className="text-sm text-gray-400 line-through">
                ₦{product.comparePrice.toLocaleString()}
              </span>
            )}
          </div>
          
          {/* Variation Hint */}
          {hasVariations && (
            <p className="text-xs text-gray-500 mb-2">
              {product.variations!.length} size{product.variations!.length > 1 ? 's' : ''} available
            </p>
          )}
          
          {/* Stock Status (for non-variation) */}
          {!hasVariations && !isInStock && (
            <p className="text-xs text-red-500 mb-2">Out of stock</p>
          )}
          
          {/* Button */}
          <button 
            className={`w-full py-2 rounded-lg font-medium transition ${
              isInStock
                ? 'bg-black text-white hover:bg-gray-800'
                : 'bg-gray-200 text-gray-500 cursor-not-allowed'
            }`}
            onClick={(e) => {
              e.preventDefault();
              if (isInStock) {
                // Navigate to product page for variation selection
                window.location.href = `/pawshop/${product.id}`;
              }
            }}
          >
            {isInStock 
              ? (hasVariations ? 'View Sizes' : 'Add to Cart')
              : 'Out of Stock'
            }
          </button>
        </div>
      </div>
    </Link>
  );
}