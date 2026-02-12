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


import { toast } from '@/lib/toast-events';

export const busApi = {
    getRoutes: async () => {
        try {
            return await api.get('/bus/routes');
        } catch (error: any) {
            toast.error("Failed to load routes: " + (error.response?.data?.message || error.message));
            throw error;
        }
    },
    getTrip: async (tripId: string) => {
        try {
            return await api.get(`/bus/trip/${tripId}`);
        } catch (error: any) {
            toast.error("Failed to load trip: " + (error.response?.data?.message || error.message));
            throw error;
        }
    },
    getActiveTripForRoute: async (routeId: string) => {
        try {
            return await api.get(`/bus/routes/${routeId}/active-trip`);
        } catch (error: any) {
            // Optional: Don't show toast for 404 if "no active trip" is valid flow, 
            // but here we treat errors as system issues
            toast.error("Error loading active trip: " + (error.response?.data?.message || error.message));
            throw error;
        }
    },

    scanStudent: async (tripId: string, studentId: string, status: 'BOARDED' | 'DROPPED_OFF' | 'ABSENT') => {
        try {
            const res = await api.post('/bus/scan', { tripId, studentId, status });
            toast.success(`Student ${status.replace('_', ' ')}`);
            return res;
        } catch (error: any) {
            toast.error("Scan Failed: " + (error.response?.data?.message || error.message));
            throw error;
        }
    },

    startTrip: async (tripId: string) => {
        try {
            const res = await api.post(`/bus/trip/${tripId}/start`);
            toast.success("Trip Started");
            return res;
        } catch (error: any) {
            toast.error("Failed to start trip: " + (error.response?.data?.message || error.message));
            throw error;
        }
    },
    endTrip: async (tripId: string) => {
        try {
            const res = await api.post(`/bus/trip/${tripId}/end`);
            toast.success("Trip Ended");
            return res;
        } catch (error: any) {
            toast.error("Failed to end trip: " + (error.response?.data?.message || error.message));
            throw error;
        }
    },
};

export default api;
