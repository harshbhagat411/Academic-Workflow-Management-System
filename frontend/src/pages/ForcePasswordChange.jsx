import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Lock, Eye, EyeOff } from 'lucide-react';
import {
    Box,
    Button,
    Container,
    IconButton,
    InputAdornment,
    Paper,
    TextField,
    Typography,
    Alert
} from '@mui/material';

const ForcePasswordChange = () => {
    const [passwords, setPasswords] = useState({ newPassword: '', confirmPassword: '' });
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (passwords.newPassword !== passwords.confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (passwords.newPassword.length < 6) {
            setError('Password must be at least 6 characters long');
            return;
        }

        try {
            const token = localStorage.getItem('token');
            // Re-authenticate using the token received from login
            await axios.post('http://localhost:5000/api/auth/first-time-password',
                { newPassword: passwords.newPassword },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setSuccess('Password updated successfully! Redirecting...');

            // Redirect based on role
            const role = localStorage.getItem('role');
            setTimeout(() => {
                if (role === 'Admin') navigate('/admin/dashboard');
                else if (role === 'Student') navigate('/student/dashboard');
                else if (role === 'Faculty') navigate('/faculty/dashboard');
                else navigate('/login');
            }, 2000);

        } catch (err) {
            setError(err.response?.data?.message || 'Failed to update password');
        }
    };

    return (
        <Container component="main" maxWidth="xs" sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Paper elevation={6} sx={{ p: 4, width: '100%', borderRadius: 3, bgcolor: 'background.paper' }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
                    <Box sx={{ 
                        display: 'inline-flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        width: 64, 
                        height: 64, 
                        borderRadius: '50%', 
                        bgcolor: 'primary.light', 
                        color: 'primary.contrastText', 
                        mb: 2 
                    }}>
                        <Lock size={32} />
                    </Box>
                    <Typography component="h1" variant="h5" color="text.primary" sx={{ fontWeight: 'bold' }}>
                        Security Update Required
                    </Typography>
                    <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 1 }}>
                        For your security, you must change your temporary password before proceeding.
                    </Typography>
                </Box>

                {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
                {success && <Alert severity="success" sx={{ mb: 3 }}>{success}</Alert>}

                <Box component="form" onSubmit={handleSubmit} noValidate>
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        name="newPassword"
                        label="New Password"
                        type={showNewPassword ? 'text' : 'password'}
                        id="newPassword"
                        placeholder="Min 6 chars"
                        value={passwords.newPassword}
                        onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                        InputProps={{
                            endAdornment: (
                                <InputAdornment position="end">
                                    <IconButton
                                        onClick={() => setShowNewPassword(!showNewPassword)}
                                        edge="end"
                                        size="small"
                                    >
                                        {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                    </IconButton>
                                </InputAdornment>
                            )
                        }}
                    />

                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        name="confirmPassword"
                        label="Confirm Password"
                        type={showConfirmPassword ? 'text' : 'password'}
                        id="confirmPassword"
                        placeholder="Confirm new password"
                        value={passwords.confirmPassword}
                        onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
                        sx={{ mb: 3 }}
                        InputProps={{
                            endAdornment: (
                                <InputAdornment position="end">
                                    <IconButton
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        edge="end"
                                        size="small"
                                    >
                                        {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                    </IconButton>
                                </InputAdornment>
                            )
                        }}
                    />

                    <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        size="large"
                        sx={{ py: 1.5, fontWeight: 'bold' }}
                    >
                        Set New Password
                    </Button>
                </Box>
            </Paper>
        </Container>
    );
};

export default ForcePasswordChange;
