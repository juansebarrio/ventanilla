#!/usr/bin/env bash
# Regenera supabase/setup-completo.sql: migraciones + seed + membresía en un
# solo archivo para pegar en el SQL Editor del Dashboard de Supabase.
# Correr desde la raíz del repo cada vez que cambie una migración o el seed:
#   bash scripts/generar-setup-completo.sh
set -euo pipefail

cd "$(dirname "$0")/.."
OUT=supabase/setup-completo.sql

cat > "$OUT" <<'HEADER'
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

HEADER

seccion() {
  {
    echo "-- ────────────────────────────────────────────────────────────────────────────"
    echo "-- $1"
    echo "-- ────────────────────────────────────────────────────────────────────────────"
  } >> "$OUT"
}

for f in supabase/migrations/*.sql; do
  case "$f" in
    *_realtime.sql)
      seccion "$f (tolerante para el Dashboard)"
      cat >> "$OUT" <<'REALTIME'
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

REALTIME
      ;;
    *_storage.sql)
      seccion "$f (tolerante para el Dashboard)"
      cat >> "$OUT" <<'STORAGE'
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

STORAGE
      ;;
    *)
      seccion "$f"
      cat "$f" >> "$OUT"
      echo >> "$OUT"
      ;;
  esac
done

seccion "supabase/seed/seed.sql"
cat supabase/seed/seed.sql >> "$OUT"

cat >> "$OUT" <<'MEMBER'

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
MEMBER

echo "Generado $OUT ($(wc -l < "$OUT") líneas)."
