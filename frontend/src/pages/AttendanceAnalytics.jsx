import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { 
    Box, Typography, Paper, FormControl, Select, MenuItem, 
    CircularProgress, Alert, InputLabel, IconButton
} from '@mui/material';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import axios from 'axios';

const AttendanceAnalytics = () => {
    const navigate = useNavigate();
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [semester, setSemester] = useState('all');

    const fetchData = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`http://localhost:5000/api/attendance/admin/analytics?semester=${semester}&range=all`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setData(res.data.attendanceOverview || []);
            setError(null);
        } catch (err) {
            console.error('Failed to fetch attendance analytics:', err);
            setError('Failed to load attendance analytics data.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [semester]);

    return (
        <Layout role="Admin">
            <Box sx={{ p: 3, color: 'white' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <IconButton onClick={() => navigate('/admin/analytics')} sx={{ color: 'white', mr: 2 }}>
                    <ArrowLeft />
                </IconButton>
                <Typography variant="h4" fontWeight="bold">Attendance Analytics (Per Subject)</Typography>
            </Box>

            <Paper sx={{ p: 3, bgcolor: '#1e1e1e', color: 'white', mb: 4, borderRadius: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                    <Typography variant="h6">Subject-wise Average Attendance (%)</Typography>
                    
                    <FormControl size="small" sx={{ minWidth: 150 }}>
                        <InputLabel sx={{ color: '#bbb' }}>Semester</InputLabel>
                        <Select
                            value={semester}
                            label="Semester"
                            onChange={(e) => setSemester(e.target.value)}
                            sx={{ color: 'white', '.MuiOutlinedInput-notchedOutline': { borderColor: '#555' } }}
                        >
                            <MenuItem value="all">All Semesters</MenuItem>
                            {[1, 2, 3, 4, 5, 6, 7, 8].map(sem => (
                                <MenuItem key={sem} value={sem}>Semester {sem}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Box>

                {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
                        <CircularProgress />
                    </Box>
                ) : (
                    <Box sx={{ height: 450, width: '100%' }}>
                        {data.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 50 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                                    <XAxis 
                                        dataKey="subject" 
                                        stroke="#fff" 
                                        tick={{ fill: '#ddd', fontSize: 12 }}
                                        interval={0}
                                        angle={-45}
                                        textAnchor="end"
                                    />
                                    <YAxis stroke="#fff" tick={{ fill: '#ddd' }} domain={[0, 100]} />
                                    <Tooltip 
                                        contentStyle={{ backgroundColor: '#333', borderColor: '#444', color: 'white' }}
                                        cursor={{ fill: '#444' }}
                                    />
                                    <Bar dataKey="attendancePercentage" fill="#1976d2" name="Attendance %" radius={[4, 4, 0, 0]} isAnimationActive={false} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                                <Typography color="text.secondary">No attendance data available for selected semester</Typography>
                            </Box>
                        )}
                    </Box>
                )}
            </Paper>
        </Box>
        </Layout>
    );
};

export default AttendanceAnalytics;
