# Brief de continuidad — Cheers (joincheers.app)

*Preparado el 23 de julio de 2026, para pegar al inicio de una conversación nueva con Claude y seguir exactamente donde se quedó.*

## 1. Contexto del proyecto

Cheers (joincheers.app) es una app de Next.js 16 + Supabase + Vercel para organizar celebraciones — "la celebración, en un link", sin grupos de WhatsApp. Patty es la única desarrolladora, sin equipo técnico, presupuesto bajo, prioriza que funcione y esté seguro sobre que se vea perfecto.

**Reglas de trabajo que Claude debe seguir siempre en este proyecto** (ya configuradas en las instrucciones del proyecto, repetidas aquí por si se pierden):
- Correr `npx tsc --noEmit` y `npx next build` antes de dar cualquier cambio por terminado, sin excepción.
- Si el cambio toca una tabla de Supabase, revisar las policies de RLS reales (consulta a `pg_policies`) antes de asumir que están protegidas.
- Si se crea o modifica una policy de RLS, mostrar el SQL exacto antes de correrlo, con explicación de una línea.
- Cambios en pasos chicos, uno a la vez, esperando confirmación.
- Preguntar antes de construir cuando sea una decisión de producto, no un fix obvio.
- Avisar de huecos de seguridad o bugs reales encontrados de paso, aunque no sea lo que se buscaba.
- Si algo es grande (varios archivos, cambia el modelo de datos, requiere configurar algo externo), avisar antes y dar los pasos de configuración uno a la vez.
- Sin emojis en correos transaccionales (sí se permiten en redes sociales).
- Sin dumps de código completos en el chat — Claude tiene acceso directo de escritura a la carpeta, aplica los cambios y resume.
- Nunca usar nombres de competidores (ej. Splitwise) para describir features de Cheers.
- Antes de dar comandos de git, revisar TODO lo pendiente en archivos relacionados (ej. componente + i18n.ts), no solo el que se acaba de tocar.
- **Limitación del sandbox:** Claude no puede hacer `git push` desde su entorno — Patty lo corre ella misma desde su Terminal (la carpeta conectada es la real). Tampoco tiene salida de red libre por curl/fetch directo a dominios externos (Supabase, Resend, etc. están bloqueados por el proxy del sandbox) — pero SÍ tiene acceso directo vía MCP tools a Supabase (consultas SQL de solo lectura verificadas, proyecto `ykqlgogliwqgpxsmutvx`) y a Resend (mismo dominio verificado `joincheers.app`, puede mandar correos de prueba reales).

## 2. Modelo de negocio (confirmado, no cambiar sin preguntar)

Tres planes, pago único (no suscripción):
- **Cheer (gratis)** — cuenta completa: 1 celebración activa, 3 invitados, itinerario básico, `perfiles.plan = 'free'`.
- **Super Cheer ($9 USD, pago único)** — upgrade **por celebración** (`celebraciones.plan = 'pro'`): 10 invitados, itinerario completo, regalos, modo sorpresa, personalización. Una cuenta puede tener eventos Pro y Free al mismo tiempo, es intencional.
- **Extra Cheer ($49 USD, pago único, de por vida)** — upgrade **de cuenta completa** (`perfiles.plan = 'lifetime'`): todo desbloqueado para siempre, en todos los eventos presentes y futuros, más link público sin necesidad de cuenta para los invitados.

Los valores internos (`free`/`pro`/`lifetime`) no coinciden con los nombres visibles al usuario (Cheer/Super Cheer/Extra Cheer) — es decisión deliberada de Patty, no renombrar las columnas.

**Stripe:** integración completa construida y funcionando en modo test/sandbox (checkout, webhook, gating de features, trigger de Postgres como defensa adicional). Pendiente y diferido a petición de Patty: activar cobros reales (verificación de negocio/banco), mover llaves de test a live en Vercel, registrar el webhook de producción con la URL real. Nota: la llave `STRIPE_SECRET_KEY` en `.env.local` ya es `sk_live_...`, pero la activación real del negocio en Stripe sigue pendiente — no asumir que ya se puede cobrar de verdad sin confirmarlo primero.

## 3. Modelo de acceso a eventos (confirmado 2026-07-13)

