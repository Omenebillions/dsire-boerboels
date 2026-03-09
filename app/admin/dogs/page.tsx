// app/admin/dogs/new/page.tsx
"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import Image from 'next/image';

export default function NewDogPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [type, setType] = useState('puppy');
  
  // Form data
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    status: 'available',
    age: '',
    color: '',
    weight: '',
    height: '',
    description: '',
    images: [] as string[],
    pedigree: '',
    parents: '',
    next_heat: '',
    last_heat: '',
    litter_count: '0',
  });

  // Image upload state
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState('');

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `dogs/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('dog-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('dog-images')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Failed to upload image');
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    let imageUrls = [...formData.images];
    
    // Upload new image if selected
    if (imageFile) {
      const uploadedUrl = await uploadImage(imageFile);
      if (uploadedUrl) {
        imageUrls = [uploadedUrl, ...imageUrls];
      }
    }

    const dogData = {
      name: formData.name,
      type: type,
      status: formData.status,
      price: formData.price ? Number(formData.price) : null,
      age: formData.age || null,
      color: formData.color || null,
      weight: formData.weight || null,
      height: formData.height || null,
      description: formData.description || null,
      images: imageUrls,
      pedigree: formData.pedigree || null,
      parents: formData.parents || null,
      next_heat: formData.next_heat || null,
      last_heat: formData.last_heat || null,
      litter_count: formData.litter_count ? Number(formData.litter_count) : 0,
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
            { value: 'puppy', label: '🐕 Puppy' },
            { value: 'stud', label: '👑 Stud' },
            { value: 'female', label: '🐩 Female' }
          ].map((option) => (
            <button
              key={option.value}
              onClick={() => setType(option.value)}
              className={`flex-1 py-3 rounded-lg font-bold ${
                type === option.value 
                  ? 'bg-black text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow space-y-4">
          {/* Image Upload Section */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold border-b pb-2">📸 Photos</h2>
            
            <div>
              <label className="block font-medium mb-1">Upload Image</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="w-full p-2 border rounded"
              />
              <p className="text-xs text-gray-500 mt-1">
                Upload a photo of the dog (JPEG, PNG)
              </p>
            </div>

            {imagePreview && (
              <div className="mt-2">
                <p className="text-sm font-medium mb-1">Preview:</p>
                <div className="relative w-32 h-32 border rounded overflow-hidden">
                  <Image
                    src={imagePreview}
                    alt="Preview"
                    fill
                    className="object-cover"
                  />
                </div>
              </div>
            )}

            {formData.images.length > 0 && (
              <div>
                <p className="text-sm font-medium mb-2">Existing Images:</p>
                <div className="flex gap-2 flex-wrap">
                  {formData.images.map((img, idx) => (
                    <div key={idx} className="relative w-16 h-16 border rounded overflow-hidden">
                      <Image src={img} alt={`Dog ${idx}`} fill className="object-cover" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Rest of your form fields... */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block font-medium mb-1">Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full p-2 border rounded"
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

          {/* Price field */}
          <div>
            <label className="block font-medium mb-1">Price (₦)</label>
            <input
              type="number"
              value={formData.price}
              onChange={(e) => setFormData({...formData, price: e.target.value})}
              className="w-full p-2 border rounded"
            />
          </div>

          {/* Add remaining fields as needed */}

          <button
            type="submit"
            disabled={loading || uploading}
            className="w-full bg-black text-white py-3 rounded-lg hover:bg-gray-800 disabled:opacity-50"
          >
            {loading ? 'Adding...' : uploading ? 'Uploading...' : 'Add Dog'}
          </button>
        </form>
      </div>
    </div>
  );
}