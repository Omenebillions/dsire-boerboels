"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';

interface Puppy {
  id: number;
  name: string;
  price?: number;
  images?: string[];
  age?: string;
  color?: string;
  gender?: string;
  status: string;
}

export default function FeaturedPuppies() {
  const [puppies, setPuppies] = useState<Puppy[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFeatured();
  }, []);

  const fetchFeatured = async () => {
    const { data } = await supabase
      .from('dogs')
      .select('id, name, price, images, age, color, gender, status')
      .eq('type', 'puppy')
      .eq('status', 'available')
      .limit(3)
      .order('created_at', { ascending: false });
    setPuppies(data || []);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-gray-200 rounded-xl h-80 animate-pulse"></div>
        ))}
      </div>
    );
  }

  if (puppies.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-xl">
        <p className="text-gray-500">No featured puppies at the moment.</p>
        <Link href="/puppies" className="text-blue-600 hover:underline mt-2 block">
          View all available puppies
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      {puppies.map((puppy) => (
        <div key={puppy.id} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition group">
          <Link href={`/puppies/${puppy.id}`} className="block relative h-64">
            {puppy.images?.[0] ? (
              <Image
                src={puppy.images[0]}
                alt={puppy.name}
                fill
                className="object-cover group-hover:scale-110 transition duration-500"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-yellow-50">
                <span className="text-6xl">🐕</span>
              </div>
            )}
          </Link>
          <div className="p-6">
            <h3 className="text-xl font-bold mb-2">{puppy.name}</h3>
            <div className="flex gap-2 text-sm text-gray-600 mb-3">
              {puppy.age && <span>🎂 {puppy.age}</span>}
              {puppy.gender && <span>⚥ {puppy.gender}</span>}
            </div>
            <div className="flex justify-between items-center">
              <span className="text-2xl font-bold text-green-600">
                ₦{puppy.price?.toLocaleString() || 'Contact'}
              </span>
              <Link
                href={`/puppies/reserve/${puppy.id}`}
                className="bg-black text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-gray-800 transition"
              >
                Reserve
              </Link>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}