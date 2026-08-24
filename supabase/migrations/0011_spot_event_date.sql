-- 0011_spot_event_date.sql
-- Добавление поля даты и времени проведения субботника для меток

ALTER TABLE public.spots ADD COLUMN IF NOT EXISTS event_date TIMESTAMPTZ;
