'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRef, useState } from 'react';
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
  const heroSlides = [
    {
      image: promo?.banner_url || '/Hero.png',
      eyebrow: promo ? 'Limited-time offer' : 'Dsire Boerboels',
      title: promo?.title || 'Everything your pet needs',
      description: promo
        ? 'Shop selected products before this offer ends.'
        : 'Quality essentials for happy, healthy pets.',
      category: null,
    },
    ...featuredCategories.slice(0, 2).map((category) => ({
      image: allProducts.find((product) => product.category === category)?.images?.[0] || '/Hero.png',
      eyebrow: 'Shop by category',
      title: category,
      description: `Explore our ${category.toLowerCase()} collection.`,
      category,
    })),
  ];
  const whatsappLink = `https://wa.me/${WHATSAPP_NUMBER}`;
  const heroCarouselRef = useRef<HTMLDivElement>(null);
  const [activeHeroSlide, setActiveHeroSlide] = useState(0);
  const categoryColors = [
    'from-rose-950/80',
    'from-amber-950/80',
    'from-sky-950/80',
    'from-emerald-950/80',
    'from-violet-950/80',
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <header id="shop-top" className="sticky top-0 z-40 border-b border-gray-100 bg-white shadow-sm">
        <div className="mx-auto px-4 pb-3 pt-3 md:flex md:max-w-screen-2xl md:items-center md:gap-8 md:px-8 md:py-5">
          <div className="mb-3 flex items-center justify-between md:mb-0 md:shrink-0 md:gap-8">
            <div>
              <p className="text-lg font-extrabold leading-tight text-gray-950 md:text-2xl">Dsire Pawshop</p>
              <p className="text-xs text-gray-500 md:text-sm">Happy pets start here</p>
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
        <section aria-label="Featured promotion" className="pt-4 md:pt-8">
          <div className="mx-4">
            <div
              ref={heroCarouselRef}
              onScroll={(event) => {
                const carousel = event.currentTarget;
                setActiveHeroSlide(Math.round(carousel.scrollLeft / carousel.clientWidth));
              }}
              role="region"
              aria-label="Featured shop offers"
              aria-roledescription="carousel"
              className="flex snap-x snap-mandatory overflow-x-auto rounded-2xl [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
            >
              {heroSlides.map((slide, index) => (
                <article
                  key={`${slide.eyebrow}-${slide.title}`}
                  aria-label={`${index + 1} of ${heroSlides.length}: ${slide.title}`}
                  className="relative h-48 w-full shrink-0 snap-center overflow-hidden bg-gray-950 text-white md:h-72 lg:h-80"
                >
                  <Image
                    src={slide.image}
                    alt=""
                    fill
                    priority={index === 0}
                    sizes="100vw"
                    className="object-cover object-center"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-gray-950/90 via-gray-950/55 to-gray-950/10" />
                  <div className="relative z-10 flex h-full max-w-[82%] flex-col items-start justify-center p-5 md:max-w-[62%] md:p-10 lg:max-w-[55%] lg:p-14">
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-orange-300 md:text-sm">
                      {slide.eyebrow}
                    </p>
                    {index === 0 ? (
                      <h1 className="mt-1 text-2xl font-extrabold leading-tight md:text-4xl lg:text-5xl">{slide.title}</h1>
                    ) : (
                      <h2 className="mt-1 text-2xl font-extrabold leading-tight md:text-4xl lg:text-5xl">{slide.title}</h2>
                    )}
                    <p className="mt-1 line-clamp-2 text-xs text-white/85 md:mt-3 md:text-base">{slide.description}</p>
                    <button
                      type="button"
                      onClick={() => {
                        if (slide.category) {
                          onSelectCategory(slide.category);
                          document.getElementById('shop-products')?.scrollIntoView({ behavior: 'smooth' });
                        } else {
                          document.getElementById(promo ? 'flash-sales' : 'shop-products')
                            ?.scrollIntoView({ behavior: 'smooth' });
                        }
                      }}
                      className="mt-3 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-bold text-gray-950 transition hover:bg-orange-100 md:mt-6 md:px-6 md:py-3 md:text-sm"
                    >
                      Shop now <span aria-hidden="true">→</span>
                    </button>
                  </div>
                </article>
              ))}
            </div>
            <div className="mt-3 flex justify-center gap-1.5" aria-label="Choose a featured slide">
              {heroSlides.map((slide, index) => (
                <button
                  type="button"
                  key={`slide-${slide.title}`}
                  onClick={() => heroCarouselRef.current?.scrollTo({
                    left: index * (heroCarouselRef.current?.clientWidth || 0),
                    behavior: 'smooth',
                  })}
                  aria-label={`Show slide ${index + 1}: ${slide.title}`}
                  aria-current={activeHeroSlide === index}
                  className={`h-2 rounded-full transition-all ${
                    activeHeroSlide === index ? 'w-6 bg-gray-900' : 'w-2 bg-gray-300'
                  }`}
                />
              ))}
            </div>
          </div>
        </section>

        {featuredCategories.length > 0 && (
          <section aria-label="Shop by category">
            <div className="flex gap-3 overflow-x-auto px-4 pb-1 [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden md:gap-5 md:px-0">
              {featuredCategories.map((category, index) => {
                const categoryProduct = allProducts.find((product) => product.category === category);
                const categoryImage = categoryProduct?.images?.[0] || '/Hero.png';

                return (
                  <button
                    type="button"
                    key={category}
                    onClick={() => {
                      onSelectCategory(category);
                      document.getElementById('shop-products')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="relative h-28 w-32 shrink-0 overflow-hidden rounded-xl bg-gray-200 text-left text-white shadow-sm md:h-40 md:w-52 lg:h-48 lg:w-60"
                  >
                    <Image src={categoryImage} alt="" fill sizes="128px" className="object-cover" />
                    <span className={`absolute inset-0 bg-gradient-to-t ${categoryColors[index % categoryColors.length]} via-black/10 to-transparent`} />
                    <span className="absolute bottom-2 left-2 right-2 line-clamp-2 text-sm font-bold md:bottom-4 md:left-4 md:text-lg">
                      {category}
                    </span>
                  </button>
                );
              })}
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
