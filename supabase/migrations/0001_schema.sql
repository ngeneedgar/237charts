-- 237 Charts — core schema (v1)
-- Postgres / Supabase. Public = read-only on published data; writes via service role only.

create extension if not exists "pgcrypto";

-- ---------- Enums ----------
create type platform as enum ('youtube', 'audiomack', 'spotify', 'boomplay', 'other');
create type week_status as enum ('draft', 'review', 'published');
create type movement as enum ('up', 'down', 'same', 'new', 're');
create type override_action as enum ('remove', 'adjust_score', 'merge_songs', 'change_genre', 'reinstate', 'other');
create type review_kind as enum ('artist_match', 'genre', 'song_merge', 'eligibility', 'anomaly');
create type review_status as enum ('pending', 'approved', 'rejected');

-- ---------- Reference ----------
create table genres (
  id          smallserial primary key,
  slug        text unique not null,          -- 'makossa'
  name_en     text not null,
  name_fr     text not null,
  sort_order  smallint not null default 0,
  chart_size  smallint not null default 20
);

create table methodology_versions (
  version        text primary key,           -- 'v1.0'
  effective_from date not null,
  weights_with_spotify    jsonb not null,    -- {"youtube":0.5,"audiomack":0.3,"spotify":0.2}
  weights_without_spotify jsonb not null,    -- {"youtube":0.6,"audiomack":0.4}
  eligibility_window_weeks smallint not null default 104,
  recurrent_after_weeks    smallint not null default 52,
  notes_en text,
  notes_fr text
);

-- ---------- Artists ----------
create table artists (
  id                uuid primary key default gen_random_uuid(),
  slug              text unique not null,
  name              text not null,
  verified          boolean not null default false,  -- verified Cameroonian artist
  eligibility_basis text,                            -- published reason (nationality/origin source)
  bio_en            text,
  bio_fr            text,
  image_url         text,
  created_at        timestamptz not null default now()
);

create table artist_channels (
  id          uuid primary key default gen_random_uuid(),
  artist_id   uuid not null references artists(id) on delete cascade,
  platform    platform not null,
  external_id text not null,                  -- YouTube channel id, Audiomack slug…
  url         text not null,
  official    boolean not null default true,  -- only official channels count
  unique (platform, external_id)
);

-- ---------- Songs ----------
create table songs (
  id           uuid primary key default gen_random_uuid(),
  slug         text unique not null,
  title        text not null,
  genre_id     smallint references genres(id),
  release_date date,
  artwork_url  text,
  created_at   timestamptz not null default now()
);

create table song_artists (
  song_id   uuid not null references songs(id) on delete cascade,
  artist_id uuid not null references artists(id) on delete cascade,
  role      text not null default 'primary' check (role in ('primary', 'featured')),
  position  smallint not null default 0,
  primary key (song_id, artist_id)
);

-- One song can have several sources (official video, lyric video, Audiomack track…)
create table song_sources (
  id          uuid primary key default gen_random_uuid(),
  song_id     uuid not null references songs(id) on delete cascade,
  channel_id  uuid references artist_channels(id),
  platform    platform not null,
  external_id text not null,                  -- YouTube video id, Audiomack track id
  url         text not null,
  counts      boolean not null default true,  -- false = link only (e.g. Spotify listen link)
  unique (platform, external_id)
);

-- ---------- Weekly data ----------
create table chart_weeks (
  id                   text primary key,      -- ISO week '2026-W47'
  start_date           date not null,
  end_date             date not null,
  status               week_status not null default 'draft',
  methodology_version  text not null references methodology_versions(version),
  published_at         timestamptz
);

-- Raw cumulative counter snapshots; weekly delta = this week − previous snapshot
create table source_snapshots (
  id           bigserial primary key,
  source_id    uuid not null references song_sources(id) on delete cascade,
  collected_at timestamptz not null default now(),
  total_count  bigint not null                -- lifetime views / plays at collection time
);
create index on source_snapshots (source_id, collected_at desc);

create table weekly_stats (
  week_id      text not null references chart_weeks(id) on delete cascade,
  source_id    uuid not null references song_sources(id) on delete cascade,
  weekly_count bigint not null,
  flagged      boolean not null default false,    -- anomaly detector hit
  primary key (week_id, source_id)
);

create table song_scores (
  week_id       text not null references chart_weeks(id) on delete cascade,
  song_id       uuid not null references songs(id) on delete cascade,
  score         numeric(10,2) not null,           -- 10,000 × Σ w_p × share_p
  platform_share jsonb not null,                  -- {"youtube":0.012,"audiomack":0.004}
  platform_counts jsonb not null,                 -- {"youtube":182000,"audiomack":9400}
  adjusted      boolean not null default false,   -- "Adjusted for irregular activity"
  eligible      boolean not null default true,
  primary key (week_id, song_id)
);

-- Published ranks. chart = 'overall' or a genre slug.
create table chart_entries (
  week_id        text not null references chart_weeks(id) on delete cascade,
  chart          text not null,
  rank           smallint not null,
  song_id        uuid not null references songs(id),
  last_week      smallint,
  peak           smallint not null,
  weeks_on_chart smallint not null,
  movement       movement not null,
  primary key (week_id, chart, rank),
  unique (week_id, chart, song_id)
);
create index on chart_entries (song_id);

-- ---------- Transparency & moderation ----------
create table overrides (                         -- public log
  id         uuid primary key default gen_random_uuid(),
  week_id    text references chart_weeks(id),
  song_id    uuid references songs(id),
  artist_id  uuid references artists(id),
  action     override_action not null,
  reason_en  text not null,
  reason_fr  text not null,
  created_at timestamptz not null default now()
);

create table review_queue (                      -- internal only
  id          uuid primary key default gen_random_uuid(),
  kind        review_kind not null,
  payload     jsonb not null,
  confidence  numeric(3,2),                      -- 0.60–0.89 lands here
  status      review_status not null default 'pending',
  note        text,
  created_at  timestamptz not null default now(),
  resolved_at timestamptz
);

-- ---------- Security: public read of published data only ----------
alter table genres               enable row level security;
alter table methodology_versions enable row level security;
alter table artists              enable row level security;
alter table artist_channels      enable row level security;
alter table songs                enable row level security;
alter table song_artists         enable row level security;
alter table song_sources         enable row level security;
alter table chart_weeks          enable row level security;
alter table source_snapshots     enable row level security;  -- no public policy
alter table weekly_stats         enable row level security;  -- no public policy
alter table song_scores          enable row level security;
alter table chart_entries        enable row level security;
alter table overrides            enable row level security;
alter table review_queue         enable row level security;  -- no public policy

create policy public_read on genres               for select using (true);
create policy public_read on methodology_versions for select using (true);
create policy public_read on artists              for select using (true);
create policy public_read on artist_channels      for select using (official);
create policy public_read on songs                for select using (true);
create policy public_read on song_artists         for select using (true);
create policy public_read on song_sources         for select using (true);
create policy public_read on chart_weeks          for select using (status = 'published');
create policy public_read on overrides            for select using (true);
create policy public_read on chart_entries for select using (
  exists (select 1 from chart_weeks w where w.id = week_id and w.status = 'published'));
create policy public_read on song_scores for select using (
  exists (select 1 from chart_weeks w where w.id = week_id and w.status = 'published'));
