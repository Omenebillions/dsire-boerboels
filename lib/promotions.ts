import { supabase } from '@/lib/supabase';

export interface PromotionProductPrice {
  product_id: number;
  override_before_price: number;
  override_after_price: number;
}

export interface ActivePromotion {
  id: number;
  title: string;
  theme_color: string;
  banner_url: string;
  end_time: string;
  products: PromotionProductPrice[];
}

export interface PromotionFormData {
  id?: number;
  title: string;
  theme_color: string;
  banner_url: string;
  end_time: string;
  is_active: boolean;
  products: PromotionProductPrice[];
}

interface PromotionQueryResult {
  id: number;
  title: string;
  theme_color: string | null;
  banner_url: string | null;
  end_time: string;
  promotion_products: Array<{
    product_id: number | string;
    override_before_price: number | string;
    override_after_price: number | string;
  }> | null;
}

export async function getActivePromotion(): Promise<ActivePromotion | null> {
  const { data, error } = await supabase
    .from('promotions')
    .select(
      'id, title, theme_color, banner_url, end_time, promotion_products(product_id, override_before_price, override_after_price)'
    )
    .eq('is_active', true)
    .gt('end_time', new Date().toISOString())
    .maybeSingle();

  if (error) {
    throw new Error(`Unable to load active promotion: ${error.message}`);
  }
  if (!data) return null;

  const promotion = data as unknown as PromotionQueryResult;
  return {
    id: Number(promotion.id),
    title: promotion.title,
    theme_color: promotion.theme_color || '#a31542',
    banner_url: promotion.banner_url || '',
    end_time: promotion.end_time,
    products: (promotion.promotion_products || []).map((product) => ({
      product_id: Number(product.product_id),
      override_before_price: Number(product.override_before_price),
      override_after_price: Number(product.override_after_price),
    })),
  };
}

export function getPromoForProduct(
  promo: ActivePromotion | null,
  productId: number | string
): PromotionProductPrice | null {
  if (!promo) return null;
  return promo.products.find((product) => product.product_id === Number(productId)) || null;
}

export function getPromotionalPrice(
  promo: ActivePromotion | null,
  productId: number | string
): number | null {
  const productPromo = getPromoForProduct(promo, productId);
  return productPromo && productPromo.override_after_price < productPromo.override_before_price
    ? productPromo.override_after_price
    : null;
}
