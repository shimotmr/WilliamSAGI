-- Search Intel registry tables for SAGI

create or replace function set_search_intel_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create table if not exists search_sources (
  id text primary key,
  label text not null,
  enabled boolean not null default true,
  category text,
  domains jsonb not null default '[]'::jsonb,
  search_mode text,
  strict_domain_filter boolean not null default false,
  supports_deep_fetch boolean not null default false,
  priority text,
  adapter text,
  config jsonb not null default '{}'::jsonb,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists search_topics (
  id text primary key,
  label text not null,
  keywords jsonb not null default '[]'::jsonb,
  suggested_sources jsonb not null default '[]'::jsonb,
  default_time_range_days integer,
  default_level text,
  default_mode text,
  config jsonb not null default '{}'::jsonb,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists search_watchlist (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('account', 'site')),
  label text not null,
  source text,
  query text,
  site text,
  enabled boolean not null default true,
  config jsonb not null default '{}'::jsonb,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_search_watchlist_kind_sort
  on search_watchlist (kind, sort_order, created_at);

drop trigger if exists trg_search_sources_updated_at on search_sources;
create trigger trg_search_sources_updated_at
before update on search_sources
for each row execute function set_search_intel_updated_at();

drop trigger if exists trg_search_topics_updated_at on search_topics;
create trigger trg_search_topics_updated_at
before update on search_topics
for each row execute function set_search_intel_updated_at();

drop trigger if exists trg_search_watchlist_updated_at on search_watchlist;
create trigger trg_search_watchlist_updated_at
before update on search_watchlist
for each row execute function set_search_intel_updated_at();

alter table search_sources enable row level security;
alter table search_topics enable row level security;
alter table search_watchlist enable row level security;

drop policy if exists search_sources_all on search_sources;
create policy search_sources_all on search_sources for all using (true) with check (true);

drop policy if exists search_topics_all on search_topics;
create policy search_topics_all on search_topics for all using (true) with check (true);

drop policy if exists search_watchlist_all on search_watchlist;
create policy search_watchlist_all on search_watchlist for all using (true) with check (true);
