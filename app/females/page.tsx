// app/females/page.tsx
"use client";
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import Image from 'next/image';

// Define the FemaleDog interface
interface FemaleDog {
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
}

export default function FemalesPage() {
  const [females, setFemales] = useState<FemaleDog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFemales();
  }, []);

  const fetchFemales = async () => {
    setLoading(true);
    
    const { data, error } = await supabase
      .from('dogs')
      .select('*')
      .eq('type', 'female')
      .eq('status', 'available')
      .order('name');
    
    if (error) {
      console.error('Error fetching females:', error);
    }
    
    setFemales((data as FemaleDog[]) || []);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-48 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-64 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
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
          <h1 className="text-4xl md:text-5xl font-bold mb-2">Our Breeding Females</h1>
          <p className="text-gray-600 text-lg">Meet our champion dams</p>
        </div>

        {/* Females Grid */}
        {females.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg">
            <p className="text-gray-500 text-lg">No breeding females available at this time.</p>
            <p className="text-gray-400 mt-2">Check back soon or contact us for more information.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {females.map((female: FemaleDog) => (
              <div key={female.id} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition">
                {/* Image */}
                <div className="relative h-64 bg-gray-100">
                  {female.images?.[0] ? (
                    <Image
                      src={female.images[0]}
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

                {/* Content */}
                <div className="p-6">
                  <h2 className="text-2xl font-bold mb-2">{female.name}</h2>
                  
                  <div className="space-y-2 text-gray-600 mb-4">
                    {female.color && (
                      <p className="flex items-center gap-2">
                        <span className="text-lg">🎨</span>
                        <span>{female.color}</span>
                      </p>
                    )}
                    {female.age && (
                      <p className="flex items-center gap-2">
                        <span className="text-lg">📅</span>
                        <span>{female.age}</span>
                      </p>
                    )}
                    {female.next_heat && (
                      <p className="flex items-center gap-2">
                        <span className="text-lg">🔥</span>
                        <span>Next Heat: {new Date(female.next_heat).toLocaleDateString('en-US', { 
                          month: 'long', 
                          year: 'numeric' 
                        })}</span>
                      </p>
                    )}
                    {female.litter_count !== undefined && female.litter_count > 0 && (
                      <p className="flex items-center gap-2">
                        <span className="text-lg">👶</span>
                        <span>{female.litter_count} {female.litter_count === 1 ? 'Litter' : 'Litters'}</span>
                      </p>
                    )}
                    {female.preferred_stud && (
                      <p className="flex items-center gap-2">
                        <span className="text-lg">🤵</span>
                        <span>Preferred Stud: {female.preferred_stud}</span>
                      </p>
                    )}
                  </div>

                  {female.description && (
                    <p className="text-gray-500 text-sm mb-4 line-clamp-3">
                      {female.description}
                    </p>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 mt-4">
                    <Link
                      href={`/females/${female.id}`}
                      className="flex-1 text-center bg-black text-white py-2 rounded-lg hover:bg-gray-800 transition"
                    >
                      View Pedigree
                    </Link>
                    <a
                      href="https://wa.me/2347019996837"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 text-center bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition"
                    >
                      Inquire
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Contact Banner */}
        <div className="mt-12 bg-gradient-to-r from-pink-500 to-pink-600 rounded-xl p-8 text-white text-center">
          <h2 className="text-2xl font-bold mb-4">Interested in Our Bloodline?</h2>
          <p className="mb-6">
            Contact us to learn more about our breeding program and available females.
          </p>
          <a
            href="https://wa.me/2347019996837"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block bg-white text-pink-600 px-8 py-3 rounded-lg font-bold hover:bg-gray-100 transition"
          >
            Chat on WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
}