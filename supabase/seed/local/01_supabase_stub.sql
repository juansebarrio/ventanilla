-- SOLO para el cluster local de verificación. Stub mínimo de los schemas
-- auth y storage de Supabase, suficiente para aplicar las migraciones y
-- probar RLS. Nunca correr en producción.

create schema if not exists auth;

create table if not exists auth.users (
  id         uuid primary key,
  email      text unique,
  created_at timestamptz not null default now()
);

-- Réplica del auth.uid() de Supabase: lee el sub del JWT simulado con
-- set_config('request.jwt.claim.sub', ..., true).
create or replace function auth.uid()
returns uuid
language sql
stable
as $$
  select nullif(
    coalesce(
      current_setting('request.jwt.claim.sub', true),
      current_setting('request.jwt.claims', true)::jsonb ->> 'sub'
    ),
    ''
  )::uuid
$$;

create schema if not exists storage;

create table if not exists storage.buckets (
  id         text primary key,
  name       text,
  public     boolean default false,
  created_at timestamptz not null default now()
);

create table if not exists storage.objects (
  id         uuid primary key default gen_random_uuid(),
  bucket_id  text references storage.buckets (id),
  name       text,
  created_at timestamptz not null default now()
);
alter table storage.objects enable row level security;

create or replace function storage.foldername(name text)
returns text[]
language sql
immutable
as $$
  select (string_to_array(name, '/'))[1 : array_length(string_to_array(name, '/'), 1) - 1]
$$;

grant usage on schema auth to anon, authenticated, service_role;
grant usage on schema storage to anon, authenticated, service_role;
grant select on auth.users to authenticated, service_role;
grant all on storage.buckets, storage.objects to service_role;
grant select on storage.buckets, storage.objects to authenticated;

do $$
begin
  if not exists (select from pg_publication where pubname = 'supabase_realtime') then
    create publication supabase_realtime;
  end if;
end
$$;
