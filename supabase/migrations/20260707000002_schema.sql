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
