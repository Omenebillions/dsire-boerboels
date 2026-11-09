import Image from 'next/image';
import type { ActivePromotion } from '@/lib/promotions';

export default function PromoBanner({ promo }: { promo: ActivePromotion | null }) {
  if (!promo?.banner_url) return null;

  return (
    <div className="relative h-40 w-full overflow-hidden bg-gray-100 sm:h-56 lg:h-72">
      <Image
        src={promo.banner_url}
        alt={promo.title}
        fill
        priority
        sizes="100vw"
        className="object-cover"
      />
    </div>
  );
}
