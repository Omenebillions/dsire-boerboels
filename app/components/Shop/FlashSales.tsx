'use client';

import { useEffect, useState } from 'react';
import ProductCard from '@/app/components/Shop/ProductCard';
import { getPromoForProduct, type ActivePromotion } from '@/lib/promotions';
import type { Product } from '@/lib/productTypes';

function getRemainingSeconds(endTime: string): number {
  return Math.max(0, Math.floor((Date.parse(endTime) - Date.now()) / 1000));
}

function formatTime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;
  return [days, hours, minutes, remainingSeconds]
    .map((value) => String(value).padStart(2, '0'))
    .join(':');
}

export default function FlashSales({
  promo,
  products,
}: {
  promo: ActivePromotion;
  products: Product[];
}) {
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);

  useEffect(() => {
    const updateCountdown = () => setRemainingSeconds(getRemainingSeconds(promo.end_time));
    updateCountdown();
    const intervalId = window.setInterval(updateCountdown, 1000);
    return () => window.clearInterval(intervalId);
  }, [promo.end_time]);

  if (remainingSeconds === null || remainingSeconds <= 0) return null;

  const saleProducts = products.filter((product) =>
    promo.products.some((promotionProduct) => promotionProduct.product_id === Number(product.id))
  );

  return (
    <section
      className="mb-6 rounded-xl p-4 text-white sm:p-6 md:rounded-2xl md:p-8 lg:p-10"
      style={{ backgroundColor: promo.theme_color }}
      aria-label="Flash sales"
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-white/80">Flash Sales</p>
          <h2 className="text-2xl font-extrabold sm:text-2xl md:text-3xl">{promo.title}</h2>
        </div>
        <div className="rounded-full bg-white px-3 py-1.5 text-center text-gray-900 shadow-sm md:px-5 md:py-2.5">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-600 md:text-xs">Ends in</p>
          <p className="font-mono text-sm font-bold tabular-nums md:text-lg" aria-live="off">
            {formatTime(remainingSeconds)}
          </p>
        </div>
      </div>

      {saleProducts.length > 0 ? (
        <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden md:gap-5">
          {saleProducts.map((product) => (
            <div key={product.id} className="w-40 shrink-0 snap-start text-gray-900 sm:w-64 lg:w-72">
              <ProductCard
                product={product}
                promo={getPromoForProduct(promo, product.id)}
                themeColor={promo.theme_color}
                compact
              />
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-white/90">No products have been added to this promotion yet.</p>
      )}
    </section>
  );
}
