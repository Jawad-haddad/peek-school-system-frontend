import axios from 'axios';
import { logout } from './auth';

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

// Configure standard backend connection URL
const configuredBaseURL = process.env.NEXT_PUBLIC_API_BASE_URL;

if (!configuredBaseURL && typeof window !== 'undefined') {
    // Only warn the dev console once on startup
    console.warn(
        '%c[API CONFIG WARNING] NEXT_PUBLIC_API_BASE_URL is missing!\n' +
        'Frontend requests are defaulting to local relative path "/api".\n' +
        'In production, this could silently fail if routing is not strictly managed.',
        'color:orange; font-weight:bold'
    );
}

const api = axios.create({
    baseURL: configuredBaseURL || '/api',
    timeout: 10000, // Enforce a 10s timeout to prevent hanging UI
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
        // 403 Tenant / Permission errors — normalise to a friendly ApiEnvelopeError so
        // any catch block can use err.message directly without inspecting err.response.status.
        // Original server message (if any) is preserved in .details for logging.
        if (error.response && error.response.status === 403) {
            const serverMsg: string | undefined = error.response.data?.error?.message
                ?? error.response.data?.message
                ?? undefined;
            throw new ApiEnvelopeError(
                "You don't have access to this school's data.",
                'TENANT_FORBIDDEN',
                serverMsg,
            );
        }
        // 404 Not Found — normalise to a friendly ApiEnvelopeError.
        if (error.response && error.response.status === 404) {
            const serverMsg: string | undefined = error.response.data?.error?.message
                ?? error.response.data?.message
                ?? undefined;
            throw new ApiEnvelopeError(
                'No finance data found.',
                'NOT_FOUND',
                serverMsg,
            );
        }
        // Handle common errors globally if needed, e.g., 401 Redirects
        if (error.response && error.response.status === 401) {
            logout();
        }
        return Promise.reject(error);
    }
);

// ============================================================================
// CENTRAL REQUEST WRAPPER
// Unwraps the backend envelope: { success, data, error: { message, code, details } }
// On success === false  → throws ApiEnvelopeError (has .message, .code, .details)
// On success === true   → returns data (T) directly — no .data dereference needed
// For legacy endpoints that do NOT use the envelope the raw body is returned as-is.
// ============================================================================

export class ApiEnvelopeError extends Error {
    code?: string;
    details?: unknown;

    constructor(message: string, code?: string, details?: unknown) {
        super(message);
        this.name = 'ApiEnvelopeError';
        this.code = code;
        this.details = details;
    }
}

/**
 * Central fetch helper that unwraps backend envelopes.
 *
 * Usage:
 *   const data = await request<LoginResponse>(() => api.post('/auth/login', body));
 *   // data is LoginResponse — no .data needed
 *
 * Error handling:
 *   try { ... } catch (err) {
 *     if (err instanceof ApiEnvelopeError) console.log(err.message, err.code);
 *   }
 */
