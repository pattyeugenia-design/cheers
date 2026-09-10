# Plan: Cheers Bridal — próximos pasos después de revisar Bodas.com.mx

Fecha: 2026-09-09

## Contexto

Bodas.com.mx es un ecosistema completo (directorio de +51,000 proveedores, blog, comunidad, wedding awards) con un "Organizador de boda" gratis adentro: agenda de tareas, proveedores (favoritos + notas), web de boda personalizable, presupuesto, plano de mesas y lista de invitados.

Cheers Bridal ya cubre bien varias de esas piezas (presupuesto, proveedores con contratos y pagos, invitados y RSVP con invitación digital, wedding planner con comparación de candidatos, y los módulos personales de novia/novio/pareja que ellos ni tienen). Este plan se enfoca solo en los huecos reales que vale la pena cerrar — no en replicar todo lo que hacen.

## Prioridad 1 — Plano de mesas (el de mayor impacto)

Herramienta visual para acomodar invitados en mesas y poder imprimirlo o compartirlo. Es la pieza más dolorosa de la organización de una boda que hoy Cheers Bridal no tiene, y no depende de nada externo (a diferencia del directorio de proveedores).

Toca el modelo de datos: necesita una tabla nueva (mesas + asignación de invitados a mesas), ligada a `boda_invitados`. Antes de construirlo te muestro el SQL y revisamos las policies de RLS, como siempre.

Alcance sugerido para una primera versión simple:
- Crear/nombrar mesas con capacidad
- Arrastrar invitados de `boda_invitados` a una mesa (o asignar desde un dropdown si el drag-and-drop resulta muy pesado para una primera versión)
- Vista de resumen: cuántos invitados sin mesa asignada
- Exportar o imprimir el plano (puede ser tan simple como una vista imprimible desde el navegador, sin generar PDF aparte)

## Prioridad 2 — URL personalizada de la invitación

Ahorita el link de la invitación de boda usa un ID generado (`/bridal/preview/[id]`). Bodas.com.mx deja poner los nombres de la pareja o una frase como URL. Cambio chico: agregar un campo de slug personalizado a `proyectos_boda` (parecido al que ya usan las celebraciones normales) y usarlo en el link que se comparte.

## Prioridad 3 — Encuestas/tests para invitados (opcional, más adelante)

Bonito pero bajo impacto — no lo pondría antes que las dos de arriba. Se puede retomar después si sobra tiempo.

## Lo que NO vamos a construir: directorio de proveedores

Bodas.com.mx tiene +51,000 proveedores con reseñas acumuladas por años — eso es un negocio de marketplace completo (moderación, verificación, reseñas, ventas a proveedores), no una feature que se agrega. No encaja con "una sola persona, poco presupuesto, prioriza que funcione." Cheers Bridal ya resuelve la necesidad real (dar seguimiento a los proveedores que la pareja ya está considerando) sin necesitar ser un directorio público.

## Lo que ya haces mejor (no tocar, ya está bien)

- Comparador de Wedding Planner (elegir candidato y darle seguimiento) — ellos no tienen nada parecido, solo listan wedding planners como proveedor más.
- Módulos personales (novia, novio, pareja, luna de miel, vida después de la boda) — su producto es puramente logístico, el tuyo también acompaña la parte emocional/personal.
- Invitación digital con tema y foto — se ve más cuidada que su plantilla de web genérica.

## Orden sugerido

1. Plano de mesas (SQL + RLS primero, luego UI)
2. URL personalizada de la invitación
3. Encuestas para invitados — solo si sobra tiempo después
