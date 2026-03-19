import React, { useState } from 'react';
import axios from 'axios';
import { 
    Box, Typography, Button, Card, CardContent, Table, TableBody, 
    TableCell, TableContainer, TableHead, TableRow, Paper, Alert, Chip, Divider
} from '@mui/material';
import { CloudUpload, CheckCircle, Error as ErrorIcon, Cancel } from '@mui/icons-material';

const BulkUserUpload = () => {
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);
    const [isDragging, setIsDragging] = useState(false);

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setResult(null);
            setError(null);
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const droppedFile = e.dataTransfer.files[0];
            if (droppedFile.type === "text/csv" || droppedFile.name.endsWith(".csv")) {
                setFile(droppedFile);
                setResult(null);
                setError(null);
            } else {
                setError("Please upload a valid CSV file.");
            }
        }
    };

    const handleUpload = async () => {
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        setUploading(true);
        setError(null);
        setResult(null);

        try {
            const token = localStorage.getItem('token');
            const response = await axios.post('http://localhost:5000/api/users/bulk-upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    Authorization: `Bearer ${token}`
                }
            });
            setResult(response.data);
        } catch (err) {
            setError(err.response?.data?.message || 'Upload failed');
        } finally {
            setUploading(false);
        }
    };

    return (
        <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 900, mx: 'auto', animation: 'fadeInUp 0.5s ease-out' }}>
            <Typography variant="h4" fontWeight="bold" mb={4}>
                Bulk User Upload
            </Typography>

            <Card sx={{ mb: 4, borderRadius: 2, boxShadow: 3 }}>
                <CardContent sx={{ p: { xs: 2, md: 4 } }}>
                    <Box
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        sx={{
                            border: '2px dashed',
                            borderColor: isDragging ? 'primary.main' : 'divider',
                            borderRadius: 2,
                            p: 6,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            bgcolor: isDragging ? 'action.hover' : 'background.default',
                            transition: 'all 0.2s ease',
                            cursor: 'pointer',
                            '&:hover': {
                                bgcolor: 'action.hover',
                            }
                        }}
                        component="label"
                    >
                        <input
                            type="file"
                            accept=".csv"
                            onChange={handleFileChange}
                            hidden
                        />
                        <CloudUpload 
                            sx={{ 
                                fontSize: 64, 
                                color: isDragging ? 'primary.main' : 'text.secondary',
                                mb: 2,
                                transform: isDragging ? 'scale(1.1)' : 'scale(1)',
                                transition: 'transform 0.2s'
                            }} 
                        />
                        <Typography variant="h6" fontWeight="medium" color={isDragging ? 'primary.main' : 'text.primary'} gutterBottom>
                            {file ? file.name : (isDragging ? "Drop CSV file here" : "Click or Drag & Drop CSV file")}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            .csv files only
                        </Typography>
                    </Box>

                    {error && (
                        <Alert severity="error" sx={{ mt: 3 }} icon={<ErrorIcon />}>
                            {error}
                        </Alert>
                    )}

                    <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={handleUpload}
                            disabled={!file || uploading}
                            startIcon={<CloudUpload />}
                            size="large"
                            sx={{ fontWeight: 'bold' }}
                        >
                            {uploading ? 'Uploading...' : 'Upload Users'}
                        </Button>
                    </Box>
                </CardContent>
            </Card>

            {result && (
                <Card sx={{ borderRadius: 2, boxShadow: 3, overflow: 'hidden' }}>
                    <Box sx={{ p: 2, bgcolor: 'background.default', borderBottom: 1, borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                        <Typography variant="h6" fontWeight="bold">
                            Upload Summary
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <Chip label={`Total: ${result.total}`} variant="outlined" />
                            <Chip icon={<CheckCircle />} label={`Success: ${result.success}`} color="success" variant="outlined" />
                            <Chip icon={<Cancel />} label={`Failed: ${result.failed}`} color="error" variant="outlined" />
                        </Box>
                    </Box>

                    {result.errors.length > 0 && (
                        <CardContent sx={{ p: 0 }}>
                            <Box sx={{ p: 2, bgcolor: 'error.main', color: 'error.contrastText' }}>
                                <Typography variant="subtitle2" fontWeight="bold">Error Details</Typography>
                            </Box>
                            <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 0 }}>
                                <Table size="small">
                                    <TableHead sx={{ bgcolor: 'action.hover' }}>
                                        <TableRow>
                                            <TableCell sx={{ fontWeight: 'bold' }}>Row</TableCell>
                                            <TableCell sx={{ fontWeight: 'bold' }}>Email</TableCell>
                                            <TableCell sx={{ fontWeight: 'bold', color: 'error.main' }}>Reason</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {result.errors.map((err, idx) => (
                                            <TableRow key={idx} hover>
                                                <TableCell>{err.row}</TableCell>
                                                <TableCell>{err.email}</TableCell>
                                                <TableCell sx={{ color: 'error.main', fontWeight: 'medium' }}>{err.reason}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </CardContent>
                    )}

                    {result.failed === 0 && result.total > 0 && (
                        <CardContent sx={{ textAlign: 'center', py: 6 }}>
                            <CheckCircle color="success" sx={{ fontSize: 64, mb: 2 }} />
                            <Typography variant="h6" color="success.main" fontWeight="bold">
                                All users uploaded successfully!
                            </Typography>
                        </CardContent>
                    )}
                </Card>
            )}
        </Box>
    );
};

export default BulkUserUpload;
