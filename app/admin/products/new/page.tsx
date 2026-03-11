// app/admin/products/new/page.tsx
"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import Image from 'next/image';
import imageCompression from 'browser-image-compression';

export default function NewProductPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Form data
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

  // Multiple image upload state
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [compressionStats, setCompressionStats] = useState<{ [key: string]: string }>({});

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
    
    const fileToRemove = imageFiles[index];
    if (fileToRemove) {
      const newStats = { ...compressionStats };
      delete newStats[fileToRemove.name];
      setCompressionStats(newStats);
    }
  };

  const compressImage = async (file: File): Promise<File> => {
    const options = {
      maxSizeMB: 1,
      maxWidthOrHeight: 1920,
      useWebWorker: true,
      fileType: 'image/jpeg',
      initialQuality: 0.8,
    };

    try {
      const originalSize = file.size / 1024 / 1024;
      
      if (file.size < 1024 * 1024) {
        setCompressionStats(prev => ({
          ...prev,
          [file.name]: `⏭️ Skipped (${originalSize.toFixed(2)}MB)`
        }));
        return file;
      }
      
      const compressedFile = await imageCompression(file, options);
      const compressedSize = compressedFile.size / 1024 / 1024;
      const savings = ((originalSize - compressedSize) / originalSize * 100).toFixed(1);
      
      setCompressionStats(prev => ({
        ...prev,
        [file.name]: `✅ ${originalSize.toFixed(2)}MB → ${compressedSize.toFixed(2)}MB (${savings}% saved)`
      }));
      
      return compressedFile;
    } catch (error) {
      console.error('Compression error:', error);
      setCompressionStats(prev => ({
        ...prev,
        [file.name]: `⚠️ Compression failed, using original`
      }));
      return file;
    }
  };

  const uploadImages = async (files: File[]): Promise<string[]> => {
    setUploading(true);
    const uploadedUrls: string[] = [];
    
    try {
      for (const file of files) {
        const compressedFile = await compressImage(file);
        
        // Sanitize filename - remove special characters and spaces
        const fileExt = file.name.split('.').pop();
        const baseName = file.name.split('.').slice(0, -1).join('.');
        const sanitizedName = baseName
          .replace(/[^a-zA-Z0-9]/g, '_')
          .replace(/\s+/g, '_')
          .substring(0, 50);
        
        const fileName = `${Date.now()}-${sanitizedName}.${fileExt}`;
        const filePath = `products/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('product-images')
          .upload(filePath, compressedFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('product-images')
          .getPublicUrl(filePath);

        uploadedUrls.push(publicUrl);
      }
    } catch (error: any) {
      console.error('Error uploading images:', error);
      alert(`Upload failed: ${error.message || 'Unknown error'}`);
    } finally {
      setUploading(false);
    }
    
    return uploadedUrls;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    let allImages = [...formData.images];
    
    if (imageFiles.length > 0) {
      const uploadedUrls = await uploadImages(imageFiles);
      allImages = [...uploadedUrls, ...allImages];
    }

    const productData = {
      name: formData.name,
      category: formData.category,
      price: formData.price ? Number(formData.price) : 0,
      cost: formData.cost ? Number(formData.cost) : null,
      compare_price: formData.compare_price ? Number(formData.compare_price) : null,
      description: formData.description || null,
      stock: formData.stock ? Number(formData.stock) : 0,
      in_stock: formData.in_stock,
      featured: formData.featured,
      weight: formData.weight || null,
      brand: formData.brand || null,
      sku: formData.sku || `PRD-${Date.now()}`,
      images: allImages,
    };

    const { error } = await supabase.from('products').insert([productData]);

    if (error) {
      alert('Error adding product: ' + error.message);
    } else {
      alert('Product added successfully!');
      router.push('/admin/products');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Add New Product</h1>
          <Link href="/admin/products" className="text-sm text-gray-600 hover:underline">
            Back to Products
          </Link>
        </div>
        
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow space-y-6">
          {/* Image Upload Section - Same as Dog Upload */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold border-b pb-2">📸 Product Photos</h2>
            <div>
              <label className="block font-medium mb-1 text-sm text-gray-700">Upload Images</label>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageChange}
                className="w-full p-2 border rounded bg-gray-50"
              />
              <p className="text-xs text-gray-500 mt-1">Select one or more images for the product.</p>
            </div>

            {/* Compression Stats */}
            {Object.keys(compressionStats).length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm font-medium text-blue-800 mb-2">📊 Compression Results:</p>
                {Object.entries(compressionStats).map(([filename, stat]) => (
                  <p key={filename} className="text-xs text-blue-600 font-mono">
                    {filename.substring(0, 20)}...: {stat}
                  </p>
                ))}
              </div>
            )}

            {/* Image Previews */}
            {imagePreviews.length > 0 && (
              <div className="grid grid-cols-4 gap-4 mt-2">
                {imagePreviews.map((preview, idx) => (
                  <div key={idx} className="relative">
                    <div className="relative w-full aspect-square border rounded-lg overflow-hidden bg-gray-100">
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
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center shadow-md hover:bg-red-600 transition-colors"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <hr />

          {/* Basic Info */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block font-medium">Product Name *</label>
              <input 
                type="text" 
                required 
                value={formData.name} 
                onChange={(e) => setFormData({...formData, name: e.target.value})} 
                className="w-full p-2 border rounded" 
                placeholder="e.g. Premium Dog Food"
              />
            </div>
            <div className="space-y-1">
              <label className="block font-medium">Category *</label>
              <select 
                value={formData.category} 
                onChange={(e) => setFormData({...formData, category: e.target.value})} 
                className="w-full p-2 border rounded"
              >
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
            <div className="space-y-1">
              <label className="block font-medium text-sm">Selling Price (₦) *</label>
              <input 
                type="number" 
                required 
                value={formData.price} 
                onChange={(e) => setFormData({...formData, price: e.target.value})} 
                className="w-full p-2 border rounded" 
              />
            </div>
            <div className="space-y-1">
              <label className="block font-medium text-sm">Cost Price (₦)</label>
              <input 
                type="number" 
                value={formData.cost} 
                onChange={(e) => setFormData({...formData, cost: e.target.value})} 
                className="w-full p-2 border rounded" 
              />
            </div>
            <div className="space-y-1">
              <label className="block font-medium text-sm">Compare at Price</label>
              <input 
                type="number" 
                value={formData.compare_price} 
                onChange={(e) => setFormData({...formData, compare_price: e.target.value})} 
                className="w-full p-2 border rounded" 
              />
            </div>
          </div>

          {/* Stock & SKU */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block font-medium text-sm">Stock Quantity</label>
              <input 
                type="number" 
                value={formData.stock} 
                onChange={(e) => setFormData({...formData, stock: e.target.value})} 
                className="w-full p-2 border rounded" 
              />
            </div>
            <div className="space-y-1">
              <label className="block font-medium text-sm">SKU</label>
              <input 
                type="text" 
                value={formData.sku} 
                onChange={(e) => setFormData({...formData, sku: e.target.value})} 
                className="w-full p-2 border rounded" 
                placeholder="Auto-generated if empty" 
              />
            </div>
          </div>

          {/* Weight & Brand */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block font-medium text-sm">Weight</label>
              <input 
                type="text" 
                value={formData.weight} 
                onChange={(e) => setFormData({...formData, weight: e.target.value})} 
                className="w-full p-2 border rounded" 
                placeholder="e.g. 15kg" 
              />
            </div>
            <div className="space-y-1">
              <label className="block font-medium text-sm">Brand</label>
              <input 
                type="text" 
                value={formData.brand} 
                onChange={(e) => setFormData({...formData, brand: e.target.value})} 
                className="w-full p-2 border rounded" 
                placeholder="e.g. Royal Canin" 
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label className="block font-medium">Description</label>
            <textarea 
              value={formData.description} 
              onChange={(e) => setFormData({...formData, description: e.target.value})} 
              rows={4} 
              className="w-full p-2 border rounded" 
              placeholder="Tell customers about the features, materials, and benefits..."
            />
          </div>

          {/* Visibility Checkboxes */}
          <div className="flex gap-6 p-4 bg-blue-50 rounded-lg">
            <label className="flex items-center gap-2 cursor-pointer">
              <input 
                type="checkbox" 
                checked={formData.in_stock} 
                onChange={(e) => setFormData({...formData, in_stock: e.target.checked})} 
                className="w-4 h-4"
              />
              <span className="font-medium text-sm">In Stock</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input 
                type="checkbox" 
                checked={formData.featured} 
                onChange={(e) => setFormData({...formData, featured: e.target.checked})} 
                className="w-4 h-4"
              />
              <span className="font-medium text-sm">Featured Product</span>
            </label>
          </div>

          <button 
            type="submit" 
            disabled={loading || uploading} 
            className="w-full bg-black text-white py-3 rounded-lg font-bold hover:bg-gray-800 transition-colors disabled:opacity-50"
          >
            {loading ? 'Creating Product...' : uploading ? `Uploading ${imageFiles.length} images...` : 'Create Product'}
          </button>
        </form>
      </div>
    </div>
  );
}