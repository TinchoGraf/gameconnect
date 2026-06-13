import axios from 'axios'

/**
 * Cliente HTTP configurado para hablar con el backend de GameConnect.
 *
 * La baseURL se lee desde la variable de entorno VITE_API_URL.
 * - En local: viene del archivo frontend/.env.local (por ejemplo http://localhost:8000)
 * - En producción: viene de la config de Vercel apuntando al backend de Render
 *
 * Si no hay variable seteada, usamos localhost:8000 como fallback razonable
 * (útil cuando recién clonás el proyecto y no creaste el .env todavía).
 */
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Interceptor: si tenemos un token guardado en localStorage,
// lo agregamos automáticamente al header Authorization en cada request.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('gameconnect_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})