import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { adminTheme, facultyTheme, studentTheme, defaultTheme } from './theme/roleThemes';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import AdminDashboard from './pages/AdminDashboard';
import CreateUser from './pages/CreateUser';
import BulkUserUpload from './pages/BulkUserUpload';
import ForcePasswordChange from './pages/ForcePasswordChange';
import StudentDashboard from './pages/StudentDashboard';
import AcademicRequests from './pages/AcademicRequests';
import FacultyDashboard from './pages/FacultyDashboard';
import FacultyRequests from './pages/FacultyRequests';
import AdminRequests from './pages/AdminRequests'; 
import AnalyticsReports from './pages/AnalyticsReports';
import RequestAnalytics from './pages/RequestAnalytics';
import AttendanceAnalytics from './pages/AttendanceAnalytics';
import AttendancePattern from './pages/AttendancePattern';
import { ChatProvider } from './context/ChatContext';
import ChatWithMentor from './pages/ChatWithMentor';
import FacultyChat from './pages/FacultyChat';
import FacultyAttendance from './pages/FacultyAttendance';
import StudentAttendance from './pages/StudentAttendance';
import FacultyAssessments from './pages/FacultyAssessments';
import AssessmentMarksEntry from './pages/AssessmentMarksEntry';
import StudentMarks from './pages/StudentMarks';
import StudentTimetable from './pages/StudentTimetable';
import ProtectedRoute from './components/ProtectedRoute';
import PublicRoute from './components/PublicRoute';

function App() {
  return (
    <>
      <ChatProvider>
      <Router>
        <Routes>
          <Route path="/login" element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          } />
          <Route path="/forgot-password" element={
            <PublicRoute>
              <ForgotPassword />
            </PublicRoute>
          } />
          <Route path="/force-password-change" element={
            <PublicRoute>
              <ForcePasswordChange />
            </PublicRoute>
          } />

          {/* Admin Routes */}
          <Route path="/admin/dashboard" element={
            <ProtectedRoute allowedRoles={['Admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          } />
          <Route path="/admin/create-user" element={
            <ProtectedRoute allowedRoles={['Admin']}>
              <CreateUser />
            </ProtectedRoute>
          } />
          <Route path="/admin/bulk-upload" element={
            <ProtectedRoute allowedRoles={['Admin']}>
              <BulkUserUpload />
            </ProtectedRoute>
          } />
          <Route path="/admin/requests" element={
            <ProtectedRoute allowedRoles={['Admin']}>
              <AdminRequests />
            </ProtectedRoute>
          } />
          <Route path="/admin/analytics" element={
            <ProtectedRoute allowedRoles={['Admin']}>
              <AnalyticsReports />
            </ProtectedRoute>
          } />
          <Route path="/admin/analytics/requests" element={
            <ProtectedRoute allowedRoles={['Admin']}>
              <RequestAnalytics />
            </ProtectedRoute>
          } />
          <Route path="/admin/analytics/attendance" element={
            <ProtectedRoute allowedRoles={['Admin']}>
              <AttendanceAnalytics />
            </ProtectedRoute>
          } />
          <Route path="/admin/analytics/pattern" element={
            <ProtectedRoute allowedRoles={['Admin']}>
              <AttendancePattern />
            </ProtectedRoute>
          } />

          {/* Student Routes */}
          <Route path="/student/dashboard" element={
            <ProtectedRoute allowedRoles={['Student']}>
              <StudentDashboard />
            </ProtectedRoute>
          } />
          <Route path="/student/requests" element={
            <ProtectedRoute allowedRoles={['Student']}>
              <AcademicRequests />
            </ProtectedRoute>
          } />
          <Route path="/student/timetable" element={
            <ProtectedRoute allowedRoles={['Student']}>
              <StudentTimetable />
            </ProtectedRoute>
          } />

          {/* Faculty Routes */}
          <Route path="/faculty/dashboard" element={
            <ProtectedRoute allowedRoles={['Faculty']}>
              <FacultyDashboard />
            </ProtectedRoute>
          } />
          <Route path="/faculty/requests" element={
            <ProtectedRoute allowedRoles={['Faculty']}>
              <FacultyRequests />
            </ProtectedRoute>
          } />


          <Route path="/faculty/chat" element={
            <ProtectedRoute allowedRoles={['Faculty']}>
              <FacultyChat />
            </ProtectedRoute>
          } />

          <Route path="/faculty/attendance" element={
            <ProtectedRoute allowedRoles={['Faculty']}>
              <FacultyAttendance />
            </ProtectedRoute>
          } />
          <Route path="/student/attendance" element={
            <ProtectedRoute allowedRoles={['Student']}>
              <StudentAttendance />
            </ProtectedRoute>
          } />
          <Route path="/student/chat" element={
            <ProtectedRoute allowedRoles={['Student']}>
              <ChatWithMentor />
            </ProtectedRoute>
          } />
          <Route path="/student/marks" element={
            <ProtectedRoute allowedRoles={['Student']}>
              <StudentMarks />
            </ProtectedRoute>
          } />

          {/* Assessment Routes */}
          <Route path="/faculty/assessments" element={
            <ProtectedRoute allowedRoles={['Faculty']}>
              <FacultyAssessments />
            </ProtectedRoute>
          } />
          <Route path="/faculty/assessments/:id" element={
            <ProtectedRoute allowedRoles={['Faculty']}>
              <AssessmentMarksEntry />
            </ProtectedRoute>
          } />

          <Route path="/" element={<Navigate to="/login" />} />
        </Routes>
      </Router>
    </ChatProvider>
    </>
  );
}

export default App;
