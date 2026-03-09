// app/admin/dogs/edit/[id]/page.tsx
"use client";
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Image from 'next/image';
import Link from 'next/link';

export default function EditDogPage() {
  const router = useRouter();
  const params = useParams();
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dog, setDog] = useState<any>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState('');

  useEffect(() => {
    fetchDog();
  }, []);

  const fetchDog = async () => {
    const { data } = await supabase
      .from('dogs')
      .select('*')
      .eq('id', params.id)
      .single();
    
    setDog(data);
    setLoading(false);
  };

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

    let images = dog.images || [];
    
    if (imageFile) {
      const uploadedUrl = await uploadImage(imageFile);
      if (uploadedUrl) {
        images = [uploadedUrl, ...images];
      }
    }

    const { error } = await supabase
      .from('dogs')
      .update({ ...dog, images })
      .eq('id', params.id);

    if (error) {
      alert('Error updating dog: ' + error.message);
    } else {
      alert('Dog updated successfully!');
      router.push('/admin/dogs');
    }
    setLoading(false);
  };

  if (loading) return <div className="p-8 text-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4">
        <h1 className="text-3xl font-bold mb-6">Edit {dog.name}</h1>

        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow space-y-4">
          {/* Image Upload Section */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold border-b pb-2">📸 Photos</h2>
            
            <div>
              <label className="block font-medium mb-1">Upload New Image</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="w-full p-2 border rounded"
              />
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

            {dog.images && dog.images.length > 0 && (
              <div>
                <p className="text-sm font-medium mb-2">Current Images:</p>
                <div className="flex gap-2 flex-wrap">
                  {dog.images.map((img: string, idx: number) => (
                    <div key={idx} className="relative w-16 h-16 border rounded overflow-hidden">
                      <Image src={img} alt={`Dog ${idx}`} fill className="object-cover" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Form fields - similar to new page */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block font-medium mb-1">Name</label>
              <input
                type="text"
                value={dog.name}
                onChange={(e) => setDog({...dog, name: e.target.value})}
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label className="block font-medium mb-1">Status</label>
              <select
                value={dog.status}
                onChange={(e) => setDog({...dog, status: e.target.value})}
                className="w-full p-2 border rounded"
              >
                <option value="available">✅ Available</option>
                <option value="reserved">⏳ Reserved</option>
                <option value="sold">💰 Sold</option>
                <option value="retired">👴 Retired</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-medium mb-1">Price</label>
            <input
              type="number"
              value={dog.price || ''}
              onChange={(e) => setDog({...dog, price: e.target.value})}
              className="w-full p-2 border rounded"
            />
          </div>

          <button
            type="submit"
            disabled={loading || uploading}
            className="w-full bg-black text-white py-3 rounded-lg hover:bg-gray-800 disabled:opacity-50"
          >
            {uploading ? 'Uploading...' : 'Update Dog'}
          </button>
        </form>
      </div>
    </div>
  );
}