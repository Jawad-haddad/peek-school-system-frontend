import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:3000/api',
    // You can add other default config here like timeout
});

api.interceptors.request.use(
    (config) => {
        if (typeof window !== 'undefined') {
            const token = localStorage.getItem('token');
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

api.interceptors.response.use(
    (response) => response,
    (error) => {
        // Handle common errors globally if needed, e.g., 401 Redirects
        if (error.response && error.response.status === 401) {
            if (typeof window !== 'undefined') {
                localStorage.removeItem('token');
                localStorage.removeItem('role');
                localStorage.removeItem('user');
                window.location.href = '/';
            }
        }
        return Promise.reject(error);
    }
);


export const chatApi = {
    fetchContacts: () => api.get('/chat/contacts'),
    fetchConversation: (contactId: string) => api.get(`/chat/messages?contactId=${contactId}`),
    sendMessage: (contactId: string, content: string) => api.post('/chat/messages', { contactId, content }),
};

export default api;
