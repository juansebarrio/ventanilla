# Ventanilla

Mesa de reclamos para administraciones de consorcios. Demo de portfolio de
JS80 (Fase 0): un tenant ficticio —Administración Iribarne— con panel
completo, landing pública y un simulador que usa el pipeline real.

El diseño de referencia vive en `design-reference/` (cuatro HTML exportados
de Claude Design más su runtime `support.js`) y es la fuente de verdad
visual y de copy de todo el proyecto.

## Stack

- Next.js (App Router) + TypeScript estricto + Tailwind CSS v4.
- Supabase: Postgres, Auth, Storage, Realtime. RLS activa en todas las
  tablas desde la primera migración.
- Anthropic API para clasificación y redacción (con fallback por palabras
  clave cuando no hay clave o falla la llamada).
- Deploy previsto en Vercel (`ventanilla.js80.studio`).

## Setup

```bash
pnpm install
cp .env.example .env.local   # completar credenciales (ver comentarios)
pnpm dev
```

Las variables obligatorias y opcionales están documentadas en
`.env.example`. El build no exige credenciales: las lecturas de entorno son
perezosas y fallan recién en runtime si falta algo.

## Base de datos

- Migraciones en `supabase/migrations/` (schema, numeración correlativa,
  RLS, Realtime, Storage). Se aplican en orden con `psql` o `supabase db push`.
- Seed del tenant demo en `supabase/seed/seed.sql`: idempotente y
  re-ejecutable; las fechas son relativas al día de ejecución en zona
  horaria de Buenos Aires, así el timeline de R-1044 siempre dice
  "hoy 14:02". Sirve también como reset (restaura estados y contadores).

### Contra el proyecto Supabase real

```bash
for f in supabase/migrations/*.sql; do psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -f "$f"; done
psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -f supabase/seed/seed.sql
pnpm seed:remote   # usuaria del panel (Supabase Auth) + membresía + foto en Storage
```

La usuaria demo del panel es `carla@iribarne.ar` (Carla Méndez); la
contraseña la define `SEED_ADMIN_PASSWORD`.

### Verificación local (sin proyecto Supabase)

`pnpm db:local` levanta un Postgres efímero con el binario del sistema
(initdb + pg_ctl, puerto 54322), aplica un stub mínimo de los schemas
`auth`/`storage` de Supabase (`supabase/seed/local/`), corre las
migraciones, ejecuta el seed dos veces (prueba de idempotencia) y valida
`scripts/db-verify.sql`: conteos exactos (46 reclamos, 38 cerrados, 7
abiertos), KPIs (resolución promedio 2,1 días, primera respuesta 38 s),
numeración correlativa (próximos R-1049 y OT-312), y RLS (una usuaria sin
membresía y el rol anon no leen nada del tenant).

Otros comandos: `pnpm db:verify`, `pnpm db:down`, `pnpm db:reset`.

## Decisiones

Resueltas contra `design-reference/` cuando el prototipo era ambiguo o
inconsistente; acá quedan para no re-litigarlas.

1. **KPIs calculados, no copiados.** El prototipo muestra ABIERTOS 6 y
   ESPERAN TU ACCIÓN 2 porque su pantalla Hoy es "anterior" a la llegada de
   R-1048 (fila oculta por defecto en la bandeja). Con R-1048 sembrado (la
   tabla del export lo lista, origen simulador), los valores reales contra
   la base son ABIERTOS 7 y ESPERAN TU ACCIÓN 3. Definición: "esperan tu
   acción" = reclamos en estado recibido.
2. **El filtro Abiertos filtra de verdad.** Abiertos = recibido, en
   gestión, asignado, resuelto, reabierto (excluye cerrado y derivado). El
   pie de la bandeja con el default muestra "7 de 46 reclamos" (el
   prototipo decía "8 de 46" porque su filtro no filtraba).
