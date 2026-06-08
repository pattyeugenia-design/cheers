'use client'

import { useEffect, useRef } from 'react'

export default function ClientEffects() {
  const cursorRef = useRef<HTMLDivElement>(null)
  const trailRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const move = (e: MouseEvent) => {
      if (cursorRef.current) {
        cursorRef.current.style.left = e.clientX + 'px'
        cursorRef.current.style.top = e.clientY + 'px'
      }
      setTimeout(() => {
        if (trailRef.current) {
          trailRef.current.style.left = e.clientX + 'px'
          trailRef.current.style.top = e.clientY + 'px'
        }
      }, 80)
    }
    window.addEventListener('mousemove', move)
    return () => window.removeEventListener('mousemove', move)
  }, [])

  return (
    <>
      <div ref={cursorRef} style={{
        position: 'fixed', pointerEvents: 'none', zIndex: 9999,
        transform: 'translate(-50%, -50%)',
        fontSize: 24, color: '#D4537E',
        transition: 'left 0.05s, top 0.05s',
        animation: 'destelloFijo 0.8s ease-in-out infinite',
      }}>✦</div>
      <div ref={trailRef} style={{
        position: 'fixed', pointerEvents: 'none', zIndex: 9998,
        transform: 'translate(-50%, -50%)',
        fontSize: 14, color: '#f5c842', opacity: 0.6,
        transition: 'left 0.15s, top 0.15s',
        animation: 'destelloFijo 1.2s ease-in-out infinite 0.3s',
      }}>✦</div>
    </>
  )
}