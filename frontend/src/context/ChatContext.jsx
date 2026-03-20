import { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import axios from 'axios';

const ChatContext = createContext();

export const useChat = () => useContext(ChatContext);

export const ChatProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    const [onlineUsers, setOnlineUsers] = useState([]);
    const [totalUnreadCount, setTotalUnreadCount] = useState(0);
    const [typingStatus, setTypingStatus] = useState({});
    const socketRef = useRef();

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) return;

        // Fetch initial global unread count
        const fetchUnreadCount = async () => {
            try {
                const res = await axios.get('http://localhost:5000/api/chat/unread-count', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setTotalUnreadCount(res.data.unreadCount || 0);
            } catch (err) {
                console.error("Error fetching unread count:", err);
            }
        };
        fetchUnreadCount();

        // Initialize Socket
        socketRef.current = io('http://localhost:5000', {
            auth: { token }
        });

        socketRef.current.on('connect', () => {
            console.log('Connected to socket server');
            setIsConnected(true);
        });

        socketRef.current.on('disconnect', () => {
            console.log('Disconnected from socket server');
            setIsConnected(false);
        });

        socketRef.current.on('connect_error', (err) => {
            console.error('Socket connection error:', err);
        });

        // Global message listener for unread count
        const handleGlobalMessage = (message) => {
            setTotalUnreadCount(prev => prev + 1);
        };

        socketRef.current.on('receive_message', handleGlobalMessage);

        // Typing Listeners
        socketRef.current.on('user_typing', ({ roomId }) => {
            setTypingStatus(prev => ({ ...prev, [roomId]: true }));
        });

        socketRef.current.on('user_stopped_typing', ({ roomId }) => {
            setTypingStatus(prev => ({ ...prev, [roomId]: false }));
        });

        setSocket(socketRef.current);

        return () => {
            if (socketRef.current) {
                socketRef.current.off('receive_message', handleGlobalMessage);
                socketRef.current.off('user_typing');
                socketRef.current.off('user_stopped_typing');
                socketRef.current.disconnect();
            }
        };
    }, []);

    const decrementUnreadCount = (amount = 1) => {
        setTotalUnreadCount(prev => Math.max(0, prev - amount));
    };

    const value = {
        socket,
        isConnected,
        totalUnreadCount,
        setTotalUnreadCount,
        decrementUnreadCount,
        typingStatus
    };

    return (
        <ChatContext.Provider value={value}>
            {children}
        </ChatContext.Provider>
    );
};
