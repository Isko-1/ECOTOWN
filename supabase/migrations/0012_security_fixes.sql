-- 0012_security_fixes.sql
-- Исправление найденных безопасности уязвимостей в RLS и триггерах

-- 1. Защита поля event_date в триггере protect_spot_fields
CREATE OR REPLACE FUNCTION public.protect_spot_fields()
RETURNS TRIGGER AS $$
DECLARE
  caller_role TEXT;
BEGIN
  SELECT role INTO caller_role FROM public.profiles WHERE id = auth.uid();

  -- Модератор и админ — полные права на любую метку
  IF caller_role IN ('moderator', 'admin') THEN
    RETURN NEW;
  END IF;

  -- Создатель метки — полные права на свою метку
  IF auth.uid() = OLD.created_by THEN
    RETURN NEW;
  END IF;

  -- Все остальные (обычный волонтёр) — могут менять только статус, фото "после" и closed_at
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


-- 2. Добавление политики на удаление меток (spots_delete)
-- Раньше удаление отсутствовало вовсе, из-за чего удалять метки нельзя было даже админу.
DROP POLICY IF EXISTS "spots_delete" ON public.spots;
CREATE POLICY "spots_delete" ON public.spots FOR DELETE
  USING (
    auth.uid() = created_by
    OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('moderator', 'admin'))
  );


-- 3. Защита от спама и DoS длинными сообщениями в чате (spot_messages)
ALTER TABLE public.spot_messages DROP CONSTRAINT IF EXISTS check_message_length;
ALTER TABLE public.spot_messages ADD CONSTRAINT check_message_length CHECK (char_length(message) <= 2000);
