'use client'
import '@fontsource/allura/latin-400.css'
import '@fontsource/cormorant-garamond/latin-400.css'
import '@fontsource/cormorant-garamond/latin-400-italic.css'
import '@fontsource/jost/latin-400.css'
import '@fontsource/jost/latin-500.css'
import { useEffect, useRef, useState } from 'react'
import { supabase } from '../../../supabase'
import { getLang } from '../../../i18n'
import { paletaDe, urlImagenSegura } from '../../_invitacion/tema'
import { DefsBotanicos } from '../../_invitacion/Botanicos'
import { Ambiente, Estilos } from '../../_invitacion/Invitacion'

// Página del QR del evento: cualquiera con el código puede subir fotos al
// álbum (solo dentro de su horario) y ver las que ya subieron todos. No hay
// datos de invitados aquí; solo el nombre del álbum, la portada y las fotos.
const CODIGO = /^[a-z0-9]{8,24}$/
const CLAVE_NOMBRE = 'cheers_qr_nombre'

type Foto = { url: string; subida_por: string | null; created_at: string }

// Reduce la foto en el navegador (máx. 1600 px, JPG): pesa poco, sube rápido y
// el filtro de contenido siempre la puede revisar (las HEIC del iPhone se convierten aquí).
async function reducirFoto(archivo: File): Promise<Blob | null> {
  try {
    const bitmap = await createImageBitmap(archivo)
    const escala = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height))
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(bitmap.width * escala)
    canvas.height = Math.round(bitmap.height * escala)
    canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    return await new Promise<Blob | null>(r => canvas.toBlob(r, 'image/jpeg', 0.82))
  } catch {
    return archivo.type === 'image/jpeg' || archivo.type === 'image/png' ? archivo : null
  }
}

