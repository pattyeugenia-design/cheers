'use client'
import '@fontsource/allura/latin-400.css'
import '@fontsource/cormorant-garamond/latin-400.css'
import '@fontsource/cormorant-garamond/latin-400-italic.css'
import '@fontsource/jost/latin-400.css'
import '@fontsource/jost/latin-500.css'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import QRCode from 'qrcode'
import { supabase } from '../../../../supabase'
import { paletaDe } from '../../../_invitacion/tema'
import { DefsBotanicos, Peonia } from '../../../_invitacion/Botanicos'

// Tarjeta para imprimir (10 × 15 cm) con el QR del álbum, para las mesas.
// SOLO para la pareja: el álbum se lee con RLS (miembros de la boda).
export default function ImprimirQr({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [cargando, setCargando] = useState(true)
  const [album, setAlbum] = useState<any>(null)
  const [proyecto, setProyecto] = useState<any>(null)
  const [qr, setQr] = useState('')

  useEffect(() => {
    params.then(async ({ id }) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const albumId = new URLSearchParams(window.location.search).get('album') || ''
      const [{ data: a }, { data: pr }] = await Promise.all([
        supabase.from('boda_albumes_qr').select('id, codigo, titulo, despedida_id').eq('boda_id', id).eq('id', albumId).maybeSingle(),
        supabase.from('proyectos_boda').select('tema, fuente, nombre_novia, nombre_novio').eq('id', id).single(),
      ])
      setProyecto(pr)
      if (a && /^[a-z0-9]{8,24}$/.test(a.codigo)) {
        setAlbum(a)
        const svg = await QRCode.toString(`https://joincheers.app/bridal/fotos/${a.codigo}`, { type: 'svg', margin: 0, errorCorrectionLevel: 'M', color: { dark: '#5A4440', light: '#0000' } })
        setQr(`data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`)
      }
      setCargando(false)
    })
  }, [])

  if (cargando) return <main style={{ padding: 40, fontFamily: 'system-ui' }}>Cargando…</main>
  if (!album) return <main style={{ padding: 40, fontFamily: 'system-ui' }}>No encontramos este álbum.</main>

  const p = paletaDe(proyecto?.tema || 'rosapolvo', proyecto?.fuente)
  const pareja = [proyecto?.nombre_novia, proyecto?.nombre_novio].filter(Boolean).join(' & ')
  const etq: React.CSSProperties = { fontFamily: p.etiqueta, fontSize: '3mm', letterSpacing: '.24em', textTransform: 'uppercase', color: p.acento }

  return (
    <div className="qr-raiz">
      <DefsBotanicos />
      <style>{`
        @page { size: 100mm 150mm; margin: 0; }
        body { margin: 0; background: #EDE6E1; }
        .qr-barra { position: sticky; top: 0; z-index: 5; display: flex; gap: 12px; align-items: center; justify-content: center; padding: 12px; background: rgba(60,40,36,.92); color: #fff; font: 13px system-ui; }
        .qr-barra button { font: 700 13px system-ui; padding: 9px 16px; border-radius: 99px; border: none; background: #fff; color: #3D2B2E; cursor: pointer; }
        .qr-hojas { display: flex; flex-wrap: wrap; gap: 24px; justify-content: center; padding: 28px 12px; }
        .qr-tarjeta { width: 100mm; height: 150mm; box-sizing: border-box; position: relative; overflow: hidden; background: linear-gradient(180deg,#F8F4EE 0%,#F4ECE5 60%,#F1E6DF 100%); box-shadow: 0 10px 30px -12px rgba(60,40,36,.35); display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 12mm 10mm; }
        .qr-marco { position: absolute; inset: 5mm; border: 0.3mm solid rgba(173,133,124,.45); border-radius: 3mm; pointer-events: none; }
        @media print {
          body { background: none; }
          .qr-barra { display: none; }
          .qr-hojas { display: block; padding: 0; }
          .qr-tarjeta { box-shadow: none; page-break-after: always; break-after: page; }
          * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>
      <div className="qr-barra">
        <span>Tamaño 10 × 15 cm. En la ventana de imprimir elige “Tamaño real” (100%).</span>
        <button onClick={() => window.print()}>Imprimir</button>
      </div>
      <div className="qr-hojas">
        <div className="qr-tarjeta">
          <div className="qr-marco" />
          <div style={{ position: 'absolute', top: '-6mm', left: '-8mm', opacity: .95 }}><Peonia ancho={110} tono="claro" rotar={-14} /></div>
          <div style={{ position: 'absolute', bottom: '-8mm', right: '-8mm', opacity: .95 }}><Peonia ancho={100} tono="oscuro" rotar={18} /></div>
          <div style={etq}>{album.titulo}</div>
          <div style={{ fontFamily: p.script, fontSize: '15mm', lineHeight: 1, color: p.acento, marginTop: '3mm' }}>Comparte tus fotos</div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {qr && <img src={qr} alt="Código QR del álbum" style={{ width: '50mm', height: '50mm', marginTop: '5mm', background: 'rgba(255,255,255,.75)', padding: '3mm', borderRadius: '2mm' }} />}
          <div style={{ fontFamily: p.serif, fontSize: '4.4mm', lineHeight: 1.35, color: p.txt2, marginTop: '5mm' }}>
            Abre la cámara de tu celular,<br />escanea el código y sube tus fotos.<br /><i style={{ color: p.txt3 }}>Sin app y sin registrarte.</i>
          </div>
          <div style={{ fontFamily: p.etiqueta, fontSize: '2.3mm', letterSpacing: '.18em', textTransform: 'uppercase', color: p.txt3, marginTop: '5mm' }}>{album.despedida_id ? '' : pareja}</div>
          {/* Sello de Cheers */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1.6mm', marginTop: '4mm' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/icon.svg" alt="" style={{ width: '5mm', height: '5mm' }} />
            <span style={{ fontFamily: p.etiqueta, fontSize: '2.1mm', letterSpacing: '.2em', textTransform: 'uppercase', color: p.txt3 }}>Cheers Bridal · joincheers.app</span>
          </div>
        </div>

      </div>
    </div>
  )
}
