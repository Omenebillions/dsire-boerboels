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
  const [remainingSeconds, setRemainingSeconds] = useState(() => getRemainingSeconds(promo.end_time));

  useEffect(() => {
    const updateCountdown = () => setRemainingSeconds(getRemainingSeconds(promo.end_time));
    updateCountdown();
    const intervalId = window.setInterval(updateCountdown, 1000);
    return () => window.clearInterval(intervalId);
  }, [promo.end_time]);

  if (remainingSeconds <= 0) return null;

  const saleProducts = products.filter((product) =>
    promo.products.some((promotionProduct) => promotionProduct.product_id === Number(product.id))
  );

  return (
    <section
      className="mb-6 rounded-xl p-4 text-white sm:p-6"
      style={{ backgroundColor: promo.theme_color }}
      aria-label="Flash sales"
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-white/80">Flash Sales</p>
          <h2 className="text-xl font-extrabold sm:text-2xl">{promo.title}</h2>
        </div>
        <div className="rounded-lg bg-black/20 px-3 py-2 text-center">
          <p className="text-xs uppercase tracking-wide text-white/80">Ends in</p>
          <p className="font-mono text-lg font-bold tabular-nums" aria-live="off">
            {formatTime(remainingSeconds)}
          </p>
        </div>
      </div>

      {saleProducts.length > 0 ? (
        <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          {saleProducts.map((product) => (
            <div key={product.id} className="w-56 shrink-0 snap-start text-gray-900 sm:w-64">
              <ProductCard
                product={product}
                promo={getPromoForProduct(promo, product.id)}
                themeColor={promo.theme_color}
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
