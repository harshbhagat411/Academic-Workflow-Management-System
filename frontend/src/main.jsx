import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { AuthProvider } from './context/AuthContext';
import { CustomThemeProvider } from './context/ThemeContext';
import './index.css';
import './bones/registry.js';
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <CustomThemeProvider>
        <App />
      </CustomThemeProvider>
    </AuthProvider>
  </StrictMode>,
)
