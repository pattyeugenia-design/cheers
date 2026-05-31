'use client'

import { useEffect } from 'react'
import { supabase } from '../supabase'

export default function Login() {
  useEffect(() => {
    supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        window.location.href = '/dashboard'
      }
    })
  }, [])

  async function loginConGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/login`,
      },
    })
  }

  return (
    <main style={{ minHeight: '100vh', background: '#26215C', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif', padding: '2rem' }}>
      <div style={{ background: '#EEEDFE', borderRadius: 16, padding: '2rem', width: '100%', maxWidth: 400, textAlign: 'center' }}>
        <p style={{ fontSize: 48, margin: '0 0 8px' }}>🥂</p>
        <h1 style={{ fontSize: 24, fontWeight: 500, color: '#3C3489', margin: '0 0 8px' }}>Bienvenido a Cheers</h1>
        <p style={{ fontSize: 14, color: '#534AB7', margin: '0 0 2rem' }}>Tu celebración, a tu manera</p>
        <button onClick={loginConGoogle}