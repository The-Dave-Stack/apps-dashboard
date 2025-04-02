function App() {
  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh', 
      background: '#f0f9ff' 
    }}>
      <div style={{
        padding: '2rem',
        background: 'white',
        borderRadius: '0.5rem',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        textAlign: 'center'
      }}>
        <h1 style={{ 
          fontSize: '2rem', 
          fontWeight: 'bold', 
          color: '#2563eb',
          marginBottom: '1rem' 
        }}>Hello World!</h1>
        <p style={{ color: '#4b5563' }}>This is a basic test page</p>
        <button 
          style={{
            marginTop: '1rem',
            padding: '0.5rem 1rem',
            background: '#2563eb',
            color: 'white',
            border: 'none',
            borderRadius: '0.25rem',
            cursor: 'pointer'
          }}
          onClick={() => alert('Button clicked!')}
        >
          Click Me
        </button>
      </div>
    </div>
  );
}

export default App;
