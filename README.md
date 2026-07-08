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

## Demo pública

- **Landing** (`/`): réplica del export, responsive (columnas apiladas en
  mobile). La metadata usa `NEXT_PUBLIC_SITE_URL` como URL canónica y la
  OG image se genera en `app/opengraph-image.tsx` (fondo papel con el
  comprobante R-1044; Space Mono va embebida desde `assets/fonts`, OFL).
- **Simulador** (`POST /api/simulador`): usa el pipeline real contra el
  tenant demo. Límites: 5 mensajes por minuto y 20 por día por IP; superado
  el cap global diario (`SIMULATOR_DAILY_CAP`, 300 por defecto) sigue
  atendiendo con el clasificador por palabras sin avisar nada distinto.
  Los reclamos entran con `origen = simulador`, numeración correlativa
  desde R-1049, y jamás disparan mensajes salientes.
- **Reset diario** (`/api/demo/reset`, POST o GET): borra lo que no es
  seed, revierte las mutaciones sobre los reclamos sembrados, re-ancla el
  timeline de R-1044 al día corriente en Buenos Aires y purga los rate
  limits (función SQL `demo_reset()`, solo service role). Requiere
  `Authorization: Bearer $DEMO_RESET_SECRET`. El cron de `vercel.json`
  corre 09:00 UTC (06:00 en Buenos Aires); como Vercel manda
  `Authorization: Bearer $CRON_SECRET`, definí `CRON_SECRET` en el
  proyecto (puede ser el mismo valor que `DEMO_RESET_SECRET`).
- **Audio de Marta** (opcional): `pnpm seed:audio` sintetiza el audio del
  timeline de R-1044 con ElevenLabs y lo sube a Storage. Sin
  `ELEVENLABS_API_KEY`, el player del detalle queda en modo simulado,
  como el prototipo.

## WhatsApp (env-gated)

El adaptador de WhatsApp Cloud API vive en `app/api/whatsapp/webhook` y
`lib/whatsapp/`. Sin las variables `WHATSAPP_*` el webhook responde 200 y no
hace nada: la demo no depende de WhatsApp.

- **Vecino registrado** (teléfono en `residents`): cada mensaje corre el
  pipeline real — clasificación, número de seguimiento, confirmación por
  WhatsApp. Los audios se transcriben con ElevenLabs Scribe (si hay
  `ELEVENLABS_API_KEY`; si no, se le pide el texto al vecino) y las fotos
  van a Storage: con texto abren un reclamo nuevo, solas se adjuntan al
  reclamo de la última media hora.
- **Número desconocido**: alta conversacional (edificio → unidad → nombre,
  máquina de estados en `lib/whatsapp/onboarding.ts`, estado en
  `wa_sessions`). Si el primer mensaje ya era el reclamo, se registra
  apenas termina el alta. El vecino queda `verificado` por el propio alta.
- **Salientes solo para origen whatsapp**: la respuesta desde el panel se
  manda por WhatsApp únicamente si el reclamo llegó por ese canal; los del
  simulador jamás disparan mensajes. Los reintentos del webhook se
  descartan por `wa_message_id` (mensajes) y `ultimo_wamid` (onboarding).

Para encenderlo: en [developers.facebook.com](https://developers.facebook.com)
crear una app Business con el producto WhatsApp, tomar el token y el
`PHONE_NUMBER_ID` del número de prueba, definir un `WHATSAPP_VERIFY_TOKEN`
propio y suscribir el webhook a `https://<dominio>/api/whatsapp/webhook`
(campo `messages`). `WHATSAPP_APP_SECRET` (opcional) valida la firma de
cada POST.

Pendientes de Meta para producción (fuera de Fase 0): verificación del
negocio, un número propio (el de prueba solo escribe a 5 números
registrados), token permanente de system user, y plantillas aprobadas para
escribir fuera de la ventana de 24 horas — dentro de la ventana el texto
libre alcanza.

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
15. **Orden de edificios: el más grande primero.** El select de expensas del
    export lista Yerbal 1240 (24 UF) antes que Virrey Loreto 2680 (18 UF) y
    abre en Yerbal; alfabéticamente sería al revés. Criterio adoptado en la
    card de expensas y en la pantalla Edificios: total de unidades
    descendente, desempate por dirección.
16. **"Esperan tu acción" ordena por urgencia.** Urgente, alta, media, baja;
    desempate por ingreso más reciente. Es el orden del export (R-1047
    urgente arriba); por fecha sola, R-1048 taparía al urgente.
17. **La clasificación se registra después de la foto.** El timeline del
    detalle ordena estricto por hora y el diseño agrupa audio + foto antes
    del chip "Clasificado…"; el evento va sembrado 14:02:45 (la foto,
    14:02:41).
18. **El texto del H1 de la landing** se deja fluir con `text-wrap: balance`
    dentro de los 880px del export (tres líneas a 1440): el markup replica
    el export y el corte de línea es el que el navegador calcule.

## Verificación

Automática (corre en cualquier máquina con Node y PostgreSQL):

```bash
pnpm typecheck && pnpm lint && pnpm test   # tipos, estilo y 53 tests
pnpm build                                 # build de producción sin warnings
pnpm db:local                              # migraciones + seed x2 + asserts
```

`pnpm db:local` valida contra un Postgres efímero: conteos exactos del
seed, KPIs (2,1 días / 38 s), numeración correlativa, RLS (anon y un
autenticado ajeno leen cero filas), reset del demo con re-anclaje de
fechas y dedupe de mensajes de WhatsApp.

Manual (contra el deploy, ~2 minutos): escribir en el simulador de la
landing → el reclamo aparece en la bandeja del panel por Realtime con su
animación → abrir el detalle → Emitir orden de trabajo → Marcar resuelto →
verificar los eventos en el timeline. El sexto mensaje seguido al
simulador responde con el aviso de ritmo. La comparación visual se hace en
`/styleguide` (componentes y pantallas con fixtures, y el export original
embebido al pie para mirar lado a lado).

## Pendientes de Fase 1

- Formularios de edición en Edificios, Proveedores y Ajustes (Fase 0 los
  muestra solo lectura).
- Encendido de WhatsApp en producción: número propio, verificación del
  negocio en Meta, token permanente y plantillas aprobadas (el adaptador
  ya está construido y env-gated, ver sección WhatsApp).
- Panel responsive.
- Automatización de órdenes de trabajo por categoría (`ot_automatica`).

## Estructura

```
app/                    rutas (App Router)
components/             componentes de interfaz
design-reference/       export de Claude Design: fuente de verdad visual
lib/                    dominio, pipeline, whatsapp, entorno y clientes de Supabase
scripts/                verificación local de la base y seeds auxiliares
supabase/migrations/    schema, numeración, RLS, Realtime, Storage, demo, whatsapp
supabase/seed/          seed.sql del tenant demo + assets + stub local
supabase/setup-completo.sql  todo lo anterior en un archivo para el SQL Editor
```
