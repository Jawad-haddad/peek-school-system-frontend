import axios from 'axios';

// ─── Debug Logger ──────────────────────────────────────────────────────────────
// Enable by adding NEXT_PUBLIC_DEBUG_MVP_API=true to .env.local
// Remove the env var (or set to false) to disable. Safe to leave in production.
const DEBUG = process.env.NEXT_PUBLIC_DEBUG_MVP_API === 'true';

function debugLog(label: string, data: unknown): void {
    if (!DEBUG) return;
    // Deep-clone so we can mask the token without mutating the original
    const safe = JSON.parse(JSON.stringify(data));
    if (safe?.headers?.Authorization) {
        safe.headers.Authorization = 'Bearer [MASKED]';
    }
    if (safe?.token && typeof safe.token === 'string') {
        safe.token = '[MASKED]';
    }
    console.group(`%c[MVP-API] ${label}`, 'color:#7c3aed;font-weight:bold');
    console.log(safe);
    console.groupEnd();
}
// ─────────────────────────────────────────────────────────────────────────────

const api = axios.create({
    baseURL: '/api',
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

        // Debug instrumentation — masked token, safe to leave during testing
        debugLog(`→ ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`, {
            method: config.method,
            url: `${config.baseURL}${config.url}`,
            headers: config.headers,
            data: config.data,
        });

        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

api.interceptors.response.use(
    (response) => {
        // Debug instrumentation — logs real response payload (token masked)
        debugLog(`← ${response.status} ${response.config.method?.toUpperCase()} ${response.config.url}`, {
            status: response.status,
            url: response.config.url,
            data: response.data,
        });
        return response;
    },
    (error) => {
        // Debug: log error responses too
        if (error.response) {
            debugLog(`✗ ${error.response.status} ${error.config?.method?.toUpperCase()} ${error.config?.url}`, {
                status: error.response.status,
                url: error.config?.url,
                data: error.response.data,
            });
        }
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
            const res = await api.delete(`/school/exam-schedules/${scheduleId}`);
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

// ============================================================================
// MVP API CONTRACT
// ── Single source of truth for all MVP flow endpoints and response shapes. ──
// ── To call an MVP endpoint, add or use an entry here.                     ──
// ── Never call api.get/post/put/delete directly in MVP component files.    ──
// ── Guardrail: scripts/check-mvp-contract.mjs                             ──
// ── @contract-temporary: manually typed until backend provides OpenAPI.   ──
// ============================================================================

// ── Endpoint Path Registry ────────────────────────────────────────────────────
// Centralised so path drift requires one edit here and is caught by TypeScript.
export const MVP_ENDPOINTS = {
    // Auth
    LOGIN: '/auth/login',                              // POST

    // Classes (Admin CRUD)
    CLASSES: '/school/classes',                          // GET, POST
    CLASS_BY_ID: (id: string) => `/school/classes/${id}`,    // PUT, DELETE

    // Academic year (class form dropdowns)
    ACADEMIC_YEARS: '/academic-years',                          // GET

    // Teacher attendance flows
    TEACHER_CLASSES: (teacherId: string) => `/academics/teachers/${teacherId}/classes`,  // GET
    CLASS_STUDENTS: (classId: string) => `/academics/classes/${classId}/students`,    // GET

    // Attendance submission
    ATTENDANCE_BULK: '/attendance/bulk',                         // POST
} as const;

// ── Request / Response Types ──────────────────────────────────────────────────

export type UserRole = 'ADMIN' | 'TEACHER' | 'PARENT';

/** User object returned inside the login response. No deprecated `name` field. */
export type AuthUser = {
    id: string;
    fullName: string;   // backend always returns `fullName`, never `name`
    email: string;
    role: UserRole;
    schoolId: string;
};

/** Full shape of POST /auth/login 200 response. */
export type LoginResponse = {
    message: string;
    token: string;
    user: AuthUser;
};

/** Each item in GET /school/classes response array. */
export type SchoolClass = {
    id: string;
    name: string;
    academicYear?: { id: string; name: string } | string;
    academicYearId?: string;
    defaultFee?: number;
    _count?: { students: number };
    subject?: { name: string };
};

/** Each item in GET /academic-years response array. */
export type AcademicYear = {
    id: string;
    name: string;
    isActive: boolean;
};

/** Payload for POST /school/classes */
export type CreateClassRequest = {
    name: string;
    academicYearId: string;
    defaultFee?: number;
};

/** Payload for PUT /school/classes/:id */
export type UpdateClassRequest = {
    name: string;
    academicYearId: string;
    defaultFee?: number;
};

/**
 * Each item in GET /academics/classes/:classId/students.
 * Only `id` and `fullName` are guaranteed by contract.
 * No index signature — do not add [key: string]: unknown.
 */
export type StudentRecord = {
    id: string;
    fullName: string;
    classId?: string;
    gradeLevel?: string;
};

/** Attendance status values — lowercase, as required by backend enum. */
export type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused';

/** A single row within the bulk attendance records array. */
export type AttendanceSingleRecord = {
    studentId: string;
    status: AttendanceStatus;
};

/**
 * Payload for POST /attendance/bulk.
 * classId + date are TOP-LEVEL, NOT inside each record.
 */
export type BulkAttendancePayload = {
    classId: string;
    date: string;            // ISO date string e.g. "2026-02-24"
    records: AttendanceSingleRecord[];
};

/** 200 response from POST /attendance/bulk. */
export type BulkAttendanceResponse = {
    savedCount: number;
    date: string;
    classId: string;
};

// ── MVP API Methods ───────────────────────────────────────────────────────────
// All methods use MVP_ENDPOINTS paths and named request/response types.
// No `any`. No response-shape guessing (no `|| []`, no `?.data?.data`).
// ─────────────────────────────────────────────────────────────────────────────

/** Internal error normaliser — avoids repeating `error as any` in each method. */
type ApiError = { response?: { data?: { message?: string } }; message?: string };

export const mvpApi = {

    // ── Auth ──────────────────────────────────────────────────────────────────

    /**
     * POST /auth/login
     * Returns: LoginResponse { message, token, user: AuthUser }
     */
    loginUser: async (email: string, password: string) => {
        return api.post<LoginResponse>(MVP_ENDPOINTS.LOGIN, { email, password });
    },

    // ── Admin Classes ─────────────────────────────────────────────────────────

    /**
     * GET /school/classes
     * Returns: SchoolClass[] — direct array, no envelope.
     */
    fetchClasses: async () => {
        try {
            return await api.get<SchoolClass[]>(MVP_ENDPOINTS.CLASSES);
        } catch (error: unknown) {
            const e = error as ApiError;
            toast.error("Failed to fetch classes: " + (e.response?.data?.message ?? e.message));
            throw error;
        }
    },

    /**
     * POST /school/classes
     * Request: CreateClassRequest
     * Returns: SchoolClass
     */
    createClass: async (data: CreateClassRequest) => {
        try {
            const res = await api.post<SchoolClass>(MVP_ENDPOINTS.CLASSES, data);
            toast.success("Class created successfully");
            return res;
        } catch (error: unknown) {
            const e = error as ApiError;
            toast.error("Failed to create class: " + (e.response?.data?.message ?? e.message));
            throw error;
        }
    },

    /**
     * PUT /school/classes/:id
     * Request: UpdateClassRequest
     * Returns: SchoolClass
     */
    updateClass: async (id: string, data: UpdateClassRequest) => {
        try {
            const res = await api.put<SchoolClass>(MVP_ENDPOINTS.CLASS_BY_ID(id), data);
            toast.success("Class updated successfully");
            return res;
        } catch (error: unknown) {
            const e = error as ApiError;
            toast.error("Failed to update class: " + (e.response?.data?.message ?? e.message));
            throw error;
        }
    },

    /**
     * DELETE /school/classes/:id
     * Returns: 204 No Content or {}
     */
    deleteClass: async (id: string) => {
        try {
            const res = await api.delete<Record<string, never>>(MVP_ENDPOINTS.CLASS_BY_ID(id));
            toast.success("Class deleted");
            return res;
        } catch (error: unknown) {
            const e = error as ApiError;
            toast.error("Failed to delete class: " + (e.response?.data?.message ?? e.message));
            throw error;
        }
    },

    /**
     * GET /academic-years
     * Returns: AcademicYear[] — direct array, no envelope.
     */
    fetchAcademicYears: async () => {
        try {
            return await api.get<AcademicYear[]>(MVP_ENDPOINTS.ACADEMIC_YEARS);
        } catch (error: unknown) {
            const e = error as ApiError;
            toast.error("Failed to load academic years: " + (e.response?.data?.message ?? e.message));
            throw error;
        }
    },

    // ── Teacher Attendance ────────────────────────────────────────────────────

    /**
     * GET /academics/teachers/:teacherId/classes
     * Returns: SchoolClass[] — direct array, no envelope.
     */
    fetchTeacherClasses: async (teacherId: string) => {
        try {
            return await api.get<SchoolClass[]>(MVP_ENDPOINTS.TEACHER_CLASSES(teacherId));
        } catch (error: unknown) {
            const e = error as ApiError;
            toast.error("Failed to fetch teacher classes: " + (e.response?.data?.message ?? e.message));
            throw error;
        }
    },

    /**
     * GET /academics/classes/:classId/students
     * Returns: StudentRecord[] — each has { id, fullName }
     */
    fetchClassStudents: async (classId: string) => {
        try {
            return await api.get<StudentRecord[]>(MVP_ENDPOINTS.CLASS_STUDENTS(classId));
        } catch (error: unknown) {
            const e = error as ApiError;
            toast.error("Failed to fetch students: " + (e.response?.data?.message ?? e.message));
            throw error;
        }
    },

    /**
     * POST /attendance/bulk
     * classId + date are TOP-LEVEL in payload, NOT inside records.
     * Returns: BulkAttendanceResponse { savedCount, date, classId }
     */
    submitBulkAttendance: async (payload: BulkAttendancePayload) => {
        try {
            const res = await api.post<BulkAttendanceResponse>(
                MVP_ENDPOINTS.ATTENDANCE_BULK,
                payload
            );
            toast.success("Attendance saved successfully!");
            return res;
        } catch (error: unknown) {
            const e = error as ApiError;
            toast.error("Failed to save attendance: " + (e.response?.data?.message ?? e.message));
            throw error;
        }
    },
};

export default api;
