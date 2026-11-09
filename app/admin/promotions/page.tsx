'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { deletePromotion, togglePromotion } from './actions';

interface PromotionRow {
  id: number;
  title: string;
  is_active: boolean | null;
  end_time: string;
  created_at: string;
}

interface PromotionProductRow {
  promotion_id: number | string;
}

interface PromotionListItem extends Omit<PromotionRow, 'is_active'> {
  is_active: boolean;
  productCount: number;
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'An unexpected error occurred.';
}

export default function PromotionsPage() {
  const [promotions, setPromotions] = useState<PromotionListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [error, setError] = useState('');

  const loadPromotions = useCallback(async () => {
    setLoading(true);
    setError('');
    const [{ data: promotionData, error: promotionError }, { data: productData, error: productsError }] =
      await Promise.all([
        supabase
          .from('promotions')
          .select('id, title, is_active, end_time, created_at')
          .order('created_at', { ascending: false }),
        supabase.from('promotion_products').select('promotion_id'),
      ]);

    if (promotionError || productsError) {
      setError(`Unable to load promotions: ${promotionError?.message || productsError?.message}`);
      setLoading(false);
      return;
    }

    const rows = (promotionData || []) as unknown as PromotionRow[];
    const productRows = (productData || []) as unknown as PromotionProductRow[];
    const counts = new Map<number, number>();
    for (const product of productRows) {
      const id = Number(product.promotion_id);
      counts.set(id, (counts.get(id) || 0) + 1);
    }

    setPromotions(rows.map((promotion) => ({
      ...promotion,
      id: Number(promotion.id),
      is_active: promotion.is_active === true,
      productCount: counts.get(Number(promotion.id)) || 0,
    })));
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadPromotions();
  }, [loadPromotions]);

  const getAccessToken = async (): Promise<string> => {
    const { data, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) throw sessionError;
    if (!data.session?.access_token) throw new Error('Your admin session has expired. Sign in again.');
    return data.session.access_token;
  };

  const handleToggle = async (promotion: PromotionListItem) => {
    setBusyId(promotion.id);
    setError('');
    try {
      const result = await togglePromotion(
        promotion.id,
        !promotion.is_active,
        await getAccessToken()
      );
      if (!result.success) throw new Error(result.error || 'Unable to update promotion.');
      await loadPromotions();
    } catch (toggleError) {
      setError(getErrorMessage(toggleError));
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (promotion: PromotionListItem) => {
    if (!window.confirm(`Delete "${promotion.title}"? This will remove its product prices.`)) return;
    setBusyId(promotion.id);
    setError('');
    try {
      const result = await deletePromotion(promotion.id, await getAccessToken());
      if (!result.success) throw new Error(result.error || 'Unable to delete promotion.');
      await loadPromotions();
    } catch (deleteError) {
      setError(getErrorMessage(deleteError));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4">
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">Promotions</h1>
          <p className="mt-1 text-sm text-gray-600">Manage pawshop sales and flash promotions.</p>
        </div>
        <Link
          href="/admin/promotions/new"
          className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-5 py-2.5 font-semibold text-white hover:bg-blue-700"
        >
          New Promotion
        </Link>
      </div>

      {error && (
        <p role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      )}

      {loading ? (
        <p className="animate-pulse rounded-lg bg-white p-6 text-gray-600">Loading promotions...</p>
      ) : promotions.length === 0 ? (
        <div className="rounded-lg bg-white p-8 text-center text-gray-600 shadow-sm">
          No promotions yet. Create one to start a sale.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg bg-white shadow-sm">
          <table className="min-w-full divide-y divide-gray-200 text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th scope="col" className="px-4 py-3">Title</th>
                <th scope="col" className="px-4 py-3">Status</th>
                <th scope="col" className="px-4 py-3">Products</th>
                <th scope="col" className="px-4 py-3">End time</th>
                <th scope="col" className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {promotions.map((promotion) => {
                const expired = Date.parse(promotion.end_time) <= Date.now();
                const status = promotion.is_active && !expired
                  ? 'Active'
                  : expired
                    ? 'Expired'
                    : 'Inactive';
                return (
                  <tr key={promotion.id}>
                    <td className="whitespace-nowrap px-4 py-4 font-medium text-gray-900">{promotion.title}</td>
                    <td className="px-4 py-4">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                        status === 'Active'
                          ? 'bg-green-100 text-green-800'
                          : status === 'Expired'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-gray-100 text-gray-700'
                      }`}>
                        {status}
                      </span>
                    </td>
                    <td className="px-4 py-4">{promotion.productCount}</td>
                    <td className="whitespace-nowrap px-4 py-4">
                      {new Date(promotion.end_time).toLocaleString()}
                    </td>
                    <td className="whitespace-nowrap px-4 py-4">
                      <div className="flex items-center gap-3">
                        <label className="inline-flex items-center gap-2 text-xs">
                          <input
                            type="checkbox"
                            checked={promotion.is_active}
                            disabled={busyId === promotion.id || (expired && !promotion.is_active)}
                            onChange={() => void handleToggle(promotion)}
                            aria-label={`${promotion.is_active ? 'Deactivate' : 'Activate'} ${promotion.title}`}
                            className="h-4 w-4 accent-green-600"
                          />
                          Active
                        </label>
                        <Link
                          href={`/admin/promotions/${promotion.id}`}
                          className="font-medium text-blue-600 hover:underline"
                        >
                          Edit
                        </Link>
                        <button
                          type="button"
                          disabled={busyId === promotion.id}
                          onClick={() => void handleDelete(promotion)}
                          className="font-medium text-red-600 hover:underline disabled:opacity-50"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
