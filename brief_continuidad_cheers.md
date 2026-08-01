# Brief de continuidad — Cheers (joincheers.app)

*Preparado el 1 de agosto de 2026, para pegar al inicio de una conversación nueva con Claude y seguir exactamente donde se quedó. Reemplaza la versión del 23 de julio (varias cosas que ahí decían "pendiente" ya se resolvieron).*

## 1. Contexto del proyecto

Cheers (joincheers.app) es una app de Next.js 16 + Supabase + Vercel para organizar celebraciones — "la celebración, en un link", sin grupos de WhatsApp. Patty es la única desarrolladora, sin equipo técnico, presupuesto bajo, prioriza que funcione y esté seguro sobre que se vea perfecto.

**Reglas de trabajo que Claude debe seguir siempre en este proyecto** (ya configuradas en las instrucciones del proyecto, repetidas aquí por si se pierden):
- Correr `npx tsc --noEmit` y `npx next build` antes de dar cualquier cambio por terminado, sin excepción.
- Si el cambio toca una tabla de Supabase, revisar las policies de RLS reales (consulta a `pg_policies`, o `get_advisors` con el MCP de Supabase) antes de asumir que están protegidas.
- Si se crea o modifica una policy de RLS (o cualquier cambio de esquema en Supabase), mostrar el SQL exacto antes de correrlo, con explicación de una línea.
- Cambios en pasos chicos, uno a la vez, esperando confirmación.
- Preguntar antes de construir cuando sea una decisión de producto, no un fix obvio.
- Avisar de huecos de seguridad o bugs reales encontrados de paso, aunque no sea lo que se buscaba.
- Si algo es grande (varios archivos, cambia el modelo de datos, requiere configurar algo externo), avisar antes y dar los pasos de configuración uno a la vez.
- Sin emojis en correos transaccionales NI en la UI de la app (sí se permiten en redes sociales).
- Sin dumps de código completos en el chat — Claude tiene acceso directo de escritura a la carpeta, aplica los cambios y resume.
- Nunca usar nombres de competidores (ej. Splitwise) para describir features de Cheers.
- Antes de dar comandos de git, revisar TODO lo pendiente en archivos relacionados (ej. componente + i18n.ts), no solo el que se acaba de tocar.
- **Limitaciones del sandbox:** `git push` y `npx next build` fallan directo desde el sandbox por un problema del bind-mount (no puede desligar ciertos archivos temporales/lock) — Patty los corre ella misma desde su Terminal real. `npx tsc --noEmit` sí funciona bien en el sandbox. Tampoco hay salida de red libre por curl/fetch directo a dominios externos (Supabase, Resend, Vercel, Facebook, etc. bloqueados por el proxy) — pero SÍ hay MCPs conectados para varios de esos: **Supabase** (SQL real, incluye `apply_migration` para DDL — usar esa en vez de `execute_sql` para crear funciones/triggers, el clasificador bloquea DDL vía `execute_sql`), **Resend**, **Vercel**, y browser control vía Claude in Chrome (útil para pantallas que no tienen MCP, ej. Facebook Developers, o toggles del dashboard de Supabase que no están expuestos por su MCP).

## 2. Modelo de negocio (confirmado, no cambiar sin preguntar)

Tres planes, pago único (no suscripción):
- **Cheer (gratis)** — cuenta completa: 1 celebración activa, 3 invitados, itinerario básico, `perfiles.plan = 'free'`.
- **Super Cheer ($9 USD, pago único)** — upgrade **por celebración** (`celebraciones.plan = 'pro'`): 10 invitados, itinerario completo, regalos, modo sorpresa, personalización. Una cuenta puede tener eventos Pro y Free al mismo tiempo, es intencional.
- **Extra Cheer ($49 USD, pago único, de por vida)** — upgrade **de cuenta completa** (`perfiles.plan = 'lifetime'`): todo desbloqueado para siempre, en todos los eventos presentes y futuros, más link público sin necesidad de cuenta para los invitados.

Los valores internos (`free`/`pro`/`lifetime`) no coinciden con los nombres visibles al usuario (Cheer/Super Cheer/Extra Cheer) — es decisión deliberada de Patty, no renombrar las columnas.

