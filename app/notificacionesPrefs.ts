// Helper compartido para decidir si una notificación por-tile (RSVP, regalo
// reservado, gasto agregado, mensaje nuevo) se manda al instante, se guarda
// para el resumen periódico, o se calla, según la preferencia del organizador
// en perfiles.notificaciones_prefs.
//
// Niveles de la perilla "por_tile":
//  - "todo":       las 4 notificaciones (RSVP, regalo, gasto, mensaje) se
//                  mandan al instante, una por acción.
//  - "importante": ninguna se manda al instante — se agrupan y se mandan
//                  juntas en el resumen periódico (cron resumen-notificaciones),
//                  cada `periodicidad_dias` días, y solo si hubo algo nuevo.
//  - "leve":       el comportamiento de hoy — solo RSVP se manda al instante,
//                  regalo/gasto/mensaje se quedan callados (no existían antes).
//
// Si el perfil no existe o el campo no está seteado, se asume "todo" (mismo
// comportamiento que hoy, para no romper nada retroactivamente).

import { SupabaseClient } from '@supabase/supabase-js'

export type NivelNotificacion = 'todo' | 'importante' | 'leve'

export interface PrefsGrupo {
  nivel: NivelNotificacion
  periodicidad_dias: number
  ultimo_envio?: string | null
}

export interface NotificacionesPrefs {
  generales: PrefsGrupo
  por_tile: PrefsGrupo
}

const DEFAULT_PREFS: NotificacionesPrefs = {
  generales: { nivel: 'todo', periodicidad_dias: 1 },
  por_tile: { nivel: 'todo', periodicidad_dias: 1 },
}

export async function obtenerPrefs(admin: SupabaseClient, organizadorId: string): Promise<NotificacionesPrefs> {
  const { data } = await admin.from('perfiles').select('notificaciones_prefs').eq('user_id', organizadorId).single()
  const prefs = data?.notificaciones_prefs
  if (!prefs?.generales || !prefs?.por_tile) return DEFAULT_PREFS
  return prefs as NotificacionesPrefs
}

// RSVP es la única notificación por-tile que ya existía antes de esto — se manda
// al instante en "todo" y "leve" (comportamiento actual sin cambios), y se calla
// (para ir al resumen) solo en "importante".
export function debeEnviarRsvpInstantaneo(nivel: NivelNotificacion): boolean {
  return nivel === 'todo' || nivel === 'leve'
}

// Regalo reservado / gasto agregado / mensaje nuevo son notificaciones nuevas —
// solo se mandan al instante en "todo". En "leve" se quedan calladas (igual que
// hoy, que no existen). En "importante" se guardan para el resumen periódico.
export function debeEnviarNuevaInstantaneo(nivel: NivelNotificacion): boolean {
  return nivel === 'todo'
}
