// app/components/Shop/ProductCard.tsx
"use client";
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { Product } from '@/lib/products';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const [isAdding, setIsAdding] = useState(false);
  
  const discount = product.compare_price && product.compare_price > product.price
    ? Math.round(((product.compare_price - product.price) / product.compare_price) * 100)
    : 0;

  const addToCart = () => {
    setIsAdding(true);
    
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const existingItem = cart.find((item: any) => item.id === product.id);
    
    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      cart.push({
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.images[0],
        quantity: 1
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
      <Link href={`/pawshop/product/${product.id}`} className="relative aspect-square overflow-hidden bg-gray-100 block">
        <Image
          src={product.images[0] || '/shop/placeholder.jpg'}
          alt={product.name}
          fill
          className="object-cover group-hover:scale-110 transition duration-500"
        />
        {discount > 0 && (
          <span className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
            -{discount}%
          </span>
        )}
        {!product.in_stock && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="bg-white text-black px-3 py-1 rounded-full text-sm font-bold">
              Out of Stock
            </span>
          </div>
        )}
      </Link>

      <div className="p-4">
        <p className="text-sm text-gray-500 mb-1">{product.category}</p>
        <Link href={`/pawshop/product/${product.id}`}>
          <h3 className="font-bold text-lg mb-2 hover:text-yellow-600 transition line-clamp-2">
            {product.name}
          </h3>
        </Link>
        
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xl font-bold text-green-600">
            ₦{product.price.toLocaleString()}
          </span>
          {product.compare_price && product.compare_price > 0 && (
            <span className="text-sm text-gray-400 line-through">
              ₦{product.compare_price.toLocaleString()}
            </span>
          )}
        </div>

        <button
          onClick={addToCart}
          disabled={!product.in_stock || isAdding}
          className={`w-full py-2 rounded-lg font-medium transition flex items-center justify-center gap-2 ${
            product.in_stock
              ? isAdding
                ? 'bg-green-500 text-white'
                : 'bg-black text-white hover:bg-gray-800'
              : 'bg-gray-200 text-gray-500 cursor-not-allowed'
          }`}
        >
          {isAdding ? '✓ Added' : '🛒 Add to Cart'}
        </button>
      </div>
    </div>
  );
}