**Stripe: EN VIVO en producción**, confirmado con `sk_live_` verificada el 21 de julio de 2026. Ya se puede cobrar de verdad. Nota: la cuenta de Stripe de Patty también maneja los payouts de su Substack — compartida, no es exclusiva de Cheers, tenerlo presente si se toca algo de Stripe.

## 3. Modelo de acceso a eventos (confirmado 2026-07-13)

Cualquiera que abre el link de una celebración, sin importar el plan del organizador:
- **Sin cuenta (anónimo):** solo ve la vista "breve" — festejado, badge de sorpresa (si aplica), fecha, lugar, confirmar asistencia por nombre. Nunca ve el detalle completo.
- **Con cuenta (cualquier plan):** ve todo el detalle, se registra automáticamente como `invitado`.
- **Regla especial de organizadores Lifetime:** los primeros 10 usuarios autenticados distintos que abren el link de un evento específico quedan desbloqueados a detalle completo como regalo del organizador (contados vía RPC `contar_desbloqueados`, filtrando `invitados` con `user_id is not null` para ese `celebracion_slug`). El visitante 11+ solo ve la vista breve, A MENOS que su propia cuenta también sea Lifetime (ahí se desbloquea por su propio perk, sin consumir cupo del organizador ni crear fila en `invitados`). Una vez desbloqueado, queda desbloqueado permanentemente para ese evento.

Implementado en `app/[usuario]/[evento]/page.tsx`. Si se pide cambiar el número "10" o la lógica de cascada, es decisión de producto — confirmar con Patty antes de tocar la constante.

## 4. Features construidas desde el 23 de julio (resumen, sin el detalle de decisiones que se perdió)

- **Eventos recurrentes** completos estilo Outlook (terminado el 30 de julio): tabla `ocurrencias`, cron `generar-ocurrencias` que mantiene 10 fechas futuras generadas, solo para eventos Pro/Lifetime.
- **Gastos compartidos entre invitados** (`gastos`, `gasto_participantes`), con notificación a cada participante de cuánto le toca.
- **Centro de notificaciones in-app** con preferencias configurables por tipo (rsvp, regalo, mensaje, gasto, recordatorio) y por nivel (todo/importante/leve), más un cron de resumen (`resumen-notificaciones`) que agrupa lo que no se manda al instante.
- **Panel de "Crecimiento" en el admin** (analytics propio vía `eventos_analytics`, top creadores/invitadores, cuentas enfriadas), con selección múltiple para mandar mensaje masivo o regalar plan a varios usuarios de un jalón.
- **Regalar Lifetime/Pro desde el admin** sin tocar SQL a mano (`/api/admin-regalar-plan`).
- **Invitación por email** al agregar invitado — construida, verificada, y desplegada a producción (confirmado 2026-07-27).
- **"Olvidé mi contraseña"** — construido el 1 de agosto: link en `/login` (solo visible para quien entra con email/contraseña), página nueva `/reset-password` para poner la contraseña nueva. Usa el sistema de correos propio de Supabase Auth (el mismo que ya manda la confirmación de cuenta al registrarse), no requiere configurar nada externo. No dice si el email existe o no en la base, para no revelar qué correos ya tienen cuenta.
- **Login con Facebook** — construido y desplegado el 31 de julio (`app/login/page.tsx`, mismo patrón que Google vía `supabase.auth.signInWithOAuth`). App de Facebook (`967579169623123`) en modo Development — **solo funciona para Patty y quien agregue como tester en Facebook Developers**, hasta pasar App Review (falta: ícono, política de privacidad, flujo de eliminación de datos, categoría). Login con Apple se dejó pausado a propósito (Patty eligió empezar solo por Facebook, que es gratis; Apple cuesta $99/año de Apple Developer).
- **Cortesías Lifetime otorgadas:** Valente/Tito (novio), Ximena Mondragón, prima González, prima Quiroga (Priscilla — confirmado por SQL que ya tiene cuenta `priscilla_quiroga` con plan lifetime aplicado), Martha, Marcela R. Treviño.

## 5. Seguridad — auditoría completa del 31 de julio de 2026

