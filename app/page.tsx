export default function Home() {
  return (
    <main style={{
      minHeight: '100vh',
      background: '#26215C',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'sans-serif',
      padding: '2rem',
    }}>
      <p style={{ fontSize: 64, margin: '0 0 16px' }}>🥂</p>
      <h1 style={{ color: '#EEEDFE', fontSize: 48, margin: '0 0 8px', fontWeight: 500 }}>
        Cheers
      </h1>
      <p style={{ color: '#AFA9EC', fontSize: 18, margin: '0 0 3rem' }}>
        Tu celebracion, a tu manera
      </p>

      
        href="/login"
        style={{
          display: 'block',
          padding: '1rem 2.5rem',
          background: '#7F77DD',
          borderRadius: 12,
          color: '#EEEDFE',
          fontSize: 16,
          fontWeight: 500,
          textDecoration: 'none',
          textAlign: 'center',
        }}
      >
        Crear mi celebracion
      </a>
    </main>
  )
}