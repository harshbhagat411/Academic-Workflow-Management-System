import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Box, Typography, Button, Card, Grid, Chip, Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem, CircularProgress, Paper, IconButton } from '@mui/material';
import { Plus, BookOpen, Lock, Edit2, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';

const FacultyAssessments = () => {
    const [assessments, setAssessments] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const navigate = useNavigate();
    const token = localStorage.getItem('token');

    // Form State
    const [newItem, setNewItem] = useState({
        subjectId: '',
        type: 'Test',
        title: '',
        maxMarks: 100
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [assessmentsRes, subjectsRes] = await Promise.all([
                axios.get('http://localhost:5000/api/assessments/faculty/list', { headers: { Authorization: `Bearer ${token}` } }),
                axios.get('http://localhost:5000/api/subjects/faculty/subjects', { headers: { Authorization: `Bearer ${token}` } })
            ]);
            setAssessments(assessmentsRes.data);
            setSubjects(subjectsRes.data);
            if (subjectsRes.data.length > 0) {
                setNewItem(prev => ({ ...prev, subjectId: subjectsRes.data[0]._id }));
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            await axios.post('http://localhost:5000/api/assessments/create', newItem, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setShowCreateModal(false);
            fetchData();
            // Reset form (keep subjectId)
            setNewItem(prev => ({ ...prev, title: '', maxMarks: 100 }));
            alert('Assessment created successfully!');
        } catch (err) {
            alert(err.response?.data?.message || 'Error creating assessment');
        }
    };

    const handleLock = async (id, title) => {
        if (!window.confirm(`Are you sure you want to LOCK "${title}"? Marks cannot be edited after locking.`)) return;

        try {
            await axios.put(`http://localhost:5000/api/assessments/${id}/lock`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchData();
        } catch (err) {
            alert('Error locking assessment');
        }
    };

    const getStatusProps = (status) => {
        return status === 'Locked'
            ? { color: 'error', variant: 'outlined' }
            : { color: 'success', variant: 'outlined' };
    };

    return (
        <Layout role="Faculty" activeTab="assessments">
            <Box sx={{ maxWidth: 1200, mx: 'auto', p: { xs: 2, md: 4 }, animation: 'fadeInUp 0.5s ease-out' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, flexWrap: 'wrap', gap: 2 }}>
                    <Box>
                        <Typography variant="h4" fontWeight="bold" display="flex" alignItems="center" gap={1.5} mb={1}>
                            <FileText color="#2196f3" size={32} />
                            Assessments
                        </Typography>
                        <Typography color="text.secondary">Manage tests, quizzes, and marks.</Typography>
                    </Box>
                    <Button
                        variant="contained"
                        color="primary"
                        startIcon={<Plus />}
                        onClick={() => setShowCreateModal(true)}
                        sx={{ fontWeight: 'bold', borderRadius: 2, px: 3, py: 1.5 }}
                    >
                        Create Assessment
                    </Button>
                </Box>

                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
                        <CircularProgress />
                    </Box>
                ) : assessments.length === 0 ? (
                    <Paper variant="outlined" sx={{ p: 6, textAlign: 'center', borderRadius: 3, borderStyle: 'dashed' }}>
                        <Box sx={{ bgcolor: 'action.hover', p: 2, borderRadius: '50%', display: 'inline-block', mb: 2 }}>
                            <FileText size={40} color="gray" />
                        </Box>
                        <Typography variant="h6" fontWeight="bold" mb={1}>No Assessments Created</Typography>
                        <Typography color="text.secondary">Click the button above to create one.</Typography>
                    </Paper>
                ) : (
                    <Grid container spacing={3}>
                        {assessments.map((item) => (
                            <Grid item xs={12} key={item._id}>
                                <Card sx={{ 
                                    borderRadius: 3, 
                                    boxShadow: 2, 
                                    transition: 'all 0.3s',
                                    '&:hover': { transform: 'translateY(-2px)', boxShadow: 4 },
                                    display: 'flex',
                                    flexDirection: { xs: 'column', md: 'row' },
                                    alignItems: { xs: 'flex-start', md: 'center' },
                                    justifyContent: 'space-between',
                                    p: 3,
                                    gap: 3
                                }}>
                                    <Box flex={1}>
                                        <Box display="flex" alignItems="center" gap={1.5} mb={1.5}>
                                            <Chip label={item.status} size="small" {...getStatusProps(item.status)} sx={{ fontWeight: 'bold' }} />
                                            <Chip label={item.type} size="small" sx={{ fontFamily: 'monospace' }} />
                                        </Box>
                                        <Typography variant="h6" fontWeight="bold" mb={1}>{item.title}</Typography>
                                        <Box display="flex" alignItems="center" gap={2} flexWrap="wrap" color="text.secondary" variant="body2">
                                            <Typography variant="body2" display="flex" alignItems="center" gap={0.5}>
                                                <BookOpen size={16} /> {item.subjectId?.name} ({item.subjectId?.code})
                                            </Typography>
                                            <Typography variant="body2">•</Typography>
                                            <Typography variant="body2">Max Marks: {item.maxMarks}</Typography>
                                            <Typography variant="body2">•</Typography>
                                            <Typography variant="body2">{new Date(item.createdAt).toLocaleDateString()}</Typography>
                                        </Box>
                                    </Box>

                                    <Box display="flex" alignItems="center" gap={2} width={{ xs: '100%', md: 'auto' }}>
                                        <Button
                                            fullWidth={false}
                                            variant="contained"
                                            color={item.status === 'Locked' ? 'primary' : 'inherit'}
                                            onClick={() => navigate(`/faculty/assessments/${item._id}`)}
                                            startIcon={item.status === 'Locked' ? <BookOpen size={18} /> : <Edit2 size={18} />}
                                            sx={{ fontWeight: 'bold', py: 1.5, px: 3, borderRadius: 2, flex: { xs: 1, md: 'none' }, bgcolor: item.status !== 'Locked' ? 'action.selected' : undefined, color: item.status !== 'Locked' ? 'text.primary' : undefined }}
                                        >
                                            {item.status === 'Locked' ? 'View Marks' : 'Enter Marks'}
                                        </Button>
                                        {item.status !== 'Locked' && (
                                            <IconButton
                                                color="error"
                                                onClick={() => handleLock(item._id, item.title)}
                                                title="Lock Assessment"
                                                sx={{ 
                                                    border: '1px solid', 
                                                    borderColor: 'error.main', 
                                                    borderRadius: 2,
                                                    p: 1.5,
                                                    bgcolor: 'error.main',
                                                    color: 'white',
                                                    '&:hover': { bgcolor: 'error.dark' }
                                                }}
                                            >
                                                <Lock size={20} />
                                            </IconButton>
                                        )}
                                    </Box>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>
                )}

                <Dialog open={showCreateModal} onClose={() => setShowCreateModal(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3, bgcolor: 'background.paper', backgroundImage: 'none' } }}>
                    <form onSubmit={handleCreate}>
                        <DialogTitle sx={{ fontWeight: 'bold', borderBottom: 1, borderColor: 'divider', pb: 2 }}>
                            Create Assessment
                        </DialogTitle>
                        <DialogContent sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 3, pt: '24px !important' }}>
                            <TextField
                                select
                                label="Subject"
                                fullWidth
                                variant="outlined"
                                value={newItem.subjectId}
                                onChange={e => setNewItem({ ...newItem, subjectId: e.target.value })}
                                required
                            >
                                {subjects.map(s => <MenuItem key={s._id} value={s._id}>{s.name} ({s.code})</MenuItem>)}
                            </TextField>

                            <TextField
                                select
                                label="Type"
                                fullWidth
                                variant="outlined"
                                value={newItem.type}
                                onChange={e => setNewItem({ ...newItem, type: e.target.value })}
                            >
                                {['Test', 'Quiz', 'Assignment', 'Mid-Term', 'Final', 'Project'].map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                            </TextField>

                            <TextField
                                label="Title"
                                fullWidth
                                variant="outlined"
                                placeholder="e.g., Unit Test 1"
                                value={newItem.title}
                                onChange={e => setNewItem({ ...newItem, title: e.target.value })}
                                required
                            />

                            <TextField
                                label="Max Marks"
                                type="number"
                                fullWidth
                                variant="outlined"
                                inputProps={{ min: 1 }}
                                value={newItem.maxMarks}
                                onChange={e => setNewItem({ ...newItem, maxMarks: parseInt(e.target.value) })}
                                required
                            />
                        </DialogContent>
                        <DialogActions sx={{ p: 3, borderTop: 1, borderColor: 'divider' }}>
                            <Button onClick={() => setShowCreateModal(false)} variant="text" color="inherit" sx={{ fontWeight: 'bold' }}>
                                Cancel
                            </Button>
                            <Button type="submit" variant="contained" color="primary" sx={{ fontWeight: 'bold', px: 4 }}>
                                Create
                            </Button>
                        </DialogActions>
                    </form>
                </Dialog>
            </Box>
        </Layout>
    );
};

export default FacultyAssessments;
