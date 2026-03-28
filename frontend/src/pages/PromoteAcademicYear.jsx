import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Card, CardContent, Button as MuiButton,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Checkbox
} from '@mui/material';
import Layout from '../components/Layout';
import ConfirmDialog from '../components/ConfirmDialog';
import axios from 'axios';
import { Layers } from 'lucide-react';

const PromoteAcademicYear = () => {
    const [students, setStudents] = useState([]);
    const [selectedStudentIds, setSelectedStudentIds] = useState([]);
    const [loading, setLoading] = useState(true);
    const [confirmDialog, setConfirmDialog] = useState({ open: false, title: '', description: '', type: 'default', action: null });

    const closeConfirmDialog = () => setConfirmDialog(prev => ({ ...prev, open: false }));

    const fetchActiveStudents = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get('http://localhost:5000/api/users/students', {
                headers: { Authorization: `Bearer ${token}` }
            });
            // Filter only active students who have a semester < 10
            const activeStudents = res.data.filter(s => s.status?.toLowerCase() === 'active' && s.semester < 10);
            setStudents(activeStudents);
            // Select all by default
            setSelectedStudentIds(activeStudents.map(s => s._id));
        } catch (err) {
            console.error('Error fetching students:', err);
            alert('Failed to fetch students.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchActiveStudents();
    }, []);

    const handleSelectAllClick = (event) => {
        if (event.target.checked) {
            setSelectedStudentIds(students.map((n) => n._id));
            return;
        }
        setSelectedStudentIds([]);
    };

    const handleClick = (event, id) => {
        const selectedIndex = selectedStudentIds.indexOf(id);
        let newSelected = [];

        if (selectedIndex === -1) {
            newSelected = newSelected.concat(selectedStudentIds, id);
        } else if (selectedIndex === 0) {
            newSelected = newSelected.concat(selectedStudentIds.slice(1));
        } else if (selectedIndex === selectedStudentIds.length - 1) {
            newSelected = newSelected.concat(selectedStudentIds.slice(0, -1));
        } else if (selectedIndex > 0) {
            newSelected = newSelected.concat(
                selectedStudentIds.slice(0, selectedIndex),
                selectedStudentIds.slice(selectedIndex + 1),
            );
        }
        setSelectedStudentIds(newSelected);
    };

    const handlePromoteStudents = () => {
        if (selectedStudentIds.length === 0) {
            alert('Please select at least one student to promote.');
            return;
        }

        setConfirmDialog({
            open: true,
            title: 'Promote Selected Students',
            description: `Are you sure you want to promote ${selectedStudentIds.length} selected students to the next academic year?`,
            type: 'default',
            action: async () => {
                try {
                    const token = localStorage.getItem('token');
                    const res = await axios.put('http://localhost:5000/api/users/promote', {
                        studentIds: selectedStudentIds
                    }, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    alert(res.data.message || 'Promotion successful!');
                    fetchActiveStudents(); // Refresh the list
                } catch (err) {
                    console.error('Error promoting students:', err);
                    alert(err.response?.data?.message || 'Failed to promote students');
                }
            }
        });
    };

    const isSelected = (id) => selectedStudentIds.indexOf(id) !== -1;

    return (
        <Layout role="Admin">
            <Box sx={{ p: { xs: 1, md: 3 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 2 }}>
                    <Layers size={32} color="#1976d2" />
                    <Typography variant="h4" fontWeight="bold">
                        Academic Year Promotion
                    </Typography>
                </Box>

                <Card sx={{ borderRadius: 2, boxShadow: 3 }}>
                    <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Typography variant="h6">
                                Active Students ({students.length})
                            </Typography>
                            <MuiButton
                                variant="contained"
                                color="primary"
                                onClick={handlePromoteStudents}
                                disabled={selectedStudentIds.length === 0 || loading}
                            >
                                Promote Selected Students
                            </MuiButton>
                        </Box>

                        <TableContainer>
                            <Table sx={{ minWidth: 650 }}>
                                <TableHead sx={{ bgcolor: 'background.default' }}>
                                    <TableRow>
                                        <TableCell padding="checkbox">
                                            <Checkbox
                                                color="primary"
                                                indeterminate={selectedStudentIds.length > 0 && selectedStudentIds.length < students.length}
                                                checked={students.length > 0 && selectedStudentIds.length === students.length}
                                                onChange={handleSelectAllClick}
                                            />
                                        </TableCell>
                                        <TableCell sx={{ fontWeight: 'bold' }}>Name</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold' }}>Login ID</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold' }}>Current Semester</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold' }}>Division (Section)</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {loading ? (
                                        <TableRow>
                                            <TableCell colSpan={5} align="center" sx={{ py: 3 }}>Loading...</TableCell>
                                        </TableRow>
                                    ) : students.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                                                No eligible students found for promotion.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        students.map((student) => {
                                            const isItemSelected = isSelected(student._id);
                                            return (
                                                <TableRow
                                                    key={student._id}
                                                    hover
                                                    onClick={(event) => handleClick(event, student._id)}
                                                    role="checkbox"
                                                    aria-checked={isItemSelected}
                                                    selected={isItemSelected}
                                                    sx={{ cursor: 'pointer' }}
                                                >
                                                    <TableCell padding="checkbox">
                                                        <Checkbox
                                                            color="primary"
                                                            checked={isItemSelected}
                                                        />
                                                    </TableCell>
                                                    <TableCell sx={{ fontWeight: 500 }}>{student.name}</TableCell>
                                                    <TableCell sx={{ fontFamily: 'monospace' }}>{student.loginId}</TableCell>
                                                    <TableCell>Semester {student.semester}</TableCell>
                                                    <TableCell>{student.section || '-'}</TableCell>
                                                </TableRow>
                                            );
                                        })
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </CardContent>
                </Card>
            </Box>
            <ConfirmDialog 
                open={confirmDialog.open}
                onClose={closeConfirmDialog}
                title={confirmDialog.title}
                description={confirmDialog.description}
                onConfirm={() => {
                    if (confirmDialog.action) confirmDialog.action();
                    closeConfirmDialog();
                }}
                confirmText="Yes, Promote"
                cancelText="Cancel"
                type={confirmDialog.type}
            />
        </Layout>
    );
};

export default PromoteAcademicYear;
