import React, { createContext, useState, useMemo } from 'react';
import { ThemeProvider as MuiThemeProvider, CssBaseline, createTheme } from '@mui/material';
import { adminTheme, facultyTheme, studentTheme, defaultTheme } from '../theme/roleThemes';

export const ThemeContext = createContext();

export const CustomThemeProvider = ({ children }) => {
    // Read theme mode, default to 'system'
    const storedThemeMode = localStorage.getItem('themeMode') || 'system';
    const [themeMode, setThemeMode] = useState(storedThemeMode);

    // Read color mode (dark/light), default 'dark' to match legacy dashboard
    const storedColorMode = localStorage.getItem('colorMode') || 'dark';
    const [colorMode, setColorMode] = useState(storedColorMode);

    const toggleThemeMode = (mode) => {
        setThemeMode(mode);
        localStorage.setItem('themeMode', mode);
    };

    const toggleColorMode = (mode) => {
        setColorMode(mode);
        localStorage.setItem('colorMode', mode);
    };

    const theme = useMemo(() => {
        let baseTheme = defaultTheme;
        
        if (themeMode === 'default') {
            baseTheme = facultyTheme; // "Default Accent" uses facultyTheme (blue)
        } else {
            // "System Accent" uses role-based themes
            const role = localStorage.getItem('role');
            if (role === 'Admin') baseTheme = adminTheme;
            else if (role === 'Faculty') baseTheme = facultyTheme;
            else if (role === 'Student') baseTheme = studentTheme;
        }

        // Dynamically rebuild the theme to force MUI to generate correct text colors for the mode
        return createTheme({
            palette: {
                mode: colorMode,
                primary: { main: baseTheme.palette.primary.main },
                secondary: { main: baseTheme.palette.secondary.main },
                background: colorMode === 'dark' ? {
                    default: '#121212',
                    paper: '#1e1e1e',
                } : {
                    default: '#f5f7fa',
                    paper: '#ffffff',
                }
            },
            typography: {
                fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
                h4: { fontWeight: 600 },
                h6: { fontWeight: 600 },
            },
            shape: { borderRadius: 8 }
        });
    }, [themeMode, colorMode]); // recomputes when themeMode or colorMode changes

    return (
        <ThemeContext.Provider value={{ themeMode, toggleThemeMode, colorMode, toggleColorMode }}>
            <MuiThemeProvider theme={theme}>
                <CssBaseline />
                {children}
            </MuiThemeProvider>
        </ThemeContext.Provider>
    );
};
