# Attendance Feature

I have implemented the **Attendance Taking** feature.

## 1. New Page
*   **Location**: `src/app/dashboard/classes/[classId]/attendance/page.tsx`
*   **Features**:
    *   Fetches student list for the class.
    *   Allows marking status: Present / Late / Absent.
    *   Floating Save button for mobile usage.

## 2. Integration
*   **Teacher Dashboard**: The "Take Attendance" button now links to this page.

## Testing
1.  Ensure you are in 'teacher' mode (in `src/app/dashboard/page.tsx`).
2.  Click "Take Attendance" on any class card.
3.  Mark students and click Save.
