-- Extensiones requeridas.
-- uuid-ossp: uuid_generate_v5 para los IDs determinísticos del seed.
-- gen_random_uuid() ya es built-in en Postgres 16.
create extension if not exists "uuid-ossp";
