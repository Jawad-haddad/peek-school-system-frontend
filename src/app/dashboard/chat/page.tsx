'use client';

import { useState, useEffect, useRef } from 'react';
import api from '@/lib/api';
import { chatApi } from '@/lib/api';

type Contact = {
    id: string;
    name: string;
    email?: string;
    avatar?: string;
    role: string;
    lastMessage?: string;
    lastMessageTime?: string;
    unreadCount?: number;
    studentName?: string;
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
            const res = await api.get('/chat/contacts');
            setContacts(res.data);
        } catch (error) {
            console.warn("Contacts fetch failed (likely 403/404), defaulting to empty.", error);
            setContacts([]);
        } finally {
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
        <div className="flex h-[calc(100vh-64px)] md:h-[calc(100vh-2rem)] overflow-hidden gap-4 p-4 md:p-0">
            {/* Contacts Sidebar */}
            <div className={`flex-col h-full glass-panel rounded-3xl overflow-hidden ${selectedContact ? 'hidden md:flex' : 'flex'} w-full md:w-1/3 border-0 shadow-xl`}>
                <div className="p-6 border-b border-white/20 bg-gradient-to-r from-violet-600/10 to-fuchsia-600/10 backdrop-blur-md flex justify-between items-center">
                    <h1 className="text-2xl font-black text-gray-800 tracking-tight">Messages</h1>
                    {isAdmin && (
                        <button
                            onClick={() => setSelectedContact({ id: 'broadcast', name: 'Broadcast', role: 'SYSTEM' })}
                            className="text-xs bg-gray-900 text-white px-3 py-1.5 rounded-full hover:bg-black transition-colors font-bold shadow-lg"
                        >
                            📢 All
                        </button>
                    )}
                </div>
                <div className="overflow-y-auto flex-1 custom-scrollbar space-y-2 p-2">
                    {loadingContacts ? (
                        <div className="p-8 text-center text-gray-400 font-medium animate-pulse">Loading contacts...</div>
                    ) : contacts.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-64 text-gray-400 px-6 text-center">
                            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center text-3xl mb-4 shadow-sm border border-gray-100">
                                📭
                            </div>
                            <p className="font-bold text-gray-600 text-lg mb-1">No contacts yet</p>
                            <p className="text-xs text-gray-400 max-w-[200px] leading-relaxed">
                                {userRole === 'PARENT'
                                    ? "No teachers found. Your child might not be enrolled in any classes yet."
                                    : "Once you are assigned to a class, people will appear here."}
                            </p>
                        </div>
                    ) : (
                        Object.entries(groupedContacts).map(([role, list]) => (
                            <div key={role} className="mb-2">
                                <div className="px-4 py-2 text-[10px] font-black text-violet-400 uppercase tracking-widest sticky top-0 bg-white/50 backdrop-blur-md z-10 rounded-lg mx-2 mb-1">
                                    {role}s
                                </div>
                                {list.map(contact => (
                                    <div
                                        key={contact.id}
                                        onClick={() => setSelectedContact(contact)}
                                        className={`p-4 mx-2 rounded-2xl cursor-pointer transition-all duration-200 flex items-center space-x-4 border border-transparent
                                        ${selectedContact?.id === contact.id ? 'bg-white shadow-lg border-violet-100 scale-[0.98]' : 'hover:bg-white/40 hover:scale-[0.99]'}`}
                                    >
                                        <div className="relative">
                                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-200 to-fuchsia-200 flex items-center justify-center text-violet-700 font-black text-lg shadow-sm">
                                                {contact.name.charAt(0)}
                                            </div>
                                            {contact.unreadCount ? (
                                                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                                                </span>
                                            ) : null}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-baseline mb-1">
                                                <h3 className="font-black text-gray-800 truncate text-base">{contact.name}</h3>
                                                <span className="text-[10px] text-gray-400 font-medium">
                                                    {contact.lastMessageTime && new Date(contact.lastMessageTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                            {contact.studentName && (
                                                <div className="mb-1">
                                                    <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full font-bold">
                                                        For: {contact.studentName}
                                                    </span>
                                                </div>
                                            )}
                                            <p className={`text-xs truncate ${selectedContact?.id === contact.id ? 'text-violet-600 font-bold' : 'text-gray-500 font-medium'}`}>
                                                {contact.lastMessage || 'Start a conversation'}
                                            </p>
                                        </div>
                                        {contact.unreadCount ? (
                                            <div className="w-6 h-6 bg-gradient-to-r from-violet-600 to-fuchsia-600 rounded-full flex items-center justify-center text-white text-[10px] font-bold shadow-md shadow-violet-200">
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
                <div className="hidden md:flex w-2/3 glass-panel rounded-3xl items-center justify-center flex-col text-gray-400 shadow-xl">
                    <div className="w-24 h-24 bg-gradient-to-br from-violet-100 to-fuchsia-100 rounded-[2rem] flex items-center justify-center text-5xl mb-6 shadow-inner">
                        💬
                    </div>
                    <p className="font-bold text-xl text-gray-800">Select a conversation</p>
                    <p className="text-sm mt-2 opacity-60">Start chatting with teachers, students, or parents</p>
                </div>
            ) : (
                <div className={`flex flex-col h-full glass-panel rounded-3xl w-full md:w-2/3 border-0 shadow-xl overflow-hidden ${selectedContact ? 'flex' : 'hidden md:flex'}`}>
                    {/* Header */}
                    <div className="p-4 bg-white/50 backdrop-blur-md border-b border-white/20 flex items-center space-x-4 z-10">
                        <button
                            onClick={() => setSelectedContact(null)}
                            className="md:hidden p-2 -ml-2 text-gray-600 hover:bg-white rounded-xl transition-colors"
                        >
                            ←
                        </button>
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-violet-200">
                            {selectedContact.name.charAt(0)}
                        </div>
                        <div>
                            <h2 className="font-black text-gray-800 text-lg leading-tight">{selectedContact.name}</h2>
                            <span className="text-[10px] font-bold bg-violet-100 text-violet-600 px-2 py-0.5 rounded-full uppercase tracking-wider">{selectedContact.role}</span>
                        </div>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-transparent custom-scrollbar">
                        {loadingMessages ? (
                            <div className="text-center text-gray-400 text-sm mt-8 font-medium animate-pulse">Loading conversation...</div>
                        ) : messages.length === 0 ? (
                            <div className="text-center mt-12 opacity-50">
                                <div className="text-4xl mb-2">👋</div>
                                <p className="text-sm font-bold text-gray-400">No messages yet. Say hi!</p>
                            </div>
                        ) : (
                            messages.map(msg => (
                                <div key={msg.id} className={`flex ${msg.isMe || msg.senderId === MY_ID ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                                    <div className={`max-w-[75%] md:max-w-[60%] shadow-sm ${msg.isMe || msg.senderId === MY_ID
                                        ? 'bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white rounded-2xl rounded-br-sm'
                                        : 'bg-white text-gray-800 rounded-2xl rounded-bl-sm'
                                        } p-4 text-sm relative group transition-all hover:shadow-md`}>
                                        <p className="leading-relaxed">{msg.content}</p>
                                        <p className={`text-[10px] mt-1 text-right font-medium opacity-70 ${msg.isMe || msg.senderId === MY_ID ? 'text-violet-100' : 'text-gray-400'
                                            }`}>
                                            {new Date(msg.timestamp || msg.createdAt || '').toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                </div>
                            ))
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <div className="p-4 bg-white/50 backdrop-blur-md border-t border-white/20">
                        <form onSubmit={handleSendMessage} className="flex gap-2 relative">
                            <input
                                type="text"
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                placeholder={selectedContact.id === 'broadcast' ? "Type broadcast message..." : "Type your message..."}
                                className="flex-1 pl-6 pr-14 py-4 bg-white border-0 rounded-2xl focus:ring-2 focus:ring-violet-400 shadow-sm text-gray-700 placeholder-gray-400 font-medium transition-all"
                            />
                            <button
                                type="submit"
                                disabled={!newMessage.trim()}
                                className="absolute right-2 top-2 bottom-2 aspect-square bg-gray-900 text-white rounded-xl flex items-center justify-center hover:bg-black transition-all disabled:opacity-0 disabled:scale-75 shadow-lg active:scale-95"
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
