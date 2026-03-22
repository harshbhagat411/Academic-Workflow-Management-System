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

  const [students, setStudents] = useState([]);
  const [mentoredStudents, setMentoredStudents] = useState([]);

  const [studentSearchTerm, setStudentSearchTerm] = useState("");
  const [studentSemesterFilter, setStudentSemesterFilter] = useState("");

  const [menteeSearchTerm, setMenteeSearchTerm] = useState("");
  const [menteeSemesterFilter, setMenteeSemesterFilter] = useState("");

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

  const filteredMentees = useMemo(() => {
    return mentoredStudents.filter((alloc) => {
      const student = alloc.studentId || {};
      const matchesSearch =
        menteeSearchTerm === "" ||
        (student.name?.toLowerCase() || "").includes(menteeSearchTerm.toLowerCase()) ||
        (student.loginId?.toLowerCase() || "").includes(menteeSearchTerm.toLowerCase());

      const matchesSemester =
        menteeSemesterFilter === "" ||
        String(alloc.semester) === String(menteeSemesterFilter);

      return matchesSearch && matchesSemester;
    });
  }, [mentoredStudents, menteeSearchTerm, menteeSemesterFilter]);

  useEffect(() => {
    const fetchStats = async () => {
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
      }
    };
    const fetchStudents = async () => {
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
      }
    };

    const fetchMentoredStudents = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(
          "http://localhost:5000/api/mentors/faculty",
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        setMentoredStudents(res.data);
      } catch (err) {
        console.error("Error fetching mentored students:", err);
      }
    };

    fetchStats();
    fetchStudents();
    fetchMentoredStudents();
  }, []);

  const cards = [
    {
      title: "Today's Lectures",
      value: "5",
      icon: Calendar,
    },
    {
      title: "Assigned Students",
      value: mentoredStudents.length,
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

  const half = Math.ceil(cards.length / 2);
  const firstRow = cards.slice(0, half);
  const secondRow = cards.slice(half);

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
              <Box sx={{ display: "flex", gap: 3, mb: 3 }}>
                {firstRow.map((card, index) => (
                  <Box key={index} sx={{ flex: 1 }}>
                    <StatCard sx={{ width: "100%", height: "100%" }} {...card} />
                  </Box>
                ))}
              </Box>
              <Box sx={{ display: "flex", gap: 3 }}>
                {secondRow.map((card, index) => (
                  <Box key={index} sx={{ flex: 1 }}>
                    <StatCard sx={{ width: "100%", height: "100%" }} {...card} />
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
                  {filteredStudents.length > 0 ? (
                    filteredStudents.map((student, index) => (
                      <TableRow key={student._id} hover>
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
                  My Mentees
                </Typography>
                <Typography variant="body2" color="text.secondary" mt={0.5}>
                  List of students assigned to you.
                </Typography>
              </Box>

              <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, gap: 2, alignItems: "center" }}>
                <TextField
                  placeholder="Search name or ID..."
                  value={menteeSearchTerm}
                  onChange={(e) => setMenteeSearchTerm(e.target.value)}
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
                    value={menteeSemesterFilter}
                    label="Semester"
                    onChange={(e) => setMenteeSemesterFilter(e.target.value)}
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
                  💬 Message Mentees
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
                  {filteredMentees.map((alloc) => (
                    <TableRow key={alloc._id} hover>
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
                  ))}
                  {filteredMentees.length === 0 && (
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
