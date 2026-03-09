// app/admin/products/edit/[id]/page.tsx
"use client";
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Image from 'next/image';

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [product, setProduct] = useState<any>(null);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  useEffect(() => {
    fetchProduct();
  }, []);

  const fetchProduct = async () => {
    const { data } = await supabase
      .from('products')
      .select('*')
      .eq('id', params.id)
      .single();
    
    setProduct(data);
    setLoading(false);
  };

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

  const uploadImages = async (files: File[]): Promise<string[]> => {
    setUploading(true);
    const urls: string[] = [];
    
    for (const file of files) {
      const fileName = `${Date.now()}-${file.name}`;
      const { data } = await supabase.storage
        .from('product-images')
        .upload(`products/${fileName}`, file);
      
      if (data) {
        const { data: { publicUrl } } = supabase.storage
          .from('product-images')
          .getPublicUrl(`products/${fileName}`);
        urls.push(publicUrl);
      }
    }
    
    setUploading(false);
    return urls;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    let images = [...(product.images || [])];
    
    if (imageFiles.length > 0) {
      const newUrls = await uploadImages(imageFiles);
      images = [...newUrls, ...images];
    }

    const { error } = await supabase
      .from('products')
      .update({ ...product, images })
      .eq('id', params.id);

    if (!error) {
      alert('Product updated!');
      router.push('/admin/products');
    }
    setLoading(false);
  };

  if (loading) return <div className="p-8 text-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4">
        <h1 className="text-3xl font-bold mb-6">Edit Product</h1>
        
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow space-y-4">
          {/* Similar form as new page, but with product data */}
          <div>
            <label className="block font-medium mb-1">Product Name</label>
            <input type="text" value={product.name} onChange={(e) => setProduct({...product, name: e.target.value})} className="w-full p-2 border rounded" />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block font-medium mb-1">Price (₦)</label>
              <input type="number" value={product.price} onChange={(e) => setProduct({...product, price: e.target.value})} className="w-full p-2 border rounded" />
            </div>
            <div>
              <label className="block font-medium mb-1">Category</label>
              <select value={product.category} onChange={(e) => setProduct({...product, category: e.target.value})} className="w-full p-2 border rounded">
                <option value="Food">🍖 Food</option>
                <option value="Toys">🧸 Toys</option>
                <option value="Grooming">✂️ Grooming</option>
                <option value="Treats">🦴 Treats</option>
                <option value="Accessories">🪢 Accessories</option>
              </select>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block font-medium mb-1">Stock</label>
              <input type="number" value={product.stock} onChange={(e) => setProduct({...product, stock: e.target.value})} className="w-full p-2 border rounded" />
            </div>
            <div>
              <label className="block font-medium mb-1">In Stock</label>
              <input type="checkbox" checked={product.in_stock} onChange={(e) => setProduct({...product, in_stock: e.target.checked})} className="ml-2" />
            </div>
          </div>

          <div>
            <label className="block font-medium mb-1">Description</label>
            <textarea value={product.description} onChange={(e) => setProduct({...product, description: e.target.value})} rows={4} className="w-full p-2 border rounded" />
          </div>

          {/* Image Upload */}
          <div>
            <label className="block font-medium mb-1">Add More Images</label>
            <input type="file" accept="image/*" multiple onChange={handleImageChange} className="w-full p-2 border rounded" />
          </div>

          {imagePreviews.length > 0 && (
            <div className="grid grid-cols-4 gap-2">
              {imagePreviews.map((preview, idx) => (
                <Image key={idx} src={preview} alt="Preview" width={80} height={80} className="rounded" />
              ))}
            </div>
          )}

          {product.images && product.images.length > 0 && (
            <div>
              <p className="font-medium mb-2">Current Images:</p>
              <div className="grid grid-cols-4 gap-2">
                {product.images.map((img: string, idx: number) => (
                  <Image key={idx} src={img} alt="Product" width={80} height={80} className="rounded" />
                ))}
              </div>
            </div>
          )}

          <button type="submit" disabled={loading || uploading} className="w-full bg-black text-white py-3 rounded-lg">
            {uploading ? 'Uploading...' : 'Update Product'}
          </button>
        </form>
      </div>
    </div>
  );
}