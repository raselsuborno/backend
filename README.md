# ChorEscape Backend

Backend API for the ChorEscape application built with Express.js, Prisma, and Supabase.

## Project Structure

```
backend/
├─ src/
│  ├─ app.js            # Express app configuration
│  ├─ server.js         # Entry point
│  ├─ routes/           # API route definitions
│  ├─ controllers/      # Request handlers
│  ├─ middleware/       # Custom middleware
│  ├─ lib/              # External service clients (Supabase, Prisma)
│  └─ utils/            # Utility functions
├─ prisma/
│  └─ schema.prisma     # Database schema
└─ package.json
```

## Setup

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
   - Copy `.env` and fill in your configuration values
   - Add your Supabase credentials
   - Add your database connection string

3. Set up Prisma:
```bash
npm run prisma:generate
npm run prisma:migrate
```

4. Start the development server:
```bash
npm run dev
```

## API Routes

- `/api/auth` - Authentication routes (register, login, logout)
- `/api/bookings` - Booking management routes
- `/api/services` - Service listing routes
- `/api/admin` - Admin-only routes

## Technologies

- **Express.js** - Web framework
- **Prisma** - ORM for database access
- **Supabase** - Authentication and backend services
- **Node.js** - Runtime environment



