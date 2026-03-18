# Role and Page Access Controls

This document maps the roles used in the frontend to the pages they can access, and identifies gaps where pages are visually hidden but still technically accessible via URL manipulation.

## Roles Used in Frontend
The frontend uses the following roles (stored in `localStorage.getItem('role')` and typed in `AuthUser`):
- `ADMIN`
- `TEACHER`
- `PARENT`
- *(STUDENT role exists in backend but is not currently mapped in the frontend Sidebar layout)*

## Sidebar Mapping (Visual Access)
The `Sidebar.tsx` component restricts visble menu links based on these roles:

**All Roles (`ADMIN`, `TEACHER`, `PARENT`)**
- `/dashboard` (Dashboard Home)
- `/dashboard/chat` (Chat)

**`ADMIN` Only**
- `/dashboard/classes` (Classes)
- `/dashboard/teachers` (Teachers)
- `/dashboard/subjects` (Subjects)
- `/dashboard/timetable` (Timetable)
- `/dashboard/exams` (Exams)
- `/dashboard/reports` (Reports)
- `/dashboard/broadcast` (Broadcast)
- `/dashboard/settings` (Settings)

**`TEACHER` Only**
- `/dashboard/schedule` (My Schedule)
- `/dashboard/attendance` (Attendance)
- `/dashboard/exams/gradebook` (Gradebook)

**`PARENT` Only**
- `/dashboard/results` (Results)
- `/dashboard/shop` (Shop)

**`TEACHER` and `PARENT`**
- `/dashboard/homework` (Homework)

---

## 🚨 Vulnerability: Missing Route Guards

While the Sidebar hides links, **many pages do not verify the user's role on load**. This means a Parent can type `/dashboard/teachers` into the URL bar and view the page, or a Teacher can access `/dashboard/settings`.

### Top 10 Pages That Need Guards
These pages are restricted in the Sidebar but currently lack frontend route guards (they do not check `role === 'ADMIN'` etc. inside the component):

1. **`/dashboard/teachers/page.tsx`** (Should be ADMIN only)
2. **`/dashboard/subjects/page.tsx`** (Should be ADMIN only)
3. **`/dashboard/timetable/page.tsx`** (Should be ADMIN only)
4. **`/dashboard/timetable/[classId]/page.tsx`** (Should be ADMIN only)
5. **`/dashboard/exams/page.tsx`** (Should be ADMIN only)
6. **`/dashboard/exams/[examId]/page.tsx`** (Should be ADMIN only)
7. **`/dashboard/reports/page.tsx`** (Should be ADMIN only)
8. **`/dashboard/broadcast/page.tsx`** (Should be ADMIN only)
9. **`/dashboard/settings/page.tsx`** (Should be ADMIN only)
10. **`/dashboard/pos/page.tsx`** (Currently not in Sidebar at all, but accessible to anyone)

### Other Pages Missing Guards
- `/dashboard/bus/page.tsx` (Not in Sidebar)
- `/dashboard/classes/[classId]/attendance/page.tsx` (Should be TEACHER or ADMIN)
- `/dashboard/exams/[examId]/grades/[scheduleId]/page.tsx` (Should be TEACHER)

### Pages That ARE Guarded Correctly
These pages currently check `getSafeUser()`, `isTeacher`, or explicit `role ===` logic to prevent unauthorized access:
- `/dashboard/page.tsx` (Checks all roles to render specific sub-dashboard)
- `/dashboard/attendance/page.tsx` 
- `/dashboard/chat/page.tsx`
- `/dashboard/classes/page.tsx`
- `/dashboard/homework/page.tsx`
- `/dashboard/results/page.tsx`
- `/dashboard/schedule/page.tsx`
- `/dashboard/shop/page.tsx`
