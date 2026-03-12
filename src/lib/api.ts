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

function generateRequestId(): string {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    return Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
}

// ─── Lightweight TTL Cache ────────────────────────────────────────────────────
// In-memory module cache for read-only list endpoints (30 s TTL).
// Cache key includes schoolId so switching tenants always busts the cache.
// Also eliminates React Strict Mode double-mount duplicate requests for free.
// ─────────────────────────────────────────────────────────────────────────────

type CacheEntry<T> = { data: T; expiresAt: number };

function createTTLCache<T>(ttlMs: number = 30_000) {
    const store = new Map<string, CacheEntry<T>>();

    function cacheKey(args: unknown[]): string {
        const schoolId = typeof window !== 'undefined' ? (localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user') || '{}').schoolId ?? '' : '') : '';
        return `${schoolId}:${JSON.stringify(args)}`;
    }

    return {
        /** Return cached value if fresh, otherwise call fetcher and cache result. */
        async get(args: unknown[], fetcher: () => Promise<T>): Promise<T> {
            const key = cacheKey(args);
            const hit = store.get(key);
            if (hit && Date.now() < hit.expiresAt) return hit.data;
            const data = await fetcher();
            store.set(key, { data, expiresAt: Date.now() + ttlMs });
            return data;
        },
        /** Imperatively bust the cache (call after mutations). */
        bust() { store.clear(); },
    };
}

// One cache instance per cacheable endpoint
const _classesCache = createTTLCache<SchoolClass[]>();
const _yearsCache = createTTLCache<AcademicYear[]>();
const _productsCache = createTTLCache<unknown[] | { products: unknown[] }>();

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
    baseURL: configuredBaseURL ?? '/api',
    timeout: 10000, // Enforce a 10s timeout to prevent hanging UI
});

