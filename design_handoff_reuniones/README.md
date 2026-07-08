# Handoff: Módulo Reuniones — asambleas de consorcio (Ventanilla)

## Overview

Agregado al panel Ventanilla ya construido. El módulo cubre el ciclo completo de una asamblea de consorcio:

1. **Convocatoria**: la administración convoca; Ventanilla avisa por WhatsApp a todas las unidades con link a la reunión virtual y datos de la presencial.
2. **Ingresantes**: el listado de asistentes se arma solo con las respuestas por WhatsApp (modo virtual o presencial), con quórum calculado en vivo.
3. **Acta**: al cierre de la asamblea se genera automáticamente un borrador de acta a partir de la grabación y las votaciones registradas, con la forma de un acta manual de consorcio. La administración la revisa y la envía a los vecinos.

Contenido ficticio del caso de estudio: Administración Iribarne, edificio Yerbal 1240 (24 unidades).

## Sobre los archivos de diseño

Los archivos de `design/` son **referencias de diseño en HTML** — prototipos que muestran aspecto y comportamiento. **No son código de producción.** La tarea es recrear estas vistas en el codebase existente de Ventanilla, **reutilizando** los tokens y componentes ya construidos (paleta papel/tinta/verde sello, sidebar, chips sello, ticket punteado, botones, Space Grotesk / Public Sans / Space Mono). `support.js` es runtime del prototipo, no se porta.

`design/Panel Reuniones.dc.html` es la pantalla nueva completa. `design/Panel Hoy.dc.html` se incluye solo como referencia del módulo "Próxima asamblea" y del ítem de navegación (el resto de esa pantalla ya existe en el repo).

## Fidelidad

**Alta (hi-fi).** Colores, tipografía, espaciado, copy e interacciones son finales. El texto visible se copia literal.

## Alcance (3 piezas)

### A. Ítem de navegación "Reuniones"

En la sidebar existente, entre Reclamos y Edificios. Icono Lucide `users` 22 px trazo 1.5. Mismos estados que el resto: activo fondo `#E3EDE7` texto `#1E4D3F`; inactivo `#5C6660`, hover fondo `#F7F5F0`.

### B. Módulo "Próxima asamblea" en el dashboard Hoy

Columna derecha, entre "Resumen del día" y "Últimos movimientos". Card estándar (blanca, borde `#E5E1D8`, radio 10, padding 16×20):

- Header: H2 "Próxima asamblea" (Space Grotesk 500, 19/26) + chip **CONVOCADA** (`#E3EDE7` / `#1E4D3F`).
- Tile de fecha 52×52: borde punteado 1.5 px `#1E4D3F`, radio 8, "16" Space Mono 700 19 verde + "JUL" Space Mono 700 10, tracking +8%, `#5C6660`.
- "Asamblea ordinaria · Yerbal 1240" (14/500) y "Jueves 19:00 · SUM y virtual" (12, `#8A928D`, hora en mono).
- Barra de quórum: 6 px alto, radio 3, track `#E8E6DF`, relleno `#1E4D3F` al 58%.
- "14 de 24 unidades confirmaron" (12, `#8A928D`, cifra en Space Mono 700 `#1C2B26`) + link "Ver reunión" (13/500 verde, hover subrayado) → pantalla Reuniones.

### C. Pantalla "Reuniones"

Header: H1 "Reuniones" (Space Grotesk 700, 26/32) + botón secundario "Convocar asamblea" (40 px, icono +). Layout: grid 62/38, gap 20; **cada columna es un stack vertical con gap 20** (los módulos quedan pegados: el acta va justo debajo de Próxima asamblea; Estado del acta debajo de Ingresantes).

#### C1. Card "Próxima asamblea" (columna izquierda, arriba)

- Header de card: H2 + chip CONVOCADA. Divisor interno `#F0EDE6`.
- Fila de fecha: tile 64×64 punteado ("16" mono 700 24 / "JUL" mono 11) + "Asamblea ordinaria" (16/600), "Yerbal 1240 · jueves 16 de julio · 19:00 · segunda convocatoria 19:30" (13, `#5C6660`, horas en mono) y "Convocatoria enviada el 1 de julio por WhatsApp a las 24 unidades." (12, `#8A928D`).
- Dos cajas lado a lado (borde `#E5E1D8`, radio 8, padding 14):
  - **VIRTUAL** (label 11/600 +6% con icono Lucide `video` 15): link `reunion.ventanilla.ar/yerbal-1240` en Space Mono 700 13 verde; botón chico secundario "Copiar link" (32 px) → *copia al portapapeles y muestra "Copiado" con check verde 2 s*; "Se abre en el navegador, sin cuenta." (12, `#8A928D`).
  - **PRESENCIAL** (icono `map-pin`): "SUM · planta baja" (14/500), "Yerbal 1240, CABA" (13, `#5C6660`), "El libro de asistencia se firma al entrar." (12, `#8A928D`).
