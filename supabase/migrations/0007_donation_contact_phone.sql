-- Добавляем номера телефонов для профилей и заявок на донаты
alter table profiles add column if not exists phone text;
alter table spot_donations add column if not exists contact_phone text;
