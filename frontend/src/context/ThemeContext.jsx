import React, { createContext, useState, useMemo, useEffect } from 'react';
import { ThemeProvider as MuiThemeProvider, CssBaseline, createTheme } from '@mui/material';
import { adminTheme, facultyTheme, studentTheme, defaultTheme } from '../theme/roleThemes';
import axios from 'axios';

export const ThemeContext = createContext();

export const CustomThemeProvider = ({ children }) => {
    // Read theme mode, default to 'system'
    const storedThemeMode = localStorage.getItem('themeMode') || 'system';
    const [themeMode, setThemeMode] = useState(storedThemeMode);

    // Read color mode (dark/light), default 'light' on login screen
    const storedColorMode = localStorage.getItem('colorMode') || 'dark';
    const [colorMode, setColorMode] = useState(storedColorMode);

    // App Settings State
    const [settings, setSettings] = useState({
        emailNotifications: localStorage.getItem('emailNotifications') !== 'false',
        marksNotifications: localStorage.getItem('marksNotifications') !== 'false'
    });
    
    // Loading state to prevent flicker
    const [isSettingsLoading, setIsSettingsLoading] = useState(true);

    // Fetch settings on mount or token change
    useEffect(() => {
        const fetchSettings = async () => {
            const token = localStorage.getItem('token');
            if (!token) {
                setIsSettingsLoading(false);
                return;
            }
            try {
                const res = await axios.get('http://localhost:5000/api/settings', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const fetchedSettings = res.data;
                
                // Update state
                setThemeMode(fetchedSettings.themeMode);
                setColorMode(fetchedSettings.colorMode || 'dark');
                setSettings({
                    emailNotifications: fetchedSettings.emailNotifications,
                    marksNotifications: fetchedSettings.marksNotifications
                });
                
                // Cache locally
                localStorage.setItem('themeMode', fetchedSettings.themeMode);
                localStorage.setItem('colorMode', fetchedSettings.colorMode || 'dark');
                localStorage.setItem('emailNotifications', fetchedSettings.emailNotifications);
                localStorage.setItem('marksNotifications', fetchedSettings.marksNotifications);
                
            } catch (error) {
                console.error('Failed to fetch user settings:', error);
                // On fail, state naturally falls back to localStorage/defaults we initialized with
            } finally {
                setIsSettingsLoading(false);
            }
        };

        fetchSettings();
    }, []);

    const updateSettingsApi = async (updates) => {
        try {
            const token = localStorage.getItem('token');
            if (token) {
                await axios.patch('http://localhost:5000/api/settings', updates, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            }
        } catch (error) {
            console.error('Failed to update user settings:', error);
        }
    };

    const toggleThemeMode = (mode) => {
        setThemeMode(mode);
        localStorage.setItem('themeMode', mode);
        updateSettingsApi({ themeMode: mode });
    };

    const toggleColorMode = (mode) => {
        setColorMode(mode);
        localStorage.setItem('colorMode', mode);
        updateSettingsApi({ colorMode: mode });
    };
    
    const updateNotifications = (field, value) => {
        setSettings(prev => ({ ...prev, [field]: value }));
        localStorage.setItem(field, value);
        updateSettingsApi({ [field]: value });
    };

    const theme = useMemo(() => {
        let baseTheme = defaultTheme;
        const token = localStorage.getItem('token');
        
        // If no user is logged in, explicitly force the default blue (faculty) theme
        if (!token) {
            baseTheme = facultyTheme;
        } 
        else if (themeMode === 'default') {
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

    // Don't render descendants until settings load to avoid a flash of the wrong theme
    // We render a blank or very simple loader, or just null since it's very fast
    if (isSettingsLoading) {
        return null; 
    }

    return (
        <ThemeContext.Provider value={{ 
            themeMode, toggleThemeMode, 
            colorMode, toggleColorMode,
            settings, updateNotifications 
        }}>
            <MuiThemeProvider theme={theme}>
                <CssBaseline />
                {children}
            </MuiThemeProvider>
        </ThemeContext.Provider>
    );
};
