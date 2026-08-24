-- 1) Роли: добавляем 'moderator' между 'user' и 'admin'.
alter table profiles drop constraint if exists profiles_role_check;
alter table profiles add constraint profiles_role_check check (role in ('user', 'moderator', 'admin'));

-- 2) closed_at физически использовался в коде (CloseSpotForm.tsx), но ни в одной
-- миграции не создавался — колонка была добавлена вручную мимо репозитория. Фиксируем это здесь,
-- чтобы схема была воспроизводима с нуля.
alter table spots add column if not exists closed_at timestamptz;

-- 3) Убираем приватные метки полностью — все метки теперь публичные.
-- Заодно закрывает дыру: чат приватной метки был читаем всеми (spot_messages_select
-- не проверял is_public), а раз приватных меток больше нет — проблема снимается сама.
drop policy if exists "spots_select" on spots;
create policy "spots_select" on spots for select using (true);
alter table spots drop column if exists is_public;

-- 4) Дыра в spots_update: раньше ЛЮБОЙ волонтёр метки мог через API переписать
-- title/description/координаты/created_by — политика проверяла только "имеет ли право
-- обновлять строку", но не "какие поля меняет". Права на редактирование теперь такие:
--   - создатель метки — может всё
--   - модератор/админ — может всё, для ЛЮБОЙ метки (это и есть "модератор, который может
--     изменять метки" из задачи)
--   - обычный волонтёр — может менять только status/photo_after_url/closed_at
--     (то же самое, что уже разрешал UI — теперь это гарантировано на уровне БД, а не только вёрсткой)
drop policy if exists "spots_update" on spots;
create policy "spots_update" on spots for update
  using (
    auth.uid() = created_by
    or exists (select 1 from spot_volunteers v where v.spot_id = spots.id and v.user_id = auth.uid())
    or exists (select 1 from profiles p where p.id = auth.uid() and p.role in ('moderator', 'admin'))
  );

create or replace function public.protect_spot_fields()
returns trigger as $$
declare
  caller_role text;
begin
  select role into caller_role from profiles where id = auth.uid();

  -- модератор и админ — полные права на любую метку
  if caller_role in ('moderator', 'admin') then
    return new;
  end if;

  -- создатель метки — полные права на свою метку
  if auth.uid() = old.created_by then
    return new;
  end if;

  -- все остальные (обычный волонтёр, взявший метку в работу) — только статус и фото "после"
  if new.title is distinct from old.title
     or new.description is distinct from old.description
     or new.lat is distinct from old.lat
     or new.lng is distinct from old.lng
     or new.difficulty is distinct from old.difficulty
     or new.created_by is distinct from old.created_by
     or new.photo_before_url is distinct from old.photo_before_url
  then
    raise exception 'Только автор метки или модератор может менять эти поля';
  end if;

  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists protect_spot_fields_trigger on spots;
create trigger protect_spot_fields_trigger
  before update on spots
  for each row execute procedure public.protect_spot_fields();

-- 5) Управление пользователями для админ-панели.
-- Email НЕ добавляется как колонка в profiles (это была бы утечка: profiles читается всеми
-- через "using(true)", и email всех пользователей стал бы виден кому угодно). Вместо этого —
-- security definer функция, которая сама проверяет, что вызывающий админ, и подтягивает
-- email из auth.users напрямую (доступ к auth.users есть только у функций с security definer).

create or replace function public.admin_list_users()
returns table (
  id uuid,
  display_name text,
  email text,
  role text,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if not exists (select 1 from profiles where id = auth.uid() and role = 'admin') then
    raise exception 'Доступ только для админа';
  end if;

  return query
    select p.id, p.display_name, u.email, p.role, p.created_at
    from profiles p
    join auth.users u on u.id = p.id
    order by p.created_at desc;
end;
$$;

create or replace function public.admin_set_user_role(target_user_id uuid, new_role text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (select 1 from profiles where id = auth.uid() and role = 'admin') then
    raise exception 'Доступ только для админа';
  end if;

  if new_role not in ('user', 'moderator', 'admin') then
    raise exception 'Недопустимая роль: %', new_role;
  end if;

  -- защита от случайной самопонижения — если у тебя всего один админ, и ты уберёшь
  -- себе admin, зайти в /admin будет уже некому
  if target_user_id = auth.uid() and new_role <> 'admin' then
    raise exception 'Нельзя понизить самого себя — попроси другого админа';
  end if;

  update profiles set role = new_role where id = target_user_id;
end;
$$;

revoke all on function public.admin_list_users() from public;
grant execute on function public.admin_list_users() to authenticated;

revoke all on function public.admin_set_user_role(uuid, text) from public;
grant execute on function public.admin_set_user_role(uuid, text) to authenticated;
