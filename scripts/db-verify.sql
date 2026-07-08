-- Asserts post-seed. Cada bloque tira raise exception si algo no cierra.
-- Corre contra el cluster local (scripts/db-local.sh verify); también sirve
-- contra el proyecto real con SUPABASE_DB_URL, salvo la sección de RLS que
-- depende del fixture local de Carla.

-- ── Conteos base ─────────────────────────────────────────────────────────────
do $$
declare
  demo uuid;
  n int;
begin
  select id into demo from administrations where slug = 'iribarne';
  if demo is null then raise exception 'No existe la administración demo'; end if;

  select count(*) into n from claims where administration_id = demo;
  if n <> 46 then raise exception 'claims: esperados 46, hay %', n; end if;

  select count(*) into n from claims where administration_id = demo and estado = 'cerrado';
  if n <> 38 then raise exception 'cerrados: esperados 38, hay %', n; end if;

  select count(*) into n from claims
  where administration_id = demo
    and estado in ('recibido', 'en_gestion', 'asignado', 'resuelto', 'reabierto');
  if n <> 7 then raise exception 'abiertos: esperados 7, hay %', n; end if;

  select count(*) into n from claims
  where administration_id = demo and estado = 'recibido';
  if n <> 3 then raise exception 'esperan tu acción: esperados 3, hay %', n; end if;

  select count(*) into n from claims
  where administration_id = demo and urgencia = 'urgente' and estado <> 'cerrado';
  if n <> 1 then raise exception 'urgentes abiertos: esperado 1, hay %', n; end if;

  select count(*) into n from buildings where administration_id = demo;
  if n <> 2 then raise exception 'edificios: esperados 2, hay %', n; end if;

  select count(*) into n from units where administration_id = demo;
  if n <> 42 then raise exception 'unidades: esperadas 42, hay %', n; end if;

  select count(*) into n from categories where administration_id = demo;
  if n <> 10 then raise exception 'categorías: esperadas 10, hay %', n; end if;

  select count(*) into n from providers where administration_id = demo;
  if n <> 5 then raise exception 'proveedores: esperados 5, hay %', n; end if;

  select count(*) into n from claim_messages where administration_id = demo;
  if n <> 5 then raise exception 'mensajes: esperados 5, hay %', n; end if;

  select count(*) into n from claim_events where administration_id = demo;
  if n <> 6 then raise exception 'eventos: esperados 6, hay %', n; end if;

  select count(*) into n from work_orders where administration_id = demo;
  if n <> 1 then raise exception 'órdenes de trabajo: esperada 1, hay %', n; end if;

  select count(*) into n from arrears where administration_id = demo;
  if n <> 5 then raise exception 'morosidad: esperadas 5 filas, hay %', n; end if;
end
$$;

-- ── KPIs ─────────────────────────────────────────────────────────────────────
do $$
declare
  demo uuid;
  dias numeric;
  segundos numeric;
  total_yerbal bigint;
  total_loreto bigint;
begin
  select id into demo from administrations where slug = 'iribarne';

  select extract(epoch from avg(cerrado_at - created_at)) / 86400.0 into dias
  from claims where administration_id = demo and estado = 'cerrado';
  if dias < 2.05 or dias > 2.15 then
    raise exception 'resolución promedio: % días, esperada ~2,1', round(dias, 3);
  end if;

  select extract(epoch from avg(primera_respuesta_at - created_at)) into segundos
  from claims where administration_id = demo and primera_respuesta_at is not null;
  if abs(segundos - 38) > 0.5 then
    raise exception 'primera respuesta: % s, esperados 38 s', round(segundos, 1);
  end if;

  select sum(monto) into total_yerbal
  from arrears a join buildings b on b.id = a.building_id
  where a.administration_id = demo and b.alias = 'Yerbal';
  if total_yerbal <> 1798900 then
    raise exception 'total adeudado Yerbal: %, esperado 1798900', total_yerbal;
  end if;

  select sum(monto) into total_loreto
  from arrears a join buildings b on b.id = a.building_id
  where a.administration_id = demo and b.alias = 'Virrey Loreto';
  if total_loreto <> 1535500 then
    raise exception 'total adeudado Virrey Loreto: %, esperado 1535500', total_loreto;
  end if;
end
$$;

-- ── Timeline de R-1044 ───────────────────────────────────────────────────────
do $$
declare
  demo uuid;
  hora text;
  texto_ot text;
