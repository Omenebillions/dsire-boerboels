// app/admin/products/edit/[id]/page.tsx
"use client";
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Image from 'next/image';
import Link from 'next/link';

interface Variation {
  size: string;
  price: number;
  compare_price: number;
  stock: number;
  sku: string;
  weight: string;
}

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [product, setProduct] = useState<any>(null);
  const [hasVariations, setHasVariations] = useState(false);
  const [variations, setVariations] = useState<Variation[]>([]);
  
  // Image state
  const [newImageFiles, setNewImageFiles] = useState<File[]>([]);
  const [newImagePreviews, setNewImagePreviews] = useState<string[]>([]);

  useEffect(() => {
    fetchProduct();
  }, []);

  const fetchProduct = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('products')
      .select('*')
      .eq('id', params.id)
      .single();
    
    if (data) {
      setProduct(data);
      if (data.variations && data.variations.length > 0) {
        setHasVariations(true);
        setVariations(data.variations);
      }
    }
    setLoading(false);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewImagePreviews(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
    setNewImageFiles(prev => [...prev, ...files]);
  };

  const removeNewImage = (index: number) => {
    setNewImageFiles(prev => prev.filter((_, i) => i !== index));
    setNewImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const removeExistingImage = (imageUrl: string) => {
    if (!product) return;
    const updatedImages = product.images.filter((img: string) => img !== imageUrl);
    setProduct({ ...product, images: updatedImages });
  };

  const uploadImages = async (files: File[]): Promise<string[]> => {
    setUploading(true);
    const urls: string[] = [];
    
    for (const file of files) {
      const fileExt = file.name.split('.').pop();
      const baseName = file.name.split('.').slice(0, -1).join('');
      const sanitizedName = baseName.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 50);
      const fileName = `${Date.now()}-${sanitizedName}.${fileExt}`;
      const filePath = `products/${fileName}`;
      
      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, file);
      
      if (uploadError) throw uploadError;
      
      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);
      
      urls.push(publicUrl);
    }
    
    setUploading(false);
    return urls;
  };

  // Variation handlers
  const addVariation = () => {
    const existingSizes = variations.map(v => v.size);
    let newSize = 'Medium';
    if (!existingSizes.includes('Small')) newSize = 'Small';
    else if (!existingSizes.includes('Medium')) newSize = 'Medium';
    else if (!existingSizes.includes('Large')) newSize = 'Large';
    else newSize = 'X-Large';
    
    setVariations([
      ...variations,
      { size: newSize, price: 0, compare_price: 0, stock: 0, sku: '', weight: '' }
    ]);
  };

  const removeVariation = (index: number) => {
    if (variations.length === 1) {
      alert("At least one variation is required");
      return;
    }
    setVariations(variations.filter((_, i) => i !== index));
  };

  const updateVariation = (index: number, field: keyof Variation, value: string | number) => {
    const updated = [...variations];
    updated[index] = { ...updated[index], [field]: value };
    setVariations(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) return;
    setSaving(true);

    try {
      let allImages = [...(product.images || [])];
      
      // Upload new images
      if (newImageFiles.length > 0) {
        const uploadedUrls = await uploadImages(newImageFiles);
        allImages = [...uploadedUrls, ...allImages];
      }

      // Process variations
      let variationsData = null;
      if (hasVariations) {
        const validVariations = variations.filter(v => v.price > 0 && v.size.trim());
        if (validVariations.length === 0) {
          alert("Please add at least one valid variation with a price.");
          setSaving(false);
          return;
        }
        variationsData = validVariations;
      }

      // Calculate min price for "starting at" display
      const minPrice = hasVariations && variationsData 
        ? Math.min(...variationsData.map(v => v.price))
        : product.price;

      const updateData = {
        name: product.name,
        category: product.category,
        price: minPrice,
        cost: product.cost || null,
        compare_price: product.compare_price || null,
        description: product.description || null,
        stock: hasVariations ? 0 : (product.stock || 0),
        in_stock: hasVariations ? true : product.in_stock,
        featured: product.featured || false,
        weight: product.weight || null,
        brand: product.brand || null,
        sku: product.sku || null,
        images: allImages,
        variations: variationsData,
      };

      const { error } = await supabase
        .from('products')
        .update(updateData)
        .eq('id', params.id);

      if (error) throw error;

      alert('Product updated successfully!');
      router.push('/admin/products');

    } catch (error: any) {
      console.error('Error:', error);
      alert('Error updating product: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const minVariationPrice = hasVariations && variations.length > 0 
    ? Math.min(...variations.map(v => v.price || 0))
    : (product?.price || 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-pulse text-center">
          <div className="w-16 h-16 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-500">Loading product...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-2xl font-bold text-red-600">Product not found</h1>
          <Link href="/admin/products" className="text-blue-600 mt-4 inline-block">
            ← Back to Products
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Edit Product: {product.name}</h1>
          <Link href="/admin/products" className="text-sm text-gray-600 hover:underline">
            Back to Products
          </Link>
        </div>
        
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow space-y-6">
          {/* Image Section */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold border-b pb-2">📸 Product Photos</h2>
            
            {/* Existing Images */}
            {product.images && product.images.length > 0 && (
              <div>
                <p className="text-sm font-medium mb-2">Existing Images:</p>
                <div className="grid grid-cols-4 gap-2">
                  {product.images.map((img: string, idx: number) => (
                    <div key={idx} className="relative group">
                      <div className="relative w-24 h-24 border rounded overflow-hidden bg-gray-100">
                        <Image src={img} alt={`Product ${idx}`} fill className="object-cover" />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeExistingImage(img)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Add New Images */}
            <div>
              <label className="block font-medium mb-1">Add New Images</label>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageChange}
                className="w-full p-2 border rounded bg-gray-50"
              />
              <p className="text-xs text-gray-500 mt-1">Select one or more images to add to the product.</p>
            </div>

            {/* New Image Previews */}
            {newImagePreviews.length > 0 && (
              <div className="grid grid-cols-4 gap-2">
                {newImagePreviews.map((preview, idx) => (
                  <div key={idx} className="relative">
                    <div className="relative w-24 h-24 border rounded overflow-hidden bg-gray-100">
                      <Image src={preview} alt={`Preview ${idx + 1}`} fill className="object-cover" />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeNewImage(idx)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
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
            <div>
              <label className="block font-medium mb-1">Product Name *</label>
              <input 
                type="text" 
                required 
                value={product.name || ''} 
                onChange={(e) => setProduct({...product, name: e.target.value})} 
                className="w-full p-2 border rounded" 
              />
            </div>
            <div>
              <label className="block font-medium mb-1">Category *</label>
              <select 
                value={product.category || 'Food'} 
                onChange={(e) => setProduct({...product, category: e.target.value})} 
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

          {/* Has Variations Toggle */}
          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
            <input
              type="checkbox"
              id="hasVariations"
              checked={hasVariations}
              onChange={(e) => {
                setHasVariations(e.target.checked);
                if (e.target.checked && variations.length === 0) {
                  setVariations([
                    { 
                      size: 'Small', 
                      price: product.price || 0, 
                      compare_price: 0, 
                      stock: product.stock || 0, 
                      sku: '', 
                      weight: '' 
                    }
                  ]);
                }
              }}
              className="w-4 h-4"
            />
            <label htmlFor="hasVariations" className="font-medium cursor-pointer">
              📦 This product has size variations (Small, Medium, Large)
            </label>
          </div>

          {/* Simple Pricing (no variations) */}
          {!hasVariations && (
            <div className="transition-all duration-300">
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="block font-medium text-sm mb-1">Selling Price (₦) *</label>
                  <input 
                    type="number" 
                    required 
                    value={product.price || ''} 
                    onChange={(e) => setProduct({...product, price: Number(e.target.value)})} 
                    className="w-full p-2 border rounded" 
                  />
                </div>
                <div>
                  <label className="block font-medium text-sm mb-1">Cost Price (₦)</label>
                  <input 
                    type="number" 
                    value={product.cost || ''} 
                    onChange={(e) => setProduct({...product, cost: Number(e.target.value)})} 
                    className="w-full p-2 border rounded" 
                  />
                </div>
                <div>
                  <label className="block font-medium text-sm mb-1">Compare at Price</label>
                  <input 
                    type="number" 
                    value={product.compare_price || ''} 
                    onChange={(e) => setProduct({...product, compare_price: Number(e.target.value)})} 
                    className="w-full p-2 border rounded" 
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block font-medium text-sm mb-1">Stock Quantity</label>
                  <input 
                    type="number" 
                    value={product.stock || 0} 
                    onChange={(e) => setProduct({...product, stock: Number(e.target.value)})} 
                    className="w-full p-2 border rounded" 
                  />
                </div>
                <div>
                  <label className="block font-medium text-sm mb-1">Weight</label>
                  <input 
                    type="text" 
                    value={product.weight || ''} 
                    onChange={(e) => setProduct({...product, weight: e.target.value})} 
                    className="w-full p-2 border rounded" 
                    placeholder="e.g. 15kg" 
                  />
                </div>
              </div>
            </div>
          )}

          {/* Size Variations Section */}
          {hasVariations && (
            <div className="space-y-4 border border-gray-200 rounded-lg p-4 bg-gray-50 transition-all duration-300">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-lg">📏 Size Variations</h3>
                <p className="text-xs text-green-600 font-medium">
                  Starting from: ₦{minVariationPrice.toLocaleString()}
                </p>
              </div>
              <p className="text-xs text-gray-500">Define pricing and stock for each size option</p>
              
              {variations.map((variation, index) => (
                <div key={index} className="border rounded-lg p-4 bg-white">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="font-medium">Variation {index + 1}</h4>
                    <button
                      type="button"
                      onClick={() => removeVariation(index)}
                      className="text-red-500 text-sm hover:text-red-700"
                    >
                      Remove
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-medium mb-1">Size *</label>
                      <select
                        value={variation.size}
                        onChange={(e) => updateVariation(index, 'size', e.target.value)}
                        className="w-full p-2 border rounded text-sm"
                      >
                        <option value="Small">Small</option>
                        <option value="Medium">Medium</option>
                        <option value="Large">Large</option>
                        <option value="X-Large">X-Large</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1">Price (₦) *</label>
                      <input
                        type="number"
                        value={variation.price}
                        onChange={(e) => updateVariation(index, 'price', Number(e.target.value))}
                        className="w-full p-2 border rounded text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1">Stock *</label>
                      <input
                        type="number"
                        value={variation.stock}
                        onChange={(e) => updateVariation(index, 'stock', Number(e.target.value))}
                        className="w-full p-2 border rounded text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1">SKU</label>
                      <input
                        type="text"
                        value={variation.sku}
                        onChange={(e) => updateVariation(index, 'sku', e.target.value)}
                        className="w-full p-2 border rounded text-sm"
                        placeholder="Optional"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1">Weight</label>
                      <input
                        type="text"
                        value={variation.weight}
                        onChange={(e) => updateVariation(index, 'weight', e.target.value)}
                        className="w-full p-2 border rounded text-sm"
                        placeholder="e.g. 2kg"
                      />
                    </div>
                  </div>
                </div>
              ))}
              
              <button
                type="button"
                onClick={addVariation}
                className="mt-2 text-blue-600 text-sm font-medium hover:text-blue-800"
              >
                + Add Another Size
              </button>
            </div>
          )}

          {/* SKU & Brand */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block font-medium text-sm mb-1">SKU</label>
              <input 
                type="text" 
                value={product.sku || ''} 
                onChange={(e) => setProduct({...product, sku: e.target.value})} 
                className="w-full p-2 border rounded" 
                placeholder="Auto-generated if empty" 
              />
            </div>
            <div>
              <label className="block font-medium text-sm mb-1">Brand</label>
              <input 
                type="text" 
                value={product.brand || ''} 
                onChange={(e) => setProduct({...product, brand: e.target.value})} 
                className="w-full p-2 border rounded" 
                placeholder="e.g. Royal Canin" 
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block font-medium mb-1">Description</label>
            <textarea 
              value={product.description || ''} 
              onChange={(e) => setProduct({...product, description: e.target.value})} 
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
                checked={product.in_stock} 
                onChange={(e) => setProduct({...product, in_stock: e.target.checked})} 
                className="w-4 h-4"
                disabled={hasVariations}
              />
              <span className="font-medium text-sm">In Stock</span>
              {hasVariations && <span className="text-xs text-gray-500">(Auto-managed by variations)</span>}
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input 
                type="checkbox" 
                checked={product.featured || false} 
                onChange={(e) => setProduct({...product, featured: e.target.checked})} 
                className="w-4 h-4"
              />
              <span className="font-medium text-sm">Featured Product</span>
            </label>
          </div>

          <div className="flex gap-3">
            <button 
              type="submit" 
              disabled={saving || uploading} 
              className="flex-1 bg-black text-white py-3 rounded-lg font-bold hover:bg-gray-800 transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving...' : uploading ? `Uploading ${newImageFiles.length} images...` : 'Save Changes'}
            </button>
            <Link
              href="/admin/products"
              className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-center"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}