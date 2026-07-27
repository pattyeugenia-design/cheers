// Escribe en el historial de notificaciones dentro de la app (tabla
// notificaciones_app, para la campanita). A diferencia del email, esto
// siempre se registra — no respeta el nivel elegido en notificaciones_prefs,
// porque un ítem en una lista que revisas cuando quieres no interrumpe igual
// que un correo.
import { SupabaseClient } from '@supabase/supabase-js'

export type TipoNotifApp = 'rsvp' | 'regalo' | 'mensaje'

export async function registrarNotificacionApp(
  admin: SupabaseClient,
  userId: string,
  tipo: TipoNotifApp,
  celebracionSlug: string,
  texto: string
) {
  try {
    await admin.from('notificaciones_app').insert({ user_id: userId, tipo, celebracion_slug: celebracionSlug, texto })
  } catch (e) {
    console.error('Error registrando notificación in-app:', e)
  }
}