begin
  select id into demo from administrations where slug = 'iribarne';

  select to_char(min(m.created_at) at time zone 'America/Argentina/Buenos_Aires',
                 'HH24:MI:SS')
  into hora
  from claim_messages m
  join claims c on c.id = m.claim_id
  where c.administration_id = demo and c.numero_publico = 'R-1044'
    and m.direccion = 'salida';
  if hora <> '14:03:00' then
    raise exception 'respuesta de Ventanilla a las %, esperada 14:03:00', hora;
  end if;

  select w.texto_enviado into texto_ot
  from work_orders w
  where w.administration_id = demo and w.numero_publico = 'OT-311';
  if texto_ot not like 'OT-311 · Plomería Ávalos.%' then
    raise exception 'texto de OT-311 inesperado: %', left(texto_ot, 60);
  end if;
end
$$;

-- ── Numeración correlativa ───────────────────────────────────────────────────
-- Los cambios de cada bloque se revierten al capturar la excepción final.
do $$
declare
  demo uuid;
  n bigint;
begin
  select id into demo from administrations where slug = 'iribarne';

  select public.next_public_number(demo, 'claim') into n;
  if n <> 1049 then raise exception 'próximo reclamo: %, esperado 1049', n; end if;

  select public.next_public_number(demo, 'work_order') into n;
  if n <> 312 then raise exception 'próxima OT: %, esperada 312', n; end if;

  raise exception 'ROLLBACK_OK';
exception
  when others then
    if sqlerrm <> 'ROLLBACK_OK' then raise; end if;
end
$$;

do $$
declare
  demo uuid;
  num text;
begin
  select id into demo from administrations where slug = 'iribarne';

  insert into claims (administration_id, titulo, urgencia, ambito, estado, building_id, origen)
  values (
    demo, 'Prueba de numeración automática', 'media', 'comun', 'recibido',
    (select id from buildings where administration_id = demo order by alias limit 1),
    'manual'
  )
  returning numero_publico into num;
  if num <> 'R-1049' then
    raise exception 'número asignado por trigger: %, esperado R-1049', num;
  end if;

  raise exception 'ROLLBACK_OK';
exception
  when others then
    if sqlerrm <> 'ROLLBACK_OK' then raise; end if;
end
$$;

-- ── Reset del demo ───────────────────────────────────────────────────────────
-- Simula actividad de demo (reclamo del simulador + mutación de R-1047 +
-- rate limits) y verifica que demo_reset() la revierte por completo.
do $$
declare
  demo uuid;
  n int;
  v_estado text;
  v_counter bigint;
begin
  select id into demo from administrations where slug = 'iribarne';

  -- Actividad de demo: un reclamo del simulador con su mensaje...
  insert into claims (administration_id, titulo, urgencia, ambito, estado, building_id, origen)
  values (demo, 'Reclamo de prueba del simulador', 'media', 'comun', 'recibido',
          (select id from buildings where administration_id = demo order by alias limit 1),
          'simulador');
  -- ...una mutación sobre un reclamo del seed...
  update claims set estado = 'resuelto', resuelto_at = now(), ultima_actividad_at = now()
  where administration_id = demo and numero_publico = 'R-1047';
  insert into claim_events (administration_id, claim_id, tipo, texto, actor)
  select demo, id, 'estado', 'Marcado Resuelto · esperando conformidad', 'Carla Méndez'
  from claims where administration_id = demo and numero_publico = 'R-1047';
  -- ...y un poco de rate limit.
  perform rate_limit_hit('ip_minute', '1.2.3.4', date_trunc('minute', now()));

  perform demo_reset();

  select count(*) into n from claims where administration_id = demo;
  if n <> 46 then raise exception 'reset: esperados 46 reclamos, hay %', n; end if;

  select count(*) into n from claims where administration_id = demo and origen = 'simulador' and not is_seed;
  if n <> 0 then raise exception 'reset: quedaron reclamos del simulador'; end if;

  select estado into v_estado from claims where administration_id = demo and numero_publico = 'R-1047';
  if v_estado <> 'recibido' then
    raise exception 'reset: R-1047 debería volver a recibido y está %', v_estado;
  end if;

  select count(*) into n from claim_events e
  join claims c on c.id = e.claim_id
  where c.numero_publico = 'R-1047' and not e.is_seed;
  if n <> 0 then raise exception 'reset: quedó el evento de demo sobre R-1047'; end if;

  select value into v_counter from counters where administration_id = demo and scope = 'claim';
  if v_counter <> 1048 then raise exception 'reset: contador de reclamos en %', v_counter; end if;

  -- El timeline de R-1044 quedó anclado a hoy en Buenos Aires.
  select count(*) into n from claims
  where administration_id = demo and numero_publico = 'R-1044'
    and (created_at at time zone 'America/Argentina/Buenos_Aires')::date
        = (now() at time zone 'America/Argentina/Buenos_Aires')::date
    and to_char(created_at at time zone 'America/Argentina/Buenos_Aires', 'HH24:MI:SS') = '14:02:22'
    and to_char(en_gestion_at at time zone 'America/Argentina/Buenos_Aires', 'HH24:MI') = '14:31'
    and to_char(asignado_at at time zone 'America/Argentina/Buenos_Aires', 'HH24:MI') = '14:33';
  if n <> 1 then raise exception 'reset: R-1044 no quedó re-anclado a hoy 14:02'; end if;

  select count(*) into n from rate_limits;
  if n <> 1 then raise exception 'reset: rate limits inesperados (%)', n; end if;

  -- La resolución promedio sigue en 2,1 días después del reset.
  declare dias numeric;
  begin
    select extract(epoch from avg(cerrado_at - created_at)) / 86400.0 into dias
    from claims where administration_id = demo and estado = 'cerrado';
    if dias < 2.05 or dias > 2.15 then
      raise exception 'reset: resolución promedio % días', round(dias, 3);
    end if;
  end;
