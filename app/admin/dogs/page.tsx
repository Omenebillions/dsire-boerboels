"use client";
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import Image from 'next/image';

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
    if (filterType !== 'all') query = query.eq('type', filterType);
    if (filterStatus !== 'all') query = query.eq('status', filterStatus);
    
    const { data } = await query.order('created_at', { ascending: false });
    setDogs((data as Dog[]) || []);
    setLoading(false);
  };

  const updateStatus = async (id: number, newStatus: string) => {
    const { data: dog } = await supabase
      .from('dogs')
      .select('name, price, status')
      .eq('id', id)
      .single();

    if (!dog) return;

    const { error } = await supabase
      .from('dogs')
      .update({ status: newStatus })
      .eq('id', id);
    
    if (!error) {
      const today = new Date().toISOString().split('T')[0];
      const DEPOSIT = 100000;

      // --- RESERVED: record deposit ---
      if (newStatus === 'reserved') {
        await supabase.from('sales').insert([{
          item_type: 'dog',
          item_id: id,
          item_name: dog.name,
          price: DEPOSIT,
          customer_name: 'Walk-in Customer',
          payment_status: 'partial',
          source: 'dog_reserve',
          sale_date: today,
          notes: `Deposit for ${dog.name}`
        }]);

        alert(`✅ ${dog.name} marked as RESERVED. ₦100,000 deposit recorded.`);
      }
      
      // --- SOLD: record only the remaining balance ---
      if (newStatus === 'sold') {
        // If dog was previously reserved, subtract deposit; otherwise full price.
        const finalAmount = dog.status === 'reserved' 
          ? (dog.price || 0) - DEPOSIT 
          : (dog.price || 0);

        // Only insert a sale if there is an amount (even zero, though unlikely)
        if (finalAmount > 0) {
          await supabase.from('sales').insert([{
            item_type: 'dog',
            item_id: id,
            item_name: dog.name,
            price: finalAmount,
            customer_name: 'Walk-in Customer',
            payment_status: 'paid',
            source: 'dog_sold',
            sale_date: today,
            notes: dog.status === 'reserved' 
              ? `Final payment for ${dog.name} (balance after deposit)`
              : `Full sale for ${dog.name}`
          }]);
        } else if (finalAmount === 0 && dog.status === 'reserved') {
          // If price exactly equals deposit (unlikely but handle)
          // No additional sale needed, but you might want a zero‑value record? Skip.
        }
        
        alert(`✅ ${dog.name} marked as SOLD. Final payment recorded.`);
      }
      
      fetchDogs();
    }
  };

  const deleteDog = async (id: number, name: string) => {
    if (confirm(`Are you sure you want to delete ${name}?`)) {
      const { error } = await supabase.from('dogs').delete().eq('id', id);
      if (!error) {
        alert(`✅ ${name} deleted successfully.`);
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

  const filteredDogs = dogs.filter((dog: Dog) => 
    dog.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    dog.color?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    total: dogs.length,
    available: dogs.filter((d) => d.status === 'available').length,
    reserved: dogs.filter((d) => d.status === 'reserved').length,
    sold: dogs.filter((d) => d.status === 'sold').length,
    puppies: dogs.filter((d) => d.type === 'puppy').length,
    studs: dogs.filter((d) => d.type === 'stud').length,
    females: dogs.filter((d) => d.type === 'female').length
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-50 p-8 flex items-center justify-center">
      <p className="animate-pulse text-xl font-semibold">Loading Kennel Records...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">🐕 Dog Management</h1>
            <p className="text-gray-600 text-sm mt-1">Manage all dogs, puppies, studs, and females</p>
          </div>
          <Link 
            href="/admin/dogs/new" 
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2.5 rounded-lg flex items-center gap-2 shadow-md transition-all transform hover:scale-105"
          >
            <span>➕</span> <span>Add New Dog</span>
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-7 gap-3 mb-6 text-center">
          {[
            { label: 'Total', val: stats.total, color: 'bg-white' },
            { label: 'Available', val: stats.available, color: 'border-l-4 border-green-500 bg-white', text: 'text-green-600' },
            { label: 'Reserved', val: stats.reserved, color: 'border-l-4 border-yellow-500 bg-white', text: 'text-yellow-600' },
            { label: 'Sold', val: stats.sold, color: 'border-l-4 border-gray-500 bg-white', text: 'text-gray-600' },
            { label: '🐕 Puppies', val: stats.puppies, color: 'bg-white' },
            { label: '👑 Studs', val: stats.studs, color: 'bg-white' },
            { label: '🐩 Females', val: stats.females, color: 'bg-white' },
          ].map((s, i) => (
            <div key={i} className={`${s.color} p-3 rounded-lg shadow-sm`}>
              <p className="text-xs text-gray-500">{s.label}</p>
              <p className={`text-xl font-bold ${s.text || ''}`}>{s.val}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-lg shadow-sm mb-6 grid md:grid-cols-3 gap-4">
          <input 
            type="text" 
            placeholder="Search by name or color..." 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
            className="p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
          />
          <select 
            value={filterType} 
            onChange={(e) => setFilterType(e.target.value)} 
            className="p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="all">All Types</option>
            <option value="puppy">🐕 Puppies</option>
            <option value="stud">👑 Studs</option>
            <option value="female">🐩 Females</option>
          </select>
          <select 
            value={filterStatus} 
            onChange={(e) => setFilterStatus(e.target.value)} 
            className="p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="available">✅ Available</option>
            <option value="reserved">⏳ Reserved</option>
            <option value="sold">💰 Sold</option>
            <option value="retired">👴 Retired</option>
          </select>
        </div>

        {/* Dogs Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="p-4 text-left text-sm font-semibold text-gray-600">Dog</th>
                <th className="p-4 text-left text-sm font-semibold text-gray-600">Type</th>
                <th className="p-4 text-left text-sm font-semibold text-gray-600">Status</th>
                <th className="p-4 text-left text-sm font-semibold text-gray-600">Price</th>
                <th className="p-4 text-left text-sm font-semibold text-gray-600">Details</th>
                <th className="p-4 text-left text-sm font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredDogs.map((dog) => (
                <tr key={dog.id} className="border-b hover:bg-gray-50 transition">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gray-100 overflow-hidden relative flex-shrink-0">
                        {dog.images?.[0] ? (
                          <Image src={dog.images[0]} alt={dog.name} fill className="object-cover" />
                        ) : (
                          <div className="flex items-center justify-center h-full w-full text-lg">
                            {getTypeIcon(dog.type)}
                          </div>
                        )}
                      </div>
                      <span className="font-medium text-gray-900">{dog.name}</span>
                      {dog.featured && <span className="text-yellow-500 text-xs">⭐</span>}
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="capitalize text-gray-700">{dog.type}</span>
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${getStatusBadgeColor(dog.status)}`}>
                      {dog.status}
                    </span>
                  </td>
                  <td className="p-4 font-medium text-gray-900">
                    {dog.price ? `₦${dog.price.toLocaleString()}` : '-'}
                  </td>
                  <td className="p-4 text-sm text-gray-500">
                    {dog.color && <span className="mr-2">🎨 {dog.color}</span>}
                    {dog.age && <span>📅 {dog.age}</span>}
                  </td>
                  <td className="p-4">
                    <div className="flex flex-col gap-2">
                      <select 
                        value={dog.status} 
                        onChange={(e) => updateStatus(dog.id, e.target.value)}
                        className="text-xs border rounded-lg p-1.5 focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="available">✅ Available</option>
                        <option value="reserved">⏳ Reserved</option>
                        <option value="sold">💰 Sold</option>
                        <option value="retired">👴 Retired</option>
                      </select>
                      <div className="flex gap-3 text-xs">
                        <Link href={`/admin/dogs/edit/${dog.id}`} className="text-blue-600 hover:text-blue-800 font-medium">
                          Edit
                        </Link>
                        <button 
                          onClick={() => deleteDog(dog.id, dog.name)} 
                          className="text-red-600 hover:text-red-800 font-medium"
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
          {filteredDogs.length === 0 && (
            <div className="p-12 text-center text-gray-500">
              <p className="text-lg">No dogs found</p>
              <p className="text-sm mt-1">Try adjusting your filters</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}