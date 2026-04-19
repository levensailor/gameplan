alter table app_users
  add column if not exists title text,
  add column if not exists skills text;
