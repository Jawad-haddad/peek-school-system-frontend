# Login Page Implementation

I have fully implemented the production-ready **Login Page**.

## Features
*   **Location**: `src/app/page.tsx` (Root URL).
*   **Design**: Modern, centered card layout, mobile-optimized inputs.
*   **Logic**:
    *   Connects to `http://localhost:3000/api/auth/login`.
    *   Stores `authToken` and `userRole` in LocalStorage.
    *   Redirects to `/dashboard` on success.
    *   Handles errors and loading states gracefully.

## How to Test
1.  Navigate to the root URL `/`.
2.  Enter credentials.
3.  Click "Sign In".
