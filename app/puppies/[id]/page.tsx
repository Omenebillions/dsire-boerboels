// app/puppies/[id]/page.tsx
"use client";
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';

interface Puppy {
  id: number;
  name: string;
  type: string;
  status: string;
  price?: number;
  age?: string;
  color?: string;
  gender?: string;
  description?: string;
  images?: string[];
  parents?: string;
  created_at?: string;
}

const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "2347019996837";

export default function PuppyDetailPage() {
  const params = useParams();
  const [puppy, setPuppy] = useState<Puppy | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [failedImages, setFailedImages] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    fetchPuppy();
  }, []);

  const fetchPuppy = async () => {
    const { data } = await supabase
      .from('dogs')
      .select('*')
      .eq('id', params.id)
      .single();
    
    setPuppy(data);
    setLoading(false);
  };

  const handleImageError = (imageUrl: string) => {
    setFailedImages(prev => ({ ...prev, [imageUrl]: true }));
  };

  const handleReserve = () => {
    const message = `I'm interested in reserving ${puppy?.name} (ID: ${puppy?.id}) with a deposit of ₦100,000. Please provide more information.`;
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`, '_blank');
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

  if (!puppy) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-3xl font-bold mb-4">Puppy Not Found</h1>
          <Link href="/puppies" className="text-blue-600 hover:underline">
            ← Back to Puppies
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
          <Link href="/puppies" className="text-blue-600 hover:underline text-sm">
            ← Back to Puppies
          </Link>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Image Gallery */}
          <div className="space-y-4">
            <div className="relative h-96 bg-gray-100 rounded-2xl overflow-hidden">
              {puppy.images && puppy.images.length > 0 && !failedImages[puppy.images[activeImageIndex]] ? (
                <Image
                  src={puppy.images[activeImageIndex]}
                  alt={puppy.name}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-6xl bg-yellow-50">
                  🐕
                </div>
              )}
            </div>

            {/* Thumbnails */}
            {puppy.images && puppy.images.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {puppy.images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImageIndex(idx)}
                    className={`relative h-20 rounded-lg overflow-hidden border-2 ${
                      idx === activeImageIndex ? 'border-yellow-500' : 'border-transparent'
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
            <h1 className="text-4xl font-bold mb-2">{puppy.name}</h1>
            <div className="flex gap-2 mb-4">
              <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                {puppy.status}
              </span>
              {puppy.color && (
                <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                  {puppy.color}
                </span>
              )}
              {puppy.gender && (
                <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm">
                  {puppy.gender}
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              {puppy.age && (
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-500">Age</p>
                  <p className="font-bold">{puppy.age}</p>
                </div>
              )}
              {puppy.price && (
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-500">Price</p>
                  <p className="font-bold text-green-600">₦{puppy.price.toLocaleString()}</p>
                </div>
              )}
            </div>

            {puppy.parents && (
              <div className="mb-4">
                <h2 className="font-bold mb-2">Parents</h2>
                <p className="text-gray-700">Sire: {puppy.parents.split('x')[0]}</p>
                <p className="text-gray-700">Dam: {puppy.parents.split('x')[1]}</p>
              </div>
            )}

            {puppy.description && (
              <div className="mb-6">
                <h2 className="font-bold mb-2">About</h2>
                <p className="text-gray-600">{puppy.description}</p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={handleReserve}
                className="flex-1 bg-black text-white py-4 rounded-xl font-bold hover:bg-gray-800 transition text-lg"
              >
                Reserve with ₦100,000
              </button>
              <a
                href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
                  `Hello, I'm interested in ${puppy.name} (ID: ${puppy.id}). Please provide more information.`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 bg-green-600 text-white py-4 rounded-xl font-bold hover:bg-green-700 transition text-lg text-center"
              >
                Inquire
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}