'use client'
import { useRouter } from 'next/navigation'
import { getLang } from './i18n'
import { useEffect, useState } from 'react'

const F = '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif'

export default function NotFound() {
  const router = useRouter()
  const [lang, setLang] = useState('es')
  useEffect(() => { setLang(getLang()) }, [])

  return (
    <main style={{ minHeight:'100vh', background:'linear-gradient(160deg,#0d0b1a,#1a1440)', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:F, padding:20 }}>
      <style>{`@keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}`}</style>
      <div style={{ textAlign:'center', maxWidth:480 }}>
        <div style={{ fontSize:80, animation:'float 3s ease-in-out infinite', marginBottom:16, lineHeight:1 }}>🥂</div>
        <div style={{ fontSize:18, fontWeight:900, background:'linear-gradient(135deg,#a89df0,#f08cb0)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', letterSpacing:'-.5px', marginBottom:16 }}>Cheers</div>
        <h1 style={{ fontSize:28, fontWeight:800, color:'#fff', margin:'0 0 12px', letterSpacing:'-.5px' }}>
          {lang === 'en' ? 'This page doesn\'t exist' : 'Esta página no existe'}
        </h1>
        <p style={{ fontSize:15, color:'rgba(255,255,255,.5)', margin:'0 0 32px', lineHeight:1.6 }}>
          {lang === 'en' ? 'Maybe the link expired, or you followed a broken URL.' : 'El link puede haber expirado o la URL no es correcta.'}
        </p>
        <button onClick={() => router.push('/')} style={{ border:'none', background:'linear-gradient(135deg,#534AB7,#D4537E)', color:'#fff', fontSize:15, fontWeight:700, padding:'14px 28px', borderRadius:14, cursor:'pointer', fontFamily:F, boxShadow:'0 12px 28px rgba(212,83,126,.3)' }}>
          {lang === 'en' ? 'Go home' : 'Ir al inicio'}
        </button>
      </div>
    </main>
  )
}