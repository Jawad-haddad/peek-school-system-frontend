# Gradebook & Report Card Features

I have implemented the **Teacher Gradebook** and **Parent Report Card**.

## 1. Teacher Gradebook
*   **Location**: `src/app/dashboard/exams/gradebook/page.tsx`
*   **Features**:
    *   Select Exam & Class.
    *   Enter Marks & Comments.
    *   Auto-calculates grades (visual logic ready).
*   **Access**: Navigate to `/dashboard/exams/gradebook`.

## 2. Parent Report Card
*   **Location**: `src/components/dashboard/StudentReportCard.tsx`
*   **Features**:
    *   Displays subject marks.
    *   Color-coded letter grades (A-F).
*   **Integration**: Added to bottom of `ParentDashboard`.
*   **Access**: Switch dashboard to 'parent' mode.

## Testing
1.  **Teacher**: Go to gradebook, select options, try entering data.
2.  **Parent**: Check dashboard for the new "Recent Grades" card.
