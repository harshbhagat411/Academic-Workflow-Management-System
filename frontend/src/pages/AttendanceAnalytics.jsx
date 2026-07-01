import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { 
    Box, Typography, Paper, FormControl, Select, MenuItem, 
    CircularProgress, Alert, InputLabel, IconButton, Grid, Card, CardContent
} from '@mui/material';
import { ArrowLeft, Percent, Award, AlertTriangle, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import axios from 'axios';
import { Skeleton } from 'boneyard-js/react';
import { useDelayedLoading } from '../hooks/useDelayedLoading';

const AttendanceAnalytics = () => {
    const navigate = useNavigate();
    const [data, setData] = useState([]);
    const [semesterData, setSemesterData] = useState([]);
    const [defaulterCount, setDefaulterCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [semester, setSemester] = useState('all');

    const showLoading = useDelayedLoading(loading);

    const fetchData = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`http://localhost:5000/api/attendance/admin/analytics?semester=${semester}&range=all`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setData(res.data.attendanceOverview || []);
            setSemesterData(res.data.attendanceBySemester || []);
            setDefaulterCount(res.data.defaulterCount || 0);
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

    // KPI 1: Overall Average Attendance
    const overallAvg = React.useMemo(() => {
        if (!data || data.length === 0) return '0.0%';
        const sum = data.reduce((acc, curr) => acc + curr.attendancePercentage, 0);
        return (sum / data.length).toFixed(1) + '%';
    }, [data]);

    // KPI 2: Best Performing Subject
    const bestSubject = React.useMemo(() => {
        if (!data || data.length === 0) return { subject: 'N/A', attendancePercentage: 0 };
        return [...data].sort((a, b) => b.attendancePercentage - a.attendancePercentage)[0];
    }, [data]);

    // KPI 3: Lowest Performing Subject
    const worstSubject = React.useMemo(() => {
        if (!data || data.length === 0) return { subject: 'N/A', attendancePercentage: 0 };
        return [...data].sort((a, b) => a.attendancePercentage - b.attendancePercentage)[0];
    }, [data]);

    return (
        <Layout role="Admin">
            <Box sx={{ p: 3, color: 'white' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                    <IconButton onClick={() => navigate('/admin/analytics')} sx={{ color: 'white', mr: 2 }}>
                        <ArrowLeft />
                    </IconButton>
                    <Typography variant="h4" fontWeight="bold">Attendance Analytics Dashboard</Typography>
                </Box>

                {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

                {/* KPI Summary Cards */}
                <Grid container spacing={3} sx={{ mb: 4 }}>
                    <Grid item xs={12} sm={6} md={3}>
                        <Skeleton name="overall-card" loading={showLoading}>
                            <Card sx={{ bgcolor: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', backdropFilter: 'blur(8px)', borderRadius: 3, height: '100%', display: 'flex', alignItems: 'center' }}>
                                <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 3, '&:last-child': { pb: 3 } }}>
                                    <Box sx={{ bgcolor: 'rgba(33, 150, 243, 0.15)', color: '#2196f3', p: 1.5, borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Percent size={28} />
                                    </Box>
                                    <Box>
                                        <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 'bold', display: 'block', mb: 0.5 }}>Overall Attendance</Typography>
                                        <Typography variant="h4" fontWeight="bold" sx={{ color: 'white', mb: 0.5 }}>{overallAvg}</Typography>
                                        <Typography variant="caption" color="text.secondary">Average across all courses</Typography>
                                    </Box>
                                </CardContent>
                            </Card>
                        </Skeleton>
                    </Grid>
                    
                    <Grid item xs={12} sm={6} md={3}>
                        <Skeleton name="best-card" loading={showLoading}>
                            <Card sx={{ bgcolor: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', backdropFilter: 'blur(8px)', borderRadius: 3, height: '100%', display: 'flex', alignItems: 'center' }}>
                                <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 3, '&:last-child': { pb: 3 }, minWidth: 0, width: '100%' }}>
                                    <Box sx={{ bgcolor: 'rgba(76, 175, 80, 0.15)', color: '#4caf50', p: 1.5, borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                        <Award size={28} />
                                    </Box>
                                    <Box sx={{ minWidth: 0, flexGrow: 1 }}>
                                        <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 'bold', display: 'block', mb: 0.5 }}>Best Performing</Typography>
                                        <Typography variant="h4" fontWeight="bold" sx={{ color: 'white', mb: 0.5 }}>
                                            {bestSubject.attendancePercentage ? bestSubject.attendancePercentage.toFixed(1) + '%' : 'N/A'}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary" noWrap display="block" title={bestSubject.subject}>{bestSubject.subject || 'N/A'}</Typography>
                                    </Box>
                                </CardContent>
                            </Card>
                        </Skeleton>
                    </Grid>
                    
                    <Grid item xs={12} sm={6} md={3}>
                        <Skeleton name="worst-card" loading={showLoading}>
                            <Card sx={{ bgcolor: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', backdropFilter: 'blur(8px)', borderRadius: 3, height: '100%', display: 'flex', alignItems: 'center' }}>
                                <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 3, '&:last-child': { pb: 3 }, minWidth: 0, width: '100%' }}>
                                    <Box sx={{ bgcolor: 'rgba(244, 67, 54, 0.15)', color: '#f44336', p: 1.5, borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                        <AlertTriangle size={28} />
                                    </Box>
                                    <Box sx={{ minWidth: 0, flexGrow: 1 }}>
                                        <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 'bold', display: 'block', mb: 0.5 }}>Lowest Performing</Typography>
                                        <Typography variant="h4" fontWeight="bold" sx={{ color: 'white', mb: 0.5 }}>
                                            {worstSubject.attendancePercentage ? worstSubject.attendancePercentage.toFixed(1) + '%' : 'N/A'}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary" noWrap display="block" title={worstSubject.subject}>{worstSubject.subject || 'N/A'}</Typography>
                                    </Box>
                                </CardContent>
                            </Card>
                        </Skeleton>
                    </Grid>
                    
                    <Grid item xs={12} sm={6} md={3}>
                        <Skeleton name="defaulter-card" loading={showLoading}>
                            <Card sx={{ bgcolor: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', backdropFilter: 'blur(8px)', borderRadius: 3, height: '100%', display: 'flex', alignItems: 'center' }}>
                                <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 3, '&:last-child': { pb: 3 } }}>
                                    <Box sx={{ bgcolor: 'rgba(255, 152, 0, 0.15)', color: '#ff9800', p: 1.5, borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Users size={28} />
                                    </Box>
                                    <Box>
                                        <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 'bold', display: 'block', mb: 0.5 }}>Defaulter Students</Typography>
                                        <Typography variant="h4" fontWeight="bold" sx={{ color: 'white', mb: 0.5 }}>{defaulterCount}</Typography>
                                        <Typography variant="caption" color="text.secondary">Below 75% threshold</Typography>
                                    </Box>
                                </CardContent>
                            </Card>
                        </Skeleton>
                    </Grid>
                </Grid>

                {/* Subject-wise Average Attendance */}
                <Paper sx={{ p: 3, bgcolor: '#1e1e1e', color: 'white', mb: 4, borderRadius: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, flexWrap: 'wrap', gap: 2 }}>
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

                    <Skeleton name="subject-chart-loader" loading={showLoading}>
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
                    </Skeleton>
                </Paper>

                {/* Semester-wise Average Attendance */}
                <Paper sx={{ p: 3, bgcolor: '#1e1e1e', color: 'white', mb: 4, borderRadius: 2 }}>
                    <Typography variant="h6" sx={{ mb: 4 }}>Semester-wise Average Attendance (%)</Typography>
                    <Skeleton name="semester-chart-loader" loading={showLoading}>
                        <Box sx={{ height: 350, width: '100%' }}>
                            {semesterData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={semesterData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                                        <defs>
                                            <linearGradient id="colorSemester" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#4caf50" stopOpacity={0.4}/>
                                                <stop offset="95%" stopColor="#4caf50" stopOpacity={0}/>
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                                        <XAxis 
                                            dataKey="semester" 
                                            stroke="#fff" 
                                            tick={{ fill: '#ddd', fontSize: 12 }}
                                            tickFormatter={(sem) => `Semester ${sem}`}
                                        />
                                        <YAxis stroke="#fff" tick={{ fill: '#ddd' }} domain={[0, 100]} />
                                        <Tooltip 
                                            contentStyle={{ backgroundColor: '#333', borderColor: '#444', color: 'white' }}
                                            cursor={{ stroke: '#555', strokeWidth: 1 }}
                                        />
                                        <Area type="monotone" dataKey="attendancePercentage" stroke="#4caf50" fillOpacity={1} fill="url(#colorSemester)" name="Avg Attendance %" strokeWidth={2} isAnimationActive={false} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            ) : (
                                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                                    <Typography color="text.secondary">No semester-wise data available</Typography>
                                </Box>
                            )}
                        </Box>
                    </Skeleton>
                </Paper>
            </Box>
        </Layout>
    );
};

export default AttendanceAnalytics;
