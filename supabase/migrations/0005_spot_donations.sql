-- Донаты по конкретным меткам (сложность 4-5, по желанию автора метки)
alter table spots add column donation_goal text;
alter table spots add column donation_kaspi_number text;

-- ВАЖНО: обычная RLS-политика spots_update действует построчно, а не поколонно —
-- без этого триггера любой волонтёр метки смог бы через devtools вызвать
-- supabase.from('spots').update({donation_kaspi_number: 'свой_номер'}) и подменить получателя донатов.
-- Менять donation_kaspi_number может только service_role (то есть ты вручную через Table Editor в Supabase).
create function public.protect_donation_kaspi_number()
returns trigger as $$
begin
  if new.donation_kaspi_number is distinct from old.donation_kaspi_number
     and auth.role() <> 'service_role' then
    raise exception 'donation_kaspi_number может менять только модератор (service_role)';
  end if;
  return new;
end;
$$ language plpgsql security definer;

create trigger protect_donation_kaspi_number_trigger
  before update on spots
  for each row execute procedure public.protect_donation_kaspi_number();
