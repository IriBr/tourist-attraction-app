# Tourist Attraction App

A production-ready MVP for a mobile app that helps users discover and explore tourist attractions.

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Mobile** | React Native, TypeScript, React Query, Zustand |
| **Backend** | Node.js, Express, TypeScript, Prisma |
| **Database** | PostgreSQL |
| **Auth** | JWT (email + social login ready) |
| **Storage** | AWS S3 (configured, not implemented) |

## Project Structure

```
tourist-attraction-app/
├── mobile/                 # React Native mobile app
│   ├── src/
│   │   ├── api/           # API client and service calls
│   │   ├── components/    # UI components (from Stitch design)
│   │   ├── hooks/         # Custom React hooks (React Query)
│   │   ├── navigation/    # Navigation types and config
│   │   ├── screens/       # Screen components (from Stitch design)
│   │   ├── store/         # Zustand state management
│   │   └── utils/         # Utility functions
│   └── App.tsx
├── backend/                # Node.js API server
│   ├── prisma/            # Database schema and migrations
│   └── src/
│       ├── config/        # App configuration
│       ├── controllers/   # Request handlers
│       ├── middleware/    # Express middleware
│       ├── routes/        # API routes
│       ├── services/      # Business logic
│       └── utils/         # Utilities
├── shared/                 # Shared types and constants
│   └── src/
│       ├── types/         # TypeScript interfaces
│       ├── constants/     # App constants
│       └── validation/    # Shared validation logic
└── .github/workflows/      # CI/CD configuration
```

## Prerequisites

- Node.js >= 18
- PostgreSQL >= 14
- iOS: Xcode 15+ (for iOS simulator)
- Android: Android Studio (for Android emulator)
- Watchman (recommended for React Native)

## Quick Start

### 1. Clone and Install

```bash
git clone <repository-url>
cd tourist-attraction-app
npm install
```

### 2. Environment Setup

```bash
cp .env.example .env
# Edit .env with your configuration
```

Required environment variables:
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - At least 32 characters

### 3. Database Setup

```bash
cd backend

# Generate Prisma client
npm run db:generate

# Run migrations
npm run db:migrate

# Seed with sample data (optional)
npm run db:seed
```

### 4. Start Development

**Backend:**
```bash
npm run backend:dev
# Server runs at http://localhost:3000
# Health check: http://localhost:3000/health
```

**Mobile (in a new terminal):**
```bash
npm run mobile:start

# iOS (requires Xcode)
npm run mobile:ios

# Android (requires Android Studio)
npm run mobile:android
```

## API Endpoints

Base URL: `http://localhost:3000/api/v1`

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | Register new user |
| POST | `/auth/login` | Login |
| POST | `/auth/logout` | Logout (requires auth) |
| POST | `/auth/refresh-token` | Refresh access token |
| GET | `/auth/profile` | Get current user (requires auth) |
| PATCH | `/auth/profile` | Update profile (requires auth) |
| POST | `/auth/change-password` | Change password (requires auth) |
| POST | `/auth/forgot-password` | Request password reset |
| POST | `/auth/reset-password` | Reset password with token |

### Attractions
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/attractions/search` | Search attractions |
| GET | `/attractions/nearby` | Get nearby attractions |
| GET | `/attractions/popular` | Get popular attractions |
| GET | `/attractions/category/:category` | Get by category |
| GET | `/attractions/:id` | Get attraction details |

### Reviews
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/reviews` | Get reviews for attraction |
| GET | `/reviews/stats` | Get review statistics |
| POST | `/reviews` | Create review (requires auth) |
| PATCH | `/reviews/:id` | Update review (requires auth) |
| DELETE | `/reviews/:id` | Delete review (requires auth) |
| POST | `/reviews/:id/helpful` | Toggle helpful (requires auth) |

### Favorites
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/favorites` | Get user favorites (requires auth) |
| POST | `/favorites` | Add favorite (requires auth) |
| DELETE | `/favorites/:attractionId` | Remove favorite (requires auth) |
| GET | `/favorites/check/:attractionId` | Check if favorited (requires auth) |

## Architecture Decisions

### Backend
- **Express** over Fastify for ecosystem maturity
- **Prisma** for type-safe database access
- **Zod** for runtime validation
- **Service layer pattern** for business logic separation
- **JWT with refresh tokens** for stateless auth

### Mobile
- **React Query** for server state management (caching, refetching)
- **Zustand** for client state (auth, location)
- **Axios** for HTTP with interceptors for token refresh
- **React Navigation** with typed routes

### Shared Package
- Types shared between frontend and backend
- Validation logic reusable on both ends
- Constants for consistent configuration

## Default Assumptions Made

Since UI/UX is designed in Stitch (not implemented here):

1. **Features included in MVP:**
   - User registration/login (email)
   - Browse/search attractions
   - View attraction details
   - Save favorites
   - Leave reviews with ratings
   - Location-based nearby search

2. **Not included in MVP:**
   - Social login (Google/Apple) - endpoints ready, integration pending
   - Image upload - S3 configured, implementation pending
   - Push notifications
   - Booking/ticketing
   - Offline mode

3. **Database:**
   - PostgreSQL (production-ready)
   - Prisma for migrations and type-safe queries

4. **Security:**
   - Helmet for HTTP headers
   - Rate limiting configured
   - JWT with refresh token rotation
   - Password hashing with bcrypt (12 rounds)

## Scripts

### Root
```bash
npm run backend:dev    # Start backend in dev mode
npm run backend:build  # Build backend
npm run mobile:start   # Start Metro bundler
npm run mobile:ios     # Run on iOS simulator
npm run mobile:android # Run on Android emulator
npm run lint           # Lint all packages
npm run format         # Format all packages
npm test               # Run all tests
```

### Backend
```bash
cd backend
npm run dev           # Development server
npm run build         # Production build
npm run db:migrate    # Run migrations
npm run db:generate   # Generate Prisma client
npm run db:seed       # Seed database
```

## Demo Credentials

After running `npm run db:seed`:
- Email: `demo@example.com`
- Password: `Demo@123`

## License

Private - All rights reserved
