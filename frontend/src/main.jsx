import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ThemeProvider, CssBaseline } from '@mui/material';
import { adminTheme, facultyTheme, studentTheme, defaultTheme } from './theme/roleThemes';
import { AuthProvider } from './context/AuthContext';
import './index.css'
import App from './App.jsx'

const role = localStorage.getItem("role");
let selectedTheme = defaultTheme;
if (role === 'Admin') selectedTheme = adminTheme;
else if (role === 'Faculty') selectedTheme = facultyTheme;
else if (role === 'Student') selectedTheme = studentTheme;

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <ThemeProvider theme={selectedTheme}>
        <CssBaseline />
        <App />
      </ThemeProvider>
    </AuthProvider>
  </StrictMode>,
)