api.interceptors.request.use(
    (config) => {
        config.headers['X-Request-Id'] = generateRequestId();

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
        const reqId = error.config?.headers?.['X-Request-Id'] || error.response?.headers?.['x-request-id'];

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
                reqId
            );
        }
        // 404 Not Found — normalise to a friendly ApiEnvelopeError.
        if (error.response && error.response.status === 404) {
            const serverMsg: string | undefined = error.response.data?.error?.message
                ?? error.response.data?.message
                ?? undefined;

            const url = error.config?.url || '';
            const isFinanceRoute = url.includes('/finance') || url.includes('/fees');
            const fallbackMsg = isFinanceRoute ? 'No finance data found.' : 'Resource not found.';

            throw new ApiEnvelopeError(
                serverMsg || fallbackMsg,
                'NOT_FOUND',
                serverMsg,
                reqId
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
    requestId?: string;

    constructor(message: string, code?: string, details?: unknown, requestId?: string) {
        super(message);
        this.name = 'ApiEnvelopeError';
        this.code = code;
        this.details = details;
        this.requestId = requestId;
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
export async function request<T>(call: () => Promise<{ data: unknown, config?: any, headers?: any }>): Promise<T> {
    // Let axios throw on HTTP errors (4xx/5xx) — caught by the interceptor first.
    const response = await call() as any;
    const body = response.data as Record<string, unknown>;
    const reqId = response.config?.headers?.['X-Request-Id'] || response.headers?.['x-request-id'];

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
                reqId
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

export function formatApiError(prefix: string, error: any, defaultMsg: string = 'Unknown error'): string {
    let msg = defaultMsg;

    if (error && typeof error === 'object' && error.name === 'ApiEnvelopeError') {
        msg = error.message;
        if (error.code === 'VALIDATION_ERROR' && Array.isArray(error.details) && error.details.length > 0) {
            msg = error.details[0].message || error.details[0].string || Object.values(error.details[0])[0] || msg;
        }
    } else if (error?.response?.data?.message) {
        msg = error.response.data.message;
    } else if (!error?.response && error?.message?.includes('Network Error')) {
        msg = 'Network Error: The server is unreachable.';
    } else if (error?.message) {
        msg = error.message;
    }

    const reqId = error?.requestId || error?.config?.headers?.['X-Request-Id'] || error?.response?.headers?.['x-request-id'];

    if (process.env.NODE_ENV !== 'production' && reqId) {
        return `${prefix}: ${msg} (Request ID: ${reqId})`;
    }

    return `${prefix}: ${msg}`;
}

export const busApi = {
    getRoutes: async () => {
        try {
            return await api.get('/bus/routes');
        } catch (error: any) {
            toast.error(formatApiError("Failed to load routes", error));
            throw error;
        }
    },
    getTrip: async (tripId: string) => {
        try {
            return await api.get(`/bus/trip/${tripId}`);
        } catch (error: any) {
            toast.error(formatApiError("Failed to load trip", error));
            throw error;
        }
    },
    getActiveTripForRoute: async (routeId: string) => {
        try {
            return await api.get(`/bus/routes/${routeId}/active-trip`);
        } catch (error: any) {
            toast.error(formatApiError("Error loading active trip", error));
            throw error;
        }
    },

    scanStudent: async (tripId: string, studentId: string, status: 'BOARDED' | 'DROPPED_OFF' | 'ABSENT') => {
        try {
            const res = await api.post('/bus/scan', { tripId, studentId, status });
            toast.success(`Student ${status.replace('_', ' ')}`);
            return res;
        } catch (error: any) {
            toast.error(formatApiError("Scan Failed", error));
            throw error;
        }
    },

    startTrip: async (tripId: string) => {
        try {
            const res = await api.post(`/bus/trip/${tripId}/start`);
            toast.success("Trip Started");
            return res;
        } catch (error: any) {
            toast.error(formatApiError("Failed to start trip", error));
            throw error;
        }
    },
    endTrip: async (tripId: string) => {
        try {
            const res = await api.post(`/bus/trip/${tripId}/end`);
            toast.success("Trip Ended");
            return res;
        } catch (error: any) {
            toast.error(formatApiError("Failed to end trip", error));
            throw error;
        }
    },
};

export type ExamSchedule = {
    id: string;
    examId: string;
    exam?: { id: string; name: string };
    class: { id: string; name: string };
    subject: { id: string; name: string };
    date: string;
    startTime: string;
    endTime: string;
    _count?: { marks: number };
};

export const examApi = {
    fetchAllExams: async () => {
        try {
            return await api.get('/school/exams');
        } catch (error: any) {
            toast.error(formatApiError("Failed to fetch exams", error));
            throw error;
        }
    },
    fetchExamSchedules: async (examId: string) => {
        try {
            return await api.get(`/exams/${examId}/schedules`);
        } catch (error: any) {
            toast.error(formatApiError("Failed to fetch schedules", error));
            throw error;
        }
    },
    submitBulkMarks: async (scheduleId: string, marks: { studentId: string; marks: number; comment?: string }[]) => {
        try {
            const res = await api.post(`/exams/schedules/${scheduleId}/marks`, { marks });
            toast.success("Marks submitted successfully");
            return res;
        } catch (error: any) {
            toast.error(formatApiError("Failed to submit marks", error));
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
            toast.error(formatApiError("Failed to update exam", error));
            throw error;
        }
    },
    createSchedule: async (data: any) => {
        try {
            const res = await api.post(`/school/exams/${data.examId}/schedules`, data);
            toast.success("Schedule added successfully");
            return res;
        } catch (error: any) {
            toast.error(formatApiError("Failed to add schedule", error));
            throw error;
        }
    },
    deleteSchedule: async (scheduleId: string) => {
        try {
            const res = await api.delete(`/school/exam-schedules/${scheduleId}`);
            toast.success("Schedule removed");
            return res;
        } catch (error: any) {
            toast.error(formatApiError("Failed to delete schedule", error));
            throw error;
        }
    },

    /**
     * GET /academics/exam-schedules?classId=...
     * Returns flat list of exam schedules, optionally filtered by class.
     * Falls back to [] if endpoint isn't available yet.
     */
    listSchedules: async (classId?: string): Promise<ExamSchedule[]> => {
        try {
            const params = classId ? { classId } : {};
            return await request<ExamSchedule[]>(() =>
                api.get('/academics/exam-schedules', { params })
            );
        } catch (err: any) {
            if (err?.code === 'TEACHER_NOT_ASSIGNED') throw err;
            return [];
        }
    },

    /**
     * GET /school/exam-schedules/:scheduleId
     * Returns a single schedule for the detail page.
     */
    getSchedule: async (scheduleId: string): Promise<ExamSchedule> => {
        try {
            return await request<ExamSchedule>(() =>
                api.get(`/school/exam-schedules/${scheduleId}`)
            );
        } catch (err: any) {
            throw err;
        }
    },
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
            toast.error(formatApiError("Top-up failed", error));
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
            toast.error(formatApiError("Failed to fetch wallet history", error));
            throw error;
        }
    },
};

export const schoolApi = {
    fetchStudents: async (classId: string) => {
        try {
            return await api.get(`/school/students?classId=${classId}`);
        } catch (error: any) {
            toast.error(formatApiError("Failed to fetch students", error));
            throw error;
        }
    },
    fetchStudent: async (studentId: string) => {
        try {
            return await api.get(`/school/students/${studentId}`);
        } catch (error: any) {
            toast.error(formatApiError("Failed to fetch student", error));
            throw error;
        }
    },
    updateStudent: async (studentId: string, data: any) => {
        try {
            const res = await api.patch(`/school/students/${studentId}`, data);
            toast.success("Student updated");
            return res;
        } catch (error: any) {
            toast.error(formatApiError("Update failed", error));
            throw error;
        }
    }
};

export const academicApi = {
    fetchClasses: async () => {
        try {
            return await api.get('/academics/classes');
        } catch (error: any) {
            toast.error(formatApiError("Failed to fetch classes", error));
            throw error;
        }
    },
    fetchSubjects: async () => {
        try {
            return await api.get('/academics/subjects');
        } catch (error: any) {
            toast.error(formatApiError("Failed to fetch subjects", error));
            throw error;
        }
    },
    fetchClassSubjects: async (classId: string) => {
        try {
            return await api.get(`/academics/subjects?classId=${classId}`);
        } catch (error: any) {
            toast.error(formatApiError("Failed to fetch class subjects", error));
            throw error;
        }
    },
    fetchTeachers: async () => {
        try {
            return await api.get('/academics/teachers');
        } catch (error: any) {
            toast.error(formatApiError("Failed to fetch teachers", error));
            throw error;
        }
    },
    fetchClassTeachers: async (classId: string) => {
        try {
            return await api.get(`/academics/classes/${classId}/teachers`);
        } catch (error: any) {
            toast.error(formatApiError("Failed to fetch class teachers", error));
            throw error;
        }
    },
    fetchTeacherClasses: async (teacherId: string) => {
        try {
            return await api.get(`/academics/teachers/${teacherId}/classes`);
        } catch (error: any) {
            toast.error(formatApiError("Failed to fetch teacher classes", error));
            throw error;
        }
    }
};

export const posApi = {
    fetchProducts: async () => {
        try {
            return await _productsCache.get([], () =>
                request<unknown[] | { products: unknown[] }>(() => api.get('/pos/products'))
            );
        } catch (error: any) {
            toast.error(formatApiError("Failed to fetch products", error));
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
            toast.error(formatApiError("Failed to fetch profile", error));
            throw error;
        }
    },
    fetchStudentResults: async (studentId: string) => {
        try {
            return await api.get(`/student/${studentId}/results`);
        } catch (error: any) {
            toast.error(formatApiError("Failed to fetch results", error));
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
            toast.error(formatApiError("Failed to load fee statistics", error));
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

export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'TEACHER' | 'PARENT';

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
            return await _classesCache.get([], () =>
                request<SchoolClass[]>(() => api.get(MVP_ENDPOINTS.CLASSES))
            );
        } catch (error: unknown) {
            toast.error(formatApiError("Failed to fetch classes", error));
            throw error;
        }
    },

    /** Bust the classes cache — call after creating / editing / deleting a class. */
    bustClassesCache: () => _classesCache.bust(),

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
            toast.error(formatApiError("Failed to create class", error));
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
            toast.error(formatApiError("Failed to update class", error));
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
            toast.error(formatApiError("Failed to delete class", error));
            throw error;
        }
    },

    /**
     * GET /academic-years
     * Returns: AcademicYear[] — direct array, no envelope.
     */
    fetchAcademicYears: async (): Promise<AcademicYear[]> => {
        try {
            return await _yearsCache.get([], () =>
                request<AcademicYear[]>(() => api.get(MVP_ENDPOINTS.ACADEMIC_YEARS))
            );
        } catch (error: unknown) {
            toast.error(formatApiError("Failed to load academic years", error));
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
            toast.error(formatApiError("Failed to fetch teacher classes", error));
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
            toast.error(formatApiError("Failed to fetch students", error));
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
            toast.error(formatApiError("Failed to save attendance", error));
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

export const platformApi = {
    onboardSchool: async (data: any) => {
        try {
            const res = await request<any>(() => api.post('/platform/onboard-school', data));
            toast.success("School onboarded successfully");
            return res;
        } catch (error: any) {
            toast.error(formatApiError("Onboarding failed", error));
            throw error;
        }
    }
};

// ── Attendance read API ───────────────────────────────────────────────────────
// Separate from mvpApi.submitBulkAttendance (POST) — these are the read paths.

export type AttendanceDayRecord = { studentId: string; status: AttendanceStatus };
export type AttendanceHistoryDay = { date: string; presentCount: number; absentCount: number; lateCount: number; excusedCount: number };

export const attendanceApi = {
    /**
     * GET /attendance/:classId?date=YYYY-MM-DD
     * Returns existing attendance records for a specific date.
     * Falls back to empty array if endpoint returns 404 (date never recorded).
     */
    getForDate: async (classId: string, date: string): Promise<AttendanceDayRecord[]> => {
        try {
            return await request<AttendanceDayRecord[]>(() =>
                api.get(`/attendance/${classId}`, { params: { date } })
            );
        } catch (err: any) {
            // 404 means no records were saved for this date — treat as empty
            if (err?.code === 'NOT_FOUND' || err?.response?.status === 404) return [];
            throw err;
        }
    },

    /**
     * GET /attendance/:classId/history?days=14
     * Returns aggregate counts per day for the history panel.
     * Falls back to empty array if endpoint is not yet available.
     */
    getHistory: async (classId: string, days: number = 14): Promise<AttendanceHistoryDay[]> => {
        try {
            return await request<AttendanceHistoryDay[]>(() =>
                api.get(`/attendance/${classId}/history`, { params: { days } })
            );
        } catch {
            return []; // Non-critical — history panel simply stays empty
        }
    },
};

// ── Teacher self-service API ──────────────────────────────────────────────────
// Uses /teacher/classes (JWT identifies teacher — no teacherId URL param).

export const teacherApi = {
    /**
     * GET /teacher/classes
     * Returns the classes assigned to the currently authenticated teacher.
     */
    getMyClasses: async (): Promise<SchoolClass[]> => {
        try {
            return await request<SchoolClass[]>(() => api.get('/teacher/classes'));
        } catch (err: any) {
            if (err?.code === 'TEACHER_NOT_ASSIGNED') return [];
            toast.error(formatApiError('Failed to load your classes', err));
            throw err;
        }
    },
};

// ── Homework API ──────────────────────────────────────────────────────────────

export type HomeworkItem = {
    id: string;
    title: string;
    subject: string;
    classId: string;
    class?: { name: string };
    className?: string;
    dueDate: string;
    description: string;
    status?: 'active' | 'completed';
};

export type CreateHomeworkPayload = {
    title: string;
    subject: string;
    classId: string;
    dueDate: string;
    description: string;
};

export const homeworkApi = {
    /**
     * GET /academics/homework?classId=...
     * Returns homework list, optionally filtered by classId.
     */
    list: async (classId?: string): Promise<HomeworkItem[]> => {
        try {
            const params = classId ? { classId } : {};
            return await request<HomeworkItem[]>(() =>
                api.get('/academics/homework', { params })
            );
        } catch (err: any) {
            const isNotAssigned = err?.code === 'TEACHER_NOT_ASSIGNED';
            if (isNotAssigned) throw err; // let page handle this
            toast.error(formatApiError('Failed to load homework', err));
            throw err;
        }
    },

    /**
     * POST /academics/homework
     */
    create: async (data: CreateHomeworkPayload): Promise<HomeworkItem> => {
        try {
            const result = await request<HomeworkItem>(() =>
                api.post('/academics/homework', data)
            );
            toast.success('Assignment created!');
            return result;
        } catch (err: any) {
            throw err; // caller handles VALIDATION_ERROR display
        }
    },

    /**
     * PUT /academics/homework/:id
     */
    update: async (id: string, data: Partial<CreateHomeworkPayload>): Promise<HomeworkItem> => {
        try {
            const result = await request<HomeworkItem>(() =>
                api.put(`/academics/homework/${id}`, data)
            );
            toast.success('Assignment updated!');
            return result;
        } catch (err: any) {
            throw err;
        }
    },

    /**
     * DELETE /academics/homework/:id
     */
    remove: async (id: string): Promise<void> => {
        try {
            await request<unknown>(() => api.delete(`/academics/homework/${id}`));
            toast.success('Assignment deleted.');
        } catch (err: any) {
            toast.error(formatApiError('Delete failed', err));
            throw err;
        }
    },
};

// ── Homework Grades API ───────────────────────────────────────────────────────

export type HomeworkGradeRecord = {
    studentId: string;
    studentName: string;
    grade: number | null;
    comment?: string;
};

export type HomeworkGradesResponse = {
    homeworkId: string;
    title: string;
    dueDate: string;
    maxPoints: number;
    classId: string;
    grades: HomeworkGradeRecord[];
};

export type SubmitGradeEntry = {
    studentId: string;
    grade: number;
    comment?: string;
};

export const homeworkGradesApi = {
    /**
     * GET /academics/homework/:homeworkId/grades
     * Returns homework metadata + per-student grade records.
     */
    getForHomework: async (homeworkId: string): Promise<HomeworkGradesResponse> => {
        try {
            return await request<HomeworkGradesResponse>(() =>
                api.get(`/academics/homework/${homeworkId}/grades`)
            );
        } catch (err: any) {
            throw err; // page handles TEACHER_NOT_ASSIGNED + generic errors
        }
    },

    /**
     * POST /academics/homework/:homeworkId/grades
     * Bulk-submit grades. Backend performs upsert (idempotent on re-submit).
     */
    submit: async (homeworkId: string, grades: SubmitGradeEntry[]): Promise<{ savedCount: number }> => {
        try {
            const result = await request<{ savedCount: number }>(() =>
                api.post(`/academics/homework/${homeworkId}/grades`, { grades })
            );
            toast.success(`Saved ${result.savedCount} grade(s).`);
            return result;
        } catch (err: any) {
            toast.error(formatApiError('Failed to submit grades', err));
            throw err;
        }
    },
};

// ── Parent-scoped Types ───────────────────────────────────────────────────────

export type ChildAttendanceRecord = {
    date: string;
    status: AttendanceStatus;
};

/** One day in GET /parent/attendance/:studentId response. */
export type StudentAttendanceDay = {
    date: string;       // YYYY-MM-DD
    status: AttendanceStatus;
};

export type ChildRecord = {
    id: string;
    fullName: string;
    class?: { id: string; name: string };
    attendance?: ChildAttendanceRecord[];
};

// ── Parent API ────────────────────────────────────────────────────────────────

export const parentApi = {
    /**
     * GET /students/my-children
     * Authenticated as parent (JWT) — returns the parent's linked children with
     * basic profile data and last N attendance records.
     */
    getMyChildren: async (): Promise<ChildRecord[]> => {
        try {
            return await request<ChildRecord[]>(() => api.get('/students/my-children'));
        } catch (err: any) {
            toast.error(formatApiError('Failed to load your children', err));
            throw err;
        }
    },

    /**
     * GET /academics/homework?studentId=<id>
     * Returns HomeworkItem[] filtered for a specific student.
     * Silently returns [] on error — parent dashboard degrades gracefully.
     */
    getHomework: async (studentId: string): Promise<HomeworkItem[]> => {
        try {
            return await request<HomeworkItem[]>(() =>
                api.get('/academics/homework', { params: { studentId } })
            );
        } catch {
            return [];
        }
    },

    /**
     * GET /buses/live/:studentId
     * Returns current bus status for the student.
     * Returns null on error — bus section shows "Unavailable".
     */
    getBusLive: async (studentId: string): Promise<{ status: string; location?: string } | null> => {
        try {
            return await request<{ status: string; location?: string }>(() =>
                api.get(`/buses/live/${studentId}`)
            );
        } catch {
            return null;
        }
    },

    /**
     * GET /parent/attendance/:studentId?from=YYYY-MM-DD&to=YYYY-MM-DD
     * Returns per-day attendance records for the date range.
     * Returns [] on failure so the attendance page degrades gracefully.
     */
    getStudentAttendance: async (
        studentId: string,
        from: string,
        to: string,
    ): Promise<StudentAttendanceDay[]> => {
        try {
            return await request<StudentAttendanceDay[]>(() =>
                api.get(`/parent/attendance/${studentId}`, { params: { from, to } })
            );
        } catch (err: any) {
            toast.error(formatApiError('Failed to load attendance', err));
            throw err;
        }
    },
};

export default api;

export const communicationApi = {
  getAnnouncements: (limit = 20) => request(() => api.get('/communication/announcements', { params: { limit } })),
  sendBroadcast: (data: any) => request(() => api.post('/communication/broadcast', data))
};
