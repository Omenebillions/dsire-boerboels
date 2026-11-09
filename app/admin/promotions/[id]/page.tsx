'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import PromotionForm from '@/app/admin/promotions/components/PromotionForm';
import { supabase } from '@/lib/supabase';
import type { PromotionFormData } from '@/lib/promotions';

interface PromotionRow {
  id: number;
  title: string;
  theme_color: string | null;
  banner_url: string | null;
  end_time: string;
  is_active: boolean | null;
}

interface PromotionProductRow {
  product_id: number | string;
  override_before_price: number | string;
  override_after_price: number | string;
}

export default function EditPromotionPage() {
  const params = useParams<{ id: string }>();
  const promotionId = Number(params.id);
  const [promotion, setPromotion] = useState<PromotionFormData | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadPromotion = async () => {
      if (!Number.isInteger(promotionId) || promotionId <= 0) {
        setError('Invalid promotion ID.');
        return;
      }

      const { data, error: promotionError } = await supabase
        .from('promotions')
        .select('id, title, theme_color, banner_url, end_time, is_active')
        .eq('id', promotionId)
        .single();

      if (promotionError || !data) {
        setError(`Unable to load promotion: ${promotionError?.message || 'Promotion not found.'}`);
        return;
      }

      const { data: productData, error: productsError } = await supabase
        .from('promotion_products')
        .select('product_id, override_before_price, override_after_price')
        .eq('promotion_id', promotionId);

      if (productsError) {
        setError(`Unable to load promotion products: ${productsError.message}`);
        return;
      }

      const row = data as unknown as PromotionRow;
      const productRows = (productData || []) as unknown as PromotionProductRow[];
      setPromotion({
        id: Number(row.id),
        title: row.title,
        theme_color: row.theme_color || '#a31542',
        banner_url: row.banner_url || '',
        end_time: row.end_time,
        is_active: row.is_active === true,
        products: productRows.map((product) => ({
          product_id: Number(product.product_id),
          override_before_price: Number(product.override_before_price),
          override_after_price: Number(product.override_after_price),
        })),
      });
    };

    void loadPromotion();
  }, [promotionId]);

  return (
    <div className="mx-auto max-w-4xl px-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold sm:text-3xl">Edit Promotion</h1>
        <p className="mt-1 text-sm text-gray-600">Update the promotion details and product prices.</p>
      </div>
      {error ? (
        <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">{error}</p>
      ) : promotion ? (
        <PromotionForm initialData={promotion} />
      ) : (
        <p className="animate-pulse text-gray-600">Loading promotion...</p>
      )}
    </div>
  );
}
