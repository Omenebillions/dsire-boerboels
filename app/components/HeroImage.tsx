// app/components/HeroImage.tsx
"use client";

import Image from 'next/image';
import { useState } from 'react';

export default function HeroImage() {
  const [imageError, setImageError] = useState(false);

  if (imageError) {
    // Fallback gradient background
    return <div className="absolute inset-0 bg-gradient-to-r from-gray-900 to-gray-800"></div>;
  }

  return (
    <div className="absolute inset-0 w-full h-full">
      <Image
        src="/Hero.png"
        alt="Dsire Boerboels - Premium Boerboel Kennel"
        fill
        className="object-cover"
        priority
        onError={() => setImageError(true)}
      />
    </div>
  );
}