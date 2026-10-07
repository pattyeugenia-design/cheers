// Enlaces para guardar la boda en el calendario del invitado.
// - La hora es "flotante": 17:30 se queda en 17:30 sin importar desde qué zona
//   horaria abra la invitación quien la recibe.
// - Todo texto que viene de la pareja se limpia antes de entrar al archivo .ics
//   (saltos de línea y caracteres reservados), para que no se puedan inyectar
//   líneas extra en el archivo.

function limpiar(s: string) {
  return s.replace(/[\r\n]+/g, ' ').replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').slice(0, 250)
}

function marca(fecha: string, hora: string | null, extraHoras = 0) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(fecha)
  if (!m) return null
  const hm = /^(\d{1,2}):(\d{2})/.exec(hora || '12:00') || ['', '12', '00']
  const base = Date.UTC(+m[1], +m[2] - 1, +m[3], +hm[1] + extraHoras, +hm[2], 0)
  const d = new Date(base)
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getUTCFullYear()}${p(d.getUTCMonth() + 1)}${p(d.getUTCDate())}T${p(d.getUTCHours())}${p(d.getUTCMinutes())}00`
}

export function enlacesCalendario(nombre: string, fecha: string, hora: string | null, lugar: string | null, uid: string) {
  const ini = marca(fecha, hora)
  const fin = marca(fecha, hora, 5)
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
