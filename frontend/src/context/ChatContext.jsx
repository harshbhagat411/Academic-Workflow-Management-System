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
            // Assume if we receive a message globally, we check if it's from someone else
            // The active chat window will handle decrementing if it's open
            const userId = localStorage.getItem('userId'); // Assuming we can decode or just rely on senderRole logic in component
            // We just increment globally here, and let the active room specific component 
            // reset it or subtract it if the room is currently open.
            setTotalUnreadCount(prev => prev + 1);
        };

        socketRef.current.on('receive_message', handleGlobalMessage);

        setSocket(socketRef.current);

        return () => {
            if (socketRef.current) {
                socketRef.current.off('receive_message', handleGlobalMessage);
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
        decrementUnreadCount
    };

    return (
        <ChatContext.Provider value={value}>
            {children}
        </ChatContext.Provider>
    );
};
