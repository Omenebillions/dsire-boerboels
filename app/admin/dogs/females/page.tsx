// app/admin/dogs/females/page.tsx
"use client";
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

// Define the type for a female dog
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
  created_at?: string;
}

export default function FemaleManagement() {
  // Properly type the state
  const [females, setFemales] = useState<FemaleDog[]>([]);
  const [upcomingHeat, setUpcomingHeat] = useState<FemaleDog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFemales();
  }, []);

  const fetchFemales = async () => {
    setLoading(true);
    
    // Get all females
    const { data, error } = await supabase
      .from('dogs')
      .select('*')
      .eq('type', 'female')
      .order('name');
    
    if (error) {
      console.error('Error fetching females:', error);
    } else {
      setFemales(data || []);
    }
    
    // Get females in heat within next 30 days
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    
    const { data: heatData, error: heatError } = await supabase
      .from('dogs')
      .select('*')
      .eq('type', 'female')
      .not('next_heat', 'is', null)
      .lte('next_heat', thirtyDaysFromNow.toISOString().split('T')[0])
      .order('next_heat');
    
    if (heatError) {
      console.error('Error fetching heat data:', heatError);
    } else {
      setUpcomingHeat(heatData || []);
    }
    
    setLoading(false);
  };

  const updateHeatDate = async (id: number, date: string) => {
    const { error } = await supabase
      .from('dogs')
      .update({ next_heat: date })
      .eq('id', id);
    
    if (error) {
      console.error('Error updating heat date:', error);
    } else {
      fetchFemales(); // Refresh
    }
  };

  const updateBreedingStatus = async (id: number, status: string) => {
    const { error } = await supabase
      .from('dogs')
      .update({ breeding_status: status })
      .eq('id', id);
    
    if (error) {
      console.error('Error updating breeding status:', error);
    } else {
      fetchFemales();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-64 mb-6"></div>
          <div className="h-32 bg-gray-200 rounded mb-6"></div>
          <div className="grid grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-64 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">🐩 Female Breeding Management</h1>
          <Link
            href="/admin/dogs/new"
            className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800"
          >
            + Add New Female
          </Link>
        </div>

        {/* Upcoming Heat Alert */}
        {upcomingHeat.length > 0 && (
          <div className="bg-pink-50 border-l-4 border-pink-500 p-4 mb-6 rounded-lg">
            <div className="flex items-center">
              <span className="text-2xl mr-3">🔥</span>
              <div>
                <p className="font-bold text-pink-800">
                  {upcomingHeat.length} female(s) in heat within 30 days
                </p>
                <p className="text-sm text-pink-600">
                  Prepare for breeding sessions
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-sm text-gray-500">Total Females</p>
            <p className="text-2xl font-bold">{females.length}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-sm text-gray-500">In Heat (30 days)</p>
            <p className="text-2xl font-bold text-pink-600">{upcomingHeat.length}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-sm text-gray-500">Available for Breeding</p>
            <p className="text-2xl font-bold text-green-600">
              {females.filter(f => f.breeding_status === 'open').length}
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-sm text-gray-500">Total Litters</p>
            <p className="text-2xl font-bold">
              {females.reduce((sum, f) => sum + (f.litter_count || 0), 0)}
            </p>
          </div>
        </div>

        {/* Female Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {females.map((female) => {
            const isInHeat = upcomingHeat.some(f => f.id === female.id);
            
            return (
              <div 
                key={female.id} 
                className={`bg-white rounded-lg shadow-lg overflow-hidden border-2 transition ${
                  isInHeat ? 'border-pink-300 ring-2 ring-pink-200' : 'border-gray-200'
                }`}
              >
                {/* Card Header */}
                <div className="bg-gradient-to-r from-pink-500 to-pink-600 px-4 py-3 text-white flex justify-between items-center">
                  <h2 className="text-xl font-bold">{female.name}</h2>
                  {isInHeat && (
                    <span className="bg-white text-pink-600 px-2 py-1 rounded-full text-xs font-bold animate-pulse">
                      🔥 HEAT
                    </span>
                  )}
                </div>

                {/* Card Body */}
                <div className="p-4 space-y-4">
                  {/* Heat Cycle Info */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-500">Next Heat</label>
                      <input
                        type="date"
                        value={female.next_heat || ''}
                        onChange={(e) => updateHeatDate(female.id, e.target.value)}
                        className="w-full p-2 border rounded text-sm mt-1"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500">Last Heat</label>
                      <p className="font-medium text-sm mt-1">
                        {female.last_heat ? new Date(female.last_heat).toLocaleDateString() : 'Not recorded'}
                      </p>
                    </div>
                  </div>

                  {/* Breeding Status */}
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Breeding Status</label>
                    <select
                      value={female.breeding_status || 'open'}
                      onChange={(e) => updateBreedingStatus(female.id, e.target.value)}
                      className="w-full p-2 border rounded text-sm"
                    >
                      <option value="open">🔓 Open (Ready to Breed)</option>
                      <option value="bred">🤝 Bred</option>
                      <option value="pregnant">🤰 Pregnant</option>
                      <option value="weaning">🍼 Weaning</option>
                      <option value="resting">😴 Resting</option>
                    </select>
                  </div>

                  {/* Litter Info */}
                  <div className="grid grid-cols-2 gap-3 pt-2 border-t">
                    <div>
                      <p className="text-xs text-gray-500">Litter Count</p>
                      <p className="font-bold text-lg">{female.litter_count || 0}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Preferred Stud</p>
                      <p className="font-medium truncate">{female.preferred_stud || 'None'}</p>
                    </div>
                  </div>

                  {/* Additional Info */}
                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                    {female.color && (
                      <p><span className="font-medium">Color:</span> {female.color}</p>
                    )}
                    {female.age && (
                      <p><span className="font-medium">Age:</span> {female.age}</p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <Link
                      href={`/admin/dogs/edit/${female.id}`}
                      className="flex-1 text-center bg-blue-600 text-white py-2 rounded-lg text-sm hover:bg-blue-700 transition"
                    >
                      Edit Details
                    </Link>
                    <Link
                      href={`/admin/dogs/${female.id}`}
                      className="flex-1 text-center border border-gray-300 py-2 rounded-lg text-sm hover:bg-gray-50 transition"
                    >
                      View History
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {females.length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg">
            <p className="text-gray-500 text-lg">No females found</p>
            <p className="text-gray-400 text-sm mt-1">Add your first female to start tracking breeding</p>
            <Link
              href="/admin/dogs/new"
              className="inline-block mt-4 bg-black text-white px-6 py-2 rounded-lg hover:bg-gray-800"
            >
              Add Female
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}