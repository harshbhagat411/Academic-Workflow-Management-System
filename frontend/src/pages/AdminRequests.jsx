import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    Box, Typography, Card, CardContent, Tabs, Tab, FormControlLabel, Checkbox,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
    TextField, Button as MuiButton, Chip, Alert, Dialog, InputAdornment, FormControl, Select, MenuItem, InputLabel
} from '@mui/material';
import { Search } from 'lucide-react';
import RequestTimeline from '../components/RequestTimeline';
import Layout from '../components/Layout';

const AdminRequests = () => {
    const [requests, setRequests] = useState([]);
    const [message, setMessage] = useState('');
    const [actionState, setActionState] = useState({});
    const [selectedRequestId, setSelectedRequestId] = useState(null);
    const [activeTab, setActiveTab] = useState('pending');
    const [showDelayedOnly, setShowDelayedOnly] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');

    const fetchRequests = async () => {
        try {
            const token = localStorage.getItem('token');
            const isArchived = activeTab === 'history';
            const url = `http://localhost:5000/api/requests/admin/all?archived=${isArchived}`;

            const res = await axios.get(url, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setRequests(res.data);
        } catch (err) {
            console.error('Error fetching admin requests:', err);
        }
    };
    useEffect(() => {
        fetchRequests();
    }, [activeTab]);

    const handleAction = async (requestId, status) => {
        const remarks = actionState[requestId]?.remarks;

        if (!remarks) {
            setMessage(`Error: Remarks are mandatory to ${status} request.`);
            return;
        }

        try {
            const token = localStorage.getItem('token');
            await axios.put(`http://localhost:5000/api/requests/admin/${requestId}/status`,
                { status, remarks },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setMessage(`Request ${status} successfully!`);
            setActionState({ ...actionState, [requestId]: { remarks: '' } });
            fetchRequests();
        } catch (err) {
            console.error('Error updating status:', err);
            setMessage('Error updating status. Please try again.');
        }
    };

    const handleRemarkChange = (requestId, value) => {
        setActionState({
            ...actionState,
            [requestId]: { ...actionState[requestId], remarks: value }
        });
    };

    const filteredRequests = React.useMemo(() => {
        return requests.filter(r => {
            const matchesDelay = showDelayedOnly ? (r.isFacultyDelayed || r.isAdminDelayed) : true;
            
            const matchesSearch = searchTerm === '' || 
                (r.studentId?.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                (r.requestType?.toLowerCase() || '').includes(searchTerm.toLowerCase());
                
            const matchesStatus = statusFilter === 'All' || r.status === statusFilter;
            
            return matchesDelay && matchesSearch && matchesStatus;
        });
    }, [requests, showDelayedOnly, searchTerm, statusFilter]);

    return (
        <Layout role="Admin">
            <Box sx={{ p: { xs: 2, md: 4 }, width: '100%', animation: 'fadeInUp 0.5s ease-out' }}>
                <Typography variant="h4" fontWeight="bold" mb={4}>
                Manage Academic Requests
            </Typography>

            {message && (
                <Alert severity={message.includes('Error') ? 'error' : 'success'} sx={{ mb: 4 }}>
                    {message}
                </Alert>
            )}

            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', lg: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'stretch', lg: 'flex-end' }, mb: 3, gap: 2 }}>
                <Tabs 
                    value={activeTab} 
                    onChange={(e, newValue) => setActiveTab(newValue)} 
                    indicatorColor="primary" 
                    textColor="primary"
                    sx={{ borderBottom: 1, borderColor: 'divider' }}
                >
                    <Tab label="Pending Approval" value="pending" sx={{ fontWeight: 'bold' }} />
                    <Tab label="All Request History" value="history" sx={{ fontWeight: 'bold' }} />
                </Tabs>

                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, alignItems: 'center' }}>
                    <TextField
                        placeholder="Search student or type..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        variant="outlined"
                        size="small"
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <Search size={18} />
                                </InputAdornment>
                            ),
                        }}
                        sx={{ width: { xs: '100%', sm: 220 } }}
                    />

                    <FormControl size="small" sx={{ minWidth: 150 }}>
                        <InputLabel>Status</InputLabel>
                        <Select
                            value={statusFilter}
                            label="Status"
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            <MenuItem value="All"><em>All</em></MenuItem>
                            <MenuItem value="Submitted">Submitted</MenuItem>
                            <MenuItem value="Approved">Approved</MenuItem>
                            <MenuItem value="Rejected">Rejected</MenuItem>
                        </Select>
                    </FormControl>

                    <Card variant="outlined" sx={{ px: 2, py: 0.5, borderRadius: 2 }}>
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={showDelayedOnly}
                                    onChange={(e) => setShowDelayedOnly(e.target.checked)}
                                    color="primary"
                                />
                            }
                            label={<Typography variant="body2" fontWeight="medium">Show Delayed Only</Typography>}
                            sx={{ m: 0 }}
                        />
                    </Card>
                </Box>
            </Box>

            <Card sx={{ borderRadius: 2, boxShadow: 3 }}>
                <CardContent sx={{ p: 0 }}>
                    <Box sx={{ p: 3, borderBottom: '1px solid', borderColor: 'divider' }}>
                        <Typography variant="h6" fontWeight="bold">
                            {activeTab === 'pending' ? 'Pending Final Approval' : 'Historical Record of All Requests'}
                        </Typography>
                    </Box>

                    {filteredRequests.length === 0 ? (
                        <Box sx={{ py: 8, textAlign: 'center' }}>
                            <Typography color="text.secondary">
                                {showDelayedOnly
                                    ? 'No delayed requests found.'
                                    : (activeTab === 'pending' ? 'No requests pending.' : 'No history found.')}
                            </Typography>
                        </Box>
                    ) : (
                        <TableContainer>
                            <Table sx={{ minWidth: 800 }}>
                                <TableHead sx={{ bgcolor: 'action.hover' }}>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 'bold' }}>Request ID</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold' }}>Student</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold' }}>Type</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold', width: '20%' }}>Faculty Remarks</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold', width: '25%' }}>
                                            {activeTab === 'pending' ? 'Your Remarks (Mandatory)' : 'Status / Remarks'}
                                        </TableCell>
                                        <TableCell sx={{ fontWeight: 'bold' }}>Action</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {filteredRequests.map((req) => (
                                        <TableRow key={req.requestId} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                                            <TableCell>
                                                <Typography variant="body2" fontFamily="monospace" fontWeight="medium">
                                                    {req.requestId}
                                                </Typography>
                                                <MuiButton
                                                    size="small"
                                                    variant="text"
                                                    onClick={() => setSelectedRequestId(req.requestId)}
                                                    sx={{ mt: 1, p: 0, minWidth: 'auto', textTransform: 'none', fontSize: '0.75rem' }}
                                                >
                                                    View Timeline
                                                </MuiButton>

                                                <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                                    {req.isFacultyDelayed && (
                                                        <Chip label="⚠ Faculty Delayed" color="error" size="small" variant="outlined" sx={{ height: 20, fontSize: '0.65rem', fontWeight: 'bold' }} />
                                                    )}
                                                    {req.isAdminDelayed && (
                                                        <Chip label="⚠ Admin Delayed" color="warning" size="small" variant="outlined" sx={{ height: 20, fontSize: '0.65rem', fontWeight: 'bold' }} />
                                                    )}
                                                </Box>
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2" fontWeight="bold">{req.studentId?.name}</Typography>
                                                <Typography variant="caption" color="text.secondary">{req.studentId?.loginId}</Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2" fontWeight="bold">{req.requestType}</Typography>
                                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', maxWidth: 200, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={req.description}>
                                                    {req.description}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2" color="text.secondary" fontStyle="italic">
                                                    "{req.facultyRemarks}"
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                {activeTab === 'pending' ? (
                                                    <TextField
                                                        fullWidth
                                                        multiline
                                                        rows={2}
                                                        size="small"
                                                        placeholder="Enter final remarks..."
                                                        value={actionState[req.requestId]?.remarks || ''}
                                                        onChange={(e) => handleRemarkChange(req.requestId, e.target.value)}
                                                    />
                                                ) : (
                                                    <Box>
                                                        <Typography variant="body2" fontWeight="bold" color={
                                                            req.status === 'Approved' ? 'success.main' :
                                                            req.status === 'Rejected' ? 'error.main' : 'text.primary'
                                                        }>
                                                            {req.status}
                                                        </Typography>
                                                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                                                            {req.adminRemarks ? (
                                                                `Admin: "${req.adminRemarks}"`
                                                            ) : req.status === 'Rejected' && !req.adminActionDate ? (
                                                                <Typography component="span" variant="caption" color="error.main" fontWeight="medium">
                                                                    Faculty Rejected Request
                                                                </Typography>
                                                            ) : (
                                                                'Pending Admin Action'
                                                            )}
                                                        </Typography>
                                                    </Box>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {activeTab === 'pending' ? (
                                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, minWidth: 100 }}>
                                                        <MuiButton
                                                            variant="contained"
                                                            color="success"
                                                            size="small"
                                                            onClick={() => handleAction(req.requestId, 'Approved')}
                                                        >
                                                            Approve
                                                        </MuiButton>
                                                        <MuiButton
                                                            variant="contained"
                                                            color="error"
                                                            size="small"
                                                            onClick={() => handleAction(req.requestId, 'Rejected')}
                                                        >
                                                            Reject
                                                        </MuiButton>
                                                    </Box>
                                                ) : (
                                                    <Typography variant="caption" color="text.secondary" fontStyle="italic">
                                                        Read Only
                                                    </Typography>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    )}
                </CardContent>
            </Card>

            <Dialog
                open={!!selectedRequestId}
                onClose={() => setSelectedRequestId(null)}
                maxWidth="md"
                fullWidth
            >
                <Box sx={{ p: 2 }}>
                    {selectedRequestId && (
                        <RequestTimeline
                            requestId={selectedRequestId}
                            onClose={() => setSelectedRequestId(null)}
                        />
                    )}
                </Box>
            </Dialog>
            </Box>
        </Layout>
    );
};

export default AdminRequests;
