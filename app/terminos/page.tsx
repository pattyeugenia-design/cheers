'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getLang } from '../i18n'

const F = '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif'

export default function Terminos() {
  const router = useRouter()
  const [lang, setLang] = useState('es')
  useEffect(() => { setLang(getLang()) }, [])

  return (
    <main style={{ minHeight:'100vh', background:'#0d0b1a', fontFamily:F, color:'rgba(255,255,255,.85)', padding:'80px 20px 60px' }}>
      <div style={{ maxWidth:720, margin:'0 auto' }}>
        <button onClick={() => router.back()} style={{ border:'none', background:'rgba(255,255,255,.08)', color:'rgba(255,255,255,.6)', fontSize:13, fontWeight:700, padding:'8px 16px', borderRadius:99, cursor:'pointer', fontFamily:F, marginBottom:32 }}>← Atrás</button>

        <div style={{ fontSize:18, fontWeight:900, background:'linear-gradient(135deg,#a89df0,#f08cb0)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', marginBottom:8 }}>Cheers</div>
        <h1 style={{ fontSize:32, fontWeight:800, color:'#fff', margin:'0 0 8px', letterSpacing:'-.5px' }}>Términos de Uso</h1>
        <p style={{ fontSize:14, color:'rgba(255,255,255,.35)', marginBottom:48 }}>Última actualización: 11 de julio de 2026</p>

        {[
          { title: '1. Aceptación', body: 'Al usar Cheers (joincheers.app), aceptas estos términos. Si no estás de acuerdo, no uses el servicio.' },
          { title: '2. El servicio', body: 'Cheers es una plataforma para organizar celebraciones. Permite crear páginas de eventos, compartirlas mediante un link, e invitar personas a confirmar su asistencia. Según el plan del organizador, el nivel de detalle visible sin necesidad de cuenta puede variar.' },
          { title: '3. Tu cuenta', body: 'Eres responsable de mantener la seguridad de tu cuenta. No compartas tus credenciales. Debes tener al menos 13 años para usar el servicio.' },
          { title: '4. Uso aceptable', body: 'Puedes usar Cheers para organizar eventos personales y sociales. No puedes usar el servicio para actividades ilegales, spam, acoso, o para distribuir contenido dañino u ofensivo.' },
          { title: '5. Contenido', body: 'Eres responsable del contenido que publicas en Cheers (nombres de eventos, fotos, información de invitados). Nos otorgas una licencia limitada para mostrar ese contenido como parte del servicio.' },
          { title: '6. Planes y pagos', body: 'El plan Free es gratuito con limitaciones. Los planes Pro y Lifetime requieren pago. Los pagos no son reembolsables salvo que la ley lo requiera. Nos reservamos el derecho de cambiar los precios con 30 días de aviso.' },
          { title: '7. Privacidad de invitados', body: 'Al agregar invitados a un evento, declaras tener su consentimiento para incluir su información en la plataforma.' },
          { title: '8. Limitación de responsabilidad', body: 'Cheers se proporciona "tal cual". No garantizamos disponibilidad ininterrumpida. No somos responsables por pérdidas derivadas del uso del servicio.' },
          { title: '9. Terminación', body: 'Podemos suspender o terminar cuentas que violen estos términos. Puedes cancelar tu cuenta en cualquier momento.' },
          { title: '10. Cambios', body: 'Podemos actualizar estos términos. Te avisaremos con al menos 15 días de anticipación ante cambios significativos.' },
          { title: '11. Ley aplicable', body: 'Estos términos se rigen por las leyes de los Estados Unidos Mexicanos. Cualquier disputa se resolverá en los tribunales de Monterrey, Nuevo León.' },
          { title: '12. Contacto', body: 'Para dudas sobre estos términos: hola@joincheers.app' },
        ].map(s => <div key={s.title} style={{ marginBottom:32 }}>
          <h2 style={{ fontSize:18, fontWeight:800, color:'#fff', margin:'0 0 10px' }}>{s.title}</h2>
          <p style={{ fontSize:15, color:'rgba(255,255,255,.6)', lineHeight:1.7, margin:0 }}>{s.body}</p>
        </div>)}
      </div>
    </main>
  )
}