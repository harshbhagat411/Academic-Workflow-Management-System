import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
    Box, Typography, Card, Avatar, TextField, 
    Button, Chip, Grid, CircularProgress, IconButton, Alert
} from '@mui/material';
import { User, Phone, Mail, Hash, Calendar, Save, X } from 'lucide-react';
import SecuritySection from './SecuritySection';

const ProfileSection = () => {
    const [user, setUser] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({ phone: '' });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get('http://localhost:5000/api/users/me', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setUser(res.data);
            setFormData({ phone: res.data.phone });
        } catch (err) {
            console.error('Failed to fetch profile', err);
        }
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            await axios.patch('http://localhost:5000/api/users/me',
                { phone: formData.phone },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setMessage('Profile updated successfully!');
            setIsEditing(false);
            fetchProfile(); // Refresh
            setTimeout(() => setMessage(''), 3000);
        } catch (err) {
            console.error('Update failed', err);
            setMessage('Failed to update profile.');
        } finally {
            setLoading(false);
        }
    };

    if (!user) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4, animation: 'fadeInUp 0.5s ease-out' }}>
            {/* 1. Identity & Info Card */}
            <Card sx={{ borderRadius: 3, boxShadow: 2, overflow: 'hidden' }}>
                <Box sx={{ bgcolor: 'primary.main', p: { xs: 3, sm: 4 }, color: 'primary.contrastText' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, flexWrap: 'wrap' }}>
                        <Avatar sx={{ width: 80, height: 80, bgcolor: 'primary.light', color: 'primary.dark' }}>
                            <User size={40} />
                        </Avatar>
                        <Box sx={{ flex: 1, minWidth: 200 }}>
                            <Typography variant="h4" fontWeight="bold" gutterBottom>{user.name}</Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography variant="body2" sx={{ opacity: 0.9 }}>Login ID:</Typography>
                                <Typography variant="body2" sx={{ fontFamily: 'monospace', bgcolor: 'rgba(255,255,255,0.2)', px: 1, py: 0.5, borderRadius: 1 }}>
                                    {user.loginId}
                                </Typography>
                            </Box>
                        </Box>
                        <Box sx={{ textAlign: { xs: 'left', sm: 'right' }, mt: { xs: 2, sm: 0 } }}>
                            <Chip 
                                label={user.role} 
                                sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', fontWeight: 'bold', mb: 1, backdropFilter: 'blur(4px)' }} 
                            />
                            <Typography variant="body2" sx={{ opacity: 0.9 }}>{user.department}</Typography>
                        </Box>
                    </Box>
                </Box>

                <Box sx={{ p: { xs: 3, sm: 4 } }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                        <Typography variant="h6" fontWeight="bold">Personal Details</Typography>
                        {!isEditing && (
                            <Button 
                                onClick={() => setIsEditing(true)} 
                                color="primary"
                                sx={{ fontWeight: 'bold' }}
                            >
                                Edit Details
                            </Button>
                        )}
                    </Box>

                    {message && (
                        <Alert severity={message.includes('success') ? 'success' : 'error'} sx={{ mb: 3 }}>
                            {message}
                        </Alert>
                    )}

                    <Grid container spacing={4}>
                        <Grid item xs={12} md={6}>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                                <Box>
                                    <Typography variant="caption" color="text.secondary" fontWeight="bold" textTransform="uppercase">
                                        Email Address
                                    </Typography>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mt: 0.5 }}>
                                        <Mail size={18} className="text-gray-400" />
                                        <Typography variant="body1">{user.email}</Typography>
                                    </Box>
                                </Box>

                                {user.role === 'Student' && (
                                    <Box>
                                        <Typography variant="caption" color="text.secondary" fontWeight="bold" textTransform="uppercase">
                                            Current Semester
                                        </Typography>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mt: 0.5 }}>
                                            <Calendar size={18} className="text-gray-400" />
                                            <Typography variant="body1">Semester {user.semester}</Typography>
                                        </Box>
                                    </Box>
                                )}

                                <Box>
                                    <Typography variant="caption" color="text.secondary" fontWeight="bold" textTransform="uppercase">
                                        User ID (System)
                                    </Typography>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mt: 0.5 }}>
                                        <Hash size={18} className="text-gray-400" />
                                        <Typography variant="body1">{user.userId}</Typography>
                                    </Box>
                                </Box>
                            </Box>
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                                <Box>
                                    <Typography variant="caption" color="text.secondary" fontWeight="bold" textTransform="uppercase">
                                        Phone Number
                                    </Typography>
                                    {isEditing ? (
                                        <Box component="form" onSubmit={handleUpdate} sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                                            <TextField
                                                size="small"
                                                variant="standard"
                                                value={formData.phone}
                                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                                autoFocus
                                                sx={{ flex: 1 }}
                                            />
                                            <IconButton type="submit" color="success" disabled={loading} size="small">
                                                <Save size={20} />
                                            </IconButton>
                                            <IconButton type="button" color="error" onClick={() => setIsEditing(false)} size="small">
                                                <X size={20} />
                                            </IconButton>
                                        </Box>
                                    ) : (
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mt: 0.5 }}>
                                            <Phone size={18} className="text-gray-400" />
                                            <Typography variant="body1">{user.phone}</Typography>
                                        </Box>
                                    )}
                                </Box>

                                <Box>
                                    <Typography variant="caption" color="text.secondary" fontWeight="bold" textTransform="uppercase">
                                        Account Status
                                    </Typography>
                                    <Box sx={{ mt: 1 }}>
                                        <Chip 
                                            label={user.status} 
                                            color={user.status === 'Active' ? 'success' : 'error'} 
                                            size="small"
                                            sx={{ fontWeight: 'bold' }} 
                                        />
                                    </Box>
                                </Box>
                            </Box>
                        </Grid>
                    </Grid>
                </Box>
            </Card>

            {/* 2. Security Section */}
            <SecuritySection />
        </Box>
    );
};

export default ProfileSection;
