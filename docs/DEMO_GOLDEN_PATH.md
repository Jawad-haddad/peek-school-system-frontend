# Demo Golden Path Checklist

This document outlines the end-to-end "Golden Path" flow for the Peek School System. It ensures that any demonstration showcases the core UI capabilities mapping perfectly to the backend features, guaranteeing a smooth presentation without hitting dead ends or crashes.

## 1. Onboarding a School
- **Action**: Navigate to `/super-admin/onboard-school`. *(Requires `SUPER_ADMIN` role).*
- **Steps**: Fill out the School Name, Initial Administrator details, starting Academic Year, and at least one starting Class. Click **"Launch School Tenant"**.
- **Expected Success**: The form is replaced by a green success dashboard card displaying the newly generated `School ID` and the Administrator's email address.
- **Expected Errors**: Missing fields or Zod validation errors projected from the backend will neatly display in a red Toast banner at the top-right corner.

## 2. Admin Login
- **Action**: Navigate to the Login route (`/auth/login` or `/`).
- **Steps**: Enter the Administrator's email and password created during Stage 1.
- **Expected Success**: Redirection to `/dashboard`. The main admin overview panels (Total Students, Teachers) load dynamically.
- **Expected Errors**: Incorrect credentials trigger a clean authentication rejection Toast.

## 3. Creating Classes & Students
- **Action**: Navigate to **Classes** (`/dashboard/classes`).
- **Steps**:
  1. Observe the existing classes or click **"+ New Class"** to add another.
  2. Click into a specific Class card (opening `/dashboard/classes/[classId]`).
  3. Click **"+ Add New Student"** to enroll a new child.
- **Expected Success**: The UI data tables will automatically refresh, appending the newly created classes and students.
- **Expected Errors**: If the backend drops the request, a prominent red `⚠️ Error` ribbon permanently displays instead of causing a white-screen crash.

## 4. Taking Attendance
- **Action**: From the Class Details page (`/dashboard/classes/[classId]`), click to open its **Attendance** portal.
- **Steps**:
  1. Pick the applicable `Date` at the top.
  2. Toggle statuses (Present, Absent, Late, Excused) for the loaded students.
  3. Click **"Save Records"**.
- **Expected Success**: A success Toast appears indicating the number of saved records, and the user safely returns to the main dashboard.
- **Expected Errors**: Submission failures trigger an inline horizontal red alert ribbon directly above the student array. 

## 5. Reports & Fee Statistics
- **Action**: Navigate to **Reports** (`/dashboard/reports`).
- **Steps**: Passively review the executive reporting boards.
- **Expected Success**: Statistics grids load, translating real DB aggregations into Collection Progress bars, outstanding summaries, and user ratios.
- **Expected Errors**:
  - *No Data*: The charts gracefully degrade into a soft gray "No financial data available" container.
  - *API Outage*: An explicit Retry Error container replaces the entire grid, rather than throwing uncaught promise rejections.

## 6. Point of Sale (POS) Order
- **Action**: Navigate to **Canteen POS** (`/dashboard/pos`).
- **Steps**:
  1. Click items from the product grid to populate the Cart panel.
  2. Increment/Decrement quantities.
  3. Input a registered `Student ID` or generic identifier.
  4. Click **"Process Payment"**.
- **Expected Success**: Confetti / Success Toast confirming the transaction; cart unmounts and zeroes out automatically.
- **Expected Errors**:
  - *Empty Inventory*: If the canteen hasn't been stocked, a stylized 🛒 "No Items Available" state prominently occupies the screen.
  - *Declined Payment*: Meaningful strings (`"Insufficient wallet balance"`, `"Student not found"`) appear via exact Toast mapping from the backend constraint.
