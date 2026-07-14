'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getLang } from '../i18n'

const F = '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif'

const PREGUNTAS = [
  {
    q: { es: '¿Qué es Cheers?', en: 'What is Cheers?' },
    a: {
      es: 'Cheers es una forma de organizar cualquier celebración con un solo link — cumpleaños, posadas, quinceañeras, despedidas de soltera, cenas, viajes con amigos. En vez de un grupo de chat, tus invitados abren un link y ahí ven todo: fecha, lugar, quién más va, lista de regalos, y pueden confirmar su asistencia.',
      en: 'Cheers is a way to organize any celebration with a single link — birthdays, holiday parties, quinceañeras, bachelorette parties, dinners, trips with friends. Instead of a group chat, your guests open a link and see everything there: date, place, who else is going, gift list, and they can RSVP.',
    },
  },
  {
    q: { es: '¿Es gratis?', en: 'Is it free?' },
    a: {
      es: 'Sí. El plan Free te deja crear 1 celebración activa a la vez con hasta 3 invitados, sin necesidad de tarjeta. Si necesitas más invitados o más de un evento a la vez, existen los planes Pro ($9 USD por celebración, hasta 10 invitados) y Lifetime ($49 USD pago único, todo ilimitado).',
      en: 'Yes. The Free plan lets you create 1 active celebration at a time with up to 3 guests, no card required. If you need more guests or more than one event at a time, there are Pro plans ($9 USD per celebration, up to 10 guests) and Lifetime ($49 USD one-time payment, everything unlimited).',
    },
  },
  {
    q: { es: '¿Mis invitados necesitan crear una cuenta para ver la invitación?', en: 'Do my guests need to create an account to see the invitation?' },
    a: {
      es: 'No. Cualquiera con el link puede ver lo esencial del evento (para quién es, fecha, lugar) y confirmar su asistencia con solo su nombre, sin necesidad de cuenta. Si quieren ver los detalles completos (dirección exacta, quién más va, lista de regalos), ahí sí necesitan iniciar sesión, pero cualquiera con el link puede hacerlo, no solo la gente que agregaste de antemano.',
      en: 'No. Anyone with the link can see the essentials of the event (who it is for, date, place) and RSVP with just their name, no account needed. If they want to see the full details (exact address, who else is going, gift list), they do need to sign in, but anyone with the link can do that, not just people you added beforehand.',
    },
  },
  {
    q: { es: '¿Cómo confirman asistencia mis invitados?', en: 'How do my guests RSVP?' },
    a: {
      es: 'Directo desde el link, con un botón de "Voy" / "No puedo" / "Tal vez". Tú ves en tiempo real quién ha confirmado desde tu panel de organizador.',
      en: 'Right from the link, with a "Going" / "Can\'t make it" / "Maybe" button. You see who has confirmed in real time from your organizer dashboard.',
    },
  },
  {
    q: { es: '¿Puedo cambiar los detalles del evento después de crearlo?', en: 'Can I change the event details after creating it?' },
    a: {
      es: 'Sí, en cualquier momento — título, fecha, lugar, foto de portada, lista de regalos, itinerario. Los cambios se reflejan al instante para cualquiera que abra el link.',
      en: 'Yes, anytime — title, date, place, cover photo, gift list, itinerary. Changes show up instantly for anyone who opens the link.',
    },
  },
  {
    q: { es: '¿Qué pasa con la privacidad de mis invitados?', en: 'What about my guests privacy?' },
    a: {
      es: 'Solo guardamos lo necesario para que el evento funcione: nombre y, si lo agregas, correo o teléfono. No vendemos datos a nadie ni los usamos para publicidad. Puedes ver el detalle completo en nuestra política de privacidad.',
      en: 'We only store what is necessary for the event to work: name and, if you add it, email or phone. We do not sell data to anyone or use it for advertising. You can see the full detail in our privacy policy.',
    },
  },
  {
    q: { es: '¿Puedo eliminar mi cuenta y mis datos?', en: 'Can I delete my account and my data?' },
    a: {
      es: 'Sí, en cualquier momento desde tu perfil hay un botón de "Eliminar cuenta" que borra tu cuenta, tus celebraciones, y toda la información asociada de forma permanente.',
      en: 'Yes, anytime from your profile there is a "Delete account" button that permanently deletes your account, your celebrations, and all associated information.',
    },
  },
  {
    q: { es: '¿Necesito descargar una app?', en: 'Do I need to download an app?' },
    a: {
      es: 'No, Cheers funciona completo desde el navegador, tanto en celular como en computadora. No hay nada que instalar.',
      en: 'No, Cheers works entirely from the browser, on both phone and computer. There is nothing to install.',
    },
  },
  {
    q: { es: '¿Cómo entro a mi cuenta?', en: 'How do I sign in?' },
    a: {
      es: 'Puedes entrar con tu cuenta de Google o con email y contraseña. Próximamente también con Apple y Facebook.',
      en: 'You can sign in with your Google account or with email and password. Apple and Facebook are coming soon.',
    },
  },
]

