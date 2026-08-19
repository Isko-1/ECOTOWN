-- Включаем realtime-обновления для чата по меткам
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'spot_messages'
  ) then
    alter publication supabase_realtime add table spot_messages;
  end if;
end $$;
