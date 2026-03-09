// app/admin/products/new/page.tsx
"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import Image from 'next/image';

export default function NewProductPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    cost: '',
    compare_price: '',
    description: '',
    category: 'Food',
    stock: '10',
    in_stock: true,
    featured: false,
    weight: '',
    brand: '',
    sku: '',
    images: [] as string[]
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
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
    
    for (const file of files) {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `products/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, file);

      if (!uploadError) {
        const { data: { publicUrl } } = supabase.storage
          .from('product-images')
          .getPublicUrl(filePath);
        uploadedUrls.push(publicUrl);
      }
    }
    
    setUploading(false);
    return uploadedUrls;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    let imageUrls = [...formData.images];
    
    if (imageFiles.length > 0) {
      const uploadedUrls = await uploadImages(imageFiles);
      imageUrls = [...uploadedUrls, ...imageUrls];
    }

    const productData = {
      ...formData,
      price: Number(formData.price),
      cost: formData.cost ? Number(formData.cost) : null,
      compare_price: formData.compare_price ? Number(formData.compare_price) : null,
      stock: Number(formData.stock),
      images: imageUrls,
      sku: formData.sku || `PRD-${Date.now()}`
    };

    const { error } = await supabase.from('products').insert([productData]);

    if (error) {
      alert('Error: ' + error.message);
    } else {
      alert('Product added!');
      router.push('/admin/products');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4">
        <h1 className="text-3xl font-bold mb-6">Add New Product</h1>
        
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow space-y-4">
          {/* Image Upload */}
          <div>
            <label className="block font-medium mb-1">Product Images</label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageChange}
              className="w-full p-2 border rounded"
            />
            
            {imagePreviews.length > 0 && (
              <div className="grid grid-cols-4 gap-2 mt-2">
                {imagePreviews.map((preview, idx) => (
                  <div key={idx} className="relative">
                    <Image src={preview} alt="Preview" width={80} height={80} className="rounded" />
                    <button type="button" onClick={() => removeImage(idx)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5">✕</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Basic Info */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block font-medium mb-1">Product Name *</label>
              <input type="text" required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full p-2 border rounded" />
            </div>
            <div>
              <label className="block font-medium mb-1">Category *</label>
              <select value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})} className="w-full p-2 border rounded">
                <option value="Food">🍖 Food</option>
                <option value="Toys">🧸 Toys</option>
                <option value="Grooming">✂️ Grooming</option>
                <option value="Treats">🦴 Treats</option>
                <option value="Accessories">🪢 Accessories</option>
                <option value="Health">💊 Health</option>
              </select>
            </div>
          </div>

          {/* Price Fields */}
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block font-medium mb-1">Price (₦) *</label>
              <input type="number" required value={formData.price} onChange={(e) => setFormData({...formData, price: e.target.value})} className="w-full p-2 border rounded" />
            </div>
            <div>
              <label className="block font-medium mb-1">Cost (₦)</label>
              <input type="number" value={formData.cost} onChange={(e) => setFormData({...formData, cost: e.target.value})} className="w-full p-2 border rounded" />
            </div>
            <div>
              <label className="block font-medium mb-1">Compare Price</label>
              <input type="number" value={formData.compare_price} onChange={(e) => setFormData({...formData, compare_price: e.target.value})} className="w-full p-2 border rounded" />
            </div>
          </div>

          {/* Stock & SKU */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block font-medium mb-1">Stock Quantity</label>
              <input type="number" value={formData.stock} onChange={(e) => setFormData({...formData, stock: e.target.value})} className="w-full p-2 border rounded" />
            </div>
            <div>
              <label className="block font-medium mb-1">SKU</label>
              <input type="text" value={formData.sku} onChange={(e) => setFormData({...formData, sku: e.target.value})} className="w-full p-2 border rounded" placeholder="Auto-generated if empty" />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block font-medium mb-1">Description</label>
            <textarea value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} rows={4} className="w-full p-2 border rounded" />
          </div>

          {/* Checkboxes */}
          <div className="flex gap-4">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={formData.in_stock} onChange={(e) => setFormData({...formData, in_stock: e.target.checked})} />
              <span>In Stock</span>
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={formData.featured} onChange={(e) => setFormData({...formData, featured: e.target.checked})} />
              <span>Featured</span>
            </label>
          </div>

          <button type="submit" disabled={loading || uploading} className="w-full bg-black text-white py-3 rounded-lg">
            {loading ? 'Adding...' : uploading ? 'Uploading...' : 'Add Product'}
          </button>
        </form>
      </div>
    </div>
  );
}