- **ORDEN DEL DÍA** (label 11/600): tres ítems 14 px con número en Space Mono 700 verde: 1 Rendición de cuentas del primer semestre. · 2 Renovación del contrato de limpieza. · 3 Uso de espacios comunes: mascotas y horarios.
- **QUÓRUM** (label, sobre divisor punteado `#E5E1D8`): barra 6 px al 58% + "14 de 24 unidades confirmaron · quórum alcanzado" ("14 de 24" mono 700; "quórum alcanzado" 600 `#17603B`). Estado alternativo sin quórum: relleno ámbar `#C97A10`, "faltan N unidades para el quórum" en `#92600A`. Regla: quórum = 13 de 24 (mitad + 1).

#### C2. Documento "Acta N° 47 · Asamblea extraordinaria" (columna izquierda, debajo)

Card blanca con padding 36×40, `position:relative`.

- **Sello rotado** −5° arriba a la derecha: "BORRADOR" (borde 1.5 px y texto `#92600A`) o "ENVIADA" (`#1E4D3F`); 11/600, tracking +12%, padding 5×12, radio 4. Es un sello de goma: solo contorno, sin fondo.
- Encabezado centrado: "CONSORCIO YERBAL 1240 · CIUDAD AUTÓNOMA DE BUENOS AIRES" (11/600 +8% `#8A928D`), título "Acta N° 47 · Asamblea extraordinaria" (Space Grotesk 700, 22/28), "2 de julio de 2026 · 19:04 a 20:38 · SUM y virtual" (Space Mono 12 `#8A928D`). Divisor punteado.
- Cuerpo 14/22 **justificado**, redacción protocolar literal:
  - "En la Ciudad Autónoma de Buenos Aires, a los 2 días del mes de julio de 2026, siendo las 19:04, se reúnen en asamblea extraordinaria los propietarios del edificio de la calle Yerbal 1240, en el salón de usos múltiples de planta baja y por videollamada, convocados por Administración Iribarne."
  - "Preside la asamblea la Sra. Marta Gorosito (5°B). Actúa como secretario de actas el Sr. Roberto Etcheverry (2°A). Con 16 unidades funcionales presentes sobre 24 —10 en el salón y 6 conectadas— se declara válida la sesión en primera convocatoria."
- **ORDEN DEL DÍA Y RESOLUCIONES** (label): tres puntos, cada uno con título 14/600, resolución 14/21 `#5C6660` justificada y votos en Space Mono 12 verde:
  1. Impermeabilización de la terraza y filtraciones asociadas. — "Presentados tres presupuestos, se aprueba el de Techados Camet por $ 4.850.000 (monto en mono), pagadero en tres cuotas por expensas extraordinarias. La obra comienza la semana del 20 de julio." — 12 a favor · 3 en contra · 1 abstención
  2. Actualización del fondo de reserva. — "Se aprueba llevar el fondo de reserva del 5 al 8 por ciento del presupuesto mensual, a partir de la liquidación de agosto." — 14 a favor · 2 en contra
  3. Varios. — "El 3°A solicita la reparación de la puerta del ascensor de su piso. Queda registrado como reclamo R-1032 (ticket en mono 700 verde). Sin más temas que tratar, siendo las 20:38 se levanta la sesión."
- **Firmas**: grid de 3 columnas, cada una con línea superior `1px dotted #8A928D`, nombre 13/600 y rol 11 `#8A928D`: Marta Gorosito / Presidenta de asamblea · Roberto Etcheverry / Secretario de actas · Carla Méndez / Administración Iribarne.

#### C3. Card "Ingresantes" (columna derecha, arriba)

- Header: H2 "Ingresantes" + contador Space Mono 700 14 verde "14/24".
- Filas (padding 11×20, divisor `#F0EDE6`): UF en Space Mono 700 12 `#5C6660` (columna 46 px) + nombre 14/500 con unidad 12 `#8A928D` debajo + a la derecha chip de modo y hora de confirmación en mono 11 `#8A928D`.
- Chips de modo (sello, 11/600 +8%, padding 3×8, radio 4): **VIRTUAL** `#E3EDE7`/`#1E4D3F` · **PRESENCIAL** `#EEF1EF`/`#3F4A45`.
- Datos literales: UF 11 Marta Gorosito 5°B virtual hace 2 h · UF 04 Roberto Etcheverry 2°A presencial hace 3 h · UF 15 Diego Lamas 7°B virtual ayer · UF 09 Silvia Paredes 4°C presencial ayer · UF 02 Nélida Ferrero 1°C presencial ayer · UF 21 Andrés Bruzzone 8°A virtual lunes · UF 07 Graciela Ponte 3°B presencial lunes · UF 18 Federico Sain 6°B virtual lunes.
- Pie: "y 6 unidades más confirmaron · faltan responder 10" + "El listado se arma solo con las respuestas por WhatsApp a la convocatoria." (12, `#8A928D`).
- *Comportamiento en vivo*: cuando llega una confirmación nueva, la fila entra animada (fade + translateY 4 px, 0.3 s) y se actualizan contador, resumen del pie y barra de quórum.

