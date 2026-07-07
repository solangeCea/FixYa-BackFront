import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { installAuthInterceptor } from './services/httpInterceptor'

// Cierra la sesión y redirige a login si el token expira a mitad de sesión.
installAuthInterceptor()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
