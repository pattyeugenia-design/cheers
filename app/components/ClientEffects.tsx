'use client'

import { useEffect, useRef } from 'react'

export default function ClientEffects() {
  const cursorRef = useRef<HTMLDivElement>(null)
  const trail1Ref = useRef<HTMLDivElement>(null)
  const trail2Ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const move = (e: MouseEvent) => {
      if (cursorRef.current) {
        cursorRef.current.style.left = e.clientX + 'px'
        cursorRef.current.style.top = e.clientY + 'px'
      }
      setTimeout(() => {
        if (trail1Ref.current) {
          trail1Ref.current.style.left = e.clientX + 'px'
          trail1Ref.current.style.top = e.clientY + 'px'
        }
      }, 60)
      setTimeout(() => {
        if (trail2Ref.current) {
          trail2Ref.current.style.left = e.clientX + 'px'
          trail2Ref.current.style.top = e.clientY + 'px'
        }
      }, 120)
    }
    window.addEventListener('mousemove', move)
    return () => window.removeEventListener('mousemove', move)
  }, [])

  return (
    <>
      <style>{`
        @keyframes spin {
          0% { transform: translate(-50%,-50%) rotate(0deg) scale(1); }
          50% { transform: translate(-50%,-50%) rotate(180deg) scale(1.3); }
          100% { transform: translate(-50%,-50%) rotate(360deg) scale(1); }
        }
        @keyframes trail1 {
          0% { transform: translate(-50%,-50%) rotate(0deg) scale(0.7); opacity: 0.7; }
          100% { transform: translate(-50%,-50%) rotate(360deg) scale(0.7); opacity: 0.7; }
        }
        @keyframes trail2 {
          0% { transform: translate(-50%,-50%) rotate(0deg) scale(0.4); opacity: 0.4; }
          100% { transform: translate(-50%,-50%) rotate(360deg) scale(0.4); opacity: 0.4; }
        }
      `}</style>

      {/* Cursor principal — grande, rosa, girando */}
      <div ref={cursorRef} style={{
        position: 'fixed', pointerEvents: 'none', zIndex: 9999,
        fontSize: 32, color: '#D4537E',
        textShadow: '0 0 12px #D4537E, 0 0 24px #f5c842',
        animation: 'spin 1.5s linear infinite',
        transition: 'left 0.04s ease-out, top 0.04s ease-out',
      }}>✦</div>

      {/* Trail 1 — dorado */}
      <div ref={trail1Ref} style={{
        position: 'fixed', pointerEvents: 'none', zIndex: 9998,
        fontSize: 22, color: '#f5c842',
        textShadow: '0 0 8px #f5c842',
        animation: 'trail1 1.5s linear infinite',
        transition: 'left 0.1s ease-out, top 0.1s ease-out',
      }}>✦</div>

      {/* Trail 2 — rosa claro */}
      <div ref={trail2Ref} style={{
        position: 'fixed', pointerEvents: 'none', zIndex: 9997,
        fontSize: 14, color: '#ED93B1',
        textShadow: '0 0 6px #ED93B1',
        animation: 'trail2 1.5s linear infinite',
        transition: 'left 0.16s ease-out, top 0.16s ease-out',
      }}>✦</div>
    </>
  )
}