"use client";
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

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
  brand?: string;
  weight?: string;
  variations?: Variation[];
}

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const productId = Number(params.id);

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedVariation, setSelectedVariation] = useState<Variation | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    fetchProduct();
  }, [productId]);

  const fetchProduct = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .single();

    if (error) {
      console.error('Error fetching product:', error);
    } else {
      setProduct(data as Product);
      
      // Auto-select first available variation if exists
      if (data.variations && data.variations.length > 0) {
        const firstAvailable = data.variations.find((v: Variation) => v.in_stock && v.stock > 0);
        setSelectedVariation(firstAvailable || data.variations[0]);
      }
    }
    setLoading(false);
  };

  const addToCart = () => {
    if (!product) return;
    if (!selectedVariation && product.variations?.length) return;

    setIsAdding(true);

    const cart = JSON.parse(localStorage.getItem('cart') || '[]');

    const cartItem = {
      id: product.id,
      name: product.name,
      price: selectedVariation ? selectedVariation.price : product.price,
      image: product.images[0] || '/shop/placeholder.jpg',
      quantity: quantity,
      size: selectedVariation ? selectedVariation.size : null,
      variation: selectedVariation || null
    };

    const existingIndex = cart.findIndex((item: any) => 
      item.id === product.id && 
      (!item.size || item.size === cartItem.size)
    );

    if (existingIndex !== -1) {
      cart[existingIndex].quantity += quantity;
    } else {
      cart.push(cartItem);
    }

    localStorage.setItem('cart', JSON.stringify(cart));
    window.dispatchEvent(new Event('cartUpdated'));

    setTimeout(() => {
      setIsAdding(false);
      alert(`${quantity} × ${product.name}${selectedVariation ? ` (${selectedVariation.size})` : ''} added to cart!`);
    }, 400);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-pulse text-center">
          <div className="w-16 h-16 border-4 border-black border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading product...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Product Not Found</h1>
          <Link href="/pawshop" className="text-black underline">← Back to Shop</Link>
        </div>
      </div>
    );
  }

  const currentImage = product.images[currentImageIndex] || '/shop/placeholder.jpg';
  const hasVariations = product.variations && product.variations.length > 0;
  const isInStock = hasVariations 
    ? product.variations!.some(v => v.in_stock && v.stock > 0)
    : (product.in_stock && product.stock > 0);

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <Link href="/pawshop" className="inline-flex items-center gap-2 text-gray-600 hover:text-black mb-6">
          ← Back to Shop
        </Link>

        <div className="grid md:grid-cols-2 gap-10">
          {/* Image Gallery */}
          <div className="space-y-4">
            <div className="relative aspect-square bg-white rounded-2xl overflow-hidden shadow-sm">
              <Image
                src={currentImage}
                alt={product.name}
                fill
                className="object-cover"
                priority
              />
            </div>

            {/* Thumbnail Strip */}
            {product.images.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2">
                {product.images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentImageIndex(idx)}
                    className={`flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden border-2 transition ${
                      idx === currentImageIndex ? 'border-black' : 'border-transparent'
                    }`}
                  >
                    <Image src={img} alt="" fill className="object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            {product.brand && (
              <p className="text-sm text-gray-500 font-medium">{product.brand}</p>
            )}

            <h1 className="text-4xl font-bold leading-tight">{product.name}</h1>

            <div className="flex items-center gap-3">
              <span className="text-3xl font-bold">
                ₦{(selectedVariation ? selectedVariation.price : product.price).toLocaleString()}
              </span>
              {product.compare_price && product.compare_price > product.price && !hasVariations && (
                <span className="text-xl text-gray-400 line-through">
                  ₦{product.compare_price.toLocaleString()}
                </span>
              )}
            </div>

            {/* Description */}
            {product.description && (
              <div className="prose text-gray-700">
                <p>{product.description}</p>
              </div>
            )}

            {/* Variations */}
            {hasVariations && (
              <div>
                <p className="font-medium mb-3">Select Size</p>
                <div className="flex flex-wrap gap-3">
                  {product.variations!.map((variation, idx) => {
                    const isAvailable = variation.in_stock && variation.stock > 0;
                    return (
                      <button
                        key={idx}
                        onClick={() => setSelectedVariation(variation)}
                        disabled={!isAvailable}
                        className={`px-5 py-3 rounded-xl border font-medium transition ${
                          selectedVariation?.size === variation.size
                            ? 'bg-black text-white border-black'
                            : isAvailable
                            ? 'border-gray-300 hover:border-black'
                            : 'bg-gray-100 text-gray-400 cursor-not-allowed line-through'
                        }`}
                      >
                        {variation.size} {isAvailable ? '' : '(Out of stock)'}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Quantity */}
            <div>
              <p className="font-medium mb-2">Quantity</p>
              <div className="flex items-center border rounded-xl w-fit">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-4 py-2 hover:bg-gray-100 transition"
                >
                  −
                </button>
                <span className="px-6 py-2 font-medium">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="px-4 py-2 hover:bg-gray-100 transition"
                >
                  +
                </button>
              </div>
            </div>

            {/* Add to Cart Button */}
            <button
              onClick={addToCart}
              disabled={!isInStock || isAdding || (hasVariations && !selectedVariation)}
              className={`w-full py-4 rounded-2xl font-bold text-lg transition-all ${
                isInStock && (!hasVariations || selectedVariation)
                  ? 'bg-black text-white hover:bg-gray-800'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              {isAdding 
                ? 'Adding to Cart...' 
                : hasVariations && !selectedVariation 
                  ? 'Select a Size' 
                  : 'Add to Cart'}
            </button>

            {/* Stock Status */}
            {!isInStock && (
              <p className="text-red-600 text-center font-medium">Sorry, this product is currently out of stock.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}