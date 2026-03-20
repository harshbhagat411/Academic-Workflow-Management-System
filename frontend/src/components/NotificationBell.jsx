import React, { useState, useEffect } from 'react';
import { 
    Badge, IconButton, Popover, List, ListItem, ListItemText, 
    Typography, Box, CircularProgress, Divider, ListItemAvatar, Avatar 
} from '@mui/material';
import { Bell, FileText, CheckCircle, Info, MessageSquare } from 'lucide-react';
import axios from 'axios';

const NotificationBell = () => {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [anchorEl, setAnchorEl] = useState(null);
    const [loading, setLoading] = useState(false);

    const API_URL = 'http://localhost:5000/api/notifications';

    const getAuthHeaders = () => {
        const token = localStorage.getItem('token');
        return { headers: { Authorization: `Bearer ${token}` } };
    };

    const fetchNotifications = async () => {
        try {
            setLoading(true);
            const res = await axios.get(API_URL, getAuthHeaders());
            const data = res.data || [];
            setNotifications(data);
            setUnreadCount(data.filter(n => !n.isRead).length);
        } catch (error) {
            console.error('Error fetching notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // Only fetch if token exists
        if (localStorage.getItem('token')) {
            fetchNotifications();
            // Optional polling
            const interval = setInterval(fetchNotifications, 60000);
            return () => clearInterval(interval);
        }
    }, []);

    const handleClickMenu = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleCloseMenu = () => {
        setAnchorEl(null);
    };

    const handleMarkAsRead = async (id, isRead) => {
        if (isRead) return; // already read
        try {
            await axios.patch(`${API_URL}/${id}/read`, {}, getAuthHeaders());
            // optimistic updates
            setNotifications(prev => 
                prev.map(n => n._id === id ? { ...n, isRead: true } : n)
            );
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error('Error marking as read:', error);
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            await axios.patch(`${API_URL}/read-all`, {}, getAuthHeaders());
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            setUnreadCount(0);
        } catch (error) {
            console.error('Error marking all as read:', error);
        }
    };

    const open = Boolean(anchorEl);
    const id = open ? 'notification-popover' : undefined;

    const getIcon = (type) => {
        switch(type) {
            case 'request': return <FileText size={20} color="#1976d2" />;
            case 'assignment': return <CheckCircle size={20} color="#2e7d32" />;
            case 'chat': return <MessageSquare size={20} color="#9c27b0" />;
            default: return <Info size={20} color="#ed6c02" />;
        }
    };

    return (
        <>
            <IconButton color="inherit" onClick={handleClickMenu}>
                <Badge badgeContent={unreadCount} color="error">
                    <Bell />
                </Badge>
            </IconButton>

            <Popover
                id={id}
                open={open}
                anchorEl={anchorEl}
                onClose={handleCloseMenu}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'right',
                }}
                transformOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                }}
                PaperProps={{
                    sx: { width: 360, maxHeight: 480, mt: 1.5 }
                }}
            >
                <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h6" fontWeight="bold">Notifications</Typography>
                    {unreadCount > 0 && (
                        <Typography 
                            variant="body2" 
                            color="primary" 
                            sx={{ cursor: 'pointer', fontWeight: 500 }}
                            onClick={handleMarkAllAsRead}
                        >
                            Mark all as read
                        </Typography>
                    )}
                </Box>
                <Divider />
                
                {loading && notifications.length === 0 ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                        <CircularProgress size={24} />
                    </Box>
                ) : notifications.length === 0 ? (
                    <Box sx={{ p: 4, textAlign: 'center' }}>
                        <Typography variant="body2" color="text.secondary">
                            No notifications yet
                        </Typography>
                    </Box>
                ) : (
                    <List sx={{ p: 0 }}>
                        {notifications.map((notif) => (
                            <ListItem 
                                key={notif._id}
                                sx={{ 
                                    opacity: notif.isRead ? 0.7 : 1,
                                    bgcolor: notif.isRead ? 'transparent' : 'action.hover',
                                    borderLeft: notif.isRead ? 'none' : '4px solid',
                                    borderColor: 'primary.main',
                                    cursor: 'pointer',
                                    '&:hover': { bgcolor: 'action.selected' }
                                }}
                                onClick={() => handleMarkAsRead(notif._id, notif.isRead)}
                            >
                                <ListItemAvatar>
                                    <Avatar sx={{ bgcolor: 'background.paper', border: '1px solid #e0e0e0' }}>
                                        {getIcon(notif.type)}
                                    </Avatar>
                                </ListItemAvatar>
                                <ListItemText 
                                    primary={
                                        <Typography variant="body2" fontWeight={notif.isRead ? 400 : 600}>
                                            {notif.message}
                                        </Typography>
                                    }
                                    secondary={
                                        <Typography variant="caption" color="text.secondary">
                                            {new Date(notif.createdAt).toLocaleString()}
                                        </Typography>
                                    }
                                />
                            </ListItem>
                        ))}
                    </List>
                )}
            </Popover>
        </>
    );
};

export default NotificationBell;