end
$$;

-- ── Numeración no es ejecutable por roles de aplicación ─────────────────────
do $$
begin
  if has_function_privilege('authenticated', 'public.next_public_number(uuid,text)', 'execute') then
    raise exception 'authenticated no debería poder ejecutar next_public_number';
  end if;
  if has_function_privilege('anon', 'public.next_public_number(uuid,text)', 'execute') then
    raise exception 'anon no debería poder ejecutar next_public_number';
  end if;
end
$$;

-- ── RLS ──────────────────────────────────────────────────────────────────────
-- Carla (fixture local) ve el tenant; un autenticado ajeno y anon, nada.

set role authenticated;

do $$
declare n int;
begin
  perform set_config('request.jwt.claim.sub', '11111111-1111-4111-8111-111111111111', false);
  select count(*) into n from claims;
  if n <> 46 then raise exception 'RLS: Carla debería ver 46 reclamos y ve %', n; end if;
  select count(*) into n from arrears;
  if n <> 5 then raise exception 'RLS: Carla debería ver 5 filas de morosidad y ve %', n; end if;
end
$$;

do $$
declare n int;
begin
  perform set_config('request.jwt.claim.sub', '99999999-9999-4999-8999-999999999999', false);
  select count(*) into n from claims;
  if n <> 0 then raise exception 'RLS: un autenticado sin membresía ve % reclamos', n; end if;
  select count(*) into n from administrations;
  if n <> 0 then raise exception 'RLS: un autenticado sin membresía ve % administraciones', n; end if;
end
$$;

reset role;
set role anon;

do $$
declare n int;
begin
  select count(*) into n from claims;
  if n <> 0 then raise exception 'RLS: anon ve % reclamos', n; end if;
  select count(*) into n from residents;
  if n <> 0 then raise exception 'RLS: anon ve % vecinos', n; end if;
  select count(*) into n from claim_messages;
  if n <> 0 then raise exception 'RLS: anon ve % mensajes', n; end if;
  select count(*) into n from wa_sessions;
  if n <> 0 then raise exception 'RLS: anon ve % sesiones de whatsapp', n; end if;
end
$$;

reset role;

-- ── Dedupe de mensajes de WhatsApp ───────────────────────────────────────────
-- El índice único sobre wa_message_id descarta reintentos del webhook.
do $$
declare
  demo uuid;
  v_claim uuid;
begin
  select id into demo from administrations where slug = 'iribarne';
  select id into v_claim from claims
  where administration_id = demo and numero_publico = 'R-1044';

  insert into claim_messages
    (administration_id, claim_id, direccion, tipo, contenido, wa_message_id)
  values (demo, v_claim, 'entrada', 'texto', 'prueba wamid', 'wamid.prueba');

  begin
    insert into claim_messages
      (administration_id, claim_id, direccion, tipo, contenido, wa_message_id)
    values (demo, v_claim, 'entrada', 'texto', 'duplicado', 'wamid.prueba');
    raise exception 'el wamid duplicado no debería insertarse';
  exception
    when unique_violation then null;
  end;

  delete from claim_messages where wa_message_id = 'wamid.prueba';
end
$$;

select 'db-verify: todos los asserts pasaron' as resultado;
