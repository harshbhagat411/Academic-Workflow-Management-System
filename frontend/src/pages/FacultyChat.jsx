import React, { useState, useEffect, useRef } from 'react';
import { useChat } from '../context/ChatContext';
import axios from 'axios';
import { 
    Box, Typography, Paper, List, ListItemButton, ListItemAvatar, 
    Avatar, ListItemText, TextField, IconButton, Divider, AppBar, Toolbar, Badge
} from '@mui/material';
import { Send, MessageSquare } from 'lucide-react';
import Layout from '../components/Layout';

const FacultyChat = () => {
    const { socket, decrementUnreadCount, totalUnreadCount } = useChat();
    const [activeStudent, setActiveStudent] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [students, setStudents] = useState([]);
    const [room, setRoom] = useState(null);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    // Fetch list of assigned students and merge with chat room data
    useEffect(() => {
        const fetchStudentsAndRooms = async () => {
            try {
                const token = localStorage.getItem('token');
                
                // Fetch both mentees and active chat rooms
                const [mentorsRes, roomsRes] = await Promise.all([
                    axios.get('http://localhost:5000/api/mentors/faculty', { headers: { Authorization: `Bearer ${token}` } }),
                    axios.get('http://localhost:5000/api/chat/rooms', { headers: { Authorization: `Bearer ${token}` } })
                ]);

                // Create a map of rooms by student ID
                const roomsMap = {};
                roomsRes.data.forEach(room => {
                    roomsMap[room.studentId._id] = room;
                });

                // Map guide allocation to student format and merge room data
                const mergedStudents = mentorsRes.data.map(alloc => {
                    const studentId = alloc.studentId._id;
                    const roomData = roomsMap[studentId];
                    return {
                        id: studentId,
                        name: alloc.studentId.name,
                        loginId: alloc.studentId.loginId,
                        roomId: roomData?._id || null,
                        unreadCount: roomData?.unreadCount || 0,
                        lastMessage: roomData?.lastMessage || null,
                        updatedAt: roomData?.updatedAt || null
                    };
                });

                // Sort students: those with messages first (most recent), then others
                mergedStudents.sort((a, b) => {
                    if (a.updatedAt && b.updatedAt) return new Date(b.updatedAt) - new Date(a.updatedAt);
                    if (a.updatedAt) return -1;
                    if (b.updatedAt) return 1;
                    return a.name.localeCompare(b.name);
                });

                setStudents(mergedStudents);
            } catch (err) {
                console.error("Error fetching students and rooms:", err);
            }
        };
        fetchStudentsAndRooms();
    }, []); // Only on mount. Updates handled by socket.

    // Fetch Room when student selected
    useEffect(() => {
        if (!activeStudent || !socket) return;

        const fetchRoom = async () => {
            try {
                const token = localStorage.getItem('token');
                // Use query param for studentId as per controller
                const res = await axios.get(`http://localhost:5000/api/chat/room?studentId=${activeStudent.id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                setRoom(res.data);

                // Join new room
                socket.emit('join_room', res.data._id);

                // Fetch messages
                const msgRes = await axios.get(`http://localhost:5000/api/chat/messages/${res.data._id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setMessages(msgRes.data);
                scrollToBottom();

                // Clear unread counts for this room
                const roomIndex = students.findIndex(s => s.id === activeStudent.id);
                if (roomIndex !== -1 && students[roomIndex].unreadCount > 0) {
                    const countToClear = students[roomIndex].unreadCount;
                    
                    // Update backend
                    await axios.post('http://localhost:5000/api/chat/mark-read', { roomId: res.data._id }, {
                        headers: { Authorization: `Bearer ${token}` }
                    });

                    // Update frontend specific student list
                    setStudents(prev => {
                        const newStudents = [...prev];
                        newStudents[roomIndex].unreadCount = 0;
                        return newStudents;
                    });

                    // Update global UI count
                    decrementUnreadCount(countToClear);
                }

            } catch (err) {
                console.error(err);
            }
        };
        fetchRoom();
    }, [activeStudent, socket]);

    // Listen for messages
    useEffect(() => {
        if (!socket) return;
        const handleReceiveMessage = (message) => {
            // If the message belongs to the currently active room, add to chat and clear its unread status immediately
            if (room && message.chatRoomId === room._id) {
                setMessages((prev) => [...prev, message]);
                scrollToBottom();
                
                // If it's a message received from the student (not from us), mark it read essentially
                if (message.senderRole === 'Student') {
                    const token = localStorage.getItem('token');
                    axios.post('http://localhost:5000/api/chat/mark-read', { roomId: room._id }, {
                        headers: { Authorization: `Bearer ${token}` }
                    }).catch(err => console.error("Error implicitly marking msg read:", err));
                    
                    // Decrement the global count that ChatContext just incremented by 1
                    decrementUnreadCount(1);
                }
            }

            // Always update the sidebar list sorting and previews
            setStudents(prev => {
                const newStudents = [...prev];
                const studentIndex = newStudents.findIndex(s => 
                    s.roomId === message.chatRoomId || 
                    (s.id === message.senderId && message.senderRole === 'Student') ||
                    (room && s.id === activeStudent?.id && message.chatRoomId === room._id) // Catch all if new room
                );

                if (studentIndex !== -1) {
                    const student = { ...newStudents[studentIndex] };
                    student.lastMessage = message;
                    student.updatedAt = message.createdAt || new Date().toISOString();
                    student.roomId = message.chatRoomId; // In case it wasn't set

                    // If not the active room AND it's a student's message, increment unread for sidebar badge
                    if ((!room || message.chatRoomId !== room._id) && message.senderRole === 'Student') {
                        student.unreadCount = (student.unreadCount || 0) + 1;
                    }

                    // Remove from old pos and unshift to top
                    newStudents.splice(studentIndex, 1);
                    newStudents.unshift(student);
                }
                return newStudents;
            });
        };
        socket.on('receive_message', handleReceiveMessage);
        return () => {
            socket.off('receive_message', handleReceiveMessage);
        };
    }, [socket, room, activeStudent, decrementUnreadCount]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !room) return;

        const messageData = {
            roomId: room._id,
            message: newMessage
        };

        await socket.emit('send_message', messageData);
        setNewMessage('');
    };

    return (
        <Layout role="Faculty" activeTab="chat">
            <Box sx={{ maxWidth: 1400, mx: 'auto', p: { xs: 2, md: 3 }, height: 'calc(100vh - 64px)' }}>
                <Paper 
                    elevation={3} 
                    sx={{ 
                        display: 'flex', 
                        height: '100%', 
                        overflow: 'hidden', 
                        borderRadius: 3,
                        bgcolor: 'background.paper',
                        animation: 'fadeInUp 0.5s ease-out'
                    }}
                >
                    {/* Sidebar List */}
                    <Box sx={{ width: { xs: 80, sm: 300 }, borderRight: 1, borderColor: 'divider', display: 'flex', flexDirection: 'column' }}>
                        <AppBar position="static" color="primary" elevation={0} sx={{ py: 1.5, px: 2, borderTopLeftRadius: 12 }}>
                            <Typography variant="h6" fontWeight="bold" display="flex" alignItems="center" gap={1}>
                                <MessageSquare size={20} /> <Box component="span" sx={{ display: { xs: 'none', sm: 'block' } }}>My Mentees</Box>
                            </Typography>
                        </AppBar>

                        <List sx={{ flex: 1, overflowY: 'auto', p: 0 }}>
                            {students.map(student => (
                                <React.Fragment key={student.id}>
                                    <ListItemButton
                                        selected={activeStudent?.id === student.id}
                                        onClick={() => setActiveStudent(student)}
                                        sx={{ 
                                            py: 2, 
                                            px: { xs: 1, sm: 2 }, 
                                            justifyContent: { xs: 'center', sm: 'flex-start' },
                                            '&.Mui-selected': {
                                                bgcolor: 'action.selected',
                                                borderLeft: 4,
                                                borderColor: 'primary.main',
                                            }
                                        }}
                                    >
                                        <ListItemAvatar sx={{ minWidth: { xs: 0, sm: 56 } }}>
                                            <Badge badgeContent={student.unreadCount} color="error" invisible={student.unreadCount === 0}>
                                                <Avatar sx={{ 
                                                    bgcolor: activeStudent?.id === student.id ? 'primary.main' : 'auto',
                                                    color: activeStudent?.id === student.id ? 'primary.contrastText' : 'auto',
                                                    fontWeight: 'bold'
                                                }}>
                                                    {student.name.charAt(0)}
                                                </Avatar>
                                            </Badge>
                                        </ListItemAvatar>
                                        <ListItemText 
                                            primary={
                                                <Typography component="div" variant="body2" sx={{ fontWeight: activeStudent?.id === student.id || student.unreadCount > 0 ? 'bold' : 'medium' }}>
                                                    {student.name}
                                                </Typography>
                                            } 
                                            secondary={
                                                <Typography component="div" variant="caption" sx={{ color: student.unreadCount > 0 ? 'text.primary' : 'text.secondary', fontWeight: student.unreadCount > 0 ? 'bold' : 'normal', display: 'flex', flexDirection: 'column' }}>
                                                    <span style={{ fontFamily: 'monospace', fontSize: '0.70rem' }}>{student.loginId}</span>
                                                    {student.lastMessage && (
                                                        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '170px', display: 'inline-block' }}>
                                                            {student.lastMessage.senderRole === 'Faculty' ? 'You: ' : ''}{student.lastMessage.message}
                                                        </span>
                                                    )}
                                                </Typography>
                                            } 
                                            sx={{ display: { xs: 'none', sm: 'block' } }}
                                        />
                                    </ListItemButton>
                                    <Divider />
                                </React.Fragment>
                            ))}
                            {students.length === 0 && (
                                <Box sx={{ p: 4, textAlign: 'center' }}>
                                    <Typography color="text.secondary" fontStyle="italic" variant="body2">No mentees assigned yet.</Typography>
                                </Box>
                            )}
                        </List>
                    </Box>

                    {/* Chat Area */}
                    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', bgcolor: 'background.default' }}>
                        {activeStudent ? (
                            <>
                                {/* Chat Header */}
                                <Toolbar sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: 'background.paper', display: 'flex', justifyContent: 'space-between', px: 3, minHeight: '72px !important' }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                        <Avatar sx={{ bgcolor: 'secondary.main', fontWeight: 'bold' }}>
                                            {activeStudent.name.charAt(0)}
                                        </Avatar>
                                        <Box>
                                            <Typography variant="subtitle1" fontWeight="bold">
                                                {activeStudent.name}
                                            </Typography>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <Box sx={{ width: 8, height: 8, bgcolor: 'success.main', borderRadius: '50%' }} />
                                                <Typography variant="caption" color="text.secondary">
                                                    {activeStudent.loginId}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    </Box>
                                    <Box sx={{ bgcolor: 'primary.50', color: 'primary.700', px: 2, py: 0.5, borderRadius: 4, border: 1, borderColor: 'primary.100', display: { xs: 'none', sm: 'block' } }}>
                                        <Typography variant="caption" fontWeight="bold">Mentorship Chat</Typography>
                                    </Box>
                                </Toolbar>

                                {/* Messages */}
                                <Box sx={{ flex: 1, overflowY: 'auto', p: 3, display: 'flex', flexDirection: 'column', gap: 2, backgroundImage: 'radial-gradient(rgba(0, 0, 0, 0.05) 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
                                    {messages.map((msg) => {
                                        const isMyMessage = msg.senderRole === 'Faculty';
                                        return (
                                            <Box key={msg._id} sx={{ display: 'flex', justifyContent: isMyMessage ? 'flex-end' : 'flex-start' }}>
                                                <Paper
                                                    elevation={1}
                                                    sx={{
                                                        maxWidth: '70%',
                                                        p: 2,
                                                        borderRadius: 3,
                                                        borderTopRightRadius: isMyMessage ? 4 : 12,
                                                        borderTopLeftRadius: !isMyMessage ? 4 : 12,
                                                        bgcolor: isMyMessage ? 'primary.main' : 'background.paper',
                                                        color: isMyMessage ? 'primary.contrastText' : 'text.primary',
                                                        transition: 'transform 0.2s',
                                                        '&:hover': { transform: 'scale(1.01)' }
                                                    }}
                                                >
                                                    <Typography variant="body2" sx={{ wordBreak: 'break-word', lineHeight: 1.5 }}>
                                                        {msg.message}
                                                    </Typography>
                                                    <Typography 
                                                        variant="caption" 
                                                        sx={{ 
                                                            display: 'block', 
                                                            textAlign: 'right', 
                                                            mt: 1, 
                                                            color: isMyMessage ? 'primary.200' : 'text.disabled',
                                                            fontSize: '0.65rem'
                                                        }}
                                                    >
                                                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </Typography>
                                                </Paper>
                                            </Box>
                                        );
                                    })}
                                    <div ref={messagesEndRef} />
                                </Box>

                                {/* Message Input */}
                                <Box sx={{ p: 2, bgcolor: 'background.paper', borderTop: 1, borderColor: 'divider' }}>
                                    <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: 12 }}>
                                        <TextField
                                            fullWidth
                                            variant="outlined"
                                            placeholder={`Message ${activeStudent.name}...`}
                                            value={newMessage}
                                            onChange={(e) => setNewMessage(e.target.value)}
                                            size="small"
                                            autoComplete="off"
                                            sx={{ 
                                                '& .MuiOutlinedInput-root': {
                                                    borderRadius: 8,
                                                }
                                            }}
                                        />
                                        <IconButton 
                                            type="submit" 
                                            color="primary" 
                                            disabled={!newMessage.trim()}
                                            sx={{ 
                                                bgcolor: 'primary.main', 
                                                color: 'white', 
                                                borderRadius: 2,
                                                px: 3,
                                                '&:hover': { bgcolor: 'primary.dark' },
                                                '&.Mui-disabled': { bgcolor: 'action.disabledBackground', color: 'action.disabled' }
                                            }}
                                        >
                                            <Send size={20} />
                                        </IconButton>
                                    </form>
                                </Box>
                            </>
                        ) : (
                            <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'action.hover' }}>
                                <Box sx={{ textAlign: 'center' }}>
                                    <Avatar sx={{ width: 80, height: 80, mx: 'auto', mb: 3, bgcolor: 'background.paper', color: 'text.secondary' }}>
                                        <MessageSquare size={40} />
                                    </Avatar>
                                    <Typography variant="h5" color="text.secondary" fontWeight="bold" mb={1}>
                                        Select a Mentee
                                    </Typography>
                                    <Typography variant="body2" color="text.disabled">
                                        Choose a student from the sidebar to start a conversation.
                                    </Typography>
                                </Box>
                            </Box>
                        )}
                    </Box>
                </Paper>
            </Box>
        </Layout>
    );
};

export default FacultyChat;
