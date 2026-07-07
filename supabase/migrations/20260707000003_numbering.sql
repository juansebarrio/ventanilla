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
