'use client'
import { useState, useEffect, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../../supabase'
import { getLang } from '../../../i18n'

// Dashboard de respuestas para los novios: por cada invitación (save the date,
// boda, despedidas) muestra cuándo se envió, quién la abrió, quién contestó,
// qué contestó y quién falta. Se refresca solo cada 15 s mientras está abierto.
// Solo miembros del proyecto pueden leer estos datos (RLS de cada tabla).

const F = '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif'
const C = {
  bg: '#0B1020', card: '#151B33', card2: '#1B2242', borde: 'rgba(255,255,255,.06)',
  txt: '#EEF1FF', muted: '#8B93B5', tenue: 'rgba(139,147,181,.18)',
  rosa: '#F472B6', violeta: '#A78BFA', cian: '#22D3EE', azul: '#3B82F6',
  verde: '#4ADE80', ambar: '#FBBF24', rojo: '#F87171', gris: '#475077',
}
const GRAD_ROSA = 'linear-gradient(135deg,#E879F9,#F472B6 55%,#FB7185)'
const GRAD_CIAN = 'linear-gradient(135deg,#22D3EE,#3B82F6)'
const GRAD_VERDE = 'linear-gradient(135deg,#34D399,#22C55E)'
const REFRESCO_MS = 15000
const AL_MOMENTO_MIN = 15

type Resp = 'si' | 'no' | 'tal_vez' | null
type Fila = {
  id: string; nombre: string; telefono: string | null; link: string
  enviado: string | null; abierto: string | null; respondio: string | null
  respuesta: Resp; personas: number
}
type Invitacion = {
  key: string; tipo: 'std' | 'boda' | 'despedida'; titulo: string
  tabla: 'boda_invitados' | 'boda_despedida_invitadas'; columnaEnvio: string
  filas: Fila[]; respuestas: { si: string; tal_vez: string; no: string }
}

function numeroWa(tel: string | null) {
  const crudo = String(tel || '')
  const dig = crudo.replace(/\D/g, '')
  if (/^\d{10}$/.test(dig) && !crudo.trim().startsWith('+')) return '52' + dig
  if (/^\d{11,15}$/.test(dig)) return dig
  return ''
}
const ms = (s: string | null) => (s ? new Date(s).getTime() : NaN)
const minimo = (...v: (string | null | undefined)[]) => {
  const xs = v.filter(Boolean) as string[]
  return xs.length ? xs.reduce((a, b) => (ms(a) <= ms(b) ? a : b)) : null
}

export default function RespuestasDashboard({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [lang, setLang] = useState('es')
  const [id, setId] = useState('')
  const [cargando, setCargando] = useState(true)
  const [proyecto, setProyecto] = useState<any>(null)
  const [invitaciones, setInvitaciones] = useState<Invitacion[]>([])
  const [sel, setSel] = useState('')
  const [actualizado, setActualizado] = useState<number>(0)
  const [ahora, setAhora] = useState<number>(0)
  const [lista, setLista] = useState<'sin_abrir' | 'sin_contestar' | 'tal_vez' | 'si' | 'no'>('sin_abrir')
  const [registrando, setRegistrando] = useState(false)
  const [fechaEnvio, setFechaEnvio] = useState('')
  const t = useCallback((es: string, en: string) => (lang === 'en' ? en : es), [lang])

  const cargar = useCallback(async (bodaId: string) => {
    const origen = typeof window !== 'undefined' ? window.location.origin : 'https://joincheers.app'
    const [{ data: proy }, { data: inv }, { data: ap }, { data: rs }, { data: ds }] = await Promise.all([
      supabase.from('proyectos_boda').select('id, nombre_novia, nombre_novio, fecha_boda, std_activo, std_slug').eq('id', bodaId).single(),
      supabase.from('boda_invitados').select('id, nombre, telefono, token, std_codigo, std_visto_en, std_enviado_en, boda_enviado_en, boda_visto_en').eq('boda_id', bodaId).order('nombre'),
      supabase.from('boda_fecha_apartada').select('invitado_id, apartada_en, respuesta, respondida_en').eq('boda_id', bodaId),
      supabase.from('boda_rsvps').select('invitado_id, asistencia, num_acompanantes, created_at').eq('boda_id', bodaId),
      supabase.from('boda_despedidas').select('id, titulo, festejada, created_at').eq('boda_id', bodaId).order('created_at'),
    ])
    if (!proy) { router.push('/bridal'); return }
    setProyecto(proy)
    const invitados = inv || []
    const apPor = new Map((ap || []).map((x: any) => [x.invitado_id, x]))
    const rsPor = new Map((rs || []).map((x: any) => [x.invitado_id, x]))
    const lista: Invitacion[] = []

    const filasStd: Fila[] = invitados.map((i: any) => {
      const a: any = apPor.get(i.id)
      const respondio = a?.respuesta ? a.respondida_en : null
      return {
        id: i.id, nombre: i.nombre, telefono: i.telefono,
        link: proy.std_slug && i.std_codigo ? `${origen}/bridal/std/${proy.std_slug}-${i.std_codigo}` : '',
        enviado: i.std_enviado_en, abierto: minimo(i.std_visto_en, a?.apartada_en, respondio),
        respondio, respuesta: (a?.respuesta || null) as Resp, personas: 1,
      }
    })
    if (proy.std_activo || filasStd.some(f => f.abierto || f.enviado)) {
      lista.push({ key: 'std', tipo: 'std', titulo: 'Save the date', tabla: 'boda_invitados', columnaEnvio: 'std_enviado_en', filas: filasStd,
        respuestas: { si: t('Sí va', 'Coming'), tal_vez: t('Aún no sabe', 'Not sure yet'), no: t('No podrá', "Can't make it") } })
    }

    lista.push({
      key: 'boda', tipo: 'boda', titulo: t('Boda', 'Wedding'), tabla: 'boda_invitados', columnaEnvio: 'boda_enviado_en',
      respuestas: { si: t('Confirmados', 'Confirmed'), tal_vez: t('Tal vez', 'Maybe'), no: t('No van', 'Not going') },
      filas: invitados.map((i: any) => {
        const r: any = rsPor.get(i.id)
        return {
          id: i.id, nombre: i.nombre, telefono: i.telefono, link: `${origen}/bridal/rsvp/${i.token}`,
          enviado: i.boda_enviado_en, abierto: minimo(i.boda_visto_en, r?.created_at), respondio: r?.created_at || null,
          respuesta: (r?.asistencia || null) as Resp, personas: r?.asistencia === 'si' ? 1 + (r?.num_acompanantes || 0) : 1,
        }
      }),
    })

    const desp = ds || []
    if (desp.length) {
      const { data: di } = await supabase.from('boda_despedida_invitadas')
        .select('id, despedida_id, nombre, telefono, token, enviado_en, visto_en, respondio_en, respuesta, origen')
        .in('despedida_id', desp.map((d: any) => d.id)).order('nombre')
      desp.forEach((d: any, n: number) => {
        lista.push({
          key: `desp-${d.id}`, tipo: 'despedida', tabla: 'boda_despedida_invitadas', columnaEnvio: 'enviado_en',
          titulo: (d.titulo || t('Despedida', 'Bridal shower')) + (desp.length > 1 && d.festejada ? ` · ${d.festejada}` : desp.length > 1 ? ` ${n + 1}` : ''),
          respuestas: { si: t('Van', 'Going'), tal_vez: t('Tal vez', 'Maybe'), no: t('No van', 'Not going') },
          filas: (di || []).filter((x: any) => x.despedida_id === d.id).map((x: any) => ({
            id: x.id, nombre: x.nombre, telefono: x.telefono, link: `${origen}/bridal/despedida/${x.token}`,
            enviado: x.enviado_en, abierto: minimo(x.visto_en, x.origen === 'link' ? x.respondio_en : null),
            respondio: x.respuesta ? x.respondio_en : null, respuesta: (x.respuesta || null) as Resp, personas: 1,
          })),
        })
      })
    }
    setInvitaciones(lista)
    setSel(prev => prev && lista.some(l => l.key === prev) ? prev
      : (lista.find(l => l.filas.some(f => f.enviado || f.abierto))?.key || lista[0]?.key || ''))
    setActualizado(Date.now())
    setCargando(false)
  }, [router, t])

  useEffect(() => {
    setLang(getLang())
    params.then(async ({ id }) => {
      setId(id)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      cargar(id)
    })
  }, [])

  // En vivo: refresca cada 15 s mientras la pestaña está visible, y al regresar a ella.
  useEffect(() => {
    if (!id) return
    const tick = () => { if (document.visibilityState === 'visible') cargar(id) }
    const iv = setInterval(tick, REFRESCO_MS)
    const reloj = setInterval(() => setAhora(Date.now()), 1000)
    document.addEventListener('visibilitychange', tick)
    return () => { clearInterval(iv); clearInterval(reloj); document.removeEventListener('visibilitychange', tick) }
  }, [id, cargar])

  const inv = invitaciones.find(i => i.key === sel)
  const m = useMemo(() => {
    const filas = inv?.filas || []
    const total = filas.length
    const enviados = filas.filter(f => f.enviado)
    const abiertos = filas.filter(f => f.abierto)
    const contestados = filas.filter(f => f.respondio && f.respuesta)
    const si = contestados.filter(f => f.respuesta === 'si')
    const talVez = contestados.filter(f => f.respuesta === 'tal_vez')
    const no = contestados.filter(f => f.respuesta === 'no')
    const alMomento = contestados.filter(f => ms(f.respondio) - ms(f.abierto) <= AL_MOMENTO_MIN * 60000)
    const masTarde = contestados.length - alMomento.length
    const sinContestar = abiertos.filter(f => !f.respuesta)
    const sinAbrir = filas.filter(f => !f.abierto)
    const envOrden = enviados.map(f => f.enviado as string).sort()
    const tiemposResp = contestados.map(f => ms(f.respondio) - ms(f.enviado || f.abierto)).filter(x => x >= 0).sort((a, b) => a - b)
    const mediana = tiemposResp.length ? tiemposResp[Math.floor(tiemposResp.length / 2)] : null
    return {
      total, enviados: enviados.length, abiertos: abiertos.length, contestados: contestados.length,
      si: si.length, talVez: talVez.length, no: no.length, personasSi: si.reduce((s, f) => s + f.personas, 0),
      alMomento: alMomento.length, masTarde, sinContestar, sinAbrir,
      envDesde: envOrden[0] || null, envHasta: envOrden[envOrden.length - 1] || null, mediana,
      sinRegistroEnvio: filas.filter(f => !f.enviado).length,
    }
  }, [inv])

  const actividad = useMemo(() => {
    const filas = inv?.filas || []
    const tiempos = filas.flatMap(f => [f.abierto, f.respondio]).filter(Boolean).map(s => ms(s as string))
    if (!tiempos.length) return null
    const ini = Math.min(...tiempos), fin = Math.max(Date.now(), ...tiempos)
    const porHora = fin - ini <= 72 * 3600000
    const paso = porHora ? 3600000 : 86400000
    const base = new Date(ini); if (porHora) base.setMinutes(0, 0, 0); else base.setHours(0, 0, 0, 0)
    const n = Math.min(Math.max(Math.ceil((fin - base.getTime()) / paso), 1), porHora ? 72 : 120)
    const ab = new Array(n).fill(0), re = new Array(n).fill(0)
    const idx = (s: string) => Math.min(n - 1, Math.max(0, Math.floor((ms(s) - base.getTime()) / paso)))
    filas.forEach(f => { if (f.abierto) ab[idx(f.abierto)]++; if (f.respondio && f.respuesta) re[idx(f.respondio)]++ })
    const etiquetas = Array.from({ length: n }, (_, i) => {
      const d = new Date(base.getTime() + i * paso)
      return porHora
        ? d.toLocaleTimeString(lang === 'en' ? 'en-US' : 'es-MX', { hour: 'numeric' }) + (d.getHours() === 0 || i === 0 ? ' ' + d.toLocaleDateString(lang === 'en' ? 'en-US' : 'es-MX', { weekday: 'short' }) : '')
        : d.toLocaleDateString(lang === 'en' ? 'en-US' : 'es-MX', { day: 'numeric', month: 'short' })
    })
    return { ab, re, etiquetas, porHora }
  }, [inv, lang])

  const loc = lang === 'en' ? 'en-US' : 'es-MX'
  const fDia = (s: string) => new Date(s).toLocaleDateString(loc, { weekday: 'long', day: 'numeric', month: 'short' })
  const fHora = (s: string) => new Date(s).toLocaleString(loc, { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })
  const dur = (x: number) => x < 3600000 ? `${Math.max(1, Math.round(x / 60000))} min` : x < 86400000 ? `${Math.round(x / 3600000)} h` : `${Math.round(x / 86400000)} ${t('días', 'days')}`
  const pct = (a: number, b: number) => (b ? Math.round((a / b) * 100) : 0)

  const plazo = (() => {
    if (!m.envDesde || !m.envHasta) return null
    const a = new Date(m.envDesde).toDateString(), b = new Date(m.envHasta).toDateString()
    return a === b ? `${t('Se envió el', 'Sent on')} ${fDia(m.envDesde)}` : `${t('Se envió entre el', 'Sent between')} ${fDia(m.envDesde)} ${t('y el', 'and')} ${fDia(m.envHasta)}`
  })()

  async function registrarEnvio() {
    if (!inv || !fechaEnvio) return
    const ids = inv.filas.filter(f => !f.enviado).map(f => f.id)
    if (!ids.length) { setRegistrando(false); return }
    const cuando = new Date(fechaEnvio + 'T12:00:00').toISOString()
    for (let i = 0; i < ids.length; i += 200) {
      await supabase.from(inv.tabla).update({ [inv.columnaEnvio]: cuando }).in('id', ids.slice(i, i + 200))
    }
    setRegistrando(false)
    cargar(id)
  }

  function recordatorio(f: Fila) {
    const novios = [proyecto?.nombre_novia, proyecto?.nombre_novio].filter(Boolean).join(t(' y ', ' and '))
    const primer = f.nombre.trim().split(/\s+/)[0]
    const texto = lista === 'tal_vez'
      ? t(`Hola ${primer}, cuando ya sepas si nos acompañas, avísanos aquí: ${f.link}`, `Hi ${primer}, once you know if you can make it, let us know here: ${f.link}`)
      : t(`Hola ${primer}, te compartimos de nuevo la invitación de ${novios}. Nos encantaría saber si nos acompañas: ${f.link}`, `Hi ${primer}, here is ${novios}'s invitation again. We'd love to know if you can make it: ${f.link}`)
    window.open(`https://wa.me/${numeroWa(f.telefono)}?text=${encodeURIComponent(texto)}`, '_blank')
  }

  if (cargando) return (
    <main style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: F }}>
      <p style={{ color: C.muted }}>{t('Cargando…', 'Loading…')}</p>
    </main>
  )

  const segs = [
    { label: inv?.respuestas.si || '', value: m.si, color: C.verde },
    { label: inv?.respuestas.tal_vez || '', value: m.talVez, color: C.ambar },
    { label: inv?.respuestas.no || '', value: m.no, color: C.rojo },
    { label: t('Sin respuesta', 'No answer'), value: m.total - m.contestados, color: C.gris },
  ]
  const velocidad = [
    { label: t('Contestaron al momento', 'Replied right away'), sub: t(`en menos de ${AL_MOMENTO_MIN} min de abrirla`, `within ${AL_MOMENTO_MIN} min of opening`), value: m.alMomento, color: GRAD_VERDE },
    { label: t('Contestaron después', 'Replied later'), sub: t('la abrieron y regresaron a contestar', 'opened it and came back later'), value: m.masTarde, color: GRAD_CIAN },
    { label: t('La abrieron y no contestan', 'Opened, no reply'), sub: t('ya la vieron', 'they have seen it'), value: m.sinContestar.length, color: 'linear-gradient(135deg,#FBBF24,#F59E0B)' },
    { label: t('No la han abierto', 'Not opened yet'), sub: t('ni la han leído', "haven't read it"), value: m.sinAbrir.length, color: 'linear-gradient(135deg,#64748B,#475077)' },
  ]
  const embudo = [
    { label: t('Invitados', 'Guests'), value: m.total },
    { label: t('Enviados', 'Sent'), value: m.enviados },
    { label: t('Abrieron', 'Opened'), value: m.abiertos },
    { label: t('Contestaron', 'Replied'), value: m.contestados },
    { label: inv?.respuestas.si || '', value: m.si },
  ]
  const listas = {
    sin_abrir: { label: t('Sin abrir', 'Not opened'), filas: m.sinAbrir },
    sin_contestar: { label: t('Abrieron sin contestar', 'Opened, no reply'), filas: m.sinContestar },
    tal_vez: { label: inv?.respuestas.tal_vez || '', filas: (inv?.filas || []).filter(f => f.respuesta === 'tal_vez') },
    si: { label: inv?.respuestas.si || '', filas: (inv?.filas || []).filter(f => f.respuesta === 'si') },
    no: { label: inv?.respuestas.no || '', filas: (inv?.filas || []).filter(f => f.respuesta === 'no') },
  }
  const hace = Math.max(0, Math.round((ahora - actualizado) / 1000))

  const card: React.CSSProperties = { background: C.card, border: `1px solid ${C.borde}`, borderRadius: 20, padding: '18px 20px', minWidth: 0 }
  const titulo: React.CSSProperties = { fontSize: 15, fontWeight: 800, color: C.txt, margin: 0 }
  const sub: React.CSSProperties = { fontSize: 12, color: C.muted, marginTop: 4 }

  return (
    <main style={{ minHeight: '100vh', background: C.bg, fontFamily: F, color: C.txt, padding: '20px 16px 60px' }}>
      <style>{`@keyframes pulso{0%{box-shadow:0 0 0 0 rgba(74,222,128,.6)}70%{box-shadow:0 0 0 8px rgba(74,222,128,0)}100%{box-shadow:0 0 0 0 rgba(74,222,128,0)}}`}</style>
      <div style={{ maxWidth: 1440, margin: '0 auto' }}>
        {/* Encabezado */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' as const, marginBottom: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
            <button onClick={() => router.push(`/bridal/${id}`)} style={{ border: `1px solid ${C.borde}`, background: C.card, color: C.muted, fontSize: 13, fontWeight: 700, padding: '8px 12px', borderRadius: 10, cursor: 'pointer', fontFamily: F }}>
              {t('← Atrás', '← Back')}
            </button>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 12, color: C.muted, fontWeight: 700 }}>{[proyecto?.nombre_novia, proyecto?.nombre_novio].filter(Boolean).join(t(' y ', ' and '))}</div>
              <h1 style={{ fontSize: 24, fontWeight: 900, margin: 0, letterSpacing: '-.4px', background: GRAD_ROSA, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>
                {t('Respuestas', 'Responses')}
              </h1>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: C.muted, fontWeight: 700 }}>
            <span style={{ width: 9, height: 9, borderRadius: '50%', background: C.verde, animation: 'pulso 2s infinite' }} />
            {t('En vivo', 'Live')} · {hace < 5 ? t('actualizado ahora', 'updated now') : t(`hace ${hace} s`, `${hace}s ago`)}
          </div>
        </div>

        {/* Selector de invitación */}
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto' as const, paddingBottom: 4, marginBottom: 18 }}>
          {invitaciones.map(i => (
            <button key={i.key} onClick={() => { setSel(i.key); setRegistrando(false) }} style={{
              border: sel === i.key ? 'none' : `1px solid ${C.borde}`, cursor: 'pointer', fontFamily: F, fontSize: 13, fontWeight: 800,
              padding: '9px 16px', borderRadius: 99, whiteSpace: 'nowrap' as const,
              background: sel === i.key ? GRAD_ROSA : C.card, color: sel === i.key ? '#fff' : C.muted,
            }}>{i.titulo}</button>
          ))}
        </div>

        {m.total === 0 ? (
          <div style={{ ...card, textAlign: 'center' as const, padding: 40 }}>
            <p style={{ color: C.muted, margin: 0 }}>{t('Todavía no hay invitados en esta invitación.', 'No guests on this invitation yet.')}</p>
          </div>
        ) : (<>
          {/* Plazo de envío */}
          <div style={{ ...card, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' as const, marginBottom: 14, background: C.card2 }}>
            <div>
              <div style={{ fontSize: 11, color: C.muted, fontWeight: 800, textTransform: 'uppercase' as const, letterSpacing: '.6px' }}>{t('Plazo de envío', 'Send window')}</div>
              <div style={{ fontSize: 16, fontWeight: 800, marginTop: 4, textTransform: 'none' as const }}>
                {plazo || t('Sin registro de cuándo se envió', 'No record of when it was sent')}
              </div>
              {m.mediana != null && <div style={sub}>{t('La mitad contestó en menos de', 'Half replied in under')} {dur(m.mediana)}</div>}
            </div>
            {m.sinRegistroEnvio > 0 && (registrando ? (
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' as const }}>
                <input type="date" value={fechaEnvio} onChange={e => setFechaEnvio(e.target.value)} style={{ background: C.card, color: C.txt, border: `1px solid ${C.borde}`, borderRadius: 10, padding: '8px 10px', fontFamily: F, colorScheme: 'dark' as const }} />
                <button onClick={registrarEnvio} disabled={!fechaEnvio} style={{ border: 'none', background: GRAD_ROSA, color: '#fff', fontWeight: 800, fontSize: 12, padding: '9px 14px', borderRadius: 10, cursor: 'pointer', fontFamily: F, opacity: fechaEnvio ? 1 : .5 }}>
                  {t(`Marcar ${m.sinRegistroEnvio} como enviados`, `Mark ${m.sinRegistroEnvio} as sent`)}
                </button>
                <button onClick={() => setRegistrando(false)} style={{ border: 'none', background: 'transparent', color: C.muted, fontWeight: 700, fontSize: 12, cursor: 'pointer', fontFamily: F }}>{t('Cancelar', 'Cancel')}</button>
              </div>
            ) : (
              <button onClick={() => { setRegistrando(true); setFechaEnvio(new Date().toISOString().slice(0, 10)) }} style={{ border: `1px solid ${C.borde}`, background: C.card, color: C.txt, fontWeight: 700, fontSize: 12, padding: '9px 14px', borderRadius: 10, cursor: 'pointer', fontFamily: F }}>
                {t(`Registrar envío de ${m.sinRegistroEnvio} sin fecha`, `Log send date for ${m.sinRegistroEnvio}`)}
              </button>
            ))}
          </div>

          {/* KPIs */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14, marginBottom: 14 }}>
            <Kpi grad={GRAD_ROSA} etiqueta={t('Enviados', 'Sent')} valor={m.enviados} de={m.total} nota={`${pct(m.enviados, m.total)}%`} t={t} />
            <Kpi grad={GRAD_CIAN} etiqueta={t('Abrieron', 'Opened')} valor={m.abiertos} de={m.total} nota={`${pct(m.abiertos, m.total)}%`} t={t} />
            <Kpi etiqueta={t('Contestaron', 'Replied')} valor={m.contestados} de={m.total} nota={`${pct(m.contestados, m.total)}%`} color={C.violeta} t={t} />
            <Kpi etiqueta={inv?.respuestas.si || ''} valor={m.si} nota={inv?.tipo === 'boda' && m.personasSi !== m.si ? t(`${m.personasSi} personas`, `${m.personasSi} people`) : `${pct(m.si, m.total)}%`} color={C.verde} t={t} />
            <Kpi etiqueta={inv?.respuestas.tal_vez || ''} valor={m.talVez} nota={`${pct(m.talVez, m.total)}%`} color={C.ambar} t={t} />
            <Kpi etiqueta={inv?.respuestas.no || ''} valor={m.no} nota={`${pct(m.no, m.total)}%`} color={C.rojo} t={t} />
          </div>

          {/* Gráficas */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 14, marginBottom: 14 }}>
            <div style={card}>
              <h2 style={titulo}>{t('Qué contestaron', 'What they said')}</h2>
              <div style={sub}>{t(`${m.contestados} de ${m.total} invitados`, `${m.contestados} of ${m.total} guests`)}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginTop: 14, flexWrap: 'wrap' as const }}>
                <Dona segs={segs} centro={`${pct(m.contestados, m.total)}%`} pie={t('contestó', 'replied')} />
                <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 10, flex: 1, minWidth: 140 }}>
                  {segs.map(s => (
                    <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14 }}>
                      <span style={{ width: 12, height: 12, borderRadius: 4, background: s.color, flexShrink: 0 }} />
                      <span style={{ flex: 1, color: C.txt }}>{s.label}</span>
                      <span style={{ fontWeight: 800 }}>{s.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div style={card}>
              <h2 style={titulo}>{t('Qué tan rápido contestaron', 'How fast they replied')}</h2>
              <div style={sub}>{t('Desde que abrieron la invitación', 'From when they opened it')}</div>
              <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 14, marginTop: 16 }}>
                {velocidad.map(v => (
                  <div key={v.label}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6, gap: 8 }}>
                      <span style={{ fontSize: 13, fontWeight: 700 }}>{v.label} <span style={{ color: C.muted, fontWeight: 500, fontSize: 11 }}>· {v.sub}</span></span>
                      <span style={{ fontSize: 16, fontWeight: 900 }}>{v.value}</span>
                    </div>
                    <div style={{ height: 10, borderRadius: 99, background: C.tenue, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct(v.value, m.total)}%`, background: v.color, borderRadius: 99, transition: 'width .6s' }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div style={card}>
              <h2 style={titulo}>{t('De la invitación a la respuesta', 'From invite to reply')}</h2>
              <div style={sub}>{t('Cuántos van pasando cada paso', 'How many get through each step')}</div>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, height: 190, marginTop: 16 }}>
                {embudo.map((e, i) => (
                  <div key={e.label} style={{ flex: 1, display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: 6, height: '100%', justifyContent: 'flex-end', minWidth: 0 }}>
                    <span style={{ fontSize: 14, fontWeight: 900 }}>{e.value}</span>
                    <div style={{ width: '100%', maxWidth: 46, height: `${Math.max(4, pct(e.value, m.total))}%`, borderRadius: '10px 10px 4px 4px', background: [GRAD_ROSA, 'linear-gradient(180deg,#E879F9,#A78BFA)', GRAD_CIAN, 'linear-gradient(180deg,#A78BFA,#6366F1)', GRAD_VERDE][i], transition: 'height .6s' }} />
                    <span style={{ fontSize: 11, color: C.muted, fontWeight: 700, textAlign: 'center' as const, whiteSpace: 'nowrap' as const, overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%' }}>{e.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Actividad en el tiempo */}
          {actividad && (
            <div style={{ ...card, marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' as const }}>
                <div>
                  <h2 style={titulo}>{t('Actividad', 'Activity')}</h2>
                  <div style={sub}>{actividad.porHora ? t('Aperturas y respuestas por hora', 'Opens and replies per hour') : t('Aperturas y respuestas por día', 'Opens and replies per day')}</div>
                </div>
                <div style={{ display: 'flex', gap: 14, fontSize: 12, color: C.muted, fontWeight: 700 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ width: 14, height: 3, borderRadius: 2, background: C.cian }} />{t('Abrieron', 'Opened')}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ width: 14, height: 3, borderRadius: 2, background: C.rosa }} />{t('Contestaron', 'Replied')}</span>
                </div>
              </div>
              <Area ab={actividad.ab} re={actividad.re} etiquetas={actividad.etiquetas} />
            </div>
          )}

          {/* Quién falta */}
          <div style={card}>
            <h2 style={titulo}>{t('Quién es quién', 'Who is who')}</h2>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' as const, margin: '12px 0 14px' }}>
              {(Object.keys(listas) as (keyof typeof listas)[]).map(k => (
                <button key={k} onClick={() => setLista(k)} style={{
                  border: 'none', cursor: 'pointer', fontFamily: F, fontSize: 12, fontWeight: 800, padding: '7px 12px', borderRadius: 99,
                  background: lista === k ? 'rgba(244,114,182,.18)' : C.tenue, color: lista === k ? C.rosa : C.muted,
                }}>{listas[k].label} · {listas[k].filas.length}</button>
              ))}
            </div>
            {listas[lista].filas.length === 0 ? (
              <p style={{ color: C.muted, fontSize: 13, margin: 0 }}>{t('Nadie en esta lista.', 'Nobody here.')}</p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 8 }}>
                {listas[lista].filas.map(f => (
                  <div key={f.id} style={{ display: 'flex', alignItems: 'center', gap: 10, background: C.card2, borderRadius: 12, padding: '10px 12px', minWidth: 0 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{f.nombre}</div>
                      <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>
                        {f.respondio ? `${t('Contestó', 'Replied')} ${fHora(f.respondio)}`
                          : f.abierto ? `${t('La abrió', 'Opened')} ${fHora(f.abierto)}`
                          : f.enviado ? `${t('Enviada', 'Sent')} ${fHora(f.enviado)}` : t('Sin registro de envío', 'No send record')}
                        {inv?.tipo === 'boda' && f.respuesta === 'si' && f.personas > 1 ? ` · ${f.personas} ${t('personas', 'people')}` : ''}
                      </div>
                    </div>
                    {(lista === 'sin_abrir' || lista === 'sin_contestar' || lista === 'tal_vez') && numeroWa(f.telefono) && f.link && (
                      <button onClick={() => recordatorio(f)} style={{ border: 'none', background: '#25D366', color: '#fff', fontSize: 11, fontWeight: 800, padding: '7px 10px', borderRadius: 9, cursor: 'pointer', fontFamily: F, flexShrink: 0 }}>
                        {t('Recordar', 'Remind')}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </>)}
      </div>
    </main>
  )
}

function Kpi({ etiqueta, valor, de, nota, grad, color, t }: { etiqueta: string; valor: number; de?: number; nota?: string; grad?: string; color?: string; t: (es: string, en: string) => string }) {
  return (
    <div style={{
      background: grad || C.card, border: grad ? 'none' : `1px solid ${C.borde}`, borderRadius: 20, padding: '16px 18px', minWidth: 0,
      boxShadow: grad ? '0 10px 30px rgba(232,121,249,.15)' : 'none',
    }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: grad ? 'rgba(255,255,255,.9)' : C.muted }}>{etiqueta}</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 8 }}>
        <span style={{ fontSize: 40, fontWeight: 900, lineHeight: 1, letterSpacing: '-1px', color: grad ? '#fff' : (color || C.txt) }}>{valor}</span>
        {de != null && <span style={{ fontSize: 14, fontWeight: 700, color: grad ? 'rgba(255,255,255,.8)' : C.muted }}>{t('de', 'of')} {de}</span>}
      </div>
      {nota && <div style={{ fontSize: 12, fontWeight: 700, marginTop: 6, color: grad ? 'rgba(255,255,255,.85)' : C.muted }}>{nota}</div>}
    </div>
  )
}

function Dona({ segs, centro, pie }: { segs: { label: string; value: number; color: string }[]; centro: string; pie: string }) {
  const total = segs.reduce((s, x) => s + x.value, 0) || 1
  const r = 52, c = 2 * Math.PI * r
  let acum = 0
  return (
    <svg width="150" height="150" viewBox="0 0 140 140" style={{ flexShrink: 0 }}>
      <circle cx="70" cy="70" r={r} fill="none" stroke={C.tenue} strokeWidth="16" />
      {segs.filter(s => s.value > 0).map(s => {
        const largo = (s.value / total) * c
        const el = <circle key={s.label} cx="70" cy="70" r={r} fill="none" stroke={s.color} strokeWidth="16"
          strokeDasharray={`${Math.max(0, largo - 2)} ${c}`} strokeDashoffset={-acum} transform="rotate(-90 70 70)" strokeLinecap="butt" />
        acum += largo
        return el
      })}
      <text x="70" y="70" textAnchor="middle" fill={C.txt} fontSize="26" fontWeight="900" fontFamily={F}>{centro}</text>
      <text x="70" y="90" textAnchor="middle" fill={C.muted} fontSize="11" fontWeight="700" fontFamily={F}>{pie}</text>
    </svg>
  )
}

function Area({ ab, re, etiquetas }: { ab: number[]; re: number[]; etiquetas: string[] }) {
  const W = 1000, H = 220, n = ab.length
  const max = Math.max(1, ...ab, ...re)
  const x = (i: number) => (n === 1 ? W / 2 : (i / (n - 1)) * W)
  const y = (v: number) => H - 8 - (v / max) * (H - 24)
  const linea = (s: number[]) => s.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ')
  const area = (s: number[]) => `${linea(s)} L${x(n - 1)},${H} L${x(0)},${H} Z`
  const cada = Math.max(1, Math.ceil(n / 8))
  return (
    <div style={{ marginTop: 14 }}>
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ width: '100%', height: 220, display: 'block' }}>
        <defs>
          <linearGradient id="gAb" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={C.cian} stopOpacity=".45" /><stop offset="1" stopColor={C.cian} stopOpacity="0" /></linearGradient>
          <linearGradient id="gRe" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={C.rosa} stopOpacity=".45" /><stop offset="1" stopColor={C.rosa} stopOpacity="0" /></linearGradient>
        </defs>
        {[0.25, 0.5, 0.75].map(p => <line key={p} x1="0" x2={W} y1={H * p} y2={H * p} stroke="rgba(255,255,255,.05)" strokeWidth="1" vectorEffect="non-scaling-stroke" />)}
        <path d={area(ab)} fill="url(#gAb)" />
        <path d={area(re)} fill="url(#gRe)" />
        <path d={linea(ab)} fill="none" stroke={C.cian} strokeWidth="2.5" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
        <path d={linea(re)} fill="none" stroke={C.rosa} strokeWidth="2.5" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
      </svg>
      <div style={{ position: 'relative', height: 18, marginTop: 6 }}>
        {etiquetas.map((e, i) => i % cada === 0 && (
          <span key={i} style={{ position: 'absolute', left: `${(n === 1 ? 0.5 : i / (n - 1)) * 100}%`, transform: i === 0 ? 'none' : i === n - 1 ? 'translateX(-100%)' : 'translateX(-50%)', fontSize: 10, color: C.muted, fontWeight: 700, whiteSpace: 'nowrap' as const }}>{e}</span>
        ))}
      </div>
    </div>
  )
}
