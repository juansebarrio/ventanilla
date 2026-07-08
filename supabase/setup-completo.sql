-- ============================================================================
-- Ventanilla · setup completo para el SQL Editor de Supabase
--
-- Concatena supabase/migrations/*.sql + supabase/seed/seed.sql y agrega la
-- membresía de la usuaria del panel. Pensado para correrse UNA vez, entero,
-- en Dashboard → SQL Editor de un proyecto nuevo.
--
-- ANTES de correrlo: creá la usuaria del panel en Authentication → Users →
-- Add user → Create new user, con email carla@iribarne.ar, la contraseña que
-- quieras y "Auto Confirm User" tildado.
--
-- Si algo falla, el SQL Editor revierte todo: corregí y volvé a correrlo.
-- Si ya corrió bien una vez, NO lo repitas entero; para refrescar los datos
-- del demo alcanza con supabase/seed/seed.sql (o el reset diario).
--
-- Archivo generado por scripts/generar-setup-completo.sh — no editar a mano.
-- ============================================================================

-- ────────────────────────────────────────────────────────────────────────────
-- supabase/migrations/20260707000001_extensions.sql
-- ────────────────────────────────────────────────────────────────────────────
-- Extensiones requeridas.
-- uuid-ossp: uuid_generate_v5 para los IDs determinísticos del seed.
-- gen_random_uuid() ya es built-in en Postgres 16.
create extension if not exists "uuid-ossp";

-- ────────────────────────────────────────────────────────────────────────────
-- supabase/migrations/20260707000002_schema.sql
-- ────────────────────────────────────────────────────────────────────────────
-- Schema base de Ventanilla. Multi-tenant real: toda tabla de dominio
-- cuelga de administration_id y habilita RLS desde su creación.
-- Estados/urgencias/etc. van como text + CHECK con nombre (evolución simple).

-- ── administrations ─────────────────────────────────────────────────────────
create table public.administrations (
  id         uuid primary key default gen_random_uuid(),
  nombre     text not null,
  slug       text not null unique,
  is_demo    boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.administrations enable row level security;

-- ── members ──────────────────────────────────────────────────────────────────
create table public.members (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references auth.users (id) on delete cascade,
  administration_id uuid not null references public.administrations (id) on delete cascade,
  rol               text not null default 'admin'
                    constraint members_rol_check check (rol in ('admin')),
  created_at        timestamptz not null default now(),
  unique (user_id, administration_id)
);
create index members_administration_idx on public.members (administration_id);
alter table public.members enable row level security;

-- ── buildings ────────────────────────────────────────────────────────────────
create table public.buildings (
  id                uuid primary key default gen_random_uuid(),
  administration_id uuid not null references public.administrations (id) on delete cascade,
  direccion         text not null,
  alias             text not null,
  total_unidades    smallint not null,
  created_at        timestamptz not null default now(),
  unique (administration_id, alias)
);
create index buildings_administration_idx on public.buildings (administration_id);
alter table public.buildings enable row level security;

-- ── units ────────────────────────────────────────────────────────────────────
create table public.units (
  id                uuid primary key default gen_random_uuid(),
  administration_id uuid not null references public.administrations (id) on delete cascade,
  building_id       uuid not null references public.buildings (id) on delete cascade,
  piso              text not null,
  letra             text,
  uf_numero         smallint not null,
  created_at        timestamptz not null default now(),
  unique (building_id, uf_numero)
);
create index units_building_idx on public.units (building_id);
create index units_administration_idx on public.units (administration_id);
alter table public.units enable row level security;

-- ── residents ────────────────────────────────────────────────────────────────
-- El teléfono se guarda completo (E.164); la interfaz siempre lo enmascara.
create table public.residents (
  id                uuid primary key default gen_random_uuid(),
  administration_id uuid not null references public.administrations (id) on delete cascade,
  unit_id           uuid references public.units (id) on delete set null,
  nombre            text not null,
  telefono          text not null,
  verificado        boolean not null default false,
  created_at        timestamptz not null default now(),
  unique (administration_id, telefono)
);
create index residents_unit_idx on public.residents (unit_id);
create index residents_administration_idx on public.residents (administration_id);
alter table public.residents enable row level security;

-- ── categories ───────────────────────────────────────────────────────────────
create table public.categories (
  id                 uuid primary key default gen_random_uuid(),
  administration_id  uuid not null references public.administrations (id) on delete cascade,
  nombre             text not null,
  urgencia_default   text not null
                     constraint categories_urgencia_check
                     check (urgencia_default in ('urgente', 'alta', 'media', 'baja')),
  ot_automatica      boolean not null default false,
  emergencia_posible boolean not null default false,
  created_at         timestamptz not null default now(),
  unique (administration_id, nombre)
);
create index categories_administration_idx on public.categories (administration_id);
alter table public.categories enable row level security;

-- ── claims ───────────────────────────────────────────────────────────────────
-- created_at ES el timestamp de "recibido". El resto de las transiciones
-- tiene columna propia; los KPIs (primera respuesta, resolución promedio)
-- salen de acá, no del log narrativo de claim_events.
create table public.claims (
  id                   uuid primary key default gen_random_uuid(),
  administration_id    uuid not null references public.administrations (id) on delete cascade,
  numero_publico       text not null,
  titulo               text not null,
  categoria_id         uuid references public.categories (id) on delete set null,
  urgencia             text not null
                       constraint claims_urgencia_check
                       check (urgencia in ('urgente', 'alta', 'media', 'baja')),
  ambito               text not null
                       constraint claims_ambito_check
                       check (ambito in ('comun', 'privado')),
  estado               text not null default 'recibido'
                       constraint claims_estado_check
                       check (estado in ('recibido', 'en_gestion', 'asignado', 'resuelto',
                                         'cerrado', 'reabierto', 'derivado')),
  building_id          uuid not null references public.buildings (id) on delete restrict,
  unit_id              uuid references public.units (id) on delete set null,
  resident_id          uuid references public.residents (id) on delete set null,
  origen               text not null
                       constraint claims_origen_check
                       check (origen in ('simulador', 'whatsapp', 'manual')),
  is_seed              boolean not null default false,
  primera_respuesta_at timestamptz,
  en_gestion_at        timestamptz,
  asignado_at          timestamptz,
  resuelto_at          timestamptz,
  cerrado_at           timestamptz,
  reabierto_at         timestamptz,
  derivado_at          timestamptz,
  ultima_actividad_at  timestamptz not null default now(),
  created_at           timestamptz not null default now(),
  unique (administration_id, numero_publico)
);
create index claims_admin_estado_idx on public.claims (administration_id, estado);
create index claims_admin_actividad_idx on public.claims (administration_id, ultima_actividad_at desc);
create index claims_building_idx on public.claims (building_id);
create index claims_unit_idx on public.claims (unit_id);
create index claims_resident_idx on public.claims (resident_id);
create index claims_categoria_idx on public.claims (categoria_id);
alter table public.claims enable row level security;

-- ── claim_messages ───────────────────────────────────────────────────────────
-- La hora del mensaje es created_at. Para audio, contenido guarda la
-- duración legible ("0:38") y transcripcion el texto; para foto, contenido
-- guarda el nombre de archivo y media_path la ruta en Storage.
create table public.claim_messages (
  id                uuid primary key default gen_random_uuid(),
  administration_id uuid not null references public.administrations (id) on delete cascade,
  claim_id          uuid not null references public.claims (id) on delete cascade,
  direccion         text not null
                    constraint claim_messages_direccion_check
                    check (direccion in ('entrada', 'salida')),
  tipo              text not null
                    constraint claim_messages_tipo_check
                    check (tipo in ('texto', 'audio', 'foto')),
  contenido         text,
  transcripcion     text,
  media_path        text,
  is_seed           boolean not null default false,
  created_at        timestamptz not null default now()
);
create index claim_messages_claim_idx on public.claim_messages (claim_id, created_at);
create index claim_messages_administration_idx on public.claim_messages (administration_id);
alter table public.claim_messages enable row level security;

-- ── claim_events ─────────────────────────────────────────────────────────────
-- Log narrativo. tipo queda abierto a propósito ('alta', 'clasificacion',
-- 'aprobacion', 'ot_creada', 'estado', 'visita_confirmada', 'nota', ...).
-- El feed "Últimos movimientos" es el top 5 por created_at desc.
create table public.claim_events (
  id                uuid primary key default gen_random_uuid(),
  administration_id uuid not null references public.administrations (id) on delete cascade,
  claim_id          uuid not null references public.claims (id) on delete cascade,
  tipo              text not null,
  texto             text not null,
  actor             text not null default 'Sistema',
  is_seed           boolean not null default false,
  created_at        timestamptz not null default now()
);
create index claim_events_claim_idx on public.claim_events (claim_id, created_at);
create index claim_events_feed_idx on public.claim_events (administration_id, created_at desc);
alter table public.claim_events enable row level security;

-- ── providers ────────────────────────────────────────────────────────────────
create table public.providers (
  id                uuid primary key default gen_random_uuid(),
  administration_id uuid not null references public.administrations (id) on delete cascade,
  nombre            text not null,
  rubro             text not null,
  contacto          text not null,
  created_at        timestamptz not null default now(),
  unique (administration_id, nombre)
);
create index providers_administration_idx on public.providers (administration_id);
alter table public.providers enable row level security;

-- ── provider_buildings ───────────────────────────────────────────────────────
create table public.provider_buildings (
  administration_id uuid not null references public.administrations (id) on delete cascade,
  provider_id       uuid not null references public.providers (id) on delete cascade,
  building_id       uuid not null references public.buildings (id) on delete cascade,
  created_at        timestamptz not null default now(),
  primary key (provider_id, building_id)
);
create index provider_buildings_administration_idx on public.provider_buildings (administration_id);
alter table public.provider_buildings enable row level security;

-- ── work_orders ──────────────────────────────────────────────────────────────
create table public.work_orders (
  id                uuid primary key default gen_random_uuid(),
  administration_id uuid not null references public.administrations (id) on delete cascade,
  numero_publico    text not null,
  claim_id          uuid not null references public.claims (id) on delete cascade,
  provider_id       uuid not null references public.providers (id) on delete restrict,
  texto_enviado     text not null,
  estado            text not null default 'enviada'
                    constraint work_orders_estado_check
                    check (estado in ('enviada', 'confirmada', 'completada', 'cancelada')),
  visita_confirmada text,
  is_seed           boolean not null default false,
  created_at        timestamptz not null default now(),
  unique (administration_id, numero_publico)
);
create index work_orders_claim_idx on public.work_orders (claim_id);
create index work_orders_administration_idx on public.work_orders (administration_id);
alter table public.work_orders enable row level security;

-- ── arrears ──────────────────────────────────────────────────────────────────
-- resident_nombre es un snapshot denormalizado a propósito: la morosidad
-- del demo es una foto, no un libro mayor.
create table public.arrears (
  id                 uuid primary key default gen_random_uuid(),
  administration_id  uuid not null references public.administrations (id) on delete cascade,
  building_id        uuid not null references public.buildings (id) on delete cascade,
  unit_id            uuid references public.units (id) on delete set null,
  resident_nombre    text not null,
  periodos_adeudados smallint not null,
  monto              integer not null,
  created_at         timestamptz not null default now()
);
create index arrears_admin_building_idx on public.arrears (administration_id, building_id);
alter table public.arrears enable row level security;

-- ── rate_limits ──────────────────────────────────────────────────────────────
-- Protección del simulador público (tanda 5). Sin administration_id:
-- es un cap del deployment. Solo la toca el service role.
create table public.rate_limits (
  scope        text not null
               constraint rate_limits_scope_check
               check (scope in ('ip_minute', 'ip_day', 'global_day')),
  bucket_key   text not null,
  window_start timestamptz not null,
  count        integer not null default 0,
  created_at   timestamptz not null default now(),
  primary key (scope, bucket_key, window_start)
);
alter table public.rate_limits enable row level security;

-- ────────────────────────────────────────────────────────────────────────────
-- supabase/migrations/20260707000003_numbering.sql
-- ────────────────────────────────────────────────────────────────────────────
-- Numeración correlativa por administración, a prueba de concurrencia.
-- El INSERT ... ON CONFLICT DO UPDATE toma lock de fila: dos transacciones
-- concurrentes se serializan en el contador de esa administración.
-- Un rollback consume el número (queda hueco): aceptado y documentado.

create table public.counters (
  administration_id uuid   not null references public.administrations (id) on delete cascade,
  scope             text   not null
                    constraint counters_scope_check check (scope in ('claim', 'work_order')),
  value             bigint not null,
  created_at        timestamptz not null default now(),
  primary key (administration_id, scope)
);
-- RLS activa sin policies: solo la función SECURITY DEFINER y el service role.
alter table public.counters enable row level security;

-- El valor semilla ES el primer número usable: la primera llamada de una
-- administración nueva devuelve 1040 (claims) o 311 (órdenes de trabajo).
create or replace function public.next_public_number(p_administration_id uuid, p_scope text)
returns bigint
language sql
security definer
set search_path = public
as $$
  insert into counters as c (administration_id, scope, value)
  values (
    p_administration_id,
    p_scope,
    case p_scope when 'claim' then 1040 when 'work_order' then 311 else 1 end
  )
  on conflict (administration_id, scope)
    do update set value = c.value + 1
  returning c.value;
$$;

-- La función se invoca solo desde el trigger assign_public_number, que es
-- SECURITY DEFINER y corre como owner: por eso ningún rol de aplicación
-- necesita EXECUTE directo. Se revoca a authenticated además de public/anon
-- para que un usuario autenticado no pueda tocar por RPC el contador de otra
-- administración (la función omite la RLS de counters al correr como owner).
revoke execute on function public.next_public_number(uuid, text)
  from public, anon, authenticated;

-- Trigger parametrizado: tg_argv[0] = scope, tg_argv[1] = prefijo.
-- Solo actúa si numero_publico viene NULL (el seed inserta números explícitos).
create or replace function public.assign_public_number()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.numero_publico is null then
    new.numero_publico := tg_argv[1] || '-'
      || public.next_public_number(new.administration_id, tg_argv[0]);
  end if;
  return new;
end;
$$;

create trigger claims_assign_number
  before insert on public.claims
  for each row execute function public.assign_public_number('claim', 'R');

create trigger work_orders_assign_number
  before insert on public.work_orders
  for each row execute function public.assign_public_number('work_order', 'OT');

-- Nota: el trigger BEFORE INSERT completa el valor antes de que se valide
-- el NOT NULL de numero_publico, así que insertar con NULL es válido.

-- ────────────────────────────────────────────────────────────────────────────
-- supabase/migrations/20260707000004_rls.sql
-- ────────────────────────────────────────────────────────────────────────────
-- Policies de RLS. Patrón: acceso total para miembros autenticados de la
-- administración; anon sin policies = deny total. El simulador público y
-- el webhook de WhatsApp escriben con service role (bypassa RLS) desde
-- route handlers del servidor, filtrando el tenant demo en código.

-- SECURITY DEFINER: lee members sin re-evaluar la policy de members
-- (evita recursión) y sirve también para las policies de storage.objects.
create or replace function public.is_member(p_administration_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from members
    where user_id = auth.uid()
      and administration_id = p_administration_id
  );
$$;

-- administrations: los miembros solo leen (nadie muta administraciones
-- desde el panel en fase 0).
create policy administrations_member_select on public.administrations
  for select to authenticated
  using (public.is_member(id));

-- members: cada uno ve sus propias membresías. Comparación directa con
-- auth.uid() (sin is_member) para no recursar. Altas solo via service role.
create policy members_own_select on public.members
  for select to authenticated
  using (user_id = auth.uid());

-- Patrón de tablas de dominio.
create policy buildings_member_all on public.buildings
  for all to authenticated
  using (public.is_member(administration_id))
  with check (public.is_member(administration_id));

create policy units_member_all on public.units
  for all to authenticated
  using (public.is_member(administration_id))
  with check (public.is_member(administration_id));

create policy residents_member_all on public.residents
  for all to authenticated
  using (public.is_member(administration_id))
  with check (public.is_member(administration_id));

create policy categories_member_all on public.categories
  for all to authenticated
  using (public.is_member(administration_id))
  with check (public.is_member(administration_id));

create policy claims_member_all on public.claims
  for all to authenticated
  using (public.is_member(administration_id))
  with check (public.is_member(administration_id));

create policy claim_messages_member_all on public.claim_messages
  for all to authenticated
  using (public.is_member(administration_id))
  with check (public.is_member(administration_id));

create policy claim_events_member_all on public.claim_events
  for all to authenticated
  using (public.is_member(administration_id))
  with check (public.is_member(administration_id));

create policy providers_member_all on public.providers
  for all to authenticated
  using (public.is_member(administration_id))
  with check (public.is_member(administration_id));

create policy provider_buildings_member_all on public.provider_buildings
  for all to authenticated
  using (public.is_member(administration_id))
  with check (public.is_member(administration_id));

create policy work_orders_member_all on public.work_orders
  for all to authenticated
  using (public.is_member(administration_id))
  with check (public.is_member(administration_id));

create policy arrears_member_all on public.arrears
  for all to authenticated
  using (public.is_member(administration_id))
  with check (public.is_member(administration_id));

-- counters y rate_limits: RLS activa y CERO policies a propósito.
-- Solo la función SECURITY DEFINER y el service role los tocan.

-- ────────────────────────────────────────────────────────────────────────────
-- supabase/migrations/20260707000005_realtime.sql (tolerante para el Dashboard)
-- ────────────────────────────────────────────────────────────────────────────
alter table public.claims         replica identity full;
alter table public.claim_messages replica identity full;
alter table public.claim_events   replica identity full;

do $$
begin
  alter publication supabase_realtime
    add table public.claims, public.claim_messages, public.claim_events;
exception
  when duplicate_object then
    null; -- ya estaban en la publicación
  when others then
    raise notice 'No se pudo tocar la publicación de Realtime (%). Activala a mano: Dashboard → Database → Publications → supabase_realtime → habilitar claims, claim_messages y claim_events.', sqlerrm;
end
$$;

-- ────────────────────────────────────────────────────────────────────────────
-- supabase/migrations/20260707000006_storage.sql (tolerante para el Dashboard)
-- ────────────────────────────────────────────────────────────────────────────
-- Bucket privado para media de reclamos (fotos y audios).
-- Convención de path: <administration_id>/<claim_id>/<archivo>.
-- Lectura: miembros de la administración. Escritura: solo service role.

do $$
begin
  insert into storage.buckets (id, name, public)
  values ('claim-media', 'claim-media', false)
  on conflict (id) do nothing;
exception
  when others then
    raise notice 'No se pudo crear el bucket (%). Crealo a mano: Dashboard → Storage → New bucket, nombre claim-media, privado.', sqlerrm;
end
$$;

do $$
begin
  execute $pol$
    create policy claim_media_member_read on storage.objects
      for select to authenticated
      using (
        bucket_id = 'claim-media'
        and public.is_member(((storage.foldername(name))[1])::uuid)
      )
  $pol$;
exception
  when duplicate_object then
    null; -- ya existe
  when others then
    raise notice 'No se pudo crear la policy de lectura de storage (%). Crearla a mano: Dashboard → Storage → Policies → claim-media → New policy (SELECT, rol authenticated) con la condición: bucket_id = ''claim-media'' and public.is_member(((storage.foldername(name))[1])::uuid)', sqlerrm;
end
$$;

-- ────────────────────────────────────────────────────────────────────────────
-- supabase/migrations/20260708000001_demo.sql
-- ────────────────────────────────────────────────────────────────────────────
-- Funciones del demo público: rate limit del simulador y reset diario.
-- Ambas son SECURITY DEFINER y sin EXECUTE para roles de aplicación: las
-- invoca únicamente el service role desde los route handlers.

-- ── Rate limit ───────────────────────────────────────────────────────────────
-- Incrementa el contador del bucket (scope + clave + ventana) de forma
-- atómica y devuelve el conteo resultante. El llamador decide el límite.
create or replace function public.rate_limit_hit(
  p_scope text,
  p_bucket_key text,
  p_window_start timestamptz
)
returns integer
language sql
security definer
set search_path = public
as $$
  insert into rate_limits as r (scope, bucket_key, window_start, count)
  values (p_scope, p_bucket_key, p_window_start, 1)
  on conflict (scope, bucket_key, window_start)
    do update set count = r.count + 1
  returning r.count;
$$;

revoke execute on function public.rate_limit_hit(text, text, timestamptz)
  from public, anon, authenticated;

-- Limpieza de ventanas viejas (la llama el reset diario).
create or replace function public.rate_limit_purga(p_antes timestamptz)
returns void
language sql
security definer
set search_path = public
as $$
  delete from rate_limits where window_start < p_antes;
$$;

revoke execute on function public.rate_limit_purga(timestamptz)
  from public, anon, authenticated;

-- ── Reset del tenant demo ────────────────────────────────────────────────────
-- 1. Borra todo lo no sembrado (reclamos del simulador y actividad de la
--    demo sobre reclamos del seed: OTs, eventos, mensajes).
-- 2. Re-ancla las fechas del seed al día de hoy en Buenos Aires (el timeline
--    de R-1044 siempre dice "hoy 14:02").
-- 3. Restaura estado y transiciones canónicas de los reclamos visibles y de
--    los históricos, por si la demo los mutó desde el panel.
-- 4. Restaura los contadores (próximos R-1049 y OT-312) y purga rate limits.
create or replace function public.demo_reset()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_admin uuid;
  v_shift interval;
begin
  select id into v_admin from administrations where slug = 'iribarne' and is_demo;
  if v_admin is null then
    raise exception 'No existe la administración demo';
  end if;

  -- 1. Fuera lo que no es del seed. El delete de claims cascadea sus
  -- mensajes, eventos y órdenes.
  delete from claims where administration_id = v_admin and not is_seed;
  delete from work_orders where administration_id = v_admin and not is_seed;
  delete from claim_events where administration_id = v_admin and not is_seed;
  delete from claim_messages where administration_id = v_admin and not is_seed;

  -- 2. Re-anclar fechas: el corrimiento se calcula sobre R-1044 (su
  -- created_at nunca lo muta el panel).
  select (
    (now() at time zone 'America/Argentina/Buenos_Aires')::date
    - ((created_at at time zone 'America/Argentina/Buenos_Aires')::date)
  ) * interval '1 day'
  into v_shift
  from claims
  where administration_id = v_admin and numero_publico = 'R-1044' and is_seed;

  v_shift := coalesce(v_shift, interval '0');

  if v_shift <> interval '0' then
    update claims set
      created_at = created_at + v_shift,
      primera_respuesta_at = primera_respuesta_at + v_shift,
      en_gestion_at = en_gestion_at + v_shift,
      asignado_at = asignado_at + v_shift,
      resuelto_at = resuelto_at + v_shift,
      cerrado_at = cerrado_at + v_shift,
      reabierto_at = reabierto_at + v_shift,
      derivado_at = derivado_at + v_shift,
      ultima_actividad_at = ultima_actividad_at + v_shift
    where administration_id = v_admin and is_seed;

    update claim_messages set created_at = created_at + v_shift
    where administration_id = v_admin and is_seed;

    update claim_events set created_at = created_at + v_shift
    where administration_id = v_admin and is_seed;

    update work_orders set created_at = created_at + v_shift
    where administration_id = v_admin and is_seed;
  end if;

  -- 3a. Restaurar los nueve visibles: estado y transiciones como offsets
  -- desde created_at (los offsets reproducen las horas del seed).
  update claims c set
    estado = v.estado,
    primera_respuesta_at = case when v.con_respuesta
      then c.created_at + interval '38 seconds' else null end,
    en_gestion_at = case when v.eg_seg is null
      then null else c.created_at + make_interval(secs => v.eg_seg) end,
    asignado_at = case when v.asig_seg is null
      then null else c.created_at + make_interval(secs => v.asig_seg) end,
    resuelto_at = case when v.res_seg is null
      then null else c.created_at + make_interval(secs => v.res_seg) end,
    cerrado_at = case when v.cer_seg is null
      then null else c.created_at + make_interval(secs => v.cer_seg) end,
    reabierto_at = null,
    derivado_at = case when v.der_seg is null
      then null else c.created_at + make_interval(secs => v.der_seg) end,
    ultima_actividad_at = c.created_at + make_interval(secs => v.ult_seg)
  from (values
    -- Offsets en segundos desde created_at, reproduciendo las horas del seed.
    -- numero, estado, con_respuesta, eg_seg, asig_seg, res_seg, cer_seg, der_seg, ult_seg
    ('R-1040', 'derivado',   false, null::int, null::int, null::int, null::int, 3180::int, 3180::int),
    ('R-1041', 'cerrado',    false, null, null, null, 172800, null, 172800),
    ('R-1042', 'resuelto',   true,  53400, 62700, 70020, null, null, 70020),
    ('R-1043', 'recibido',   false, null, null, null, null, null, 0),
    ('R-1044', 'asignado',   true,  1718, 1838, null, null, null, 4178),
    ('R-1045', 'asignado',   true,  2700, 4800, null, null, null, 4800),
    ('R-1046', 'en_gestion', true,  900,  null, null, null, null, 900),
    ('R-1047', 'recibido',   false, null, null, null, null, null, 0),
    ('R-1048', 'recibido',   false, null, null, null, null, null, 0)
  ) as v (numero, estado, con_respuesta, eg_seg, asig_seg, res_seg, cer_seg, der_seg, ult_seg)
  where c.administration_id = v_admin and c.is_seed and c.numero_publico = v.numero;

  -- 3b. Históricos: siempre cerrados, sin transiciones intermedias.
  update claims set
    estado = 'cerrado',
    primera_respuesta_at = created_at + interval '38 seconds',
    en_gestion_at = null,
    asignado_at = null,
    resuelto_at = null,
    reabierto_at = null,
    derivado_at = null,
    ultima_actividad_at = cerrado_at
  where administration_id = v_admin
    and is_seed
    and numero_publico < 'R-1040'
    and cerrado_at is not null;

  -- 4. Contadores y rate limits.
  insert into counters (administration_id, scope, value)
  values (v_admin, 'claim', 1048), (v_admin, 'work_order', 311)
  on conflict (administration_id, scope) do update set value = excluded.value;

  perform rate_limit_purga(now() - interval '2 days');
end;
$$;

revoke execute on function public.demo_reset() from public, anon, authenticated;

-- ────────────────────────────────────────────────────────────────────────────
-- supabase/migrations/20260708000002_whatsapp.sql
-- ────────────────────────────────────────────────────────────────────────────
-- Adaptador de WhatsApp (tanda 6).
--
-- wa_sessions: estado del alta conversacional de vecinos. Un número que
-- escribe y no está registrado va pasando por edificio → unidad → nombre;
-- acá se guarda en qué paso está y lo que ya contestó. Solo la toca el
-- service role desde el webhook (RLS activa sin policies).
--
-- claim_messages.wa_message_id: id del mensaje de Meta (wamid) para
-- descartar reintentos del webhook sin duplicar mensajes.

create table public.wa_sessions (
  id                uuid primary key default gen_random_uuid(),
  administration_id uuid not null references public.administrations (id) on delete cascade,
  telefono          text not null,
  paso              text not null
                    constraint wa_sessions_paso_check
                    check (paso in ('edificio', 'unidad', 'nombre', 'completo')),
  datos             jsonb not null default '{}'::jsonb,
  ultimo_wamid      text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  unique (administration_id, telefono)
);
alter table public.wa_sessions enable row level security;

alter table public.claim_messages add column wa_message_id text;
create unique index claim_messages_wamid_idx
  on public.claim_messages (wa_message_id)
  where wa_message_id is not null;

-- ────────────────────────────────────────────────────────────────────────────
-- supabase/seed/seed.sql
-- ────────────────────────────────────────────────────────────────────────────
-- ═══════════════════════════════════════════════════════════════════════════
-- Seed del tenant demo (Administración Iribarne).
--
-- Idempotente y re-ejecutable: sirve como seed inicial y como reset diario.
-- Toda fila lleva un UUID determinístico (uuid v5) y un ON CONFLICT DO UPDATE
-- que restaura las columnas mutables si la demo las tocó. Las fechas son
-- relativas al día de ejecución en America/Argentina/Buenos_Aires, así el
-- timeline de R-1044 siempre dice "hoy 14:02".
--
-- Decisiones tomadas contra design-reference (no re-litigar):
--   · La visita de R-1044 se confirma 15:12 (el feed del export decía 12:15,
--     inconsistente con el detalle, que es canónico).
--   · R-1042 se marca Resuelto hoy 13:47 (la bandeja decía "ayer"; el feed
--     del export dice hoy 13:47, canónico).
--   · El feed "Últimos movimientos" del panel excluye eventos de tipo
--     'clasificacion' (detalle interno); el timeline del detalle excluye
--     'alta' y 'visita_confirmada' (los cubren las burbujas de mensajes).
--   · ot_automatica queda en false para todas las categorías: en la demo
--     toda OT sale con aprobación de Carla, como muestra el prototipo.
--   · El título del reclamo es el de la bandeja ("Filtración en pared del
--     living, viene de arriba"); el detalle del export mostraba una versión
--     corta en el h1.
-- ═══════════════════════════════════════════════════════════════════════════

begin;

-- ── Helpers temporales ───────────────────────────────────────────────────────

-- UUID determinístico por clave legible: misma corrida, mismos IDs.
create or replace function pg_temp.vid(k text) returns uuid
language sql immutable as
$$ select uuid_generate_v5(uuid_ns_url(), 'https://ventanilla.demo/' || k) $$;

-- "Hoy a las HH:MM" en hora argentina, robusto corriendo desde UTC.
create or replace function pg_temp.hoy(t time) returns timestamptz
language sql stable as
$$
  select (date_trunc('day', now() at time zone 'America/Argentina/Buenos_Aires') + t)
         at time zone 'America/Argentina/Buenos_Aires'
$$;

-- "Hace N días a las HH:MM" en hora argentina.
create or replace function pg_temp.hace(dias int, t time) returns timestamptz
language sql stable as
$$ select pg_temp.hoy(t) - make_interval(days => dias) $$;

-- ── Administración ───────────────────────────────────────────────────────────

insert into administrations (id, nombre, slug, is_demo)
values (pg_temp.vid('administration:iribarne'), 'Administración Iribarne', 'iribarne', true)
on conflict (id) do update
  set nombre = excluded.nombre, slug = excluded.slug, is_demo = excluded.is_demo;

-- ── Edificios ────────────────────────────────────────────────────────────────

insert into buildings (id, administration_id, direccion, alias, total_unidades)
values
  (pg_temp.vid('building:yerbal'), pg_temp.vid('administration:iribarne'),
   'Yerbal 1240', 'Yerbal', 24),
  (pg_temp.vid('building:loreto'), pg_temp.vid('administration:iribarne'),
   'Virrey Loreto 2680', 'Virrey Loreto', 18)
on conflict (id) do update
  set direccion = excluded.direccion, alias = excluded.alias,
      total_unidades = excluded.total_unidades;

-- ── Unidades ─────────────────────────────────────────────────────────────────
-- La numeración UF del prototipo no es aritmética: los pares observados en
-- design-reference (UF09=4°C, UF04=2°A, UF15=7°B, UF02=1°B, UF11=5°A) van
-- pinneados y el resto rellena sin colisión.

insert into units (id, administration_id, building_id, piso, letra, uf_numero)
select
  pg_temp.vid('unit:yerbal:' || v.piso || v.letra),
  pg_temp.vid('administration:iribarne'),
  pg_temp.vid('building:yerbal'),
  v.piso, v.letra, v.uf
from (values
  ('PB', 'A',  1), ('PB', 'B',  2), ('PB', 'C',  3),
  ('1',  'A',  5), ('1',  'B',  6), ('1',  'C',  7),
  ('2',  'A',  4), ('2',  'B',  8), ('2',  'C', 10),
  ('3',  'A', 11), ('3',  'B', 12), ('3',  'C', 13),
  ('4',  'A', 14), ('4',  'B', 16), ('4',  'C',  9),
  ('5',  'A', 17), ('5',  'B', 18), ('5',  'C', 19),
  ('6',  'A', 20), ('6',  'B', 21), ('6',  'C', 22),
  ('7',  'A', 23), ('7',  'B', 15), ('7',  'C', 24)
) as v (piso, letra, uf)
on conflict (id) do update
  set piso = excluded.piso, letra = excluded.letra, uf_numero = excluded.uf_numero;

insert into units (id, administration_id, building_id, piso, letra, uf_numero)
select
  pg_temp.vid('unit:loreto:' || v.piso || v.letra),
  pg_temp.vid('administration:iribarne'),
  pg_temp.vid('building:loreto'),
  v.piso, v.letra, v.uf
from (values
  ('1', 'A',  1), ('1', 'B',  2), ('1', 'C',  3),
  ('2', 'A',  4), ('2', 'B',  5), ('2', 'C',  6),
  ('3', 'A',  7), ('3', 'B',  8), ('3', 'C',  9),
  ('4', 'A', 10), ('4', 'B', 12), ('4', 'C', 13),
  ('5', 'A', 11), ('5', 'B', 14), ('5', 'C', 15),
  ('6', 'A', 16), ('6', 'B', 17), ('6', 'C', 18)
) as v (piso, letra, uf)
on conflict (id) do update
  set piso = excluded.piso, letra = excluded.letra, uf_numero = excluded.uf_numero;

-- ── Vecinos ──────────────────────────────────────────────────────────────────
-- Teléfonos completos en la base; la interfaz siempre los enmascara.
-- El de Marta termina en 4821 (el enmascarado del export es "11 •• ••• 4821").

insert into residents (id, administration_id, unit_id, nombre, telefono, verificado)
select
  pg_temp.vid('resident:' || v.clave),
  pg_temp.vid('administration:iribarne'),
  pg_temp.vid(v.unidad),
  v.nombre, v.telefono, v.verificado
from (values
  ('marta',    'unit:yerbal:5B', 'Marta Gorosito',     '+5491160004821', true),
  ('silvia',   'unit:yerbal:4C', 'Silvia Paredes',     '+5491154120933', true),
  ('roberto',  'unit:yerbal:2A', 'Roberto Etcheverry', '+5491147783402', true),
  ('diego',    'unit:yerbal:7B', 'Diego Lamas',        '+5491162914775', false),
  ('hernan',   'unit:loreto:1B', 'Hernán Solari',      '+5491139850216', true),
  ('mariaines','unit:loreto:5A', 'María Inés Bugallo', '+5491158361490', true),
  ('nelida',   'unit:yerbal:1C', 'Nélida Roldán',      '+5491143597208', true)
) as v (clave, unidad, nombre, telefono, verificado)
on conflict (id) do update
  set unit_id = excluded.unit_id, nombre = excluded.nombre,
      telefono = excluded.telefono, verificado = excluded.verificado;

-- ── Categorías ───────────────────────────────────────────────────────────────
-- Las diez cerradas del sistema: nueve observables en design-reference más
-- "Expensas y pagos" (decisión registrada en el README).

insert into categories
  (id, administration_id, nombre, urgencia_default, ot_automatica, emergencia_posible)
select
  pg_temp.vid('categoria:' || v.nombre),
  pg_temp.vid('administration:iribarne'),
  v.nombre, v.urgencia, false, v.emergencia
from (values
  ('Ascensor',                'urgente', true),
  ('Seguridad y accesos',     'alta',    true),
  ('Plomería y pérdidas',     'alta',    true),
  ('Filtraciones y humedad',  'alta',    false),
  ('Electricidad',            'media',   true),
  ('Ruidos y convivencia',    'media',   false),
  ('Limpieza',                'baja',    false),
  ('Administrativo',          'baja',    false),
  ('Expensas y pagos',        'baja',    false),
  ('Mantenimiento general',   'media',   true)
) as v (nombre, urgencia, emergencia)
on conflict (id) do update
  set nombre = excluded.nombre, urgencia_default = excluded.urgencia_default,
      ot_automatica = excluded.ot_automatica,
      emergencia_posible = excluded.emergencia_posible;

-- ── Proveedores ──────────────────────────────────────────────────────────────

insert into providers (id, administration_id, nombre, rubro, contacto)
select
  pg_temp.vid('provider:' || v.clave),
  pg_temp.vid('administration:iribarne'),
  v.nombre, v.rubro, v.contacto
from (values
  ('avalos',   'Plomería Ávalos',    'plomeria_filtraciones', '+5491145523901'),
  ('nunez',    'Cerrajería Núñez',   'seguridad_accesos',     '+5491168914352'),
  ('bianchi',  'Ascensores Bianchi', 'ascensor',              '+5491141207738'),
  ('electrosur','ElectroSur',        'electricidad',          '+5491157830264'),
  ('delvalle', 'Limpieza Del Valle', 'limpieza',              '+5491132609185')
) as v (clave, nombre, rubro, contacto)
on conflict (id) do update
  set nombre = excluded.nombre, rubro = excluded.rubro, contacto = excluded.contacto;

insert into provider_buildings (administration_id, provider_id, building_id)
select pg_temp.vid('administration:iribarne'), p.id, b.id
from providers p
cross join buildings b
where p.administration_id = pg_temp.vid('administration:iribarne')
  and b.administration_id = pg_temp.vid('administration:iribarne')
on conflict (provider_id, building_id) do nothing;

-- ── Reclamos visibles R-1040 a R-1048 ───────────────────────────────────────
-- Datos exactos de la tabla de design-reference/Panel Reclamos.dc.html.
-- primera_respuesta_at = created_at + 38 s en todos (KPI "38 s").

insert into claims
  (id, administration_id, numero_publico, titulo, categoria_id, urgencia, ambito,
   estado, building_id, unit_id, resident_id, origen, is_seed,
   created_at, primera_respuesta_at, en_gestion_at, asignado_at, resuelto_at,
   cerrado_at, reabierto_at, derivado_at, ultima_actividad_at)
select
  pg_temp.vid('claim:' || v.num),
  pg_temp.vid('administration:iribarne'),
  v.num, v.titulo, pg_temp.vid('categoria:' || v.categoria), v.urgencia, v.ambito,
  v.estado, pg_temp.vid(v.edificio),
  case when v.unidad is null then null else pg_temp.vid(v.unidad) end,
  case when v.vecino is null then null else pg_temp.vid('resident:' || v.vecino) end,
  v.origen, true,
  v.creado, v.creado + interval '38 seconds',
  v.en_gestion, v.asignado, v.resuelto, v.cerrado, null, v.derivado,
  v.actividad
from (values
  ('R-1040', 'Consulta por comprobante de expensas', 'Administrativo', 'baja',
   'privado', 'derivado', 'building:yerbal', 'unit:yerbal:1C', 'nelida', 'whatsapp',
   pg_temp.hace(3, '10:12'), null::timestamptz, null::timestamptz, null::timestamptz,
   null::timestamptz, pg_temp.hace(3, '11:05'), pg_temp.hace(3, '11:05')),

  ('R-1041', 'Vidrios del hall sucios hace dos semanas', 'Limpieza', 'baja',
   'comun', 'cerrado', 'building:yerbal', null, null, 'whatsapp',
   pg_temp.hace(4, '09:40'), null, null, null,
   pg_temp.hace(2, '09:40'), null, pg_temp.hace(2, '09:40')),

  ('R-1042', 'Portón del garage no cierra bien', 'Seguridad y accesos', 'alta',
   'comun', 'resuelto', 'building:loreto', null, null, 'whatsapp',
   pg_temp.hace(1, '18:20'), pg_temp.hoy('09:10'), pg_temp.hoy('11:45'),
   pg_temp.hoy('13:47'), null, null, pg_temp.hoy('13:47')),

  ('R-1043', 'Ruidos de taladro después de las 22', 'Ruidos y convivencia', 'media',
   'privado', 'recibido', 'building:loreto', 'unit:loreto:2A', null, 'whatsapp',
   pg_temp.hoy('11:20'), null, null, null, null, null, pg_temp.hoy('11:20')),

  ('R-1044', 'Filtración en pared del living, viene de arriba',
   'Filtraciones y humedad', 'alta',
   'comun', 'asignado', 'building:yerbal', 'unit:yerbal:5B', 'marta', 'whatsapp',
   pg_temp.hoy('14:02:22'), pg_temp.hoy('14:31'), pg_temp.hoy('14:33'),
   null, null, null, pg_temp.hoy('15:12')),

  ('R-1045', 'Luz quemada en el palier del 3°', 'Electricidad', 'media',
   'comun', 'asignado', 'building:yerbal', null, null, 'whatsapp',
   pg_temp.hoy('12:10'), pg_temp.hoy('12:55'), pg_temp.hoy('13:30'),
   null, null, null, pg_temp.hoy('13:30')),

  ('R-1046', 'Pérdida de agua en cochera del subsuelo', 'Plomería y pérdidas', 'alta',
   'comun', 'en_gestion', 'building:loreto', null, null, 'whatsapp',
   pg_temp.hoy('13:58'), pg_temp.hoy('14:13'), null,
   null, null, null, pg_temp.hoy('14:13')),

  ('R-1047', 'Ascensor parado entre pisos, sin personas adentro', 'Ascensor', 'urgente',
   'comun', 'recibido', 'building:yerbal', null, null, 'whatsapp',
   pg_temp.hoy('14:31'), null, null, null, null, null, pg_temp.hoy('14:31')),

  ('R-1048', 'Cerradura de la puerta de entrada rota, sin llave',
   'Seguridad y accesos', 'alta',
   'comun', 'recibido', 'building:yerbal', null, null, 'simulador',
   pg_temp.hoy('14:34'), null, null, null, null, null, pg_temp.hoy('14:34'))
) as v (num, titulo, categoria, urgencia, ambito, estado, edificio, unidad, vecino,
        origen, creado, en_gestion, asignado, resuelto, cerrado, derivado, actividad)
on conflict (id) do update
  set titulo = excluded.titulo, categoria_id = excluded.categoria_id,
      urgencia = excluded.urgencia, ambito = excluded.ambito,
      estado = excluded.estado, building_id = excluded.building_id,
      unit_id = excluded.unit_id, resident_id = excluded.resident_id,
      origen = excluded.origen, is_seed = excluded.is_seed,
      created_at = excluded.created_at,
      primera_respuesta_at = excluded.primera_respuesta_at,
      en_gestion_at = excluded.en_gestion_at, asignado_at = excluded.asignado_at,
      resuelto_at = excluded.resuelto_at, cerrado_at = excluded.cerrado_at,
      reabierto_at = excluded.reabierto_at, derivado_at = excluded.derivado_at,
      ultima_actividad_at = excluded.ultima_actividad_at;

-- Nota: 14:02:22 + 38 s = 14:03:00, la hora exacta de la respuesta de
-- Ventanilla en el timeline de R-1044.

-- ── Reclamos históricos R-1003 a R-1039 (37 cerrados) ───────────────────────
-- Base del KPI "resolución promedio 2,1 días": las duraciones (en minutos)
-- están elegidas para que el promedio de los 38 cerrados (37 + R-1041,
-- que resuelve en 2 días exactos) dé 2,1 días clavado.

insert into claims
  (id, administration_id, numero_publico, titulo, categoria_id, urgencia, ambito,
   estado, building_id, unit_id, resident_id, origen, is_seed,
   created_at, primera_respuesta_at, cerrado_at, ultima_actividad_at)
select
  pg_temp.vid('claim:' || v.num),
  pg_temp.vid('administration:iribarne'),
  v.num, v.titulo, pg_temp.vid('categoria:' || v.categoria), v.urgencia,
  v.ambito, 'cerrado', pg_temp.vid(v.edificio), null, null, v.origen, true,
  pg_temp.hace(v.dias, v.hora),
  pg_temp.hace(v.dias, v.hora) + interval '38 seconds',
  pg_temp.hace(v.dias, v.hora) + make_interval(mins => v.resolucion_min),
  pg_temp.hace(v.dias, v.hora) + make_interval(mins => v.resolucion_min)
from (values
  ('R-1003', 'Gotera en el techo del palier', 'Filtraciones y humedad', 'alta', 'comun', 'building:yerbal', 'whatsapp', 88, '09:15'::time, 360),
  ('R-1004', 'Portero eléctrico sin sonido', 'Electricidad', 'media', 'comun', 'building:loreto', 'whatsapp', 86, '11:40'::time, 600),
  ('R-1005', 'Luz de emergencia de escalera agotada', 'Electricidad', 'media', 'comun', 'building:yerbal', 'manual', 84, '16:05'::time, 840),
  ('R-1006', 'Ascensor con ruido al frenar', 'Ascensor', 'urgente', 'comun', 'building:yerbal', 'whatsapp', 81, '08:50'::time, 1080),
  ('R-1007', 'Canilla del lavadero común pierde', 'Plomería y pérdidas', 'alta', 'comun', 'building:loreto', 'whatsapp', 79, '13:25'::time, 1320),
  ('R-1008', 'Puerta de cochera desalineada', 'Seguridad y accesos', 'alta', 'comun', 'building:yerbal', 'whatsapp', 77, '10:10'::time, 1560),
  ('R-1009', 'Olor a humedad en el sótano', 'Filtraciones y humedad', 'alta', 'comun', 'building:loreto', 'manual', 75, '17:30'::time, 1800),
  ('R-1010', 'Timbre del 3°A sin funcionar', 'Electricidad', 'media', 'privado', 'building:yerbal', 'whatsapp', 72, '09:55'::time, 2040),
  ('R-1011', 'Baldosa rota en la entrada', 'Mantenimiento general', 'media', 'comun', 'building:yerbal', 'whatsapp', 70, '12:20'::time, 2280),
  ('R-1012', 'Fiesta con música hasta las 3', 'Ruidos y convivencia', 'media', 'privado', 'building:loreto', 'whatsapp', 68, '23:40'::time, 2520),
  ('R-1013', 'Manchas de pintura en el ascensor', 'Limpieza', 'baja', 'comun', 'building:yerbal', 'whatsapp', 66, '14:15'::time, 2760),
  ('R-1014', 'Consulta por recibo de expensas', 'Expensas y pagos', 'baja', 'privado', 'building:loreto', 'whatsapp', 63, '10:45'::time, 3000),
  ('R-1015', 'Pérdida bajo la pileta del lavadero', 'Plomería y pérdidas', 'alta', 'comun', 'building:yerbal', 'whatsapp', 61, '08:30'::time, 3240),
  ('R-1016', 'Foco quemado en cochera', 'Electricidad', 'media', 'comun', 'building:loreto', 'manual', 59, '15:50'::time, 3480),
  ('R-1017', 'Rejilla del patio tapada', 'Plomería y pérdidas', 'alta', 'comun', 'building:yerbal', 'whatsapp', 57, '11:05'::time, 3720),
  ('R-1018', 'Puerta del hall cierra con golpe', 'Seguridad y accesos', 'alta', 'comun', 'building:loreto', 'whatsapp', 54, '09:20'::time, 3960),
  ('R-1019', 'Humedad en pared de escalera', 'Filtraciones y humedad', 'alta', 'comun', 'building:yerbal', 'whatsapp', 52, '16:35'::time, 4200),
  ('R-1020', 'Ruido de taladro un domingo', 'Ruidos y convivencia', 'media', 'privado', 'building:yerbal', 'whatsapp', 50, '10:00'::time, 4440),
  ('R-1021', 'Vidrio de puerta trasera flojo', 'Mantenimiento general', 'media', 'comun', 'building:loreto', 'manual', 48, '13:45'::time, 4680),
  ('R-1022', 'Interruptor de palier chispea', 'Electricidad', 'media', 'comun', 'building:yerbal', 'whatsapp', 45, '18:10'::time, 4920),
  ('R-1023', 'Ascensor se detiene fuera de nivel', 'Ascensor', 'urgente', 'comun', 'building:loreto', 'whatsapp', 43, '08:05'::time, 5160),
  ('R-1024', 'Basura acumulada junto al garage', 'Limpieza', 'baja', 'comun', 'building:yerbal', 'whatsapp', 41, '12:50'::time, 5400),
  ('R-1025', 'Cerradura del portón trabada', 'Seguridad y accesos', 'alta', 'comun', 'building:loreto', 'whatsapp', 39, '09:35'::time, 5640),
  ('R-1026', 'Filtración en cielorraso del 6°C', 'Filtraciones y humedad', 'alta', 'privado', 'building:yerbal', 'whatsapp', 36, '15:00'::time, 5880),
  ('R-1027', 'Cartel de entrada despegado', 'Mantenimiento general', 'media', 'comun', 'building:loreto', 'manual', 34, '11:25'::time, 1200),
  ('R-1028', 'Pérdida en caño de la terraza', 'Plomería y pérdidas', 'alta', 'comun', 'building:yerbal', 'whatsapp', 32, '08:40'::time, 1680),
  ('R-1029', 'Luces del pasillo titilan', 'Electricidad', 'media', 'comun', 'building:loreto', 'whatsapp', 30, '14:55'::time, 2160),
  ('R-1030', 'Consulta por comprobante de pago', 'Expensas y pagos', 'baja', 'privado', 'building:yerbal', 'whatsapp', 27, '10:30'::time, 2640),
  ('R-1031', 'Espejo del ascensor rayado', 'Ascensor', 'baja', 'comun', 'building:yerbal', 'manual', 25, '17:15'::time, 3120),
  ('R-1032', 'Mancha de humedad en cochera', 'Filtraciones y humedad', 'alta', 'comun', 'building:loreto', 'whatsapp', 23, '09:00'::time, 3600),
  ('R-1033', 'Portón peatonal no traba', 'Seguridad y accesos', 'alta', 'comun', 'building:yerbal', 'whatsapp', 21, '13:10'::time, 4080),
  ('R-1034', 'Olor a quemado en tablero', 'Electricidad', 'media', 'comun', 'building:loreto', 'whatsapp', 18, '19:45'::time, 4560),
  ('R-1035', 'Vereda con baldosas sueltas', 'Mantenimiento general', 'media', 'comun', 'building:yerbal', 'manual', 16, '11:50'::time, 5040),
  ('R-1036', 'Ruidos de mudanza fuera de horario', 'Ruidos y convivencia', 'media', 'privado', 'building:loreto', 'whatsapp', 14, '21:05'::time, 5520),
  ('R-1037', 'Vidrios del palier sin limpiar', 'Limpieza', 'baja', 'comun', 'building:yerbal', 'whatsapp', 12, '10:20'::time, 900),
  ('R-1038', 'Gotera sobre caja de luz', 'Plomería y pérdidas', 'alta', 'comun', 'building:loreto', 'whatsapp', 9, '08:15'::time, 1320),
  ('R-1039', 'Pérdida de agua junto al medidor', 'Plomería y pérdidas', 'alta', 'comun', 'building:yerbal', 'whatsapp', 7, '12:35'::time, 1332)
) as v (num, titulo, categoria, urgencia, ambito, edificio, origen, dias, hora, resolucion_min)
on conflict (id) do update
  set titulo = excluded.titulo, categoria_id = excluded.categoria_id,
      urgencia = excluded.urgencia, ambito = excluded.ambito,
      estado = excluded.estado, building_id = excluded.building_id,
      origen = excluded.origen, is_seed = excluded.is_seed,
      created_at = excluded.created_at,
      primera_respuesta_at = excluded.primera_respuesta_at,
      cerrado_at = excluded.cerrado_at,
      ultima_actividad_at = excluded.ultima_actividad_at;

-- ── Timeline de R-1044 ───────────────────────────────────────────────────────
-- Mensajes: audio + foto de Marta (14:02), respuesta de Ventanilla (14:03),
-- aviso de visita (15:10), confirmación de Marta (15:12).
-- El audio queda sin media_path: scripts/generar-audio-seed.ts lo completa
-- si hay ELEVENLABS_API_KEY; sin archivo, el player queda en modo simulado.

insert into claim_messages
  (id, administration_id, claim_id, direccion, tipo, contenido, transcripcion,
   media_path, is_seed, created_at)
select
  pg_temp.vid('mensaje:R-1044:' || v.clave),
  pg_temp.vid('administration:iribarne'),
  pg_temp.vid('claim:R-1044'),
  v.direccion, v.tipo, v.contenido, v.transcripcion, v.media_path, true, v.hora
from (values
  ('audio', 'entrada', 'audio', '0:38',
   'Hola, buenas. Tengo una mancha de humedad en la pared del living que cada vez está peor, ya se está descascarando la pintura. Yo creo que viene del departamento de arriba. Te mando una foto.',
   null, pg_temp.hoy('14:02:22')),
  ('foto', 'entrada', 'foto', 'IMG-20260707-WA0012.jpg', null,
   pg_temp.vid('administration:iribarne') || '/' || pg_temp.vid('claim:R-1044')
     || '/IMG-20260707-WA0012.jpg',
   pg_temp.hoy('14:02:41')),
  ('confirmacion', 'salida', 'texto',
   'Hola Marta. Registré tu reclamo por filtración en la pared del living de tu unidad (5°B, Yerbal 1240). Tu número de seguimiento es R-1044. Lo derivamos para revisión con prioridad alta. Te avisamos apenas haya novedades.',
   null, null, pg_temp.hoy('14:03:00')),
  ('visita', 'salida', 'texto',
   'Novedades de tu reclamo R-1044: el plomero pasa el jueves entre las 10 y las 12 a revisar tu unidad y el 6°B. Avisanos si ese horario no te sirve.',
   null, null, pg_temp.hoy('15:10')),
  ('conforme', 'entrada', 'texto',
   'Perfecto, ese horario me viene bien.',
   null, null, pg_temp.hoy('15:12'))
) as v (clave, direccion, tipo, contenido, transcripcion, media_path, hora)
on conflict (id) do update
  set direccion = excluded.direccion, tipo = excluded.tipo,
      contenido = excluded.contenido, transcripcion = excluded.transcripcion,
      media_path = excluded.media_path, is_seed = excluded.is_seed,
      created_at = excluded.created_at;

-- Eventos. El feed del panel muestra los tipos alta / aprobacion / estado /
-- ot_creada / visita_confirmada; el timeline del detalle muestra
-- clasificacion / aprobacion / ot_creada / estado.

insert into claim_events
  (id, administration_id, claim_id, tipo, texto, actor, is_seed, created_at)
select
  pg_temp.vid('evento:' || v.clave),
  pg_temp.vid('administration:iribarne'),
  pg_temp.vid('claim:' || v.claim),
  v.tipo, v.texto, v.actor, true, v.hora
from (values
  ('R-1044:alta', 'R-1044', 'alta',
   'Nuevo reclamo', 'Sistema', pg_temp.hoy('14:02:22')),
  -- La clasificación va después de la foto (14:02:41): el timeline ordena por
  -- created_at estricto y el diseño agrupa audio + foto antes del chip.
  ('R-1044:clasificacion', 'R-1044', 'clasificacion',
   'Clasificado: Filtraciones y humedad · Alta · Ámbito común', 'Sistema',
   pg_temp.hoy('14:02:45')),
  ('R-1044:aprobacion', 'R-1044', 'aprobacion',
   'Carla Méndez aprobó la gestión', 'Carla Méndez', pg_temp.hoy('14:31')),
  ('R-1044:ot', 'R-1044', 'ot_creada',
   'OT-311 enviada a Plomería Ávalos', 'Sistema', pg_temp.hoy('14:33')),
  ('R-1044:visita', 'R-1044', 'visita_confirmada',
   'Vecina confirmó visita del jueves', 'Sistema', pg_temp.hoy('15:12')),
  ('R-1042:resuelto', 'R-1042', 'estado',
   'Marcado Resuelto · esperando conformidad', 'Carla Méndez', pg_temp.hoy('13:47'))
) as v (clave, claim, tipo, texto, actor, hora)
on conflict (id) do update
  set tipo = excluded.tipo, texto = excluded.texto, actor = excluded.actor,
      is_seed = excluded.is_seed, created_at = excluded.created_at;

-- ── Orden de trabajo OT-311 ──────────────────────────────────────────────────

insert into work_orders
  (id, administration_id, numero_publico, claim_id, provider_id, texto_enviado,
   estado, visita_confirmada, is_seed, created_at)
values (
  pg_temp.vid('ot:OT-311'),
  pg_temp.vid('administration:iribarne'),
  'OT-311',
  pg_temp.vid('claim:R-1044'),
  pg_temp.vid('provider:avalos'),
  'OT-311 · Plomería Ávalos. Filtración en pared del living. Yerbal 1240, unidad 5°B. Posible origen en el 6°B. Prioridad alta. Incluye foto y audio del reclamo. Coordinar visita con la vecina al 11 •• ••• 4821.',
  'confirmada',
  'jueves 10 a 12 h',
  true,
  pg_temp.hoy('14:33')
)
on conflict (id) do update
  set numero_publico = excluded.numero_publico, claim_id = excluded.claim_id,
      provider_id = excluded.provider_id, texto_enviado = excluded.texto_enviado,
      estado = excluded.estado, visita_confirmada = excluded.visita_confirmada,
      is_seed = excluded.is_seed, created_at = excluded.created_at;

-- ── Expensas adeudadas ───────────────────────────────────────────────────────
-- Filas exactas de la card del Panel Hoy.

insert into arrears
  (id, administration_id, building_id, unit_id, resident_nombre,
   periodos_adeudados, monto)
select
  pg_temp.vid('arrear:' || v.clave),
  pg_temp.vid('administration:iribarne'),
  pg_temp.vid(v.edificio),
  pg_temp.vid(v.unidad),
  v.nombre, v.periodos, v.monto
from (values
  ('yerbal:uf09',  'building:yerbal', 'unit:yerbal:4C', 'Silvia Paredes',     3,  952800),
  ('yerbal:uf04',  'building:yerbal', 'unit:yerbal:2A', 'Roberto Etcheverry', 2,  581400),
  ('yerbal:uf15',  'building:yerbal', 'unit:yerbal:7B', 'Diego Lamas',        1,  264700),
  ('loreto:uf02',  'building:loreto', 'unit:loreto:1B', 'Hernán Solari',      4, 1246000),
  ('loreto:uf11',  'building:loreto', 'unit:loreto:5A', 'María Inés Bugallo', 1,  289500)
) as v (clave, edificio, unidad, nombre, periodos, monto)
on conflict (id) do update
  set building_id = excluded.building_id, unit_id = excluded.unit_id,
      resident_nombre = excluded.resident_nombre,
      periodos_adeudados = excluded.periodos_adeudados, monto = excluded.monto;

-- ── Contadores ───────────────────────────────────────────────────────────────
-- El próximo reclamo real (simulador) será R-1049; la próxima OT, OT-312.

insert into counters (administration_id, scope, value)
values
  (pg_temp.vid('administration:iribarne'), 'claim', 1048),
  (pg_temp.vid('administration:iribarne'), 'work_order', 311)
on conflict (administration_id, scope) do update
  set value = excluded.value;

commit;

-- ────────────────────────────────────────────────────────────────────────────
-- Membresía de la usuaria del panel
-- Requiere que carla@iribarne.ar exista en Authentication → Users.
-- Este bloque es re-ejecutable por sí solo.
-- ────────────────────────────────────────────────────────────────────────────
do $$
declare
  v_user uuid;
begin
  select id into v_user from auth.users where email = 'carla@iribarne.ar' limit 1;
  if v_user is null then
    raise notice 'ATENCIÓN: no existe carla@iribarne.ar en Auth. Creala en Authentication → Users (Add user, Auto Confirm) y corré de nuevo SOLO este bloque final.';
    return;
  end if;

  insert into public.members (user_id, administration_id, rol)
  select v_user, a.id, 'admin'
  from public.administrations a
  where a.slug = 'iribarne'
  on conflict (user_id, administration_id) do nothing;

  -- Nombre visible en el sidebar del panel.
  begin
    update auth.users
    set raw_user_meta_data =
      coalesce(raw_user_meta_data, '{}'::jsonb) || '{"nombre": "Carla Méndez"}'::jsonb
    where id = v_user;
  exception when others then
    raise notice 'No se pudo guardar el nombre visible (%); el panel mostrará el email. Opcional.', sqlerrm;
  end;

  raise notice 'Membresía de Carla lista.';
end
$$;

select 'setup completo: listo' as resultado;