export default function FAQ() {
  const router = useRouter()
  const [lang, setLang] = useState<'es' | 'en'>('es')
  const [abierta, setAbierta] = useState<number | null>(0)

  useEffect(() => { setLang(getLang() as 'es' | 'en') }, [])

  return (
    <main style={{ minHeight: '100vh', background: '#0d0b1a', fontFamily: F, color: 'rgba(255,255,255,.85)', padding: '80px 20px 60px' }}>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        <button onClick={() => router.back()} style={{ border: 'none', background: 'rgba(255,255,255,.08)', color: 'rgba(255,255,255,.6)', fontSize: 13, fontWeight: 700, padding: '8px 16px', borderRadius: 99, cursor: 'pointer', fontFamily: F, marginBottom: 32 }}>← {lang === 'en' ? 'Back' : 'Atrás'}</button>

        <div style={{ fontSize: 18, fontWeight: 900, background: 'linear-gradient(135deg,#a89df0,#f08cb0)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: 8 }}>Cheers</div>
        <h1 style={{ fontSize: 32, fontWeight: 800, color: '#fff', margin: '0 0 8px', letterSpacing: '-.5px' }}>{lang === 'en' ? 'Frequently asked questions' : 'Preguntas frecuentes'}</h1>
        <p style={{ fontSize: 15, color: 'rgba(255,255,255,.5)', marginBottom: 40 }}>{lang === 'en' ? 'Everything you need to know before organizing your next celebration.' : 'Todo lo que necesitas saber antes de organizar tu próxima celebración.'}</p>

        {PREGUNTAS.map((item, i) => {
          const abiertaAhora = abierta === i
          return (
            <div key={i} style={{ borderBottom: '1px solid rgba(255,255,255,.08)', marginBottom: 4 }}>
              <button
                onClick={() => setAbierta(abiertaAhora ? null : i)}
                style={{ width: '100%', border: 'none', background: 'none', color: '#fff', fontSize: 16, fontWeight: 700, padding: '18px 0', cursor: 'pointer', fontFamily: F, textAlign: 'left', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}
              >
                {item.q[lang]}
                <span style={{ color: 'rgba(255,255,255,.4)', fontSize: 18, flexShrink: 0, transform: abiertaAhora ? 'rotate(45deg)' : 'none', transition: 'transform .15s' }}>+</span>
              </button>
              {abiertaAhora && (
                <p style={{ fontSize: 15, color: 'rgba(255,255,255,.6)', lineHeight: 1.7, margin: '0 0 20px' }}>{item.a[lang]}</p>
              )}
            </div>
          )
        })}

        <p style={{ textAlign: 'center', fontSize: 13, color: 'rgba(255,255,255,.3)', marginTop: 40 }}>
          {lang === 'en' ? 'Have another question? Write to us at' : '¿Tienes otra pregunta? Escríbenos a'} <a href="mailto:hola@joincheers.app" style={{ color: 'rgba(255,255,255,.5)' }}>hola@joincheers.app</a>
        </p>
      </div>
    </main>
  )
}