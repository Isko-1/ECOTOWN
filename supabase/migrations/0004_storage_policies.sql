-- Storage RLS: без этих политик "Public bucket" разрешает только ЧТЕНИЕ файлов,
-- а загрузка (insert) блокируется RLS по умолчанию — отсюда ошибка
-- "new row violates row-level security policy" при аплоаде фото.

-- ===== spot-photos =====
-- Читать может кто угодно (публичные ссылки в попапе метки)
create policy "spot_photos_public_read"
  on storage.objects for select
  using (bucket_id = 'spot-photos');

-- Загружать может только авторизованный пользователь, и только в свою папку
-- (наш код грузит по пути `${userId}/...`, поэтому первый сегмент пути должен совпадать с auth.uid())
create policy "spot_photos_own_insert"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'spot-photos' and (storage.foldername(name))[1] = auth.uid()::text);

-- ===== avatars =====
create policy "avatars_public_read"
  on storage.objects for select
  using (bucket_id = 'avatars');

create policy "avatars_own_insert"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

-- Аватар грузится с upsert:true — на повторной загрузке Supabase иногда делает UPDATE,
-- а не INSERT, поэтому нужна ещё и политика на обновление своей же папки
create policy "avatars_own_update"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
