import { createClient } from '@supabase/supabase-js'

// Exporta, en CSV, quién abrió su Save the date y qué respondió, para jalarlo
// en Google Sheets con =IMPORTDATA(...). Solo funciona con la llave secreta de
// la boda (export_token); la validación vive en la función get_std_export.
export const dynamic = 'force-dynamic'

const csv = (v: unknown) => {
  const s = v == null ? '' : String(v)
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

export async function GET(req: Request) {
  const k = new URL(req.url).searchParams.get('k') || ''
  if (!/^[a-f0-9]{32}$/.test(k)) return new Response('no', { status: 404 })
  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
  const { data, error } = await sb.rpc('get_std_export', { p_token: k })
  if (error || !Array.isArray(data) || data.length === 0) return new Response('no', { status: 404 })
  const filas = [['codigo', 'entro', 'asistencia'], ...data.map((r: any) => [r.std_codigo, r.entro, r.asistencia])]
  return new Response(filas.map(f => f.map(csv).join(',')).join('\n'), {
    headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Cache-Control': 'no-store' },
  })
}