Cualquiera que abre el link de una celebración, sin importar el plan del organizador:
- **Sin cuenta (anónimo):** solo ve la vista "breve" — festejado, badge de sorpresa (si aplica), fecha, lugar, confirmar asistencia por nombre. Nunca ve el detalle completo.
- **Con cuenta (cualquier plan):** ve todo el detalle, se registra automáticamente como `invitado`.
- **Regla especial de organizadores Lifetime:** los primeros 10 usuarios autenticados distintos que abren el link de un evento específico quedan desbloqueados a detalle completo como regalo del organizador (contados vía RPC `contar_desbloqueados`, filtrando `invitados` con `user_id is not null` para ese `celebracion_slug`). El visitante 11+ solo ve la vista breve, A MENOS que su propia cuenta también sea Lifetime (ahí se desbloquea por su propio perk, sin consumir cupo del organizador ni crear fila en `invitados`). Una vez desbloqueado, queda desbloqueado permanentemente para ese evento.

Implementado en `app/[usuario]/[evento]/page.tsx`. Si se pide cambiar el número "10" o la lógica de cascada, es decisión de producto — confirmar con Patty antes de tocar la constante.

## 4. Lo que se hizo en la conversación anterior (22-23 de julio 2026)

### 4.1 Redes sociales — Instagram
- Se creó la cuenta **@joincheers** en Instagram (username @cheers ya estaba tomado por una cuenta sin relación con la marca — verificado navegando ambos perfiles).
- Vinculada a **Meta Business** (Facebook + Instagram).
- Gmail dedicado creado: **joincheers.app@gmail.com**. Nota importante: Google dio de baja este Gmail poco después de crearlo por sospecha de bot (falso positivo en el proceso de verificación de cuenta). Patty ya apeló — **estado de la apelación sin resolver**, revisar si hay actualización.
- Estrategia de redes reescrita en **decisiones** (no sugerencias) y exportada a PDF: `Estrategia_Redes_Sociales_Cheers.pdf`, guardada en la carpeta de Cheers (reemplazó la versión `.md` anterior). Resumen de las decisiones:
  - Instagram como plataforma principal; TikTok como repost secundario (mismo contenido, sin producir aparte). Pinterest se incorpora en el mes 3-4.
  - Bio decidida: *"La celebración, en un link. ✦ / Cumples, posadas, XV, despedidas — sin grupos de chat, sin drama. / joincheers.app"*.
  - Nombre visible de cuenta: "Cheers — La celebración en un link".
  - Sí se usan emojis en redes (a diferencia de correos).
  - 4 pilares de contenido: (1) el caos de WhatsApp/humor, (2) tipos de celebración real, (3) cómo funciona Cheers, (4) modelo de pago único.
  - Cadencia: 3 posts/semana (lunes carrusel, miércoles reel sin rostro, viernes meme), producidos en un solo bloque de batch semanal.
  - Calendario detallado de las primeras 4 semanas incluido en el PDF.
- **Pendiente:** no hay logo/foto de perfil todavía — no existe ningún asset de marca en `/public` del repo (solo los SVG default de Next.js). Falta definir o diseñar uno.
- **Pendiente:** actualizar el campo `sameAs` del schema.org en el código del sitio con la URL del perfil de Instagram — es un cambio de una línea, Claude lo ofreció pero **Patty no ha confirmado todavía si procede**.

### 4.2 Feature nueva: invitación por correo al agregar invitado

**Qué pedía Patty:** que al agregar a alguien por correo a cualquier tipo de evento (cumpleaños, viaje, cena, meet, lo que sea — no hay distinción por tipo), le llegue un correo de notificación con detalles MUY breves (lo mismo que ya ve un visitante anónimo: festejado, fecha, lugar), con un link al evento. Si esa persona no tiene cuenta, ve la vista breve existente y se le invita a crear cuenta para ver el dashboard completo.

**Decisiones confirmadas con Patty:**
- Se manda **inmediato** al agregar el email (no en lote).
- **No se reenvía** si se agrega el mismo email dos veces al mismo evento — pero si otro organizador distinto lo invita a OTRO evento (otro slug), sí le llega, porque es un evento distinto (confirmado explícitamente por Patty con el ejemplo de "yo lo invito a un cumpleaños, mi hermana lo invita a una cena").

