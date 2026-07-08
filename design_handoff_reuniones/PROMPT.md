# Prompt para Claude Code

Copiá y pegá esto en Claude Code, parado en el repo donde ya vive Ventanilla:

---

Agregá el **módulo de Reuniones (asambleas de consorcio)** a Ventanilla, que ya está construido en este repo (panel con Hoy, Reclamos y Detalle de reclamo). Es un agregado: no toques lo existente salvo donde se indica.

1. Leé primero `design_handoff_reuniones/README.md` completo. Es la fuente de verdad de alcance, contenido, interacciones y modelos de datos. En `screenshots/` está el resultado esperado.
2. Los archivos de `design_handoff_reuniones/design/` son **referencias de diseño en HTML** (prototipos hi-fi que se abren en el navegador). No los copies: recreá las vistas con los componentes, tokens y convenciones que este repo ya tiene (sidebar, chips sello, ticket punteado, botones, tipografías Space Grotesk / Public Sans / Space Mono).
3. Alcance, en orden:
   a. Ítem "Reuniones" en la navegación lateral, entre Reclamos y Edificios (icono Lucide `users`, 22 px, trazo 1.5).
   b. Módulo compacto "Próxima asamblea" en el dashboard Hoy, columna derecha, entre "Resumen del día" y "Últimos movimientos".
   c. Pantalla nueva "Reuniones" con: card Próxima asamblea (link virtual copiable, datos presenciales, orden del día, quórum), card Ingresantes (listado que se arma solo con las confirmaciones por WhatsApp), documento Acta N° 47 (generada automáticamente, con forma de acta manual) y card Estado del acta (enviar a los vecinos, copiar texto).
4. Copiá el texto visible LITERAL de los prototipos: el microcopy es parte del diseño. Castellano rioplatense con voseo, sin signos de exclamación, sin emojis, sin la palabra IA (ni bot, ni chatbot).
5. La lógica que el prototipo simula (confirmaciones que llegan, acta generada al cierre desde grabación y votaciones) va detrás de interfaces/servicios mockeados con estos mismos datos ficticios, listos para conectar al backend real.

Criterio de listo: la pantalla y el módulo comparten los tokens existentes al pixel, los chips nuevos (CONVOCADA, VIRTUAL, PRESENCIAL, BORRADOR, ENVIADA) siguen el patrón sello rectangular radio 4, y las interacciones del README funcionan.

---
