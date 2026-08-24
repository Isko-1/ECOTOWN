-- Migration 0013: fix admin_list_users to include users without display_name
-- Uses LEFT JOIN so auth users without a profile row still appear.

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
    raise exception 'Access denied: admin only';
  end if;

  return query
    select
      u.id,
      coalesce(p.display_name, '') as display_name,
      u.email,
      coalesce(p.role, 'user') as role,
      coalesce(p.created_at, u.created_at) as created_at
    from auth.users u
    left join profiles p on p.id = u.id
    order by coalesce(p.created_at, u.created_at) desc;
end;
$$;

revoke all on function public.admin_list_users() from public;
grant execute on function public.admin_list_users() to authenticated;
