import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
    Box, Typography, Card, Tabs, Tab, Button, TextField, 
    FormControl, InputLabel, Select, MenuItem, Table, TableBody, 
    TableCell, TableContainer, TableHead, TableRow, Paper, Chip,
    Dialog, DialogContent, Alert, Grid
} from '@mui/material';
import { FileText } from 'lucide-react';
import Layout from '../components/Layout';
import RequestTimeline from '../components/RequestTimeline';

const AcademicRequests = () => {
    const [requests, setRequests] = useState([]);
    const [requestType, setRequestType] = useState('');
    const [description, setDescription] = useState('');
    const [message, setMessage] = useState('');
    const [selectedRequestId, setSelectedRequestId] = useState(null);
    const [activeTab, setActiveTab] = useState(0); // 0: active, 1: archived
    
    const [studentSemester, setStudentSemester] = useState(1);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const fetchRequests = async () => {
        try {
            const token = localStorage.getItem('token');
            const isArchived = activeTab === 1;
            const res = await axios.get(`http://localhost:5000/api/requests/my-requests?archived=${isArchived}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setRequests(res.data);
        } catch (err) {
            console.error('Error fetching requests:', err);
        }
    };

    const fetchStudentProfile = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get('http://localhost:5000/api/users/me', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data && res.data.semester) {
                setStudentSemester(parseInt(res.data.semester, 10));
            }
        } catch (err) {
            console.error('Error fetching user profile:', err);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Submitted': return 'warning';
            case 'Faculty Approved': return 'info';
            case 'Approved': return 'success';
            case 'Rejected': return 'error';
            default: return 'default';
        }
    };

    useEffect(() => {
        fetchStudentProfile();
        fetchRequests();
    }, [activeTab]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        try {
            const token = localStorage.getItem('token');
            const payload = { requestType, description };

            if (requestType === 'Leave Application') {
                payload.startDate = startDate;
                payload.endDate = endDate;
            }

            await axios.post('http://localhost:5000/api/requests/create',
                payload,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setMessage('Request submitted successfully!');
            setRequestType('');
            setDescription('');
            setStartDate('');
            setEndDate('');
            fetchRequests();
            if (activeTab !== 0) setActiveTab(0);
        } catch (err) {
            setMessage(err.response?.data?.message || 'Error submitting request');
            console.error(err);
        }
    };

    const getAvailableRequestTypes = () => {
        const types = [
            { name: 'Bonafide Certificate', minSemester: 1 },
            { name: 'Leave Application', minSemester: 1 },
            { name: 'Attendance Correction Request', minSemester: 1 },
            { name: 'Re-evaluation Request', minSemester: 1 },
            { name: 'ID Card Replacement', minSemester: 1 },
            { name: 'Subject Change Request', minSemester: 3 },
            { name: 'Internship Approval', minSemester: 4 },
            { name: 'Project Topic Approval', minSemester: 4 },
            { name: 'Project Supervisor Change Request', minSemester: 4 },
            { name: 'Project Extension Request', minSemester: 4 },
        ];
        return types.filter(type => studentSemester >= type.minSemester);
    };

    return (
        <Layout role="Student" activeTab="requests">
            <Box sx={{ width: '100%', p: { xs: 2, md: 4 }, animation: 'fadeInUp 0.5s ease-out' }}>
                <Typography variant="h4" fontWeight="bold" display="flex" alignItems="center" gap={2} mb={4}>
                    <Box component="span" sx={{ p: 1, bgcolor: 'primary.50', borderRadius: 2, display: 'flex' }}>
                        <FileText size={28} className="text-primary-600" />
                    </Box>
                    Academic Requests
                </Typography>

                <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 4 }}>
                    <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)} textColor="primary" indicatorColor="primary">
                        <Tab label="Active Requests" />
                        <Tab label="Archived History" />
                    </Tabs>
                </Box>

                {/* Create Form */}
                {activeTab === 0 && (
                    <Card sx={{ p: 4, mb: 4, borderRadius: 3, boxShadow: 2 }}>
                        <Typography variant="h6" fontWeight="bold" mb={3}>Submit New Request</Typography>
                        
                        {message && (
                            <Alert severity={message.includes('success') ? 'success' : 'error'} sx={{ mb: 3 }}>
                                {message}
                            </Alert>
                        )}

                        <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                            <FormControl fullWidth variant="outlined" required>
                                <InputLabel>Request Type</InputLabel>
                                <Select
                                    value={requestType}
                                    onChange={(e) => setRequestType(e.target.value)}
                                    label="Request Type"
                                >
                                    <MenuItem value="" disabled><em>-- Select Academic Request Type --</em></MenuItem>
                                    {getAvailableRequestTypes().map((type, index) => (
                                        <MenuItem key={index} value={type.name}>{type.name}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>

                            {requestType === 'Leave Application' && (
                                <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', md: 'row' } }}>
                                    <TextField
                                        fullWidth
                                        label="Start Date"
                                        type="date"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                        InputLabelProps={{ shrink: true }}
                                        required
                                    />
                                    <TextField
                                        fullWidth
                                        label="End Date"
                                        type="date"
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                        InputLabelProps={{ shrink: true }}
                                        required
                                    />
                                </Box>
                            )}

                            <TextField
                                fullWidth
                                label="Description / Reason"
                                multiline
                                rows={4}
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Enter the reason for your academic request..."
                                required
                            />

                            <Box>
                                <Button type="submit" variant="contained" color="primary" size="large" sx={{ px: 4, py: 1.5, borderRadius: 2 }}>
                                    Submit Request
                                </Button>
                            </Box>
                        </Box>
                    </Card>
                )}

                {/* Requests List */}
                <Card sx={{ p: 0, borderRadius: 3, boxShadow: 2, overflow: 'hidden' }}>
                    <Box sx={{ p: 3, borderBottom: 1, borderColor: 'divider', bgcolor: 'background.paper' }}>
                        <Typography variant="h6" fontWeight="bold">
                            {activeTab === 0 ? 'My Active Requests' : 'Request History'}
                        </Typography>
                    </Box>

                    {requests.length === 0 ? (
                        <Box sx={{ p: 6, textAlign: 'center' }}>
                            <Typography color="text.secondary">
                                {activeTab === 0 ? 'No active requests.' : 'No archived history.'}
                            </Typography>
                        </Box>
                    ) : (
                        <TableContainer component={Paper} elevation={0}>
                            <Table>
                                <TableHead>
                                    <TableRow sx={{ bgcolor: 'action.hover' }}>
                                        <TableCell sx={{ fontWeight: 'bold' }}>Request ID</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold' }}>Type</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold' }}>Remarks</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold' }}>Submitted Date</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold' }}>Action</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {requests.map((req) => (
                                        <TableRow key={req.requestId} hover>
                                            <TableCell sx={{ fontFamily: 'monospace', color: 'text.secondary' }}>{req.requestId}</TableCell>
                                            <TableCell sx={{ fontWeight: 'medium' }}>{req.requestType}</TableCell>
                                            <TableCell>
                                                <Chip 
                                                    label={req.status} 
                                                    color={getStatusColor(req.status)} 
                                                    size="small" 
                                                    sx={{ fontWeight: 'bold', textTransform: 'uppercase', fontSize: '0.7rem' }} 
                                                />
                                            </TableCell>
                                            <TableCell sx={{ maxWidth: 200, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                {req.adminRemarks || req.facultyRemarks || '-'}
                                            </TableCell>
                                            <TableCell>{new Date(req.createdAt).toLocaleDateString()}</TableCell>
                                            <TableCell>
                                                <Button 
                                                    size="small" 
                                                    onClick={() => setSelectedRequestId(req.requestId)}
                                                    sx={{ fontWeight: 'bold' }}
                                                >
                                                    View Timeline
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    )}
                </Card>

                {/* Timeline Modal */}
                <Dialog 
                    open={Boolean(selectedRequestId)} 
                    onClose={() => setSelectedRequestId(null)}
                    maxWidth="md"
                    fullWidth
                    PaperProps={{ sx: { borderRadius: 3, bgcolor: 'transparent', boxShadow: 'none' } }}
                >
                    <DialogContent sx={{ p: 0 }}>
                        <RequestTimeline
                            requestId={selectedRequestId}
                            onClose={() => setSelectedRequestId(null)}
                        />
                    </DialogContent>
                </Dialog>
            </Box>
        </Layout>
    );
};

export default AcademicRequests;