export default function AlbumQr({ params }: { params: Promise<{ codigo: string }> }) {
  const [lang, setLang] = useState('es')
  const [codigo, setCodigo] = useState('')
  const [cargando, setCargando] = useState(true)
  const [album, setAlbum] = useState<any>(null)
  const [fotos, setFotos] = useState<Foto[]>([])
  const [nombre, setNombre] = useState('')
  const [progreso, setProgreso] = useState<{ hechas: number; total: number } | null>(null)
  const [resultado, setResultado] = useState<{ ok: number; fallaron: number; mensaje: string } | null>(null)
  const [visor, setVisor] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const t = (es: string, en: string) => (lang === 'en' ? en : es)

  async function cargarFotos(c: string) {
    const { data } = await supabase.rpc('get_fotos_album_qr', { p_codigo: c })
    setFotos((data || []) as Foto[])
  }

  useEffect(() => {
    setLang(getLang())
    try { setNombre(localStorage.getItem(CLAVE_NOMBRE) || '') } catch { /* sin almacenamiento */ }
    params.then(async ({ codigo }) => {
      setCodigo(codigo)
      if (!CODIGO.test(codigo)) { setCargando(false); return }
      const { data } = await supabase.rpc('get_album_qr', { p_codigo: codigo })
      const a = Array.isArray(data) ? data[0] : data
      setAlbum(a || null)
      if (a?.invitados_ven_album) await cargarFotos(codigo)
      setCargando(false)
    })
  }, [])

  useEffect(() => {
    if (!visor) return
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') setVisor(null) }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [visor])

  async function subir(archivos: FileList | null) {
    if (!archivos || archivos.length === 0) return
    const lista = Array.from(archivos).slice(0, 30)
    try { localStorage.setItem(CLAVE_NOMBRE, nombre.trim().slice(0, 60)) } catch { /* sin almacenamiento */ }
    setResultado(null)
    setProgreso({ hechas: 0, total: lista.length })
    let ok = 0, fallaron = 0, mensaje = ''
    for (let i = 0; i < lista.length; i++) {
      const foto = await reducirFoto(lista[i])
      if (!foto) { fallaron++; mensaje = t('Una foto no se pudo leer.', 'A photo could not be read.') }
      else {
        const form = new FormData()
        form.append('codigo', codigo)
        form.append('nombre', nombre.trim().slice(0, 60))
        form.append('archivo', foto, 'foto.jpg')
        try {
          const res = await fetch('/api/subir-foto-qr', { method: 'POST', body: form })
          if (res.ok) ok++
          else {
            fallaron++
            const d = await res.json().catch(() => null)
            mensaje = String(d?.error || t('No se pudo subir una foto.', 'A photo could not be uploaded.')).slice(0, 140)
            if (res.status === 403 || res.status === 429) { fallaron += lista.length - i - 1; break }
          }
        } catch {
          fallaron++
          mensaje = t('Revisa tu conexión e intenta de nuevo.', 'Check your connection and try again.')
        }
      }
      setProgreso({ hechas: i + 1, total: lista.length })
    }
    setProgreso(null)
    setResultado({ ok, fallaron, mensaje })
    if (inputRef.current) inputRef.current.value = ''
    if (album?.invitados_ven_album) cargarFotos(codigo)
  }

  const p = paletaDe(album?.tema || 'rosapolvo', album?.fuente)
  const etq: React.CSSProperties = { fontFamily: p.etiqueta, fontSize: 11, fontWeight: 500, letterSpacing: '.24em', textTransform: 'uppercase', color: p.acento }
  const fondo: React.CSSProperties = { background: p.bg, backgroundColor: p.papel, color: p.txt, minHeight: '100vh', position: 'relative', overflowX: 'hidden', fontFamily: p.serif }

  if (cargando) return <main style={{ ...fondo, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><p style={{ color: p.acento, fontStyle: 'italic' }}>{t('Cargando…', 'Loading…')}</p></main>
  if (!album) return <main style={{ ...fondo, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}><p style={{ color: p.txt2, fontStyle: 'italic', textAlign: 'center' }}>{t('No encontramos este álbum.', "We couldn't find this album.")}</p></main>

  const ahora = Date.now()
  const antes = ahora < new Date(album.abre).getTime()
  const despues = ahora > new Date(album.cierra).getTime()
  const abierto = !antes && !despues
  const loc = lang === 'en' ? 'en-US' : 'es-MX'
  const abreFecha = new Date(album.abre)
  const fechaAbre = `${abreFecha.toLocaleDateString(loc, { weekday: 'long', day: 'numeric', month: 'long' }).replace(',', '')} ${lang === 'en' ? 'at' : 'a las'} ${abreFecha.toLocaleTimeString(loc, { hour: 'numeric', minute: '2-digit' })}`
  const pareja = [album.nombre_novia, album.nombre_novio].filter(Boolean).join(' & ')

  return (
    <div className="cw-raiz" style={fondo}>
      <DefsBotanicos />
      <Estilos p={p} />
      <Ambiente p={p} />
      <style>{`html, body { overflow-x: hidden; }`}</style>
      <main style={{ position: 'relative', zIndex: 2, maxWidth: 560, margin: '0 auto', padding: '56px 20px 40px', textAlign: 'center' }}>
        <div style={etq}>{album.titulo}</div>
        <h1 style={{ fontFamily: p.script, fontWeight: 400, fontSize: 'clamp(46px, 13vw, 72px)', lineHeight: 1.05, color: p.acento, margin: '10px 0 0' }}>{t('Comparte tus fotos', 'Share your photos')}</h1>
        <p style={{ fontFamily: p.serif, fontSize: 19, lineHeight: 1.45, color: p.txt2, margin: '10px auto 0', maxWidth: 420 }}>
          {abierto
            ? t('Sube las fotos que tomes hoy. Quedan en un álbum para ' + (pareja || 'los festejados') + ' y para todos.', 'Upload the photos you take today. They go into one album for ' + (pareja || 'the hosts') + ' and everyone.')
            : antes
              ? t(`El álbum abre el ${fechaAbre}`, `The album opens on ${fechaAbre}`)
              : t('El álbum ya cerró. ¡Gracias por compartir!', 'The album is closed. Thanks for sharing!')}
        </p>

        {abierto && (
          <div style={{ marginTop: 24, border: `1px solid ${p.cardBorde}`, background: p.card, borderRadius: 20, padding: '20px 18px' }}>
            <input value={nombre} onChange={e => setNombre(e.target.value)} maxLength={60} placeholder={t('Tu nombre (opcional)', 'Your name (optional)')}
              style={{ display: 'block', width: '100%', boxSizing: 'border-box', padding: '12px 16px', borderRadius: 999, border: `1px solid ${p.linea}`, background: 'rgba(255,255,255,.8)', fontFamily: p.serif, fontSize: 18, color: p.txt, outline: 'none', textAlign: 'center' }} />
            <input ref={inputRef} type="file" accept="image/*" multiple onChange={e => subir(e.target.files)} style={{ display: 'none' }} />
            <button type="button" className="cw-btn" disabled={!!progreso} onClick={() => inputRef.current?.click()}
              style={{ marginTop: 14, width: '100%', cursor: progreso ? 'default' : 'pointer', fontFamily: p.etiqueta, fontSize: 13, fontWeight: 500, letterSpacing: '.2em', textTransform: 'uppercase', padding: '18px 16px', borderRadius: 999, border: `1px solid ${p.acento}`, background: p.acento, color: p.botonTxt, opacity: progreso ? 0.7 : 1 }}>
              {progreso ? t(`Subiendo ${progreso.hechas} de ${progreso.total}…`, `Uploading ${progreso.hechas} of ${progreso.total}…`) : t('Subir fotos', 'Upload photos')}
            </button>
            <p style={{ fontFamily: p.serif, fontStyle: 'italic', fontSize: 15, color: p.txt3, margin: '10px 0 0' }}>{t('Puedes elegir varias a la vez.', 'You can pick several at once.')}</p>
            {resultado && (
              <p style={{ fontFamily: p.serif, fontSize: 18, color: resultado.fallaron && !resultado.ok ? '#A0524F' : p.acento, margin: '12px 0 0' }}>
                {resultado.ok > 0 && t(`¡Listo! Subiste ${resultado.ok} ${resultado.ok === 1 ? 'foto' : 'fotos'}.`, `Done! You uploaded ${resultado.ok} ${resultado.ok === 1 ? 'photo' : 'photos'}.`)}
                {resultado.fallaron > 0 && <><br /><span style={{ fontSize: 16, color: p.txt3 }}>{resultado.mensaje}</span></>}
              </p>
            )}
          </div>
        )}

        {album.invitados_ven_album && fotos.length > 0 && (
          <section style={{ marginTop: 34 }}>
            <div style={etq}>{t(`El álbum · ${fotos.length} ${fotos.length === 1 ? 'foto' : 'fotos'}`, `The album · ${fotos.length} photos`)}</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, marginTop: 14 }}>
              {fotos.map((f, i) => {
                const u = urlImagenSegura(f.url)
                return u ? (
                  <button key={i} type="button" className="cw-foto-mini" onClick={() => setVisor(u)} aria-label={t('Ampliar foto', 'Enlarge photo')} style={{ all: 'unset', cursor: 'zoom-in', display: 'block', borderRadius: 8, overflow: 'hidden' }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={u} alt="" loading="lazy" decoding="async" style={{ display: 'block', width: '100%', aspectRatio: '1', objectFit: 'cover' }} />
                  </button>
                ) : null
              })}
            </div>
          </section>
        )}

        <a href="https://joincheers.app" target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', marginTop: 34, textDecoration: 'none', opacity: 0.7 }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/icon.svg" alt="" width={18} height={18} />
            <span style={{ fontFamily: p.etiqueta, fontSize: 9.5, letterSpacing: '.22em', textTransform: 'uppercase', color: p.txt3 }}>{t('Álbum creado con Cheers Bridal', 'Album made with Cheers Bridal')}</span>
          </span>
        </a>
      </main>

      {visor && (
        <div className="cw-visor" onClick={() => setVisor(null)} role="dialog" aria-modal="true">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={visor} alt="" />
          <button type="button" aria-label={t('Cerrar', 'Close')} onClick={() => setVisor(null)}>×</button>
        </div>
      )}
    </div>
  )
}
