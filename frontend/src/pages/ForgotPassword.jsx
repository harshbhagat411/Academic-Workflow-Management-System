import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
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

const ForgotPassword = () => {
    const [step, setStep] = useState(1);
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    
    const navigate = useNavigate();

    const handleRequestOtp = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        if (!email) return setError('Please enter your registered email.');

        setLoading(true);
        try {
            const res = await axios.post('http://localhost:5000/api/auth/forgot-password-request', { email });
            setSuccess(res.data.message || 'OTP sent to your email.');
            setStep(2);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to request OTP. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!otp) return setError('Please enter the OTP.');
        if (newPassword.length < 6) return setError('Password must be at least 6 characters long.');
        if (newPassword !== confirmPassword) return setError('Passwords do not match.');

        setLoading(true);
        try {
            const res = await axios.post('http://localhost:5000/api/auth/reset-password', {
                email,
                otp,
                newPassword
            });
            setSuccess(res.data.message || 'Password reset successfully.');
            setStep(3);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to reset password. Check OTP and try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container component="main" maxWidth="xs" sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Paper elevation={6} sx={{ p: 4, width: '100%', borderRadius: 3, bgcolor: 'background.paper' }}>
                <Typography component="h1" variant="h5" align="center" color="text.primary" sx={{ fontWeight: 'bold', mb: 1 }}>
                    Forgot Password
                </Typography>
                <Typography variant="body2" align="center" color="text.secondary" sx={{ mb: 3 }}>
                    EduFlow OS
                </Typography>

                {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
                {success && step !== 3 && <Alert severity="success" sx={{ mb: 3 }}>{success}</Alert>}

                {step === 1 && (
                    <Box component="form" onSubmit={handleRequestOtp} noValidate>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            Enter your registered email address to receive a secure 6-digit verification code.
                        </Typography>
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            id="email"
                            label="Registered Email Address"
                            name="email"
                            autoComplete="email"
                            autoFocus
                            placeholder="e.g. example@xyz.edu"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            sx={{ mb: 3 }}
                        />
                        <Button
                            type="submit"
                            fullWidth
                            variant="contained"
                            size="large"
                            disabled={loading}
                            sx={{ mb: 2, py: 1.5, fontWeight: 'bold' }}
                        >
                            {loading ? 'Sending OTP...' : 'Send OTP'}
                        </Button>
                        <Box sx={{ textAlign: 'center' }}>
                            <Typography 
                                variant="body2" 
                                color="primary" 
                                sx={{ cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
                                onClick={() => navigate('/login')}
                            >
                                Back to Login
                            </Typography>
                        </Box>
                    </Box>
                )}

                {step === 2 && (
                    <Box component="form" onSubmit={handleResetPassword} noValidate>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            We sent a verification code to <strong>{email}</strong>. Please enter it below along with your new password.
                        </Typography>
                        
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            id="otp"
                            label="Verification Code (OTP)"
                            name="otp"
                            placeholder="Enter 6-digit OTP"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value)}
                            inputProps={{ maxLength: 6 }}
                        />

                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            name="newPassword"
                            label="New Password"
                            type={showPassword ? 'text' : 'password'}
                            id="newPassword"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            InputProps={{
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton
                                            onClick={() => setShowPassword(!showPassword)}
                                            edge="end"
                                            size="small"
                                        >
                                            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
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
                            label="Confirm New Password"
                            type="password"
                            id="confirmPassword"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            sx={{ mb: 3 }}
                        />

                        <Button
                            type="submit"
                            fullWidth
                            variant="contained"
                            size="large"
                            disabled={loading}
                            sx={{ mb: 2, py: 1.5, fontWeight: 'bold' }}
                        >
                            {loading ? 'Resetting...' : 'Reset Password'}
                        </Button>
                        <Box sx={{ textAlign: 'center' }}>
                            <Typography 
                                variant="body2" 
                                color="primary" 
                                sx={{ cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
                                onClick={() => setStep(1)}
                            >
                                Re-enter Email
                            </Typography>
                        </Box>
                    </Box>
                )}

                {step === 3 && (
                    <Box sx={{ textAlign: 'center' }}>
                        <Alert severity="success" sx={{ mb: 3, textAlign: 'left' }}>
                            Password reset successfully. Please login with your new password.
                        </Alert>
                        <Button
                            fullWidth
                            variant="contained"
                            size="large"
                            onClick={() => navigate('/login')}
                            sx={{ py: 1.5, fontWeight: 'bold' }}
                        >
                            Go to Login
                        </Button>
                    </Box>
                )}
            </Paper>
        </Container>
    );
};

export default ForgotPassword;
