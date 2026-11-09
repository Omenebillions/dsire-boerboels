DROP POLICY IF EXISTS promotion_banners_admin_insert ON storage.objects;
DROP POLICY IF EXISTS promotion_banners_admin_update ON storage.objects;
DROP POLICY IF EXISTS promotion_banners_admin_delete ON storage.objects;

DROP POLICY IF EXISTS promotion_banners_authenticated_insert ON storage.objects;
CREATE POLICY promotion_banners_authenticated_insert
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'promotion-banners');

DROP POLICY IF EXISTS promotion_banners_authenticated_update ON storage.objects;
CREATE POLICY promotion_banners_authenticated_update
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'promotion-banners')
  WITH CHECK (bucket_id = 'promotion-banners');

DROP POLICY IF EXISTS promotion_banners_authenticated_delete ON storage.objects;
CREATE POLICY promotion_banners_authenticated_delete
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'promotion-banners');
