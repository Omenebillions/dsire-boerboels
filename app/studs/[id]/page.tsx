// app/studs/[id]/page.tsx
"use client";
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';

interface Stud {
  id: number;
  name: string;
  type: string;
  status: string;
  price?: number;
  age?: string;
  color?: string;
  weight?: string;
  height?: string;
  description?: string;
  images?: string[];
  pedigree?: string;
  parents?: string;
  created_at?: string;
}

const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "2347019996837";

export default function StudDetailPage() {
  const params = useParams();
  const [stud, setStud] = useState<Stud | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [failedImages, setFailedImages] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    fetchStud();
  }, []);

  const fetchStud = async () => {
    const { data } = await supabase
      .from('dogs')
      .select('*')
      .eq('id', params.id)
      .single();
    
    setStud(data);
    setLoading(false);
  };

  const handleImageError = (imageUrl: string) => {
    setFailedImages(prev => ({ ...prev, [imageUrl]: true }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-48 mb-6"></div>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="h-96 bg-gray-200 rounded"></div>
            <div className="space-y-4">
              <div className="h-12 bg-gray-200 rounded w-3/4"></div>
              <div className="h-6 bg-gray-200 rounded w-1/2"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!stud) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-3xl font-bold mb-4">Stud Not Found</h1>
          <Link href="/studs" className="text-blue-600 hover:underline">
            ← Back to Studs
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4">
        {/* Breadcrumb */}
        <div className="mb-6">
          <Link href="/studs" className="text-blue-600 hover:underline text-sm">
            ← Back to Studs
          </Link>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Image Gallery */}
          <div className="space-y-4">
            <div className="relative h-96 bg-gray-100 rounded-2xl overflow-hidden">
              {stud.images && stud.images.length > 0 && !failedImages[stud.images[activeImageIndex]] ? (
                <Image
                  src={stud.images[activeImageIndex]}
                  alt={stud.name}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-6xl bg-blue-50">
                  👑
                </div>
              )}
            </div>

            {/* Thumbnails */}
            {stud.images && stud.images.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {stud.images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImageIndex(idx)}
                    className={`relative h-20 rounded-lg overflow-hidden border-2 ${
                      idx === activeImageIndex ? 'border-blue-600' : 'border-transparent'
                    }`}
                  >
                    <Image src={img} alt={`Thumbnail ${idx}`} fill className="object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div>
            <h1 className="text-4xl font-bold mb-2">{stud.name}</h1>
            <div className="flex gap-2 mb-4">
              <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                {stud.status}
              </span>
              {stud.color && (
                <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                  {stud.color}
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              {stud.age && (
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-500">Age</p>
                  <p className="font-bold">{stud.age}</p>
                </div>
              )}
              {stud.weight && (
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-500">Weight</p>
                  <p className="font-bold">{stud.weight}</p>
                </div>
              )}
              {stud.height && (
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-500">Height</p>
                  <p className="font-bold">{stud.height}</p>
                </div>
              )}
              {stud.price && (
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-500">Stud Fee</p>
                  <p className="font-bold text-green-600">₦{stud.price.toLocaleString()}</p>
                </div>
              )}
            </div>

            {stud.parents && (
              <div className="mb-4">
                <h2 className="font-bold mb-2">Parents</h2>
                <p className="text-gray-700">Sire: {stud.parents.split('x')[0]}</p>
                <p className="text-gray-700">Dam: {stud.parents.split('x')[1]}</p>
              </div>
            )}

            {stud.pedigree && (
              <div className="mb-4">
                <h2 className="font-bold mb-2">Pedigree</h2>
                <p className="text-gray-600 italic">🏆 {stud.pedigree}</p>
              </div>
            )}

            {stud.description && (
              <div className="mb-6">
                <h2 className="font-bold mb-2">About</h2>
                <p className="text-gray-600">{stud.description}</p>
              </div>
            )}

            <a
              href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
                `Hello, I'm interested in booking ${stud.name} for mating. Please provide more information.`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full bg-green-600 text-white text-center py-4 rounded-xl font-bold hover:bg-green-700 transition text-lg"
            >
              📱 Book Mating on WhatsApp
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}