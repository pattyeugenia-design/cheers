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

      if (perfil?.username) {
        router.replace(`/${perfil.username}`)
      } else {
        router.replace('/onboarding')
      }
    })
  }, [])

  return null
}