export async function request<T>(call: () => Promise<{ data: unknown }>): Promise<T> {
    // Let axios throw on HTTP errors (4xx/5xx) — caught by the interceptor first.
    const response = await call();
    const body = response.data as Record<string, unknown>;

    // Detect envelope: backend sets `success` (boolean) at the top level.
    if (body !== null && typeof body === 'object' && 'success' in body) {
        if (body.success === false) {
            const err = body.error as { message?: string; code?: string; details?: unknown } | undefined;
            const code = err?.code;
            const rawMessage = err?.message ?? 'An unknown error occurred.';

            // Normalise tenant / permission codes to a single friendly message.
            // Original server message is preserved in .details for logging.
            const isTenantForbidden = code === 'TENANT_FORBIDDEN';
            const message = isTenantForbidden
                ? "You don't have access to this school's data."
                : rawMessage;

            throw new ApiEnvelopeError(
                message,
                code,
                isTenantForbidden ? rawMessage : err?.details,
            );
        }
        // success === true — return the inner data payload
        return body.data as T;
    }

    // Legacy / non-envelope endpoint — return raw body.
    return body as T;
}

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
    /**
     * POST /finance/wallet/topup
     * Uses request() so envelope is unwrapped and 403/404 produce friendly ApiEnvelopeError.
     */
    topUpWallet: async (studentId: string, amount: number) => {
        try {
            const result = await request<{ message?: string }>(() =>
                api.post('/finance/wallet/topup', { studentId, amount })
            );
            toast.success('Wallet topped up successfully');
            return result;
        } catch (error: any) {
            toast.error('Top-up failed: ' + (error.message || 'Unknown error'));
            throw error;
        }
    },
    /**
     * GET /finance/wallet/:studentId/history
     * 404 → 'No finance data found.'  403 → tenant message  (both via interceptor)
     */
    fetchWalletHistory: async (studentId: string) => {
        try {
            return await request<unknown[]>(() =>
                api.get(`/finance/wallet/${studentId}/history`)
            );
        } catch (error: any) {
            toast.error('Failed to fetch wallet history: ' + (error.message || 'Unknown error'));
            throw error;
        }
    },
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
            return await request<unknown[] | { products: unknown[] }>(() => api.get('/pos/products'));
        } catch (error: any) {
            toast.error("Failed to fetch products: " + (error.message || 'Unknown error'));
            throw error;
        }
    },
    createOrder: async (studentId: string, items: { productId: string; quantity: number }[]) => {
        try {
            // Note: studentId and items are sent; schoolId is NOT included
            // relying on the interceptor's x-school-id header for tenant isolation.
            const res = await request<unknown>(() => api.post('/pos/orders', { studentId, items }));
            toast.success("Order processed successfully");
            return res;
        } catch (error: any) {
            let msg = error.message || 'Unknown error';
            if (error.code === 'VALIDATION_ERROR' && Array.isArray(error.details) && error.details.length > 0) {
                msg = error.details[0].message || error.details[0].string || Object.values(error.details[0])[0] || msg;
            }
            toast.error("Order failed: " + msg);
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
    /**
     * GET /school/stats/fees
     * Uses request() — 403/404 produce friendly ApiEnvelopeError.
     */
    fetchFeesStats: async () => {
        try {
            return await request<unknown>(() => api.get('/school/stats/fees'));
        } catch (error: any) {
            toast.error('Failed to load fee statistics: ' + (error.message || 'Unknown error'));
            throw error;
        }
    },
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

const safeErrorMsg = (e: ApiError, defaultMsg: string) => {
    if (e.response?.data?.message) return e.response.data.message;
    if (!e.response && e.message?.includes('Network Error')) return 'Network Error: The server is unreachable.';
    return e.message ?? defaultMsg;
};

export const mvpApi = {

    // ── Auth ──────────────────────────────────────────────────────────────────

    /**
     * POST /auth/login
     * Returns: LoginResponse { message, token, user: AuthUser } — plain object, no .data wrapper.
     * Throws ApiEnvelopeError (readable .message) if the server signals failure.
     */
    loginUser: async (email: string, password: string): Promise<LoginResponse> => {
        return request<LoginResponse>(() =>
            api.post(MVP_ENDPOINTS.LOGIN, { email, password })
        );
    },

    // ── Admin Classes ─────────────────────────────────────────────────────────

    /**
     * GET /school/classes
     * Returns: SchoolClass[] — direct array, no envelope.
     */
    fetchClasses: async (): Promise<SchoolClass[]> => {
        try {
            return await request<SchoolClass[]>(() => api.get(MVP_ENDPOINTS.CLASSES));
        } catch (error: unknown) {
            const e = error as ApiError;
            toast.error("Failed to fetch classes: " + safeErrorMsg(e, "Unknown error"));
            throw error;
        }
    },

    /**
     * POST /school/classes
     * Request: CreateClassRequest
     * Returns: SchoolClass
     */
    createClass: async (data: CreateClassRequest): Promise<SchoolClass> => {
        try {
            const result = await request<SchoolClass>(() => api.post(MVP_ENDPOINTS.CLASSES, data));
            toast.success("Class created successfully");
            return result;
        } catch (error: unknown) {
            const e = error as ApiError;
            toast.error("Failed to create class: " + safeErrorMsg(e, "Unknown error"));
            throw error;
        }
    },

    /**
     * PUT /school/classes/:id
     * Request: UpdateClassRequest
     * Returns: SchoolClass
     */
    updateClass: async (id: string, data: UpdateClassRequest): Promise<SchoolClass> => {
        try {
            const result = await request<SchoolClass>(() => api.put(MVP_ENDPOINTS.CLASS_BY_ID(id), data));
            toast.success("Class updated successfully");
            return result;
        } catch (error: unknown) {
            const e = error as ApiError;
            toast.error("Failed to update class: " + safeErrorMsg(e, "Unknown error"));
            throw error;
        }
    },

    /**
     * DELETE /school/classes/:id
     * Returns: 204 No Content or {}
     */
    deleteClass: async (id: string): Promise<Record<string, never>> => {
        try {
            const result = await request<Record<string, never>>(() => api.delete(MVP_ENDPOINTS.CLASS_BY_ID(id)));
            toast.success("Class deleted");
            return result;
        } catch (error: unknown) {
            const e = error as ApiError;
            toast.error("Failed to delete class: " + safeErrorMsg(e, "Unknown error"));
            throw error;
        }
    },

    /**
     * GET /academic-years
     * Returns: AcademicYear[] — direct array, no envelope.
     */
    fetchAcademicYears: async (): Promise<AcademicYear[]> => {
        try {
            return await request<AcademicYear[]>(() => api.get(MVP_ENDPOINTS.ACADEMIC_YEARS));
        } catch (error: unknown) {
            const e = error as ApiError;
            toast.error("Failed to load academic years: " + safeErrorMsg(e, "Unknown error"));
            throw error;
        }
    },

    // ── Teacher Attendance ────────────────────────────────────────────────────

    /**
     * GET /academics/teachers/:teacherId/classes
     * Returns: SchoolClass[] — direct array, no envelope.
     */
    fetchTeacherClasses: async (teacherId: string): Promise<SchoolClass[]> => {
        try {
            return await request<SchoolClass[]>(() => api.get(MVP_ENDPOINTS.TEACHER_CLASSES(teacherId)));
        } catch (error: unknown) {
            const e = error as ApiError;
            toast.error("Failed to fetch teacher classes: " + safeErrorMsg(e, "Unknown error"));
            throw error;
        }
    },

    /**
     * GET /academics/classes/:classId/students
     * Returns: StudentRecord[] — each has { id, fullName }
     */
    fetchClassStudents: async (classId: string): Promise<StudentRecord[]> => {
        try {
            return await request<StudentRecord[]>(() => api.get(MVP_ENDPOINTS.CLASS_STUDENTS(classId)));
        } catch (error: unknown) {
            const e = error as ApiError;
            toast.error("Failed to fetch students: " + safeErrorMsg(e, "Unknown error"));
            throw error;
        }
    },

    /**
     * POST /attendance/bulk
     * classId + date are TOP-LEVEL in payload, NOT inside records.
     * Returns: BulkAttendanceResponse { savedCount, date, classId }
     */
    submitBulkAttendance: async (payload: BulkAttendancePayload): Promise<BulkAttendanceResponse> => {
        try {
            const result = await request<BulkAttendanceResponse>(() =>
                api.post(MVP_ENDPOINTS.ATTENDANCE_BULK, payload)
            );
            toast.success(`Successfully saved ${result.savedCount} attendance records!`);
            return result;
        } catch (error: unknown) {
            const e = error as ApiError;
            toast.error("Failed to save attendance: " + safeErrorMsg(e, "Unknown error"));
            throw error;
        }
    },

    /**
     * Connectivity Check
     * Explicitly bypasses the /api route to hit the raw /health endpoint.
     * Used on the login page to proactively warn users if the backend is dark.
     */
    checkConnectivity: async () => {
        try {
            // We use standard axios to avoid token interception, hitting raw base URL
            const rawBaseURL = configuredBaseURL ? configuredBaseURL.replace(/\/api$/, '') : '';
            await axios.get(`${rawBaseURL}/health`, { timeout: 3000 });
            return true;
        } catch (error) {
            return false;
        }
    },
};

export default api;
