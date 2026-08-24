-- ==============================================================================
-- EcoTown — Единый файл полной схемы базы данных Supabase (Обновлено)
-- Содержит все таблицы, миграции 0001–0012, триггеры, политики RLS и функции.
-- Запустите этот скрипт целиком в Supabase SQL Editor для быстрой настройки!
-- ==============================================================================

-- 1. ТАБЛИЦА ПРОФИЛЕЙ (Profiles)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  bio TEXT,
  city TEXT,
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'moderator', 'admin')),
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
  photo_before_url TEXT,
  photo_after_url TEXT,
  event_date TIMESTAMPTZ,
  closed_at TIMESTAMPTZ,
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
  message TEXT NOT NULL CHECK (char_length(message) <= 2000),
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

-- Автосоздание профиля при регистрации
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

-- Защита смены роли (только админ)
CREATE OR REPLACE FUNCTION public.protect_profile_role()
RETURNS TRIGGER AS $$
BEGIN
  IF new.role IS DISTINCT FROM old.role
     AND auth.uid() IS NOT NULL
     AND NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  THEN
    RAISE EXCEPTION 'Роль может менять только администратор';
  END IF;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS protect_profile_role_trigger ON public.profiles;
CREATE TRIGGER protect_profile_role_trigger
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE PROCEDURE public.protect_profile_role();

-- Защита полей метки от изменения чужими волонтёрами
CREATE OR REPLACE FUNCTION public.protect_spot_fields()
RETURNS TRIGGER AS $$
DECLARE
  caller_role TEXT;
BEGIN
  SELECT role INTO caller_role FROM public.profiles WHERE id = auth.uid();

  IF caller_role IN ('moderator', 'admin') THEN
    RETURN NEW;
  END IF;

  IF auth.uid() = OLD.created_by THEN
    RETURN NEW;
  END IF;

  IF NEW.title IS DISTINCT FROM OLD.title
     OR NEW.description IS DISTINCT FROM OLD.description
     OR NEW.lat IS DISTINCT FROM OLD.lat
     OR NEW.lng IS DISTINCT FROM OLD.lng
     OR NEW.difficulty IS DISTINCT FROM OLD.difficulty
     OR NEW.created_by IS DISTINCT FROM OLD.created_by
     OR NEW.photo_before_url IS DISTINCT FROM OLD.photo_before_url
     OR NEW.event_date IS DISTINCT FROM OLD.event_date
  THEN
    RAISE EXCEPTION 'Только автор метки или модератор может менять эти поля';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS protect_spot_fields_trigger ON public.spots;
CREATE TRIGGER protect_spot_fields_trigger
  BEFORE UPDATE ON public.spots
  FOR EACH ROW EXECUTE PROCEDURE public.protect_spot_fields();


-- ==============================================================================
-- RLS ПОЛИТИКИ И РАЗРЕШЕНИЯ
-- ==============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spot_volunteers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spot_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spot_donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donation_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select_all" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "spots_select" ON public.spots FOR SELECT USING (true);
CREATE POLICY "spots_insert" ON public.spots FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "spots_update" ON public.spots FOR UPDATE USING (
  auth.uid() = created_by
  OR EXISTS (SELECT 1 FROM public.spot_volunteers v WHERE v.spot_id = spots.id AND v.user_id = auth.uid())
  OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('moderator', 'admin'))
);
CREATE POLICY "spots_delete" ON public.spots FOR DELETE USING (
  auth.uid() = created_by
  OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('moderator', 'admin'))
);

CREATE POLICY "volunteers_select" ON public.spot_volunteers FOR SELECT USING (true);
CREATE POLICY "volunteers_insert" ON public.spot_volunteers FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "volunteers_delete" ON public.spot_volunteers FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "messages_select" ON public.spot_messages FOR SELECT USING (true);
CREATE POLICY "messages_insert" ON public.spot_messages FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "favorites_select_own" ON public.favorites FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "favorites_insert_own" ON public.favorites FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "favorites_delete_own" ON public.favorites FOR DELETE USING (auth.uid() = user_id);

-- REALTIME ДЛЯ ЧАТА
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'spot_messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.spot_messages;
  END IF;
END $$;
