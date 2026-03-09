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

  // Multiple image upload state
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    // Create previews for all selected files
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
    
    setImageFiles(prev => [...prev, ...files]);
  };

  const removeImage = (index: number) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const uploadImages = async (files: File[]): Promise<string[]> => {
    setUploading(true);
    const uploadedUrls: string[] = [];
    
    try {
      for (const file of files) {
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

        uploadedUrls.push(publicUrl);
      }
    } catch (error) {
      console.error('Error uploading images:', error);
      alert('Failed to upload some images');
    } finally {
      setUploading(false);
    }
    
    return uploadedUrls;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    let allImages = [...formData.images];
    
    // Upload all new images
    if (imageFiles.length > 0) {
      const uploadedUrls = await uploadImages(imageFiles);
      allImages = [...uploadedUrls, ...allImages];
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
      images: allImages,
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
          {/* Multiple Image Upload Section */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold border-b pb-2">📸 Photos (Select Multiple)</h2>
            
            <div>
              <label className="block font-medium mb-1">Upload Images</label>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageChange}
                className="w-full p-2 border rounded"
              />
              <p className="text-xs text-gray-500 mt-1">
                You can select multiple images (Ctrl+Click or Cmd+Click)
              </p>
            </div>

            {/* Image Previews */}
            {imagePreviews.length > 0 && (
              <div>
                <p className="text-sm font-medium mb-2">New Images Preview:</p>
                <div className="grid grid-cols-4 gap-2">
                  {imagePreviews.map((preview, idx) => (
                    <div key={idx} className="relative group">
                      <div className="relative w-24 h-24 border rounded overflow-hidden">
                        <Image
                          src={preview}
                          alt={`Preview ${idx + 1}`}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeImage(idx)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Existing Images */}
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

          {/* Rest of the form fields */}
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

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block font-medium mb-1">Price (₦)</label>
              <input
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({...formData, price: e.target.value})}
                className="w-full p-2 border rounded"
                placeholder={type === 'stud' ? 'Stud fee' : 'Price'}
              />
            </div>
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
          </div>

          <div className="grid md:grid-cols-2 gap-4">
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

          {/* Female specific fields */}
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

          {/* Parents & Pedigree */}
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
                placeholder="Champion bloodline"
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

          <button
            type="submit"
            disabled={loading || uploading}
            className="w-full bg-black text-white py-3 rounded-lg hover:bg-gray-800 disabled:opacity-50"
          >
            {loading ? 'Adding...' : uploading ? `Uploading ${imageFiles.length} images...` : 'Add Dog'}
          </button>
        </form>
      </div>
    </div>
  );
}