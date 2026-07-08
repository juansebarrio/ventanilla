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
