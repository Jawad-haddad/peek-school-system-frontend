# Teacher Dashboard & NFC Assignment

I have implemented the **Teacher Dashboard** and the **NFC Assignment UI**.

## 1. Teacher Dashboard
*   **Location**: `src/components/dashboard/TeacherDashboard.tsx`
*   **Features**: Displays a list of assigned classes with a "Take Attendance" action.
*   **Access**: Open `src/app/dashboard/page.tsx` and ensure `useState` is set to `'teacher'`.

## 2. NFC Assignment
*   **Location**: `src/components/EditStudentForm.tsx`
*   **Features**:
    *   **Field**: `nfc_card_id` input.
    *   **Simulation**: A "Scan Card" button that generates a random Hex ID after 1 second.
*   **Access**: Go to `Students` -> Click `Edit` on any student.

## Verification
1.  **Teacher View**: Check that `/dashboard` shows "My Classes".
2.  **NFC Scan**: Open an edit form, click "Scan Card", and verify a code appears.
