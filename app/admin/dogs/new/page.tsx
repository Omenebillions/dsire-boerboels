// app/admin/dogs/new/page.tsx
"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function NewDogPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [type, setType] = useState('puppy');
  
  // Common fields
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    status: 'available',
    age: '',
    color: '',
    weight: '',
    height: '',
    description: '',
    images: [''],
    pedigree: '',
    parents: '',
    // Female specific
    next_heat: '',
    last_heat: '',
    litter_count: '0',
    // Stud specific
    available_for_breeding: true
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const dogData = {
      ...formData,
      type: type,
      price: formData.price ? Number(formData.price) : null,
      litter_count: formData.litter_count ? Number(formData.litter_count) : 0,
      images: formData.images.filter(img => img.trim() !== ''),
      created_at: new Date().toISOString()
    };

    const { error } = await supabase.from('dogs').insert([dogData]);

    if (error) {
      alert('Error adding dog: ' + error.message);
    } else {
      alert('Dog added successfully!');
      router.push('/admin/dogs');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4">
        <h1 className="text-3xl font-bold mb-6">Add New Dog</h1>

        {/* Type Selector */}
        <div className="flex gap-4 mb-6">
          {[
            { value: 'puppy', label: '🐕 Puppy', icon: '🐕' },
            { value: 'stud', label: '👑 Stud', icon: '👑' },
            { value: 'female', label: '🐩 Female', icon: '🐩' }
          ].map((option) => (
            <button
              key={option.value}
              onClick={() => setType(option.value)}
              className={`flex-1 py-3 rounded-lg font-bold flex items-center justify-center gap-2 ${
                type === option.value 
                  ? 'bg-black text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              <span>{option.icon}</span> {option.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow space-y-4">
          {/* Basic Info - All Types */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block font-medium mb-1">Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full p-2 border rounded"
                placeholder="e.g., King Max"
              />
            </div>
            <div>
              <label className="block font-medium mb-1">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({...formData, status: e.target.value})}
                className="w-full p-2 border rounded"
              >
                <option value="available">✅ Available</option>
                <option value="reserved">⏳ Reserved</option>
                <option value="sold">💰 Sold</option>
                <option value="retired">👴 Retired</option>
              </select>
            </div>
          </div>

          {/* Price - Not for females usually */}
          {type !== 'female' && (
            <div>
              <label className="block font-medium mb-1">
                {type === 'stud' ? 'Stud Fee (₦)' : 'Price (₦)'}
              </label>
              <input
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({...formData, price: e.target.value})}
                className="w-full p-2 border rounded"
                placeholder={type === 'stud' ? 'e.g., 300000' : 'e.g., 1500000'}
              />
            </div>
          )}

          {/* Physical Attributes */}
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block font-medium mb-1">Age</label>
              <input
                type="text"
                value={formData.age}
                onChange={(e) => setFormData({...formData, age: e.target.value})}
                className="w-full p-2 border rounded"
                placeholder={type === 'puppy' ? '8 weeks' : '2 years'}
              />
            </div>
            <div>
              <label className="block font-medium mb-1">Color</label>
              <input
                type="text"
                value={formData.color}
                onChange={(e) => setFormData({...formData, color: e.target.value})}
                className="w-full p-2 border rounded"
                placeholder="e.g., Brown Brindle"
              />
            </div>
            {type === 'stud' && (
              <>
                <div>
                  <label className="block font-medium mb-1">Weight</label>
                  <input
                    type="text"
                    value={formData.weight}
                    onChange={(e) => setFormData({...formData, weight: e.target.value})}
                    className="w-full p-2 border rounded"
                    placeholder="e.g., 65kg"
                  />
                </div>
                <div>
                  <label className="block font-medium mb-1">Height</label>
                  <input
                    type="text"
                    value={formData.height}
                    onChange={(e) => setFormData({...formData, height: e.target.value})}
                    className="w-full p-2 border rounded"
                    placeholder="e.g., 70cm"
                  />
                </div>
              </>
            )}
          </div>

          {/* Female Specific Fields */}
          {type === 'female' && (
            <div className="grid md:grid-cols-3 gap-4 p-4 bg-pink-50 rounded-lg">
              <div>
                <label className="block font-medium mb-1">🔥 Next Heat</label>
                <input
                  type="date"
                  value={formData.next_heat}
                  onChange={(e) => setFormData({...formData, next_heat: e.target.value})}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div>
                <label className="block font-medium mb-1">Last Heat</label>
                <input
                  type="date"
                  value={formData.last_heat}
                  onChange={(e) => setFormData({...formData, last_heat: e.target.value})}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div>
                <label className="block font-medium mb-1">Litter Count</label>
                <input
                  type="number"
                  value={formData.litter_count}
                  onChange={(e) => setFormData({...formData, litter_count: e.target.value})}
                  className="w-full p-2 border rounded"
                />
              </div>
            </div>
          )}

          {/* Pedigree & Parents */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block font-medium mb-1">Parents</label>
              <input
                type="text"
                value={formData.parents}
                onChange={(e) => setFormData({...formData, parents: e.target.value})}
                className="w-full p-2 border rounded"
                placeholder="e.g., Titan x Luna"
              />
            </div>
            <div>
              <label className="block font-medium mb-1">Pedigree</label>
              <input
                type="text"
                value={formData.pedigree}
                onChange={(e) => setFormData({...formData, pedigree: e.target.value})}
                className="w-full p-2 border rounded"
                placeholder="e.g., Champion bloodline"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block font-medium mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              rows={4}
              className="w-full p-2 border rounded"
              placeholder="Describe temperament, health, achievements..."
            />
          </div>

          {/* Image URL */}
          <div>
            <label className="block font-medium mb-1">Image URL</label>
            <input
              type="text"
              value={formData.images[0]}
              onChange={(e) => setFormData({...formData, images: [e.target.value]})}
              className="w-full p-2 border rounded"
              placeholder="/dogs/dog-name.jpg"
            />
            <p className="text-xs text-gray-500 mt-1">
              Place image in /public/dogs/ folder first
            </p>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black text-white py-3 rounded-lg hover:bg-gray-800 disabled:opacity-50"
          >
            {loading ? 'Adding...' : `Add ${type.charAt(0).toUpperCase() + type.slice(1)}`}
          </button>
        </form>
      </div>
    </div>
  );
}