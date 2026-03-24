// app/components/ProductVariationSelector.tsx
"use client";
import { useState } from 'react';

interface Variation {
  size: string;
  price: number;
  compare_price?: number;
  stock: number;
  sku?: string;
  weight?: string;
}

interface ProductVariationSelectorProps {
  variations: Variation[];
  onVariationSelect: (variation: Variation) => void;
}

export default function ProductVariationSelector({ variations, onVariationSelect }: ProductVariationSelectorProps) {
  const [selectedSize, setSelectedSize] = useState(variations[0]?.size || '');

  const handleSizeChange = (size: string) => {
    setSelectedSize(size);
    const selected = variations.find(v => v.size === size);
    if (selected) onVariationSelect(selected);
  };

  const selectedVariation = variations.find(v => v.size === selectedSize);

  return (
    <div className="space-y-4">
      <div>
        <label className="block font-medium mb-2">Select Size:</label>
        <div className="flex gap-3">
          {variations.map((v) => (
            <button
              key={v.size}
              type="button"
              onClick={() => handleSizeChange(v.size)}
              className={`px-4 py-2 border rounded-lg font-medium transition ${
                selectedSize === v.size
                  ? 'bg-black text-white border-black'
                  : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
              } ${v.stock === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
              disabled={v.stock === 0}
            >
              {v.size}
              {v.stock === 0 && <span className="text-xs block">(Out of Stock)</span>}
            </button>
          ))}
        </div>
      </div>

      {selectedVariation && (
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-2xl font-bold">₦{selectedVariation.price.toLocaleString()}</p>
              {selectedVariation.compare_price && selectedVariation.compare_price > selectedVariation.price && (
                <p className="text-sm text-gray-500 line-through">
                  ₦{selectedVariation.compare_price.toLocaleString()}
                </p>
              )}
              {selectedVariation.weight && (
                <p className="text-sm text-gray-600 mt-1">Weight: {selectedVariation.weight}</p>
              )}
            </div>
            <p className={`text-sm ${selectedVariation.stock > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {selectedVariation.stock > 0 ? `✅ In Stock (${selectedVariation.stock})` : '❌ Out of Stock'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}