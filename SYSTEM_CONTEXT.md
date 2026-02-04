# PEEK School Management System – Frontend Context

## System Overview
This is the frontend client for the PEEK School Management System.

The frontend:
- Does NOT contain business logic
- Does NOT define data models
- STRICTLY consumes backend APIs

---
# PEEK School Management System – Frontend Context

## System Overview
This is the frontend client for the PEEK School Management System.

The frontend MUST work correctly on:
- Mobile phones
- Tablets
- Desktop browsers

A single responsive codebase is required.
Mobile users are first-class citizens.

---

## Supported User Roles
- Parent
- Teacher
- School Admin
- Finance
- Canteen Staff
- Bus Supervisor

Each role has:
- A dedicated dashboard
- Permission-based navigation
- UI that adapts to screen size

---

## Core Frontend Requirements

### Responsive & Mobile Support (CRITICAL)
- Mobile-first design approach
- Responsive layouts using breakpoints
- Touch-friendly buttons and inputs
- No hover-only interactions
- Sidebars must collapse on small screens
- Tables must adapt (cards / horizontal scroll)

---

## Authentication
- JWT-based authentication
- Secure token handling
- Graceful session expiration handling

---

## Technical Stack
- Next.js
- TypeScript
- Responsive UI system (CSS Grid / Flexbox)
- API communication via fetch or Axios

---

## Architecture Rules (VERY IMPORTANT)
- NEVER invent backend APIs
- ONLY consume documented backend endpoints
- UI must reflect backend permissions
- Handle loading, error, and empty states properly
- Design components to be reusable across screen sizes

---

## Deployment
- Frontend deployed on Vercel


You are the **Frontend Engineer**.
Your job is to build a clean, reliable, and secure UI that strictly follows backend contracts.
