import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
    Box, Typography, Grid, Card, CardActionArea, CardContent, 
    CircularProgress, Table, TableBody, TableCell, TableContainer, 
    TableHead, TableRow, Paper, Chip, Dialog, DialogTitle, 
    DialogContent, IconButton 
} from '@mui/material';
import { BookOpen, X, Calendar, CheckCircle, XCircle } from 'lucide-react';
import Layout from '../components/Layout';

const StudentAttendance = () => {
    const [summary, setSummary] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedSubject, setSelectedSubject] = useState(null);
    const [details, setDetails] = useState([]);

    const token = localStorage.getItem('token');

    useEffect(() => {
        fetchSummary();
    }, []);

    const fetchSummary = async () => {
        try {
            const res = await axios.get('http://localhost:5000/api/attendance/student/summary', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSummary(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchDetails = async (subjectId) => {
        try {
            const res = await axios.get(`http://localhost:5000/api/attendance/student/subject/${subjectId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setDetails(res.data);
            setSelectedSubject(subjectId);
        } catch (err) {
            console.error(err);
        }
    };

    const getStatusColor = (percentage) => {
        if (percentage >= 75) return 'success.main';
        if (percentage >= 60) return 'warning.main';
        return 'error.main';
    };

    const getCardBorder = (percentage) => {
        if (percentage >= 75) return 'success.main';
        if (percentage >= 60) return 'warning.main';
        return 'error.main';
    };

    return (
        <Layout role="Student" activeTab="attendance">
            <Box sx={{ maxWidth: 1200, mx: 'auto', p: { xs: 2, md: 4 }, animation: 'fadeInUp 0.5s ease-out' }}>
                <Typography variant="h4" fontWeight="bold" display="flex" alignItems="center" gap={2} mb={4}>
                    <Box component="span" sx={{ p: 1, bgcolor: 'primary.50', borderRadius: 2, display: 'flex' }}>
                        <BookOpen size={28} className="text-primary-600" />
                    </Box>
                    My Attendance
                </Typography>

                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
                        <CircularProgress />
                    </Box>
                ) : (
                    <Grid container spacing={4} sx={{ mb: 4 }}>
                        {summary.map((item, index) => (
                            <Grid item xs={12} sm={6} md={4} key={index}>
                                <Card 
                                    sx={{ 
                                        borderRadius: 3, 
                                        boxShadow: 3, 
                                        borderLeft: 6, 
                                        borderColor: getCardBorder(item.percentage),
                                        transition: 'transform 0.2s, box-shadow 0.2s',
                                        '&:hover': { transform: 'translateY(-4px)', boxShadow: 6 }
                                    }}
                                >
                                    <CardActionArea onClick={() => fetchDetails(item.subjectId)} sx={{ p: 3, height: '100%' }}>
                                        <Typography variant="h6" fontWeight="bold" gutterBottom noWrap title={item.subjectName}>
                                            {item.subjectName}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary" fontFamily="monospace" mb={3}>
                                            {item.subjectCode}
                                        </Typography>

                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                                            <Box>
                                                <Typography variant="caption" color="text.secondary" fontWeight="bold" textTransform="uppercase" letterSpacing={1} display="block" mb={0.5}>
                                                    Attendance
                                                </Typography>
                                                <Typography variant="h4" fontWeight="bold" color={getStatusColor(item.percentage)}>
                                                    {item.percentage}%
                                                </Typography>
                                            </Box>
                                            <Box sx={{ textAlign: 'right' }}>
                                                <Typography variant="caption" color="text.secondary" fontWeight="bold" textTransform="uppercase" letterSpacing={1} display="block" mb={0.5}>
                                                    Lectures
                                                </Typography>
                                                <Typography variant="h6" fontWeight="medium">
                                                    {item.attendedLectures} <Typography component="span" color="text.disabled" variant="body2">/</Typography> {item.totalLectures}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    </CardActionArea>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>
                )}

                {/* Detailed View Dialog */}
                <Dialog 
                    open={Boolean(selectedSubject)} 
                    onClose={() => setSelectedSubject(null)}
                    maxWidth="sm"
                    fullWidth
                    PaperProps={{ sx: { borderRadius: 3 } }}
                >
                    <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: 'primary.50', py: 2 }}>
                        <Typography variant="h6" fontWeight="bold" display="flex" alignItems="center" gap={1}>
                            <Calendar size={20} /> Detailed Report
                        </Typography>
                        <IconButton onClick={() => setSelectedSubject(null)} size="small" edge="end">
                            <X size={20} />
                        </IconButton>
                    </DialogTitle>
                    <DialogContent sx={{ p: 0 }}>
                        <TableContainer>
                            <Table stickyHeader>
                                <TableHead>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 'bold', bgcolor: 'background.default' }}>Date</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold', bgcolor: 'background.default', textAlign: 'right' }}>Status</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {details.map((d, i) => (
                                        <TableRow key={i} hover>
                                            <TableCell sx={{ fontFamily: 'monospace' }}>
                                                {new Date(d.date).toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                                            </TableCell>
                                            <TableCell sx={{ textAlign: 'right' }}>
                                                <Chip 
                                                    icon={d.status === 'Present' ? <CheckCircle size={14} /> : <XCircle size={14} />} 
                                                    label={d.status} 
                                                    size="small"
                                                    color={d.status === 'Present' ? 'success' : 'error'}
                                                    variant="outlined"
                                                    sx={{ fontWeight: 'bold', borderWidth: 2 }}
                                                />
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {details.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={2} align="center" sx={{ py: 6 }}>
                                                <Typography color="text.secondary" fontStyle="italic">
                                                    No attendance records found for this subject.
                                                </Typography>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </DialogContent>
                </Dialog>
            </Box>
        </Layout>
    );
};

export default StudentAttendance;