**Qué se construyó:**
- Nueva ruta `app/api/invitar-por-email/route.ts`: rate limit por IP (10/60s, mismo patrón que las demás rutas de correo), busca la celebración y el perfil del organizador con `SUPABASE_SERVICE_ROLE_KEY`, arma un correo breve (festejado, fecha formateada, lugar si existe, badge de "es sorpresa" en texto plano SIN emoji si aplica y el organizador es Pro/Lifetime, nombre del organizador si lo tiene guardado, botón al link del evento con UTM), usa el helper compartido `envolverEmail`/`trackedLink` de `app/emailTemplate.ts`, envía con Resend desde `notificaciones@joincheers.app`.
- Editado `agregarInvitado()` en `app/[usuario]/[evento]/page.tsx`: cuando se agrega por email (no por teléfono) y no es duplicado dentro de ese mismo evento, dispara `fetch('/api/invitar-por-email', ...)` en fire-and-forget (mismo patrón que `notificar-rsvp`).
- No se tocó ninguna tabla ni policy de Supabase — solo la ruta nueva y el ajuste chico en la función existente.

**Bug real encontrado y corregido durante la verificación:** la ruta nueva usaba `perfiles.nombre` como nombre de columna, pero la columna real es `perfiles.nombre_completo` (se confirmó consultando el schema real vía Supabase MCP). Esto habría roto silenciosamente el nombre del organizador en el correo Y el cálculo de `esSorpresa` para organizadores Pro/Lifetime. Ya corregido en el código.

**Verificación hecha:**
- `npx tsc --noEmit` — limpio, sin errores (dos veces, antes y después del fix del bug).
- `npx next build` — build completo exitoso (tuvo que hacerse copiando el proyecto a `/tmp` fuera del punto de montaje FUSE, porque el build directo sobre la carpeta conectada falla con `EPERM` al hacer unlink de archivos temporales — es una limitación del entorno, no del código; si hay que repetir el build en el futuro, usar el mismo workaround de copiar a `/tmp`, copiar `node_modules` con `rsync`, y correr `next build` ahí).
- Se mandó un correo de **prueba real** (marcado claramente como "[PRUEBA]" en el asunto) a patty.eugenia@gmail.com vía el MCP de Resend conectado, usando datos reales de un evento existente de la propia Patty (`patty_eugenia/puerto-escondido-me-caso`, consultado vía Supabase MCP) para confirmar que el diseño y el copy se ven bien. Confirmado visualmente.

**Estado actual: el código NO está desplegado a producción.** Sigue solo en la carpeta local/conectada hasta que Patty haga `git push` desde su propia Terminal (limitación del sandbox). Una vez desplegado, se puede probar el flujo real agregando un invitado por email desde la app en producción.

**Follow-up pendiente:** Patty ya llenó el campo `nombre_completo` de su perfil con "Gonzalo" (no está claro si es su propio perfil bajo otro nombre, o si el evento de prueba pertenece a otra persona — no se indagó más, no era relevante para la tarea). Esto hará que la próxima prueba real muestre la línea "Organiza Gonzalo" en el correo.

## 5. Próximos pasos sugeridos (en orden, uno a la vez, según el estilo de trabajo de Patty)

1. Confirmar si Patty ya hizo `git push` / deploy — si sí, ofrecer probar el flujo real end-to-end agregando un invitado de prueba desde la app en producción.
2. Resolver si se actualiza el `sameAs` del schema.org con el link de Instagram (pendiente de confirmación de Patty).
3. Revisar estado de la apelación del Gmail joincheers.app@gmail.com dado de baja por Google.
4. Definir/diseñar un logo o foto de perfil para Instagram (no existe ningún asset de marca todavía).
5. Seguir el calendario de contenido de las primeras 4 semanas del PDF de estrategia de redes.
6. Cuando Patty esté lista, retomar los pasos pendientes de Stripe en producción (activación real de cobros) — uno a la vez, según sus instrucciones.

## 6. Dónde está todo

- Estrategia de redes: `Estrategia_Redes_Sociales_Cheers.pdf` en la carpeta de Cheers.
- Ruta nueva: `app/api/invitar-por-email/route.ts`.
- Cambio en: `app/[usuario]/[evento]/page.tsx` (función `agregarInvitado`).
- Helper de correos compartido: `app/emailTemplate.ts` (no tocado, solo reutilizado).
- Proyecto de Supabase: `ykqlgogliwqgpxsmutvx` (nombre "Cheers", región us-east-1).
- Dominio de Resend verificado: `joincheers.app`.
