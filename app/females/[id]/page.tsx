// app/females/[id]/page.tsx
"use client";
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';

interface Female {
  id: number;
  name: string;
  type: string;
  status: string;
  age?: string;
  color?: string;
  next_heat?: string;
  last_heat?: string;
  litter_count?: number;
  breeding_status?: string;
  preferred_stud?: string;
  images?: string[];
  description?: string;
  parents?: string;
}

const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "2347019996837";

export default function FemaleDetailPage() {
  const params = useParams();
  const [female, setFemale] = useState<Female | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [failedImages, setFailedImages] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    fetchFemale();
  }, []);

  const fetchFemale = async () => {
    const { data } = await supabase
      .from('dogs')
      .select('*')
      .eq('id', params.id)
      .single();
    
    setFemale(data);
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

  if (!female) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-3xl font-bold mb-4">Female Not Found</h1>
          <Link href="/females" className="text-blue-600 hover:underline">
            ← Back to Females
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
          <Link href="/females" className="text-blue-600 hover:underline text-sm">
            ← Back to Females
          </Link>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Image Gallery */}
          <div className="space-y-4">
            <div className="relative h-96 bg-gray-100 rounded-2xl overflow-hidden">
              {female.images && female.images.length > 0 && !failedImages[female.images[activeImageIndex]] ? (
                <Image
                  src={female.images[activeImageIndex]}
                  alt={female.name}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-6xl bg-pink-50">
                  🐩
                </div>
              )}
            </div>

            {/* Thumbnails */}
            {female.images && female.images.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {female.images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImageIndex(idx)}
                    className={`relative h-20 rounded-lg overflow-hidden border-2 ${
                      idx === activeImageIndex ? 'border-pink-500' : 'border-transparent'
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
            <h1 className="text-4xl font-bold mb-2">{female.name}</h1>
            <div className="flex gap-2 mb-4">
              <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                {female.status}
              </span>
              {female.color && (
                <span className="bg-pink-100 text-pink-800 px-3 py-1 rounded-full text-sm">
                  {female.color}
                </span>
              )}
              {female.breeding_status && (
                <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm">
                  {female.breeding_status}
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              {female.age && (
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-500">Age</p>
                  <p className="font-bold">{female.age}</p>
                </div>
              )}
              {female.litter_count !== undefined && (
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-500">Litters</p>
                  <p className="font-bold">{female.litter_count}</p>
                </div>
              )}
            </div>

            {female.next_heat && (
              <div className="mb-4">
                <h2 className="font-bold mb-2">Heat Cycle</h2>
                <p className="text-gray-700">
                  Next Heat: {new Date(female.next_heat).toLocaleDateString('en-US', { 
                    month: 'long', 
                    year: 'numeric' 
                  })}
                </p>
                {female.last_heat && (
                  <p className="text-gray-500 text-sm">
                    Last Heat: {new Date(female.last_heat).toLocaleDateString()}
                  </p>
                )}
              </div>
            )}

            {female.preferred_stud && (
              <div className="mb-4">
                <h2 className="font-bold mb-2">Preferred Stud</h2>
                <p className="text-gray-700">{female.preferred_stud}</p>
              </div>
            )}

            {female.parents && (
              <div className="mb-4">
                <h2 className="font-bold mb-2">Parents</h2>
                <p className="text-gray-700">Sire: {female.parents.split('x')[0]}</p>
                <p className="text-gray-700">Dam: {female.parents.split('x')[1]}</p>
              </div>
            )}

            {female.description && (
              <div className="mb-6">
                <h2 className="font-bold mb-2">About</h2>
                <p className="text-gray-600">{female.description}</p>
              </div>
            )}

            <a
              href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
                `Hello, I'm interested in ${female.name} for breeding. Please provide more information.`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full bg-green-600 text-white text-center py-4 rounded-xl font-bold hover:bg-green-700 transition text-lg"
            >
              📱 Inquire About Breeding
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}