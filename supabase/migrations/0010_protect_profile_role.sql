-- Закрывает дыру: profiles_update_own разрешал auth.uid()=id, но не проверял,
-- какие поля меняются — любой пользователь мог выполнить
--   supabase.from('profiles').update({ role: 'admin' })
-- и стать админом в обход admin_set_user_role().
--
-- ВАЖНО: в отличие от protect_donation_kaspi_number (0005), здесь нельзя
-- проверять auth.role() <> 'service_role' — у role ЕСТЬ легитимный путь через
-- admin_set_user_role(), и security definer НЕ меняет auth.role() (это claim
-- исходного вызывающего, а не владельца функции). Поэтому проверяем по существу:
-- менять чужую/свою роль может только тот, кто уже admin, либо ручной доступ
-- без сессии (SQL editor — так документирован бутстрап самого первого админа в 0006).
create or replace function public.protect_profile_role()
returns trigger as $$
begin
  if new.role is distinct from old.role
     and auth.uid() is not null
     and not exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  then
    raise exception 'Роль может менять только администратор';
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists protect_profile_role_trigger on profiles;
create trigger protect_profile_role_trigger
  before update on profiles
  for each row execute procedure public.protect_profile_role();
