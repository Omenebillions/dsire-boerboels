CREATE TABLE IF NOT EXISTS public.promotions (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  is_active BOOLEAN DEFAULT false,
  theme_color TEXT DEFAULT '#a31542',
  banner_url TEXT,
  start_time TIMESTAMPTZ DEFAULT NOW(),
  end_time TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.promotion_products (
  id BIGSERIAL PRIMARY KEY,
  promotion_id BIGINT NOT NULL REFERENCES public.promotions(id) ON DELETE CASCADE,
  product_id BIGINT NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  override_before_price NUMERIC NOT NULL,
  override_after_price NUMERIC NOT NULL,
  UNIQUE (promotion_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_promo_active
  ON public.promotions(is_active)
  WHERE is_active = true;

CREATE UNIQUE INDEX IF NOT EXISTS idx_promotions_single_active
  ON public.promotions(is_active)
  WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_promo_products
  ON public.promotion_products(promotion_id);

ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promotion_products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS promotions_read_active_or_admin ON public.promotions;
CREATE POLICY promotions_read_active_or_admin
  ON public.promotions FOR SELECT
  USING (
    (is_active = true AND end_time > NOW())
    OR EXISTS (
      SELECT 1 FROM public.admin_roles
      WHERE admin_roles.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS promotion_products_read_active_or_admin ON public.promotion_products;
CREATE POLICY promotion_products_read_active_or_admin
  ON public.promotion_products FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.promotions
      WHERE promotions.id = promotion_products.promotion_id
        AND promotions.is_active = true
        AND promotions.end_time > NOW()
    )
    OR EXISTS (
      SELECT 1 FROM public.admin_roles
      WHERE admin_roles.user_id = auth.uid()
    )
  );

INSERT INTO storage.buckets (id, name, public)
VALUES ('promotion-banners', 'promotion-banners', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS promotion_banners_public_read ON storage.objects;
CREATE POLICY promotion_banners_public_read
  ON storage.objects FOR SELECT
  USING (bucket_id = 'promotion-banners');

DROP POLICY IF EXISTS promotion_banners_admin_insert ON storage.objects;
DROP POLICY IF EXISTS promotion_banners_authenticated_insert ON storage.objects;
CREATE POLICY promotion_banners_authenticated_insert
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'promotion-banners');

DROP POLICY IF EXISTS promotion_banners_admin_update ON storage.objects;
DROP POLICY IF EXISTS promotion_banners_authenticated_update ON storage.objects;
CREATE POLICY promotion_banners_authenticated_update
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'promotion-banners')
  WITH CHECK (bucket_id = 'promotion-banners');

DROP POLICY IF EXISTS promotion_banners_admin_delete ON storage.objects;
DROP POLICY IF EXISTS promotion_banners_authenticated_delete ON storage.objects;
CREATE POLICY promotion_banners_authenticated_delete
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'promotion-banners');
