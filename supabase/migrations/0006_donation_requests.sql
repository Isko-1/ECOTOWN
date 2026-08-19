-- Полноценная схема доната: заявку подаёт ВОЛОНТЁР (не автор метки), модератор (admin) одобряет
-- в /admin, вручную фиксирует поступления — из них строится шкала прогресса.
-- Заменяет собой упрощённую задумку из 0005_spot_donations.sql (колонки на spots больше не используются).

-- Роль пользователя. По умолчанию все — 'user', себя нужно назначить admin вручную (см. низ файла).
alter table profiles add column role text not null default 'user' check (role in ('user','admin'));

-- Единственная строка с общими настройками платформы — номер Kaspi всегда один, админский.
create table app_settings (
  id boolean primary key default true check (id),
  kaspi_number text,
  commission_percent numeric not null default 5,
  updated_at timestamptz default now()
);
insert into app_settings (id, kaspi_number) values (true, null);

-- Заявка на донат по метке: кто просит, на что, сколько нужно.
create table spot_donations (
  id uuid primary key default gen_random_uuid(),
  spot_id uuid not null references spots(id) on delete cascade,
  requested_by uuid not null references profiles(id),
  purpose_text text not null,
  goal_amount numeric not null check (goal_amount > 0),
  collected_amount numeric not null default 0,
  status text not null default 'pending' check (status in ('pending','approved','rejected','completed')),
  created_at timestamptz default now(),
  approved_at timestamptz
);
create index spot_donations_spot_id_idx on spot_donations(spot_id);

-- Лог поступлений — админ вручную вносит каждый перевод, реально пришедший на Kaspi.
create table donation_transactions (
  id uuid primary key default gen_random_uuid(),
  donation_id uuid not null references spot_donations(id) on delete cascade,
  amount numeric not null check (amount > 0),
  recorded_by uuid references profiles(id),
  note text,
  created_at timestamptz default now()
);

-- При каждом внесении поступления — обновить collected_amount, а при достижении цели закрыть заявку.
create function public.apply_donation_transaction()
returns trigger as $$
begin
  update spot_donations
  set collected_amount = collected_amount + new.amount,
      status = case
        when collected_amount + new.amount >= goal_amount then 'completed'
        else status
      end
  where id = new.donation_id;
  return new;
end;
$$ language plpgsql security definer;

create trigger on_donation_transaction_insert
  after insert on donation_transactions
  for each row execute procedure public.apply_donation_transaction();

-- ===== RLS =====
alter table app_settings enable row level security;
alter table spot_donations enable row level security;
alter table donation_transactions enable row level security;

-- app_settings: номер виден всем в попапе, менять может только admin
create policy "settings_select_all" on app_settings for select using (true);
create policy "settings_update_admin" on app_settings for update
  using (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'));

-- spot_donations: заявку видит её автор + admin, пока не approved; после approve видна всем
create policy "donations_select" on spot_donations for select
  using (
    status in ('approved','completed')
    or requested_by = auth.uid()
    or exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- создать заявку может ТОЛЬКО тот, кто реально вступил волонтёром на эту метку —
-- автор метки часто не в курсе, что конкретно нужно для уборки
create policy "donations_insert" on spot_donations for insert
  with check (
    auth.uid() = requested_by
    and status = 'pending'
    and collected_amount = 0
    and exists (
      select 1 from spot_volunteers v
      where v.spot_id = spot_donations.spot_id and v.user_id = auth.uid()
    )
  );

-- одобрять/отклонять и вообще менять запись может только admin
create policy "donations_update_admin" on spot_donations for update
  using (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'));

-- donation_transactions: видно всем (это и есть публичная шкала прогресса),
-- вносить поступления может только admin — иначе шкалу накрутит кто угодно
create policy "transactions_select_all" on donation_transactions for select using (true);
create policy "transactions_insert_admin" on donation_transactions for insert
  with check (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'));

-- ===== Назначить себя админом (выполнить вручную один раз) =====
-- 1. Узнать свой uuid: select id, email from auth.users where email = 'твой@email';
-- 2. update profiles set role = 'admin' where id = '<uuid из шага 1>';

-- ===== Старые колонки на spots больше не используются новым флоу =====
-- Оставлены нетронутыми, чтобы не потерять уже введённые данные, если такие есть.
-- Когда убедишься, что они пустые/не нужны — можно выполнить вручную:
-- alter table spots drop column donation_goal;
-- alter table spots drop column donation_kaspi_number;
-- drop trigger if exists protect_donation_kaspi_number_trigger on spots;
-- drop function if exists public.protect_donation_kaspi_number();