3. **Horas canónicas.** La vecina confirma la visita a las 15:12 (el feed
   del export decía 12:15, inconsistente con el detalle). R-1042 se marca
   Resuelto hoy 13:47 (la bandeja decía "ayer"; gana el feed). R-1043
   ingresó hoy 11:20 (la bandeja decía "hace 3 h" y la card Hoy "hace 1 h";
   los relativos ahora se calculan en vivo, la inconsistencia desaparece).
4. **Feed y timeline filtran por tipo de evento.** El feed "Últimos
   movimientos" excluye eventos `clasificacion` (detalle interno); el
   timeline del detalle excluye `alta` y `visita_confirmada` (los cubren
   las burbujas de mensajes). Así ambas superficies reproducen el export
   desde la misma tabla `claim_events`.
5. **Décima categoría.** El export muestra nueve categorías; el sistema
   cierra la lista en diez con "Expensas y pagos" (decisión de producto).
6. **`ot_automatica` en false para todas las categorías.** En la demo toda
   orden de trabajo sale con aprobación de Carla, como muestra el
   prototipo (R-1044 se aprueba 14:31 y la OT sale 14:33; R-1047 espera el
   botón). El flag queda listo para Fase 1.
7. **Título único por reclamo.** R-1044 usa el título de la bandeja
   ("Filtración en pared del living, viene de arriba"); el h1 del detalle
   del export mostraba una versión corta.
8. **Números públicos sin padding** (`R-1049`, `OT-312`), como el
   prototipo. Son `text`: el orden siempre es por fecha, nunca por número.
   Un rollback puede dejar huecos en la numeración; aceptado.
9. **Responsive.** La landing se adapta a mobile (mismo diseño, columnas
   apiladas); el panel es desktop (ancho fijo 1440, como el export).
10. **Tipos de la base escritos a mano** (`lib/supabase/database.types.ts`):
    `supabase gen types --db-url` requiere Docker, no disponible en el
    entorno de desarrollo. `pnpm db:types` los regenera donde sí lo haya.
11. **Unidades funcionales pinneadas.** La numeración UF del prototipo no
    es aritmética; los pares observados (UF 09 = 4°C, UF 04 = 2°A,
    UF 15 = 7°B, UF 02 = 1°B, UF 11 = 5°A) van fijos en el seed y el resto
    rellena sin colisión.
12. **Seed con horas futuras.** Si el seed corre antes de las 15:12 de
    Buenos Aires, parte del timeline de R-1044 queda en el futuro; la
    interfaz clampea los relativos negativos a "recién". El reset diario se
    agenda de madrugada.
13. **Ticket con recuadro completo.** El brief describía el ticket con
    "borde izquierdo 1.5px dashed", pero el export lo dibuja con
    `border:1.5px dashed #1E4D3F` en los cuatro lados (recuadro). Se replicó
    el export. En la tabla el número va como texto plano mono, sin recuadro.
14. **Styleguide.** `/styleguide` (fuera de la navegación) muestra todos los
    componentes y, al pie, incrusta los cuatro HTML del export en iframes
    para comparar lado a lado. Esos iframes cargan su runtime (React) desde
    un CDN, así que necesitan conexión; sin red quedan en blanco. Los
    componentes propios se ven siempre.

## Pendientes de Fase 1

- Formularios de edición en Edificios, Proveedores y Ajustes (Fase 0 los
  muestra solo lectura).
- Encendido de WhatsApp Cloud API (número, verificación de Meta y
  plantillas aprobadas).
- Panel responsive.
- Automatización de órdenes de trabajo por categoría (`ot_automatica`).

## Estructura

```
app/                    rutas (App Router)
components/             componentes de interfaz
design-reference/       export de Claude Design: fuente de verdad visual
lib/                    dominio, entorno y clientes de Supabase
scripts/                verificación local de la base y seeds auxiliares
supabase/migrations/    schema, numeración, RLS, Realtime, Storage
supabase/seed/          seed.sql del tenant demo + assets + stub local
```
