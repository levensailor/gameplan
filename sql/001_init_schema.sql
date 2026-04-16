create extension if not exists "pgcrypto";

create table if not exists app_users (
  id uuid primary key default gen_random_uuid(),
  webex_person_id text unique not null,
  first_name text not null,
  last_name text not null,
  email text unique not null,
  avatar_url text,
  last_login_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists planner_columns (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  display_order int not null check (display_order > 0),
  created_at timestamptz not null default now()
);

create table if not exists labels (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  color_hex text not null default '#38bdf8',
  created_at timestamptz not null default now()
);

create table if not exists cards (
  id uuid primary key default gen_random_uuid(),
  column_id uuid not null references planner_columns(id) on delete restrict,
  name text not null,
  description text,
  customer_name text,
  project_manager_name text,
  project_manager_email text,
  project_code text,
  engineering_hours numeric(10,2),
  notes text,
  due_date timestamptz,
  position int not null default 1000,
  created_by uuid references app_users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists card_engineers (
  card_id uuid not null references cards(id) on delete cascade,
  engineer_id uuid not null references app_users(id) on delete cascade,
  assigned_at timestamptz not null default now(),
  assigned_by uuid references app_users(id) on delete set null,
  primary key (card_id, engineer_id)
);

create table if not exists card_labels (
  card_id uuid not null references cards(id) on delete cascade,
  label_id uuid not null references labels(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (card_id, label_id)
);

create table if not exists card_links (
  id uuid primary key default gen_random_uuid(),
  card_id uuid not null references cards(id) on delete cascade,
  title text not null,
  url text not null,
  created_at timestamptz not null default now()
);

create table if not exists card_files (
  id uuid primary key default gen_random_uuid(),
  card_id uuid not null references cards(id) on delete cascade,
  file_name text not null,
  storage_path text not null,
  uploaded_by uuid references app_users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists history_log (
  id uuid primary key default gen_random_uuid(),
  card_id uuid not null references cards(id) on delete cascade,
  actor_user_id uuid references app_users(id) on delete set null,
  event_type text not null,
  previous_column_id uuid references planner_columns(id) on delete set null,
  new_column_id uuid references planner_columns(id) on delete set null,
  previous_engineer_id uuid references app_users(id) on delete set null,
  new_engineer_id uuid references app_users(id) on delete set null,
  note_text text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_cards_column_id on cards(column_id);
create index if not exists idx_cards_position on cards(column_id, position);
create index if not exists idx_cards_due_date on cards(due_date);
create index if not exists idx_card_engineers_engineer on card_engineers(engineer_id);
create index if not exists idx_history_log_card on history_log(card_id, created_at desc);
