# Class Scheduling Backend API

A robust backend API for a class scheduling and booking system built with Express.js, Prisma, and PostgreSQL.

## Features

- 🔐 **Authentication & Authorization**: JWT-based authentication with role-based access control (Student, Teacher, Admin)
- 📚 **Class Management**: CRUD operations for classes with scheduling, capacity, and pricing
- 📅 **Booking System**: Students can book classes with automatic expiration handling
- 💳 **Payment Processing**: Payment tracking and status management
- 👥 **User Management**: Complete user CRUD with role-based permissions
- 🛡️ **Error Handling**: Comprehensive error handling middleware
- 🔒 **Security**: Password hashing with bcrypt, JWT tokens, and input validation

## Tech Stack

- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **ORM**: Prisma
- **Database**: PostgreSQL
- **Authentication**: JWT (jsonwebtoken)
- **Password Hashing**: bcryptjs

## Prerequisites

- Node.js (v18 or higher)
- PostgreSQL (v14 or higher)
- npm or yarn

## Installation

1. **Navigate to the backend directory:**
   ```bash
   cd Back-end
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   Create a `.env` file in the `Back-end` directory:
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/class_scheduling?schema=public"
   JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
   JWT_EXPIRE="7d"
   PORT=3001
   NODE_ENV=development
   CORS_ORIGIN="http://localhost:3000"
   ```

4. **Set up the database:**
   ```bash
   # Generate Prisma Client
   npm run prisma:generate

   # Run migrations
   npm run prisma:migrate

   # Seed the database (optional)
   npm run prisma:seed
   ```

## Running the Server

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm run build
npm start
```

The server will start on `http://localhost:3001` (or the port specified in your `.env` file).

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (requires authentication)

### Users

- `GET /api/users` - Get all users (Admin only)
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user (Admin only)

### Classes

- `GET /api/classes` - Get all classes (with optional filters: `date`, `teacherId`, `status`)
- `GET /api/classes/:id` - Get class by ID
- `POST /api/classes` - Create a new class (Teacher only)
- `PUT /api/classes/:id` - Update class (Teacher/Admin only)
- `DELETE /api/classes/:id` - Delete class (Teacher/Admin only)

### Bookings

- `GET /api/bookings` - Get all bookings (filtered by user role)
- `GET /api/bookings/:id` - Get booking by ID
- `POST /api/bookings` - Create a new booking (Student only)
- `PUT /api/bookings/:id` - Update booking status
- `DELETE /api/bookings/:id` - Cancel booking

### Payments

- `POST /api/payments` - Create a payment for a booking
- `GET /api/payments` - Get all payments (filtered by user role)
- `GET /api/payments/:id` - Get payment by ID

## Database Schema

### User
- `id` (String, CUID)
- `email` (String, unique)
- `password` (String, hashed)
- `name` (String)
- `phone` (String, optional)
- `role` (Enum: STUDENT, TEACHER, ADMIN)
- `createdAt`, `updatedAt`

### Class
- `id` (String, CUID)
- `title` (String)
- `description` (String, optional)
- `subject` (String, optional)
- `startTime` (String, format: "HH:mm")
- `endTime` (String, format: "HH:mm")
- `date` (DateTime)
- `room` (String, optional)
- `location` (String, optional)
- `capacity` (Int, default: 20)
- `price` (Float, default: 0.0)
- `status` (Enum: SCHEDULED, ONGOING, COMPLETED, CANCELLED)
- `teacherId` (String, foreign key)
- `createdAt`, `updatedAt`

### Booking
- `id` (String, CUID)
- `status` (Enum: PENDING, CONFIRMED, CANCELLED, COMPLETED)
- `bookingDate` (DateTime)
- `expiresAt` (DateTime, optional)
- `studentId` (String, foreign key)
- `classId` (String, foreign key)
- `createdAt`, `updatedAt`

### Payment
- `id` (String, CUID)
- `amount` (Float)
- `status` (Enum: PENDING, COMPLETED, FAILED, REFUNDED)
- `paymentMethod` (String, optional)
- `transactionId` (String, optional)
- `paidAt` (DateTime, optional)
- `userId` (String, foreign key)
- `bookingId` (String, foreign key, unique)
- `createdAt`, `updatedAt`

## Authentication

All protected routes require a JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

## Seed Data

The seed script creates:
- 1 Admin user (admin@example.com / admin123)
- 2 Teacher users (teacher1@example.com, teacher2@example.com / teacher123)
- 2 Student users (student1@example.com, student2@example.com / student123)
- Sample classes and bookings

## Development Commands

```bash
# Development
npm run dev              # Start dev server with hot reload

# Database
npm run prisma:generate  # Generate Prisma Client
npm run prisma:migrate   # Run database migrations
npm run prisma:studio    # Open Prisma Studio (database GUI)
npm run prisma:seed      # Seed the database
npm run db:push          # Push schema changes to database
npm run db:reset         # Reset database and run migrations

# Production
npm run build            # Build TypeScript to JavaScript
npm start                # Start production server
```

## Error Handling

The API uses a centralized error handling middleware. All errors are returned in the following format:

```json
{
  "success": false,
  "message": "Error message"
}
```

## Security Features

- Password hashing with bcrypt (10 rounds)
- JWT token-based authentication
- Role-based access control (RBAC)
- Input validation
- CORS configuration
- SQL injection protection (via Prisma)

## Project Structure

```
Back-end/
├── prisma/
│   ├── schema.prisma    # Prisma schema definition
│   └── seed.ts          # Database seed script
├── src/
│   ├── controllers/     # Route controllers
│   │   ├── authController.ts
│   │   ├── classController.ts
│   │   ├── bookingController.ts
│   │   ├── paymentController.ts
│   │   └── userController.ts
│   ├── middleware/      # Express middleware
│   │   ├── auth.ts
│   │   └── errorHandler.ts
│   ├── routes/          # API routes
│   │   ├── auth.ts
│   │   ├── classes.ts
│   │   ├── bookings.ts
│   │   ├── payments.ts
│   │   └── users.ts
│   ├── utils/           # Utility functions
│   │   ├── jwt.ts
│   │   └── prisma.ts
│   └── server.ts        # Express app entry point
├── .env                 # Environment variables (not in git)
├── .gitignore
├── package.json
├── tsconfig.json
└── README.md
```

## License

ISC

