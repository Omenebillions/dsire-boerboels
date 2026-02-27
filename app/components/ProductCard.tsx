"use client";

import Image from "next/image";

interface Product {
  id: string;
  name: string;
  price: number;
  comparePrice?: number;
  image: string;
  category: string;
  inStock: boolean;
}

export default function ProductCard({ product }: { product: Product }) {
  const discount = product.comparePrice
    ? Math.round(
        ((product.comparePrice - product.price) / product.comparePrice) * 100
      )
    : 0;

  return (
    <div className="group bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden">
      <div className="relative aspect-square overflow-hidden bg-gray-100">
        <Image
          src={product.image || "/product-placeholder.jpg"}
          alt={product.name}
          fill
          className="object-cover group-hover:scale-110 transition duration-500"
          sizes="(max-width: 768px) 50vw, 25vw"
        />
        {discount > 0 && (
          <span className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
            -{discount}%
          </span>
        )}
        {!product.inStock && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="bg-white text-black px-3 py-1 rounded-full text-sm font-bold">
              Out of Stock
            </span>
          </div>
        )}
      </div>

      <div className="p-4">
        <p className="text-sm text-gray-500 mb-1">{product.category}</p>
        <h3 className="font-bold text-lg mb-2 line-clamp-2">{product.name}</h3>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xl font-bold text-green-600">
            ₦{product.price.toLocaleString()}
          </span>
          {product.comparePrice && (
            <span className="text-sm text-gray-400 line-through">
              ₦{product.comparePrice.toLocaleString()}
            </span>
          )}
        </div>
        <button
          disabled={!product.inStock}
          className={`w-full py-2 rounded-lg font-medium transition ${
            product.inStock
              ? "bg-black text-white hover:bg-gray-800"
              : "bg-gray-200 text-gray-500 cursor-not-allowed"
          }`}
        >
          {product.inStock ? "Add to Cart" : "Out of Stock"}
        </button>
      </div>
    </div>
  );
}