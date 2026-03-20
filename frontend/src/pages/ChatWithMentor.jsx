import React, { useState, useEffect, useRef } from 'react';
import { useChat } from '../context/ChatContext';
import axios from 'axios';
import { 
    Box, Typography, TextField, IconButton, Avatar, 
    Paper, CircularProgress, Alert
} from '@mui/material';
import { Send, User } from 'lucide-react';
import Layout from '../components/Layout';

const ChatWithMentor = () => {
    const { socket, decrementUnreadCount, totalUnreadCount, typingStatus } = useChat();
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [room, setRoom] = useState(null);
    const [error, setError] = useState('');
    const messagesEndRef = useRef(null);
    const typingTimeout = useRef(null);
    const [mentor, setMentor] = useState(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        const fetchRoom = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await axios.get('http://localhost:5000/api/chat/room', {
                    headers: { Authorization: `Bearer ${token}` }
                });

                setRoom(res.data);
                setMentor(res.data.guideId);

                // Join room
                if (socket) {
                    socket.emit('join_room', res.data._id);
                    // Fetch messages
                    const msgRes = await axios.get(`http://localhost:5000/api/chat/messages/${res.data._id}`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    setMessages(msgRes.data);
                    scrollToBottom();

                    // If student has global unread messages, clear them physically and visually
                    if (totalUnreadCount > 0) {
                        socket.emit('markAsSeen', { roomId: res.data._id });
                        decrementUnreadCount(totalUnreadCount);
                    }
                }

            } catch (err) {
                console.error(err);
                if (err.response?.status === 404) {
                    setError('You do not have a mentor assigned yet.');
                } else {
                    setError('Failed to load chat.');
                }
            }
        };

        if (socket) fetchRoom();
    }, [socket]);

    useEffect(() => {
        if (!socket) return;

        const handleReceiveMessage = (message) => {
            setMessages((prev) => [...prev, message]);
            scrollToBottom();
            
            // If message is from mentor, we are currently viewing it, so mark it seen
            if (message.senderRole === 'Faculty') {
                socket.emit('markAsSeen', { roomId: room._id });
                
                // Keep the global UI badge at 0 since context hook just incremented it
                decrementUnreadCount(1);
            }
        };

        const handleMessagesSeen = ({ roomId }) => {
            if (room && room._id === roomId) {
                setMessages(prev => prev.map(msg => 
                    (msg.senderRole === 'Student' && !msg.isSeen) ? { ...msg, isSeen: true } : msg
                ));
            }
        };

        socket.on('receive_message', handleReceiveMessage);
        socket.on('messagesSeen', handleMessagesSeen);

        return () => {
            socket.off('receive_message', handleReceiveMessage);
            socket.off('messagesSeen', handleMessagesSeen);
        };
    }, [socket, room]);

    const handleMessageChange = (e) => {
        setNewMessage(e.target.value);
        if (!room || !socket) return;

        socket.emit('typing', { roomId: room._id });

        if (typingTimeout.current) clearTimeout(typingTimeout.current);
        typingTimeout.current = setTimeout(() => {
            socket.emit('stopTyping', { roomId: room._id });
        }, 1500);
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !room) return;

        const messageData = {
            roomId: room._id,
            message: newMessage
        };

        await socket.emit('send_message', messageData);
        setNewMessage('');
        
        if (typingTimeout.current) clearTimeout(typingTimeout.current);
        socket.emit('stopTyping', { roomId: room._id });
    };

    if (error) {
        return (
            <Layout role="Student" activeTab="chat">
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '70vh' }}>
                    <Alert severity="warning" variant="filled" sx={{ borderRadius: 3, px: 4, py: 2 }}>
                        <Typography variant="h6" fontWeight="bold">Not Available</Typography>
                        {error}
                    </Alert>
                </Box>
            </Layout>
        );
    }

    if (!room) {
        return (
            <Layout role="Student" activeTab="chat">
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '70vh' }}>
                    <CircularProgress />
                </Box>
            </Layout>
        );
    }

    return (
        <Layout role="Student" activeTab="chat">
            <Box sx={{ maxWidth: 1000, mx: 'auto', height: 'calc(100vh - 140px)', animation: 'fadeInUp 0.5s ease-out' }}>
                <Paper sx={{ display: 'flex', flexDirection: 'column', height: '100%', borderRadius: 3, overflow: 'hidden', boxShadow: 3 }}>
                    {/* Header */}
                    <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 2, bgcolor: 'background.paper', zIndex: 10 }}>
                        <Avatar sx={{ bgcolor: 'primary.main', fontWeight: 'bold', width: 48, height: 48 }}>
                            {mentor?.name?.charAt(0) || 'M'}
                        </Avatar>
                        <Box>
                            <Typography variant="h6" fontWeight="bold">{mentor?.name || 'Mentor'}</Typography>
                            <Typography variant="caption" sx={{ bgcolor: 'primary.50', color: 'primary.main', px: 1, py: 0.5, borderRadius: 1, fontWeight: 'bold' }}>
                                Faculty Mentor
                            </Typography>
                        </Box>
                    </Box>

                    {/* Messages Area */}
                    <Box sx={{ flex: 1, overflowY: 'auto', p: 3, bgcolor: 'primary.50', display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {messages.map((msg) => {
                            const isMyMessage = msg.senderRole === 'Student';
                            return (
                                <Box key={msg._id} sx={{ display: 'flex', justifyContent: isMyMessage ? 'flex-end' : 'flex-start' }}>
                                    <Paper sx={{ 
                                        p: 2, 
                                        maxWidth: '75%', 
                                        bgcolor: isMyMessage ? 'primary.main' : 'background.paper',
                                        color: isMyMessage ? 'primary.contrastText' : 'text.primary',
                                        borderRadius: 3,
                                        borderTopRightRadius: isMyMessage ? 0 : 3,
                                        borderTopLeftRadius: !isMyMessage ? 0 : 3,
                                        boxShadow: 1
                                    }}>
                                        <Typography variant="body1" sx={{ wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>
                                            {msg.message}
                                        </Typography>
                                        <Typography variant="caption" sx={{ display: 'block', textAlign: 'right', mt: 1, color: isMyMessage ? 'primary.100' : 'text.disabled', fontSize: '0.65rem' }}>
                                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            {isMyMessage && (
                                                <span style={{ marginLeft: 4, letterSpacing: '-2px', fontSize: '11px', fontWeight: 'bold' }}>
                                                    {msg.isSeen ? '✓✓' : (msg.isDelivered ? '✓' : '  ')}
                                                </span>
                                            )}
                                        </Typography>
                                    </Paper>
                                </Box>
                            );
                        })}
                        {room && typingStatus[room._id] && (
                            <Box sx={{ display: 'flex', justifyContent: 'flex-start', mb: 1 }}>
                                <Paper elevation={0} sx={{ p: 1, borderRadius: 3, bgcolor: 'transparent' }}>
                                    <Typography variant="caption" sx={{ fontStyle: 'italic', color: 'text.secondary' }}>
                                        {mentor?.name || 'Mentor'} is typing...
                                    </Typography>
                                </Paper>
                            </Box>
                        )}
                        <div ref={messagesEndRef} />
                    </Box>

                    {/* Input Area */}
                    <Box component="form" onSubmit={handleSendMessage} sx={{ p: 2, bgcolor: 'background.paper', borderTop: 1, borderColor: 'divider', display: 'flex', gap: 2 }}>
                        <TextField
                            fullWidth
                            variant="outlined"
                            placeholder="Type your message..."
                            value={newMessage}
                            onChange={handleMessageChange}
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3, bgcolor: 'action.hover' } }}
                        />
                        <IconButton 
                            type="submit" 
                            disabled={!newMessage.trim()}
                            sx={{ 
                                bgcolor: 'primary.main', 
                                color: 'white', 
                                '&:hover': { bgcolor: 'primary.dark' },
                                '&.Mui-disabled': { bgcolor: 'action.disabledBackground', color: 'action.disabled' },
                                borderRadius: 3,
                                px: 3
                            }}
                        >
                            <Send size={20} />
                        </IconButton>
                    </Box>
                </Paper>
            </Box>
        </Layout>
    );
};

export default ChatWithMentor;
