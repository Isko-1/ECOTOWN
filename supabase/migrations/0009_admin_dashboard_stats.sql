-- Статистика для админ-панели: скорость обработки, retention волонтёров, DAU/MAU.
-- Воронка конверсии (создано → взято в работу → закрыто) сюда НЕ входит — она
-- теперь на главной странице сайта (components/StatsSection.tsx), потому что это
-- публичные агрегатные числа, а не то, что нужно прятать за ролью admin.
--
-- Всё считается одним SQL-вызовом на сервере (а не вытягиванием строк на клиент).
--
-- Важно про источники данных:
--   - "Взятие в работу" = первая запись в spot_volunteers для метки (SpotSidebar.joinVolunteers
--     ставит status='in_progress' в той же транзакции, что и insert в spot_volunteers).
--   - "Закрытие" = spots.closed_at (ставится в CloseSpotForm вместе с status='done' и фото «после»).
--   - DAU/MAU — не полноценный трекинг сессий/визитов (такой таблицы в приложении нет), а
--     приближение по уникальным пользователям с любым действием (метка/взятие в работу/сообщение
--     в чате) за период. Это единственный источник активности, который есть в схеме.
--
-- Что сюда сознательно НЕ включено, потому что для этого нет данных в схеме:
--   - Модерация и фрод (жалобы, отклонённые фото) — в приложении нет функции жалоб вообще.
--   - Доля задач, переданных коммунальным службам — нет поля у spots, отмечающего это.

create or replace function public.admin_dashboard_stats()
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  result json;
begin
  if not exists (select 1 from profiles where id = auth.uid() and role = 'admin') then
    raise exception 'Доступ только для админа';
  end if;

  select json_build_object(
    'avg_response_seconds', (
      select avg(extract(epoch from (first_join.first_joined_at - s.created_at)))
      from spots s
      join (
        select spot_id, min(joined_at) as first_joined_at
        from spot_volunteers
        group by spot_id
      ) first_join on first_join.spot_id = s.id
    ),

    'avg_mttr_seconds', (
      select avg(extract(epoch from (closed_at - created_at)))
      from spots
      where closed_at is not null
    ),

    'total_volunteers', (select count(distinct user_id) from spot_volunteers),
    'repeat_volunteers', (
      select count(*) from (
        select user_id
        from spot_volunteers
        group by user_id
        having count(distinct spot_id) > 1
      ) repeats
    ),

    'dau', (
      select count(distinct user_id) from (
        select created_by as user_id, created_at from spots where created_by is not null
        union all
        select user_id, joined_at as created_at from spot_volunteers
        union all
        select user_id, created_at from spot_messages where user_id is not null
      ) events
      where created_at >= now() - interval '1 day'
    ),

    'mau', (
      select count(distinct user_id) from (
        select created_by as user_id, created_at from spots where created_by is not null
        union all
        select user_id, joined_at as created_at from spot_volunteers
        union all
        select user_id, created_at from spot_messages where user_id is not null
      ) events
      where created_at >= now() - interval '30 days'
    )
  ) into result;

  return result;
end;
$$;

revoke all on function public.admin_dashboard_stats() from public;
grant execute on function public.admin_dashboard_stats() to authenticated;
