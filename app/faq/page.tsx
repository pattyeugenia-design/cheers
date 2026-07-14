'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

const F = '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif'

const PREGUNTAS = [
  {
    q: '¿Qué es Cheers?',
    a: 'Cheers es una forma de organizar cualquier celebración con un solo link — cumpleaños, posadas, quinceañeras, despedidas de soltera, cenas, viajes con amigos. En vez de un grupo de chat, tus invitados abren un link y ahí ven todo: fecha, lugar, quién más va, lista de regalos, y pueden confirmar su asistencia.',
  },
  {
    q: '¿Es gratis?',
    a: 'Sí. El plan Free te deja crear 1 celebración activa a la vez con hasta 3 invitados, sin necesidad de tarjeta. Si necesitas más invitados o más de un evento a la vez, existen los planes Pro ($9 USD por celebración, hasta 10 invitados) y Lifetime ($49 USD pago único, todo ilimitado).',
  },
  {
    q: '¿Mis invitados necesitan crear una cuenta para ver la invitación?',
    a: 'No. Cualquiera con el link puede ver lo esencial del evento (para quién es, fecha, lugar) y confirmar su asistencia con solo su nombre, sin necesidad de cuenta. Si quieren ver los detalles completos (dirección exacta, quién más va, lista de regalos), ahí sí necesitan iniciar sesión, pero cualquiera con el link puede hacerlo, no solo la gente que agregaste de antemano.',
  },
  {
    q: '¿Cómo confirman asistencia mis invitados?',
    a: 'Directo desde el link, con un botón de "Voy" / "No puedo" / "Tal vez". Tú ves en tiempo real quién ha confirmado desde tu panel de organizador.',
  },
  {
    q: '¿Puedo cambiar los detalles del evento después de crearlo?',
    a: 'Sí, en cualquier momento — título, fecha, lugar, foto de portada, lista de regalos, itinerario. Los cambios se reflejan al instante para cualquiera que abra el link.',
  },
  {
    q: '¿Qué pasa con la privacidad de mis invitados?',
    a: 'Solo guardamos lo necesario para que el evento funcione: nombre y, si lo agregas, correo o teléfono. No vendemos datos a nadie ni los usamos para publicidad. Puedes ver el detalle completo en nuestra política de privacidad.',
  },
  {
    q: '¿Puedo eliminar mi cuenta y mis datos?',
    a: 'Sí, en cualquier momento desde tu perfil hay un botón de "Eliminar cuenta" que borra tu cuenta, tus celebraciones, y toda la información asociada de forma permanente.',
  },
  {
    q: '¿Necesito descargar una app?',
    a: 'No, Cheers funciona completo desde el navegador, tanto en celular como en computadora. No hay nada que instalar.',
  },
  {
    q: '¿Cómo entro a mi cuenta?',
    a: 'Puedes entrar con tu cuenta de Google o con email y contraseña. Próximamente también con Apple y Facebook.',
  },
]

export default function FAQ() {
  const router = useRouter()
  const [abierta, setAbierta] = useState<number | null>(0)

  return (
    <main style={{ minHeight: '100vh', background: '#0d0b1a', fontFamily: F, color: 'rgba(255,255,255,.85)', padding: '80px 20px 60px' }}>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        <button onClick={() => router.back()} style={{ border: 'none', background: 'rgba(255,255,255,.08)', color: 'rgba(255,255,255,.6)', fontSize: 13, fontWeight: 700, padding: '8px 16px', borderRadius: 99, cursor: 'pointer', fontFamily: F, marginBottom: 32 }}>← Atrás</button>

        <div style={{ fontSize: 18, fontWeight: 900, background: 'linear-gradient(135deg,#a89df0,#f08cb0)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: 8 }}>Cheers</div>
        <h1 style={{ fontSize: 32, fontWeight: 800, color: '#fff', margin: '0 0 8px', letterSpacing: '-.5px' }}>Preguntas frecuentes</h1>
        <p style={{ fontSize: 15, color: 'rgba(255,255,255,.5)', marginBottom: 40 }}>Todo lo que necesitas saber antes de organizar tu próxima celebración.</p>

        {PREGUNTAS.map((item, i) => {
          const abiertaAhora = abierta === i
          return (
            <div key={i} style={{ borderBottom: '1px solid rgba(255,255,255,.08)', marginBottom: 4 }}>
              <button
                onClick={() => setAbierta(abiertaAhora ? null : i)}
                style={{ width: '100%', border: 'none', background: 'none', color: '#fff', fontSize: 16, fontWeight: 700, padding: '18px 0', cursor: 'pointer', fontFamily: F, textAlign: 'left', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}
              >
                {item.q}
                <span style={{ color: 'rgba(255,255,255,.4)', fontSize: 18, flexShrink: 0, transform: abiertaAhora ? 'rotate(45deg)' : 'none', transition: 'transform .15s' }}>+</span>
              </button>
              {abiertaAhora && (
                <p style={{ fontSize: 15, color: 'rgba(255,255,255,.6)', lineHeight: 1.7, margin: '0 0 20px' }}>{item.a}</p>
              )}
            </div>
          )
        })}

        <p style={{ textAlign: 'center', fontSize: 13, color: 'rgba(255,255,255,.3)', marginTop: 40 }}>
          ¿Tienes otra pregunta? Escríbenos a <a href="mailto:hola@joincheers.app" style={{ color: 'rgba(255,255,255,.5)' }}>hola@joincheers.app</a>
        </p>
      </div>
    </main>
  )
}