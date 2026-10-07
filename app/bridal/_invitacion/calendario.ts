// Enlaces para guardar la boda en el calendario del invitado.
// - La hora es "flotante": 17:30 se queda en 17:30 sin importar desde qué zona
//   horaria abra la invitación quien la recibe.
// - Todo texto que viene de la pareja se limpia antes de entrar al archivo .ics
//   (saltos de línea y caracteres reservados), para que no se puedan inyectar
//   líneas extra en el archivo.

function limpiar(s: string) {
  return s.replace(/[\r\n]+/g, ' ').replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').slice(0, 250)
}

// Lee "19:30", "7:30 pm" o "02:00" y devuelve [hora24, minutos] (o null).
export function a24h(h?: string | null): [number, number] | null {
  const m = /^\s*(\d{1,2}):(\d{2})\s*(am|pm)?\s*$/i.exec(h || '')
  if (!m) return null
  let hh = Number(m[1]); const mm = Number(m[2]); const suf = m[3]?.toLowerCase()
  if (suf === 'pm' && hh < 12) hh += 12
  if (suf === 'am' && hh === 12) hh = 0
  if (hh > 23 || mm > 59) return null
  return [hh, mm]
}

function marca(fecha: string, hora: string | null, extraMin = 0) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(fecha)
  if (!m) return null
  const hm = a24h(hora || '12:00') || [12, 0]
  const base = Date.UTC(+m[1], +m[2] - 1, +m[3], hm[0], hm[1] + extraMin, 0)
  const d = new Date(base)
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getUTCFullYear()}${p(d.getUTCMonth() + 1)}${p(d.getUTCDate())}T${p(d.getUTCHours())}${p(d.getUTCMinutes())}00`
}

// finHora (opcional): hora en que termina el evento, para que el calendario
// del invitado dure lo mismo que la boda. Si es menor que la de inicio se
// entiende que termina al día siguiente (ej. 9:00 pm a 2:00 am).
export function enlacesCalendario(nombre: string, fecha: string, hora: string | null, lugar: string | null, uid: string, finHora?: string | null) {
  const a = a24h(hora || '12:00') || [12, 0]
  const b = a24h(finHora)
  let dur = b ? ((b[0] * 60 + b[1]) - (a[0] * 60 + a[1]) + 1440) % 1440 : 300
  if (dur < 30 || dur > 14 * 60) dur = 300
  const ini = marca(fecha, hora)
  const fin = marca(fecha, hora, dur)
  if (!ini || !fin) return null
  const googleUrl = `https://www.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(nombre.slice(0, 200))}&dates=${ini}/${fin}&location=${encodeURIComponent((lugar || '').slice(0, 250))}`
  const ics = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Cheers Bridal//ES', 'BEGIN:VEVENT',
    `UID:${uid.replace(/[^a-zA-Z0-9-]/g, '')}@joincheers.app`,
    `DTSTAMP:${marca(new Date().toISOString().slice(0, 10), '00:00')}Z`,
    `DTSTART:${ini}`, `DTEND:${fin}`,
    `SUMMARY:${limpiar(nombre)}`, `LOCATION:${limpiar(lugar || '')}`,
    'END:VEVENT', 'END:VCALENDAR',
  ].join('\r\n')
  return { googleUrl, icsUrl: `data:text/calendar;charset=utf-8,${encodeURIComponent(ics)}` }
}
