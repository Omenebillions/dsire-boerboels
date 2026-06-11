// app/pawshop/product/[id]/page.tsx
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
  sku?: string;
  weight?: string;
}

interface Product {
  id: number;
  name: string;
  price: number;
  compare_price?: number;
  description: string;
  images: string[];
  category: string;
  in_stock: boolean;
  stock: number;
  weight?: string;
  brand?: string;
  variations?: Variation[];
  created_at?: string;
}

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedVariation, setSelectedVariation] = useState<Variation | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);

  useEffect(() => {
    loadProduct();
  }, [params.id]);

  const loadProduct = async () => {
    setLoading(true);
    
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', params.id)
      .single();
    
    if (error) {
      console.error('Error loading product:', error);
      setProduct(null);
    } else if (data) {
      // Normalize the data
      const normalizedProduct = {
        ...data,
        stock: Number(data.stock) || 0,
        variations: data.variations?.map((v: any) => ({
          ...v,
          stock: Number(v.stock) || 0,
          price: Number(v.price) || 0
        }))
      };
      
      setProduct(normalizedProduct);
      
      // Select first variation with stock if available
      if (normalizedProduct.variations?.length) {
        const inStockVariation = normalizedProduct.variations.find((v: Variation) => v.stock > 0);
        setSelectedVariation(inStockVariation || normalizedProduct.variations[0]);
      }
    }
    
    setLoading(false);
  };

  const addToCart = () => {
    if (!product) return;
    
    const cartItem = {
      id: product.id,
      name: product.name,
      price: selectedVariation ? selectedVariation.price : product.price,
      image: product.images?.[0] || '/product-placeholder.jpg',
      quantity: quantity,
      variation: selectedVariation ? {
        size: selectedVariation.size,
        price: selectedVariation.price,
        stock: selectedVariation.stock
      } : undefined
    };
    
    // Get existing cart
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    
    // Check if item already exists (with same variation)
    const existingIndex = cart.findIndex((item: any) => 
      item.id === product.id && 
      JSON.stringify(item.variation) === JSON.stringify(cartItem.variation)
    );
    
    if (existingIndex >= 0) {
      // Update quantity
      cart[existingIndex].quantity += quantity;
    } else {
      // Add new item
      cart.push(cartItem);
    }
    
    // Save to localStorage
    localStorage.setItem('cart', JSON.stringify(cart));
    
    // Trigger cart update event
    window.dispatchEvent(new Event('cartUpdated'));
    
    // Show feedback
    setAddingToCart(true);
    setTimeout(() => setAddingToCart(false), 1000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-48 mb-6"></div>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="h-96 bg-gray-200 rounded-xl"></div>
              <div className="space-y-4">
                <div className="h-8 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                <div className="h-12 bg-gray-200 rounded w-1/3"></div>
                <div className="h-24 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="bg-white rounded-2xl shadow-sm p-12 max-w-lg mx-auto">
            <div className="text-6xl mb-4">🔍</div>
            <h1 className="text-2xl font-bold mb-3">Product Not Found</h1>
            <p className="text-gray-500 mb-6">The product you're looking for doesn't exist or has been removed.</p>
            <Link 
              href="/pawshop" 
              className="inline-block bg-black text-white px-6 py-3 rounded-lg font-bold hover:bg-gray-800 transition"
            >
              Back to Shop
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const hasVariations = product.variations && product.variations.length > 0;
  const currentPrice = selectedVariation ? selectedVariation.price : product.price;
  const currentStock = hasVariations 
    ? (selectedVariation?.stock || 0)
    : product.stock;
  const isInStock = currentStock > 0;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Back Button */}
        <Link 
          href="/pawshop" 
          className="inline-flex items-center gap-2 text-gray-600 hover:text-black transition mb-6"
        >
          <span>←</span> Back to Shop
        </Link>
        
        {/* Product Container */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="grid md:grid-cols-2 gap-8 p-6 lg:p-8">
            
            {/* Product Images */}
            <div className="space-y-4">
              <div className="relative aspect-square bg-gray-100 rounded-xl overflow-hidden">
                <Image
                  src={product.images?.[0] || '/product-placeholder.jpg'}
                  alt={product.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                  priority
                />
              </div>
              
              {/* Thumbnail Gallery */}
              {product.images && product.images.length > 1 && (
                <div className="grid grid-cols-4 gap-3">
                  {product.images.slice(1, 5).map((img, idx) => (
                    <div key={idx} className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden cursor-pointer hover:opacity-80 transition">
                      <Image
                        src={img}
                        alt={`${product.name} ${idx + 2}`}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 25vw, 10vw"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Product Info */}
            <div className="space-y-6">
              {/* Title & Brand */}
              <div>
                <h1 className="text-3xl lg:text-4xl font-bold mb-2">{product.name}</h1>
                {product.brand && (
                  <p className="text-gray-500 text-lg">{product.brand}</p>
                )}
                <p className="text-sm text-gray-400 mt-1">{product.category}</p>
              </div>
              
              {/* Price */}
              <div className="text-3xl lg:text-4xl font-bold text-green-600">
                ₦{currentPrice.toLocaleString()}
                {product.compare_price && product.compare_price > currentPrice && (
                  <span className="text-lg text-gray-400 line-through ml-3">
                    ₦{product.compare_price.toLocaleString()}
                  </span>
                )}
              </div>
              
              {/* Variation Selector */}
              {hasVariations && (
                <div className="space-y-3">
                  <label className="font-medium text-gray-700">Select Size:</label>
                  <div className="flex gap-3 flex-wrap">
                    {product.variations!.map((variation) => {
                      const isOutOfStock = variation.stock === 0;
                      const isSelected = selectedVariation?.size === variation.size;
                      
                      return (
                        <button
                          key={variation.size}
                          onClick={() => !isOutOfStock && setSelectedVariation(variation)}
                          disabled={isOutOfStock}
                          className={`
                            px-6 py-2 rounded-full border-2 transition-all
                            ${isSelected 
                              ? 'bg-black text-white border-black' 
                              : isOutOfStock
                              ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200'
                              : 'bg-white text-gray-700 border-gray-300 hover:border-black hover:bg-gray-50'
                            }
                          `}
                        >
                          {variation.size}
                          {isOutOfStock && ' (Out of Stock)'}
                          {isSelected && !isOutOfStock && ' ✓'}
                        </button>
                      );
                    })}
                  </div>
                  
                  {/* Variation Price Display */}
                  {selectedVariation && selectedVariation.price !== product.price && (
                    <p className="text-sm text-gray-500">
                      Selected size price: ₦{selectedVariation.price.toLocaleString()}
                    </p>
                  )}
                </div>
              )}
              
              {/* Stock Status */}
              <div className={`text-sm font-medium ${isInStock ? 'text-green-600' : 'text-red-600'}`}>
                {isInStock ? `✓ In Stock (${currentStock} available)` : '✗ Out of Stock'}
              </div>
              
              {/* Quantity Selector */}
              {isInStock && (
                <div className="space-y-3">
                  <label className="font-medium text-gray-700">Quantity:</label>
                  <div className="flex items-center border-2 rounded-lg w-fit">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="px-4 py-2 hover:bg-gray-100 transition text-xl font-bold"
                    >
                      -
                    </button>
                    <span className="px-8 py-2 font-medium min-w-[80px] text-center">
                      {quantity}
                    </span>
                    <button
                      onClick={() => setQuantity(Math.min(currentStock, quantity + 1))}
                      className="px-4 py-2 hover:bg-gray-100 transition text-xl font-bold"
                    >
                      +
                    </button>
                  </div>
                </div>
              )}
              
              {/* Add to Cart Button */}
              <button
                onClick={addToCart}
                disabled={!isInStock || addingToCart}
                className={`
                  w-full py-4 rounded-xl font-bold text-lg transition-all
                  ${isInStock && !addingToCart
                    ? 'bg-black text-white hover:bg-gray-800 active:bg-gray-900 transform active:scale-95'
                    : addingToCart
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  }
                `}
              >
                {addingToCart ? '✓ Added to Cart!' : isInStock ? 'Add to Cart' : 'Out of Stock'}
              </button>
              
              {/* Description */}
              {product.description && (
                <div className="border-t pt-6 mt-4">
                  <h3 className="font-bold text-lg mb-3">Description</h3>
                  <div className="text-gray-600 whitespace-pre-line leading-relaxed">
                    {product.description}
                  </div>
                </div>
              )}
              
              {/* Shipping Info */}
              <div className="border-t pt-6 text-sm text-gray-500 space-y-2">
                <p className="flex items-center gap-2">📦 Free shipping on orders over ₦50,000</p>
                <p className="flex items-center gap-2">🔄 30-day return policy</p>
                <p className="flex items-center gap-2">💳 Secure checkout</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}