import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
    Box, Typography, Tabs, Tab, Card, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, 
    Button, TextField, Chip, Alert, Dialog, Paper, IconButton, CircularProgress
} from '@mui/material';
import { FileText, CheckCircle, XCircle, X as Close, History, Clock } from 'lucide-react';
import Layout from '../components/Layout';
import RequestTimeline from '../components/RequestTimeline';

const FacultyRequests = () => {
    const [requests, setRequests] = useState([]);
    const [remarksInput, setRemarksInput] = useState({});
    const [message, setMessage] = useState('');
    const [selectedRequestId, setSelectedRequestId] = useState(null);
    const [activeTab, setActiveTab] = useState('pending');
    const [loading, setLoading] = useState(true);

    const fetchRequests = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const isArchived = activeTab === 'history';

            const url = isArchived
                ? 'http://localhost:5000/api/requests/history'
                : 'http://localhost:5000/api/requests/all';

            const res = await axios.get(url, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setRequests(res.data);
        } catch (err) {
            console.error('Error fetching requests:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, [activeTab]);

    const handleRemarkChange = (reqId, value) => {
        setRemarksInput(prev => ({ ...prev, [reqId]: value }));
    };

    const handleAction = async (requestId, status) => {
        const remarks = remarksInput[requestId];
        if (!remarks) {
            setMessage(`Please enter remarks to ${status === 'Faculty Approved' ? 'Approve' : 'Reject'}`);
            return;
        }

        try {
            const token = localStorage.getItem('token');
            await axios.put(`http://localhost:5000/api/requests/${requestId}/status`,
                { status, remarks },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setMessage(`Request ${status} successfully`);
            setRemarksInput(prev => ({ ...prev, [requestId]: '' }));
            fetchRequests();
        } catch (err) {
            console.error('Error updating status:', err);
            setMessage('Error updating request status');
        }
    };

    const getStatusProps = (status) => {
        switch (status) {
            case 'Submitted': return { color: 'warning', variant: 'outlined' };
            case 'Faculty Approved': return { color: 'info', variant: 'outlined' };
            case 'Approved': return { color: 'success', variant: 'outlined' };
            case 'Rejected': return { color: 'error', variant: 'outlined' };
            default: return { color: 'default', variant: 'outlined' };
        }
    };

    return (
        <Layout role="Faculty" activeTab="requests">
            <Box sx={{ maxWidth: 1200, mx: 'auto', p: { xs: 2, md: 4 }, animation: 'fadeInUp 0.5s ease-out' }}>
                <Box sx={{ mb: 4, display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Typography variant="h4" fontWeight="bold" display="flex" alignItems="center" gap={1.5}>
                        <FileText color="#2196f3" size={32} />
                        Review Academic Requests
                    </Typography>
                    <Typography color="text.secondary">Review and approve or reject student academic requests.</Typography>
                </Box>

                {message && (
                    <Alert severity={message.includes('successfully') ? 'success' : 'error'} sx={{ mb: 4, borderRadius: 2 }} onClose={() => setMessage('')}>
                        {message}
                    </Alert>
                )}

                <Card sx={{ borderRadius: 3, boxShadow: 3, overflow: 'hidden' }}>
                    <Box sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: 'background.default' }}>
                        <Tabs 
                            value={activeTab} 
                            onChange={(e, newValue) => setActiveTab(newValue)} 
                            indicatorColor="primary" 
                            textColor="primary"
                            variant="fullWidth"
                        >
                            <Tab 
                                icon={<Clock size={20} />} 
                                iconPosition="start" 
                                label="Pending Review" 
                                value="pending" 
                                sx={{ fontWeight: 'bold', py: 2 }}
                            />
                            <Tab 
                                icon={<History size={20} />} 
                                iconPosition="start" 
                                label="My Reviewed History" 
                                value="history" 
                                sx={{ fontWeight: 'bold', py: 2 }}
                            />
                        </Tabs>
                    </Box>

                    {loading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
                            <CircularProgress />
                        </Box>
                    ) : (
                        <TableContainer sx={{ maxHeight: '70vh' }}>
                            <Table stickyHeader>
                                <TableHead>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 'bold', bgcolor: 'action.hover' }}>Request ID</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold', bgcolor: 'action.hover' }}>Student</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold', bgcolor: 'action.hover' }}>Type & Description</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold', bgcolor: 'action.hover' }}>Status</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold', bgcolor: 'action.hover', width: '30%' }}>Action & Remarks</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {requests.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} align="center" sx={{ py: 8 }}>
                                                <Typography color="text.secondary">No requests found.</Typography>
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        requests.map((item) => {
                                            const isHistory = activeTab === 'history';
                                            const request = isHistory ? item.requestDetails : item;
                                            const displayStatus = isHistory ? item.action : item.status;
                                            const displayRemarks = isHistory ? item.remarks : item.facultyRemarks;
                                            const displayDate = isHistory ? item.actionDate : item.createdAt;

                                            return (
                                                <TableRow key={item.requestId || item.auditId} hover sx={{ '& > td': { verticalAlign: 'top', py: 3 } }}>
                                                    <TableCell sx={{ fontFamily: 'monospace' }}>
                                                        <Box sx={{ fontWeight: 'medium', mb: 1 }}>{request.requestId}</Box>
                                                        <Button 
                                                            variant="text" 
                                                            size="small" 
                                                            onClick={() => setSelectedRequestId(request.requestId)}
                                                            sx={{ 
                                                                p: 0, 
                                                                minWidth: 0, 
                                                                textTransform: 'none',
                                                                fontWeight: 'bold'
                                                            }}
                                                        >
                                                            View Timeline
                                                        </Button>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Typography variant="body2" fontWeight="bold" color="text.primary">
                                                            {request.studentId?.name || 'Unknown'}
                                                        </Typography>
                                                        <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>
                                                            {request.studentId?.loginId}
                                                        </Typography>
                                                        <Typography variant="caption" color="text.disabled" display="block">
                                                            {isHistory ? 'Action Date: ' : 'Submitted: '}
                                                            {new Date(displayDate).toLocaleDateString()}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Typography variant="body2" fontWeight="bold" mb={0.5}>
                                                            {request.requestType}
                                                        </Typography>
                                                        <Typography variant="body2" color="text.secondary" sx={{ display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                                            {request.description}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Chip 
                                                            label={displayStatus} 
                                                            size="small" 
                                                            {...getStatusProps(displayStatus)} 
                                                            sx={{ fontWeight: 'bold' }} 
                                                        />
                                                    </TableCell>
                                                    <TableCell>
                                                        {!isHistory ? (
                                                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                                                                <TextField
                                                                    placeholder="Enter remarks (Mandatory)..."
                                                                    multiline
                                                                    rows={2}
                                                                    variant="outlined"
                                                                    size="small"
                                                                    fullWidth
                                                                    value={remarksInput[request.requestId] || ''}
                                                                    onChange={(e) => handleRemarkChange(request.requestId, e.target.value)}
                                                                />
                                                                <Box display="flex" gap={1}>
                                                                    <Button
                                                                        variant="contained"
                                                                        color="success"
                                                                        size="small"
                                                                        fullWidth
                                                                        startIcon={<CheckCircle size={16} />}
                                                                        onClick={() => handleAction(request.requestId, 'Faculty Approved')}
                                                                        sx={{ fontWeight: 'bold', boxShadow: 2 }}
                                                                    >
                                                                        Approve
                                                                    </Button>
                                                                    <Button
                                                                        variant="contained"
                                                                        color="error"
                                                                        size="small"
                                                                        fullWidth
                                                                        startIcon={<XCircle size={16} />}
                                                                        onClick={() => handleAction(request.requestId, 'Rejected')}
                                                                        sx={{ fontWeight: 'bold', boxShadow: 2 }}
                                                                    >
                                                                        Reject
                                                                    </Button>
                                                                </Box>
                                                            </Box>
                                                        ) : (
                                                            <Box>
                                                                <Typography variant="caption" fontWeight="bold" color="text.primary" display="block">
                                                                    My Remarks:
                                                                </Typography>
                                                                <Typography variant="body2" color="text.secondary" fontStyle="italic" mb={1}>
                                                                    "{displayRemarks}"
                                                                </Typography>
                                                                {request.isFacultyDelayed && (
                                                                    <Chip 
                                                                        label="⚠ Delayed" 
                                                                        size="small" 
                                                                        color="warning" 
                                                                        variant="outlined"
                                                                        sx={{ fontWeight: 'bold', fontSize: '0.7rem', height: 20 }}
                                                                    />
                                                                )}
                                                            </Box>
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    )}
                </Card>

                <Dialog 
                    open={!!selectedRequestId} 
                    onClose={() => setSelectedRequestId(null)}
                    maxWidth="md"
                    fullWidth
                    PaperProps={{ sx: { borderRadius: 3, bgcolor: 'background.paper', backgroundImage: 'none' } }}
                >
                    <Box sx={{ position: 'relative' }}>
                        <IconButton 
                            onClick={() => setSelectedRequestId(null)} 
                            sx={{ position: 'absolute', right: 8, top: 8, zIndex: 1, bgcolor: 'background.default' }}
                        >
                            <Close size={20} />
                        </IconButton>
                        <RequestTimeline
                            requestId={selectedRequestId}
                            onClose={() => setSelectedRequestId(null)}
                        />
                    </Box>
                </Dialog>
            </Box>
        </Layout>
    );
};

export default FacultyRequests;
