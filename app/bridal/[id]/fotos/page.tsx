'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../../supabase'
import { getLang } from '../../../i18n'
import { urlImagenSegura } from '../../_invitacion/tema'

// Álbumes con QR, SOLO para la pareja (RLS de boda_albumes_qr y boda_fotos):
// link y QR para imprimir, ver/borrar fotos y descargarlas todas en un .zip.
const F = '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif'
const ROSA = '#B76E79'
const TINTA = '#3D2B2E'

type Album = { id: string; codigo: string; titulo: string; abre: string; cierra: string; invitados_ven_album: boolean; despedida_id: string | null }
type Foto = { id: string; url: string; ruta_storage: string; subida_por: string | null; created_at: string; album_id: string; aprobado: boolean }

export default function FotosQrDashboard({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [lang, setLang] = useState('es')
  const [id, setId] = useState('')
  const [cargando, setCargando] = useState(true)
  const [albumes, setAlbumes] = useState<Album[]>([])
  const [fotos, setFotos] = useState<Foto[]>([])
  const [abierto, setAbierto] = useState<string>('')
  const [copiado, setCopiado] = useState('')
  const [zip, setZip] = useState<{ album: string; hechas: number; total: number } | null>(null)
  const t = (es: string, en: string) => (lang === 'en' ? en : es)

  useEffect(() => {
    setLang(getLang())
    params.then(async ({ id }) => {
      setId(id)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const { data: al } = await supabase.from('boda_albumes_qr').select('id, codigo, titulo, abre, cierra, invitados_ven_album, despedida_id').eq('boda_id', id).order('abre', { ascending: true })
      const lista = (al || []) as Album[]
      setAlbumes(lista)
      setAbierto(lista[0]?.id || '')
      if (lista.length) {
        const { data: fo } = await supabase.from('boda_fotos').select('id, url, ruta_storage, subida_por, created_at, album_id, aprobado').in('album_id', lista.map(a => a.id)).order('created_at', { ascending: false }).limit(5000)
        setFotos((fo || []) as Foto[])
      }
      setCargando(false)
    })
  }, [])

  const origen = typeof window !== 'undefined' ? window.location.origin : 'https://joincheers.app'
  const linkDe = (a: Album) => `${origen}/bridal/fotos/${a.codigo}`
  const fecha = (iso: string) => new Date(iso).toLocaleString(lang === 'en' ? 'en-US' : 'es-MX', { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })

  async function cambiarVisible(a: Album) {
    const v = !a.invitados_ven_album
    const { error } = await supabase.from('boda_albumes_qr').update({ invitados_ven_album: v }).eq('id', a.id)
    if (!error) setAlbumes(prev => prev.map(x => (x.id === a.id ? { ...x, invitados_ven_album: v } : x)))
  }

  async function borrarFoto(f: Foto) {
    if (!window.confirm(t('¿Borrar esta foto del álbum?', 'Delete this photo?'))) return
    await supabase.storage.from('fotos-boda').remove([f.ruta_storage])
    const { error } = await supabase.from('boda_fotos').delete().eq('id', f.id)
    if (!error) setFotos(prev => prev.filter(x => x.id !== f.id))
  }

  async function aprobar(ids: string[]) {
    if (!ids.length) return
    const { error } = await supabase.from('boda_fotos').update({ aprobado: true }).in('id', ids)
    if (!error) setFotos(prev => prev.map(x => (ids.includes(x.id) ? { ...x, aprobado: true } : x)))
  }

  async function descargarTodas(a: Album) {
    const lista = fotos.filter(f => f.album_id === a.id)
    if (!lista.length) return
    const JSZip = (await import('jszip')).default
    const z = new JSZip()
    setZip({ album: a.id, hechas: 0, total: lista.length })
    for (let i = 0; i < lista.length; i++) {
      const u = urlImagenSegura(lista[i].url)
      if (u) {
        try {
          const r = await fetch(u)
          if (r.ok) {
            const ext = (lista[i].ruta_storage.split('.').pop() || 'jpg').replace(/[^a-z]/gi, '').slice(0, 4) || 'jpg'
            const quien = String(lista[i].subida_por || '').normalize('NFD').replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 30)
            z.file(`${String(i + 1).padStart(4, '0')}${quien ? '-' + quien : ''}.${ext}`, await r.blob())
          }
        } catch { /* se salta la foto que no bajó */ }
      }
      setZip({ album: a.id, hechas: i + 1, total: lista.length })
    }
    const blob = await z.generateAsync({ type: 'blob' })
    const enlace = document.createElement('a')
    enlace.href = URL.createObjectURL(blob)
    enlace.download = `${a.titulo.normalize('NFD').replace(/[^a-zA-Z0-9]+/g, '-').toLowerCase()}.zip`
    enlace.click()
    setTimeout(() => URL.revokeObjectURL(enlace.href), 4000)
    setZip(null)
  }

  const pagina: React.CSSProperties = { minHeight: '100vh', background: '#FBF6F3', fontFamily: F, color: TINTA }
  const boton: React.CSSProperties = { border: 'none', cursor: 'pointer', fontFamily: F, fontSize: 12, fontWeight: 700, padding: '8px 11px', borderRadius: 9, background: 'rgba(183,110,121,.1)', color: TINTA, textDecoration: 'none', whiteSpace: 'nowrap', display: 'inline-block' }
  if (cargando) return <main style={{ ...pagina, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><p style={{ color: ROSA }}>{t('Cargando…', 'Loading…')}</p></main>

  return (
    <main style={pagina}>
      <div style={{ maxWidth: 1440, margin: '0 auto', padding: '22px 16px 60px' }}>
        <a href={`/bridal/${id}`} style={{ color: ROSA, fontWeight: 700, fontSize: 13, textDecoration: 'none' }}>{t('← Dashboard', '← Dashboard')}</a>
        <h1 style={{ fontSize: 24, margin: '14px 0 4px' }}>{t('Álbumes de fotos con QR', 'Photo albums with QR')}</h1>
        <p style={{ fontSize: 14, color: 'rgba(61,43,46,.65)', margin: 0, lineHeight: 1.5 }}>{t('Tus invitados escanean el QR y suben sus fotos sin app ni registro. Solo se puede subir dentro del horario del álbum.', 'Guests scan the QR and upload photos with no app or sign-up, only during the album hours.')}</p>

        {albumes.length === 0 && <p style={{ marginTop: 24, fontSize: 14 }}>{t('Todavía no hay álbumes.', 'No albums yet.')}</p>}

        {albumes.map(a => {
          const suyas = fotos.filter(f => f.album_id === a.id)
          const ahora = Date.now()
          const estado = ahora < new Date(a.abre).getTime() ? t('Todavía no abre', 'Not open yet') : ahora > new Date(a.cierra).getTime() ? t('Cerrado', 'Closed') : t('Abierto ahora', 'Open now')
          return (
            <section key={a.id} style={{ background: '#fff', borderRadius: 14, padding: '16px', border: '1px solid rgba(183,110,121,.15)', marginTop: 18 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
                <h2 style={{ fontSize: 18, margin: 0 }}>{a.titulo}</h2>
                <span style={{ fontSize: 12, fontWeight: 800, color: ROSA }}>{estado} · {suyas.length} {t('fotos', 'photos')}</span>
              </div>
              <p style={{ fontSize: 13, color: 'rgba(61,43,46,.6)', margin: '6px 0 0' }}>{t('Abre', 'Opens')} {fecha(a.abre)} · {t('cierra', 'closes')} {fecha(a.cierra)}</p>
              <div style={{ fontSize: 13, background: 'rgba(183,110,121,.06)', borderRadius: 8, padding: '8px 10px', marginTop: 10, wordBreak: 'break-all' }}>{linkDe(a)}</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 10 }}>
                <a href={`/bridal/${id}/fotos/imprimir?album=${a.id}`} target="_blank" rel="noopener noreferrer" style={{ ...boton, background: ROSA, color: '#fff' }}>{t('Imprimir QR', 'Print QR')}</a>
                <button onClick={() => navigator.clipboard?.writeText(linkDe(a)).then(() => { setCopiado(a.id); setTimeout(() => setCopiado(''), 1600) })} style={boton}>{copiado === a.id ? t('Copiado', 'Copied') : t('Copiar link', 'Copy link')}</button>
                <a href={linkDe(a)} target="_blank" rel="noopener noreferrer" style={boton}>{t('Ver', 'Open')}</a>
                <button onClick={() => cambiarVisible(a)} style={boton}>{a.invitados_ven_album ? t('Invitados ven el álbum: sí', 'Guests see album: yes') : t('Invitados ven el álbum: no', 'Guests see album: no')}</button>
                <button onClick={() => descargarTodas(a)} disabled={!suyas.length || !!zip} style={{ ...boton, opacity: !suyas.length || zip ? 0.5 : 1 }}>
                  {zip?.album === a.id ? t(`Preparando ${zip.hechas}/${zip.total}…`, `Preparing ${zip.hechas}/${zip.total}…`) : t('Descargar todas (.zip)', 'Download all (.zip)')}
                </button>
                {suyas.some(f => !f.aprobado) && <button onClick={() => aprobar(suyas.filter(f => !f.aprobado).map(f => f.id))} style={{ ...boton, background: '#7A9E78', color: '#fff' }}>{t(`Publicar ${suyas.filter(f => !f.aprobado).length} pendientes`, `Publish ${suyas.filter(f => !f.aprobado).length} pending`)}</button>}
                {suyas.length > 0 && <button onClick={() => setAbierto(abierto === a.id ? '' : a.id)} style={boton}>{abierto === a.id ? t('Ocultar fotos', 'Hide photos') : t('Ver fotos', 'Show photos')}</button>}
              </div>
              {abierto === a.id && suyas.length > 0 && (
                <div style={{ columnWidth: 190, columnGap: 10, marginTop: 14 }}>
                  {suyas.map(f => {
                    const u = urlImagenSegura(f.url)
                    return u ? (
                      <div key={f.id} style={{ position: 'relative', breakInside: 'avoid', marginBottom: 10 }}>
                        <a href={u} target="_blank" rel="noopener noreferrer">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={u} alt="" loading="lazy" style={{ display: 'block', width: '100%', height: 'auto', borderRadius: 8 }} />
                        </a>
                        <div style={{ fontSize: 11, color: 'rgba(61,43,46,.6)', marginTop: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{f.subida_por || t('Sin nombre', 'No name')}</div>
                        {!f.aprobado && <button onClick={() => aprobar([f.id])} style={{ position: 'absolute', top: 4, left: 4, border: 'none', cursor: 'pointer', fontFamily: F, fontSize: 10, fontWeight: 800, padding: '4px 8px', borderRadius: 99, background: 'rgba(255,255,255,.92)', color: TINTA }}>{t('Pendiente · publicar', 'Pending · publish')}</button>}
                        <button onClick={() => borrarFoto(f)} aria-label={t('Borrar foto', 'Delete photo')} style={{ position: 'absolute', top: 4, right: 4, border: 'none', cursor: 'pointer', width: 26, height: 26, borderRadius: 99, background: 'rgba(61,43,46,.7)', color: '#fff', fontSize: 15, lineHeight: '26px' }}>×</button>
                      </div>
                    ) : null
                  })}
                </div>
              )}
            </section>
          )
        })}
      </div>
    </main>
  )
}
