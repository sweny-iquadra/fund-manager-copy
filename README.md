# Investment Contest Platform

A competitive fantasy finance application where users compete with $1,000,000 virtual portfolios to earn the highest returns across different investment modes and contest types.

## Features

- **Contest Types**: Classic (app-wide competitions) and Eliminator (small group-based with eliminations)
- **Investment Modes**: S&P 500, Tech Stocks, Cryptocurrency, Penny Stocks, Bonds, and Options
- **Real-time Portfolio Tracking**: Live performance monitoring and leaderboards
- **User Authentication**: Secure login via Replit Auth (OAuth)
- **Prize System**: Scaled prize pools with percentage-based payouts

## Tech Stack

- **Frontend**: React 18 + TypeScript, Tailwind CSS, Radix UI
- **Backend**: Express.js + TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Replit Auth (OpenID Connect)
- **Build Tool**: Vite

## Prerequisites

- Node.js 18+ and npm
- PostgreSQL database
- Replit account for authentication (or modify auth system)

## Local Development Setup

### 1. Clone and Install Dependencies

```bash
git clone <your-repo-url>
cd investment-contest-platform
npm install
```

### 2. Database Setup

Create a PostgreSQL database and note the connection details.

### 3. Environment Variables

Create a `.env` file in the root directory:

```env
# Database Configuration
DATABASE_URL="postgresql://username:password@localhost:5432/investment_contest_db"
PGHOST="localhost"
PGPORT="5432"
PGUSER="your_username"
PGPASSWORD="your_password"
PGDATABASE="investment_contest_db"

# Authentication
SESSION_SECRET="your-super-secret-session-key-here"

# Server Configuration
PORT=5000
NODE_ENV=development
```

### 4. Database Migration

Push the database schema:

```bash
npm run db:push
```

### 5. Start Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:5000`

## Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run db:push` - Push schema changes to database
- `npm run db:studio` - Open Drizzle Studio for database management

## Project Structure

```
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── hooks/         # Custom React hooks
│   │   ├── pages/         # Page components
│   │   └── lib/           # Utility functions
├── server/                # Express backend
│   ├── services/          # Business logic
│   ├── routes.ts          # API routes
│   ├── storage.ts         # Data access layer
│   └── index.ts           # Server entry point
├── shared/                # Shared TypeScript definitions
│   └── schema.ts          # Database schema
└── README.md
```

## Authentication Setup

This project uses Replit Auth for authentication. For local development, you have two options:

### Option A: Use Replit Auth Locally

1. Create a Replit account and get your REPL_ID
2. Set up OAuth redirect URLs in your Replit settings
3. Use the provided environment variables

### Option B: Replace with Local Auth (Recommended for Local Dev)

Replace the Replit Auth system with a simple local authentication:

1. Modify `server/routes.ts` to use local auth
2. Create simple login/logout endpoints
3. Remove OpenID Connect dependencies

## Database Schema

The application uses the following main tables:

- `users` - User profiles and authentication
- `contests` - Contest definitions and settings
- `contest_participants` - User participation in contests
- `portfolio_allocations` - User investment allocations
- `leaderboards` - Performance rankings
- `winnings` - Prize distribution records

## API Endpoints

### Authentication

- `GET /api/auth/user` - Get current user
- `GET /api/login` - Initiate login
- `GET /api/logout` - Logout

### Contests

- `GET /api/contests` - List all contests
- `POST /api/contests` - Create new contest
- `GET /api/contests/:id` - Get contest details
- `POST /api/contests/:id/join` - Join contest

### Portfolio

- `GET /api/portfolio/:contestId` - Get user's portfolio
- `POST /api/portfolio/:contestId/allocate` - Update allocations

### Leaderboards

- `GET /api/leaderboard/:contestId` - Get contest leaderboard

## Development Notes

### Database Migrations

- Use `npm run db:push` to apply schema changes
- Never manually edit migration files
- All schema changes go in `shared/schema.ts`

### Adding New Features

1. Update database schema in `shared/schema.ts`
2. Add API routes in `server/routes.ts`
3. Create frontend components in `client/src/`
4. Update this README if needed

### Styling

- Uses Tailwind CSS with custom design tokens
- Dark mode support via CSS variables
- Responsive design with mobile-first approach

## Production Deployment

### Environment Setup

1. Set `NODE_ENV=production`
2. Configure production database
3. Set secure session secret
4. Configure proper CORS settings

### Build Process

```bash
npm run build
```

### Security Considerations

- Use HTTPS in production
- Secure session configuration
- Validate all user inputs
- Rate limiting on API endpoints

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make changes following the existing code style
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details
