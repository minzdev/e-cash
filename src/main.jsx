import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'sonner'
import App from './App'
import { AuthProvider } from './context/AuthContext'
import { StoreProvider } from './context/StoreContext'
import './index.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <StoreProvider>
          <App />
          <Toaster
            position="top-center"
            richColors
            closeButton
            toastOptions={{ className: 'text-sm font-medium' }}
          />
        </StoreProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
