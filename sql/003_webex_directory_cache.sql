create table if not exists webex_directory_cache (
  person_id text primary key,
  display_name text not null,
  first_name text,
  last_name text,
  email text,
  avatar_url text,
  title text,
  synced_at timestamptz not null default now()
);

create index if not exists idx_webex_directory_cache_name
  on webex_directory_cache (display_name);

create index if not exists idx_webex_directory_cache_email
  on webex_directory_cache (email);
