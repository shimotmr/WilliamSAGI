-- Search Intel phase 2: tag groups + collector run history

create table if not exists search_tag_groups (
  id text primary key,
  label text not null,
  tags jsonb not null default '[]'::jsonb,
  config jsonb not null default '{}'::jsonb,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists search_collector_runs (
  id uuid primary key default gen_random_uuid(),
  collector text not null default 'tag_intel',
  priority text not null,
  provider text not null,
  published boolean not null default false,
  tags_count integer not null default 0,
  sources_count integer not null default 0,
  entries_count integer not null default 0,
  errors_count integer not null default 0,
  status text not null default 'ok',
  output_path text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_search_collector_runs_created_at
  on search_collector_runs (created_at desc);

drop trigger if exists trg_search_tag_groups_updated_at on search_tag_groups;
create trigger trg_search_tag_groups_updated_at
before update on search_tag_groups
for each row execute function set_search_intel_updated_at();

alter table search_tag_groups enable row level security;
alter table search_collector_runs enable row level security;

drop policy if exists search_tag_groups_all on search_tag_groups;
create policy search_tag_groups_all on search_tag_groups for all using (true) with check (true);

drop policy if exists search_collector_runs_all on search_collector_runs;
create policy search_collector_runs_all on search_collector_runs for all using (true) with check (true);