#### C4. Card "Estado del acta" (columna derecha, debajo)

- Grid label/valor (labels 11/600 +6% `#8A928D`, columna 104 px): ESTADO chip **BORRADOR** (`#FDF0DC`/`#92600A`) → **ENVIADA** (`#DCEFE2`/`#17603B`) · ASAMBLEA "Extraordinaria · 2 de julio" · GENERADA "2 jul 21:03" (mono 13) · ORIGEN "Grabación de la asamblea y votaciones registradas" · ASISTENCIA "16 de 24 unidades".
- Nota (12, `#8A928D`): "El borrador se arma solo al cierre de la asamblea. Revisalo antes de enviarlo."
- Botón primario full-width "Enviar a los vecinos" → al click: banda verde `#DCEFE2` con check "Enviada a las 24 unidades por WhatsApp", chip ESTADO pasa a ENVIADA y el sello del documento pasa a ENVIADA (animado).
- Botón secundario full-width "Copiar texto" → copia el acta completa en texto plano al portapapeles y muestra "Copiado" 2 s.

## Interacciones (resumen)

- Copiar link / copiar texto: feedback "Copiado" con check verde `#17603B` durante 2 s.
- Enviar acta: transición BORRADOR → ENVIADA en chip y sello, banda de confirmación verde.
- Confirmación nueva de ingresante: fila animada + contador + quórum en vivo.
- Elementos nuevos entran con fade + translateY(4px) 0.3 s ease (patrón existente del panel).
- Horas y números siempre en Space Mono; tiempos relativos ("hace 2 h", "ayer", "lunes").

## Modelos de datos sugeridos

- `Asamblea { id, tipo: 'ordinaria'|'extraordinaria', edificioId, fecha, hora, segundaConvocatoria, linkVirtual, lugarPresencial, ordenDelDia: string[], convocadaEl, estado: 'convocada'|'en_curso'|'cerrada' }`
- `Confirmacion { asambleaId, ufId, nombre, unidad, modo: 'virtual'|'presencial', confirmadaEl }` — el listado de ingresantes y el quórum se derivan de acá. Quórum: confirmaciones ≥ (unidades/2 + 1) → 13 de 24.
- `Acta { id, numero, asambleaId, estado: 'borrador'|'enviada', generadaEl, asistencia: { presentes, total, presencial, virtual }, apertura, resoluciones: { titulo, texto, votos: { favor, contra, abstenciones } }[], cierre, firmas: { nombre, rol }[] }`
- Servicios a mockear detrás de interfaces: `convocarAsamblea()`, `onConfirmacion()` (entrada por WhatsApp), `generarActa(asambleaId)` (se dispara al cierre, usa grabación + votaciones), `enviarActa(actaId)`.

## Reglas de contenido (duras)

Castellano rioplatense con voseo. Sin signos de exclamación. Sin emojis. Sin jerga técnica. La palabra IA (o bot/chatbot) no aparece nunca en texto visible. Chips siempre rectangulares radio 4, nunca pills. Nada de violeta ni azul en el panel.

## Screenshots

Referencia visual (la fuente de verdad son los prototipos de `design/`):

- `screenshots/01-reuniones-asamblea-ingresantes.jpg` — parte superior: Próxima asamblea + Ingresantes, quórum alcanzado, acta en BORRADOR asomando.
- `screenshots/02-reuniones-acta.jpg` — el documento del acta y Estado del acta.
- `screenshots/03-reuniones-firmas.jpg` — cierre del acta con las tres firmas.
- `screenshots/04-reuniones-acta-enviada.jpg` — tras "Enviar a los vecinos": sello y chip ENVIADA, banda de confirmación verde.
- `screenshots/05-hoy-modulo-asamblea.jpg` — dashboard Hoy con el módulo "Próxima asamblea" en la columna derecha y el ítem Reuniones en la sidebar.

## Archivos

- `design/Panel Reuniones.dc.html` — la pantalla nueva (fuente de verdad).
- `design/Panel Hoy.dc.html` — solo como referencia del módulo del dashboard y la sidebar.
- `design/support.js` — runtime del prototipo (solo para abrir los mocks; no portar).

Se abren directo en el navegador; los links entre pantallas funcionan.
