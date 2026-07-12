'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getLang } from '../i18n'

const F = '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif'

export default function Privacidad() {
  const router = useRouter()
  const [lang, setLang] = useState('es')
  useEffect(() => { setLang(getLang()) }, [])

  const fecha = '11 de julio de 2026'

  return (
    <main style={{ minHeight:'100vh', background:'#0d0b1a', fontFamily:F, color:'rgba(255,255,255,.85)', padding:'80px 20px 60px' }}>
      <div style={{ maxWidth:720, margin:'0 auto' }}>
        <button onClick={() => router.back()} style={{ border:'none', background:'rgba(255,255,255,.08)', color:'rgba(255,255,255,.6)', fontSize:13, fontWeight:700, padding:'8px 16px', borderRadius:99, cursor:'pointer', fontFamily:F, marginBottom:32 }}>← Atrás</button>
        
        <div style={{ fontSize:18, fontWeight:900, background:'linear-gradient(135deg,#a89df0,#f08cb0)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', marginBottom:8 }}>Cheers</div>
        <h1 style={{ fontSize:32, fontWeight:800, color:'#fff', margin:'0 0 8px', letterSpacing:'-.5px' }}>Política de Privacidad</h1>
        <p style={{ fontSize:14, color:'rgba(255,255,255,.35)', marginBottom:48 }}>Última actualización: {fecha}</p>

        {[
          { title: '1. Quiénes somos', body: 'Cheers (joincheers.app) es una plataforma para organizar celebraciones. El responsable del tratamiento de tus datos es Patricia Eugenia González Quiroga, con operaciones desde Monterrey, Nuevo León, México.' },
          { title: '2. Datos que recopilamos', body: 'Recopilamos la información que proporcionas al crear tu cuenta (nombre, correo electrónico, foto de perfil vía Google OAuth), los datos de las celebraciones que creas (nombres de eventos, fechas, lugares, listas de invitados), y las confirmaciones de asistencia (RSVPs) que tus invitados envían.' },
          { title: '3. Cómo usamos tus datos', body: 'Usamos tus datos únicamente para operar el servicio: mostrarte tus celebraciones, permitir que tus invitados vean el plan del evento y confirmen asistencia. No vendemos tus datos a terceros. No usamos tus datos para publicidad.' },
          { title: '4. Datos de invitados', body: 'Cuando agregas a alguien como invitado, recopilamos su nombre y/o correo electrónico. Al hacer RSVP, el invitado proporciona su confirmación de asistencia. Tú, como organizador, eres responsable de tener el consentimiento de tus invitados para agregar su información.' },
          { title: '5. Almacenamiento', body: 'Tus datos se almacenan en servidores de Supabase (supabase.com) ubicados en Estados Unidos, con cifrado en tránsito y en reposo. Las imágenes de portada se almacenan en el servicio de Storage de Supabase.' },
          { title: '6. Tus derechos (LFPDPPP)', body: 'De conformidad con la Ley Federal de Protección de Datos Personales en Posesión de los Particulares, tienes derecho a Acceder, Rectificar, Cancelar u Oponerte al tratamiento de tus datos personales (derechos ARCO). Para ejercerlos, escríbenos a privacidad@joincheers.app.' },
          { title: '7. Eliminación de cuenta', body: 'Puedes solicitar la eliminación de tu cuenta y todos tus datos en cualquier momento escribiendo a privacidad@joincheers.app. Procesaremos tu solicitud en un plazo máximo de 15 días hábiles.' },
          { title: '8. Cookies', body: 'Usamos cookies estrictamente necesarias para mantener tu sesión activa. No usamos cookies de rastreo ni de publicidad.' },
          { title: '9. Cambios a esta política', body: 'Si realizamos cambios significativos a esta política, te notificaremos por correo electrónico o mediante un aviso en la plataforma con al menos 15 días de anticipación.' },
          { title: '10. Contacto', body: 'Para cualquier pregunta sobre esta política de privacidad, contáctanos en privacidad@joincheers.app.' },
        ].map(s => <div key={s.title} style={{ marginBottom:32 }}>
          <h2 style={{ fontSize:18, fontWeight:800, color:'#fff', margin:'0 0 10px' }}>{s.title}</h2>
          <p style={{ fontSize:15, color:'rgba(255,255,255,.6)', lineHeight:1.7, margin:0 }}>{s.body}</p>
        </div>)}
      </div>
    </main>
  )
}