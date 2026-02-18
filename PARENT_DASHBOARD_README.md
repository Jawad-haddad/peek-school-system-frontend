# Parent Dashboard & Role Switching

I have implemented the **Parent Dashboard** and a **Role-Based Switching** mechanism.

## Files Created/Modified

1.  **`src/components/dashboard/ParentDashboard.tsx`**:
    *   Responsive Card for Bus Status (Yellow/Green).
    *   Wallet Quick View with Low Balance Warning (< 5 JOD).
    *   Uses mock data (`mockFetchBusStatus`, `mockFetchWallet`) for demonstration.

2.  **`src/app/dashboard/page.tsx`**:
    *   Now contains a `useMockAuth` hook.
    *   **Default Role**: Set to `'parent'` so you can immediately see the new mobile dashboard.
    *   **Logic**: If `role === 'parent'`, it renders `ParentDashboard`. Otherwise, it renders the existing Admin Stats.

## How to Test

1.  Run the server: `npm run dev`.
2.  Navigate to `/dashboard`.
3.  You should see the **Parent View** (Bus Card + Wallet).
4.  To see the **Admin View**, open `src/app/dashboard/page.tsx` and change `useState('parent')` to `useState('admin')`.
