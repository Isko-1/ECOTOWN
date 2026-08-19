-- Добавляет фиксацию времени закрытия метки (Этап 1: «Закрыть метку»)
alter table spots add column closed_at timestamptz;
