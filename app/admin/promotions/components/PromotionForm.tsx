'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import imageCompression from 'browser-image-compression';
import { supabase } from '@/lib/supabase';
import type { PromotionFormData } from '@/lib/promotions';
import { savePromotion } from '../actions';

interface AdminProduct {
  id: number;
  name: string;
  price: number;
}

interface FormProduct {
  product_id: number;
  override_before_price: string;
  override_after_price: string;
}

interface PromotionFormProps {
  initialData?: PromotionFormData;
}

function toLocalDateTime(value?: string): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return localDate.toISOString().slice(0, 16);
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'An unexpected error occurred.';
}

export default function PromotionForm({ initialData }: PromotionFormProps) {
  const router = useRouter();
  const [title, setTitle] = useState(initialData?.title || '');
  const [themeColor, setThemeColor] = useState(initialData?.theme_color || '#a31542');
  const [bannerUrl, setBannerUrl] = useState(initialData?.banner_url || '');
  const [endTime, setEndTime] = useState(toLocalDateTime(initialData?.end_time));
  const [isActive, setIsActive] = useState(initialData?.is_active || false);
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<FormProduct[]>(
    (initialData?.products || []).map((product) => ({
      product_id: product.product_id,
      override_before_price: String(product.override_before_price),
      override_after_price: String(product.override_after_price),
    }))
  );
  const [search, setSearch] = useState('');
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadProducts = async () => {
      setLoadingProducts(true);
      const { data, error: productsError } = await supabase
        .from('products')
        .select('id, name, price')
        .order('name');

      if (productsError) {
        setError(`Unable to load products: ${productsError.message}`);
      } else {
        setProducts(
          (data || []).map((product) => ({
            id: Number(product.id),
            name: product.name,
            price: Number(product.price),
          }))
        );
      }
      setLoadingProducts(false);
    };

    void loadProducts();
  }, []);

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();
    return query
      ? products.filter((product) => product.name.toLowerCase().includes(query))
      : products;
  }, [products, search]);

  const toggleProduct = (product: AdminProduct, checked: boolean) => {
    setSelectedProducts((current) =>
      checked
        ? [
            ...current,
            {
              product_id: product.id,
              override_before_price: String(product.price),
              override_after_price: '',
            },
          ]
        : current.filter((selected) => selected.product_id !== product.id)
    );
  };

  const updateProductPrice = (
    productId: number,
    field: 'override_before_price' | 'override_after_price',
    value: string
  ) => {
    setSelectedProducts((current) =>
      current.map((product) =>
        product.product_id === productId ? { ...product, [field]: value } : product
      )
    );
  };

  const uploadBanner = async (file: File) => {
    setError('');
    setUploading(true);
    try {
      const compressedFile = file.size < 1024 * 1024
        ? file
        : await imageCompression(file, {
            maxSizeMB: 1,
            maxWidthOrHeight: 1920,
            useWebWorker: true,
            fileType: 'image/jpeg',
            initialQuality: 0.8,
          });
      const fileExt = compressedFile.type === 'image/jpeg'
        ? 'jpg'
        : compressedFile.name.split('.').pop() || 'img';
      const filePath = `banners/${Date.now()}-${crypto.randomUUID()}.${fileExt}`;
      const { data: authData, error: authError } =
  await supabase.auth.getUser();

console.log('SUPABASE AUTH CHECK:', {
  authenticated: !!authData.user,
  userId: authData.user?.id,
  authError: authError?.message,
});
      const { error: uploadError } = await supabase.storage
        .from('promotion-banners')
        .upload(filePath, compressedFile);

      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage
        .from('promotion-banners')
        .getPublicUrl(filePath);
      setBannerUrl(publicUrl);
    } catch (uploadError) {
      setError(`Banner upload failed: ${errorMessage(uploadError)}`);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');

    if (!endTime || Number.isNaN(new Date(endTime).getTime())) {
      setError('Choose a valid end date and time.');
      return;
    }
    if (isActive && new Date(endTime).getTime() <= Date.now()) {
      setError('An active promotion must end in the future.');
      return;
    }
    if (selectedProducts.some((product) => !product.override_after_price.trim())) {
      setError('Enter an after price for every selected product.');
      return;
    }

    setSaving(true);
    try {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      const accessToken = sessionData.session?.access_token;
      if (!accessToken) throw new Error('Your admin session has expired. Sign in again.');

      const input: PromotionFormData = {
        ...(initialData?.id ? { id: initialData.id } : {}),
        title,
        theme_color: themeColor,
        banner_url: bannerUrl,
        end_time: new Date(endTime).toISOString(),
        is_active: isActive,
        products: selectedProducts.map((product) => ({
          product_id: product.product_id,
          override_before_price: Number(product.override_before_price),
          override_after_price: Number(product.override_after_price),
        })),
      };

      const result = await savePromotion(input, accessToken);
      if (!result.success) throw new Error(result.error || 'Unable to save the promotion.');
      router.push('/admin/promotions');
      router.refresh();
    } catch (submitError) {
      setError(errorMessage(submitError));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 rounded-lg bg-white p-5 shadow-sm sm:p-8">
      {error && (
        <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <div>
        <label htmlFor="promotion-title" className="mb-1 block text-sm font-medium">Title</label>
        <input
          id="promotion-title"
          required
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          className="w-full rounded-lg border px-3 py-2"
          placeholder="Black Friday Paw Fest"
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="promotion-color" className="mb-1 block text-sm font-medium">Theme color</label>
          <div className="flex items-center gap-3">
            <input
              id="promotion-color"
              type="color"
              value={themeColor}
              onChange={(event) => setThemeColor(event.target.value)}
              className="h-10 w-14 cursor-pointer rounded border p-1"
            />
            <span className="text-sm text-gray-600">{themeColor}</span>
          </div>
        </div>

        <div>
          <label htmlFor="promotion-end-time" className="mb-1 block text-sm font-medium">End date/time</label>
          <input
            id="promotion-end-time"
            type="datetime-local"
            required
            value={endTime}
            onChange={(event) => setEndTime(event.target.value)}
            className="w-full rounded-lg border px-3 py-2"
          />
        </div>
      </div>

      <div>
        <label htmlFor="promotion-banner" className="mb-1 block text-sm font-medium">Banner image</label>
        <input
          id="promotion-banner"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void uploadBanner(file);
          }}
          className="block w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-gray-100 file:px-4 file:py-2"
        />
        {uploading && <p className="mt-2 text-sm text-gray-500">Uploading banner...</p>}
        {bannerUrl && (
          <div className="mt-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={bannerUrl} alt="Promotion banner preview" className="max-h-48 rounded-lg object-cover" />
          </div>
        )}
      </div>

      <label className="flex items-center gap-3">
        <input
          type="checkbox"
          checked={isActive}
          onChange={(event) => setIsActive(event.target.checked)}
          className="h-4 w-4 accent-blue-600"
        />
        <span className="text-sm font-medium">Activate this promotion</span>
      </label>

      <section>
        <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold">Promotion products</h2>
            <p className="text-sm text-gray-500">Select products and set custom before/after prices.</p>
          </div>
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search products..."
            aria-label="Search products"
            className="rounded-lg border px-3 py-2 sm:w-64"
          />
        </div>

        {loadingProducts ? (
          <p className="py-4 text-sm text-gray-500">Loading products...</p>
        ) : filteredProducts.length === 0 ? (
          <p className="py-4 text-sm text-gray-500">No products found.</p>
        ) : (
          <div className="max-h-[32rem] space-y-3 overflow-y-auto rounded-lg border p-3">
            {filteredProducts.map((product) => {
              const selected = selectedProducts.find((item) => item.product_id === product.id);
              const beforePrice = Number(selected?.override_before_price || 0);
              const afterPrice = Number(selected?.override_after_price || 0);
              const discount = beforePrice > afterPrice && beforePrice > 0
                ? Math.round(((beforePrice - afterPrice) / beforePrice) * 100)
                : 0;

              return (
                <div key={product.id} className="rounded-lg border p-3">
                  <label className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={Boolean(selected)}
                      onChange={(event) => toggleProduct(product, event.target.checked)}
                      className="mt-1 h-4 w-4 accent-blue-600"
                    />
                    <span className="font-medium">{product.name}</span>
                  </label>
                  <p className="ml-7 mt-1 text-xs text-gray-500">
                    Current: ₦{product.price.toLocaleString()}
                  </p>

                  {selected && (
                    <div className="ml-7 mt-3 grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
                      <label className="text-sm">
                        <span className="mb-1 block">Before Price</span>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          required
                          value={selected.override_before_price}
                          onChange={(event) =>
                            updateProductPrice(product.id, 'override_before_price', event.target.value)
                          }
                          className="w-full rounded-lg border px-3 py-2"
                        />
                      </label>
                      <label className="text-sm">
                        <span className="mb-1 block">After Price</span>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          required
                          value={selected.override_after_price}
                          onChange={(event) =>
                            updateProductPrice(product.id, 'override_after_price', event.target.value)
                          }
                          className="w-full rounded-lg border px-3 py-2"
                        />
                      </label>
                      <p className="pb-2 text-sm font-semibold text-green-700">
                        {discount > 0 ? `-${discount}%` : 'No discount'}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      <div className="flex flex-wrap gap-3 border-t pt-5">
        <button
          type="submit"
          disabled={saving || uploading || loadingProducts}
          className="rounded-lg bg-blue-600 px-5 py-2.5 font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? 'Saving...' : initialData ? 'Save Promotion' : 'Create Promotion'}
        </button>
        <button
          type="button"
          onClick={() => router.push('/admin/promotions')}
          className="rounded-lg border px-5 py-2.5 font-semibold text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
