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
