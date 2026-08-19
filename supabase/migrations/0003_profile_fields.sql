-- Расширяем профиль волонтёра: био и город для страницы /profile
alter table profiles add column bio text;
alter table profiles add column city text;
