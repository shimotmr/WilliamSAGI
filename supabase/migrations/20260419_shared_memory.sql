-- Shared memory service MVP
-- Canonical long-term memory store for cross-agent retrieval and sync

create extension if not exists pg_trgm;

create table if not exists memory_events (
  id text primary key,
  source_system text not null,
  source_type text not null,
  source_ref text not null,
  agent text,
  title text,
  body text not null,
  event_time timestamptz,
  layer text not null default 'episodic',
  raw_payload jsonb not null default '{}'::jsonb,
  hash text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists memory_claims (
  id text primary key,
  source_system text not null,
  claim_text text not null,
  normalized_text text not null,
  layer text not null,
  claim_type text not null,
  scope text,
  status text not null default 'active',
  confidence double precision not null default 0.5,
  freshness double precision not null default 0.5,
  evidence_count integer not null default 1,
  contradiction_count integer not null default 0,
  access_count integer not null default 0,
  reinforcement_count integer not null default 0,
  version_fit double precision not null default 1.0,
  last_accessed_at timestamptz,
  superseded_by text,
  source_ref text,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists reference_items (
  id text primary key,
  source_system text not null,
  ref_type text not null,
  title text,
  source_ref text not null,
  content text not null,
  review_status text not null default 'unreviewed',
  quality_score double precision not null default 0.0,
  freshness double precision not null default 0.5,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists memory_relations (
  id text primary key,
  from_kind text not null,
  from_id text not null,
  relation text not null,
  to_kind text not null,
  to_id text not null,
  weight double precision not null default 1.0,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists memory_feedback (
  id text primary key,
  claim_id text not null references memory_claims(id),
  actor text not null,
  action text not null,
  correction_text text,
  evidence_ref text,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists memory_import_runs (
  id text primary key,
  importer text not null,
  source_system text not null,
  checkpoint_id text,
  item_count integer not null default 0,
  status text not null default 'ok',
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists agent_profiles (
  name text primary key,
  config_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_memory_claims_layer on memory_claims(layer);
create index if not exists idx_memory_claims_type on memory_claims(claim_type);
create index if not exists idx_memory_claims_status on memory_claims(status);
create index if not exists idx_memory_claims_confidence on memory_claims(confidence desc);
create index if not exists idx_memory_claims_source on memory_claims(source_system, source_ref);
create index if not exists idx_memory_events_source on memory_events(source_system, source_type);
create index if not exists idx_reference_items_review on reference_items(review_status);
create index if not exists idx_reference_items_source on reference_items(source_system, source_ref);
create index if not exists idx_memory_relations_from on memory_relations(from_kind, from_id);
create index if not exists idx_memory_relations_to on memory_relations(to_kind, to_id);
create index if not exists idx_memory_import_runs_created_at on memory_import_runs(created_at desc);

create index if not exists idx_memory_claims_claim_text_trgm on memory_claims using gin (claim_text gin_trgm_ops);
create index if not exists idx_memory_claims_normalized_text_trgm on memory_claims using gin (normalized_text gin_trgm_ops);
create index if not exists idx_reference_items_title_trgm on reference_items using gin (coalesce(title, '') gin_trgm_ops);
create index if not exists idx_reference_items_content_trgm on reference_items using gin (content gin_trgm_ops);

create or replace function set_shared_memory_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_memory_claims_updated_at on memory_claims;
create trigger trg_memory_claims_updated_at
before update on memory_claims
for each row execute function set_shared_memory_updated_at();

drop trigger if exists trg_reference_items_updated_at on reference_items;
create trigger trg_reference_items_updated_at
before update on reference_items
for each row execute function set_shared_memory_updated_at();

drop trigger if exists trg_agent_profiles_updated_at on agent_profiles;
create trigger trg_agent_profiles_updated_at
before update on agent_profiles
for each row execute function set_shared_memory_updated_at();

alter table memory_events enable row level security;
alter table memory_claims enable row level security;
alter table reference_items enable row level security;
alter table memory_relations enable row level security;
alter table memory_feedback enable row level security;
alter table memory_import_runs enable row level security;
alter table agent_profiles enable row level security;

drop policy if exists memory_events_all on memory_events;
create policy memory_events_all on memory_events for all using (true) with check (true);

drop policy if exists memory_claims_all on memory_claims;
create policy memory_claims_all on memory_claims for all using (true) with check (true);

drop policy if exists reference_items_all on reference_items;
create policy reference_items_all on reference_items for all using (true) with check (true);

drop policy if exists memory_relations_all on memory_relations;
create policy memory_relations_all on memory_relations for all using (true) with check (true);

drop policy if exists memory_feedback_all on memory_feedback;
create policy memory_feedback_all on memory_feedback for all using (true) with check (true);

drop policy if exists memory_import_runs_all on memory_import_runs;
create policy memory_import_runs_all on memory_import_runs for all using (true) with check (true);

drop policy if exists agent_profiles_all on agent_profiles;
create policy agent_profiles_all on agent_profiles for all using (true) with check (true);

create or replace function hub_memory_search(
  query_text text,
  agent_name text default 'codex',
  max_results integer default 10
)
returns table (
  kind text,
  uid text,
  title text,
  text text,
  source_system text,
  source_ref text,
  layer text,
  claim_type text,
  status text,
  review_status text,
  score double precision
)
language sql
stable
as $$
  with q as (
    select trim(query_text) as raw_query, lower(trim(query_text)) as normalized_query
  ),
  claim_hits as (
    select
      'claim'::text as kind,
      mc.id as uid,
      mc.claim_type as title,
      mc.claim_text as text,
      mc.source_system,
      coalesce(mc.source_ref, '') as source_ref,
      mc.layer,
      mc.claim_type,
      mc.status,
      null::text as review_status,
      (
        greatest(
          similarity(mc.claim_text, q.raw_query),
          similarity(mc.normalized_text, q.normalized_query)
        )
        + case when mc.claim_text ilike '%' || q.raw_query || '%' then 0.45 else 0 end
        + case when mc.layer = 'procedural' then 0.12 when mc.layer = 'semantic' then 0.08 else 0 end
        + case when mc.status = 'active' then 0.05 else -0.25 end
        + least(mc.confidence, 1.0) * 0.15
      )::double precision as score
    from memory_claims mc
    cross join q
    where
      mc.claim_text % q.raw_query
      or mc.normalized_text % q.normalized_query
      or mc.claim_text ilike '%' || q.raw_query || '%'
  ),
  reference_hits as (
    select
      'reference'::text as kind,
      ri.id as uid,
      coalesce(ri.title, ri.ref_type) as title,
      ri.content as text,
      ri.source_system,
      ri.source_ref,
      null::text as layer,
      null::text as claim_type,
      null::text as status,
      ri.review_status,
      (
        greatest(
          similarity(coalesce(ri.title, ''), q.raw_query),
          similarity(ri.content, q.raw_query)
        )
        + case when ri.content ilike '%' || q.raw_query || '%' then 0.3 else 0 end
        + least(ri.quality_score, 1.0) * 0.12
      )::double precision as score
    from reference_items ri
    cross join q
    where
      coalesce(ri.title, '') % q.raw_query
      or ri.content % q.raw_query
      or ri.content ilike '%' || q.raw_query || '%'
  )
  select *
  from (
    select * from claim_hits
    union all
    select * from reference_hits
  ) combined
  order by score desc, uid asc
  limit greatest(1, least(max_results, 50));
$$;
