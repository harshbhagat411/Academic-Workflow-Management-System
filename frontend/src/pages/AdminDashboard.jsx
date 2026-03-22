import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box, Typography, Grid, Button as MuiButton, Card, CardContent, 
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
    TextField, Select as MuiSelect, MenuItem, FormControl, InputLabel, InputAdornment, IconButton,
    Chip, Tooltip, Dialog
} from '@mui/material';
import Layout from '../components/Layout';
import ConfirmDialog from '../components/ConfirmDialog';
import axios from 'axios';
import { LayoutDashboard, Users, LogOut, FileText, Upload, Shield, Clock, Search } from 'lucide-react';
import SecuritySection from '../components/SecuritySection';
import StatCard from '../components/StatCard';
import { Calendar, Users as UsersIcon, BookOpen, AlertCircle } from 'lucide-react';

// Helper Component defined outside to prevent re-renders losing focus
const UserTable = ({ data, type, searchTerm, setSearchTerm, semesterFilter, setSemesterFilter, toggleUserStatus }) => {
    const filteredData = React.useMemo(() => {
        return data.filter(user => {
            const matchesSemester = type === 'Student' && semesterFilter
                ? String(user.semester) === String(semesterFilter)
                : true;

            const matchesSearch = searchTerm === '' ||
                (user.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                (user.loginId?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                (user.department?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                (user.specialization?.toLowerCase() || '').includes(searchTerm.toLowerCase());

            return matchesSemester && matchesSearch;
        });
    }, [data, type, searchTerm, semesterFilter]);

    return (
        <Card sx={{ mt: 2, mb: 4, borderRadius: 2, boxShadow: 3, bgcolor: 'background.paper' }}>
            <CardContent sx={{ p: 3, display: 'flex', flexDirection: { xs: 'column', md: 'row' }, alignItems: { xs: 'stretch', md: 'center' }, justifyContent: 'space-between', gap: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Users size={24} color="#2196f3" />
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                        {type} Management
                    </Typography>
                    <Chip 
                        label={filteredData.length} 
                        size="small" 
                        color="primary" 
                        variant="outlined" 
                        sx={{ ml: 1, fontWeight: 'bold' }} 
                    />
                </Box>

                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2, width: { xs: '100%', md: 'auto' } }}>
                    <TextField
                        placeholder="Search by name, ID, Spec..."
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
                        sx={{ width: { xs: '100%', md: 250 } }}
                    />

                    {type === 'Student' && (
                        <FormControl size="small" sx={{ minWidth: 150 }}>
                            <InputLabel id="semester-filter-label">Semester</InputLabel>
                            <MuiSelect
                                labelId="semester-filter-label"
                                value={semesterFilter}
                                label="Semester"
                                onChange={(e) => setSemesterFilter(e.target.value)}
                            >
                                <MenuItem value=""><em>All Semesters</em></MenuItem>
                                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(s => (
                                    <MenuItem key={s} value={s}>Semester {s}</MenuItem>
                                ))}
                            </MuiSelect>
                        </FormControl>
                    )}
                </Box>
            </CardContent>
            
            <TableContainer>
                <Table sx={{ minWidth: 650 }}>
                    <TableHead sx={{ bgcolor: 'background.default' }}>
                        <TableRow>
                            <TableCell sx={{ fontWeight: 'bold', width: 60 }}>#</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Name</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Login ID</TableCell>
                            {type === 'Faculty' && <TableCell sx={{ fontWeight: 'bold' }}>Specialization</TableCell>}
                            <TableCell sx={{ fontWeight: 'bold' }}>Department</TableCell>
                            {type === 'Student' && <TableCell sx={{ fontWeight: 'bold' }}>Semester</TableCell>}
                            {type === 'Student' && <TableCell sx={{ fontWeight: 'bold' }}>Section</TableCell>}
                            <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 'bold' }}>Action</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filteredData.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={type === 'Faculty' ? 7 : 8} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                                    No users found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredData.map((user, index) => (
                                <TableRow key={user._id} hover>
                                    <TableCell sx={{ color: 'text.secondary', fontFamily: 'monospace' }}>{data.indexOf(user) + 1}</TableCell>
                                    <TableCell sx={{ fontWeight: 500 }}>{user.name}</TableCell>
                                    <TableCell sx={{ color: 'text.secondary', fontFamily: 'monospace' }}>{user.loginId}</TableCell>
                                    {type === 'Faculty' && (
                                        <TableCell>
                                            <Chip label={user.specialization} size="small" color="primary" variant="outlined" />
                                        </TableCell>
                                    )}
                                    <TableCell>{user.department}</TableCell>
                                    {type === 'Student' && <TableCell>Sem {user.semester}</TableCell>}
                                    {type === 'Student' && <TableCell sx={{ fontFamily: 'monospace' }}>{user.section || '-'}</TableCell>}
                                    <TableCell>
                                        <Chip 
                                            label={user.status} 
                                            size="small" 
                                            color={user.status === 'Active' ? 'success' : 'error'} 
                                            variant="filled"
                                            sx={{ fontWeight: 'bold' }}
                                        />
                                    </TableCell>
                                    <TableCell align="right">
                                        <MuiButton
                                            variant={user.status === 'Active' ? 'outlined' : 'contained'}
                                            color={user.status === 'Active' ? 'error' : 'success'}
                                            size="small"
                                            onClick={() => toggleUserStatus(user._id, user.status, user.role)}
                                        >
                                            {user.status === 'Active' ? 'Deactivate' : 'Activate'}
                                        </MuiButton>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
        </Card>
    );
};

const AdminDashboard = () => {
    const navigate = useNavigate();
    const [confirmDialog, setConfirmDialog] = useState({ open: false, title: '', description: '', type: 'default', action: null });
    const closeConfirmDialog = () => setConfirmDialog(prev => ({ ...prev, open: false }));
    const [activeTab, setActiveTab] = useState('overview');
    const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0 });
    const [users, setUsers] = useState([]);
    const [semesterFilter, setSemesterFilter] = useState('');
    const [mentorAllocations, setMentorAllocations] = useState([]);
    const [mentorForm, setMentorForm] = useState({
        semester: '',
        studentIds: [],
        facultyId: ''
    });
    const [filteredStudents, setFilteredStudents] = useState([]);
    const [faculties, setFaculties] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [newSubject, setNewSubject] = useState({ name: '', department: 'Computer Science', semester: '', facultyId: '' });

    // Timetable State
    // Real Dashboard Counts
    const [dashboardStats, setDashboardStats] = useState({
        totalStudents: 0,
        totalFaculty: 0,
        totalSubjects: 0
    });

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const token = localStorage.getItem('token');
                
                const [studentsRes, staffRes, subjectsRes] = await Promise.all([
                    axios.get('http://localhost:5000/api/users/students', { headers: { Authorization: `Bearer ${token}` } }),
                    axios.get('http://localhost:5000/api/users/staff', { headers: { Authorization: `Bearer ${token}` } }),
                    axios.get('http://localhost:5000/api/subjects/all', { headers: { Authorization: `Bearer ${token}` } })
                ]);

                setDashboardStats({
                    totalStudents: studentsRes.data.length || 0,
                    totalFaculty: staffRes.data.length || 0,
                    totalSubjects: subjectsRes.data.length || 0
                });
            } catch (err) {
                console.error('Error fetching dashboard counts:', err);
            }
        };
        fetchDashboardData();
    }, []);

    const [timetable, setTimetable] = useState([]);
    const [timetableFilter, setTimetableFilter] = useState({ semester: '1', section: 'A', day: 'Monday' }); // Added section
    const [newLecture, setNewLecture] = useState({ startTime: '', endTime: '', subjectId: '', facultyId: '' });
    const [sections, setSections] = useState([]); // Sections State

    // Advanced Timetable State
    const [showCopyModal, setShowCopyModal] = useState(false);
    const [copySourceDay, setCopySourceDay] = useState('Monday');
    const [selectedLectureIds, setSelectedLectureIds] = useState([]);
    const [showBulkModal, setShowBulkModal] = useState(false);
    const [bulkLectures, setBulkLectures] = useState([{ startTime: '', endTime: '', subjectId: '', facultyId: '' }]);

    // Auto-select all lectures when source day changes
    useEffect(() => {
        if (showCopyModal) {
            const dayLectures = timetable.filter(t => t.day === copySourceDay);
            setSelectedLectureIds(dayLectures.map(t => t._id));
        }
    }, [copySourceDay, showCopyModal, timetable]);

    // Fetch Sections
    const fetchSections = async (semester) => {
        try {
            const token = localStorage.getItem('token');
            console.log(`[AdminDashboard] Fetching sections for Sem: ${semester}`);
            const res = await axios.get(`http://localhost:5000/api/sections?semester=${semester}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log('[AdminDashboard] Sections received:', res.data);
            setSections(res.data);
            // Default to first section if available and not set
            if (res.data.length > 0 && !timetableFilter.section) {
                console.log(`[AdminDashboard] Auto-selecting section: ${res.data[0].sectionName}`);
                setTimetableFilter(prev => ({ ...prev, section: res.data[0].sectionName }));
            }
        } catch (err) {
            console.error('Error fetching sections:', err);
        }
    };

    // Manual Section Management State
    const [showCreateSectionModal, setShowCreateSectionModal] = useState(false);
    const [createSectionData, setCreateSectionData] = useState({ sectionName: '', semester: '', maxCapacity: 60 });
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [assignData, setAssignData] = useState({ sectionId: '', studentIds: [] });
    const [unassignedStudents, setUnassignedStudents] = useState([]);

    const handleCreateSection = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            await axios.post('http://localhost:5000/api/sections/create', createSectionData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setShowCreateSectionModal(false);
            alert('Section Created Successfully!');
            if (semesterFilter) fetchSections(semesterFilter);
        } catch (error) {
            console.error(error);
            alert(error.response?.data?.message || 'Failed to create section');
        }
    };

    const handleAssignStudents = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.post('http://localhost:5000/api/sections/assign', assignData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setShowAssignModal(false);
            alert(`Success: ${res.data.message}`);
            // Refresh Data
            if (semesterFilter) fetchSections(semesterFilter);
            fetchStudentList(); // Refresh students to show updated sections
        } catch (error) {
            console.error(error);
            alert(error.response?.data?.message || 'Failed to assign students');
        }
    };

    // Filter unassigned students when modal opens or filter changes
    useEffect(() => {
        if (showAssignModal && semesterFilter) {
            const unassigned = users.filter(u =>
                u.role === 'Student' &&
                String(u.semester) === String(semesterFilter) &&
                !u.section
            );
            setUnassignedStudents(unassigned);
        }
    }, [showAssignModal, semesterFilter, users]);

    const [greeting, setGreeting] = useState('');

    const ACADEMIC_SLOTS = [
        { start: '08:30', end: '09:30', type: 'lecture' },
        { start: '09:30', end: '10:30', type: 'lecture' },
        { start: '10:30', end: '11:15', type: 'break', label: 'MORNING BREAK' },
        { start: '11:15', end: '12:15', type: 'lecture' },
        { start: '12:15', end: '13:15', type: 'lecture' },
        { start: '13:15', end: '13:30', type: 'break', label: 'LUNCH BREAK' },
        { start: '13:30', end: '14:30', type: 'lecture' },
        { start: '14:30', end: '15:30', type: 'lecture' }
    ];

    // UI-Only Slot Dictionaries (Mapped to match user request but keep backend compatibility)
    const theorySlots = [
        "8:30 AM - 9:30 AM",
        "9:30 AM - 10:30 AM",
        "11:15 AM - 12:15 PM",
        "12:15 PM - 1:15 PM",
        "1:30 PM - 2:30 PM", // Note: 13:30 is 1:30 PM
        "2:30 PM - 3:30 PM"  // Note: 14:30 is 2:30 PM
    ];

    const labSlots = [
        "8:30 AM - 10:30 AM",
        "11:15 AM - 1:15 PM",
        "1:30 PM - 3:30 PM"
    ];

    // Helper to map display string back to start|end value for backend
    const getSlotValue = (displayString) => {
        // Simple mapping based on known strings
        const map = {
            "8:30 AM - 9:30 AM": "08:30|09:30",
            "9:30 AM - 10:30 AM": "09:30|10:30",
            "11:15 AM - 12:15 PM": "11:15|12:15",
            "12:15 PM - 1:15 PM": "12:15|13:15",
            "1:30 PM - 2:30 PM": "13:30|14:30",
            "2:30 PM - 3:30 PM": "14:30|15:30",
            // Labs
            "8:30 AM - 10:30 AM": "08:30|10:30",
            "11:15 AM - 1:15 PM": "11:15|13:15",
            "1:30 PM - 3:30 PM": "13:30|15:30"
        };
        return map[displayString] || "";
    };

    // Helper to format 24h to 12h for display
    const formatTime = (time) => {
        const [h, m] = time.split(':');
        const hour = parseInt(h);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const hour12 = hour % 12 || 12;
        return `${hour12}:${m} ${ampm}`;
    };

    useEffect(() => {
        const hour = new Date().getHours();
        if (hour < 12) setGreeting('Good Morning');
        else if (hour < 18) setGreeting('Good Afternoon');
        else setGreeting('Good Evening');
    }, []);

    // Fetch Stats
    useEffect(() => {
        const fetchStats = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await axios.get('http://localhost:5000/api/requests/admin/stats', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setStats(res.data);
            } catch (err) {
                console.error('Error fetching stats:', err);
            }
        };
        fetchStats();
    }, []);

    // Fetch Users when tab changes
    useEffect(() => {
        if (activeTab === 'staff') {
            fetchStaffList();
        } else if (activeTab === 'students') {
            fetchStudentList();
        } else if (activeTab === 'mentors') {
            fetchMentorAllocations();
            fetchMentorFormData();
        } else if (activeTab === 'subjects') {
            fetchSubjects();
            fetchStaffList(); // To populate faculty dropdown
        } else if (activeTab === 'timetable') {
            fetchSections(timetableFilter.semester);
            fetchTimetable();
            fetchSubjects(); // Needed for dropdown
            fetchStaffList(); // Needed for dropdown (if manual override allowed)
        } else if (activeTab === 'sections') {
            // Fetch sections and students for allocation
            if (semesterFilter) fetchSections(semesterFilter);
            fetchStudentList();
        }
    }, [activeTab, timetableFilter.semester, timetableFilter.section, semesterFilter]); // Refetch when semester/section changes

    const fetchSubjects = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get('http://localhost:5000/api/subjects/all', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSubjects(res.data);
        } catch (err) {
            console.error('Error fetching subjects:', err);
        }
    };

    const fetchTimetable = async () => {
        try {
            const token = localStorage.getItem('token');
            console.log(`[AdminDashboard] Fetching timetable for Sem: ${timetableFilter.semester}, Section: ${timetableFilter.section}`);
            const res = await axios.get(`http://localhost:5000/api/timetable?semester=${timetableFilter.semester}&section=${timetableFilter.section}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log('[AdminDashboard] Timetable received:', res.data);
            setTimetable(res.data);
        } catch (err) {
            console.error('Error fetching timetable:', err);
        }
    };

    const handleAddLecture = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            // Auto-assign faculty from selected subject if not manually chosen (though we'll use the form value)
            const subject = subjects.find(s => s._id === newLecture.subjectId);
            const facultyId = newLecture.facultyId || subject?.facultyId?._id;

            if (!facultyId) {
                alert('Please select a subject with an assigned faculty or select a faculty manually.');
                return;
            }

            await axios.post('http://localhost:5000/api/timetable/add', {
                ...newLecture,
                semester: timetableFilter.semester,
                section: timetableFilter.section,
                day: timetableFilter.day,
                type: lectureType,
                facultyId
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            alert('Lecture added successfully');
            setNewLecture({ startTime: '', endTime: '', subjectId: '', facultyId: '' });
            fetchTimetable();
        } catch (err) {
            alert(err.response?.data?.message || 'Error adding lecture');
        }
    };

    const handleDeleteLecture = async (id) => {
        setConfirmDialog({
            open: true,
            title: 'Delete Lecture',
            description: 'Are you sure you want to delete this lecture?',
            type: 'danger',
            action: async () => {
                try {
                    const token = localStorage.getItem('token');
                    await axios.delete(`http://localhost:5000/api/timetable/${id}`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    fetchTimetable();
                } catch (err) {
                    alert('Error deleting lecture');
                }
            }
        });
    };

    const handleCopyTimetable = async () => {
        try {
            const token = localStorage.getItem('token');
            await axios.post('http://localhost:5000/api/timetable/copy', {
                sourceDay: copySourceDay,
                targetDay: timetableFilter.day,
                semester: timetableFilter.semester,
                lectureIds: selectedLectureIds
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert('Timetable copied successfully!');
            setShowCopyModal(false);
            fetchTimetable();
        } catch (err) {
            alert(err.response?.data?.message || 'Copy failed');
        }
    };

    const handleBulkSave = async () => {
        try {
            const token = localStorage.getItem('token');
            // Filter out empty rows
            const validLectures = bulkLectures.filter(l => l.startTime && l.endTime && l.subjectId);

            if (validLectures.length === 0) {
                alert('Please fill at least one row completely.');
                return;
            }

            // Auto-fill faculty if missing
            const enrichedLectures = validLectures.map(l => {
                const subject = subjects.find(s => s._id === l.subjectId);
                return {
                    ...l,
                    facultyId: l.facultyId || subject?.facultyId?._id
                };
            });

            await axios.post('http://localhost:5000/api/timetable/bulk-add', {
                lectures: enrichedLectures,
                semester: timetableFilter.semester,
                day: timetableFilter.day
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            alert('Bulk lectures added successfully!');
            setShowBulkModal(false);
            setBulkLectures([{ startTime: '', endTime: '', subjectId: '', facultyId: '' }]);
            fetchTimetable();
        } catch (err) {
            const msg = err.response?.data?.conflicts ?
                `Conflicts found:\n${err.response.data.conflicts.join('\n')}` :
                (err.response?.data?.message || 'Bulk add failed');
            alert(msg);
        }
    };

    const handleCreateSubject = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            // Ensure department is set to Computer Science if empty (safety check)
            const subjectData = { ...newSubject, department: newSubject.department || 'Computer Science' };

            await axios.post('http://localhost:5000/api/subjects/create', subjectData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert('Subject created successfully');
            setNewSubject({ name: '', department: 'Computer Science', semester: '', type: 'Theory', facultyId: '' });
            fetchSubjects();
        } catch (err) {
            console.error('Error creating subject:', err);
            alert(err.response?.data?.message || 'Failed to create subject');
        }
    };

    const handleDeleteSubject = async (id) => {
        setConfirmDialog({
            open: true,
            title: 'Delete Subject',
            description: 'Are you sure you want to delete this subject?',
            type: 'danger',
            action: async () => {
                try {
                    const token = localStorage.getItem('token');
                    await axios.delete(`http://localhost:5000/api/subjects/${id}`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    fetchSubjects();
                } catch (err) {
                    console.error('Error deleting subject:', err);
                }
            }
        });
    };

    const fetchMentorAllocations = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get('http://localhost:5000/api/mentors/admin', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setMentorAllocations(res.data);
        } catch (err) {
            console.error('Error fetching allocations:', err);
        }
    };

    const fetchMentorFormData = async () => {
        try {
            const token = localStorage.getItem('token');
            const [studentRes, facultyRes] = await Promise.all([
                axios.get('http://localhost:5000/api/users/students', { headers: { Authorization: `Bearer ${token}` } }),
                axios.get('http://localhost:5000/api/users/staff', { headers: { Authorization: `Bearer ${token}` } })
            ]);
            setUsers(studentRes.data); // Keep all students for selection
            setFaculties(facultyRes.data);
        } catch (err) {
            console.error('Error fetching form data:', err);
        }
    };

    const handleSemesterChange = (e) => {
        const sem = e.target.value;
        setMentorForm({ ...mentorForm, semester: sem, studentIds: [] });
        if (sem) {
            const filtered = users.filter(u => String(u.semester) === String(sem));
            setFilteredStudents(filtered);
        } else {
            setFilteredStudents([]);
        }
    };

    const toggleStudentSelection = (id) => {
        setMentorForm(prev => {
            const ids = prev.studentIds.includes(id)
                ? prev.studentIds.filter(sid => sid !== id)
                : [...prev.studentIds, id];
            return { ...prev, studentIds: ids };
        });
    };
    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setMentorForm({ ...mentorForm, studentIds: filteredStudents.map(s => s._id) });
        } else {
            setMentorForm({ ...mentorForm, studentIds: [] });
        }
    };

    const handleAssignMentor = async () => {
        try {
            const token = localStorage.getItem('token');
            await axios.post('http://localhost:5000/api/mentors/assign', mentorForm, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert('Mentor assigned successfully');
            fetchMentorAllocations();
            setMentorForm({ semester: '', studentIds: [], facultyId: '' });
        } catch (err) {
            console.error(err);
            alert(err.response?.data?.message || 'Failed to assign mentor');
        }
    };

    const fetchStaffList = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get('http://localhost:5000/api/users/staff', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setUsers(res.data);
        } catch (err) {
            console.error('Error fetching staff:', err);
        }
    };

    const fetchStudentList = async () => {
        try {
            const token = localStorage.getItem('token');
            // Always fetch all students, let frontend handle filtering
            const url = 'http://localhost:5000/api/users/students';

            const res = await axios.get(url, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setUsers(res.data);
        } catch (err) {
            console.error('Error fetching students:', err);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        navigate('/login');
    };

    const toggleUserStatus = async (userId, currentStatus, role) => {
        if (role === 'Admin') return;

        const newStatus = currentStatus === 'Deactivated' ? 'Active' : 'Deactivated';
        const executeToggle = async () => {
            try {
                const token = localStorage.getItem('token');

                await axios.patch(`http://localhost:5000/api/users/${userId}/status`,
                    { status: newStatus },
                    { headers: { Authorization: `Bearer ${token}` } }
                );

                if (activeTab === 'staff') fetchStaffList();
                if (activeTab === 'students') fetchStudentList();
            } catch (error) {
                console.error('Error updating status:', error);
                alert(error.response?.data?.message || 'Failed to update status');
            }
        };

        if (newStatus === 'Deactivated') {
            setConfirmDialog({
                open: true,
                title: `Deactivate ${role}`,
                description: `Are you sure you want to deactivate this user? They will not be able to log in.`,
                type: 'danger',
                action: executeToggle
            });
        } else {
            executeToggle(); // Activate immediately
        }
    };

    const [searchTerm, setSearchTerm] = useState('');
    const [lectureType, setLectureType] = useState("Theory"); // UI-only state for Lecture Type

    // Reset filters when tab changes
    useEffect(() => {
        setSearchTerm('');
        setSemesterFilter('');
    }, [activeTab]);

    const cards = [
        {
            icon: Calendar,
            title: "Total Students",
            value: dashboardStats.totalStudents || "0"
        },
        {
            icon: UsersIcon,
            title: "Total Faculty",
            value: dashboardStats.totalFaculty || "0"
        },
        {
            icon: BookOpen,
            title: "Total Subjects",
            value: dashboardStats.totalSubjects || "0"
        },
        {
            icon: AlertCircle,
            title: "Pending Academic Requests",
            value: stats.pending || "0"
        }
    ];

    const isSingleRow = cards.length <= 4;
    const half = Math.ceil(cards.length / 2);
    const firstRow = isSingleRow ? cards : cards.slice(0, half);
    const secondRow = isSingleRow ? [] : cards.slice(half);

    return (
        <Layout role="Admin" activeTab={activeTab} setActiveTab={setActiveTab}>

            {activeTab === 'overview' && (
                <Box sx={{ mt: 3 }}>
                    <Box sx={{ mb: 4 }}>
                        <Box sx={{ display: "flex", gap: 3, mb: isSingleRow ? 0 : 3 }}>
                            {firstRow.map((card, index) => (
                                <Box key={index} sx={{ flex: 1 }}>
                                    <StatCard sx={{ width: "100%", height: "100%" }} {...card} />
                                </Box>
                            ))}
                        </Box>
                        {!isSingleRow && (
                            <Box sx={{ display: "flex", gap: 3 }}>
                                {secondRow.map((card, index) => (
                                    <Box key={index} sx={{ flex: 1 }}>
                                        <StatCard sx={{ width: "100%", height: "100%" }} {...card} />
                                    </Box>
                                ))}
                            </Box>
                        )}
                    </Box>

                    <Card sx={{ p: { xs: 3, md: 6 }, textAlign: 'center', borderRadius: 3, boxShadow: 3, bgcolor: 'background.paper', mb: 4 }}>
                        <CardContent>
                            <Typography variant="h4" fontWeight="bold" color="text.primary" gutterBottom>
                                {greeting}, Admin
                            </Typography>
                            <Typography variant="body1" color="text.secondary" sx={{ mb: 4, maxWidth: 600, mx: 'auto' }}>
                                System is fully operational. Use the navigation tabs or the quick actions below to manage the platform.
                            </Typography>

                            <Box sx={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 2, mt: 3 }}>
                                <MuiButton
                                    variant="contained"
                                    color="secondary"
                                    size="large"
                                    startIcon={<Users size={20} />}
                                    onClick={() => navigate('/admin/create-user')}
                                    sx={{ py: 1.5, px: 3, borderRadius: 2 }}
                                >
                                    Create New User
                                </MuiButton>
                                <MuiButton
                                    variant="contained"
                                    color="primary"
                                    size="large"
                                    startIcon={<FileText size={20} />}
                                    onClick={() => navigate('/admin/requests')}
                                    sx={{ py: 1.5, px: 3, borderRadius: 2 }}
                                >
                                    Manage Requests
                                </MuiButton>
                                <MuiButton
                                    variant="contained"
                                    color="success"
                                    size="large"
                                    startIcon={<Upload size={20} />}
                                    onClick={() => navigate('/admin/bulk-upload')}
                                    sx={{ py: 1.5, px: 3, borderRadius: 2 }}
                                >
                                    Bulk Upload
                                </MuiButton>
                            </Box>
                        </CardContent>
                    </Card>
                </Box>
            )}

            {activeTab === 'staff' && <UserTable
                data={users}
                type="Staff"
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                semesterFilter={semesterFilter}
                setSemesterFilter={setSemesterFilter}
                toggleUserStatus={toggleUserStatus}
            />}

            {activeTab === 'students' && <UserTable
                data={users}
                type="Student"
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                semesterFilter={semesterFilter}
                setSemesterFilter={setSemesterFilter}
                toggleUserStatus={toggleUserStatus}
            />}

            {
                activeTab === 'mentors' && (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                        {/* Section A: Assignment Panel */}
                        <Card sx={{ p: 3, borderRadius: 2, boxShadow: 3, bgcolor: 'background.paper' }}>
                            <Typography variant="h6" fontWeight="bold" mb={3} display="flex" alignItems="center" gap={1}>
                                <Users size={20} color="#2196f3" />
                                Assign Mentor
                            </Typography>

                            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 2fr 1fr' }, gap: 3, width: '100%' }}>
                                {/* Semester Select */}
                                <Box>
                                    <FormControl fullWidth>
                                        <InputLabel>Semester</InputLabel>
                                        <MuiSelect
                                            value={mentorForm.semester}
                                            label="Semester"
                                            onChange={handleSemesterChange}
                                        >
                                            <MenuItem value=""><em>Select Semester</em></MenuItem>
                                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(s => <MenuItem key={s} value={s}>Semester {s}</MenuItem>)}
                                        </MuiSelect>
                                    </FormControl>
                                </Box>

                                {/* Student List */}
                                <Box>
                                    <Typography variant="subtitle2" color="text.secondary" mb={1}>Select Students</Typography>
                                    <Paper variant="outlined" sx={{ height: 250, overflowY: 'auto', bgcolor: 'background.default' }}>
                                        <Box sx={{ p: 1, borderBottom: '1px solid', borderColor: 'divider', position: 'sticky', top: 0, bgcolor: 'background.paper', zIndex: 1 }}>
                                            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                                                <input
                                                    type="checkbox"
                                                    onChange={handleSelectAll}
                                                    checked={filteredStudents.length > 0 && mentorForm.studentIds.length === filteredStudents.length}
                                                    disabled={!mentorForm.semester}
                                                    style={{ width: 16, height: 16 }}
                                                />
                                                <Typography variant="body2" fontWeight="medium">Select All Eligible Students</Typography>
                                            </label>
                                        </Box>
                                        <Box sx={{ p: 1 }}>
                                            {filteredStudents.map(s => (
                                                <label key={s._id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0', cursor: 'pointer' }}>
                                                    <input
                                                        type="checkbox"
                                                        checked={mentorForm.studentIds.includes(s._id)}
                                                        onChange={() => toggleStudentSelection(s._id)}
                                                        style={{ width: 16, height: 16 }}
                                                    />
                                                    <Typography variant="body2">{s.name} <Typography component="span" variant="caption" color="text.secondary">({s.loginId})</Typography></Typography>
                                                </label>
                                            ))}
                                            {filteredStudents.length === 0 && (
                                                <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 3 }}>
                                                    {mentorForm.semester ? "No students found in this semester" : "Select a semester first"}
                                                </Typography>
                                            )}
                                        </Box>
                                    </Paper>
                                    <Typography variant="caption" color="text.secondary" display="block" align="right" mt={0.5}>
                                        {mentorForm.studentIds.length} students selected
                                    </Typography>
                                </Box>

                                {/* Faculty Select & Button */}
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                    <FormControl fullWidth>
                                        <InputLabel>Faculty Mentor</InputLabel>
                                        <MuiSelect
                                            value={mentorForm.facultyId}
                                            label="Faculty Mentor"
                                            onChange={(e) => setMentorForm({ ...mentorForm, facultyId: e.target.value })}
                                        >
                                            <MenuItem value=""><em>Select Faculty</em></MenuItem>
                                            {faculties.map(f => (
                                                <MenuItem key={f._id} value={f._id}>{f.name}</MenuItem>
                                            ))}
                                        </MuiSelect>
                                    </FormControl>

                                    <MuiButton
                                        variant="contained"
                                        color="primary"
                                        fullWidth
                                        onClick={handleAssignMentor}
                                        disabled={mentorForm.studentIds.length === 0 || !mentorForm.facultyId}
                                        sx={{ mt: 'auto', py: 1.5 }}
                                    >
                                        Assign Mentor
                                    </MuiButton>
                                </Box>
                            </Box>
                        </Card>

                        {/* Section B: Allocation Table */}
                        <Card sx={{ borderRadius: 2, boxShadow: 3, bgcolor: 'background.paper' }}>
                            <CardContent sx={{ borderBottom: '1px solid', borderColor: 'divider', p: 2 }}>
                                <Typography variant="h6" fontWeight="bold">Current Allocations</Typography>
                            </CardContent>
                            <TableContainer>
                                <Table sx={{ minWidth: 650 }}>
                                    <TableHead sx={{ bgcolor: 'background.default' }}>
                                        <TableRow>
                                            <TableCell sx={{ fontWeight: 'bold' }}>Student Name</TableCell>
                                            <TableCell sx={{ fontWeight: 'bold' }}>Login ID</TableCell>
                                            <TableCell sx={{ fontWeight: 'bold' }}>Semester</TableCell>
                                            <TableCell sx={{ fontWeight: 'bold' }}>Assigned Mentor</TableCell>
                                            <TableCell sx={{ fontWeight: 'bold' }}>Assigned Date</TableCell>
                                            <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {mentorAllocations.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={6} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                                                    No allocations found. Start by assigning a mentor above.
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            mentorAllocations.map(alloc => (
                                                <TableRow key={alloc._id} hover>
                                                    <TableCell sx={{ fontWeight: 500 }}>{alloc.studentId?.name}</TableCell>
                                                    <TableCell sx={{ color: 'text.secondary', fontFamily: 'monospace' }}>{alloc.studentId?.loginId}</TableCell>
                                                    <TableCell>Sem {alloc.semester}</TableCell>
                                                    <TableCell sx={{ color: 'primary.main', fontWeight: 500 }}>{alloc.facultyId?.name}</TableCell>
                                                    <TableCell>{new Date(alloc.assignedAt).toLocaleDateString()}</TableCell>
                                                    <TableCell>
                                                        <Chip 
                                                            label={alloc.isActive ? 'Active' : 'Inactive'} 
                                                            size="small" 
                                                            color={alloc.isActive ? 'success' : 'default'} 
                                                            variant="filled"
                                                        />
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </Card>
                    </Box>
                )
            }
            {
                activeTab === 'subjects' && (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                        {/* Create Subject Form */}
                        <Card sx={{ p: 3, borderRadius: 2, boxShadow: 3, bgcolor: 'background.paper' }}>
                            <Typography variant="h6" fontWeight="bold" mb={3}>Add New Subject</Typography>
                            <Box component="form" onSubmit={handleCreateSubject} sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
                                <TextField
                                    label="Subject Name"
                                    placeholder="e.g. Data Structures"
                                    value={newSubject.name}
                                    onChange={(e) => setNewSubject({ ...newSubject, name: e.target.value })}
                                    required
                                    fullWidth
                                    size="small"
                                />

                                <FormControl fullWidth size="small" required>
                                    <InputLabel>Semester</InputLabel>
                                    <MuiSelect
                                        value={newSubject.semester}
                                        label="Semester"
                                        onChange={(e) => setNewSubject({ ...newSubject, semester: e.target.value })}
                                    >
                                        <MenuItem value=""><em>Select Semester</em></MenuItem>
                                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(s => <MenuItem key={s} value={s}>Semester {s}</MenuItem>)}
                                    </MuiSelect>
                                </FormControl>

                                <FormControl fullWidth size="small" required>
                                    <InputLabel>Assign Faculty</InputLabel>
                                    <MuiSelect
                                        value={newSubject.facultyId}
                                        label="Assign Faculty"
                                        onChange={(e) => setNewSubject({ ...newSubject, facultyId: e.target.value })}
                                    >
                                        <MenuItem value=""><em>Select Faculty</em></MenuItem>
                                        {users.filter(u => u.role === 'Faculty' || u.role === 'Admin').map(f => (
                                            <MenuItem key={f._id} value={f._id}>{f.name} ({f.department})</MenuItem>
                                        ))}
                                    </MuiSelect>
                                </FormControl>
                                
                                <Box sx={{ gridColumn: { md: '1 / -1' }, mt: 1 }}>
                                    <MuiButton
                                        type="submit"
                                        variant="contained"
                                        color="primary"
                                        fullWidth
                                        startIcon={<FileText size={20} />}
                                    >
                                        Create Subject
                                    </MuiButton>
                                </Box>
                            </Box>
                        </Card>

                        {/* Subject List */}
                        <Card sx={{ borderRadius: 2, boxShadow: 3, bgcolor: 'background.paper' }}>
                            <CardContent sx={{ borderBottom: '1px solid', borderColor: 'divider', p: 2 }}>
                                <Typography variant="h6" fontWeight="bold">All Subjects</Typography>
                            </CardContent>
                            <TableContainer>
                                <Table sx={{ minWidth: 650 }}>
                                    <TableHead sx={{ bgcolor: 'background.default' }}>
                                        <TableRow>
                                            <TableCell sx={{ fontWeight: 'bold' }}>Code</TableCell>
                                            <TableCell sx={{ fontWeight: 'bold' }}>Name</TableCell>
                                            <TableCell sx={{ fontWeight: 'bold' }}>Department</TableCell>
                                            <TableCell sx={{ fontWeight: 'bold' }}>Semester</TableCell>
                                            <TableCell sx={{ fontWeight: 'bold' }}>Faculty</TableCell>
                                            <TableCell align="right" sx={{ fontWeight: 'bold' }}>Action</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {subjects.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={6} align="center" sx={{ py: 3, color: 'text.secondary' }}>No subjects found.</TableCell>
                                            </TableRow>
                                        ) : (
                                            subjects.map(sub => (
                                                <TableRow key={sub._id} hover>
                                                    <TableCell sx={{ color: 'text.secondary', fontFamily: 'monospace' }}>{sub.code}</TableCell>
                                                    <TableCell sx={{ fontWeight: 500 }}>{sub.name}</TableCell>
                                                    <TableCell>{sub.department}</TableCell>
                                                    <TableCell>Sem {sub.semester}</TableCell>
                                                    <TableCell sx={{ color: 'primary.main', fontWeight: 500 }}>{sub.facultyId?.name || 'Unassigned'}</TableCell>
                                                    <TableCell align="right">
                                                        <MuiButton
                                                            color="error"
                                                            size="small"
                                                            onClick={() => handleDeleteSubject(sub._id)}
                                                        >
                                                            Delete
                                                        </MuiButton>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </Card>
                    </Box>
                )
            }
            {
                activeTab === 'timetable' && (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, animation: 'fadeInUp 0.5s ease-out' }}>
                        {/* Filter Bar */}
                        <Card sx={{ p: 3, borderRadius: 2, boxShadow: 3, bgcolor: 'background.paper', display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2, alignItems: 'center', justifyContent: 'space-between' }}>
                            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flex: 1, width: '100%', flexWrap: 'wrap' }}>
                                <FormControl size="small" sx={{ flex: 1, minWidth: 120, maxWidth: 200 }}>
                                    <InputLabel>Semester</InputLabel>
                                    <MuiSelect value={timetableFilter.semester} label="Semester" onChange={(e) => setTimetableFilter({ ...timetableFilter, semester: e.target.value })}>
                                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(s => <MenuItem key={s} value={s}>Semester {s}</MenuItem>)}
                                    </MuiSelect>
                                </FormControl>
                                <FormControl size="small" sx={{ flex: 1, minWidth: 120, maxWidth: 200 }}>
                                    <InputLabel>Section</InputLabel>
                                    <MuiSelect value={timetableFilter.section} label="Section" onChange={(e) => setTimetableFilter({ ...timetableFilter, section: e.target.value })}>
                                        {sections.length > 0 ? sections.map(s => <MenuItem key={s._id} value={s.sectionName}>Section {s.sectionName}</MenuItem>) : <MenuItem value=""><em>No Sections</em></MenuItem>}
                                    </MuiSelect>
                                </FormControl>
                                <FormControl size="small" sx={{ flex: 1, minWidth: 120, maxWidth: 200 }}>
                                    <InputLabel>Day</InputLabel>
                                    <MuiSelect value={timetableFilter.day} label="Day" onChange={(e) => setTimetableFilter({ ...timetableFilter, day: e.target.value })}>
                                        {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(d => <MenuItem key={d} value={d}>{d}</MenuItem>)}
                                    </MuiSelect>
                                </FormControl>
                            </Box>
                            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: 'center' }}>
                                <MuiButton variant="contained" color="secondary" onClick={() => setShowCopyModal(true)} startIcon={<span style={{fontSize: '1rem'}}>📋</span>}>
                                    Copy
                                </MuiButton>
                                <MuiButton variant="contained" color="info" onClick={() => setShowBulkModal(true)} startIcon={<span style={{fontSize: '1rem'}}>📚</span>}>
                                    Bulk Add
                                </MuiButton>
                                <MuiButton variant="contained" color="primary" onClick={fetchTimetable} startIcon={<Clock size={18} />}>
                                    Refresh
                                </MuiButton>
                            </Box>
                        </Card>

                        {/* Add Lecture Form */}
                        <Card sx={{ p: 4, borderRadius: 2, boxShadow: 3, bgcolor: 'background.paper' }}>
                            <Typography variant="h6" fontWeight="bold" mb={3} display="flex" alignItems="center" gap={1}>
                                <Box sx={{ bgcolor: 'success.main', color: 'success.contrastText', p: 0.5, borderRadius: 1, display: 'flex' }}><Upload size={20} /></Box>
                                Add Lecture for <Typography component="span" variant="inherit" color="success.main">{timetableFilter.day}</Typography>
                            </Typography>
                            <Box component="form" onSubmit={handleAddLecture} sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(5, 1fr)' }, gap: 3, alignItems: 'end' }}>
                                <Box sx={{ gridColumn: { md: 'span 2' }, display: 'flex', flexDirection: 'column', gap: 2 }}>
                                    <FormControl fullWidth size="small">
                                        <InputLabel>Lecture Type</InputLabel>
                                        <MuiSelect
                                            value={lectureType}
                                            label="Lecture Type"
                                            onChange={(e) => {
                                                setLectureType(e.target.value);
                                                setNewLecture({ ...newLecture, startTime: '', endTime: '' });
                                            }}
                                        >
                                            <MenuItem value="Theory">Theory</MenuItem>
                                            <MenuItem value="Lab">Lab</MenuItem>
                                            <MenuItem value="Project">Project</MenuItem>
                                        </MuiSelect>
                                    </FormControl>

                                    <FormControl fullWidth size="small" required>
                                        <InputLabel>Time Slot</InputLabel>
                                        <MuiSelect
                                            value={newLecture.startTime && newLecture.endTime ? `${newLecture.startTime}|${newLecture.endTime}` : ""}
                                            label="Time Slot"
                                            onChange={(e) => {
                                                if (!e.target.value) return;
                                                const [start, end] = e.target.value.split('|');
                                                setNewLecture({ ...newLecture, startTime: start, endTime: end });
                                            }}
                                        >
                                            <MenuItem value=""><em>Select Time Slot</em></MenuItem>
                                            {(lectureType === 'Lab' ? labSlots : theorySlots).map((slot, idx) => (
                                                <MenuItem key={idx} value={getSlotValue(slot)}>{slot}</MenuItem>
                                            ))}
                                        </MuiSelect>
                                    </FormControl>
                                </Box>
                                <Box sx={{ gridColumn: { md: 'span 2' } }}>
                                    <FormControl fullWidth size="small" required>
                                        <InputLabel>Subject</InputLabel>
                                        <MuiSelect
                                            value={newLecture.subjectId}
                                            label="Subject"
                                            onChange={(e) => setNewLecture({ ...newLecture, subjectId: e.target.value })}
                                        >
                                            <MenuItem value=""><em>Select Subject</em></MenuItem>
                                            {subjects.filter(s => s.semester.toString() === timetableFilter.semester.toString()).map(s => (
                                                <MenuItem key={s._id} value={s._id}>{s.name} ({s.code})</MenuItem>
                                            ))}
                                        </MuiSelect>
                                    </FormControl>
                                </Box>

                                <MuiButton type="submit" variant="contained" color="success" fullWidth startIcon={<Users size={18} />} sx={{ height: 40 }}>
                                    Schedule It
                                </MuiButton>
                            </Box>
                        </Card>

                        {/* Timetable View - Grid System */}
                        <div className="bg-slate-800/50 rounded-2xl shadow-xl border border-slate-700/50 overflow-hidden animate-fade-in-up delay-100 backdrop-blur-sm">
                            <div className="p-6 border-b border-slate-700/50 bg-slate-900/30 flex justify-between items-center">
                                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                    <Clock size={20} className="text-blue-400" />
                                    Weekly Timetable (Semester {timetableFilter.semester} - Section {timetableFilter.section})
                                </h3>
                                <span className="text-sm font-semibold text-slate-400 bg-slate-700/50 px-3 py-1 rounded-full">{timetable.length} Lectures</span>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-center border-collapse">
                                    <thead>
                                        <tr>
                                            <th className="p-4 bg-gray-900 text-white border-r border-gray-800 w-32 min-w-[140px]">
                                                <div className="flex flex-col items-center">
                                                    <Clock size={16} className="mb-1 text-blue-400" />
                                                    <span className="text-xs uppercase tracking-wider font-bold">Time Slot</span>
                                                </div>
                                            </th>
                                            {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(day => (
                                                <th key={day} className="p-4 bg-slate-900 text-white border-r border-slate-700 last:border-r-0 min-w-[160px]">
                                                    <span className="text-sm font-bold uppercase tracking-wide">{day}</span>
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-700/50">
                                        {ACADEMIC_SLOTS.map((slot, idx) => {
                                            if (slot.type === 'break') {
                                                return (
                                                    <tr key={idx} className="bg-amber-900/20">
                                                        <td colSpan="7" className="p-3 text-center border-y-2 border-amber-900/30">
                                                            <span className="text-xs font-black text-amber-500 tracking-[0.2em] uppercase bg-amber-900/40 px-4 py-1 rounded-full border border-amber-800/50 shadow-sm">
                                                                {slot.label} ({formatTime(slot.start)} - {formatTime(slot.end)})
                                                            </span>
                                                        </td>
                                                    </tr>
                                                );
                                            }

                                            return (
                                                <tr key={idx} className="hover:bg-slate-800/30 transition-colors h-24">
                                                    {/* Time Column */}
                                                    <td className="p-4 border-r border-slate-700 bg-slate-800/30 font-mono text-xs font-bold text-slate-400">
                                                        <div className="flex flex-col gap-1 items-center justify-center h-full">
                                                            <span className="text-sm text-white">{formatTime(slot.start)}</span>
                                                            <span className="text-slate-500 text-[10px] font-bold">⬇</span>
                                                            <span className="text-sm text-white">{formatTime(slot.end)}</span>
                                                        </div>
                                                    </td>

                                                    {/* Days Columns */}
                                                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(day => {
                                                        const lecture = timetable.find(t => t.day === day && t.startTime === slot.start);
                                                        const isOccupied = timetable.some(t => t.day === day && t.startTime < slot.start && t.endTime > slot.start);

                                                        if (isOccupied) return null; // Skip rendering if slot is covered by a previous rowSpan

                                                        // Calculate RowSpan based on duration
                                                        let rowSpan = 1;
                                                        if (lecture) {
                                                            const startHour = parseInt(lecture.startTime.split(':')[0]);
                                                            const startMin = parseInt(lecture.startTime.split(':')[1]);
                                                            const endHour = parseInt(lecture.endTime.split(':')[0]);
                                                            const endMin = parseInt(lecture.endTime.split(':')[1]);
                                                            const durationMinutes = (endHour * 60 + endMin) - (startHour * 60 + startMin);
                                                            rowSpan = Math.ceil(durationMinutes / 60);
                                                        }

                                                        return (
                                                            <td key={day} rowSpan={rowSpan} className={`p-4 border-r border-slate-700 relative group transition-all hover:bg-slate-800/50 vertical-top ${rowSpan > 1 ? 'z-10' : ''}`}>
                                                                {lecture ? (
                                                                    <div className={`absolute inset-2 border rounded-lg p-2 flex flex-col justify-between group hover:shadow-md transition-all ${lecture.type === 'Lab' ? 'bg-pink-900/10 border-pink-500/30' :
                                                                        lecture.type === 'Project' ? 'bg-purple-900/10 border-purple-500/30' : 'bg-blue-900/20 border-blue-800/30'
                                                                        } h-[calc(100%-16px)]`}>
                                                                        <div className="flex-1 flex flex-col justify-center">
                                                                            <div className={`font-bold text-sm leading-tight mb-1 line-clamp-2 ${lecture.type === 'Lab' ? 'text-pink-100' :
                                                                                lecture.type === 'Project' ? 'text-purple-100' : 'text-blue-100'
                                                                                }`}>
                                                                                {lecture.subjectId?.name}
                                                                            </div>
                                                                            <div className={`text-[10px] font-mono uppercase rounded px-1 w-max mx-auto ${lecture.type === 'Lab' ? 'text-pink-300 bg-pink-900/50' :
                                                                                lecture.type === 'Project' ? 'text-purple-300 bg-purple-900/50' : 'text-blue-300 bg-blue-900/50'
                                                                                }`}>
                                                                                {lecture.subjectId?.code} ({lecture.type || 'Theory'})
                                                                            </div>
                                                                        </div>

                                                                        <div className="mt-2 flex items-center gap-1.5 justify-center bg-slate-800/80 rounded-md py-1 px-2 border border-blue-800/30">
                                                                            <div className="w-4 h-4 rounded-full bg-indigo-900/50 text-indigo-300 flex items-center justify-center text-[9px] font-bold">
                                                                                {lecture.facultyId?.name?.charAt(0)}
                                                                            </div>
                                                                            <span className="text-[10px] text-slate-300 truncate max-w-[80px] font-medium">{lecture.facultyId?.name}</span>
                                                                        </div>

                                                                        {/* Hover Delete Action */}
                                                                        <button
                                                                            onClick={() => handleDeleteLecture(lecture._id)}
                                                                            className="absolute -top-1.5 -right-1.5 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-all shadow-sm hover:bg-red-600 hover:scale-110 z-10"
                                                                            title="Delete"
                                                                        >
                                                                            <LogOut size={12} />
                                                                        </button>
                                                                    </div>
                                                                ) : (
                                                                    <div className="min-h-[96px]"></div> /* Placeholder for empty slot height */
                                                                )}
                                                            </td>
                                                        );
                                                    })}

                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div >


                        {/* Copy Modal */}
                        {
                            showCopyModal && (
                                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 animate-fade-in backdrop-blur-sm">
                                    <div className="bg-slate-800 p-8 rounded-2xl shadow-2xl w-96 transform transition-all scale-100 border border-slate-700">
                                        <h2 className="text-xl font-bold mb-4 text-white">Copy From Day</h2>
                                        <p className="text-slate-400 mb-4 text-sm">Target: {timetableFilter.day} (Sem {timetableFilter.semester})</p>

                                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Source Day</label>
                                        <select
                                            className="w-full p-3 border border-slate-600 rounded-xl mb-6 bg-slate-700 text-white outline-none focus:ring-2 focus:ring-purple-500"
                                            value={copySourceDay}
                                            onChange={(e) => setCopySourceDay(e.target.value)}
                                        >
                                            {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
                                                .filter(d => d !== timetableFilter.day)
                                                .map(d => <option key={d} value={d}>{d}</option>)
                                            }
                                        </select>

                                        {/* Lecture Selection List */}
                                        <div className="space-y-3 mb-6 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                                                Select Lectures ({selectedLectureIds.length} / {timetable.filter(t => t.day === copySourceDay).length})
                                            </label>

                                            {timetable.filter(t => t.day === copySourceDay).length === 0 ? (
                                                <p className="text-sm text-slate-500 italic">No lectures found on {copySourceDay}.</p>
                                            ) : (
                                                timetable
                                                    .filter(t => t.day === copySourceDay)
                                                    .sort((a, b) => a.startTime.localeCompare(b.startTime))
                                                    .map(t => (
                                                        <div key={t._id} className="flex items-center gap-3 p-3 bg-slate-700/50 rounded-xl border border-slate-600 hover:bg-slate-600/50 transition-colors cursor-pointer"
                                                            onClick={() => {
                                                                if (selectedLectureIds.includes(t._id)) {
                                                                    setSelectedLectureIds(selectedLectureIds.filter(id => id !== t._id));
                                                                } else {
                                                                    setSelectedLectureIds([...selectedLectureIds, t._id]);
                                                                }
                                                            }}
                                                        >
                                                            <input
                                                                type="checkbox"
                                                                checked={selectedLectureIds.includes(t._id)}
                                                                onChange={() => { }} // Handle click on parent div
                                                                className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 border-gray-300"
                                                            />
                                                            <div className="flex-1">
                                                                <div className="font-bold text-white text-sm">{t.subjectId?.name}</div>
                                                                <div className="text-xs text-slate-400 font-mono">{t.startTime} - {t.endTime} • {t.facultyId?.name}</div>
                                                            </div>
                                                        </div>
                                                    ))
                                            )}
                                        </div>

                                        <div className="flex justify-end gap-3">
                                            <button onClick={() => setShowCopyModal(false)} className="px-4 py-2 text-slate-400 hover:bg-slate-700 rounded-lg transition-colors">Cancel</button>
                                            <button onClick={handleCopyTimetable} className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 shadow-lg shadow-purple-500/30">Copy</button>
                                        </div>
                                    </div>
                                </div>
                            )
                        }

                        {/* Bulk Add Modal */}
                        {
                            showBulkModal && (
                                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
                                    <div className="bg-slate-800 p-8 rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto border border-slate-700 custom-scrollbar">
                                        <div className="flex justify-between items-center mb-8 border-b border-slate-700 pb-4">
                                            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                                                <div className="p-2 bg-indigo-500/20 rounded-lg text-indigo-400">
                                                    <Upload size={24} />
                                                </div>
                                                Bulk Add Lectures
                                                <span className="text-sm font-medium bg-slate-700 px-3 py-1 rounded-full text-slate-300 ml-2">
                                                    {timetableFilter.day}
                                                </span>
                                            </h2>
                                            <button onClick={() => setShowBulkModal(false)} className="text-slate-400 hover:text-white transition-colors">
                                                <LogOut size={24} className="rotate-180" /> {/* Close icon visual using logout rotated, or simple X would be better but reusing imported icons */}
                                            </button>
                                        </div>

                                        <div className="space-y-4 mb-8">
                                            {bulkLectures.map((row, idx) => (
                                                <div key={idx} className="group grid grid-cols-1 md:grid-cols-12 gap-6 items-end bg-slate-700/30 hover:bg-slate-700/50 p-6 rounded-2xl border border-slate-600 hover:border-indigo-400/50 hover:shadow-lg transition-all duration-300 relative">

                                                    {/* Row Number Indicator */}
                                                    <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-slate-700 border border-slate-600 rounded-full flex items-center justify-center text-xs font-bold text-slate-400 shadow-sm z-10 hidden md:flex">
                                                        {idx + 1}
                                                    </div>

                                                    <div className="md:col-span-4">
                                                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Time Slot</label>
                                                        <select
                                                            className="w-full p-3 border border-slate-600 rounded-xl bg-slate-800 text-white focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all font-medium"
                                                            onChange={(e) => {
                                                                if (!e.target.value) return;
                                                                const [start, end] = e.target.value.split('|');
                                                                const newRows = [...bulkLectures];
                                                                newRows[idx].startTime = start;
                                                                newRows[idx].endTime = end;
                                                                setBulkLectures(newRows);
                                                            }}
                                                        >
                                                            <option value="">Select Slot</option>
                                                            {ACADEMIC_SLOTS.filter(s => s.type === 'lecture').map((slot, i) => (
                                                                <option key={i} value={`${slot.start}|${slot.end}`}>
                                                                    {formatTime(slot.start)} - {formatTime(slot.end)}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                    <div className="md:col-span-3">
                                                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Subject</label>
                                                        <select
                                                            className="w-full p-3 border border-slate-600 rounded-xl bg-slate-800 text-white focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all font-medium"
                                                            value={row.subjectId}
                                                            onChange={(e) => {
                                                                const newRows = [...bulkLectures];
                                                                newRows[idx].subjectId = e.target.value;
                                                                setBulkLectures(newRows);
                                                            }}
                                                        >
                                                            <option value="">Select Subject</option>
                                                            {subjects.filter(s => s.semester.toString() === timetableFilter.semester.toString()).map(s => (
                                                                <option key={s._id} value={s._id}>{s.name}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                    <div className="md:col-span-3">
                                                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Faculty</label>
                                                        <select
                                                            className="w-full p-3 border border-slate-600 rounded-xl bg-slate-800 text-white focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all font-medium"
                                                            value={row.facultyId}
                                                            onChange={(e) => {
                                                                const newRows = [...bulkLectures];
                                                                newRows[idx].facultyId = e.target.value;
                                                                setBulkLectures(newRows);
                                                            }}
                                                        >
                                                            <option value="">Auto-Assign</option>
                                                            {faculties.map(f => <option key={f._id} value={f._id}>{f.name}</option>)}
                                                        </select>
                                                    </div>
                                                    <div className="md:col-span-2 flex justify-end">
                                                        <button
                                                            onClick={() => {
                                                                const newRows = bulkLectures.filter((_, i) => i !== idx);
                                                                setBulkLectures(newRows);
                                                            }}
                                                            className="p-3 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl transition-all border border-transparent hover:border-red-500/20 group-hover:bg-slate-800"
                                                            title="Remove Row"
                                                        >
                                                            <span className="font-bold text-sm">Remove</span>
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="flex justify-between items-center pt-6 border-t border-slate-700">
                                            <button
                                                onClick={() => setBulkLectures([...bulkLectures, { startTime: '', endTime: '', subjectId: '', facultyId: '' }])}
                                                className="flex items-center gap-2 text-indigo-400 font-bold hover:bg-indigo-500/10 px-4 py-2 rounded-xl transition-colors"
                                            >
                                                <div className="w-6 h-6 rounded-full bg-indigo-500/20 flex items-center justify-center text-xs">+</div>
                                                Add Another Row
                                            </button>

                                            <div className="flex gap-4">
                                                <button onClick={() => setShowBulkModal(false)} className="px-6 py-3 text-slate-400 hover:bg-slate-700/50 hover:text-white rounded-xl font-bold transition-colors">Cancel</button>
                                                <button onClick={handleBulkSave} className="bg-indigo-600 text-white px-8 py-3 rounded-xl hover:bg-indigo-700 shadow-xl shadow-indigo-500/30 font-bold transition-transform hover:-translate-y-0.5 active:scale-95 flex items-center gap-2">
                                                    <Upload size={20} />
                                                    Save All Lectures
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )
                        }
                    </Box>
                )
            }

            {
                activeTab === 'sections' && (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, animation: 'fadeInUp 0.5s ease-out' }}>
                        <Card sx={{ p: 3, borderRadius: 2, boxShadow: 3, bgcolor: 'background.paper' }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                                <Typography variant="h6" fontWeight="bold" display="flex" alignItems="center" gap={1}>
                                    <LayoutDashboard size={24} color="#2196f3" />
                                    Section Management
                                </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                                <MuiButton variant="contained" color="success" onClick={() => setShowCreateSectionModal(true)} startIcon={<span style={{fontSize:'1.2rem', lineHeight: 1}}>+</span>}>
                                    Create Section
                                </MuiButton>
                                <MuiButton variant="contained" color="secondary" onClick={() => setShowAssignModal(true)} startIcon={<Users size={18} />}>
                                    Assign Students
                                </MuiButton>
                                <FormControl size="small" sx={{ minWidth: 150 }}>
                                    <InputLabel>Semester</InputLabel>
                                    <MuiSelect value={semesterFilter} label="Semester" onChange={(e) => setSemesterFilter(e.target.value)}>
                                        <MenuItem value=""><em>Select Semester</em></MenuItem>
                                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(s => <MenuItem key={s} value={s}>Semester {s}</MenuItem>)}
                                    </MuiSelect>
                                </FormControl>
                            </Box>
                        </Card>

                        <Grid container spacing={3}>
                            {sections.length === 0 ? (
                                <Grid item xs={12}>
                                    <Typography color="text.secondary" align="center" sx={{ py: 6 }}>
                                        {semesterFilter ? 'No sections found. Sections are auto-created when students are added.' : 'Select a semester to view sections.'}
                                    </Typography>
                                </Grid>
                            ) : (
                                sections.map(section => (
                                    <Grid item xs={12} md={6} lg={4} key={section._id}>
                                        <Card variant="outlined" sx={{ borderRadius: 2, transition: 'all 0.3s', '&:hover': { borderColor: 'primary.main', boxShadow: 2 } }}>
                                            <CardContent>
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                                                    <Box>
                                                        <Typography variant="h5" fontWeight="bold">Section {section.sectionName}</Typography>
                                                        <Typography variant="body2" color="text.secondary">Semester {section.semester}</Typography>
                                                    </Box>
                                                    <Chip label={section.status} size="small" color={section.status === 'Active' ? 'success' : 'error'} variant="filled" />
                                                </Box>

                                                <Box sx={{ mb: 3 }}>
                                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                                        <Typography variant="body2" color="text.secondary">Capacity</Typography>
                                                        <Typography variant="body2" fontWeight="medium">{section.currentStrength} / {section.maxCapacity}</Typography>
                                                    </Box>
                                                    <Box sx={{ width: '100%', bgcolor: 'background.default', borderRadius: 1, height: 8, overflow: 'hidden' }}>
                                                        <Box sx={{ bgcolor: 'primary.main', height: '100%', transition: 'all 0.3s', width: `${Math.min((section.currentStrength / section.maxCapacity) * 100, 100)}%` }} />
                                                    </Box>
                                                </Box>

                                                <Box sx={{ pt: 2, borderTop: '1px solid', borderColor: 'divider', display: 'flex', gap: 1 }}>
                                                    <MuiButton
                                                        fullWidth
                                                        variant="contained"
                                                        color={section.status === 'Active' ? 'inherit' : 'primary'}
                                                        sx={{ bgcolor: section.status === 'Active' ? 'action.hover' : undefined }}
                                                        onClick={async () => {
                                                            try {
                                                                const token = localStorage.getItem('token');
                                                                const newStatus = section.status === 'Active' ? 'Inactive' : 'Active';
                                                                await axios.patch(`http://localhost:5000/api/sections/${section._id}`, { status: newStatus }, {
                                                                    headers: { Authorization: `Bearer ${token}` }
                                                                });
                                                                const res = await axios.get(`http://localhost:5000/api/sections?semester=${semesterFilter}`, {
                                                                    headers: { Authorization: `Bearer ${token}` }
                                                                });
                                                                setSections(res.data);
                                                            } catch (e) { alert('Failed to update status'); }
                                                        }}
                                                    >
                                                        {section.status === 'Active' ? 'Deactivate' : 'Activate'}
                                                    </MuiButton>
                                                </Box>
                                            </CardContent>
                                        </Card>
                                    </Grid>
                                ))
                            )}
                        </Grid>

                        {/* Create Section Modal */}
                        <Dialog open={showCreateSectionModal} onClose={() => setShowCreateSectionModal(false)} maxWidth="xs" fullWidth>
                            <Box sx={{ p: 3, bgcolor: 'background.paper' }}>
                                <Typography variant="h5" fontWeight="bold" mb={3}>Create New Section</Typography>
                                <Box component="form" onSubmit={handleCreateSection} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                    <TextField
                                        label="Section Name"
                                        placeholder="e.g. A, B, C"
                                        value={createSectionData.sectionName}
                                        onChange={(e) => setCreateSectionData({ ...createSectionData, sectionName: e.target.value })}
                                        required
                                        fullWidth
                                    />
                                    <FormControl fullWidth required>
                                        <InputLabel>Semester</InputLabel>
                                        <MuiSelect
                                            value={createSectionData.semester}
                                            label="Semester"
                                            onChange={(e) => setCreateSectionData({ ...createSectionData, semester: e.target.value })}
                                        >
                                            <MenuItem value=""><em>Select Semester</em></MenuItem>
                                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(s => <MenuItem key={s} value={s}>Semester {s}</MenuItem>)}
                                        </MuiSelect>
                                    </FormControl>
                                    <TextField
                                        type="number"
                                        label="Max Capacity"
                                        value={createSectionData.maxCapacity}
                                        onChange={(e) => setCreateSectionData({ ...createSectionData, maxCapacity: e.target.value })}
                                        required
                                        fullWidth
                                    />
                                    <Box sx={{ display: 'flex', gap: 2, pt: 2, mt: 1 }}>
                                        <MuiButton fullWidth variant="outlined" onClick={() => setShowCreateSectionModal(false)}>Cancel</MuiButton>
                                        <MuiButton fullWidth variant="contained" color="primary" type="submit">Create</MuiButton>
                                    </Box>
                                </Box>
                            </Box>
                        </Dialog>

                        {/* Assign Students Modal */}
                        <Dialog open={showAssignModal} onClose={() => setShowAssignModal(false)} maxWidth="md" fullWidth>
                            <Box sx={{ p: { xs: 2, md: 4 }, bgcolor: 'background.paper', display: 'flex', flexDirection: 'column', height: '80vh' }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                                    <Typography variant="h5" fontWeight="bold">Assign Students to Section</Typography>
                                    <IconButton onClick={() => setShowAssignModal(false)}><LogOut size={20} className="rotate-180" /></IconButton>
                                </Box>

                                <Grid container spacing={4} sx={{ flex: 1, overflow: 'hidden' }}>
                                    {/* Left: Unassigned Students */}
                                    <Grid item xs={12} md={6} sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                                        <Paper variant="outlined" sx={{ display: 'flex', flexDirection: 'column', height: '100%', p: 2, bgcolor: 'background.default' }}>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                                <Typography variant="subtitle1" fontWeight="bold">Unassigned (Sem {semesterFilter})</Typography>
                                                <MuiButton
                                                    size="small"
                                                    onClick={() => {
                                                        if (assignData.studentIds.length > 0) {
                                                            setAssignData({ ...assignData, studentIds: [] });
                                                        } else {
                                                            const selectedSection = sections.find(s => s._id === assignData.sectionId);
                                                            if (!selectedSection) {
                                                                alert("Please select a target section first.");
                                                                return;
                                                            }
                                                            const available = selectedSection.maxCapacity - selectedSection.currentStrength;
                                                            if (available <= 0) {
                                                                alert("Section is already full!");
                                                                return;
                                                            }
                                                            const toSelect = unassignedStudents.slice(0, available).map(s => s._id);
                                                            setAssignData({ ...assignData, studentIds: toSelect });
                                                        }
                                                    }}
                                                >
                                                    {assignData.studentIds.length > 0 ? 'Deselect All' : 'Select Max Fit'}
                                                </MuiButton>
                                            </Box>
                                            <Box sx={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 1 }}>
                                                {unassignedStudents.length === 0 ? (
                                                    <Typography color="text.secondary" align="center" py={4}>No unassigned students found.</Typography>
                                                ) : (
                                                    unassignedStudents.map(student => (
                                                        <label key={student._id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px', backgroundColor: 'var(--mui-palette-background-paper)', borderRadius: '8px', cursor: 'pointer', border: '1px solid var(--mui-palette-divider)' }}>
                                                            <input
                                                                type="checkbox"
                                                                style={{ width: 16, height: 16 }}
                                                                checked={assignData.studentIds.includes(student._id)}
                                                                onChange={(e) => {
                                                                    if (e.target.checked) {
                                                                        setAssignData(prev => ({ ...prev, studentIds: [...prev.studentIds, student._id] }));
                                                                    } else {
                                                                        setAssignData(prev => ({ ...prev, studentIds: prev.studentIds.filter(id => id !== student._id) }));
                                                                    }
                                                                }}
                                                            />
                                                            <Box>
                                                                <Typography variant="body2" fontWeight="medium">{student.name}</Typography>
                                                                <Typography variant="caption" color="text.secondary">{student.loginId}</Typography>
                                                            </Box>
                                                        </label>
                                                    ))
                                                )}
                                            </Box>
                                            <Typography variant="caption" color="text.secondary" sx={{ pt: 1 }}>Selected: {assignData.studentIds.length}</Typography>
                                        </Paper>
                                    </Grid>

                                    {/* Right: Target Section */}
                                    <Grid item xs={12} md={6} sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 3 }}>
                                        <Box>
                                            <Typography variant="subtitle1" fontWeight="bold" mb={1}>Target Section</Typography>
                                            <FormControl fullWidth>
                                                <InputLabel>Select Section</InputLabel>
                                                <MuiSelect
                                                    value={assignData.sectionId}
                                                    label="Select Section"
                                                    onChange={(e) => setAssignData({ ...assignData, sectionId: e.target.value })}
                                                >
                                                    <MenuItem value=""><em>Select Section</em></MenuItem>
                                                    {sections.map(s => (
                                                        <MenuItem key={s._id} value={s._id}>
                                                            Section {s.sectionName} ({s.currentStrength}/{s.maxCapacity})
                                                        </MenuItem>
                                                    ))}
                                                </MuiSelect>
                                            </FormControl>
                                            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                                                Ensure the section has enough capacity for the selected students.
                                            </Typography>
                                        </Box>

                                        <MuiButton
                                            variant="contained"
                                            color="primary"
                                            size="large"
                                            onClick={handleAssignStudents}
                                            disabled={assignData.studentIds.length === 0 || !assignData.sectionId}
                                            sx={{ py: 1.5 }}
                                        >
                                            Assign {assignData.studentIds.length} Students
                                        </MuiButton>
                                    </Grid>
                                </Grid>
                            </Box>
                        </Dialog>
                    </Box>
                )
            }

            {activeTab === 'profile' && <ProfileSection />}
            <ConfirmDialog 
                open={confirmDialog.open}
                title={confirmDialog.title}
                description={confirmDialog.description}
                type={confirmDialog.type}
                confirmText={confirmDialog.type === 'danger' ? 'Yes, Continue' : 'Confirm'}
                onConfirm={() => {
                    if (confirmDialog.action) confirmDialog.action();
                }}
                onClose={closeConfirmDialog}
            />
        </Layout>
    );
};

export default AdminDashboard;
