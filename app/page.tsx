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
    }}>
      <p style={{ fontSize: 64, margin: 0 }}>🥂</p>
      <h1 style={{ color: '#EEEDFE', fontSize: 48, margin: '16px 0 8px', fontWeight: 500 }}>
        Cheers
      </h1>
      <p style={{ color: '#AFA9EC', fontSize: 18, margin: 0 }}>
        Tu celebración, a tu manera
      </p>
    </main>
  )
}