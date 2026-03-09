// app/admin/dogs/page.tsx
"use client";
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import Image from 'next/image';

// Define the Dog interface
interface Dog {
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
  featured?: boolean;
  next_heat?: string;
  last_heat?: string;
  litter_count?: number;
  breeding_status?: string;
  preferred_stud?: string;
  created_at?: string;
}

export default function AdminDogsPage() {
  const [dogs, setDogs] = useState<Dog[]>([]);
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchDogs();
  }, [filterType, filterStatus]);

  const fetchDogs = async () => {
    setLoading(true);
    let query = supabase.from('dogs').select('*');
    
    if (filterType !== 'all') {
      query = query.eq('type', filterType);
    }
    
    if (filterStatus !== 'all') {
      query = query.eq('status', filterStatus);
    }
    
    const { data } = await query.order('created_at', { ascending: false });
    setDogs((data as Dog[]) || []);
    setLoading(false);
  };

  const updateStatus = async (id: number, newStatus: string) => {
    const { error } = await supabase
      .from('dogs')
      .update({ status: newStatus })
      .eq('id', id);
    
    if (!error) {
      fetchDogs();
    }
  };

  const deleteDog = async (id: number, name: string) => {
    if (confirm(`Are you sure you want to delete ${name}?`)) {
      const { error } = await supabase.from('dogs').delete().eq('id', id);
      if (!error) {
        fetchDogs();
      }
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch(status) {
      case 'available': return 'bg-green-100 text-green-800';
      case 'reserved': return 'bg-yellow-100 text-yellow-800';
      case 'sold': return 'bg-gray-100 text-gray-800';
      case 'retired': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: string) => {
    switch(type) {
      case 'puppy': return '🐕';
      case 'stud': return '👑';
      case 'female': return '🐩';
      default: return '🐕';
    }
  };

  // Filter by search term
  const filteredDogs = dogs.filter((dog: Dog) => 
    dog.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    dog.color?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculate stats
  const stats = {
    total: dogs.length,
    available: dogs.filter((d: Dog) => d.status === 'available').length,
    reserved: dogs.filter((d: Dog) => d.status === 'reserved').length,
    sold: dogs.filter((d: Dog) => d.status === 'sold').length,
    puppies: dogs.filter((d: Dog) => d.type === 'puppy').length,
    studs: dogs.filter((d: Dog) => d.type === 'stud').length,
    females: dogs.filter((d: Dog) => d.type === 'female').length
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-48 mb-6"></div>
          <div className="grid grid-cols-4 gap-4 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold">🐕 Dog Management</h1>
            <p className="text-gray-500 text-sm mt-1">Manage all dogs, puppies, studs, and females</p>
          </div>
          <div className="flex gap-2">
            <Link 
              href="/admin/dogs/new" 
              className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 flex items-center gap-2"
            >
              <span>➕</span> Add New Dog
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-7 gap-3 mb-6">
          <div className="bg-white p-3 rounded-lg shadow text-center">
            <p className="text-xs text-gray-500">Total</p>
            <p className="text-xl font-bold">{stats.total}</p>
          </div>
          <div className="bg-white p-3 rounded-lg shadow text-center border-l-4 border-green-500">
            <p className="text-xs text-gray-500">Available</p>
            <p className="text-xl font-bold text-green-600">{stats.available}</p>
          </div>
          <div className="bg-white p-3 rounded-lg shadow text-center border-l-4 border-yellow-500">
            <p className="text-xs text-gray-500">Reserved</p>
            <p className="text-xl font-bold text-yellow-600">{stats.reserved}</p>
          </div>
          <div className="bg-white p-3 rounded-lg shadow text-center border-l-4 border-gray-500">
            <p className="text-xs text-gray-500">Sold</p>
            <p className="text-xl font-bold text-gray-600">{stats.sold}</p>
          </div>
          <div className="bg-white p-3 rounded-lg shadow text-center">
            <p className="text-xs text-gray-500">🐕 Puppies</p>
            <p className="text-xl font-bold">{stats.puppies}</p>
          </div>
          <div className="bg-white p-3 rounded-lg shadow text-center">
            <p className="text-xs text-gray-500">👑 Studs</p>
            <p className="text-xl font-bold">{stats.studs}</p>
          </div>
          <div className="bg-white p-3 rounded-lg shadow text-center">
            <p className="text-xs text-gray-500">🐩 Females</p>
            <p className="text-xl font-bold">{stats.females}</p>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white p-4 rounded-lg shadow mb-6">
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
              <input
                type="text"
                placeholder="Search by name or color..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Type</label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full p-2 border rounded"
              >
                <option value="all">All Types</option>
                <option value="puppy">🐕 Puppies</option>
                <option value="stud">👑 Studs</option>
                <option value="female">🐩 Females</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Status</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full p-2 border rounded"
              >
                <option value="all">All Statuses</option>
                <option value="available">✅ Available</option>
                <option value="reserved">⏳ Reserved</option>
                <option value="sold">💰 Sold</option>
                <option value="retired">👴 Retired</option>
              </select>
            </div>
          </div>
        </div>

        {/* Dogs Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-3 text-left">Photo</th>
                  <th className="p-3 text-left">Name</th>
                  <th className="p-3 text-left">Type</th>
                  <th className="p-3 text-left">Status</th>
                  <th className="p-3 text-left">Price</th>
                  <th className="p-3 text-left">Details</th>
                  <th className="p-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredDogs.map((dog: Dog) => (
                  <tr key={dog.id} className="border-t hover:bg-gray-50">
                    <td className="p-2">
                      <div className="w-12 h-12 bg-gray-200 rounded-full overflow-hidden">
                        {dog.images?.[0] ? (
                          <Image 
                            src={dog.images[0]} 
                            alt={dog.name}
                            width={48}
                            height={48}
                            className="object-cover w-full h-full"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-2xl bg-gray-100">
                            {getTypeIcon(dog.type)}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="p-3 font-medium">
                      {dog.name}
                      {dog.featured && (
                        <span className="ml-2 text-yellow-500" title="Featured">⭐</span>
                      )}
                    </td>
                    <td className="p-3">
                      <span className="flex items-center gap-1">
                        {getTypeIcon(dog.type)} {dog.type}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusBadgeColor(dog.status)}`}>
                        {dog.status}
                      </span>
                    </td>
                    <td className="p-3 font-medium">
                      {dog.price ? `₦${dog.price.toLocaleString()}` : '-'}
                    </td>
                    <td className="p-3 text-sm text-gray-600">
                      {dog.type === 'female' && dog.next_heat && (
                        <div title="Next Heat">🔥 {new Date(dog.next_heat).toLocaleDateString()}</div>
                      )}
                      {dog.type === 'stud' && (
                        <div>{dog.weight || '-'} • {dog.height || '-'}</div>
                      )}
                      {dog.type === 'puppy' && (
                        <div>🎂 {dog.age || '-'}</div>
                      )}
                      {dog.color && <div className="text-xs">🎨 {dog.color}</div>}
                    </td>
                    <td className="p-3">
                      <div className="flex flex-col gap-2">
                        <select
                          value={dog.status || 'available'}
                          onChange={(e) => updateStatus(dog.id, e.target.value)}
                          className="border rounded p-1 text-sm"
                          aria-label="Change status"
                        >
                          <option value="available">✅ Available</option>
                          <option value="reserved">⏳ Reserved</option>
                          <option value="sold">💰 Sold</option>
                          <option value="retired">👴 Retired</option>
                        </select>
                        <div className="flex gap-2">
                          <Link 
                            href={`/admin/dogs/edit/${dog.id}`}
                            className="text-blue-600 hover:underline text-xs"
                          >
                            Edit
                          </Link>
                          <button 
                            onClick={() => deleteDog(dog.id, dog.name)}
                            className="text-red-600 hover:underline text-xs"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {filteredDogs.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No dogs found</p>
              <p className="text-gray-400 text-sm mt-1">Try adjusting your filters</p>
              <Link 
                href="/admin/dogs/new" 
                className="inline-block mt-4 bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800"
              >
                Add your first dog
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}