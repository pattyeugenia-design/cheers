'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../supabase'

export default function DashboardRedirect() {
  const router = useRouter()

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.push('/login'); return }

      const { data: perfil } = await supabase
        .from('perfiles')
        .select('username')
        .eq('user_id', user.id)
        .single()

      const redirect = typeof window !== 'undefined' ? sessionStorage.getItem('redirect_after_login') : null

      if (perfil?.username) {
        if (redirect) { sessionStorage.removeItem('redirect_after_login'); router.replace(redirect) }
        else router.replace(`/${perfil.username}`)
      } else {
        router.replace('/onboarding')
      }
    })
  }, [])

  return null
}