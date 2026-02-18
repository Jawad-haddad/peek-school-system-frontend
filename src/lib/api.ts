import axios from 'axios';

const api = axios.create({
    baseURL: '/api',
    // You can add other default config here like timeout
});

api.interceptors.request.use(
    (config) => {
        if (typeof window !== 'undefined') {
            const token = localStorage.getItem('token');
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }

            // Add schoolId if available
            const userStr = localStorage.getItem('user');
            if (userStr) {
                try {
                    const user = JSON.parse(userStr);
                    if (user.schoolId) {
                        config.headers['x-school-id'] = user.schoolId;
                    }
                } catch (e) {
                    // ignore parse error
                }
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

export const examApi = {
    fetchAllExams: async () => {
        try {
            return await api.get('/school/exams');
        } catch (error: any) {
            toast.error("Failed to fetch exams: " + (error.response?.data?.message || error.message));
            throw error;
        }
    },
    fetchExamSchedules: async (examId: string) => {
        try {
            return await api.get(`/exams/${examId}/schedules`);
        } catch (error: any) {
            toast.error("Failed to fetch schedules: " + (error.response?.data?.message || error.message));
            throw error;
        }
    },
    submitBulkMarks: async (scheduleId: string, marks: { studentId: string; marks: number; comment?: string }[]) => {
        try {
            const res = await api.post(`/exams/schedules/${scheduleId}/marks`, { marks });
            toast.success("Marks submitted successfully");
            return res;
        } catch (error: any) {
            toast.error("Failed to submit marks: " + (error.response?.data?.message || error.message));
            throw error;
        }
    },
    fetchScheduleMarks: async (scheduleId: string) => {
        try {
            return await api.get(`/exams/schedules/${scheduleId}/marks`);
        } catch (error: any) {
            throw error;
        }
    },
    updateExam: async (examId: string, data: any) => {
        try {
            const res = await api.put(`/school/exams/${examId}`, data);
            toast.success("Exam updated successfully");
            return res;
        } catch (error: any) {
            toast.error("Failed to update exam: " + (error.response?.data?.message || error.message));
            throw error;
        }
    },
    createSchedule: async (data: any) => {
        try {
            const res = await api.post(`/school/exams/${data.examId}/schedules`, data);
            toast.success("Schedule added successfully");
            return res;
        } catch (error: any) {
            toast.error("Failed to add schedule: " + (error.response?.data?.message || error.message));
            throw error;
        }
    },
    deleteSchedule: async (scheduleId: string) => {
        try {
            const res = await api.delete(`/school/exam-schedules/${scheduleId}`); // Check if this needs specific path too
            toast.success("Schedule removed");
            return res;
        } catch (error: any) {
            toast.error("Failed to delete schedule");
            throw error;
        }
    }
};

export const financeApi = {
    topUpWallet: async (studentId: string, amount: number) => {
        try {
            const res = await api.post('/finance/wallet/topup', { studentId, amount });
            toast.success("Wallet topped up successfully");
            return res;
        } catch (error: any) {
            toast.error("Top-up failed: " + (error.response?.data?.message || error.message));
            throw error;
        }
    },
    fetchWalletHistory: async (studentId: string) => {
        try {
            return await api.get(`/finance/wallet/${studentId}/history`);
        } catch (error: any) {
            toast.error("Failed to fetch wallet history: " + (error.response?.data?.message || error.message));
            throw error;
        }
    }
};

export const schoolApi = {
    fetchStudents: async (classId: string) => {
        try {
            // Adjusted path to align with existing student fetch patterns
            return await api.get(`/school/students?classId=${classId}`);
        } catch (error: any) {
            toast.error("Failed to fetch students: " + (error.response?.data?.message || error.message));
            throw error;
        }
    },
    fetchStudent: async (studentId: string) => {
        try {
            return await api.get(`/school/students/${studentId}`);
        } catch (error: any) {
            toast.error("Failed to fetch student: " + (error.response?.data?.message || error.message));
            throw error;
        }
    },
    updateStudent: async (studentId: string, data: any) => {
        try {
            const res = await api.patch(`/school/students/${studentId}`, data);
            toast.success("Student updated");
            return res;
        } catch (error: any) {
            toast.error("Update failed: " + (error.response?.data?.message || error.message));
            throw error;
        }
    }
};

export const academicApi = {
    fetchClasses: async () => {
        try {
            return await api.get('/academics/classes');
        } catch (error: any) {
            toast.error("Failed to fetch classes: " + (error.response?.data?.message || error.message));
            throw error;
        }
    },
    fetchSubjects: async () => {
        try {
            return await api.get('/academics/subjects');
        } catch (error: any) {
            toast.error("Failed to fetch subjects: " + (error.response?.data?.message || error.message));
            throw error;
        }
    },
    fetchClassSubjects: async (classId: string) => {
        try {
            return await api.get(`/academics/subjects?classId=${classId}`);
        } catch (error: any) {
            toast.error("Failed to fetch class subjects: " + (error.response?.data?.message || error.message));
            throw error;
        }
    },
    fetchTeachers: async () => {
        try {
            return await api.get('/academics/teachers');
        } catch (error: any) {
            toast.error("Failed to fetch teachers: " + (error.response?.data?.message || error.message));
            throw error;
        }
    },
    fetchClassTeachers: async (classId: string) => {
        try {
            return await api.get(`/academics/classes/${classId}/teachers`);
        } catch (error: any) {
            toast.error("Failed to fetch class teachers: " + (error.response?.data?.message || error.message));
            throw error;
        }
    },
    fetchTeacherClasses: async (teacherId: string) => {
        try {
            return await api.get(`/academics/teachers/${teacherId}/classes`);
        } catch (error: any) {
            toast.error("Failed to fetch teacher classes: " + (error.response?.data?.message || error.message));
            throw error;
        }
    }
};

export const posApi = {
    fetchProducts: async () => {
        try {
            return await api.get('/pos/products');
        } catch (error: any) {
            toast.error("Failed to fetch products: " + (error.response?.data?.message || error.message));
            throw error;
        }
    },
    createOrder: async (studentId: string, items: { productId: string; quantity: number }[]) => {
        try {
            const res = await api.post('/pos/orders', { studentId, items });
            toast.success("Order processed successfully");
            return res;
        } catch (error: any) {
            toast.error("Order failed: " + (error.response?.data?.message || error.message));
            throw error;
        }
    }
};

export const studentApi = {
    fetchMyProfile: async () => {
        try {
            return await api.get('/student/profile');
        } catch (error: any) {
            toast.error("Failed to fetch profile: " + (error.response?.data?.message || error.message));
            throw error;
        }
    },
    fetchStudentResults: async (studentId: string) => {
        try {
            return await api.get(`/student/${studentId}/results`);
        } catch (error: any) {
            toast.error("Failed to fetch results: " + (error.response?.data?.message || error.message));
            throw error;
        }
    }
};

export const systemApi = {
    checkHealth: async () => {
        try {
            // /health is mounted at root, not under /api
            return await axios.get('/health');
        } catch (error) {
            console.error("Health check failed", error);
            throw error;
        }
    }
};

export const statsApi = {
    fetchFeesStats: async () => {
        try {
            return await api.get('/school/stats/fees');
        } catch (error: any) {
            toast.error("Failed to load fee statistics: " + (error.response?.data?.message || error.message));
            throw error;
        }
    }
};

export default api;
