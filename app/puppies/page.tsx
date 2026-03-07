// app/puppies/page.tsx
"use client";
import { useState, useEffect } from 'react';
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

export default function PuppiesPage() {
  const [puppies, setPuppies] = useState<Puppy[]>([]);
  const [loading, setLoading] = useState(true);

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
    
    setPuppies((data as Puppy[]) || []);
    setLoading(false);
  };

  const handleReserve = (puppyId: number, puppyName: string) => {
    // In a real app, this would open a reservation modal
    // For now, redirect to contact with pre-filled message
    const message = `I'm interested in reserving ${puppyName} (ID: ${puppyId}). Please provide more information.`;
    window.open(`https://wa.me/2347019996837?text=${encodeURIComponent(message)}`, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-48 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-64 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
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
              href="https://wa.me/2347019996837"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block mt-6 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition"
            >
              Contact Us on WhatsApp
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {puppies.map((puppy: Puppy) => (
              <div key={puppy.id} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition">
                {/* Image */}
                <div className="relative h-64 bg-gray-100">
                  {puppy.images?.[0] ? (
                    <Image
                      src={puppy.images[0]}
                      alt={puppy.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-6xl bg-yellow-50">
                      🐕
                    </div>
                  )}
                  
                  {/* Status Badge */}
                  <span className="absolute top-4 right-4 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                    Available
                  </span>
                </div>

                {/* Content */}
                <div className="p-6">
                  <h2 className="text-2xl font-bold mb-2">{puppy.name || 'Puppy'}</h2>
                  
                  <div className="space-y-2 text-gray-600 mb-4">
                    {puppy.age && (
                      <p className="flex items-center gap-2">
                        <span className="text-lg">🎂</span>
                        <span>{puppy.age}</span>
                      </p>
                    )}
                    {puppy.gender && (
                      <p className="flex items-center gap-2">
                        <span className="text-lg">⚥</span>
                        <span>{puppy.gender}</span>
                      </p>
                    )}
                    {puppy.color && (
                      <p className="flex items-center gap-2">
                        <span className="text-lg">🎨</span>
                        <span>{puppy.color}</span>
                      </p>
                    )}
                    {puppy.parents && (
                      <p className="flex items-center gap-2">
                        <span className="text-lg">👪</span>
                        <span>{puppy.parents}</span>
                      </p>
                    )}
                  </div>

                  {puppy.description && (
                    <p className="text-gray-500 text-sm mb-4 line-clamp-2">
                      {puppy.description}
                    </p>
                  )}

                  {/* Price and Actions */}
                  <div className="flex items-center justify-between mb-4">
                    {puppy.price ? (
                      <p className="text-2xl font-bold text-green-600">
                        ₦{puppy.price.toLocaleString()}
                      </p>
                    ) : (
                      <p className="text-gray-400">Contact for price</p>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleReserve(puppy.id, puppy.name || 'Puppy')}
                      className="flex-1 bg-black text-white py-3 rounded-lg hover:bg-gray-800 transition"
                    >
                      Reserve with ₦100,000
                    </button>
                    <Link
                      href={`/puppies/${puppy.id}`}
                      className="flex-1 text-center border border-black text-black py-3 rounded-lg hover:bg-black hover:text-white transition"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              </div>
            ))}
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
            <li>1-year genetic health guarantee</li>
          </ul>
        </div>
      </div>
    </div>
  );
}