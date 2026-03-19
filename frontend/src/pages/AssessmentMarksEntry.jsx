import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { 
    Box, Typography, Button, Card, Table, TableBody, TableCell, TableContainer, 
    TableHead, TableRow, TextField, Chip, CircularProgress, Avatar
} from '@mui/material';
import { ArrowLeft, Save, Lock, User } from 'lucide-react';
import Layout from '../components/Layout';

const AssessmentMarksEntry = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const token = localStorage.getItem('token');

    const [assessment, setAssessment] = useState(null);
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchDetails();
    }, [id]);

    const fetchDetails = async () => {
        try {
            const res = await axios.get(`http://localhost:5000/api/assessments/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setAssessment(res.data.assessment);
            setStudents(res.data.students);
        } catch (err) {
            console.error(err);
            alert('Error loading assessment details');
            navigate('/faculty/assessments');
        } finally {
            setLoading(false);
        }
    };

    const handleMarkChange = (studentId, value) => {
        // Allow empty string to clear
        if (value === '') {
            updateStudentMark(studentId, '');
            return;
        }

        const numVal = parseFloat(value);
        if (isNaN(numVal)) return;
        if (numVal < 0) return; // Prevent negative

        updateStudentMark(studentId, numVal);
    };

    const updateStudentMark = (studentId, val) => {
        setStudents(prev => prev.map(s =>
            s._id === studentId ? { ...s, marksObtained: val } : s
        ));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const records = students
                .filter(s => s.marksObtained !== '' && s.marksObtained !== null && s.marksObtained !== undefined)
                .map(s => ({
                    studentId: s._id,
                    marksObtained: s.marksObtained
                }));

            // Validate Frontend Side too
            for (let r of records) {
                if (r.marksObtained > assessment.maxMarks) {
                    alert(`Error: Marks for some students exceed max marks (${assessment.maxMarks})`);
                    setSaving(false);
                    return;
                }
            }

            await axios.post(`http://localhost:5000/api/assessments/${id}/marks`,
                { marksData: records },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            alert('Marks saved successfully!');
            fetchDetails(); // Refresh
        } catch (err) {
            console.error(err);
            alert(err.response?.data?.message || 'Error saving marks');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return (
        <Layout role="Faculty" activeTab="assessments">
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
                <CircularProgress />
            </Box>
        </Layout>
    );

    if (!assessment) return (
        <Layout role="Faculty" activeTab="assessments">
            <Box sx={{ textAlign: 'center', py: 10 }}>
                <Typography color="text.secondary">Assessment not found</Typography>
            </Box>
        </Layout>
    );

    const isLocked = assessment.status === 'Locked';

    return (
        <Layout role="Faculty" activeTab="assessments">
            <Box sx={{ maxWidth: 1000, mx: 'auto', p: { xs: 2, md: 4 }, animation: 'fadeInUp 0.5s ease-out' }}>
                <Button
                    onClick={() => navigate('/faculty/assessments')}
                    startIcon={<ArrowLeft />}
                    sx={{ mb: 3, color: 'text.secondary', fontWeight: 'bold' }}
                >
                    Back to Assessments
                </Button>

                <Card sx={{ borderRadius: 3, boxShadow: 3, overflow: 'hidden' }}>
                    <Box sx={{ p: 4, borderBottom: 1, borderColor: 'divider', bgcolor: 'background.default', display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', alignItems: { md: 'center' }, gap: 3 }}>
                        <Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                                {isLocked && (
                                    <Chip 
                                        icon={<Lock size={14} />} 
                                        label="LOCKED" 
                                        size="small" 
                                        color="error" 
                                        sx={{ fontWeight: 'bold' }} 
                                    />
                                )}
                                <Typography variant="button" color="primary.main" sx={{ fontFamily: 'monospace', fontWeight: 'bold' }}>
                                    {assessment.type}
                                </Typography>
                            </Box>
                            <Typography variant="h5" fontWeight="bold" mb={0.5}>
                                {assessment.title}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                {assessment.subjectId?.name} ({assessment.subjectId?.code}) • Max Marks: <Typography component="span" fontWeight="bold" color="text.primary">{assessment.maxMarks}</Typography>
                            </Typography>
                        </Box>

                        {!isLocked && (
                            <Button
                                variant="contained"
                                color="success"
                                startIcon={<Save size={20} />}
                                onClick={handleSave}
                                disabled={saving}
                                sx={{ 
                                    fontWeight: 'bold', 
                                    px: 4, 
                                    py: 1.5,
                                    borderRadius: 2,
                                    boxShadow: 2,
                                    alignSelf: { xs: 'flex-start', md: 'auto' }
                                }}
                            >
                                {saving ? 'Saving...' : 'Save Marks'}
                            </Button>
                        )}
                    </Box>

                    <TableContainer sx={{ maxHeight: '60vh' }}>
                        <Table stickyHeader>
                            <TableHead>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 'bold', bgcolor: 'action.hover' }}>Student Name</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold', bgcolor: 'action.hover' }}>Roll No / Login ID</TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 'bold', bgcolor: 'action.hover', width: 250 }}>Marks Obtained</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {students.map((student) => {
                                    const isExceeding = student.marksObtained > assessment.maxMarks;
                                    return (
                                        <TableRow key={student._id} hover>
                                            <TableCell>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                    <Avatar sx={{ width: 32, height: 32, bgcolor: 'action.selected', color: 'text.secondary' }}>
                                                        <User size={16} />
                                                    </Avatar>
                                                    <Typography variant="body2" fontWeight="medium">
                                                        {student.name}
                                                    </Typography>
                                                </Box>
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2" color="text.secondary" fontFamily="monospace">
                                                    {student.loginId}
                                                </Typography>
                                            </TableCell>
                                            <TableCell align="right">
                                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 1.5 }}>
                                                    <TextField
                                                        type="number"
                                                        variant="outlined"
                                                        size="small"
                                                        disabled={isLocked}
                                                        value={student.marksObtained === undefined || student.marksObtained === null ? '' : student.marksObtained}
                                                        onChange={(e) => handleMarkChange(student._id, e.target.value)}
                                                        placeholder="-"
                                                        error={isExceeding}
                                                        sx={{ width: 100, '& input': { textAlign: 'right', fontFamily: 'monospace' } }}
                                                    />
                                                    <Typography variant="body2" color="text.secondary" fontFamily="monospace" sx={{ width: 40, textAlign: 'left' }}>
                                                        / {assessment.maxMarks}
                                                    </Typography>
                                                </Box>
                                                {isExceeding && (
                                                    <Typography color="error" variant="caption" display="block" textAlign="right" mt={0.5}>
                                                        Exceeds Max Marks
                                                    </Typography>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </TableContainer>

                    <Box sx={{ p: 2, bgcolor: 'action.hover', borderTop: 1, borderColor: 'divider', textAlign: 'center' }}>
                        <Typography variant="caption" color="text.secondary">
                            {students.length} students enrolled • {students.filter(s => s.marksObtained !== '' && s.marksObtained !== undefined && s.marksObtained !== null).length} marks entered
                        </Typography>
                    </Box>
                </Card>
            </Box>
        </Layout>
    );
};

export default AssessmentMarksEntry;
