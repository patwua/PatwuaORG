import React from 'react'
import ReactDOM from 'react-dom/client'
import './styles/globals.css'
import App from './App'
import { AuthProvider } from './context/AuthContext'
import { PersonaProvider } from './context/PersonaContext'
import { BrowserRouter } from 'react-router-dom'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <PersonaProvider>
          <App />
        </PersonaProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
)

