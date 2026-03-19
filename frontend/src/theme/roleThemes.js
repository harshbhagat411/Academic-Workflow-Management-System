import { createTheme } from '@mui/material/styles';

const commonSettings = {
  palette: {
    mode: 'dark',
    background: {
      default: '#121212',
      paper: '#1e1e1e',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h4: { fontWeight: 600 },
    h6: { fontWeight: 600 },
  },
  shape: {
    borderRadius: 8,
  },
};

export const adminTheme = createTheme({
  ...commonSettings,
  palette: {
    ...commonSettings.palette,
    primary: {
      main: '#6366F1', // Indigo
    },
    secondary: {
      main: '#4F46E5', // Indigo Dark
    },
  },
});

export const facultyTheme = createTheme({
  ...commonSettings,
  palette: {
    ...commonSettings.palette,
    primary: {
      main: '#3B82F6', // Blue
    },
    secondary: {
      main: '#0EA5E9', // Light Blue
    },
  },
});

export const studentTheme = createTheme({
  ...commonSettings,
  palette: {
    ...commonSettings.palette,
    primary: {
      main: '#14B8A6', // Teal
    },
    secondary: {
      main: '#0D9488', // Teal Dark
    },
  },
});

export const defaultTheme = createTheme({
  ...commonSettings,
  palette: {
    ...commonSettings.palette,
    primary: {
      main: '#2196f3', // Default Blue
    },
    secondary: {
      main: '#9c27b0', // Default Purple
    },
  },
});
