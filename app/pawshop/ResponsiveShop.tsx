'use client';

import Image from 'next/image';
import Link from 'next/link';
import FlashSales from '@/app/components/Shop/FlashSales';
import ProductCard from '@/app/components/Shop/ProductCard';
import { getPromoForProduct, type ActivePromotion } from '@/lib/promotions';
import type { Product } from '@/lib/productTypes';

interface ResponsiveShopProps {
  products: Product[];
  allProducts: Product[];
  categories: string[];
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  cartCount: number;
  promo: ActivePromotion | null;
}

const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '2347019996837';

export default function ResponsiveShop({
  products,
  allProducts,
  categories,
  selectedCategory,
  onSelectCategory,
  searchQuery,
  onSearchChange,
  cartCount,
  promo,
}: ResponsiveShopProps) {
  const featuredCategories = categories.filter((category) => category !== 'all').slice(0, 5);
  const showcaseCategories = featuredCategories.slice(0, 4);
  const showcaseProducts = allProducts
    .filter((product) => product.featured && product.in_stock)
    .concat(allProducts.filter((product) => product.in_stock && !product.featured))
    .slice(0, 6);
  const whatsappLink = `https://wa.me/${WHATSAPP_NUMBER}`;
  const categoryCardColors = [
    'bg-rose-100',
    'bg-amber-100',
    'bg-sky-100',
    'bg-emerald-100',
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <header id="shop-top" className="sticky top-0 z-40 border-b border-gray-100 bg-white shadow-sm">
        <div className="mx-auto px-4 pb-3 pt-3 md:flex md:max-w-screen-2xl md:items-center md:gap-8 md:px-8 md:py-5">
          <div className="mb-3 flex items-center justify-between md:mb-0 md:shrink-0 md:gap-8">
            <div className="flex items-center gap-3">
              <Image
                src="/pawshop%20logo.jpeg"
                alt="Dsire Pawshop logo"
                width={64}
                height={64}
                priority
                className="h-12 w-12 shrink-0 rounded-full object-cover md:h-16 md:w-16"
              />
              <div>
                <p className="text-lg font-extrabold leading-tight text-gray-950 md:text-2xl">Dsire Pawshop</p>
                <p className="text-xs text-gray-500 md:text-sm">Happy pets start here</p>
              </div>
            </div>
            <Link
              href="/pawshop/cart"
              aria-label={`Shopping cart${cartCount > 0 ? `, ${cartCount} items` : ''}`}
              className="relative flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-900 md:h-12 md:w-12"
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

          <label className="flex items-center gap-2 rounded-full bg-gray-100 px-4 py-2.5 text-gray-500 focus-within:ring-2 focus-within:ring-gray-300 md:flex-1 md:px-5 md:py-3">
            <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="h-5 w-5 shrink-0 md:h-6 md:w-6">
              <circle cx="10.8" cy="10.8" r="6.8" stroke="currentColor" strokeWidth="2" />
              <path d="m16 16 4.5 4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <input
              type="search"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(event) => onSearchChange(event.target.value)}
              className="w-full bg-transparent text-sm text-gray-900 outline-none placeholder:text-gray-500 md:text-base"
            />
          </label>
        </div>

        <a
          href={whatsappLink}
          target="_blank"
          rel="noopener noreferrer"
          className="block border-t border-gray-100 px-4 py-3 text-sm font-extrabold tracking-wide text-gray-900 md:mx-auto md:max-w-screen-2xl md:border-0 md:px-8 md:py-0 md:text-base"
        >
          CHAT TO ORDER: <span className="text-green-700">WhatsApp</span>
        </a>
      </header>

      <main className="mx-auto max-w-screen-2xl space-y-5 pb-24 md:space-y-10 md:px-8 md:pb-12 lg:px-12">
        <section aria-label="Featured shop offers" className="px-4 pt-4 md:px-0 md:pt-8">
          <div className="grid gap-3 lg:grid-cols-[1.05fr_2fr]">
            <article className="relative isolate flex min-h-[360px] flex-col overflow-hidden rounded-2xl bg-orange-600 p-5 text-white shadow-sm sm:min-h-[420px] sm:p-8">
              <Image
                src={promo?.banner_url || showcaseProducts[0]?.images?.[0] || '/Hero.png'}
                alt=""
                fill
                priority
                sizes="(min-width: 1024px) 36vw, 100vw"
                className="absolute inset-0 -z-20 object-cover object-center"
              />
              <div className="absolute inset-0 -z-10 bg-gradient-to-b from-orange-600 via-orange-600/90 via-45% to-orange-950/10" />
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-orange-100 sm:text-sm">
                {promo ? 'Limited-time offer' : 'Dsire Pawshop'}
              </p>
              <h1 className="mt-2 max-w-lg text-3xl font-extrabold leading-tight sm:text-4xl lg:text-5xl">
                {promo?.title || 'Everything for your best friend'}
              </h1>
              <p className="mt-2 max-w-md text-sm text-white/90 sm:text-base">
                {promo ? 'Shop selected favourites before this offer ends.' : 'Good days start with happy, healthy pets.'}
              </p>
              <button
                type="button"
                onClick={() => {
                  document.getElementById(promo ? 'flash-sales' : 'shop-products')
                    ?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="mt-5 w-fit rounded-full bg-white px-5 py-2.5 text-sm font-bold text-orange-800 transition hover:bg-orange-100"
              >
                {promo ? 'Shop the offer' : 'Explore the shop'} <span aria-hidden="true">→</span>
              </button>
            </article>

            {showcaseCategories.length > 0 && (
              <div className="grid grid-cols-2 gap-3">
                {showcaseCategories.map((category, index) => {
                  const categoryProduct = allProducts.find((product) => product.category === category);

                  return (
                    <button
                      type="button"
                      key={category}
                      onClick={() => {
                        onSelectCategory(category);
                        document.getElementById('shop-products')?.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className={`group relative flex min-h-40 flex-col overflow-hidden rounded-2xl p-4 text-left shadow-sm transition hover:-translate-y-0.5 sm:min-h-[204px] sm:p-5 ${categoryCardColors[index % categoryCardColors.length]}`}
                    >
                      <span className="relative z-10 max-w-[85%] text-lg font-extrabold leading-tight text-gray-950 sm:text-xl">
                        Shop {category.toLowerCase()}
                      </span>
                      {categoryProduct?.images?.[0] ? (
                        <span className="absolute inset-x-0 bottom-0 top-12">
                          <Image
                            src={categoryProduct.images[0]}
                            alt=""
                            fill
                            sizes="(min-width: 1024px) 22vw, 50vw"
                            className="object-contain object-bottom p-2 transition duration-300 group-hover:scale-105"
                          />
                        </span>
                      ) : (
                        <span aria-hidden="true" className="mt-auto self-end text-5xl">🐾</span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {showcaseProducts.length > 0 && (
          <section aria-label="Featured products" className="overflow-hidden bg-emerald-950 py-5 text-white md:rounded-2xl md:py-6">
            <div className="mb-4 flex items-center justify-between px-4 md:px-6">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-emerald-200">Picked for happy pets</p>
                <h2 className="text-lg font-extrabold sm:text-2xl">Shop customer favourites</h2>
              </div>
              <button
                type="button"
                onClick={() => document.getElementById('shop-products')?.scrollIntoView({ behavior: 'smooth' })}
                className="shrink-0 text-xs font-bold text-emerald-100 underline underline-offset-4 sm:text-sm"
              >
                See all
              </button>
            </div>
            <div className="flex snap-x snap-mandatory gap-2 overflow-x-auto px-4 pb-1 [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden md:gap-3 md:px-6">
              {showcaseProducts.map((product) => (
                <Link
                  key={product.id}
                  href={`/pawshop/product/${product.id}`}
                  className="w-36 shrink-0 snap-start overflow-hidden rounded-xl bg-white text-gray-950 shadow-sm transition hover:-translate-y-1 sm:w-44"
                >
                  <div className="relative aspect-square bg-gray-50">
                    <Image
                      src={product.images?.[0] || '/shop/placeholder.jpg'}
                      alt={product.name}
                      fill
                      sizes="176px"
                      className="object-contain p-2"
                    />
                  </div>
                  <div className="p-3">
                    <p className="line-clamp-2 min-h-10 text-sm font-semibold">{product.name}</p>
                    <p className="mt-1 text-sm font-extrabold text-emerald-800">₦{product.price.toLocaleString()}</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {promo && (
          <div className="px-4 md:px-0" id="flash-sales">
            <FlashSales promo={promo} products={allProducts} />
          </div>
        )}

        <section id="shop-categories" className="scroll-mt-44 px-4 md:px-0">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-extrabold text-gray-900 md:text-2xl">Browse categories</h2>
            <button
              type="button"
              onClick={() => onSelectCategory('all')}
              className="text-xs font-semibold text-gray-500"
            >
              See all
            </button>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            {categories.map((category) => (
              <button
                type="button"
                key={category}
                onClick={() => onSelectCategory(category)}
                className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition md:px-5 md:py-2.5 md:text-base ${
                  selectedCategory === category
                    ? 'bg-gray-950 text-white'
                    : 'border border-gray-200 bg-white text-gray-700'
                }`}
              >
                {category === 'all' ? 'All products' : category}
              </button>
            ))}
          </div>
        </section>

        <section id="shop-products" className="scroll-mt-44 px-4 md:px-0">
          <div className="mb-3 flex items-end justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-gray-500 md:text-sm">Find their favourites</p>
              <h2 className="text-xl font-extrabold text-gray-950 md:text-3xl">
                {selectedCategory === 'all' ? 'Shop all products' : selectedCategory}
              </h2>
            </div>
            <span className="pb-1 text-xs text-gray-500 md:text-sm">{products.length} items</span>
          </div>

          {products.length === 0 ? (
            <div className="rounded-xl bg-white px-4 py-10 text-center">
              <p className="text-gray-600">No products found</p>
              <button
                onClick={() => {
                  onSelectCategory('all');
                  onSearchChange('');
                }}
                className="mt-3 font-semibold text-gray-900 underline"
              >
                Clear filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-5 lg:grid-cols-4 xl:grid-cols-5">
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  promo={getPromoForProduct(promo, product.id)}
                  themeColor={promo?.theme_color}
                />
              ))}
            </div>
          )}
        </section>

        <a
          href={whatsappLink}
          target="_blank"
          rel="noopener noreferrer"
          className="mx-4 flex items-center justify-center gap-2 rounded-xl border border-green-200 bg-green-50 p-4 text-sm font-bold text-green-800 md:mx-0 md:text-base"
        >
          <span aria-hidden="true">💬</span> Need help choosing? Chat with us
        </a>

        <footer aria-label="Pawshop information" className="mx-4 overflow-hidden rounded-2xl bg-amber-50 md:mx-0">
          <div className="grid gap-3 p-4 sm:grid-cols-2 sm:p-6 lg:grid-cols-4">
            {[
              { icon: '🐾', title: 'Made for pets', detail: 'Thoughtful picks for every stage of their life.', color: 'bg-rose-100' },
              { icon: '🚚', title: 'Delivery you can count on', detail: 'See our delivery information and service areas.', color: 'bg-sky-100' },
              { icon: '🛒', title: 'Easy checkout', detail: 'Your cart is ready whenever you are.', color: 'bg-emerald-100' },
              { icon: '💬', title: 'Real help, right here', detail: 'Ask us for help choosing the right product.', color: 'bg-violet-100' },
            ].map((feature) => (
              <div key={feature.title} className={`rounded-xl p-4 ${feature.color}`}>
                <span aria-hidden="true" className="text-2xl">{feature.icon}</span>
                <h2 className="mt-2 font-extrabold text-gray-950">{feature.title}</h2>
                <p className="mt-1 text-sm leading-relaxed text-gray-700">{feature.detail}</p>
              </div>
            ))}
          </div>
          <div className="flex flex-col gap-3 bg-gray-950 px-5 py-5 text-white sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div>
              <p className="font-extrabold">Dsire Pawshop</p>
              <p className="text-sm text-gray-300">Happy pets start here.</p>
            </div>
            <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-gray-200">
              <Link href="/shipping" className="hover:text-white">Shipping</Link>
              <Link href="/pawshop/cart" className="hover:text-white">Your cart</Link>
              <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="hover:text-white">Contact us</a>
              <a href="#shop-top" className="hover:text-white">Back to top ↑</a>
            </div>
          </div>
        </footer>
      </main>

      <nav
        aria-label="Shop navigation"
        className="fixed inset-x-0 bottom-0 z-50 border-t border-gray-200 bg-white/95 px-2 pb-2 pt-2 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] backdrop-blur md:hidden"
      >
        <div className="mx-auto flex max-w-md items-center justify-around">
          <a href="#shop-top" className="flex min-w-16 flex-col items-center gap-1 text-orange-600">
            <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="h-5 w-5">
              <path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1V10Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
            </svg>
            <span className="text-[10px] font-semibold">Shop</span>
          </a>
          <a href="#shop-categories" className="flex min-w-16 flex-col items-center gap-1 text-gray-600">
            <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="h-5 w-5">
              <rect x="3" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.8" />
              <rect x="14" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.8" />
              <rect x="3" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.8" />
              <rect x="14" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.8" />
            </svg>
            <span className="text-[10px] font-medium">Categories</span>
          </a>
          <Link href="/pawshop/cart" className="relative flex min-w-16 flex-col items-center gap-1 text-gray-600">
            <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="h-5 w-5">
              <path d="M3 4h2l2.2 10.1a2 2 0 0 0 2 1.6h8.5a2 2 0 0 0 1.9-1.4L21 8H6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="10" cy="20" r="1.2" fill="currentColor" />
              <circle cx="18" cy="20" r="1.2" fill="currentColor" />
            </svg>
            {cartCount > 0 && (
              <span className="absolute left-1/2 top-[-4px] ml-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-orange-500 px-1 text-[9px] font-bold text-white">
                {cartCount}
              </span>
            )}
            <span className="text-[10px] font-medium">Cart</span>
          </Link>
          <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="flex min-w-16 flex-col items-center gap-1 text-gray-600">
            <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="h-5 w-5">
              <path d="M20 11.5a8 8 0 0 1-11.8 7L4 20l1.5-4A8 8 0 1 1 20 11.5Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
              <path d="M9 8.5c.3-.5.6-.5.9-.5.2 0 .4 0 .6.5l.6 1.4c.1.3.1.5-.1.7l-.5.6c.5 1 1.3 1.8 2.3 2.3l.6-.5c.2-.2.4-.2.7-.1l1.4.6c.4.2.5.4.5.6 0 .3 0 .6-.5.9-.5.4-1.2.5-1.8.4-1.1-.2-2.5-1-3.8-2.3s-2.1-2.7-2.3-3.8c-.1-.6 0-1.3.4-1.8Z" fill="currentColor" />
            </svg>
            <span className="text-[10px] font-medium">WhatsApp</span>
          </a>
        </div>
      </nav>
    </div>
  );
}
