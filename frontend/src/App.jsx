import { BrowserRouter, Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import GamesPage from './pages/GamesPage'

/**
 * Componente raíz de la app.
 *
 * Acá definimos todas las rutas posibles y a qué componente le toca cada URL.
 *
 * - <BrowserRouter> activa el sistema de rutas en toda la app.
 * - <Routes> es el contenedor donde declaramos las rutas.
 * - <Route path="..." element={...} /> dice "cuando la URL sea X, mostrá Y".
 */
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/games" element={<GamesPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App