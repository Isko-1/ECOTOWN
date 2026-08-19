-- ==============================================================================
-- EcoTown — Единый файл полной схемы базы данных Supabase
-- Все таблицы, функции, триггеры, политики безопасности (RLS) и хранилище файлов (Storage).
-- Запустите этот скрипт целиком в Supabase SQL Editor для быстрой настройки проекта!
-- ==============================================================================

-- 1. ТАБЛИЦА ПРОФИЛЕЙ (Profiles)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  bio TEXT,
  city TEXT,
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. МЕТКИ ЗАГРЯЗНЕНИЙ (Spots)
CREATE TABLE IF NOT EXISTS public.spots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'in_progress', 'done')),
  difficulty SMALLINT NOT NULL CHECK (difficulty BETWEEN 1 AND 5),
  is_public BOOLEAN NOT NULL DEFAULT TRUE,
  photo_before_url TEXT,
  photo_after_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. ВОЛОНТЁРЫ МЕТОК (Spot Volunteers)
CREATE TABLE IF NOT EXISTS public.spot_volunteers (
  spot_id UUID REFERENCES public.spots(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (spot_id, user_id)
);

-- 4. ЧАТ И СООБЩЕНИЯ (Spot Messages)
CREATE TABLE IF NOT EXISTS public.spot_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  spot_id UUID REFERENCES public.spots(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. ИЗБРАННОЕ (Favorites)
CREATE TABLE IF NOT EXISTS public.favorites (
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  spot_id UUID REFERENCES public.spots(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, spot_id)
);

-- 6. ОБЩИЕ НАСТРОЙКИ ПЛАТФОРМЫ (App Settings)
CREATE TABLE IF NOT EXISTS public.app_settings (
  id BOOLEAN PRIMARY KEY DEFAULT TRUE CHECK (id),
  kaspi_number TEXT,
  commission_percent NUMERIC NOT NULL DEFAULT 5,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Создаем единственную строку настроек по умолчанию
INSERT INTO public.app_settings (id, kaspi_number) 
VALUES (true, null) 
ON CONFLICT (id) DO NOTHING;

-- 7. ЗАЯВКИ НА ДОНАТЫ (Spot Donations)
CREATE TABLE IF NOT EXISTS public.spot_donations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  spot_id UUID NOT NULL REFERENCES public.spots(id) ON DELETE CASCADE,
  requested_by UUID NOT NULL REFERENCES public.profiles(id),
  purpose_text TEXT NOT NULL,
  goal_amount NUMERIC NOT NULL CHECK (goal_amount > 0),
  collected_amount NUMERIC NOT NULL DEFAULT 0,
  contact_phone TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  approved_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS spot_donations_spot_id_idx ON public.spot_donations(spot_id);

-- 8. ИСТОРИЯ ПЕРЕВОДОВ И ДОНАТОВ (Donation Transactions)
CREATE TABLE IF NOT EXISTS public.donation_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  donation_id UUID NOT NULL REFERENCES public.spot_donations(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL CHECK (amount > 0),
  recorded_by UUID REFERENCES public.profiles(id),
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);


-- ==============================================================================
-- ФУНКЦИИ И ТРИГГЕРЫ
-- ==============================================================================

-- Триггер автоматического создания профиля при регистрации пользователя (Google или Email)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_url)
  VALUES (
    new.id,
    COALESCE(
      new.raw_user_meta_data->>'display_name',
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name',
      split_part(new.email, '@', 1)
    ),
    new.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();


-- Триггер обновления собранной суммы и автозавершения сбора при добавлении транзакции
CREATE OR REPLACE FUNCTION public.apply_donation_transaction()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.spot_donations
  SET collected_amount = collected_amount + new.amount,
      status = CASE
        WHEN collected_amount + new.amount >= goal_amount THEN 'completed'
        ELSE status
      END
  WHERE id = new.donation_id;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_donation_transaction_insert ON public.donation_transactions;
CREATE TRIGGER on_donation_transaction_insert
  AFTER INSERT ON public.donation_transactions
  FOR EACH ROW EXECUTE PROCEDURE public.apply_donation_transaction();


-- ==============================================================================
-- REALTIME (Включение живых сообщений в чате)
-- ==============================================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'spot_messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.spot_messages;
  END IF;
END $$;


-- ==============================================================================
-- БЕЗОПАСНОСТЬ И RLS ПОЛИТИКИ (Row Level Security)
-- ==============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spot_volunteers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spot_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spot_donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donation_transactions ENABLE ROW LEVEL SECURITY;

-- Profiles policies
DROP POLICY IF EXISTS "profiles_select_all" ON public.profiles;
CREATE POLICY "profiles_select_all" ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Spots policies
DROP POLICY IF EXISTS "spots_select" ON public.spots;
CREATE POLICY "spots_select" ON public.spots FOR SELECT
  USING (is_public = true OR created_by = auth.uid());

DROP POLICY IF EXISTS "spots_insert" ON public.spots;
CREATE POLICY "spots_insert" ON public.spots FOR INSERT WITH CHECK (auth.uid() = created_by);

DROP POLICY IF EXISTS "spots_update" ON public.spots;
CREATE POLICY "spots_update" ON public.spots FOR UPDATE
  USING (
    auth.uid() = created_by
    OR EXISTS (
      SELECT 1 FROM public.spot_volunteers v
      WHERE v.spot_id = spots.id AND v.user_id = auth.uid()
    )
  );

-- Spot volunteers policies
DROP POLICY IF EXISTS "volunteers_select" ON public.spot_volunteers;
CREATE POLICY "volunteers_select" ON public.spot_volunteers FOR SELECT USING (true);

DROP POLICY IF EXISTS "volunteers_insert" ON public.spot_volunteers;
CREATE POLICY "volunteers_insert" ON public.spot_volunteers FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "volunteers_delete" ON public.spot_volunteers;
CREATE POLICY "volunteers_delete" ON public.spot_volunteers FOR DELETE USING (auth.uid() = user_id);

-- Spot messages policies
DROP POLICY IF EXISTS "messages_select" ON public.spot_messages;
CREATE POLICY "messages_select" ON public.spot_messages FOR SELECT USING (true);

DROP POLICY IF EXISTS "messages_insert" ON public.spot_messages;
CREATE POLICY "messages_insert" ON public.spot_messages FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Favorites policies
DROP POLICY IF EXISTS "favorites_select_own" ON public.favorites;
CREATE POLICY "favorites_select_own" ON public.favorites FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "favorites_insert_own" ON public.favorites;
CREATE POLICY "favorites_insert_own" ON public.favorites FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "favorites_delete_own" ON public.favorites;
CREATE POLICY "favorites_delete_own" ON public.favorites FOR DELETE USING (auth.uid() = user_id);

-- App settings policies
DROP POLICY IF EXISTS "settings_select_all" ON public.app_settings;
CREATE POLICY "settings_select_all" ON public.app_settings FOR SELECT USING (true);

DROP POLICY IF EXISTS "settings_update_admin" ON public.app_settings;
CREATE POLICY "settings_update_admin" ON public.app_settings FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

-- Spot donations policies
DROP POLICY IF EXISTS "donations_select" ON public.spot_donations;
CREATE POLICY "donations_select" ON public.spot_donations FOR SELECT
  USING (
    status IN ('approved', 'completed')
    OR requested_by = auth.uid()
    OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

DROP POLICY IF EXISTS "donations_insert" ON public.spot_donations;
CREATE POLICY "donations_insert" ON public.spot_donations FOR INSERT
  WITH CHECK (
    auth.uid() = requested_by
    AND status = 'pending'
    AND collected_amount = 0
    AND EXISTS (
      SELECT 1 FROM public.spot_volunteers v
      WHERE v.spot_id = spot_donations.spot_id AND v.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "donations_update_admin" ON public.spot_donations;
CREATE POLICY "donations_update_admin" ON public.spot_donations FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

-- Donation transactions policies
DROP POLICY IF EXISTS "transactions_select_all" ON public.donation_transactions;
CREATE POLICY "transactions_select_all" ON public.donation_transactions FOR SELECT USING (true);

DROP POLICY IF EXISTS "transactions_insert_admin" ON public.donation_transactions;
CREATE POLICY "transactions_insert_admin" ON public.donation_transactions FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));


-- ==============================================================================
-- BUCKETS И ХРАНИЛИЩЕ (Storage Policies for spot-photos and avatars)
-- ==============================================================================

-- Создаем публичные бакеты для аватарок и фотографий меток
INSERT INTO storage.buckets (id, name, public)
VALUES ('spot-photos', 'spot-photos', true), ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Политики для storage.objects
DROP POLICY IF EXISTS "spot_photos_public_read" ON storage.objects;
CREATE POLICY "spot_photos_public_read" ON storage.objects FOR SELECT
  USING (bucket_id = 'spot-photos');

DROP POLICY IF EXISTS "spot_photos_own_insert" ON storage.objects;
CREATE POLICY "spot_photos_own_insert" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'spot-photos' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "avatars_public_read" ON storage.objects;
CREATE POLICY "avatars_public_read" ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "avatars_own_insert" ON storage.objects;
CREATE POLICY "avatars_own_insert" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "avatars_own_update" ON storage.objects;
CREATE POLICY "avatars_own_update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);


-- ==============================================================================
-- КАК СДЕЛАТЬ СЕБЯ АДМИНОМ (Выполнить после регистрации своего аккаунта):
-- Замените 'твой@email.com' на свой реальный Email
-- ==============================================================================
-- UPDATE public.profiles 
-- SET role = 'admin' 
-- WHERE id = (SELECT id FROM auth.users WHERE email = 'твой@email.com');
