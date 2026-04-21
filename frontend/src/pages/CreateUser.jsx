import { useState, useEffect } from 'react';
import axios from 'axios';
import {
    Box, Card, CardContent, Typography, TextField, MenuItem, Button as MuiButton, Alert, Grid
} from '@mui/material';
import Layout from '../components/Layout';

const CreateUser = () => {
    const [formData, setFormData] = useState({
        name: '', email: '', phone: '', gender: 'Male',
        role: 'Student', semester: '1', specialization: ''
    });
    const [generatedId, setGeneratedId] = useState('');
    const [message, setMessage] = useState('');
    const [isError, setIsError] = useState(false);

    useEffect(() => {
        const fetchNextId = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) return;
                const res = await axios.get(`http://localhost:5000/api/users/next-id?role=${formData.role}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setGeneratedId(res.data.nextId);
            } catch (error) {
                console.error('Error fetching next ID', error);
            }
        };
        fetchNextId();
    }, [formData.role]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => {
            const newState = { ...prev, [name]: value };
            if (name === 'role' && value === 'Faculty') newState.semester = '';
            if (name === 'role' && value === 'Student') {
                newState.semester = '1';
                newState.specialization = '';
            }
            return newState;
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setIsError(false);
        
        // Frontend Validations
        const nameRegex = /^[a-zA-Z\s]+$/;
        if (!nameRegex.test(formData.name) || formData.name.length > 100) {
            setMessage('Full name can only contain letters and spaces.');
            setIsError(true);
            return;
        }

        const phoneRegex = /^\d{10}$/;
        if (!phoneRegex.test(formData.phone)) {
            if (/[^0-9]/.test(formData.phone)) {
                setMessage('Phone number can only contain numbers.');
            } else {
                setMessage('Phone number must be exactly 10 digits.');
            }
            setIsError(true);
            return;
        }

        try {
            const payload = { ...formData };
            if (payload.role === 'Faculty') delete payload.semester;
            if (payload.role === 'Student') delete payload.specialization;

            const token = localStorage.getItem('token');
            const res = await axios.post('http://localhost:5000/api/users/create', payload, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            setMessage(`User Created! Login ID: ${res.data.user.loginId}`);
            setIsError(false);
            setFormData({
                name: '', email: '', phone: '', gender: 'Male',
                role: 'Student', semester: '1', specialization: ''
            });

            const idRes = await axios.get(`http://localhost:5000/api/users/next-id?role=Student`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setGeneratedId(idRes.data.nextId);
        } catch (error) {
            setIsError(true);
            if (!error.response) {
                setMessage('Server connection failed. Please check if the backend server is running.');
            } else if (error.response?.data?.message === 'Email already registered') {
                setMessage('This email is already registered.');
            } else {
                setMessage(error.response?.data?.message || 'Unable to create user due to a server error. Please try again later.');
            }
        }
    };

    return (
        <Layout role="Admin">
            <Box sx={{ p: { xs: 2, md: 4 }, minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'flex-start', pt: { xs: 4, md: 8 } }}>
                <Card sx={{ maxWidth: 600, w: '100%', width: '100%', borderRadius: 3, boxShadow: 4, animation: 'fadeInUp 0.5s ease-out' }}>
                <CardContent sx={{ p: { xs: 3, md: 5 } }}>
                    <Typography variant="h5" fontWeight="bold" align="center" mb={3} color="primary.main">
                        Create New User
                    </Typography>

                    {message && (
                        <Alert severity={isError ? 'error' : 'success'} sx={{ mb: 3 }}>
                            {message}
                        </Alert>
                    )}
                    
                    <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                        <Grid container spacing={2}>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <TextField
                                    label="Full Name"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    required
                                    fullWidth
                                />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <TextField
                                    label="Phone"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    required
                                    fullWidth
                                />
                            </Grid>
                        </Grid>

                        <TextField
                            label="Email Address"
                            name="email"
                            type="email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                            fullWidth
                        />
                        
                        <TextField
                            label="Login ID (Auto-Generated)"
                            value={generatedId || 'Calculating...'}
                            disabled
                            fullWidth
                            sx={{
                                '& .MuiInputBase-input.Mui-disabled': {
                                    WebkitTextFillColor: '#f59e0b',
                                },
                            }}
                        />

                        <Grid container spacing={2}>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <TextField
                                    select
                                    label="Gender"
                                    name="gender"
                                    value={formData.gender}
                                    onChange={handleChange}
                                    fullWidth
                                >
                                    <MenuItem value="Male">Male</MenuItem>
                                    <MenuItem value="Female">Female</MenuItem>
                                    <MenuItem value="Other">Other</MenuItem>
                                </TextField>
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <TextField
                                    select
                                    label="Role"
                                    name="role"
                                    value={formData.role}
                                    onChange={handleChange}
                                    fullWidth
                                >
                                    <MenuItem value="Student">Student</MenuItem>
                                    <MenuItem value="Faculty">Faculty</MenuItem>
                                </TextField>
                            </Grid>
                        </Grid>

                        {formData.role === 'Student' && (
                            <TextField
                                select
                                label="Semester"
                                name="semester"
                                value={formData.semester || '1'}
                                onChange={handleChange}
                                required
                                fullWidth
                            >
                                {[...Array(10)].map((_, i) => (
                                    <MenuItem key={i+1} value={(i+1).toString()}>Semester {i+1}</MenuItem>
                                ))}
                            </TextField>
                        )}

                        {formData.role === 'Faculty' && (
                            <TextField
                                select
                                label="Specialization"
                                name="specialization"
                                value={formData.specialization || ''}
                                onChange={handleChange}
                                required
                                fullWidth
                            >
                                <MenuItem value="" disabled>Select Specialization</MenuItem>
                                <MenuItem value="Programming">Programming</MenuItem>
                                <MenuItem value="Database">Database</MenuItem>
                                <MenuItem value="Networks">Networks</MenuItem>
                                <MenuItem value="Artificial Intelligence">Artificial Intelligence</MenuItem>
                                <MenuItem value="Web Development">Web Development</MenuItem>
                            </TextField>
                        )}

                        <Alert severity="info" sx={{ mt: 1 }}>
                            <strong>Note:</strong> Password will be automatically generated and sent to the user's email.
                        </Alert>

                        <MuiButton
                            type="submit"
                            variant="contained"
                            color="primary"
                            size="large"
                            sx={{ mt: 2, fontWeight: 'bold', py: 1.5, borderRadius: 2 }}
                        >
                            Create User
                        </MuiButton>
                    </Box>
                </CardContent>
            </Card>
            </Box>
        </Layout>
    );
};

export default CreateUser;
