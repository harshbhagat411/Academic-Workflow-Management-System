import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { Box, Typography, Grid, Paper, CircularProgress, Alert } from '@mui/material';
import { FileText, Users, Calendar, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const AnalyticsReports = () => {
    const navigate = useNavigate();
    const [requestStats, setRequestStats] = useState(null);
    const [attendanceStats, setAttendanceStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchAllStats = async () => {
            setLoading(true);
            try {
                const token = localStorage.getItem('token');
                const [reqRes, attRes] = await Promise.all([
                    axios.get('http://localhost:5000/api/requests/admin/stats?range=all', { headers: { Authorization: `Bearer ${token}` } }),
                    axios.get('http://localhost:5000/api/attendance/admin/analytics?range=all&semester=all', { headers: { Authorization: `Bearer ${token}` } })
                ]);
                
                setRequestStats(reqRes.data);
                setAttendanceStats(attRes.data);
                setError(null);
            } catch (err) {
                console.error("Failed to load analytics dashboard data:", err);
                setError("Failed to load summary analytics.");
            } finally {
                setLoading(false);
            }
        };
        fetchAllStats();
    }, []);

    // Derived Metrics Calculations
    let avgAttendance = 0;
    let highestAbsence = null;

    if (attendanceStats) {
        const overviews = attendanceStats.attendanceOverview || [];
        if (overviews.length > 0) {
            const sum = overviews.reduce((acc, curr) => acc + curr.attendancePercentage, 0);
            avgAttendance = (sum / overviews.length).toFixed(1);
        }

        const patterns = attendanceStats.attendancePattern || [];
        if (patterns.length > 0) {
            const sorted = [...patterns].sort((a, b) => b.absencePercentage - a.absencePercentage);
            highestAbsence = sorted[0];
        }
    }

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Layout role="Admin">
            <Box sx={{ p: 3, color: 'white' }}>
            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" fontWeight="bold" sx={{ mb: 1 }}>Analytics Dashboard</Typography>
                <Typography color="text.secondary">Select a module below to view detailed drill-down reports and filters.</Typography>
            </Box>

            {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

            <Grid container spacing={3}>
                
                {/* Request Overview Card */}
                <Grid item xs={12} md={4}>
                    <Paper 
                        onClick={() => navigate('/admin/analytics/requests')}
                        sx={{ 
                            p: 3, bgcolor: '#1e1e1e', color: 'white', borderRadius: 2, 
                            cursor: 'pointer', transition: '0.2s',
                            '&:hover': { bgcolor: '#2a2a2a', transform: 'translateY(-4px)' }
                        }}
                    >
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                            <Box sx={{ p: 1.5, bgcolor: 'rgba(25, 118, 210, 0.1)', borderRadius: 2 }}>
                                <FileText size={24} color="#1976d2" />
                            </Box>
                            <ArrowRight size={20} color="#777" />
                        </Box>
                        <Typography variant="h5" fontWeight="bold" sx={{ mb: 1 }}>
                            Request Overview
                        </Typography>
                        <Box sx={{ mt: 2 }}>
                            <Typography variant="body2" color="text.secondary">Total Requests</Typography>
                            <Typography variant="h4" sx={{ fontWeight: 600, color: '#1976d2' }}>
                                {requestStats?.total || 0}
                            </Typography>
                            <Typography variant="body2" sx={{ mt: 1, color: '#f57c00' }}>
                                <strong>{requestStats?.pending || 0}</strong> pending actions
                            </Typography>
                        </Box>
                    </Paper>
                </Grid>

                {/* Attendance Overview Card */}
                <Grid item xs={12} md={4}>
                    <Paper 
                        onClick={() => navigate('/admin/analytics/attendance')}
                        sx={{ 
                            p: 3, bgcolor: '#1e1e1e', color: 'white', borderRadius: 2, 
                            cursor: 'pointer', transition: '0.2s',
                            '&:hover': { bgcolor: '#2a2a2a', transform: 'translateY(-4px)' }
                        }}
                    >
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                            <Box sx={{ p: 1.5, bgcolor: 'rgba(46, 125, 50, 0.1)', borderRadius: 2 }}>
                                <Users size={24} color="#4caf50" />
                            </Box>
                            <ArrowRight size={20} color="#777" />
                        </Box>
                        <Typography variant="h5" fontWeight="bold" sx={{ mb: 1 }}>
                            Attendance Overview
                        </Typography>
                        <Box sx={{ mt: 2 }}>
                            <Typography variant="body2" color="text.secondary">System Average</Typography>
                            <Typography variant="h4" sx={{ fontWeight: 600, color: '#4caf50' }}>
                                {avgAttendance}%
                            </Typography>
                            <Typography variant="body2" sx={{ mt: 1, color: '#aaa' }}>
                                Across all active subjects
                            </Typography>
                        </Box>
                    </Paper>
                </Grid>

                {/* Attendance Pattern Card */}
                <Grid item xs={12} md={4}>
                    <Paper 
                        onClick={() => navigate('/admin/analytics/pattern')}
                        sx={{ 
                            p: 3, bgcolor: '#1e1e1e', color: 'white', borderRadius: 2, 
                            cursor: 'pointer', transition: '0.2s',
                            '&:hover': { bgcolor: '#2a2a2a', transform: 'translateY(-4px)' }
                        }}
                    >
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                            <Box sx={{ p: 1.5, bgcolor: 'rgba(211, 47, 47, 0.1)', borderRadius: 2 }}>
                                <Calendar size={24} color="#d32f2f" />
                            </Box>
                            <ArrowRight size={20} color="#777" />
                        </Box>
                        <Typography variant="h5" fontWeight="bold" sx={{ mb: 1 }}>
                            Attendance Pattern
                        </Typography>
                        <Box sx={{ mt: 2 }}>
                            <Typography variant="body2" color="text.secondary">Highest Absence Day</Typography>
                            <Typography variant="h4" sx={{ fontWeight: 600, color: '#d32f2f' }}>
                                {highestAbsence && highestAbsence.absencePercentage > 0 ? highestAbsence.day : 'N/A'}
                            </Typography>
                            <Typography variant="body2" sx={{ mt: 1, color: '#aaa' }}>
                                {highestAbsence && highestAbsence.absencePercentage > 0 
                                    ? `At ${highestAbsence.absencePercentage}% absence rate` 
                                    : 'No significant absence records'}
                            </Typography>
                        </Box>
                    </Paper>
                </Grid>

            </Grid>
        </Box>
        </Layout>
    );
};

export default AnalyticsReports;
