// app/puppies/page.tsx
"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import Image from 'next/image';

// Define the Puppy interface
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

export default function PuppiesPage() {
  const router = useRouter();
  const [puppies, setPuppies] = useState<Puppy[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeImageIndex, setActiveImageIndex] = useState<{ [key: number]: number }>({});
  const [failedImages, setFailedImages] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    fetchAvailablePuppies();
  }, []);

  const fetchAvailablePuppies = async () => {
    setLoading(true);
    
    const { data, error } = await supabase
      .from('dogs')
      .select('*')
      .eq('type', 'puppy')
      .eq('status', 'available')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching puppies:', error);
    }
    
    const puppiesData = (data as Puppy[]) || [];
    setPuppies(puppiesData);
    
    // Initialize active image index for each puppy
    const initialIndexes: { [key: number]: number } = {};
    puppiesData.forEach(puppy => {
      initialIndexes[puppy.id] = 0;
    });
    setActiveImageIndex(initialIndexes);
    setLoading(false);
  };

  const handlePrevImage = (puppyId: number, imagesLength: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setActiveImageIndex(prev => ({
      ...prev,
      [puppyId]: prev[puppyId] > 0 ? prev[puppyId] - 1 : imagesLength - 1
    }));
  };

  const handleNextImage = (puppyId: number, imagesLength: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setActiveImageIndex(prev => ({
      ...prev,
      [puppyId]: prev[puppyId] < imagesLength - 1 ? prev[puppyId] + 1 : 0
    }));
  };

  const handleThumbnailClick = (puppyId: number, index: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setActiveImageIndex(prev => ({
      ...prev,
      [puppyId]: index
    }));
  };

  const handleImageError = (puppyId: number, imageUrl: string) => {
    setFailedImages(prev => ({
      ...prev,
      [`${puppyId}-${imageUrl}`]: true
    }));
  };

  const handleReserve = (puppyId: number) => {
    router.push(`/puppies/reserve/${puppyId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-48 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-64 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-gray-200 rounded-xl h-96"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-2">Available Puppies</h1>
          <p className="text-gray-600 text-lg">
            {puppies.length} {puppies.length === 1 ? 'puppy' : 'puppies'} currently available
          </p>
        </div>

        {/* Puppies Grid */}
        {puppies.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg">
            <p className="text-gray-500 text-lg">No puppies available at the moment.</p>
            <p className="text-gray-400 mt-2">Check back soon or contact us for upcoming litters.</p>
            <a
              href={`https://wa.me/${WHATSAPP_NUMBER}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block mt-6 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition"
            >
              Contact Us on WhatsApp
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {puppies.map((puppy: Puppy) => {
              const currentIndex = activeImageIndex[puppy.id] || 0;
              const hasMultipleImages = puppy.images && puppy.images.length > 1;
              const currentImage = puppy.images?.[currentIndex];
              const imageFailed = currentImage ? failedImages[`${puppy.id}-${currentImage}`] : false;

              return (
                <div key={puppy.id} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition group">
                  {/* Image Gallery Section */}
                  <div className="relative h-64 bg-gray-100">
                    {/* Main Image with Zoom on Hover */}
                    <div className="relative w-full h-full overflow-hidden">
                      {puppy.images && puppy.images.length > 0 && !imageFailed ? (
                        <Image
                          src={puppy.images[currentIndex]}
                          alt={puppy.name}
                          fill
                          className="object-cover transition-transform duration-700 group-hover:scale-110"
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                          priority={currentIndex === 0}
                          onError={() => {
                            if (puppy.images && puppy.images[currentIndex]) {
                              handleImageError(puppy.id, puppy.images[currentIndex]);
                            }
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-6xl bg-yellow-50">
                          🐕
                        </div>
                      )}
                    </div>

                    {/* Price Badge */}
                    <div className="absolute top-4 left-4 bg-black/70 text-white px-3 py-1 rounded-full text-sm font-semibold z-10">
                      ₦{puppy.price?.toLocaleString() || 'Contact'}
                    </div>

                    {/* Status Badge */}
                    <span className="absolute top-4 right-4 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-semibold z-10">
                      Available
                    </span>

                    {/* Image Counter */}
                    {hasMultipleImages && !imageFailed && (
                      <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded z-10">
                        {currentIndex + 1} / {puppy.images?.length}
                      </div>
                    )}

                    {/* Navigation Arrows */}
                    {hasMultipleImages && !imageFailed && (
                      <>
                        <button
                          onClick={(e) => handlePrevImage(puppy.id, puppy.images!.length, e)}
                          className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition z-20"
                          aria-label="Previous image"
                        >
                          ←
                        </button>
                        <button
                          onClick={(e) => handleNextImage(puppy.id, puppy.images!.length, e)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition z-20"
                          aria-label="Next image"
                        >
                          →
                        </button>
                      </>
                    )}

                    {/* Thumbnail Dots */}
                    {hasMultipleImages && !imageFailed && (
                      <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1.5 z-10">
                        {puppy.images?.map((_, idx) => (
                          <button
                            key={idx}
                            onClick={(e) => handleThumbnailClick(puppy.id, idx, e)}
                            className={`w-2 h-2 rounded-full transition-all ${
                              idx === currentIndex 
                                ? 'bg-white scale-125' 
                                : 'bg-white/50 hover:bg-white/80'
                            }`}
                            aria-label={`Go to image ${idx + 1}`}
                          />
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-3">
                      <h2 className="text-2xl font-bold">{puppy.name || 'Puppy'}</h2>
                      {puppy.color && (
                        <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded">
                          {puppy.color}
                        </span>
                      )}
                    </div>
                    
                    <div className="flex flex-wrap gap-3 text-sm text-gray-600 mb-4">
                      {puppy.age && (
                        <span className="flex items-center gap-1">
                          <span>🎂</span> {puppy.age}
                        </span>
                      )}
                      {puppy.gender && (
                        <span className="flex items-center gap-1">
                          <span>⚥</span> {puppy.gender}
                        </span>
                      )}
                      {puppy.parents && (
                        <span className="flex items-center gap-1">
                          <span>👪</span> {puppy.parents}
                        </span>
                      )}
                    </div>

                    {puppy.description && (
                      <p className="text-gray-500 text-sm mb-4 line-clamp-2">
                        {puppy.description}
                      </p>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-2 mt-4">
                      <button
                        onClick={() => handleReserve(puppy.id)}
                        className="flex-1 bg-black text-white py-3 rounded-lg hover:bg-gray-800 transition font-medium"
                      >
                        Reserve with ₦100,000
                      </button>
                      <Link
                        href={`/puppies/${puppy.id}`}
                        className="flex-1 text-center border border-black text-black py-3 rounded-lg hover:bg-black hover:text-white transition font-medium"
                      >
                        View Details
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Info Banner */}
        <div className="mt-12 bg-blue-50 border border-blue-200 rounded-xl p-6">
          <h3 className="font-bold text-lg mb-2">💰 Reservation Policy</h3>
          <p className="text-gray-600 mb-4">
            A deposit of ₦100,000 secures your puppy. The remaining balance is due at pickup/delivery.
            All puppies come with:
          </p>
          <ul className="list-disc list-inside text-gray-600 space-y-1">
            <li>First round of vaccinations</li>
            <li>Deworming treatment</li>
            <li>Health certificate</li>
            <li>Pedigree papers</li>
          </ul>
        </div>
      </div>
    </div>
  );
}