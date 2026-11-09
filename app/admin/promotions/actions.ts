'use server';

import { revalidatePath } from 'next/cache';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import type { PromotionFormData } from '@/lib/promotions';

interface ActionResult {
  success: boolean;
  id?: number;
  error?: string;
}

async function authorizeAdmin(accessToken: string): Promise<string | null> {
  if (!accessToken) return 'You must be signed in as an admin.';

  const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(accessToken);
  if (userError || !userData.user) return 'Your admin session is invalid or expired.';

  const { data: role, error: roleError } = await supabaseAdmin
    .from('admin_roles')
    .select('user_id')
    .eq('user_id', userData.user.id)
    .maybeSingle();

  if (roleError) return `Unable to verify admin permissions: ${roleError.message}`;
  if (!role) return 'Only admins can manage promotions.';
  return null;
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'An unexpected error occurred.';
}

function validatePromotion(data: PromotionFormData): string | null {
  if (!data || typeof data !== 'object') return 'Invalid promotion data.';
  if (
    typeof data.title !== 'string' ||
    typeof data.theme_color !== 'string' ||
    typeof data.banner_url !== 'string' ||
    typeof data.end_time !== 'string' ||
    typeof data.is_active !== 'boolean' ||
    !Array.isArray(data.products)
  ) {
    return 'Promotion data is incomplete.';
  }
  if (!data.title.trim()) return 'A promotion title is required.';
  if (!/^#[0-9a-fA-F]{6}$/.test(data.theme_color)) return 'Choose a valid six-digit theme color.';
  if (!Number.isFinite(Date.parse(data.end_time))) return 'Choose a valid promotion end date.';
  if (data.is_active && Date.parse(data.end_time) <= Date.now()) {
    return 'An active promotion must end in the future.';
  }

  const productIds = new Set<number>();
  for (const product of data.products) {
    if (!Number.isInteger(product.product_id) || product.product_id <= 0) {
      return 'A selected product has an invalid ID.';
    }
    if (productIds.has(product.product_id)) return 'A product can only be selected once.';
    productIds.add(product.product_id);
    if (
      !Number.isFinite(product.override_before_price) ||
      !Number.isFinite(product.override_after_price) ||
      product.override_before_price < 0 ||
      product.override_after_price < 0
    ) {
      return 'Promotion prices must be valid non-negative numbers.';
    }
  }
  return null;
}

export async function savePromotion(
  data: PromotionFormData,
  accessToken: string
): Promise<ActionResult> {
  const authError = await authorizeAdmin(accessToken);
  if (authError) return { success: false, error: authError };

  const validationError = validatePromotion(data);
  if (validationError) return { success: false, error: validationError };

  try {
    if (data.is_active) {
      let deactivateQuery = supabaseAdmin
        .from('promotions')
        .update({ is_active: false })
        .eq('is_active', true);
      if (data.id) deactivateQuery = deactivateQuery.neq('id', data.id);
      const { error: deactivateError } = await deactivateQuery;
      if (deactivateError) throw deactivateError;
    }

    const promotionValues = {
      title: data.title.trim(),
      theme_color: data.theme_color,
      banner_url: data.banner_url || null,
      end_time: new Date(data.end_time).toISOString(),
      is_active: data.is_active,
    };

    const promotionQuery = data.id
      ? supabaseAdmin
          .from('promotions')
          .update(promotionValues)
          .eq('id', data.id)
          .select('id')
          .single()
      : supabaseAdmin
          .from('promotions')
          .insert(promotionValues)
          .select('id')
          .single();

    const { data: savedPromotion, error: saveError } = await promotionQuery;
    if (saveError) throw saveError;

    const { error: deleteProductsError } = await supabaseAdmin
      .from('promotion_products')
      .delete()
      .eq('promotion_id', savedPromotion.id);
    if (deleteProductsError) throw deleteProductsError;

    if (data.products.length > 0) {
      const { error: insertProductsError } = await supabaseAdmin
        .from('promotion_products')
        .insert(
          data.products.map((product) => ({
            promotion_id: savedPromotion.id,
            product_id: product.product_id,
            override_before_price: product.override_before_price,
            override_after_price: product.override_after_price,
          }))
        );
      if (insertProductsError) throw insertProductsError;
    }

    revalidatePath('/pawshop');
    revalidatePath('/pawshop/product/[id]', 'page');
    revalidatePath('/admin/promotions');
    return { success: true, id: Number(savedPromotion.id) };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}

export async function togglePromotion(
  id: number,
  isActive: boolean,
  accessToken: string
): Promise<ActionResult> {
  const authError = await authorizeAdmin(accessToken);
  if (authError) return { success: false, error: authError };
  if (!Number.isInteger(id) || id <= 0) return { success: false, error: 'Invalid promotion ID.' };

  try {
    if (isActive) {
      const { data: promotion, error: promotionError } = await supabaseAdmin
        .from('promotions')
        .select('end_time')
        .eq('id', id)
        .single();
      if (promotionError) throw promotionError;
      if (Date.parse(promotion.end_time) <= Date.now()) {
        return { success: false, error: 'An expired promotion cannot be activated.' };
      }

      const { error: deactivateError } = await supabaseAdmin
        .from('promotions')
        .update({ is_active: false })
        .eq('is_active', true)
        .neq('id', id);
      if (deactivateError) throw deactivateError;
    }

    const { data: updatedPromotion, error } = await supabaseAdmin
      .from('promotions')
      .update({ is_active: isActive })
      .eq('id', id)
      .select('id')
      .maybeSingle();
    if (error) throw error;
    if (!updatedPromotion) {
      return { success: false, error: 'Promotion was not found.' };
    }

    revalidatePath('/pawshop');
    revalidatePath('/admin/promotions');
    return { success: true, id };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}

export async function deletePromotion(id: number, accessToken: string): Promise<ActionResult> {
  const authError = await authorizeAdmin(accessToken);
  if (authError) return { success: false, error: authError };
  if (!Number.isInteger(id) || id <= 0) return { success: false, error: 'Invalid promotion ID.' };

  try {
    const { data: deletedPromotion, error } = await supabaseAdmin
      .from('promotions')
      .delete()
      .eq('id', id)
      .select('id')
      .maybeSingle();
    if (error) throw error;
    if (!deletedPromotion) return { success: false, error: 'Promotion was not found.' };

    revalidatePath('/pawshop');
    revalidatePath('/admin/promotions');
    return { success: true, id };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}
