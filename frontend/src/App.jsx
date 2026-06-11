import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './lib/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import GamesPage from './pages/GamesPage'
import ProfilePage from './pages/ProfilePage'
import GameProfilesPage from './pages/GameProfilesPage'
import CreateGameProfilePage from './pages/CreateGameProfilePage'
import EditGameProfilePage from './pages/EditGameProfilePage'
import SearchesPage from './pages/SearchesPage'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Rutas públicas */}
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/games" element={<GamesPage />} />
          <Route path="/searches" element={<SearchesPage />} />

          {/* Rutas protegidas */}
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile/game-profiles"
            element={
              <ProtectedRoute>
                <GameProfilesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile/game-profiles/new"
            element={
              <ProtectedRoute>
                <CreateGameProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile/game-profiles/:slug/edit"
            element={
              <ProtectedRoute>
                <EditGameProfilePage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App