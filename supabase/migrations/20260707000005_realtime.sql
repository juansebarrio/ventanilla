-- Realtime para la bandeja del panel.
-- REPLICA IDENTITY FULL: sin esto, los UPDATE/DELETE llegan sin las columnas
-- del registro viejo y Realtime no puede evaluar RLS ni filtrar por
-- administration_id. La autorización del stream la dan las policies de
-- SELECT del suscriptor; el filter del canal es solo optimización.

alter table public.claims         replica identity full;
alter table public.claim_messages replica identity full;
alter table public.claim_events   replica identity full;

alter publication supabase_realtime
  add table public.claims, public.claim_messages, public.claim_events;
