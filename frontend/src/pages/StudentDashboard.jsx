import { useNavigate, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
    Box, Typography, Grid, Card, Button, Tabs, Tab, 
    CircularProgress, Chip, Avatar, Paper, Divider
} from '@mui/material';
import { 
    Clock, Book, AlertCircle, CheckCircle, LayoutDashboard, 
    Users, LogOut, FileText, Shield, Calendar, Users as UsersIcon,
    Mail, GraduationCap, MessageSquare
} from 'lucide-react';
import { Skeleton } from 'boneyard-js/react';
import { useDelayedLoading } from '../hooks/useDelayedLoading';
import ProfileSection from '../components/ProfileSection';
import StatCard from '../components/StatCard';
import SecuritySection from '../components/SecuritySection';
import Layout from '../components/Layout';

const StudentDashboard = () => {
    const navigate = useNavigate();

    const [stats, setStats] = useState({
        total: 0,
        submitted: 0,
        facultyApproved: 0,
        finalApproved: 0,
        rejected: 0,
        attendancePercentage: null
    });
    const [user, setUser] = useState(null);
    const [counselor, setCounselor] = useState(null);
    const [activeTab, setActiveTab] = useState(0); // 0: Overview, 1: Profile
    const [greeting, setGreeting] = useState('');
    const [loading, setLoading] = useState(true);
    const showLoading = useDelayedLoading(loading);
    const [errorMsg, setErrorMsg] = useState('');

    useEffect(() => {
        const hour = new Date().getHours();
        if (hour < 12) setGreeting('Good Morning');
        else if (hour < 18) setGreeting('Good Afternoon');
        else setGreeting('Good Evening');

        const fetchData = async () => {
            setLoading(true);
            try {
                const token = localStorage.getItem('token');
                if (!token) return;

                const [userRes, statsRes, attRes, mentorRes] = await Promise.allSettled([
                    axios.get('http://localhost:5000/api/users/me', { headers: { Authorization: `Bearer ${token}` } }),
                    axios.get('http://localhost:5000/api/requests/stats/student', { headers: { Authorization: `Bearer ${token}` } }),
                    axios.get('http://localhost:5000/api/attendance/student/summary', { headers: { Authorization: `Bearer ${token}` } }),
                    axios.get('http://localhost:5000/api/mentors/student', { headers: { Authorization: `Bearer ${token}` } })
                ]);

                if (userRes.status === 'fulfilled') setUser(userRes.value.data);
                else setErrorMsg('Failed to fetch user data.');

                let attPct = null;
                if (attRes.status === 'fulfilled' && attRes.value.data && attRes.value.data.length > 0) {
                    let totalAttended = 0, totalLectures = 0;
                    attRes.value.data.forEach(subject => {
                        totalAttended += subject.attendedLectures;
                        totalLectures += subject.totalLectures;
                    });
                    if (totalLectures > 0) attPct = Math.round((totalAttended / totalLectures) * 100);
                }

                if (statsRes.status === 'fulfilled') {
                    setStats({ ...statsRes.value.data, attendancePercentage: attPct });
                }

                if (mentorRes.status === 'fulfilled') setCounselor(mentorRes.value.data);

            } catch (err) {
                console.error(err);
                setErrorMsg('An error occurred while loading dashboard.');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const handleTabChange = (event, newValue) => {
        setActiveTab(newValue);
    };

    const cards = [
        {
            icon: Clock,
            title: "Attendance",
            value: stats.attendancePercentage !== null ? `${stats.attendancePercentage}%` : "-",
            valueColor: stats.attendancePercentage !== null
                ? stats.attendancePercentage >= 75
                    ? "success.main"
                    : stats.attendancePercentage >= 50
                        ? "warning.main"
                        : "error.main"
                : "text.primary"
        },
        {
            icon: Book,
            title: "Subjects",
            value: "4"
        },
        {
            icon: AlertCircle,
            title: "Pending Requests",
            value: stats.submitted
        },
        {
            icon: CheckCircle,
            title: "Approved Requests",
            value: stats.facultyApproved
        }
    ];

    const displayCards = showLoading 
        ? Array(4).fill({ title: 'Loading...', value: '-', icon: Clock }) 
        : cards;

    const isSingleRow = displayCards.length <= 4;
    const half = Math.ceil(displayCards.length / 2);
    const firstRow = isSingleRow ? displayCards : displayCards.slice(0, half);
    const secondRow = isSingleRow ? [] : displayCards.slice(half);

    return (
        <Layout role="Student" activeTab="dashboard">
            <Box sx={{ width: '100%', p: { xs: 2, md: 3 }, animation: 'fadeInUp 0.5s ease-out' }}>
                <Box sx={{ textAlign: 'center', mb: 4 }}>
                    <Typography variant="h4" fontWeight="bold" color="text.primary" gutterBottom>
                        {greeting}, <Typography component="span" variant="h4" color="primary.main" fontWeight="bold">{user?.name || 'Student'}</Typography>
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        Welcome back to your academic portal
                    </Typography>
                </Box>

                {/* Navigation / Toggle */}
                <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 4, display: 'flex', justifyContext: 'center' }}>
                    <Tabs value={activeTab} onChange={handleTabChange} centered sx={{ width: '100%' }}>
                        <Tab label="Overview" icon={<LayoutDashboard size={18} />} iconPosition="start" sx={{ fontWeight: 'bold' }} />
                        <Tab label="My Profile" icon={<UsersIcon size={18} />} iconPosition="start" sx={{ fontWeight: 'bold' }} />
                    </Tabs>
                </Box>

                {errorMsg && (
                    <Box mb={4} p={2} bgcolor="error.light" borderRadius={2} border={1} borderColor="error.main">
                        <Typography color="error.dark" fontWeight="bold" display="flex" alignItems="center" gap={1}>
                            <AlertCircle size={20} /> {errorMsg}
                        </Typography>
                    </Box>
                )}

                {activeTab === 1 ? (
                    <Box sx={{ maxWidth: 800, mx: 'auto' }}>
                        <ProfileSection />
                        {/* If SecuritySection is meant to be here, include it, else skip */}
                    </Box>
                ) : (
                    <>
                        {/* Statistics Cards */}
                        <Box sx={{ mb: 6 }}>
                            <Box sx={{ display: "flex", gap: 3, mb: isSingleRow ? 0 : 3 }}>
                                {firstRow.map((card, index) => (
                                    <Box key={index} sx={{ flex: 1 }}>
                                        <Skeleton name="stat-card" loading={showLoading}>
                                            <StatCard sx={{ width: "100%", height: "100%" }} {...card} />
                                        </Skeleton>
                                    </Box>
                                ))}
                            </Box>
                            {!isSingleRow && (
                                <Box sx={{ display: "flex", gap: 3 }}>
                                    {secondRow.map((card, index) => (
                                        <Box key={index} sx={{ flex: 1 }}>
                                            <Skeleton name="stat-card" loading={showLoading}>
                                                <StatCard sx={{ width: "100%", height: "100%" }} {...card} />
                                            </Skeleton>
                                        </Box>
                                    ))}
                                </Box>
                            )}
                        </Box>

                        {/* My Counselor Section */}
                        {(showLoading ? true : counselor) && (
                            <Skeleton name="counselor-card" loading={showLoading}>
                            <Card sx={{ mb: 6, borderRadius: 3, boxShadow: 2, overflow: 'hidden' }}>
                                <Box sx={{ p: 3, borderBottom: 1, borderColor: 'divider', bgcolor: 'primary.50' }}>
                                    <Typography variant="h6" fontWeight="bold" color="primary.900" display="flex" alignItems="center" gap={1.5}>
                                        <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32 }}><GraduationCap size={16} /></Avatar>
                                        My Assigned Counselor
                                    </Typography>
                                </Box>
                                <Box sx={{ p: 4 }}>
                                    <Grid container spacing={4}>
                                        <Grid size={{ xs: 12, md: 4 }}>
                                            <Typography variant="caption" color="text.secondary" fontWeight="bold" textTransform="uppercase" letterSpacing={1}>Faculty Name</Typography>
                                            <Typography variant="h6" fontWeight="medium" mt={0.5}>{counselor?.facultyId?.name || 'Loading...'}</Typography>
                                        </Grid>
                                        <Grid size={{ xs: 12, md: 4 }}>
                                            <Typography variant="caption" color="text.secondary" fontWeight="bold" textTransform="uppercase" letterSpacing={1}>Contact Email</Typography>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                                                <Mail size={16} className="text-gray-400" />
                                                <Typography variant="h6" fontWeight="medium">{counselor?.facultyId?.email || 'Loading...'}</Typography>
                                            </Box>
                                        </Grid>
                                        <Grid size={{ xs: 12, md: 4 }}>
                                            <Typography variant="caption" color="text.secondary" fontWeight="bold" textTransform="uppercase" letterSpacing={1}>Department</Typography>
                                            <Typography variant="h6" fontWeight="medium" mt={0.5}>{counselor?.department || 'Loading...'}</Typography>
                                        </Grid>
                                    </Grid>
                                    <Divider sx={{ my: 3 }} />
                                    <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                                        <Button
                                            variant="contained"
                                            color="primary"
                                            startIcon={<MessageSquare size={18} />}
                                            component={Link}
                                            to="/student/chat"
                                            sx={{ borderRadius: 2, px: 3, py: 1.5, fontWeight: 'bold' }}
                                        >
                                            Chat with Counselor
                                        </Button>
                                    </Box>
                                </Box>
                            </Card>
                            </Skeleton>
                        )}

                        {/* Quick Link Buttons (replaces text links) */}
                        <Grid container spacing={2} justifyContent="center" sx={{ mb: 4 }}>
                            <Grid size={{ xs: 'auto' }}>
                                <Button 
                                    variant="outlined" 
                                    component={Link} 
                                    to="/student/requests"
                                    color="info"
                                    sx={{ borderRadius: 2, fontWeight: 'bold', borderWidth: 2, '&:hover': { borderWidth: 2 } }}
                                >
                                    Academic Requests
                                </Button>
                            </Grid>
                            <Grid size={{ xs: 'auto' }}>
                                <Button 
                                    variant="outlined" 
                                    component={Link} 
                                    to="/student/attendance"
                                    color="success"
                                    sx={{ borderRadius: 2, fontWeight: 'bold', borderWidth: 2, '&:hover': { borderWidth: 2 } }}
                                >
                                    My Attendance
                                </Button>
                            </Grid>
                            <Grid size={{ xs: 'auto' }}>
                                <Button 
                                    variant="outlined" 
                                    component={Link} 
                                    to="/student/marks"
                                    color="warning"
                                    sx={{ borderRadius: 2, fontWeight: 'bold', borderWidth: 2, '&:hover': { borderWidth: 2 } }}
                                >
                                    My Marks
                                </Button>
                            </Grid>
                        </Grid>
                    </>
                )}
            </Box>
        </Layout>
    );
};

export default StudentDashboard;
