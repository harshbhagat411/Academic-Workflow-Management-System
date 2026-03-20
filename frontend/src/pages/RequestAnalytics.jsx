import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { 
    Box, Typography, Paper, FormControl, Select, MenuItem, 
    CircularProgress, Alert, InputLabel, IconButton
} from '@mui/material';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import axios from 'axios';

const COLORS = ['#2e7d32', '#f57c00', '#d32f2f']; // Approved, Pending, Rejected

const RequestAnalytics = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [range, setRange] = useState('all');

    const fetchStats = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`http://localhost:5000/api/requests/admin/stats?range=${range}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setStats([
                { name: 'Approved', value: res.data.approved },
                { name: 'Pending', value: res.data.pending },
                { name: 'Rejected', value: res.data.rejected }
            ]);
            setError(null);
        } catch (err) {
            console.error('Failed to fetch request stats:', err);
            setError('Failed to load request analytics data.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
    }, [range]);

    return (
        <Layout role="Admin">
            <Box sx={{ p: 3, color: 'white' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <IconButton onClick={() => navigate('/admin/analytics')} sx={{ color: 'white', mr: 2 }}>
                    <ArrowLeft />
                </IconButton>
                <Typography variant="h4" fontWeight="bold">Request Analytics</Typography>
            </Box>

            <Paper sx={{ p: 3, bgcolor: '#1e1e1e', color: 'white', mb: 4, borderRadius: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                    <Typography variant="h6">Request Overview</Typography>
                    
                    <FormControl size="small" sx={{ minWidth: 150 }}>
                        <InputLabel sx={{ color: '#bbb' }}>Date Range</InputLabel>
                        <Select
                            value={range}
                            label="Date Range"
                            onChange={(e) => setRange(e.target.value)}
                            sx={{ color: 'white', '.MuiOutlinedInput-notchedOutline': { borderColor: '#555' } }}
                        >
                            <MenuItem value="all">All Time</MenuItem>
                            <MenuItem value="7">Last 7 Days</MenuItem>
                            <MenuItem value="30">Last 30 Days</MenuItem>
                        </Select>
                    </FormControl>
                </Box>

                {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
                        <CircularProgress />
                    </Box>
                ) : (
                    <Box sx={{ height: 400, width: '100%' }}>
                        {stats && stats.some(s => s.value > 0) ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={stats}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={80}
                                        outerRadius={140}
                                        paddingAngle={5}
                                        dataKey="value"
                                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                    >
                                        {stats.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip contentStyle={{ backgroundColor: '#333', borderColor: '#444', color: 'white' }} />
                                    <Legend verticalAlign="bottom" height={36} />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                                <Typography color="text.secondary">No data available for selected range</Typography>
                            </Box>
                        )}
                    </Box>
                )}
            </Paper>
        </Box>
        </Layout>
    );
};

export default RequestAnalytics;
