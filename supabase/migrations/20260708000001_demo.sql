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
