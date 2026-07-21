# Cortesías Lifetime (Extra Cheer) — lista de seguimiento

Para no perder esta lista otra vez: aquí queda quién va a recibir Lifetime gratis, si ya tiene cuenta, y si ya se le activó. Actualiza esto cada vez que agregues a alguien o confirmes una activación.

| Nombre | Correo | ¿Cuenta creada? | ¿Lifetime activado? | Notas |
|---|---|---|---|---|
| Valente / Tito (novio) | valente.pina@gmail.com | Sí (@valentepina) | Sí | Confirmado 2026-07-20 |
| Ximena Mondragón | xxximena@gmail.com | No | No | Falta que cree cuenta |
| Prima González | linda.gzz@gmail.com | No | No | Falta que cree cuenta |
| Prima Quiroga | priscillaquiroga@gmail.com | No | No | Falta que cree cuenta |
| — | Rosa.amoca@gmail.com | No | No | Falta que cree cuenta |
| — | monyale3@gmail.com | No | No | Falta que cree cuenta |
| Fátima Rodríguez | faty137@gmail.com | Sí (@fatima_rodriguez) | Sí | Activada 2026-07-20 vía SQL |

| Martha Aguilar | mmarthaa@hotmail.com | Sin verificar | No | Agregado 2026-07-20 |
| Vicente Canales | vicecanales@gmail.com | Sin verificar | No | Agregado 2026-07-20 |
| Carolina Nazar | caronazarv@gmail.com | Sin verificar | No | Agregado 2026-07-20 |
| Vika Salinas | Vikasalinas@gmail.com | Sí (@victoria_salinas) | Sí | Activada 2026-07-20 vía SQL |
| Daniela Peña | dany.pena.g@gmail.com | Sin verificar | No | Agregado 2026-07-20 |
| Marcela R. Treviño | Marcerivera.2122@hotmail.com | No | No | Correo enviado 2026-07-20 vía Resend |

**2026-07-20: se mandaron los 11 correos** (todos menos Valente, que ya tenía todo) vía Resend, desde `Patty (Cheers) <notificaciones@joincheers.app>`, con reply-to a patty.eugenia@gmail.com. Fátima recibió la versión "ya activado" porque se le activó el plan justo antes de mandarle el correo. Los otros 10 quedan pendientes de que creen su cuenta y avisen su username.

Correo de invitación personalizado para los 12: ver `correos_cortesia_personalizados.md`.

**Cómo verificar cuentas creadas:** correr en el SQL Editor de Supabase:

```sql
select u.email, p.username, p.plan
from auth.users u
join perfiles p on p.user_id = u.id
where u.email in (
  'valente.pina@gmail.com','xxximena@gmail.com','linda.gzz@gmail.com',
  'priscillaquiroga@gmail.com','Rosa.amoca@gmail.com','monyale3@gmail.com','faty137@gmail.com'
);
```

**Cómo activar:** panel de admin (ruta secreta bajo tu username) → tabla de usuarios → cambiar el select de plan a "Extra Cheer" en la fila de esa persona.
