-- SOLO para el cluster local de verificación. Crea una Carla falsa en el
-- stub de auth y su membresía, para poder probar RLS. En el proyecto real
-- esto lo hace scripts/seed-remote.ts contra la API de Supabase Auth.
-- Corre DESPUÉS de seed.sql (necesita la administración creada).

insert into auth.users (id, email)
values ('11111111-1111-4111-8111-111111111111', 'carla@iribarne.ar')
on conflict (id) do nothing;

insert into public.members (user_id, administration_id, rol)
select '11111111-1111-4111-8111-111111111111', a.id, 'admin'
from public.administrations a
where a.slug = 'iribarne'
on conflict (user_id, administration_id) do nothing;
