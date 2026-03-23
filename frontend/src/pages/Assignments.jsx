import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Card, CardContent, Grid, Button, Dialog, DialogTitle,
    DialogContent, DialogActions, TextField, Select, MenuItem, FormControl,
    InputLabel, Chip, CircularProgress, IconButton, Table, TableBody,
    TableCell, TableContainer, TableHead, TableRow, Paper, FormHelperText,
    Alert
} from '@mui/material';
import { BookOpen, Plus, UploadCloud, CheckCircle, XCircle, Eye, Trash2, Calendar } from 'lucide-react';
import axios from 'axios';
import Layout from '../components/Layout';
import { format } from 'date-fns';

const Assignments = () => {
    const role = localStorage.getItem('role');
    const [assignments, setAssignments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState('');

    // Faculty: Create Assignment State
    const [openCreate, setOpenCreate] = useState(false);
    const [newAssignment, setNewAssignment] = useState({
        title: '', description: '', subjectId: '', semester: '', dueDate: ''
    });
    const [subjects, setSubjects] = useState([]);

    // Faculty: View Submissions State
    const [openSubmissions, setOpenSubmissions] = useState(false);
    const [selectedAssignment, setSelectedAssignment] = useState(null);
    const [submissions, setSubmissions] = useState([]);
    const [openReview, setOpenReview] = useState(false);
    const [reviewData, setReviewData] = useState({ id: '', status: '', remarks: '' });

    // Student: Upload State
    const [openUpload, setOpenUpload] = useState(false);
    const [uploadAssignment, setUploadAssignment] = useState(null);
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        fetchAssignments();
        if (role === 'Faculty') {
            fetchSubjects();
        }
    }, [role]);

    const fetchAssignments = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get('http://localhost:5000/api/assignments', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setAssignments(res.data);
        } catch (err) {
            console.error('Error fetching assignments:', err);
            setErrorMsg('Failed to fetch assignments.');
        } finally {
            setLoading(false);
        }
    };

    const fetchSubjects = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get('http://localhost:5000/api/subjects/faculty/subjects', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSubjects(res.data);
            if (res.data.length > 0) {
                setNewAssignment(prev => ({
                    ...prev,
                    subjectId: res.data[0]._id,
                    semester: res.data[0].semester
                }));
            }
        } catch (err) {
            console.error('Error fetching subjects');
        }
    };

    // FACULTY FUNCS
    const handleCreateAssignment = async () => {
        try {
            const token = localStorage.getItem('token');
            await axios.post('http://localhost:5000/api/assignments', newAssignment, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setOpenCreate(false);
            setNewAssignment({ title: '', description: '', subjectId: subjects.length ? subjects[0]._id : '', semester: subjects.length ? subjects[0].semester : '', dueDate: '' });
            fetchAssignments();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to create assignment');
        }
    };

    const handleViewSubmissions = async (assignment) => {
        setSelectedAssignment(assignment);
        setOpenSubmissions(true);
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`http://localhost:5000/api/assignments/${assignment._id}/submissions`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSubmissions(res.data);
        } catch (err) {
            alert('Failed to load submissions');
        }
    };

    const submitReview = async () => {
        if (reviewData.status === 'Rejected' && !reviewData.remarks.trim()) {
            return alert('Remarks are strictly required when rejecting a submission.');
        }
        try {
            const token = localStorage.getItem('token');
            await axios.patch(`http://localhost:5000/api/assignments/submissions/${reviewData.id}/review`, reviewData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setOpenReview(false);
            setReviewData({ id: '', status: '', remarks: '' });
            // Refresh submissions
            handleViewSubmissions(selectedAssignment);
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to review submission');
        }
    };

    // STUDENT FUNCS
    const handleFileChange = (e) => {
        const selected = e.target.files[0];
        if (!selected) return;
        
        // 5MB limit
        if (selected.size > 5 * 1024 * 1024) {
            alert('File size exceeds 5MB limit.');
            setFile(null);
            return;
        }

        // Wait... file format validation is strictly PDF, DOC, DOCX
        const allowedTypes = [
            'application/pdf', 
            'application/msword', 
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ];
        if (!allowedTypes.includes(selected.type)) {
            alert('Only PDF, DOC, and DOCX files are allowed.');
            setFile(null);
            return;
        }

        setFile(selected);
    };

    const handleUpload = async () => {
        if (!file) return alert('Please select a file.');
        setUploading(true);
        try {
            const token = localStorage.getItem('token');
            const formData = new FormData();
            formData.append('assignmentId', uploadAssignment._id);
            formData.append('file', file);

            await axios.post('http://localhost:5000/api/assignments/submissions', formData, {
                headers: { 
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            });
            setOpenUpload(false);
            setFile(null);
            fetchAssignments(); // refresh to see status
        } catch (err) {
            alert(err.response?.data?.message || 'Error uploading file.');
        } finally {
            setUploading(false);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Accepted': return 'success';
            case 'Rejected': return 'error';
            case 'Late': return 'warning';
            case 'Submitted': return 'primary';
            default: return 'default';
        }
    };

    // RENDERS
    if (loading) return (
        <Layout role={role}>
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
                <CircularProgress />
            </Box>
        </Layout>
    );

    return (
        <Layout role={role}>
            <Box sx={{ maxWidth: 1200, mx: 'auto', animation: 'fadeIn 0.5s ease-out' }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
                    <Box display="flex" alignItems="center" gap={2}>
                        <BookOpen size={32} color="#1976d2" />
                        <Typography variant="h4" fontWeight="bold">Assignments</Typography>
                    </Box>
                    {role === 'Faculty' && (
                        <Button variant="contained" startIcon={<Plus />} onClick={() => setOpenCreate(true)}>
                            Create Assignment
                        </Button>
                    )}
                </Box>

                {errorMsg && <Alert severity="error" sx={{ mb: 3 }}>{errorMsg}</Alert>}

                <Grid container spacing={3}>
                    {assignments.length === 0 ? (
                        <Grid size={{ xs: 12 }}>
                            <Typography color="text.secondary" textAlign="center" mt={5}>
                                No assignments found.
                            </Typography>
                        </Grid>
                    ) : (
                        assignments.map(assign => {
                            const isPastDue = new Date() > new Date(assign.dueDate);
                            return (
                                <Grid size={{ xs: 12, md: 6, lg: 4 }} key={assign._id}>
                                    <Card sx={{ borderRadius: 3, boxShadow: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
                                        <CardContent sx={{ flexGrow: 1 }}>
                                            <Typography variant="h6" fontWeight="bold" gutterBottom>
                                                {assign.title}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary" mb={2}>
                                                {assign.subjectId?.name || assign.subjectId} (Sem {assign.semester})
                                            </Typography>
                                            <Typography variant="body2" mb={3} sx={{
                                                display: '-webkit-box',
                                                WebkitLineClamp: 3,
                                                WebkitBoxOrient: 'vertical',
                                                overflow: 'hidden'
                                            }}>
                                                {assign.description}
                                            </Typography>
                                            <Box display="flex" alignItems="center" gap={1} mb={2}>
                                                <Calendar size={16} color={isPastDue ? '#d32f2f' : '#666'} />
                                                <Typography variant="body2" fontWeight="bold" color={isPastDue ? 'error.main' : 'text.secondary'}>
                                                    Due: {format(new Date(assign.dueDate), 'PPP')}
                                                </Typography>
                                            </Box>

                                            {/* Student specific info */}
                                            {role === 'Student' && (
                                                <Box mt={2} p={1.5} bgcolor="background.default" borderRadius={2}>
                                                    {assign.submission ? (
                                                        <>
                                                            <Box display="flex" justifyContent="space-between" alignItems="center">
                                                                <Typography variant="body2" fontWeight="bold">Status:</Typography>
                                                                <Chip size="small" label={assign.submission.status} color={getStatusColor(assign.submission.status)} />
                                                            </Box>
                                                            {assign.submission.status === 'Rejected' && (
                                                                <Typography variant="body2" color="error.main" mt={1}>
                                                                    <strong>Remarks:</strong> {assign.submission.remarks}
                                                                </Typography>
                                                            )}
                                                            {assign.submission.status !== 'Accepted' && (
                                                                <Button 
                                                                    size="small" 
                                                                    variant="outlined" 
                                                                    sx={{ mt: 2, width: '100%' }}
                                                                    onClick={() => { setUploadAssignment(assign); setOpenUpload(true); }}
                                                                >
                                                                    {assign.submission.status === 'Rejected' ? 'Re-upload Assignment' : 'Update Submission'}
                                                                </Button>
                                                            )}
                                                        </>
                                                    ) : (
                                                        <Button 
                                                            variant="contained" 
                                                            fullWidth 
                                                            startIcon={<UploadCloud size={18} />}
                                                            onClick={() => { setUploadAssignment(assign); setOpenUpload(true); }}
                                                        >
                                                            Upload Submission
                                                        </Button>
                                                    )}
                                                </Box>
                                            )}

                                            {/* Faculty specific info */}
                                            {role === 'Faculty' && (
                                                <Button 
                                                    variant="outlined" 
                                                    fullWidth 
                                                    sx={{ mt: 2 }} 
                                                    onClick={() => handleViewSubmissions(assign)}
                                                >
                                                    View Submissions
                                                </Button>
                                            )}
                                        </CardContent>
                                    </Card>
                                </Grid>
                            );
                        })
                    )}
                </Grid>

                {/* MODAL: Faculty Create Assignment */}
                <Dialog open={openCreate} onClose={() => setOpenCreate(false)} maxWidth="sm" fullWidth>
                    <DialogTitle>Create New Assignment</DialogTitle>
                    <DialogContent dividers>
                        <TextField
                            label="Assignment Title"
                            fullWidth size="small" sx={{ mb: 2, mt: 1 }}
                            value={newAssignment.title}
                            onChange={e => setNewAssignment({ ...newAssignment, title: e.target.value })}
                        />
                        <TextField
                            label="Description"
                            multiline rows={3}
                            fullWidth size="small" sx={{ mb: 2 }}
                            value={newAssignment.description}
                            onChange={e => setNewAssignment({ ...newAssignment, description: e.target.value })}
                        />
                        <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                            <InputLabel>Subject</InputLabel>
                            <Select
                                value={newAssignment.subjectId}
                                label="Subject"
                                onChange={e => {
                                    const selectedSub = subjects.find(s => s._id === e.target.value);
                                    setNewAssignment({ 
                                        ...newAssignment, 
                                        subjectId: e.target.value,
                                        semester: selectedSub ? selectedSub.semester : newAssignment.semester
                                    });
                                }}
                            >
                                {subjects.map(sub => (
                                    <MenuItem key={sub._id} value={sub._id}>{sub.name}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        <TextField
                            label="Semester"
                            type="number"
                            fullWidth size="small" sx={{ mb: 2 }}
                            value={newAssignment.semester}
                            InputProps={{ readOnly: true }}
                            onChange={e => setNewAssignment({ ...newAssignment, semester: e.target.value })}
                            helperText="Auto-filled based on selected subject"
                        />
                        <TextField
                            label="Due Date"
                            type="datetime-local"
                            InputLabelProps={{ shrink: true }}
                            fullWidth size="small" sx={{ mb: 2 }}
                            value={newAssignment.dueDate}
                            onChange={e => setNewAssignment({ ...newAssignment, dueDate: e.target.value })}
                        />
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setOpenCreate(false)}>Cancel</Button>
                        <Button variant="contained" onClick={handleCreateAssignment} disabled={!newAssignment.title || !newAssignment.dueDate || !newAssignment.subjectId}>Create</Button>
                    </DialogActions>
                </Dialog>

                {/* MODAL: Student Upload */}
                <Dialog open={openUpload} onClose={() => setOpenUpload(false)} maxWidth="sm" fullWidth>
                    <DialogTitle>Upload Submission</DialogTitle>
                    <DialogContent dividers>
                        {uploadAssignment && (
                            <Typography variant="body2" mb={2}>
                                Assignment: <strong>{uploadAssignment.title}</strong>
                            </Typography>
                        )}
                        <Box p={3} border="2px dashed #bbb" borderRadius={2} textAlign="center" bgcolor="background.default">
                            <input
                                type="file"
                                id="file-upload"
                                style={{ display: 'none' }}
                                accept=".pdf,.doc,.docx"
                                onChange={handleFileChange}
                            />
                            <label htmlFor="file-upload">
                                <Button component="span" variant="outlined" startIcon={<UploadCloud />}>
                                    Select File
                                </Button>
                            </label>
                            {file && (
                                <Typography variant="body2" color="primary" mt={2} fontWeight="bold">
                                    Selected: {file.name}
                                </Typography>
                            )}
                            <Typography variant="caption" display="block" color="text.secondary" mt={1}>
                                Max 5MB. PDF, DOC, DOCX only.
                            </Typography>
                        </Box>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setOpenUpload(false)} disabled={uploading}>Cancel</Button>
                        <Button variant="contained" onClick={handleUpload} disabled={!file || uploading}>
                            {uploading ? <CircularProgress size={24} color="inherit" /> : 'Upload'}
                        </Button>
                    </DialogActions>
                </Dialog>

                {/* MODAL: Faculty View Submissions */}
                <Dialog open={openSubmissions} onClose={() => setOpenSubmissions(false)} maxWidth="md" fullWidth>
                    <DialogTitle>Submissions for {selectedAssignment?.title}</DialogTitle>
                    <DialogContent dividers sx={{ p: 0 }}>
                        <TableContainer component={Paper} elevation={0}>
                            <Table>
                                <TableHead sx={{ bgcolor: 'background.default' }}>
                                    <TableRow>
                                        <TableCell>Student</TableCell>
                                        <TableCell>File</TableCell>
                                        <TableCell>Status</TableCell>
                                        <TableCell>Submit Date</TableCell>
                                        <TableCell align="center">Action</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {submissions.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} align="center">No submissions yet.</TableCell>
                                        </TableRow>
                                    ) : submissions.map(sub => (
                                        <TableRow key={sub._id}>
                                            <TableCell>
                                                <Typography variant="body2" fontWeight="bold">
                                                    {sub.studentId?.name || 'Unknown'}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    {sub.studentId?.loginId}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Button size="small" component="a" href={sub.fileUrl} target="_blank" rel="noopener noreferrer" startIcon={<Eye size={16} />}>
                                                    View
                                                </Button>
                                            </TableCell>
                                            <TableCell>
                                                <Chip size="small" label={sub.status} color={getStatusColor(sub.status)} />
                                                {sub.status === 'Rejected' && (
                                                    <Typography variant="caption" display="block" color="error.main">
                                                        {sub.remarks}
                                                    </Typography>
                                                )}
                                            </TableCell>
                                            <TableCell>{format(new Date(sub.updatedAt), 'PP p')}</TableCell>
                                            <TableCell align="center">
                                                <Box display="flex" justifyContent="center" gap={1}>
                                                    <IconButton size="small" color="success" onClick={() => {
                                                        setReviewData({ id: sub._id, status: 'Accepted', remarks: '' });
                                                        setOpenReview(true);
                                                    }}>
                                                        <CheckCircle size={20} />
                                                    </IconButton>
                                                    <IconButton size="small" color="error" onClick={() => {
                                                        setReviewData({ id: sub._id, status: 'Rejected', remarks: sub.remarks || '' });
                                                        setOpenReview(true);
                                                    }}>
                                                        <XCircle size={20} />
                                                    </IconButton>
                                                </Box>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setOpenSubmissions(false)}>Close</Button>
                    </DialogActions>
                </Dialog>

                {/* MODAL: Final Review Status */}
                <Dialog open={openReview} onClose={() => setOpenReview(false)} maxWidth="xs" fullWidth>
                    <DialogTitle>Confirm {reviewData.status}</DialogTitle>
                    <DialogContent dividers>
                        <TextField
                            label="Remarks / Feedback (Required if Rejection)"
                            multiline rows={3} fullWidth size="small"
                            value={reviewData.remarks}
                            onChange={e => setReviewData({ ...reviewData, remarks: e.target.value })}
                            error={reviewData.status === 'Rejected' && !reviewData.remarks.trim()}
                            helperText={reviewData.status === 'Rejected' && !reviewData.remarks.trim() ? "Remarks are required!" : ""}
                        />
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setOpenReview(false)}>Cancel</Button>
                        <Button 
                            variant="contained" 
                            color={reviewData.status === 'Rejected' ? 'error' : 'success'}
                            onClick={submitReview}
                            disabled={reviewData.status === 'Rejected' && !reviewData.remarks.trim()}
                        >
                            Confirm {reviewData.status}
                        </Button>
                    </DialogActions>
                </Dialog>

            </Box>
        </Layout>
    );
};

export default Assignments;
