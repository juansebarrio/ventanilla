-- Bucket privado para media de reclamos (fotos y audios).
-- Convención de path: <administration_id>/<claim_id>/<archivo>.
-- Lectura: miembros de la administración. Escritura: solo service role
-- (pipeline, webhook, seed) — sin policy de INSERT a propósito.

insert into storage.buckets (id, name, public)
values ('claim-media', 'claim-media', false)
on conflict (id) do nothing;

-- Si el proyecto Supabase restringe el ownership de storage.objects y esta
-- policy falla al aplicar la migración, crearla desde el Dashboard con el
-- mismo texto (ver README, sección Decisiones).
create policy claim_media_member_read on storage.objects
  for select to authenticated
  using (
    bucket_id = 'claim-media'
    and public.is_member(((storage.foldername(name))[1])::uuid)
  );
