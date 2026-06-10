import axios from 'axios'

/**
 * Cliente HTTP configurado para hablar con el backend de GameConnect.
 *
 * Lo importamos en cualquier componente que necesite hacer requests:
 *   import { api } from '../lib/api'
 *   const response = await api.get('/games')
 *
 * Por ahora la baseURL apunta a localhost. Cuando deployemos
 * el backend a producción, vamos a leer esta URL desde una variable
 * de entorno (VITE_API_URL) que cambia según el ambiente.
 */
const API_BASE_URL = 'http://localhost:8000'

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Interceptor: si tenemos un token guardado en localStorage,
// lo agregamos automáticamente al header Authorization en cada request.
// Esto va a ser clave cuando implementemos login.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('gameconnect_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})