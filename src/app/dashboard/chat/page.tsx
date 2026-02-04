'use client';

import { useState, useEffect, useRef } from 'react';
import api from '@/lib/api';
import { chatApi } from '@/lib/api';

type Contact = {
    id: string;
    name: string;
    avatar?: string;
    role: string;
    lastMessage?: string;
    lastMessageTime?: string;
    unreadCount?: number;
};

type Message = {
    id: string;
    senderId: string;
    content: string;
    timestamp: string;
    isMe: boolean;  // This is helpful but senderId comparison is safer
    createdAt?: string; // Fallback for timestamp
};

export default function ChatPage() {
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loadingContacts, setLoadingContacts] = useState(true);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [userRole, setUserRole] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Get my ID
    const getMyId = () => {
        if (typeof window !== 'undefined') {
            const userStr = localStorage.getItem('user');
            if (userStr) {
                try {
                    const user = JSON.parse(userStr);
                    return user.id;
                } catch (e) { return 'current_user_id'; }
            }
        }
        return 'current_user_id';
    };
    const MY_ID = getMyId();

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const r = localStorage.getItem('role');
            setUserRole(r || '');
        }
        fetchContacts();
    }, []);

    // Polling Logic
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (selectedContact && selectedContact.id !== 'broadcast') {
            // Initial fetch
            fetchMessages(selectedContact.id, true);

            // Poll every 3 seconds
            interval = setInterval(() => {
                fetchMessages(selectedContact.id, false);
            }, 3000);
        } else if (selectedContact?.id === 'broadcast') {
            setMessages([]);
        }

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [selectedContact]);

    // Auto-scroll on new messages
    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const fetchContacts = async () => {
        try {
            const res = await chatApi.fetchContacts();
            setContacts(res.data);
            setLoadingContacts(false);
        } catch (error) {
            console.error("Error fetching contacts", error);
            setLoadingContacts(false);
        }
    };

    // silent=true for background polling
    const fetchMessages = async (contactId: string, showLoading = false) => {
        if (showLoading) setLoadingMessages(true);
        try {
            const res = await api.get(`/chat/conversation/${contactId}`);
            setMessages(res.data);
        } catch (error) {
            console.error("Error fetching messages", error);
        } finally {
            if (showLoading) setLoadingMessages(false);
        }
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !selectedContact) return;

        const tempId = Date.now().toString();
        const messageToSend = {
            id: tempId,
            senderId: MY_ID,
            content: newMessage,
            timestamp: new Date().toISOString(),
            isMe: true
        };

        // Optimistic update
        setMessages(prev => [...prev, messageToSend]);
        const msgToSend = newMessage;
        setNewMessage('');

        try {
            await api.post('/chat/send', {
                receiverId: selectedContact.id,
                content: msgToSend
            });
        } catch (error) {
            console.error("Failed to send message", error);
        }
    };

    // Grouping Logic
    const groupedContacts: Record<string, Contact[]> = {};
    contacts.forEach(c => {
        const role = c.role || 'OTHERS';
        if (!groupedContacts[role]) groupedContacts[role] = [];
        groupedContacts[role].push(c);
    });

    const isAdmin = userRole === 'ADMIN';

    return (
        <div className="flex h-[calc(100vh-64px)] md:h-[calc(100vh-2rem)] overflow-hidden bg-white md:rounded-xl md:shadow-sm md:border md:border-gray-200">
            {/* List View */}
            <div className={`flex-col h-full bg-white border-r border-gray-200 ${selectedContact ? 'hidden md:flex' : 'flex'} w-full md:w-1/3`}>
                <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                    <h1 className="text-xl font-bold text-gray-800">Messages</h1>
                    {isAdmin && (
                        <button
                            onClick={() => setSelectedContact({ id: 'broadcast', name: 'Broadcast to All', role: 'SYSTEM' })}
                            className="text-xs bg-purple-600 text-white px-2 py-1 rounded hover:bg-purple-700"
                        >
                            📢 Broadcast
                        </button>
                    )}
                </div>
                <div className="overflow-y-auto flex-1">
                    {loadingContacts ? (
                        <div className="p-4 text-center text-gray-500">Loading contacts...</div>
                    ) : contacts.length === 0 ? (
                        <div className="p-4 text-center text-gray-400">No contacts found</div>
                    ) : (
                        Object.entries(groupedContacts).map(([role, list]) => (
                            <div key={role}>
                                <div className="px-4 py-2 bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider sticky top-0">
                                    {role}s
                                </div>
                                {list.map(contact => (
                                    <div
                                        key={contact.id}
                                        onClick={() => setSelectedContact(contact)}
                                        className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-purple-50 transition-colors flex items-center space-x-3 
                                        ${selectedContact?.id === contact.id ? 'bg-purple-50' : ''}`}
                                    >
                                        <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-bold text-lg relative">
                                            {contact.name.charAt(0)}
                                            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full"></span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-baseline mb-1">
                                                <h3 className="font-bold text-gray-800 truncate">{contact.name}</h3>
                                                <span className="text-xs text-gray-400">
                                                    {contact.lastMessageTime && new Date(contact.lastMessageTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-500 truncate">{contact.lastMessage || 'Start a conversation'}</p>
                                        </div>
                                        {contact.unreadCount ? (
                                            <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                                                {contact.unreadCount}
                                            </div>
                                        ) : null}
                                    </div>
                                ))}
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Chat Window View */}
            {!selectedContact ? (
                <div className="hidden md:flex w-2/3 items-center justify-center bg-gray-50 text-gray-400 flex-col">
                    <span className="text-6xl mb-4">💬</span>
                    <p>Select a contact to start chatting</p>
                </div>
            ) : (
                <div className={`flex flex-col h-full bg-gray-50 w-full md:w-2/3 ${selectedContact ? 'flex' : 'hidden md:flex'}`}>
                    {/* Header */}
                    <div className="p-4 bg-white border-b border-gray-200 shadow-sm flex items-center space-x-3">
                        <button
                            onClick={() => setSelectedContact(null)}
                            className="md:hidden p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                        >
                            ←
                        </button>
                        <div className="w-10 h-10 rounded-full bg-purple-200 flex items-center justify-center text-purple-700 font-bold">
                            {selectedContact.name.charAt(0)}
                        </div>
                        <div>
                            <h2 className="font-bold text-gray-800">{selectedContact.name}</h2>
                            <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{selectedContact.role}</span>
                        </div>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-gray-50">
                        {loadingMessages ? (
                            <div className="text-center text-gray-400 text-sm mt-4">Loading conversation...</div>
                        ) : messages.length === 0 ? (
                            <div className="text-center text-gray-400 text-sm mt-10">
                                {selectedContact.id === 'broadcast' ? 'Send a broadcast message to all users.' : 'No messages yet. Say hi! 👋'}
                            </div>
                        ) : (
                            messages.map(msg => (
                                <div key={msg.id} className={`flex ${msg.isMe || msg.senderId === MY_ID ? 'justify-end' : 'justify-start'} mb-4`}>
                                    <div className={`p-3 rounded-lg max-w-xs shadow-sm ${msg.isMe || msg.senderId === MY_ID
                                            ? 'bg-blue-600 text-white rounded-br-none'
                                            : 'bg-white text-gray-800 border border-gray-200 rounded-bl-none'
                                        }`}>
                                        <p className="text-sm">{msg.content}</p>
                                        <p className={`text-[10px] mt-1 text-right ${msg.isMe || msg.senderId === MY_ID ? 'text-blue-100' : 'text-gray-400'}`}>
                                            {new Date(msg.timestamp || msg.createdAt || '').toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                </div>
                            ))
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <div className="p-4 bg-white border-t border-gray-200">
                        <form onSubmit={handleSendMessage} className="flex space-x-2">
                            <input
                                type="text"
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                placeholder={selectedContact.id === 'broadcast' ? "Type broadcast message..." : "Type a message..."}
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                            />
                            <button
                                type="submit"
                                disabled={!newMessage.trim()}
                                className="bg-blue-600 text-white rounded-full p-2 w-10 h-10 flex items-center justify-center hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                            >
                                ➤
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
