// Helper compartido para decidir si una notificación se manda al instante, se
// guarda para el resumen periódico, o se calla, según la preferencia del
// usuario en perfiles.notificaciones_prefs.
//
// Cada tipo de notificación tiene su propio control independiente. "Leve" es
// siempre el piso mínimo garantizado — nunca significa "apagado":
//  - recordatorio: no usa resumen, ya es un mensaje programado por sí mismo.
//     "todo"       -> todos los recordatorios configurados en la celebración
//     "importante" -> el más cercano a la fecha + uno más (si hay varios)
//     "leve"       -> solo el más cercano a la fecha (el mínimo para no
//                     perderte tu propio evento)
//  - rsvp: ya existía antes de esta función.
//     "todo"       -> al instante, una por acción
//     "importante" -> agrupadas en el resumen periódico, cada
//                     periodicidad_dias días, solo si hubo algo nuevo
//     "leve"       -> al instante también (es el comportamiento de siempre,
//                     el piso mínimo de esta notificación ya era "al instante")
//  - regalo / mensaje: notificaciones nuevas, no había un "de siempre" que
//    preservar, así que el piso se definió aquí mismo.
//     "todo"       -> al instante, una por acción
//     "importante" -> agrupadas en el resumen periódico cada 1-3 días (elige
//                     el usuario), solo si hubo algo nuevo
//     "leve"       -> agrupadas en el resumen periódico cada 7 días fijo (el
//                     piso — nunca en silencio total)
//
// Default si el perfil no tiene el campo seteado: todas en "leve" (el piso).

import { SupabaseClient } from '@supabase/supabase-js'

export type NivelNotificacion = 'todo' | 'importante' | 'leve'

export interface PrefsItem {
  nivel: NivelNotificacion
  periodicidad_dias?: number
  ultimo_envio?: string | null
}

export interface NotificacionesPrefs {
  recordatorio: PrefsItem
  rsvp: PrefsItem
  regalo: PrefsItem
  mensaje: PrefsItem
}

export const DEFAULT_NOTIF_PREFS: NotificacionesPrefs = {
  recordatorio: { nivel: 'leve' },
  rsvp: { nivel: 'leve' },
  regalo: { nivel: 'leve', periodicidad_dias: 7 },
  mensaje: { nivel: 'leve', periodicidad_dias: 7 },
}

export async function obtenerPrefs(admin: SupabaseClient, organizadorId: string): Promise<NotificacionesPrefs> {
  const { data } = await admin.from('perfiles').select('notificaciones_prefs').eq('user_id', organizadorId).single()
  const prefs = data?.notificaciones_prefs
  if (!prefs?.rsvp || !prefs?.regalo || !prefs?.mensaje || !prefs?.recordatorio) return DEFAULT_NOTIF_PREFS
  return prefs as NotificacionesPrefs
}

// RSVP: el piso ("leve") ya era "al instante" desde antes de esta función, así
// que "todo" y "leve" se comportan igual. Solo "importante" la manda al
// resumen periódico en vez de al instante.
export function debeEnviarRsvpInstantaneo(nivel: NivelNotificacion): boolean {
  return nivel === 'todo' || nivel === 'leve'
}

// Regalo reservado / mensaje nuevo: solo se mandan al instante en "todo".
// "importante" y "leve" van al resumen periódico (con distinta periodicidad
// cada una) — ninguna se queda en silencio total.
export function debeEnviarNuevaInstantaneo(nivel: NivelNotificacion): boolean {
  return nivel === 'todo'
}
