-- EcoTown initial schema
-- Профили пользователей
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  avatar_url text,
  created_at timestamptz default now()
);

-- Автосоздание профиля при регистрации
create function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)));
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Метки загрязнений
create table spots (
  id uuid primary key default gen_random_uuid(),
  created_by uuid references profiles(id),
  title text not null,
  description text not null,
  lat double precision not null,
  lng double precision not null,
  status text not null default 'new' check (status in ('new','in_progress','done')),
  difficulty smallint not null check (difficulty between 1 and 5),
  is_public boolean not null default true,
  photo_before_url text,
  photo_after_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Волонтёры, взявшие метку в работу
create table spot_volunteers (
  spot_id uuid references spots(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  joined_at timestamptz default now(),
  primary key (spot_id, user_id)
);

-- Чат по метке
create table spot_messages (
  id uuid primary key default gen_random_uuid(),
  spot_id uuid references spots(id) on delete cascade,
  user_id uuid references profiles(id),
  message text not null,
  created_at timestamptz default now()
);

-- Избранное
create table favorites (
  user_id uuid references profiles(id) on delete cascade,
  spot_id uuid references spots(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (user_id, spot_id)
);

-- ===== Row Level Security =====
alter table profiles enable row level security;
alter table spots enable row level security;
alter table spot_volunteers enable row level security;
alter table spot_messages enable row level security;
alter table favorites enable row level security;

-- profiles: читать может любой, писать/менять — только свою запись
create policy "profiles_select_all" on profiles for select using (true);
create policy "profiles_update_own" on profiles for update using (auth.uid() = id);

-- spots: читать публичные метки может любой, свои приватные — только автор
create policy "spots_select" on spots for select
  using (is_public = true or created_by = auth.uid());
create policy "spots_insert" on spots for insert
  with check (auth.uid() = created_by);
create policy "spots_update" on spots for update
  using (
    auth.uid() = created_by
    or exists (
      select 1 from spot_volunteers v
      where v.spot_id = spots.id and v.user_id = auth.uid()
    )
  );

-- spot_volunteers: видно всем, вступить может только сам пользователь за себя
create policy "volunteers_select" on spot_volunteers for select using (true);
create policy "volunteers_insert" on spot_volunteers for insert
  with check (auth.uid() = user_id);
create policy "volunteers_delete" on spot_volunteers for delete
  using (auth.uid() = user_id);

-- spot_messages: читать может любой (публичный чат метки), писать — от своего имени
create policy "messages_select" on spot_messages for select using (true);
create policy "messages_insert" on spot_messages for insert
  with check (auth.uid() = user_id);

-- favorites: только свои записи
create policy "favorites_select_own" on favorites for select using (auth.uid() = user_id);
create policy "favorites_insert_own" on favorites for insert with check (auth.uid() = user_id);
create policy "favorites_delete_own" on favorites for delete using (auth.uid() = user_id);
