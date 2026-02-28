// app/components/HeroImage.tsx
"use client";

import Image from 'next/image';
import { useState } from 'react';

export default function HeroImage() {
  const [imageError, setImageError] = useState(false);

  if (imageError) {
    // Fallback background color if image fails to load
    return <div className="absolute inset-0 bg-gray-900"></div>;
  }

  return (
    <div className="absolute inset-0 w-full h-full">
      <Image
        src="/hero.png"
        alt="Dsire Boerboels - Premium Boerboel Kennel"
        fill
        className="object-cover"
        priority
        onError={() => setImageError(true)}
      />
    </div>
  );
}