import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { 
    Box, Typography, Paper, FormControl, Select, MenuItem, 
    CircularProgress, Alert, InputLabel, IconButton, Grid
} from '@mui/material';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import axios from 'axios';

const AttendancePattern = () => {
    const navigate = useNavigate();
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [semester, setSemester] = useState('all');
    const [range, setRange] = useState('all');

    const fetchData = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`http://localhost:5000/api/attendance/admin/analytics?semester=${semester}&range=${range}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setData(res.data.attendancePattern || []);
            setError(null);
        } catch (err) {
            console.error('Failed to fetch attendance pattern:', err);
            setError('Failed to load attendance pattern data.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [semester, range]);

    // Calculate highest absence insight
    const highestAbsence = data.length > 0 ? [...data].sort((a, b) => b.absencePercentage - a.absencePercentage)[0] : null;

    return (
        <Layout role="Admin">
            <Box sx={{ p: 3, color: 'white' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <IconButton onClick={() => navigate('/admin/analytics')} sx={{ color: 'white', mr: 2 }}>
                    <ArrowLeft />
                </IconButton>
                <Typography variant="h4" fontWeight="bold">Attendance Pattern</Typography>
            </Box>

            <Paper sx={{ p: 3, bgcolor: '#1e1e1e', color: 'white', mb: 4, borderRadius: 2 }}>
                <Grid container spacing={2} sx={{ mb: 4 }} alignItems="center" justifyContent="space-between">
                    <Grid item>
                        <Typography variant="h6">Day-wise Absence Pattern (%)</Typography>
                    </Grid>
                    <Grid item>
                        <Box sx={{ display: 'flex', gap: 2 }}>
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
                    </Grid>
                </Grid>

                {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
                        <CircularProgress />
                    </Box>
                ) : (
                    <Box sx={{ height: 400, width: '100%', mb: 2 }}>
                        {data.some(d => d.absencePercentage > 0) ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                                    <XAxis dataKey="day" stroke="#fff" tick={{ fill: '#ddd' }} />
                                    <YAxis stroke="#fff" tick={{ fill: '#ddd' }} domain={[0, 100]} />
                                    <Tooltip 
                                        contentStyle={{ backgroundColor: '#333', borderColor: '#444', color: 'white' }}
                                        cursor={{ fill: '#444' }}
                                    />
                                    <Bar dataKey="absencePercentage" fill="#d32f2f" name="Absence %" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                                <Typography color="text.secondary">No absence records found for selected filters</Typography>
                            </Box>
                        )}
                    </Box>
                )}

                {/* Insight Text */}
                {!loading && highestAbsence && data.some(d => d.absencePercentage > 0) && (
                    <Box sx={{ mt: 3, p: 2, bgcolor: 'rgba(211, 47, 47, 0.1)', borderLeft: '4px solid #d32f2f', borderRadius: 1 }}>
                        <Typography variant="body1">
                            <strong>Insight:</strong> Highest absence observed on <strong>{highestAbsence.day}</strong> ({highestAbsence.absencePercentage}%)
                        </Typography>
                    </Box>
                )}
            </Paper>
        </Box>
        </Layout>
    );
};

export default AttendancePattern;
