import React, { useState, useEffect, useContext } from 'react';
import {
    Box, Typography, Card, CardContent, Grid, TextField, Button,
    Switch, FormControlLabel, Divider, Alert, CircularProgress, InputAdornment, IconButton,
    Select, MenuItem, FormControl, InputLabel
} from '@mui/material';
import { Lock, Bell, Palette, Settings as SettingsIcon, Eye, EyeOff } from 'lucide-react';
import axios from 'axios';
import Layout from '../components/Layout';
import { ThemeContext } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

const Settings = () => {
    const { themeMode, toggleThemeMode, colorMode, toggleColorMode } = useContext(ThemeContext);
    const role = localStorage.getItem('role');
    
    // State
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    
    // Password state
    const [passwords, setPasswords] = useState({ newPassword: '', confirmPassword: '' });
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [pwdMessage, setPwdMessage] = useState({ type: '', text: '' });
    
    // Notifications state
    const [notifyRequestUpdates, setNotifyRequestUpdates] = useState(
        localStorage.getItem('notifyRequestUpdates') !== 'false'
    );
    const [notifyMarksUpdates, setNotifyMarksUpdates] = useState(
        localStorage.getItem('notifyMarksUpdates') !== 'false'
    );
    
    // Admin state
    const [adminSettings, setAdminSettings] = useState({
        maxRequestDelay: localStorage.getItem('maxRequestDelay') || '3',
        autoMarkDelayed: localStorage.getItem('autoMarkDelayed') === 'true',
        emailOnRequestCreation: localStorage.getItem('emailOnRequestCreation') !== 'false',
        emailOnApprovalRejection: localStorage.getItem('emailOnApprovalRejection') !== 'false',
    });
    
    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const token = localStorage.getItem('token');
                if (token) {
                    const res = await axios.get('http://localhost:5000/api/users/me', {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    setUser(res.data);
                }
            } catch (err) {
                console.error('Failed to load user data', err);
            } finally {
                setLoading(false);
            }
        };
        fetchUserData();
    }, []);

    const handlePasswordChange = async (e) => {
        e.preventDefault();
        setPwdMessage({ type: '', text: '' });
        
        if (passwords.newPassword !== passwords.confirmPassword) {
            setPwdMessage({ type: 'error', text: 'Passwords do not match.' });
            return;
        }
        if (passwords.newPassword.length < 6) {
            setPwdMessage({ type: 'error', text: 'Password must be at least 6 characters.' });
            return;
        }
        
        try {
            const token = localStorage.getItem('token');
            // Reusing first-time-password as a generic password updater based on the prompt "reuse reset password API"
            await axios.post('http://localhost:5000/api/auth/first-time-password', 
                { newPassword: passwords.newPassword },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setPwdMessage({ type: 'success', text: 'Password successfully updated.' });
            setPasswords({ newPassword: '', confirmPassword: '' });
        } catch (err) {
            setPwdMessage({ type: 'error', text: err.response?.data?.message || 'Failed to update password.' });
        }
    };
    
    const handleNotificationChange = (field, value) => {
        if (field === 'requests') {
            setNotifyRequestUpdates(value);
            localStorage.setItem('notifyRequestUpdates', value);
        } else {
            setNotifyMarksUpdates(value);
            localStorage.setItem('notifyMarksUpdates', value);
        }
    };
    
    const handleAdminSettingChange = (field, value) => {
        setAdminSettings(prev => {
            const updated = { ...prev, [field]: value };
            localStorage.setItem(field, value);
            return updated;
        });
    };

    if (loading) {
        return (
            <Layout role={role}>
                <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
                    <CircularProgress />
                </Box>
            </Layout>
        );
    }

    return (
        <Layout role={role}>
            <Box sx={{ maxWidth: 1000, mx: 'auto', animation: 'fadeInUp 0.5s ease-out' }}>
                <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
                    <SettingsIcon size={32} color="#2196f3" />
                    <Box>
                        <Typography variant="h4" fontWeight="bold">Settings</Typography>
                        <Typography color="text.secondary">Manage your account preferences and system parameters</Typography>
                    </Box>
                </Box>
                
                <Grid container spacing={4}>
                    {/* Account Settings */}
                    <Grid item xs={12} md={6}>
                        <Card sx={{ borderRadius: 3, boxShadow: 3, height: '100%' }}>
                            <CardContent sx={{ p: 4 }}>
                                <Box display="flex" alignItems="center" gap={1.5} mb={3}>
                                    <Lock color="#f44336" />
                                    <Typography variant="h6" fontWeight="bold">Account Settings</Typography>
                                </Box>
                                <Divider sx={{ mb: 3 }} />
                                
                                <Box mb={3}>
                                    <Typography variant="body2" color="text.secondary" mb={1}>Email Address</Typography>
                                    <TextField 
                                        fullWidth 
                                        variant="outlined" 
                                        size="small"
                                        value={user?.email || 'N/A'}
                                        disabled
                                    />
                                </Box>
                                
                                <Typography variant="subtitle2" fontWeight="bold" mb={2}>Change Password</Typography>
                                
                                {pwdMessage.text && (
                                    <Alert severity={pwdMessage.type} sx={{ mb: 2 }}>{pwdMessage.text}</Alert>
                                )}
                                
                                <Box component="form" onSubmit={handlePasswordChange}>
                                    <TextField
                                        fullWidth
                                        size="small"
                                        type={showNewPassword ? 'text' : 'password'}
                                        label="New Password"
                                        value={passwords.newPassword}
                                        onChange={e => setPasswords({...passwords, newPassword: e.target.value})}
                                        sx={{ mb: 2 }}
                                        InputProps={{
                                            endAdornment: (
                                                <InputAdornment position="end">
                                                    <IconButton onClick={() => setShowNewPassword(!showNewPassword)} edge="end" size="small">
                                                        {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                                    </IconButton>
                                                </InputAdornment>
                                            )
                                        }}
                                    />
                                    <TextField
                                        fullWidth
                                        size="small"
                                        type={showConfirmPassword ? 'text' : 'password'}
                                        label="Confirm New Password"
                                        value={passwords.confirmPassword}
                                        onChange={e => setPasswords({...passwords, confirmPassword: e.target.value})}
                                        sx={{ mb: 3 }}
                                        InputProps={{
                                            endAdornment: (
                                                <InputAdornment position="end">
                                                    <IconButton onClick={() => setShowConfirmPassword(!showConfirmPassword)} edge="end" size="small">
                                                        {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                                    </IconButton>
                                                </InputAdornment>
                                            )
                                        }}
                                    />
                                    <Button type="submit" variant="contained" color="primary" fullWidth sx={{ fontWeight: 'bold' }}>
                                        Save Password
                                    </Button>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                    
                    {/* Preferences */}
                    <Grid item xs={12} md={6}>
                        <Grid container spacing={4} direction="column">
                            {/* Appearance */}
                            <Grid item>
                                <Card sx={{ borderRadius: 3, boxShadow: 3 }}>
                                    <CardContent sx={{ p: 4 }}>
                                        <Box display="flex" alignItems="center" gap={1.5} mb={3}>
                                            <Palette color="#9c27b0" />
                                            <Typography variant="h6" fontWeight="bold">Appearance Settings</Typography>
                                        </Box>
                                        <Divider sx={{ mb: 3 }} />
                                        
                                        <FormControl fullWidth size="small" sx={{ mb: 3 }}>
                                            <InputLabel>Theme Mode</InputLabel>
                                            <Select
                                                value={themeMode}
                                                label="Theme Mode"
                                                onChange={(e) => toggleThemeMode(e.target.value)}
                                            >
                                                <MenuItem value="default">Default Accent (Blue)</MenuItem>
                                                <MenuItem value="system">System Accent (Role-Based)</MenuItem>
                                            </Select>
                                        </FormControl>

                                        <FormControlLabel
                                            control={<Switch checked={colorMode === 'dark'} onChange={(e) => toggleColorMode(e.target.checked ? 'dark' : 'light')} color="secondary" />}
                                            label="Dark Mode"
                                            sx={{ display: 'flex', width: '100%' }}
                                        />
                                    </CardContent>
                                </Card>
                            </Grid>
                            
                            {/* Notifications */}
                            <Grid item>
                                <Card sx={{ borderRadius: 3, boxShadow: 3 }}>
                                    <CardContent sx={{ p: 4 }}>
                                        <Box display="flex" alignItems="center" gap={1.5} mb={3}>
                                            <Bell color="#ff9800" />
                                            <Typography variant="h6" fontWeight="bold">Notification Preferences</Typography>
                                        </Box>
                                        <Divider sx={{ mb: 2 }} />
                                        
                                        <FormControlLabel
                                            control={<Switch checked={notifyRequestUpdates} onChange={(e) => handleNotificationChange('requests', e.target.checked)} color="primary" />}
                                            label="Email on Request Updates"
                                            sx={{ display: 'flex', width: '100%', mb: 1 }}
                                        />
                                        <FormControlLabel
                                            control={<Switch checked={notifyMarksUpdates} onChange={(e) => handleNotificationChange('marks', e.target.checked)} color="primary" />}
                                            label="Email on Marks Updates"
                                            sx={{ display: 'flex', width: '100%' }}
                                        />
                                    </CardContent>
                                </Card>
                            </Grid>
                        </Grid>
                    </Grid>
                    
                    {/* Admin Area */}
                    {role === 'Admin' && (
                        <Grid item xs={12}>
                            <Card sx={{ borderRadius: 3, boxShadow: 3, border: '2px solid', borderColor: 'error.main' }}>
                                <CardContent sx={{ p: 4 }}>
                                    <Box display="flex" alignItems="center" gap={1.5} mb={3}>
                                        <SettingsIcon color="#f44336" />
                                        <Typography variant="h6" fontWeight="bold" color="error.main">Admin Controls (Global Settings)</Typography>
                                    </Box>
                                    <Divider sx={{ mb: 3 }} />
                                    
                                    <Grid container spacing={4}>
                                        <Grid item xs={12} md={6}>
                                            <Typography variant="subtitle2" fontWeight="bold" mb={2}>System Rules</Typography>
                                            <Box display="flex" flexDirection="column" gap={2}>
                                                <TextField 
                                                    label="Max Request Delay (Days)"
                                                    type="number"
                                                    size="small"
                                                    value={adminSettings.maxRequestDelay}
                                                    onChange={(e) => handleAdminSettingChange('maxRequestDelay', e.target.value)}
                                                    fullWidth
                                                />
                                                <FormControlLabel
                                                    control={<Switch checked={adminSettings.autoMarkDelayed} onChange={(e) => handleAdminSettingChange('autoMarkDelayed', e.target.checked)} color="error" />}
                                                    label="Auto-Mark Delayed Requests"
                                                />
                                            </Box>
                                        </Grid>
                                        <Grid item xs={12} md={6}>
                                            <Typography variant="subtitle2" fontWeight="bold" mb={2}>Admin Notification Rules</Typography>
                                            <Box display="flex" flexDirection="column" gap={1}>
                                                <FormControlLabel
                                                    control={<Switch checked={adminSettings.emailOnRequestCreation} onChange={(e) => handleAdminSettingChange('emailOnRequestCreation', e.target.checked)} color="error" />}
                                                    label="Send Email on General Request Creation"
                                                />
                                                <FormControlLabel
                                                    control={<Switch checked={adminSettings.emailOnApprovalRejection} onChange={(e) => handleAdminSettingChange('emailOnApprovalRejection', e.target.checked)} color="error" />}
                                                    label="Send Email on Approval/Rejection"
                                                />
                                            </Box>
                                        </Grid>
                                    </Grid>
                                </CardContent>
                            </Card>
                        </Grid>
                    )}
                </Grid>
            </Box>
        </Layout>
    );
};

export default Settings;
