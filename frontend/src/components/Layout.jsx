import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    Box, Drawer, AppBar, Toolbar, List, Typography, Divider,
    IconButton, ListItem, ListItemButton, ListItemIcon, ListItemText,
    useMediaQuery, useTheme, Badge
} from '@mui/material';
import {
    Menu as MenuIcon, LayoutDashboard, Users, FileText, Upload,
    LogOut, BookOpen, Clock, Layers, MessageCircle, ClipboardCheck, FileSpreadsheet, User, BarChart3, Settings
} from 'lucide-react';

const drawerWidth = 260;

import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';
import NotificationBell from './NotificationBell';

const Layout = ({ role, activeTab, setActiveTab, children }) => {
    const { logout } = useAuth();
    const { totalUnreadCount } = useChat(); // Import global unread count
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const [mobileOpen, setMobileOpen] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    const handleDrawerToggle = () => setMobileOpen(!mobileOpen);

    const handleLogout = () => {
        logout();
    };

    const getNavItems = () => {
        if (role === 'Admin') {
            return [
                { id: 'overview', label: 'Dashboard', icon: <LayoutDashboard size={20} />, tabMode: true, path: '/admin/dashboard' },
                { id: 'staff', label: 'Staff', icon: <Users size={20} />, tabMode: true, path: '/admin/dashboard' },
                { id: 'students', label: 'Students', icon: <Users size={20} />, tabMode: true, path: '/admin/dashboard' },
                { id: 'mentors', label: 'Mentors', icon: <Users size={20} />, tabMode: true, path: '/admin/dashboard' },
                { id: 'subjects', label: 'Subjects', icon: <BookOpen size={20} />, tabMode: true, path: '/admin/dashboard' },
                { id: 'timetable', label: 'Timetable', icon: <Clock size={20} />, tabMode: true, path: '/admin/dashboard' },
                { id: 'sections', label: 'Sections', icon: <Layers size={20} />, tabMode: true, path: '/admin/dashboard' },
                { id: 'requests', label: 'Requests', icon: <FileText size={20} />, tabMode: false, path: '/admin/requests' },
                { id: 'analytics', label: 'Analytics Reports', icon: <BarChart3 size={20} />, tabMode: false, path: '/admin/analytics' },
                { id: 'create-user', label: 'Create User', icon: <User size={20} />, tabMode: false, path: '/admin/create-user' },
                { id: 'bulk-upload', label: 'Bulk Upload', icon: <Upload size={20} />, tabMode: false, path: '/admin/bulk-upload' },
                { id: 'settings', label: 'Settings', icon: <Settings size={20} />, tabMode: false, path: '/settings' },
            ];
        } else if (role === 'Faculty') {
            return [
                { id: 'overview', label: 'Dashboard', icon: <LayoutDashboard size={20} />, tabMode: true, path: '/faculty/dashboard' },
                { id: 'students', label: 'All Students', icon: <Users size={20} />, tabMode: true, path: '/faculty/dashboard' },
                { id: 'mentored', label: 'My Mentees', icon: <Users size={20} />, tabMode: true, path: '/faculty/dashboard' },
                { id: 'attendance', label: 'Attendance', icon: <ClipboardCheck size={20} />, tabMode: false, path: '/faculty/attendance' },
                { id: 'assessments', label: 'Assessments', icon: <FileSpreadsheet size={20} />, tabMode: false, path: '/faculty/assessments' },
                { id: 'requests', label: 'Academic Requests', icon: <FileText size={20} />, tabMode: false, path: '/faculty/requests' },
                { id: 'chat', label: 'Messages', icon: <MessageCircle size={20} />, tabMode: false, path: '/faculty/chat' },
                { id: 'profile', label: 'Profile', icon: <User size={20} />, tabMode: true, path: '/faculty/dashboard' },
                { id: 'settings', label: 'Settings', icon: <Settings size={20} />, tabMode: false, path: '/settings' },
            ];
        } else if (role === 'Student') {
            return [
                { id: 'overview', label: 'Dashboard', icon: <LayoutDashboard size={20} />, tabMode: true, path: '/student/dashboard' },
                { id: 'attendance', label: 'Attendance', icon: <ClipboardCheck size={20} />, tabMode: false, path: '/student/attendance' },
                { id: 'timetable', label: 'Timetable', icon: <Clock size={20} />, tabMode: false, path: '/student/timetable' },
                { id: 'marks', label: 'Marks', icon: <FileSpreadsheet size={20} />, tabMode: false, path: '/student/marks' },
                { id: 'requests', label: 'Academic Requests', icon: <FileText size={20} />, tabMode: false, path: '/student/requests' },
                { id: 'chat', label: 'Mentor Chat', icon: <MessageCircle size={20} />, tabMode: false, path: '/student/chat' },
                { id: 'profile', label: 'Profile', icon: <User size={20} />, tabMode: true, path: '/student/dashboard' },
                { id: 'settings', label: 'Settings', icon: <Settings size={20} />, tabMode: false, path: '/settings' },
            ];
        }
        return [];
    };

    const navItems = getNavItems();

    const handleNavClick = (item) => {
        if (item.tabMode && location.pathname === item.path) {
            if (setActiveTab) setActiveTab(item.id);
        } else {
            navigate(item.path);
            if (item.tabMode && setActiveTab) setActiveTab(item.id);
        }
        if (isMobile) setMobileOpen(false);
    };

    const drawer = (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <Toolbar sx={{ justifyContent: 'center' }}>
                <Typography variant="h6" color="primary" sx={{ fontWeight: 'bold' }}>
                    AWMS
                </Typography>
            </Toolbar>

            <Divider />

            <List sx={{ flexGrow: 1, px: 2, py: 1 }}>
                {navItems.map((item) => {
                    const isSelected =
                        item.tabMode && location.pathname === item.path
                            ? activeTab === item.id
                            : location.pathname === item.path;

                    return (
                        <ListItem key={item.id} disablePadding sx={{ mb: 0.5 }}>
                            <ListItemButton
                                selected={isSelected}
                                onClick={() => handleNavClick(item)}
                                sx={{
                                    borderRadius: 1.5,
                                    '&.Mui-selected': {
                                        backgroundColor: 'primary.main',
                                        color: 'primary.contrastText',
                                        '& .MuiListItemIcon-root': { color: 'inherit' }
                                    }
                                }}
                            >
                                <ListItemIcon sx={{ minWidth: 40 }}>
                                    {item.id === 'chat' && totalUnreadCount > 0 ? (
                                        <Badge badgeContent={totalUnreadCount} color="error" sx={{ '& .MuiBadge-badge': { right: -3, top: 3 } }}>
                                            {item.icon}
                                        </Badge>
                                    ) : (
                                        item.icon
                                    )}
                                </ListItemIcon>

                                <ListItemText
                                    primary={item.label}
                                    primaryTypographyProps={{
                                        fontSize: 14,
                                        fontWeight: isSelected ? 600 : 500
                                    }}
                                />
                            </ListItemButton>
                        </ListItem>
                    );
                })}
            </List>

            <Divider />

            <Box sx={{ p: 2 }}>
                <ListItem disablePadding>
                    <ListItemButton onClick={handleLogout} sx={{ color: 'error.main', '&:hover': { bgcolor: 'error.main', color: 'error.contrastText', '& .MuiListItemIcon-root': { color: 'inherit' } }, borderRadius: 1.5 }}>
                        <ListItemIcon sx={{ minWidth: 40, color: 'inherit' }}>
                            <LogOut size={20} />
                        </ListItemIcon>
                        <ListItemText primary="Logout" primaryTypographyProps={{ fontWeight: 500 }} />
                    </ListItemButton>
                </ListItem>
            </Box>
        </Box>
    );

    const getSidebarGradient = (userRole) => {
        const isLight = theme.palette.mode === 'light';
        const bottomColor = isLight ? 'rgba(255, 255, 255, 1)' : 'rgba(18, 18, 18, 1)';
        
        switch(userRole) {
            case 'Admin': return `linear-gradient(180deg, ${isLight ? 'rgba(99, 102, 241, 0.15)' : 'rgba(49, 46, 129, 0.6)'} 0%, ${bottomColor} 100%)`;
            case 'Faculty': return `linear-gradient(180deg, ${isLight ? 'rgba(59, 130, 246, 0.15)' : 'rgba(30, 58, 138, 0.6)'} 0%, ${bottomColor} 100%)`;
            case 'Student': return `linear-gradient(180deg, ${isLight ? 'rgba(20, 184, 166, 0.15)' : 'rgba(19, 78, 74, 0.6)'} 0%, ${bottomColor} 100%)`;
            default: return 'none';
        }
    };

    return (
        <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>

            <AppBar
                position="fixed"
                sx={{
                    ml: { md: `${drawerWidth}px` },
                    width: { md: `calc(100% - ${drawerWidth}px)` }
                }}
            >
                <Toolbar>
                    <IconButton
                        onClick={handleDrawerToggle}
                        sx={{ display: { md: 'none' }, mr: 2 }}
                    >
                        <MenuIcon />
                    </IconButton>

                    <Typography variant="h6" sx={{ flexGrow: 1 }}>
                        {role} Portal
                    </Typography>
                    <NotificationBell />
                </Toolbar>
            </AppBar>

            <Drawer
                variant="permanent"
                sx={{
                    width: drawerWidth,
                    flexShrink: 0,
                    '& .MuiDrawer-paper': {
                        width: drawerWidth,
                        boxSizing: 'border-box',
                        background: getSidebarGradient(role)
                    }
                }}
                open
            >
                {drawer}
            </Drawer>

            <Box
                component="main"
                sx={{
                    flexGrow: 1,
                    p: 3,
                    mt: 8
                }}
            >
                {children}
            </Box>

        </Box>
    );
};

export default Layout;