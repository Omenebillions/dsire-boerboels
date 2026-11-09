// app/pawshop/product/[id]/page.tsx
"use client";
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { getActivePromotion, getPromotionalPrice, type ActivePromotion } from '@/lib/promotions';

interface Variation {
  size: string;
  price: number;
  compare_price?: number;
  stock: number;
  sku?: string;
  weight?: string;
}

interface CartItem {
  id: number | string;
  name: string;
  price: number;
  image: string;
  quantity: number;
  variation?: {
    size: string;
    price: number;
    stock: number;
  };
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
  const [promotion, setPromotion] = useState<ActivePromotion | null>(null);
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    loadProduct();
  }, [params.id]);

  useEffect(() => {
    const updateCartCount = () => {
      const cart = JSON.parse(localStorage.getItem('cart') || '[]') as CartItem[];
      setCartCount(cart.reduce((count, item) => count + item.quantity, 0));
    };

    updateCartCount();
    window.addEventListener('cartUpdated', updateCartCount);
    window.addEventListener('storage', updateCartCount);
    return () => {
      window.removeEventListener('cartUpdated', updateCartCount);
      window.removeEventListener('storage', updateCartCount);
    };
  }, []);

  const loadProduct = async () => {
    setLoading(true);
    setPromotion(null);

    const promotionPromise = getActivePromotion().catch((error: unknown) => {
      console.error('Error loading active promotion:', error);
      return null;
    });
    const [productResult, activePromotion] = await Promise.all([
      supabase.from('products').select('*').eq('id', params.id).single(),
      promotionPromise,
    ]);
    setPromotion(activePromotion);
    const { data, error } = productResult;
    
    if (error) {
      console.error('Error loading product:', error);
      setProduct(null);
    } else if (data) {
      // Normalize the data
      const normalizedProduct = {
        ...data,
        stock: Number(data.stock) || 0,
        variations: data.variations?.map((v: Variation) => ({
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
    if (hasVariations && (!selectedVariation || selectedVariation.stock < 1)) return;

    const itemQuantity = selectedVariation
      ? Math.min(quantity, selectedVariation.stock)
      : Math.min(quantity, product.stock);
    if (itemQuantity < 1) return;
    
    const regularPrice = selectedVariation ? selectedVariation.price : product.price;
    const promotionalPrice = getPromotionalPrice(promotion, product.id);
    const cartItem = {
      id: product.id,
      name: product.name,
      price: promotionalPrice ?? regularPrice,
      image: product.images?.[0] || '/product-placeholder.jpg',
      quantity: itemQuantity,
      variation: selectedVariation ? {
        size: selectedVariation.size,
        price: promotionalPrice ?? selectedVariation.price,
        stock: selectedVariation.stock
      } : undefined
    };
    
    // Get existing cart
    const cart = JSON.parse(localStorage.getItem('cart') || '[]') as CartItem[];
    
    // Check if item already exists (with same variation)
    const existingIndex = cart.findIndex((item) =>
      item.id === product.id && 
      item.variation?.size === cartItem.variation?.size
    );
    
    if (existingIndex >= 0) {
      // Update quantity
      cart[existingIndex].quantity = Math.min(
        cart[existingIndex].quantity + itemQuantity,
        selectedVariation?.stock ?? product.stock
      );
      cart[existingIndex].price = cartItem.price;
      if (cartItem.variation && cart[existingIndex].variation) {
        cart[existingIndex].variation.price = cartItem.variation.price;
      }
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
  const promotionalPrice = getPromotionalPrice(promotion, product.id);
  const displayedPrice = promotionalPrice ?? currentPrice;
  const displayedComparePrice = promotionalPrice === null
    ? product.compare_price
    : (promotion?.products.find((item) => item.product_id === product.id)?.override_before_price);
  const currentStock = hasVariations 
    ? (selectedVariation?.stock || 0)
    : product.stock;
  const isInStock = currentStock > 0;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Back Button */}
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/pawshop"
            className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-white px-5 py-2.5 font-semibold text-gray-800 shadow-sm transition hover:border-orange-400 hover:bg-orange-50 hover:text-gray-950"
          >
            <span aria-hidden="true">←</span> Back to Shop
          </Link>
          <Link
            href="/pawshop/cart"
            aria-label={`Shopping cart${cartCount > 0 ? `, ${cartCount} items` : ''}`}
            className="relative flex h-11 w-11 items-center justify-center rounded-full bg-white text-gray-900 shadow-sm ring-1 ring-gray-200 transition hover:bg-orange-50"
          >
            <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="h-5 w-5">
              <path d="M3 4h2l2.2 10.1a2 2 0 0 0 2 1.6h8.5a2 2 0 0 0 1.9-1.4L21 8H6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="10" cy="20" r="1.2" fill="currentColor" />
              <circle cx="18" cy="20" r="1.2" fill="currentColor" />
            </svg>
            {cartCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-white bg-orange-500 px-1 text-[10px] font-bold text-white">
                {cartCount}
              </span>
            )}
          </Link>
        </div>
        
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
                ₦{displayedPrice.toLocaleString()}
                {displayedComparePrice && displayedComparePrice > displayedPrice && (
                  <span className="text-lg text-gray-400 line-through ml-3">
                    ₦{displayedComparePrice.toLocaleString()}
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
                          onClick={() => {
                            if (!isOutOfStock) {
                              setSelectedVariation(variation);
                              setQuantity((currentQuantity) => Math.min(currentQuantity, variation.stock));
                            }
                          }}
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