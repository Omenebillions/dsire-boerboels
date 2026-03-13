"use client";
import Image from 'next/image';
import { useState } from 'react';

export default function HeroImage() {
  const [error, setError] = useState(false);
  return (
    <div className="absolute inset-0 w-full h-full">
      {!error ? (
        <Image
          src="/hero.png"
          alt="Dsire Kennels"
          fill
          className="object-cover"
          priority
          onError={() => setError(true)}
        />
      ) : (
        <div className="w-full h-full bg-gradient-to-r from-blue-900 to-black" />
      )}
    </div>
  );
}