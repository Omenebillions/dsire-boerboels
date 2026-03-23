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
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dog, setDog] = useState<any>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState('');
  const [originalStatus, setOriginalStatus] = useState('');

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
    setOriginalStatus(data?.status || '');
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

  // Function to handle status change and record sales
  const handleStatusChange = async (newStatus: string) => {
    if (!dog) return;

    const oldStatus = originalStatus;
    const DEPOSIT = 100000;
    const today = new Date().toISOString().split('T')[0];

    // If status didn't change, just return
    if (newStatus === oldStatus) return;

    // Check if we need to record a deposit
    if (newStatus === 'reserved' && oldStatus !== 'reserved') {
      // Record deposit
      const { error: depositError } = await supabase.from('sales').insert([{
        source: 'dog_reserve',
        item_type: 'dog',
        item_id: dog.id,
        item_name: dog.name,
        customer_name: 'Walk-in Customer',
        price: DEPOSIT,
        payment_status: 'partial',
        payment_method: 'pending',
        sale_date: today,
        created_at: new Date().toISOString(),
        notes: `Deposit for ${dog.name}`
      }]);

      if (depositError) {
        alert('Error recording deposit: ' + depositError.message);
        return false;
      }
      
      alert(`✅ ${dog.name} marked as RESERVED. ₦${DEPOSIT.toLocaleString()} deposit recorded.`);
    }

    // Check if we need to record final sale
    if (newStatus === 'sold' && oldStatus !== 'sold') {
      let finalAmount = dog.price || 0;
      let saleNotes = '';
      
      // If it was reserved, only charge the balance
      if (oldStatus === 'reserved') {
        finalAmount = (dog.price || 0) - DEPOSIT;
        saleNotes = `Final payment for ${dog.name} (balance after ₦${DEPOSIT.toLocaleString()} deposit)`;
      } else {
        saleNotes = `Full sale for ${dog.name}`;
      }
      
      if (finalAmount > 0) {
        const { error: saleError } = await supabase.from('sales').insert([{
          source: 'dog_sold',
          item_type: 'dog',
          item_id: dog.id,
          item_name: dog.name,
          customer_name: 'Walk-in Customer',
          price: finalAmount,
          payment_status: 'paid',
          payment_method: 'transfer',
          sale_date: today,
          created_at: new Date().toISOString(),
          notes: saleNotes
        }]);

        if (saleError) {
          alert('Error recording sale: ' + saleError.message);
          return false;
        }
        
        alert(`✅ ${dog.name} marked as SOLD. ₦${finalAmount.toLocaleString()} recorded in sales ledger.`);
      } else if (finalAmount === 0) {
        alert(`✅ ${dog.name} marked as SOLD. No additional payment needed (deposit already covered full price).`);
      }
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    let images = dog.images || [];
    
    if (imageFile) {
      const uploadedUrl = await uploadImage(imageFile);
      if (uploadedUrl) {
        images = [uploadedUrl, ...images];
      }
    }

    // First, handle status change and record sales if needed
    const statusChanged = dog.status !== originalStatus;
    if (statusChanged) {
      const success = await handleStatusChange(dog.status);
      if (!success) {
        setSaving(false);
        return;
      }
    }

    // Update dog data
    const { error } = await supabase
      .from('dogs')
      .update({ 
        name: dog.name,
        status: dog.status,
        price: dog.price,
        type: dog.type,
        age: dog.age,
        color: dog.color,
        description: dog.description,
        images: images,
        pedigree: dog.pedigree,
        parents: dog.parents,
        featured: dog.featured || false
      })
      .eq('id', params.id);

    if (error) {
      alert('Error updating dog: ' + error.message);
    } else {
      alert('Dog updated successfully!');
      router.push('/admin/dogs');
    }
    setSaving(false);
  };

  if (loading) return <div className="min-h-screen bg-gray-50 p-8 text-center">Loading...</div>;

  if (!dog) return (
    <div className="min-h-screen bg-gray-50 p-8 text-center">
      <p className="text-red-600">Dog not found</p>
      <Link href="/admin/dogs" className="text-blue-600 mt-4 inline-block">← Back to Dogs</Link>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Edit {dog.name}</h1>
          <Link href="/admin/dogs" className="text-gray-600 hover:text-gray-800">← Back</Link>
        </div>

        {/* Status Change Alert */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-yellow-800">
            <strong>⚠️ Important:</strong> Changing status to "Reserved" will record a ₦100,000 deposit. 
            Changing to "Sold" will record the final payment (or balance if reserved).
          </p>
        </div>

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

          {/* Basic Info */}
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
              <label className="block font-medium mb-1">Type</label>
              <select
                value={dog.type}
                onChange={(e) => setDog({...dog, type: e.target.value})}
                className="w-full p-2 border rounded"
              >
                <option value="puppy">🐕 Puppy</option>
                <option value="stud">👑 Stud</option>
                <option value="female">🐩 Female</option>
              </select>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block font-medium mb-1">Status</label>
              <select
                value={dog.status}
                onChange={(e) => setDog({...dog, status: e.target.value})}
                className="w-full p-2 border rounded"
              >
                <option value="available">✅ Available</option>
                <option value="reserved">⏳ Reserved (₦100k Deposit)</option>
                <option value="sold">💰 Sold</option>
                <option value="retired">👴 Retired</option>
              </select>
              {dog.status === 'reserved' && (
                <p className="text-xs text-yellow-600 mt-1">⚠️ This will record a ₦100,000 deposit when saved</p>
              )}
              {dog.status === 'sold' && originalStatus !== 'sold' && (
                <p className="text-xs text-green-600 mt-1">💰 This will record the sale in your ledger</p>
              )}
            </div>
            <div>
              <label className="block font-medium mb-1">Price (₦)</label>
              <input
                type="number"
                value={dog.price || ''}
                onChange={(e) => setDog({...dog, price: Number(e.target.value)})}
                className="w-full p-2 border rounded"
                placeholder="0"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block font-medium mb-1">Age</label>
              <input
                type="text"
                value={dog.age || ''}
                onChange={(e) => setDog({...dog, age: e.target.value})}
                className="w-full p-2 border rounded"
                placeholder="e.g., 2 years, 8 weeks"
              />
            </div>
            <div>
              <label className="block font-medium mb-1">Color</label>
              <input
                type="text"
                value={dog.color || ''}
                onChange={(e) => setDog({...dog, color: e.target.value})}
                className="w-full p-2 border rounded"
                placeholder="e.g., Fawn, Brindle"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block font-medium mb-1">Parents</label>
              <input
                type="text"
                value={dog.parents || ''}
                onChange={(e) => setDog({...dog, parents: e.target.value})}
                className="w-full p-2 border rounded"
                placeholder="e.g., Titan x Luna"
              />
            </div>
            <div>
              <label className="block font-medium mb-1">Pedigree</label>
              <input
                type="text"
                value={dog.pedigree || ''}
                onChange={(e) => setDog({...dog, pedigree: e.target.value})}
                className="w-full p-2 border rounded"
                placeholder="Champion bloodline"
              />
            </div>
          </div>

          <div>
            <label className="block font-medium mb-1">Description</label>
            <textarea
              value={dog.description || ''}
              onChange={(e) => setDog({...dog, description: e.target.value})}
              rows={4}
              className="w-full p-2 border rounded"
              placeholder="Describe temperament, health, achievements..."
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="featured"
              checked={dog.featured || false}
              onChange={(e) => setDog({...dog, featured: e.target.checked})}
              className="w-4 h-4"
            />
            <label htmlFor="featured" className="font-medium">⭐ Featured Dog (shows on homepage)</label>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={saving || uploading}
              className="flex-1 bg-black text-white py-3 rounded-lg hover:bg-gray-800 disabled:opacity-50"
            >
              {saving ? 'Saving...' : uploading ? 'Uploading...' : 'Save Changes'}
            </button>
            <Link
              href="/admin/dogs"
              className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 text-center"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}