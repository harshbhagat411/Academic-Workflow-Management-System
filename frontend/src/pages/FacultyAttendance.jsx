import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Box, Typography, Card, CardContent, Button, Chip, CircularProgress, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Grid } from '@mui/material';
import { Calendar, Clock, CheckCircle, AlertCircle, PlayCircle, Users, ArrowLeft, Save, Shield } from 'lucide-react';
import Layout from '../components/Layout';
import ConfirmDialog from '../components/ConfirmDialog';

const FacultyAttendance = () => {
    const [schedule, setSchedule] = useState([]);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState('list'); // 'list' or 'attendance'
    const [activeLecture, setActiveLecture] = useState(null);
    const [activeSessionId, setActiveSessionId] = useState(null);
    const [students, setStudents] = useState([]);
    const [submitting, setSubmitting] = useState(false);
    const [confirmDialog, setConfirmDialog] = useState({ open: false, title: '', description: '', type: 'default', action: null });

    const closeConfirmDialog = () => setConfirmDialog(prev => ({ ...prev, open: false }));

    const token = localStorage.getItem('token');

    useEffect(() => {
        fetchSchedule();
    }, []);

    const fetchSchedule = async () => {
        setLoading(true);
        try {
            const res = await axios.get('http://localhost:5000/api/timetable/faculty/today', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSchedule(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleMarkAttendance = async (lecture) => {
        if (lecture.status === 'Upcoming') {
            alert("Cannot mark attendance for future lectures.");
            return;
        }

        setActiveLecture(lecture);

        try {
            let sessionId = lecture.sessionId;

            if (!sessionId) {
                const createRes = await axios.post('http://localhost:5000/api/attendance/session/create',
                    {
                        subjectId: lecture.subjectId._id,
                        date: new Date(),
                        timetableId: lecture._id,
                        section: lecture.section
                    },
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                sessionId = createRes.data._id;
            }

            setActiveSessionId(sessionId);
            loadSessionData(sessionId, lecture.subjectId._id, lecture.section);
            setView('attendance');

        } catch (err) {
            alert(err.response?.data?.message || 'Error initializing session');
        }
    };

    const loadSessionData = async (sessionId, subjectId, section) => {
        try {
            const sessionRes = await axios.get(`http://localhost:5000/api/attendance/session/${sessionId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            const existingRecords = sessionRes.data.records;

            const studentsRes = await axios.get(`http://localhost:5000/api/attendance/session/${subjectId}/students?section=${section}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            const merged = studentsRes.data.map(student => {
                const record = existingRecords.find(r => r.studentId === student._id);
                return {
                    ...student,
                    status: record ? record.status : 'Present'
                };
            });

            setStudents(merged);
        } catch (err) {
            console.error('loadSessionData ERROR:', err.response || err);
            alert(`Failed to load student list: ${err.response?.data?.message || err.message}`);
        }
    };

    const toggleStatus = (index) => {
        const updated = [...students];
        updated[index].status = updated[index].status === 'Present' ? 'Absent' : 'Present';
        setStudents(updated);
    };

    const submitAttendance = async () => {
        setSubmitting(true);
        try {
            const records = students.map(s => ({
                studentId: s._id,
                status: s.status
            }));

            await axios.post('http://localhost:5000/api/attendance/mark',
                { sessionId: activeSessionId, records },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            alert('Attendance marked successfully! ✅');
            setView('list');
            fetchSchedule();
        } catch (err) {
            console.error(err);
            alert('Error marking attendance');
        } finally {
            setSubmitting(false);
        }
    };

    if (view === 'attendance') {
        return (
            <Layout role="Faculty" activeTab="attendance">
                <Box sx={{ maxWidth: 1000, mx: 'auto', animation: 'fadeInUp 0.5s ease-out' }}>
                    <Button
                        startIcon={<ArrowLeft />}
                        onClick={() => setView('list')}
                        sx={{ mb: 3, color: 'text.secondary', fontWeight: 'bold' }}
                    >
                        Back to Schedule
                    </Button>
                    <Card sx={{ borderRadius: 2, boxShadow: 3, overflow: 'hidden' }}>
                        <Box sx={{ p: 3, borderBottom: 1, borderColor: 'divider', bgcolor: 'background.default', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                            <Box>
                                <Typography variant="h6" fontWeight="bold" display="flex" alignItems="center" gap={1}>
                                    <Users color="#2196f3" />
                                    Marking Attendance
                                </Typography>
                                <Typography variant="body2" color="text.secondary" mt={0.5}>
                                    {activeLecture?.subjectId?.name} ({activeLecture?.subjectId?.code}) • {activeLecture?.startTime} - {activeLecture?.endTime}
                                </Typography>
                            </Box>
                            <Chip 
                                label={new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} 
                                variant="outlined" 
                                color="primary" 
                                sx={{ fontWeight: 'bold' }} 
                            />
                        </Box>
                        <TableContainer sx={{ maxHeight: '60vh' }}>
                            <Table stickyHeader>
                                <TableHead>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 'bold', bgcolor: 'action.hover' }}>Student Name</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold', bgcolor: 'action.hover' }}>Roll No / ID</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold', textAlign: 'center', bgcolor: 'action.hover' }}>Status</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold', textAlign: 'right', bgcolor: 'action.hover' }}>Action</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {students.map((student, idx) => (
                                        <TableRow key={student._id} hover>
                                            <TableCell sx={{ fontWeight: 'medium' }}>{student.name}</TableCell>
                                            <TableCell sx={{ fontFamily: 'monospace', color: 'text.secondary' }}>{student.loginId}</TableCell>
                                            <TableCell align="center">
                                                <Chip 
                                                    icon={student.status === 'Present' ? <CheckCircle size={16} /> : <AlertCircle size={16} />} 
                                                    label={student.status} 
                                                    color={student.status === 'Present' ? 'success' : 'error'} 
                                                    size="small" 
                                                    variant="outlined"
                                                    sx={{ fontWeight: 'bold' }} 
                                                />
                                            </TableCell>
                                            <TableCell align="right">
                                                <Button 
                                                    variant="contained" 
                                                    color={student.status === 'Present' ? 'error' : 'success'} 
                                                    size="small" 
                                                    onClick={() => toggleStatus(idx)}
                                                    sx={{ minWidth: 120, fontWeight: 'bold' }}
                                                >
                                                    Mark {student.status === 'Present' ? 'Absent' : 'Present'}
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                        <Box sx={{ p: 3, borderTop: 1, borderColor: 'divider', bgcolor: 'background.default', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                            <Typography variant="body2" color="text.secondary">
                                Total: <Box component="span" fontWeight="bold" color="text.primary">{students.length}</Box> •{' '}
                                Present: <Box component="span" fontWeight="bold" color="success.main">{students.filter(s => s.status === 'Present').length}</Box> •{' '}
                                Absent: <Box component="span" fontWeight="bold" color="error.main">{students.filter(s => s.status === 'Absent').length}</Box>
                            </Typography>
                            <Button
                                variant="contained"
                                color="success"
                                size="large"
                                startIcon={<Save />}
                                onClick={() => setConfirmDialog({
                                    open: true,
                                    title: 'Submit Attendance',
                                    description: 'Are you sure you want to save the attendance? This action cannot be easily undone.',
                                    type: 'default',
                                    action: submitAttendance
                                })}
                                disabled={submitting}
                                sx={{ fontWeight: 'bold', borderRadius: 2 }}
                            >
                                {submitting ? 'Saving...' : 'Save Attendance'}
                            </Button>
                        </Box>
                    </Card>
                </Box>
            </Layout>
        );
    }

    return (
        <Layout role="Faculty" activeTab="attendance">
            <Box sx={{ width: '100%', animation: 'fadeInUp 0.5s ease-out' }}>
                <Box sx={{ mb: 4, display: 'flex', flexDirection: { xs: 'column', md: 'row' }, alignItems: { xs: 'flex-start', md: 'center' }, justifyContent: 'space-between', gap: 2 }}>
                    <Box>
                        <Typography variant="h4" fontWeight="bold" display="flex" alignItems="center" gap={1.5} mb={1}>
                            <Calendar color="#2196f3" size={32} />
                            Today's Schedule
                        </Typography>
                        <Typography color="text.secondary">
                            {new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                        </Typography>
                    </Box>
                    <Paper variant="outlined" sx={{ px: 2, py: 1, display: 'flex', alignItems: 'center', gap: 2, borderRadius: 2 }}>
                        <Box display="flex" alignItems="center" gap={1}>
                            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'success.main', animation: 'pulse 2s infinite' }} />
                            <Typography variant="caption" color="text.secondary">Ongoing</Typography>
                        </Box>
                        <Box sx={{ width: 1, height: 16, bgcolor: 'divider' }} />
                        <Box display="flex" alignItems="center" gap={1}>
                            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'info.main' }} />
                            <Typography variant="caption" color="text.secondary">Upcoming</Typography>
                        </Box>
                        <Box sx={{ width: 1, height: 16, bgcolor: 'divider' }} />
                        <Box display="flex" alignItems="center" gap={1}>
                            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'secondary.main' }} />
                            <Typography variant="caption" color="text.secondary">Submitted</Typography>
                        </Box>
                    </Paper>
                </Box>

                {loading ? (
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 10 }}>
                        <CircularProgress sx={{ mb: 2 }} />
                        <Typography color="text.secondary">Loading today's sessions...</Typography>
                    </Box>
                ) : schedule.length === 0 ? (
                    <Paper variant="outlined" sx={{ p: 6, textAlign: 'center', borderRadius: 3, borderStyle: 'dashed' }}>
                        <Box sx={{ bgcolor: 'action.hover', p: 2, borderRadius: '50%', display: 'inline-block', mb: 2 }}>
                            <Calendar size={40} color="gray" />
                        </Box>
                        <Typography variant="h6" fontWeight="bold" mb={1}>No Lectures Scheduled Today</Typography>
                        <Typography color="text.secondary">Enjoy your free time!</Typography>
                    </Paper>
                ) : (
                    <Grid container spacing={3}>
                        {schedule.map((item, idx) => (
                            <Grid size={{ xs: 12, md: 6, lg: 4 }} key={idx}>
                                <Card sx={{ 
                                    borderRadius: 3, 
                                    boxShadow: item.status === 'Ongoing' ? 4 : 1, 
                                    border: '1px solid', 
                                    borderColor: item.status === 'Ongoing' ? 'success.main' : 'divider',
                                    transition: 'all 0.3s',
                                    '&:hover': { transform: 'translateY(-4px)', boxShadow: 6 }
                                }}>
                                    <CardContent sx={{ p: 3 }}>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
                                            <Chip 
                                                label={item.status} 
                                                color={
                                                    item.status === 'Ongoing' ? 'success' : 
                                                    item.status === 'Submitted' ? 'secondary' : 
                                                    item.status === 'Upcoming' ? 'info' : 'default'
                                                }
                                                size="small"
                                                sx={{ fontWeight: 'bold' }}
                                            />
                                            <Typography variant="caption" color="text.secondary" display="flex" alignItems="center" gap={0.5}>
                                                <Clock size={12} /> {item.endTime}
                                            </Typography>
                                        </Box>
                                        <Typography variant="h6" fontWeight="bold" noWrap title={item.subjectId?.name} mb={1}>
                                            {item.subjectId?.name}
                                        </Typography>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                                            <Chip label={item.subjectId?.code} size="small" variant="outlined" sx={{ fontFamily: 'monospace' }} />
                                            <Typography variant="caption" color="text.secondary">• Semester {item.semester}</Typography>
                                        </Box>
                                        <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, display: 'flex', alignItems: 'center', gap: 2, mb: 3, bgcolor: 'background.default' }}>
                                            <Box sx={{ color: 'info.main' }}><Clock size={24} /></Box>
                                            <Box>
                                                <Typography variant="caption" color="text.secondary" fontWeight="bold" display="block">Time Slot</Typography>
                                                <Typography variant="body2" fontWeight="medium" fontFamily="monospace">{item.startTime} - {item.endTime}</Typography>
                                            </Box>
                                        </Paper>
                                        <Button
                                            fullWidth
                                            variant="contained"
                                            color={
                                                item.status === 'Ongoing' ? 'success' : 
                                                item.status === 'Submitted' ? 'secondary' : 
                                                item.status === 'Expired' ? 'warning' : 'inherit'
                                            }
                                            disabled={item.status === 'Upcoming'}
                                            onClick={() => handleMarkAttendance(item)}
                                            startIcon={
                                                item.status === 'Ongoing' ? <PlayCircle size={18} /> : 
                                                item.status === 'Submitted' ? <CheckCircle size={18} /> : 
                                                item.status === 'Upcoming' ? <Clock size={18} /> : <Shield size={18} />
                                            }
                                            sx={{ py: 1.5, borderRadius: 2, fontWeight: 'bold' }}
                                        >
                                            {item.status === 'Ongoing' ? 'Mark Attendance' : 
                                             item.status === 'Submitted' ? 'View / Edit' : 
                                             item.status === 'Upcoming' ? 'Starts Soon' : 'Mark Late'}
                                        </Button>
                                    </CardContent>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>
                )}

                {/* Today's Attendance Summary Section */}
                {!loading && (
                    <Card sx={{ mt: 6, borderRadius: 3, boxShadow: 2 }}>
                        <Box sx={{ p: 3, borderBottom: 1, borderColor: 'divider' }}>
                            <Typography variant="h6" fontWeight="bold" display="flex" alignItems="center" gap={1.5}>
                                <CheckCircle color="#2196f3" />
                                Today's Attendance Summary
                            </Typography>
                        </Box>
                        {schedule.length === 0 ? (
                            <Box sx={{ p: 4, textAlign: 'center' }}>
                                <Typography color="text.secondary">No lectures scheduled today.</Typography>
                            </Box>
                        ) : (
                            <TableContainer>
                                <Table>
                                    <TableHead sx={{ bgcolor: 'action.hover' }}>
                                        <TableRow>
                                            <TableCell sx={{ fontWeight: 'bold' }}>Subject Name</TableCell>
                                            <TableCell sx={{ fontWeight: 'bold' }}>Semester</TableCell>
                                            <TableCell sx={{ fontWeight: 'bold' }}>Time Slot</TableCell>
                                            <TableCell sx={{ fontWeight: 'bold', textAlign: 'right' }}>Attendance Status</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {schedule.map((item, idx) => {
                                            let badgeColor = "default";
                                            let displayStatus = "Pending";

                                            if (item.status === 'Submitted') {
                                                badgeColor = "success";
                                                displayStatus = "Submitted";
                                            } else if (item.status === 'Ongoing') {
                                                badgeColor = "info";
                                                displayStatus = "Ongoing";
                                            } else if (item.status === 'Expired') {
                                                badgeColor = "warning";
                                                displayStatus = "Expired (Pending)";
                                            }

                                            return (
                                                <TableRow key={idx} hover>
                                                    <TableCell sx={{ fontWeight: 'medium' }}>{item.subjectId?.name}</TableCell>
                                                    <TableCell color="text.secondary">Semester {item.semester}</TableCell>
                                                    <TableCell sx={{ fontFamily: 'monospace' }}>
                                                        {item.startTime} - {item.endTime}
                                                    </TableCell>
                                                    <TableCell align="right">
                                                        <Chip 
                                                            label={displayStatus} 
                                                            color={badgeColor} 
                                                            variant={badgeColor === "default" ? "outlined" : "filled"}
                                                            size="small"
                                                            sx={{ fontWeight: 'bold' }}
                                                        />
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        )}
                    </Card>
                )}
            </Box>
            <ConfirmDialog 
                open={confirmDialog.open}
                title={confirmDialog.title}
                description={confirmDialog.description}
                type={confirmDialog.type}
                onConfirm={() => {
                    if (confirmDialog.action) confirmDialog.action();
                }}
                onClose={closeConfirmDialog}
            />
        </Layout>
    );
};

export default FacultyAttendance;
