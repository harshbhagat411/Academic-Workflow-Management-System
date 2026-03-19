import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
    Box, Typography, Card, CircularProgress, Paper, 
    TextField, MenuItem, Grid, Divider,
    List, ListItem, ListItemAvatar, Avatar, ListItemText, Chip 
} from '@mui/material';
import { Award, BookOpen, ListFilter, FileText } from 'lucide-react';
import Layout from '../components/Layout';

const StudentMarks = () => {
    const [semesters, setSemesters] = useState([]);
    const [selectedSemester, setSelectedSemester] = useState('');
    const [subjects, setSubjects] = useState([]);
    const [selectedSubject, setSelectedSubject] = useState('');
    const [assessments, setAssessments] = useState([]);
    const [loadingSubjects, setLoadingSubjects] = useState(false);
    const [loadingMarks, setLoadingMarks] = useState(false);

    const token = localStorage.getItem('token');

    // Load User Profile to get current Semester
    useEffect(() => {
        const fetchUser = async () => {
            try {
                const res = await axios.get('http://localhost:5000/api/users/me', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const currentSem = res.data.semester;
                if (currentSem) {
                    const semList = Array.from({ length: currentSem }, (_, i) => i + 1);
                    setSemesters(semList);
                }
            } catch (err) {
                console.error('Error fetching user profile:', err);
            }
        };
        fetchUser();
    }, [token]);

    // Fetch subjects when semester changes
    useEffect(() => {
        if (!selectedSemester) {
            setSubjects([]);
            setSelectedSubject('');
            setAssessments([]);
            return;
        }

        const fetchSubjects = async () => {
            setLoadingSubjects(true);
            try {
                console.log('Fetching subjects for semester:', selectedSemester);
                const res = await axios.get(`http://localhost:5000/api/subjects/student/list?semester=${selectedSemester}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                console.log('API Response:', res.data);
                setSubjects(res.data || []);
                // Reset subsequent filters
                setSelectedSubject('');
                setAssessments([]);
            } catch (err) {
                console.error(err);
                alert('Error loading subjects');
            } finally {
                setLoadingSubjects(false);
            }
        };

        fetchSubjects();
    }, [selectedSemester, token]);

    // Fetch marks when subject changes
    useEffect(() => {
        if (!selectedSubject) {
            setAssessments([]);
            return;
        }

        const fetchMarks = async () => {
            setLoadingMarks(true);
            try {
                const res = await axios.get(`http://localhost:5000/api/assessments/student/my-marks?subjectId=${selectedSubject}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                // Backend now returns object { subjectName, assessments: [] }
                setAssessments(res.data?.assessments || res.data || []);
            } catch (err) {
                console.error(err);
            } finally {
                setLoadingMarks(false);
            }
        };

        fetchMarks();
    }, [selectedSubject, token]);

    const calculatePercentage = () => {
        if (!assessments || assessments.length === 0) return 0;
        let totalObtained = 0;
        let totalMax = 0;
        assessments.forEach(a => {
            if (a?.status === 'Locked' && a?.marksObtained !== 'N/A' && a?.marksObtained != null) {
                totalObtained += parseFloat(a.marksObtained);
                totalMax += (a.maxMarks || 0);
            }
        });
        return totalMax > 0 ? ((totalObtained / totalMax) * 100).toFixed(1) : 0;
    };

    return (
        <Layout role="Student" activeTab="marks">
            <Box sx={{ maxWidth: 1000, mx: 'auto', p: { xs: 2, md: 4 }, animation: 'fadeInUp 0.5s ease-out' }}>
                <Typography variant="h4" fontWeight="bold" display="flex" alignItems="center" gap={2} mb={1}>
                    <Box component="span" sx={{ p: 1, bgcolor: 'warning.50', borderRadius: 2, display: 'flex' }}>
                        <Award size={32} className="text-warning-600" />
                    </Box>
                    My Performance
                </Typography>
                <Typography variant="body1" color="text.secondary" mb={4}>
                    Select semester and subject to view marks.
                </Typography>

                {/* Filters Section */}
                <Card sx={{ p: 3, mb: 4, borderRadius: 3, boxShadow: 2, bgcolor: 'background.paper' }}>
                    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>
                        <Box sx={{ flex: 1 }}>
                            <TextField
                                select
                                fullWidth
                                label="Select Semester"
                                value={selectedSemester}
                                onChange={(e) => setSelectedSemester(e.target.value)}
                            >
                                <MenuItem value=""><em>-- Choose Semester --</em></MenuItem>
                                {semesters?.map(sem => (
                                    <MenuItem key={sem} value={sem}>Semester {sem}</MenuItem>
                                ))}
                            </TextField>
                        </Box>

                        <Box sx={{ flex: 1 }}>
                            <TextField
                                select
                                fullWidth
                                label="Select Subject"
                                value={selectedSubject}
                                onChange={(e) => setSelectedSubject(e.target.value)}
                                disabled={!selectedSemester || loadingSubjects}
                            >
                                <MenuItem value=""><em>-- Choose Subject --</em></MenuItem>
                                {subjects?.length > 0 ? subjects.map(sub => (
                                    <MenuItem key={sub._id} value={sub._id}>{sub.name} ({sub.code})</MenuItem>
                                )) : <MenuItem disabled>No subjects available</MenuItem>}
                            </TextField>
                            {loadingSubjects && <Typography variant="caption" color="primary.main" mt={0.5} display="block">Loading subjects...</Typography>}
                        </Box>
                    </Box>
                </Card>

                {/* Assessments List / Empty State */}
                {loadingMarks ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
                        <CircularProgress color="warning" />
                    </Box>
                ) : !selectedSubject ? (
                    <Box sx={{ textAlign: 'center', py: 10, bgcolor: 'action.hover', borderRadius: 3, border: '1px dashed', borderColor: 'divider' }}>
                        <Avatar sx={{ mx: 'auto', mb: 2, bgcolor: 'background.paper', color: 'text.secondary', width: 64, height: 64 }}>
                            <ListFilter size={32} />
                        </Avatar>
                        <Typography color="text.secondary">Please select a subject to view assessments.</Typography>
                    </Box>
                ) : (!assessments || assessments.length === 0) ? (
                    <Box sx={{ textAlign: 'center', py: 10, bgcolor: 'action.hover', borderRadius: 3, border: '1px dashed', borderColor: 'divider' }}>
                        <Typography color="text.secondary">No assessments found for this subject.</Typography>
                    </Box>
                ) : (
                    <Box sx={{ animation: 'fadeInUp 0.5s ease-out' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Typography variant="h6" fontWeight="bold">Assessment Results</Typography>
                            <Typography variant="body2" color="text.secondary">
                                Overall Performance: <Typography component="span" fontWeight="bold" color="warning.main">{calculatePercentage()}%</Typography>
                            </Typography>
                        </Box>

                        <Paper sx={{ borderRadius: 3, overflow: 'hidden', border: 1, borderColor: 'divider' }} elevation={0}>
                            <List disablePadding>
                                {assessments?.map((assessment, index) => (
                                    <React.Fragment key={assessment?._id || index}>
                                        <ListItem sx={{ p: 3, display: 'flex', justifyContent: 'space-between', '&:hover': { bgcolor: 'action.hover' } }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                <ListItemAvatar>
                                                    <Avatar sx={{ 
                                                        bgcolor: assessment?.status === 'Locked' ? 'success.50' : 'action.selected', 
                                                        color: assessment?.status === 'Locked' ? 'success.main' : 'text.secondary' 
                                                    }}>
                                                        <FileText size={20} />
                                                    </Avatar>
                                                </ListItemAvatar>
                                                <ListItemText
                                                    primary={<Typography variant="subtitle1" fontWeight="bold">{assessment?.title || 'Unknown Assessment'}</Typography>}
                                                    secondary={
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                                                            <Chip label={assessment?.type || 'Other'} size="small" sx={{ fontSize: '0.7rem', fontWeight: 'medium', textTransform: 'uppercase' }} />
                                                            <Typography variant="caption" color="text.secondary">•</Typography>
                                                            <Typography variant="caption" color="text.secondary">Max: {assessment?.maxMarks || 0}</Typography>
                                                        </Box>
                                                    }
                                                />
                                            </Box>

                                            <Box sx={{ textAlign: 'right' }}>
                                                {assessment?.status === 'Locked' ? (
                                                    <Box>
                                                        <Typography variant="h5" fontWeight="bold" color="text.primary">
                                                            {assessment?.marksObtained !== 'N/A' && assessment?.marksObtained != null ? assessment.marksObtained : '-'}
                                                        </Typography>
                                                        <Typography variant="caption" color="text.secondary" fontWeight="bold" textTransform="uppercase">
                                                            Obtained
                                                        </Typography>
                                                    </Box>
                                                ) : (
                                                    <Chip 
                                                        label="Pending Release" 
                                                        size="small" 
                                                        variant="outlined" 
                                                        sx={{ fontFamily: 'monospace', color: 'text.secondary', borderColor: 'divider' }} 
                                                    />
                                                )}
                                            </Box>
                                        </ListItem>
                                        {index < (assessments?.length || 0) - 1 && <Divider component="li" />}
                                    </React.Fragment>
                                ))}
                            </List>
                        </Paper>
                    </Box>
                )}
            </Box>
        </Layout>
    );
};

export default StudentMarks;
