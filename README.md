# EcoTown

Next.js 15 + Supabase + Leaflet замена Bubble-прототипа EcoTown.

## Стек
Next.js 15 (App Router, TS) · Tailwind CSS · Supabase (Postgres/Auth/Storage) · Leaflet + CARTO Positron тайлы · Vercel

## Запуск локально

```bash
npm install
cp .env.local.example .env.local   # заполнить тремя ключами из Supabase
npm run dev
```

## Supabase — что сделать один раз

1. Создать проект на supabase.com, скопировать `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` в `.env.local`.
2. Применить миграцию `supabase/migrations/0001_init.sql` — в SQL Editor проекта или через CLI:
   ```bash
   npx supabase link --project-ref <PROJECT_REF>
   npx supabase db push
   ```
3. Создать публичный на чтение Storage-бакет `spot-photos`:
   ```bash
   npx supabase storage buckets create spot-photos --public
   ```
   Либо вручную в Dashboard → Storage → New bucket → `spot-photos`, Public.

## Деплой на Vercel

```bash
npx vercel link
npx vercel env add NEXT_PUBLIC_SUPABASE_URL
npx vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
npx vercel env add SUPABASE_SERVICE_ROLE_KEY
git push
```
Vercel задеплоит превью автоматически при каждом push, если репозиторий подключён через интеграцию GitHub ↔ Vercel.

## Чек-лист багов старой версии (проверить на задеплоенном URL, не localhost)

- [ ] 390px — в хедере есть кнопка-гамбургер
- [ ] «Зарегистрироваться» / «Войти» / «Присоединиться» ведут на реальные формы
- [ ] Клик по метке открывает попап с деталями
- [ ] Количество маркеров на карте = числу строк `spots`
- [ ] Никакой debug-строки на `/favorites`
- [ ] Заголовок лендинга адаптивный на мобильном
