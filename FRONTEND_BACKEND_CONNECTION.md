# Frontend-Backend Connection Guide

## Overview

The frontend (Next.js) is now fully connected to the backend (Express.js + Prisma + PostgreSQL) API.

## What Was Implemented

### 1. API Integration Layer (`lib/api.ts`)
- Centralized API configuration
- TypeScript interfaces for all data models
- API functions for:
  - Authentication (login, register, getMe)
  - Classes (CRUD operations)
  - Bookings (create, read, update, cancel)
  - Payments (create, read)
- Automatic token management (stored in localStorage)
- Error handling

### 2. Authentication System (`lib/auth-context.tsx`)
- React Context for global auth state
- Automatic token validation on app load
- Login/Register/Logout functions
- Protected route handling
- User data management

### 3. Updated Components

#### Login Page (`app/page.tsx`)
- Now uses real backend API for authentication
- Error handling and display
- Automatic redirect based on user role
- Updated demo credentials display

#### Student Dashboard (`app/dashboard/student/page.tsx`)
- Fetches real classes from backend
- Displays actual class data
- Loading states
- Authentication protection

#### Teacher Dashboard (`app/dashboard/teacher/page.tsx`)
- Fetches teacher's classes from backend
- Real-time statistics (enrolled, capacity, occupancy)
- Loading states
- Authentication protection

#### Header Component (`components/navigation/header.tsx`)
- Integrated with auth context for logout
- Proper session management

### 4. Environment Configuration
- Created `env.example` template
- API URL configuration via `NEXT_PUBLIC_API_URL`

## Setup Instructions

### 1. Create Environment File

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

### 2. Start Backend Server

```bash
cd Back-end
npm install
npm run dev
```

The backend should run on `http://localhost:3001`

### 3. Start Frontend Server

```bash
# In the root directory
npm install
npm run dev
```

The frontend should run on `http://localhost:3000`

## API Endpoints Used

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/me` - Get current user

### Classes
- `GET /api/classes` - Get all classes (with optional filters)
- `GET /api/classes/:id` - Get class by ID
- `POST /api/classes` - Create class (Teacher only)
- `PUT /api/classes/:id` - Update class
- `DELETE /api/classes/:id` - Delete class

### Bookings
- `GET /api/bookings` - Get all bookings
- `POST /api/bookings` - Create booking
- `PUT /api/bookings/:id` - Update booking
- `DELETE /api/bookings/:id` - Cancel booking

### Payments
- `POST /api/payments` - Create payment
- `GET /api/payments` - Get all payments

## Authentication Flow

1. User enters credentials on login page
2. Frontend sends POST request to `/api/auth/login`
3. Backend validates credentials and returns JWT token
4. Frontend stores token in localStorage
5. Token is included in all subsequent API requests via Authorization header
6. On app load, frontend validates token by calling `/api/auth/me`
7. If token is invalid, user is redirected to login

## Demo Credentials

Use these credentials to test the application:

- **Admin**: `admin@example.com` / `admin123`
- **Teacher**: `teacher1@example.com` / `teacher123`
- **Student**: `student1@example.com` / `student123`

## Data Flow

### Student Dashboard
1. User logs in as student
2. Dashboard fetches all available classes via `GET /api/classes`
3. Classes are displayed in weekly calendar view
4. Student can click on a class to view details
5. Student can book a class (creates booking via `POST /api/bookings`)

### Teacher Dashboard
1. User logs in as teacher
2. Dashboard fetches teacher's classes via `GET /api/classes?teacherId={id}`
3. Statistics are calculated from class data
4. Classes displayed in weekly calendar view

## Error Handling

- API errors are caught and displayed to users
- Network errors show user-friendly messages
- Invalid tokens automatically log out users
- Loading states prevent UI flickering

## Security Features

- JWT tokens stored securely in localStorage
- Tokens automatically included in API requests
- Protected routes redirect unauthenticated users
- Role-based access control enforced by backend

## Next Steps

To extend the integration:

1. **Add more API endpoints** - Extend `lib/api.ts` with new functions
2. **Update components** - Replace mock data with API calls
3. **Add error boundaries** - Better error handling UI
4. **Add loading states** - Skeleton loaders for better UX
5. **Add caching** - Use React Query or SWR for data caching
6. **Add real-time updates** - WebSocket integration for live updates

## Troubleshooting

### CORS Errors
- Ensure backend CORS is configured to allow `http://localhost:3000`
- Check `CORS_ORIGIN` in backend `.env` file

### Authentication Issues
- Check if token is being stored in localStorage
- Verify JWT_SECRET matches between frontend and backend
- Check browser console for API errors

### Data Not Loading
- Verify backend server is running
- Check API URL in `.env.local`
- Check browser network tab for failed requests
- Verify database is seeded with sample data

## Files Modified/Created

### Created
- `lib/api.ts` - API utilities
- `lib/auth-context.tsx` - Authentication context
- `env.example` - Environment template
- `FRONTEND_BACKEND_CONNECTION.md` - This file

### Modified
- `app/layout.tsx` - Added AuthProvider
- `app/page.tsx` - Integrated with backend API
- `app/dashboard/student/page.tsx` - Fetches real data
- `app/dashboard/teacher/page.tsx` - Fetches real data
- `components/navigation/header.tsx` - Integrated logout

