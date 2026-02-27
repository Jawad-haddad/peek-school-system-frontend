export type Role = 'ADMIN' | 'TEACHER' | 'PARENT' | 'STUDENT' | 'BUS_SUPERVISOR' | 'FINANCE' | string | null;

export const permissions = {
    canCreateExam: (role: Role) => role === 'ADMIN',
    canEditExam: (role: Role) => role === 'ADMIN',
    canGrade: (role: Role) => role === 'ADMIN' || role === 'TEACHER',
    canSubmitAttendance: (role: Role) => role === 'ADMIN' || role === 'TEACHER',
    canManageStudents: (role: Role) => role === 'ADMIN',
    canManageTeachers: (role: Role) => role === 'ADMIN',
    canManageBus: (role: Role) => role === 'ADMIN' || role === 'BUS_SUPERVISOR',
    canBroadcast: (role: Role) => role === 'ADMIN',
    canViewSensitiveStats: (role: Role) => role === 'ADMIN' || role === 'FINANCE',
};
