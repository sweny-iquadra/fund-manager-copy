# Local Development Setup Guide

## Quick Start

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Environment Setup**
   - Copy `.env.example` to `.env`
   - Update database credentials
   - Generate a secure session secret

3. **Database Setup**
   ```bash
   npm run db:push
   ```

4. **Start Development**
   ```bash
   npm run dev
   ```

## Database Configuration

### PostgreSQL Setup
1. Install PostgreSQL locally
2. Create a new database:
   ```sql
   CREATE DATABASE investment_contest_db;
   ```

3. Update your `.env` file with connection details:
   ```env
   DATABASE_URL="postgresql://username:password@localhost:5432/investment_contest_db"
   ```

### Alternative: Docker PostgreSQL
```bash
docker run --name postgres-contest \
  -e POSTGRES_DB=investment_contest_db \
  -e POSTGRES_USER=contest_user \
  -e POSTGRES_PASSWORD=contest_pass \
  -p 5432:5432 \
  -d postgres:15
```

## Authentication Options

### Option 1: Replit Auth (Recommended for Replit)
- Keep existing authentication system
- Set up OAuth redirects in Replit settings
- Use your Replit REPL_ID

### Option 2: Local Development Auth
For purely local development, you can simplify authentication:

1. **Create a simple auth middleware** (add to `server/simple-auth.ts`):
```typescript
import { Request, Response, NextFunction } from 'express';

export const mockAuth = (req: Request, res: Response, next: NextFunction) => {
  // Mock user for development
  req.user = {
    claims: {
      sub: 'dev-user-123',
      email: 'dev@example.com',
      first_name: 'Dev',
      last_name: 'User',
      profile_image_url: 'https://via.placeholder.com/150'
    }
  };
  next();
};

export const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
  if (process.env.NODE_ENV === 'development') {
    return mockAuth(req, res, next);
  }
  // Use real auth in production
  next();
};
```

2. **Update routes to use simple auth** (modify `server/routes.ts`):
```typescript
import { isAuthenticated } from './simple-auth';
```

## Environment Variables Explained

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | Full PostgreSQL connection string | `postgresql://user:pass@localhost:5432/db` |
| `SESSION_SECRET` | Secret key for session encryption | `your-super-secret-key-here` |
| `PORT` | Server port | `5000` |
| `NODE_ENV` | Environment mode | `development` |

## Development Workflow

### Making Changes
1. Frontend changes: Edit files in `client/src/`
2. Backend changes: Edit files in `server/`
3. Database changes: Modify `shared/schema.ts` then run `npm run db:push`

### Database Management
- `npm run db:push` - Apply schema changes
- `npm run db:studio` - Open visual database editor (if available)

### Building for Production
```bash
npm run build
npm run start
```

## Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Check PostgreSQL is running
   - Verify connection string in `.env`
   - Ensure database exists

2. **Authentication Errors**
   - Verify session secret is set
   - Check Replit OAuth configuration
   - Try using local auth for development

3. **Port Already in Use**
   - Change PORT in `.env`
   - Kill existing processes: `lsof -ti:5000 | xargs kill`

4. **Module Resolution Errors**
   - Clear node_modules: `rm -rf node_modules package-lock.json`
   - Reinstall: `npm install`

### Performance Tips
- Use `npm run dev` for development (includes hot reload)
- Monitor database queries in development
- Check browser console for frontend errors

## Project Structure Deep Dive

```
├── client/src/
│   ├── components/ui/        # Reusable UI components
│   ├── components/forms/     # Form components
│   ├── components/charts/    # Chart components
│   ├── hooks/               # Custom React hooks
│   ├── lib/                 # Utility functions
│   └── pages/               # Page components
├── server/
│   ├── services/            # Business logic
│   ├── db.ts               # Database connection
│   ├── routes.ts           # API routes
│   ├── storage.ts          # Data access layer
│   └── replitAuth.ts       # Authentication
├── shared/
│   └── schema.ts           # Database schema + types
```

## Next Steps

1. **Financial Data Integration**
   - Add API keys for financial data providers
   - Implement real-time price updates
   - Add market data caching

2. **Enhanced Features**
   - Email notifications
   - Advanced portfolio analytics
   - Mobile app support

3. **Production Deployment**
   - Set up CI/CD pipeline
   - Configure monitoring
   - Implement backup strategy