Se hizo una revisión de seguridad de punta a punta (rutas API, RLS reales vía `pg_advisors`/`pg_policies`, XSS, dependencias). Resultado: el código en general está bien cuidado (tokens siempre verificados server-side, RLS activo en las 12 tablas, service role key nunca expuesta al cliente, webhook de Stripe valida firma, crons piden su secret, único HTML dinámico pasa por un sanitizador allowlist propio).

**Hallazgos y su estado:**
1. **RSVP flood — RESUELTO.** La policy de INSERT en `rsvps` era totalmente abierta (`WITH CHECK (true)`, sin rate-limit, `nombre`/`mensaje` sin límite de largo) — cualquiera podía llenar de RSVPs falsos cualquier evento (los slugs son adivinables, no son tokens secretos). Se agregaron `CHECK` de largo (nombre ≤100, mensaje ≤1000 caracteres) y un trigger `trg_limitar_rsvp_flood` que bloquea más de 50 inserts nuevos por celebración cada 10 minutos. El formulario de RSVP muestra un mensaje amigable si se choca con el límite.
2. **Leaked Password Protection — NO resuelto, requiere plan Pro de Supabase ($25/mes).** Patty decidió explícitamente no subir de plan solo por esto. Si algún día sube de plan por otra razón, activarlo de una vez en Authentication → Attack Protection → "Configure in email provider".
3. **Next.js con CVEs altos — RESUELTO.** Subido de `16.2.6` a `16.2.12` (parche, sin breaking changes).

Detalle completo en la memoria de Claude (`cheers_security_review_2026_07_31.md`) si se necesita revisar de nuevo.

Además, en una auditoría RLS anterior (27 de julio) ya se habían cerrado: bucket de `portadas` listable públicamente, `rsvps` legible por cualquiera, y `search_path` mutable en funciones. Y desde antes: XSS en el título del evento, lectura pública de `rsvps`/`regalo_reservas`, verificación real de sesión en varias rutas, y el hueco de lectura pública de `perfiles` (teléfonos) cerrado vía RPCs `SECURITY DEFINER` controladas.

## 6. Pendientes actuales (agosto 2026)

1. **Login con Apple** — pausado a propósito, retomar cuando Patty decida justificar el costo anual.
2. **App móvil con Capacitor** — decisión de producto sin arrancar. Es grande: toca cuentas externas (Apple Developer $99/año, Google Play $25 único), varios archivos. Dar los pasos de configuración uno a la vez si se retoma.
3. **Logo/foto de perfil para Instagram** — no existe ningún asset de marca en `/public` todavía.
4. **`sameAs` de schema.org con el link de Instagram** — cambio de una línea, ofrecido antes, sin confirmar todavía si Patty quiere que se aplique.
5. **RSVP flood** — el límite de 50 cada 10 min es una primera pasada; si en la práctica resulta muy bajo (evento muy popular) o muy alto (spam que igual se cuela), ajustar el número.

**Ya NO están pendientes** (estaban en la versión anterior de este brief, ya resueltos, no volver a preguntar):
- Apelación de la cuenta de Google `joincheers.app@gmail.com` — resuelta (confirmado por Patty el 31 de julio).
- Cuenta de Priscilla con plan Lifetime — confirmado que ya existe y está aplicado.
- Verificación del dominio de Resend en DNS — confirmado verificado vía la API de Resend.
- Activación de Stripe en modo live — ya está live desde el 21 de julio.

## 7. Dónde está todo

- Proyecto de Supabase: `ykqlgogliwqgpxsmutvx` (nombre "Cheers", región us-east-1) — MCP de Supabase conectado, usar `apply_migration` para cualquier DDL.
- Dominio de Resend verificado: `joincheers.app` — MCP de Resend conectado.
- App de Facebook Developers: `967579169623123` (modo Development).
- Estrategia de redes: `Estrategia_Redes_Sociales_Cheers.pdf` en la carpeta de Cheers.
- Lista de cortesías Lifetime: `cortesias_lifetime.md`.
- Helper de correos compartido: `app/emailTemplate.ts`.
- Login: `app/login/page.tsx` (Google + Facebook + email/password).
- Página pública de evento (RSVP, mensajes, gastos, etc.): `app/[usuario]/[evento]/page.tsx`.
- Admin de la plataforma (solo patty.eugenia@gmail.com): `app/[usuario]/admin_login/dashboard/page.tsx`.
