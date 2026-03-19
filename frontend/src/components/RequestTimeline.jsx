import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
    Box, Typography, CircularProgress, Alert, IconButton, Paper, Divider
} from '@mui/material';
import { Close as CloseIcon, Circle as CircleIcon } from '@mui/icons-material';

const RequestTimeline = ({ requestId, onClose }) => {
    const [audits, setAudits] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchAudit = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await axios.get(`http://localhost:5000/api/requests/${requestId}/audit`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setAudits(res.data);
                setLoading(false);
            } catch (err) {
                console.error('Error fetching audit trail:', err);
                setError('Failed to load timeline.');
                setLoading(false);
            }
        };

        if (requestId) {
            fetchAudit();
        }
    }, [requestId]);

    if (loading) {
        return (
            <Box sx={{ p: 4, display: 'flex', justifyContent: 'center' }}>
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Box sx={{ p: 4 }}>
                <Alert severity="error">{error}</Alert>
            </Box>
        );
    }

    return (
        <Box sx={{ p: 4, position: 'relative' }}>
            <IconButton 
                onClick={onClose} 
                sx={{ position: 'absolute', top: 16, right: 16, color: 'text.secondary', bgcolor: 'grey.100', '&:hover': { bgcolor: 'grey.200' } }}
            >
                <CloseIcon />
            </IconButton>

            <Typography variant="h5" fontWeight="bold" gutterBottom>
                Request Timeline
            </Typography>
            <Divider sx={{ mb: 4 }} />

            <Box sx={{ position: 'relative', ml: 2, borderLeft: 2, borderColor: 'divider', pl: 3 }}>
                {audits.length === 0 ? (
                    <Typography color="text.secondary">No history found.</Typography>
                ) : (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {audits.map((audit) => (
                            <Box key={audit._id || audit.auditId || audit.actionDate} sx={{ position: 'relative' }}>
                                <CircleIcon 
                                    color="primary" 
                                    sx={{ 
                                        position: 'absolute', 
                                        left: -33, 
                                        top: 4, 
                                        fontSize: 18, 
                                        bgcolor: 'background.paper', 
                                        borderRadius: '50%' 
                                    }} 
                                />
                                <Box>
                                    <Typography variant="caption" color="text.secondary" fontWeight="medium">
                                        {new Date(audit.actionDate).toLocaleString('en-GB', { 
                                            day: '2-digit', month: 'short', year: 'numeric', 
                                            hour: '2-digit', minute: '2-digit' 
                                        })}
                                    </Typography>
                                    <Typography variant="h6" fontWeight="bold" color="text.primary" sx={{ my: 0.5 }}>
                                        {audit.action}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        by <Box component="span" fontWeight="bold">{audit.role} {audit.performedBy ? `(${audit.performedBy.name})` : ''}</Box>
                                    </Typography>
                                    {audit.remarks && (
                                        <Paper 
                                            elevation={0} 
                                            sx={{ 
                                                mt: 1.5, 
                                                p: 2, 
                                                bgcolor: 'grey.50', 
                                                borderLeft: 4, 
                                                borderColor: 'grey.300',
                                                fontStyle: 'italic',
                                                color: 'text.secondary'
                                            }}
                                        >
                                            "{audit.remarks}"
                                        </Paper>
                                    )}
                                </Box>
                            </Box>
                        ))}
                    </Box>
                )}
            </Box>
        </Box>
    );
};

export default RequestTimeline;
