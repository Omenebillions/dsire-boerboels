// app/studs/page.tsx
"use client";
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import Image from 'next/image';

// Define the Stud interface
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

export default function StudsPage() {
  const [studs, setStuds] = useState<Stud[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeImageIndex, setActiveImageIndex] = useState<{ [key: number]: number }>({});
  const [failedImages, setFailedImages] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    fetchAvailableStuds();
  }, []);

  const fetchAvailableStuds = async () => {
    setLoading(true);
    
    const { data, error } = await supabase
      .from('dogs')
      .select('*')
      .eq('type', 'stud')
      .eq('status', 'available')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching studs:', error);
    }
    
    const studsData = (data as Stud[]) || [];
    setStuds(studsData);
    
    // Initialize active image index for each stud
    const initialIndexes: { [key: number]: number } = {};
    studsData.forEach(stud => {
      initialIndexes[stud.id] = 0;
    });
    setActiveImageIndex(initialIndexes);
    setLoading(false);
  };

  const handlePrevImage = (studId: number, imagesLength: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setActiveImageIndex(prev => ({
      ...prev,
      [studId]: prev[studId] > 0 ? prev[studId] - 1 : imagesLength - 1
    }));
  };

  const handleNextImage = (studId: number, imagesLength: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setActiveImageIndex(prev => ({
      ...prev,
      [studId]: prev[studId] < imagesLength - 1 ? prev[studId] + 1 : 0
    }));
  };

  const handleThumbnailClick = (studId: number, index: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setActiveImageIndex(prev => ({
      ...prev,
      [studId]: index
    }));
  };

  const handleImageError = (studId: number, imageUrl: string) => {
    setFailedImages(prev => ({
      ...prev,
      [`${studId}-${imageUrl}`]: true
    }));
  };

  const handleBookMating = (studId: number, studName: string) => {
    const message = `I'm interested in booking ${studName} (ID: ${studId}) for mating. Please provide more information about stud fees and availability.`;
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-48 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-64 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[...Array(3)].map((_, i) => (
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
          <h1 className="text-4xl md:text-5xl font-bold mb-2">Stud Males</h1>
          <p className="text-gray-600 text-lg">
            Champion bloodlines available for breeding. 
            {studs.length > 0 && ` ${studs.length} ${studs.length === 1 ? 'stud' : 'studs'} currently available.`}
          </p>
        </div>

        {/* Studs Grid */}
        {studs.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl shadow-sm border border-dashed border-gray-300">
            <span className="text-6xl mb-4 block">👑</span>
            <p className="text-gray-500 text-xl font-medium">No studs available at the moment.</p>
            <p className="text-gray-400 mt-2 mb-8">Check back soon for new champion males.</p>
            <a
              href={`https://wa.me/${WHATSAPP_NUMBER}`}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-green-600 text-white px-8 py-3 rounded-full font-bold hover:bg-green-700 transition-all shadow-lg"
            >
              Contact Us on WhatsApp
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {studs.map((stud: Stud) => {
              const currentIndex = activeImageIndex[stud.id] || 0;
              const hasMultipleImages = stud.images && stud.images.length > 1;
              const currentImage = stud.images?.[currentIndex];
              const imageFailed = currentImage ? failedImages[`${stud.id}-${currentImage}`] : false;

              return (
                <div key={stud.id} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition group">
                  {/* Image Gallery Section */}
                  <div className="relative h-72 bg-gray-100">
                    {/* Main Image with Zoom on Hover */}
                    <div className="relative w-full h-full overflow-hidden">
                      {stud.images && stud.images.length > 0 && !imageFailed ? (
                        <Image
                          src={stud.images[currentIndex]}
                          alt={stud.name}
                          fill
                          className="object-cover transition-transform duration-700 group-hover:scale-110"
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                          priority={currentIndex === 0}
                          onError={() => handleImageError(stud.id, stud.images[currentIndex])}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-6xl bg-blue-50">
                          👑
                        </div>
                      )}
                    </div>

                    {/* Price/Stud Fee Badge */}
                    <div className="absolute top-4 left-4 bg-black/70 text-white px-3 py-1 rounded-full text-sm font-semibold z-10">
                      ₦{stud.price?.toLocaleString() || 'Contact'} / mating
                    </div>

                    {/* Status Badge */}
                    <span className="absolute top-4 right-4 bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-semibold z-10">
                      Available
                    </span>

                    {/* Image Counter */}
                    {hasMultipleImages && !imageFailed && (
                      <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded z-10">
                        {currentIndex + 1} / {stud.images?.length}
                      </div>
                    )}

                    {/* Navigation Arrows */}
                    {hasMultipleImages && !imageFailed && (
                      <>
                        <button
                          onClick={(e) => handlePrevImage(stud.id, stud.images!.length, e)}
                          className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition z-20"
                          aria-label="Previous image"
                        >
                          ←
                        </button>
                        <button
                          onClick={(e) => handleNextImage(stud.id, stud.images!.length, e)}
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
                        {stud.images?.map((_, idx) => (
                          <button
                            key={idx}
                            onClick={(e) => handleThumbnailClick(stud.id, idx, e)}
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
                      <h2 className="text-2xl font-bold">{stud.name || 'Stud Male'}</h2>
                      {stud.color && (
                        <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded">
                          {stud.color}
                        </span>
                      )}
                    </div>
                    
                    <div className="flex flex-wrap gap-3 text-sm text-gray-600 mb-4">
                      {stud.age && (
                        <span className="flex items-center gap-1">
                          <span>🎂</span> {stud.age}
                        </span>
                      )}
                      {stud.weight && (
                        <span className="flex items-center gap-1">
                          <span>⚖️</span> {stud.weight}
                        </span>
                      )}
                      {stud.height && (
                        <span className="flex items-center gap-1">
                          <span>📏</span> {stud.height}
                        </span>
                      )}
                    </div>

                    {stud.parents && (
                      <p className="text-sm text-gray-500 mb-2">
                        <span className="font-medium">Sire:</span> {stud.parents.split('x')[0]} • 
                        <span className="font-medium"> Dam:</span> {stud.parents.split('x')[1]}
                      </p>
                    )}

                    {stud.pedigree && (
                      <p className="text-xs text-gray-400 mb-3 italic">🏆 {stud.pedigree}</p>
                    )}

                    {stud.description && (
                      <p className="text-gray-500 text-sm mb-4 line-clamp-2">
                        {stud.description}
                      </p>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-2 mt-4">
                      <button
                        onClick={() => handleBookMating(stud.id, stud.name || 'Stud')}
                        className="flex-1 bg-black text-white py-3 rounded-lg hover:bg-gray-800 transition font-medium"
                      >
                        Book Mating
                      </button>
                      <Link
                        href={`/studs/${stud.id}`}
                        className="flex-1 text-center border border-black text-black py-3 rounded-lg hover:bg-black hover:text-white transition font-medium"
                      >
                        View Pedigree
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
          <h3 className="font-bold text-lg mb-2">👑 Stud Services</h3>
          <p className="text-gray-600 mb-4">
            Our champion studs are available for breeding with proven bloodlines and health clearances.
            All matings include:
          </p>
          <ul className="list-disc list-inside text-gray-600 space-y-1">
            <li>Health clearances and genetic testing</li>
            <li>Champion pedigree documentation</li>
            <li>Breeding consultation and support</li>
            <li>Puppy back-up option available</li>
          </ul>
        </div>
      </div>
    </div>
  );
}