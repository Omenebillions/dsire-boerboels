"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import Image from 'next/image';
import imageCompression from 'browser-image-compression';

interface Variation {
  size: string;
  price: number;
  compare_price: number;
  stock: number;
  sku: string;
  weight: string;
}

export default function NewProductPage() {
  const router = useRouter();
  
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Core states
  const [hasVariations, setHasVariations] = useState(false);
  const [variations, setVariations] = useState<Variation[]>([
    { size: 'Small', price: 0, compare_price: 0, stock: 0, sku: '', weight: '' }
  ]);

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

  // Image states
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [compressionStats, setCompressionStats] = useState<{ [key: string]: string }>({});

  // Auto-update in_stock when variations change
  useEffect(() => {
    if (hasVariations) {
      const anyVariationInStock = variations.some(v => v.stock > 0);
      setFormData(prev => ({ ...prev, in_stock: anyVariationInStock }));
    }
  }, [hasVariations, variations]);

  // Image Handlers
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
    const fileToRemove = imageFiles[index];
    setImageFiles(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));

    if (fileToRemove) {
      const newStats = { ...compressionStats };
      delete newStats[fileToRemove.name];
      setCompressionStats(newStats);
    }
  };

  // Variation Handlers
  const addVariation = () => {
    setVariations(prev => [
      ...prev,
      { size: 'Medium', price: 0, compare_price: 0, stock: 0, sku: '', weight: '' }
    ]);
  };

  const removeVariation = (index: number) => {
    if (variations.length === 1) return; // Prevent removing last variation
    setVariations(prev => prev.filter((_, i) => i !== index));
  };

  const updateVariation = (index: number, field: keyof Variation, value: string | number) => {
    setVariations(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  // Image Compression & Upload
  const compressImage = async (file: File): Promise<File> => {
    const options = {
      maxSizeMB: 1,
      maxWidthOrHeight: 1920,
      useWebWorker: true,
      fileType: 'image/jpeg',
      initialQuality: 0.8,
    };

    try {
      const originalSize = file.size / (1024 * 1024);

      if (file.size < 1024 * 1024) {
        setCompressionStats(prev => ({
          ...prev,
          [file.name]: `⏭️ Skipped (${originalSize.toFixed(2)}MB)`
        }));
        return file;
      }

      const compressedFile = await imageCompression(file, options);
      const compressedSize = compressedFile.size / (1024 * 1024);
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
        [file.name]: `⚠️ Failed, using original`
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
        
        const fileExt = file.name.split('.').pop() || 'jpg';
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
      console.error('Upload error:', error);
      alert(`Image upload failed: ${error.message || 'Unknown error'}`);
    } finally {
      setUploading(false);
    }

    return uploadedUrls;
  };

  // Main Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert("Product name is required");
      return;
    }

    setLoading(true);

    let allImages = [...formData.images];

    if (imageFiles.length > 0) {
      const uploadedUrls = await uploadImages(imageFiles);
      allImages = [...uploadedUrls, ...allImages];
    }

    // Prepare variations (filter invalid ones)
    const validVariations = hasVariations 
      ? variations.filter(v => v.size.trim() && v.price > 0)
      : null;

    const productData = {
      name: formData.name.trim(),
      category: formData.category,
      price: hasVariations ? 0 : (Number(formData.price) || 0),
      cost: formData.cost ? Number(formData.cost) : null,
      compare_price: formData.compare_price ? Number(formData.compare_price) : null,
      description: formData.description.trim() || null,
      stock: hasVariations ? 0 : (Number(formData.stock) || 0),
      in_stock: hasVariations 
        ? variations.some(v => v.stock > 0) 
        : formData.in_stock,
      featured: formData.featured,
      weight: formData.weight.trim() || null,
      brand: formData.brand.trim() || null,
      sku: formData.sku.trim() || `PRD-${Date.now()}`,
      images: allImages,
      variations: validVariations,
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
            ← Back to Products
          </Link>
        </div>

        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow space-y-8">
          
          {/* Image Upload Section */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold border-b pb-2">📸 Product Photos</h2>
            
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageChange}
              className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50"
            />
            <p className="text-xs text-gray-500">You can upload multiple images (max 1MB recommended)</p>

            {Object.keys(compressionStats).length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
                <p className="font-medium text-blue-800 mb-1">Compression Results:</p>
                {Object.entries(compressionStats).map(([name, stat]) => (
                  <p key={name} className="text-xs font-mono text-blue-700">
                    {name.substring(0, 25)}... : {stat}
                  </p>
                ))}
              </div>
            )}

            {imagePreviews.length > 0 && (
              <div className="grid grid-cols-4 gap-4">
                {imagePreviews.map((preview, idx) => (
                  <div key={idx} className="relative group">
                    <div className="relative aspect-square border rounded-xl overflow-hidden bg-gray-100">
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
                      className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white w-7 h-7 rounded-full flex items-center justify-center shadow transition-all"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <hr className="my-6" />

          {/* Basic Information */}
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-1">Product Name <span className="text-red-500">*</span></label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-black"
                placeholder="Premium Dog Food"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Category <span className="text-red-500">*</span></label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full p-3 border rounded-lg"
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

          {/* Variations Toggle */}
          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
            <input
              type="checkbox"
              id="hasVariations"
              checked={hasVariations}
              onChange={(e) => {
                setHasVariations(e.target.checked);
                if (!e.target.checked) {
                  setVariations([{ size: 'Small', price: 0, compare_price: 0, stock: 0, sku: '', weight: '' }]);
                }
              }}
              className="w-5 h-5 accent-black"
            />
            <label htmlFor="hasVariations" className="font-medium cursor-pointer">
              This product has size/color variations
            </label>
          </div>

          {/* Simple Product Pricing */}
          {!hasVariations && (
            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium mb-1">Selling Price (₦) <span className="text-red-500">*</span></label>
                <input
                  type="number"
                  required
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className="w-full p-3 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Cost Price (₦)</label>
                <input
                  type="number"
                  value={formData.cost}
                  onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                  className="w-full p-3 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Compare at Price</label>
                <input
                  type="number"
                  value={formData.compare_price}
                  onChange={(e) => setFormData({ ...formData, compare_price: e.target.value })}
                  className="w-full p-3 border rounded-lg"
                />
              </div>
            </div>
          )}

          {/* Variations Section */}
          {hasVariations && (
            <div className="border border-gray-200 rounded-xl p-6 bg-gray-50 space-y-6">
              <div>
                <h3 className="font-semibold text-lg">Size Variations</h3>
                <p className="text-sm text-gray-600">Add different sizes with their own price and stock</p>
              </div>

              {variations.map((variation, index) => (
                <div key={index} className="bg-white border rounded-xl p-5 space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="font-medium">Variation {index + 1}</h4>
                    {variations.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeVariation(index)}
                        className="text-red-600 hover:text-red-700 text-sm"
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div>
                      <label className="text-xs font-medium block mb-1">Size</label>
                      <select
                        value={variation.size}
                        onChange={(e) => updateVariation(index, 'size', e.target.value)}
                        className="w-full p-2.5 border rounded-lg text-sm"
                      >
                        <option value="Small">Small</option>
                        <option value="Medium">Medium</option>
                        <option value="Large">Large</option>
                        <option value="X-Large">X-Large</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-medium block mb-1">Price (₦)</label>
                      <input
                        type="number"
                        value={variation.price}
                        onChange={(e) => updateVariation(index, 'price', Number(e.target.value))}
                        className="w-full p-2.5 border rounded-lg text-sm"
                        placeholder="0"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-medium block mb-1">Stock</label>
                      <input
                        type="number"
                        value={variation.stock}
                        onChange={(e) => updateVariation(index, 'stock', Number(e.target.value))}
                        className="w-full p-2.5 border rounded-lg text-sm"
                        placeholder="0"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-medium block mb-1">SKU</label>
                      <input
                        type="text"
                        value={variation.sku}
                        onChange={(e) => updateVariation(index, 'sku', e.target.value)}
                        className="w-full p-2.5 border rounded-lg text-sm"
                        placeholder="Optional"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-medium block mb-1">Weight</label>
                      <input
                        type="text"
                        value={variation.weight}
                        onChange={(e) => updateVariation(index, 'weight', e.target.value)}
                        className="w-full p-2.5 border rounded-lg text-sm"
                        placeholder="e.g. 2kg"
                      />
                    </div>
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={addVariation}
                className="text-blue-600 hover:text-blue-700 font-medium text-sm flex items-center gap-1"
              >
                + Add Another Variation
              </button>
            </div>
          )}

          {/* Common Fields */}
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-1">SKU</label>
              <input
                type="text"
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                className="w-full p-3 border rounded-lg"
                placeholder="Auto-generated if empty"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Brand</label>
              <input
                type="text"
                value={formData.brand}
                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                className="w-full p-3 border rounded-lg"
                placeholder="e.g. Royal Canin"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={5}
              className="w-full p-3 border rounded-lg resize-y"
              placeholder="Describe the product, features, benefits..."
            />
          </div>

          {/* Status */}
          <div className="flex flex-wrap gap-8 p-5 bg-blue-50 rounded-xl">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.in_stock}
                onChange={(e) => setFormData({ ...formData, in_stock: e.target.checked })}
                className="w-5 h-5 accent-black"
                disabled={hasVariations}
              />
              <span className="font-medium">In Stock</span>
              {hasVariations && <span className="text-xs text-gray-500">(Auto-managed)</span>}
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.featured}
                onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                className="w-5 h-5 accent-black"
              />
              <span className="font-medium">Featured Product</span>
            </label>
          </div>

          <button
            type="submit"
            disabled={loading || uploading || !formData.name.trim()}
            className="w-full bg-black hover:bg-gray-900 disabled:bg-gray-400 text-white py-4 rounded-xl font-semibold transition-all"
          >
            {loading ? 'Creating Product...' : 
             uploading ? `Uploading Images...` : 
             'Create Product'}
          </button>
        </form>
      </div>
    </div>
  );
}