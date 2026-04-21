import { useNavigate, Link } from "react-router-dom";
import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import {
  LayoutDashboard,
  Users,
  LogOut,
  FileText,
  Shield,
  Calendar,
  Users as UsersIcon,
  AlertCircle,
  CheckCircle,
  Clock,
  Eye,
  EyeIcon,
  ScanEye,
  Search,
} from "lucide-react";
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  TextField,
  InputAdornment,
  FormControl,
  Select,
  MenuItem,
  InputLabel,
} from "@mui/material";

import SecuritySection from "../components/SecuritySection";
import ProfileSection from "../components/ProfileSection";
import StatCard from "../components/StatCard";
import Layout from "../components/Layout";
import { Skeleton } from 'boneyard-js/react';
import { useDelayedLoading } from '../hooks/useDelayedLoading';

const FacultyDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  const [greeting, setGreeting] = useState("");
  const [user, setUser] = useState(null);

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Good Morning");
    else if (hour < 18) setGreeting("Good Afternoon");
    else setGreeting("Good Evening");

    const fetchUser = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get("http://localhost:5000/api/users/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUser(res.data);
      } catch (err) {
        console.error("Error fetching user:", err);
      }
    };
    fetchUser();
  }, []);

  const [stats, setStats] = useState({
    pending: 0,
    delayed: 0,
    reviewed: 0,
    totalHandled: 0,
  });
  const [loadingStats, setLoadingStats] = useState(true);
  const showLoadingStats = useDelayedLoading(loadingStats);
  const [statsError, setStatsError] = useState("");

  const [students, setStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const showLoadingStudents = useDelayedLoading(loadingStudents);
  const [studentsError, setStudentsError] = useState("");

  const [counseledStudents, setCounseledStudents] = useState([]);
  const [loadingCounseled, setLoadingCounseled] = useState(true);
  const showLoadingCounseled = useDelayedLoading(loadingCounseled);
  const [counseledError, setCounseledError] = useState("");

  const [studentSearchTerm, setStudentSearchTerm] = useState("");
  const [studentSemesterFilter, setStudentSemesterFilter] = useState("");

  const [counseleeSearchTerm, setCounseleeSearchTerm] = useState("");
  const [counseleeSemesterFilter, setCounseleeSemesterFilter] = useState("");

  const filteredStudents = useMemo(() => {
    return students.filter((student) => {
      const matchesSearch =
        studentSearchTerm === "" ||
        (student.name?.toLowerCase() || "").includes(studentSearchTerm.toLowerCase()) ||
        (student.loginId?.toLowerCase() || "").includes(studentSearchTerm.toLowerCase());

      const matchesSemester =
        studentSemesterFilter === "" ||
        String(student.semester) === String(studentSemesterFilter);

      return matchesSearch && matchesSemester;
    });
  }, [students, studentSearchTerm, studentSemesterFilter]);

  const filteredCounselees = useMemo(() => {
    return counseledStudents.filter((alloc) => {
      const student = alloc.studentId || {};
      const matchesSearch =
        counseleeSearchTerm === "" ||
        (student.name?.toLowerCase() || "").includes(counseleeSearchTerm.toLowerCase()) ||
        (student.loginId?.toLowerCase() || "").includes(counseleeSearchTerm.toLowerCase());

      const matchesSemester =
        counseleeSemesterFilter === "" ||
        String(alloc.semester) === String(counseleeSemesterFilter);

      return matchesSearch && matchesSemester;
    });
  }, [counseledStudents, counseleeSearchTerm, counseleeSemesterFilter]);

  useEffect(() => {
    const fetchStats = async () => {
      setLoadingStats(true);
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(
          "http://localhost:5000/api/requests/stats/faculty",
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        setStats(res.data);
      } catch (err) {
        console.error("Error fetching stats:", err);
        setStatsError("Failed to fetch dashboard statistics.");
      } finally {
        setLoadingStats(false);
      }
    };
    const fetchStudents = async () => {
      setLoadingStudents(true);
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(
          "http://localhost:5000/api/users/faculty/students",
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        setStudents(res.data);
      } catch (err) {
        console.error("Error fetching students:", err);
        setStudentsError("Failed to fetch students.");
      } finally {
        setLoadingStudents(false);
      }
    };

    const fetchCounseledStudents = async () => {
      setLoadingCounseled(true);
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(
          "http://localhost:5000/api/mentors/faculty",
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        setCounseledStudents(res.data);
      } catch (err) {
        console.error("Error fetching counseled students:", err);
        setCounseledError("Failed to fetch counseled students.");
      } finally {
        setLoadingCounseled(false);
      }
    };

    fetchStats();
    fetchStudents();
    fetchCounseledStudents();
  }, []);

  const displayCards = showLoadingStats ? Array(8).fill({ title: "Loading...", value: "-", icon: Calendar }) : [
    {
      title: "Today's Lectures",
      value: "5",
      icon: Calendar,
    },
    {
      title: "Assigned Students",
      value: counseledStudents.length,
      icon: UsersIcon,
    },
    {
      title: "Pending Requests",
      value: stats.pending,
      icon: AlertCircle,
    },
    {
      title: "Completed Sessions",
      value: "3",
      icon: CheckCircle,
    },
    {
      title: "Pending Review",
      value: stats.pending,
      icon: Clock,
      color: "warning",
    },
    {
      title: "Delayed Requests",
      value: stats.delayed,
      icon: Clock,
      color: "error",
    },
    {
      title: "Reviewed by Me",
      value: stats.reviewed,
      icon: ScanEye,
      color: "info",
    },
    {
      title: "Total Handled",
      value: stats.totalHandled,
      icon: CheckCircle,
      color: "secondary",
    },
  ];

  const half = Math.ceil(displayCards.length / 2);
  const firstRow = displayCards.slice(0, half);
  const secondRow = displayCards.slice(half);

  return (
    <Layout role="Faculty" activeTab={activeTab} setActiveTab={setActiveTab}>
      <Box sx={{ width: "100%", animation: "fadeInUp 0.5s ease-out" }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 4,
          }}
        >
          <Typography variant="h4" fontWeight="bold">
            {greeting}, {user?.name || "Professor"}
          </Typography>
        </Box>

        {activeTab === "overview" && (
          <>
            <Box sx={{ mb: 4 }}>
              {statsError && (
                  <Box mb={3} p={2} bgcolor="error.light" borderRadius={2} border={1} borderColor="error.main">
                      <Typography color="error.dark" fontWeight="bold" display="flex" alignItems="center" gap={1}>
                          <AlertCircle size={20} /> {statsError}
                      </Typography>
                  </Box>
              )}
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 3, mb: 3 }}>
                {firstRow.map((card, index) => (
                  <Box key={index} sx={{ flex: 1, minWidth: { xs: '100%', sm: '45%', md: '20%' } }}>
                    <Skeleton name="stat-card" loading={showLoadingStats}>
                      <StatCard sx={{ width: "100%", height: "100%" }} {...card} />
                    </Skeleton>
                  </Box>
                ))}
              </Box>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
                {secondRow.map((card, index) => (
                  <Box key={index} sx={{ flex: 1, minWidth: { xs: '100%', sm: '45%', md: '20%' } }}>
                    <Skeleton name="stat-card" loading={showLoadingStats}>
                      <StatCard sx={{ width: "100%", height: "100%" }} {...card} />
                    </Skeleton>
                  </Box>
                ))}
              </Box>
            </Box>

            <Card
              sx={{
                textAlign: "center",
                p: { xs: 3, md: 5 },
                borderRadius: 3,
                boxShadow: 1,
                border: "1px solid",
                borderColor: "divider",
              }}
            >
              <Typography variant="h5" fontWeight="bold" mb={2}>
                Academic Requests & Quick Tools
              </Typography>
              <Typography color="text.secondary" mb={4}>
                Review requests, manage attendance, or grade assessments.
              </Typography>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  gap: 2,
                  flexWrap: "wrap",
                }}
              >
                <Button
                  component={Link}
                  to="/faculty/requests"
                  variant="contained"
                  color="primary"
                  startIcon={<FileText size={18} />}
                  sx={{ py: 1.5, px: 3, borderRadius: 2 }}
                >
                  Review Requests
                </Button>
                <Button
                  component={Link}
                  to="/faculty/attendance"
                  variant="contained"
                  color="success"
                  startIcon={<FileText size={18} />}
                  sx={{ py: 1.5, px: 3, borderRadius: 2 }}
                >
                  Manage Attendance
                </Button>
                <Button
                  component={Link}
                  to="/faculty/assessments"
                  variant="contained"
                  color="warning"
                  startIcon={<FileText size={18} />}
                  sx={{ py: 1.5, px: 3, borderRadius: 2 }}
                >
                  Assessments
                </Button>
              </Box>
            </Card>
          </>
        )}

        {activeTab === "students" && (
          <Card sx={{ borderRadius: 2, boxShadow: 2, overflow: "hidden" }}>
            <Box sx={{ p: 3, borderBottom: 1, borderColor: "divider", display: "flex", flexDirection: { xs: "column", md: "row" }, justifyContent: "space-between", alignItems: { xs: "stretch", md: "center" }, gap: 2 }}>
              <Box>
                <Typography
                  variant="h6"
                  fontWeight="bold"
                  display="flex"
                  alignItems="center"
                  gap={1}
                >
                  <Box sx={{ display: "flex", color: "primary.main" }}>
                    <Users size={20} />
                  </Box>
                  Students (Departmental)
                </Typography>
                <Typography variant="body2" color="text.secondary" mt={0.5}>
                  Showing students from your department who have submitted
                  requests.
                </Typography>
              </Box>

              <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, gap: 2, alignItems: "center" }}>
                <TextField
                  placeholder="Search name or ID..."
                  value={studentSearchTerm}
                  onChange={(e) => setStudentSearchTerm(e.target.value)}
                  variant="outlined"
                  size="small"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Search size={18} />
                      </InputAdornment>
                    ),
                  }}
                  sx={{ width: { xs: "100%", sm: 220 } }}
                />

                <FormControl size="small" sx={{ minWidth: 150 }}>
                  <InputLabel>Semester</InputLabel>
                  <Select
                    value={studentSemesterFilter}
                    label="Semester"
                    onChange={(e) => setStudentSemesterFilter(e.target.value)}
                  >
                    <MenuItem value=""><em>All Semesters</em></MenuItem>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(s => (
                      <MenuItem key={s} value={s}>Semester {s}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
            </Box>
            <TableContainer
              component={Paper}
              elevation={0}
              sx={{ borderRadius: 0 }}
            >
              <Table sx={{ minWidth: 650 }}>
                <TableHead sx={{ bgcolor: "action.hover" }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: "bold" }}>#</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>Login ID</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>Name</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>Semester</TableCell>
                    <TableCell sx={{ fontWeight: "bold", textAlign: "center" }}>
                      Total Requests
                    </TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {showLoadingStudents ? (
                    Array(5).fill({}).map((_, index) => (
                        <TableRow hover key={`skeleton-${index}`}>
                            <TableCell colSpan={6} align="center" sx={{ py: 3, color: 'text.secondary' }}>Loading...</TableCell>
                        </TableRow>
                    ))
                  ) : studentsError ? (
                    <TableRow>
                        <TableCell colSpan={6} align="center" sx={{ py: 3, color: 'error.main' }}>
                            {studentsError}
                        </TableCell>
                    </TableRow>
                  ) : filteredStudents.length > 0 ? (
                    filteredStudents.map((student, index) => (
                        <TableRow hover key={student._id}>
                          <TableCell sx={{ fontFamily: "monospace" }}>
                            {index + 1}
                          </TableCell>
                          <TableCell sx={{ fontWeight: "medium" }}>
                            {student.loginId}
                          </TableCell>
                          <TableCell>{student.name}</TableCell>
                          <TableCell>{student.semester}</TableCell>
                          <TableCell align="center">
                            <Typography fontWeight="bold" color="primary">
                              {student.totalRequests}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={student.status || "Active"}
                              color={
                                student.status === "Deactivated"
                                  ? "error"
                                  : "success"
                              }
                              size="small"
                              variant="outlined"
                              sx={{ fontWeight: "bold" }}
                            />
                          </TableCell>
                        </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                        <Typography color="text.secondary">
                          No students found (Only students with requests appear
                          here).
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        )}

        {activeTab === "mentored" && (
          <Card sx={{ borderRadius: 2, boxShadow: 2, overflow: "hidden" }}>
            <Box
              sx={{
                p: 3,
                borderBottom: 1,
                borderColor: "divider",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 2,
              }}
            >
              <Box>
                <Typography
                  variant="h6"
                  fontWeight="bold"
                  display="flex"
                  alignItems="center"
                  gap={1}
                >
                  <Box sx={{ display: "flex", color: "secondary.main" }}>
                    <Users size={20} />
                  </Box>
                  My Counselees
                </Typography>
                <Typography variant="body2" color="text.secondary" mt={0.5}>
                  List of students assigned to you.
                </Typography>
              </Box>

              <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, gap: 2, alignItems: "center" }}>
                <TextField
                  placeholder="Search name or ID..."
                  value={counseleeSearchTerm}
                  onChange={(e) => setCounseleeSearchTerm(e.target.value)}
                  variant="outlined"
                  size="small"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Search size={18} />
                      </InputAdornment>
                    ),
                  }}
                  sx={{ width: { xs: "100%", sm: 220 } }}
                />

                <FormControl size="small" sx={{ minWidth: 150 }}>
                  <InputLabel>Semester</InputLabel>
                  <Select
                    value={counseleeSemesterFilter}
                    label="Semester"
                    onChange={(e) => setCounseleeSemesterFilter(e.target.value)}
                  >
                    <MenuItem value=""><em>All Semesters</em></MenuItem>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(s => (
                      <MenuItem key={s} value={s}>Semester {s}</MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <Button
                  component={Link}
                  to="/faculty/chat"
                  variant="contained"
                  color="secondary"
                  sx={{ fontWeight: "medium", borderRadius: 2, ml: { sm: 2 } }}
                >
                  💬 Message Counselees
                </Button>
              </Box>
            </Box>
            <TableContainer
              component={Paper}
              elevation={0}
              sx={{ borderRadius: 0 }}
            >
              <Table sx={{ minWidth: 600 }}>
                <TableHead sx={{ bgcolor: "action.hover" }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: "bold" }}>
                      Student Name
                    </TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>Semester</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>Login ID</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {showLoadingCounseled ? (
                    Array(5).fill({}).map((_, index) => (
                        <TableRow hover key={`skeleton-${index}`}>
                            <TableCell colSpan={4} align="center" sx={{ py: 3, color: 'text.secondary' }}>Loading...</TableCell>
                        </TableRow>
                    ))
                  ) : counseledError ? (
                    <TableRow>
                        <TableCell colSpan={4} align="center" sx={{ py: 3, color: 'error.main' }}>
                            {counseledError}
                        </TableCell>
                    </TableRow>
                  ) : filteredCounselees.length > 0 ? (
                    filteredCounselees.map((alloc) => (
                        <TableRow hover key={alloc._id}>
                          <TableCell sx={{ fontWeight: "medium" }}>
                            {alloc.studentId?.name}
                          </TableCell>
                          <TableCell color="text.secondary">
                            Sem {alloc.semester}
                          </TableCell>
                          <TableCell sx={{ fontFamily: "monospace" }}>
                            {alloc.studentId?.loginId}
                          </TableCell>
                          <TableCell>
                            <Chip
                              label="Active"
                              color="success"
                              size="small"
                              variant="outlined"
                              sx={{ fontWeight: "bold" }}
                            />
                          </TableCell>
                        </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} align="center" sx={{ py: 4 }}>
                        <Typography color="text.secondary">
                          No students assigned.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        )}

        {activeTab === "security" && <SecuritySection />}
        {activeTab === "profile" && <ProfileSection />}
      </Box>
    </Layout>
  );
};

export default FacultyDashboard;
