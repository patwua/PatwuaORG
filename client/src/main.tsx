import React from 'react'
import ReactDOM from 'react-dom/client'
import './styles/globals.css'
import App from './App'
import { AuthProvider } from './context/AuthContext'
import { PersonaProvider } from './context/PersonaContext'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      <PersonaProvider>
        <App />
      </PersonaProvider>
    </AuthProvider>
  </React.StrictMode>
)

