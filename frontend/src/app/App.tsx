import { BrowserRouter, Routes, Route } from 'react-router-dom';

function HomePage() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#f0f2f5' }}>
      <div style={{ textAlign: 'center' }}>
        <h1 style={{ color: '#004B87', fontSize: 28, marginBottom: 8 }}>UNAH Conecta Pumas</h1>
        <p style={{ color: '#666' }}>Proyecto limpio — listo para desarrollar</p>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
      </Routes>
    </BrowserRouter>
  );
}
