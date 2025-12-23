# Deployment Guide

## Local Development Options

### Option 1: Standard Node.js Setup

1. **Prerequisites**
   - Node.js 18+ and npm
   - PostgreSQL database

2. **Setup Steps**
   ```bash
   # Clone repository
   git clone <repo-url>
   cd investment-contest-platform
   
   # Install dependencies
   npm install
   
   # Copy environment file
   cp .env.example .env
   
   # Update .env with your database credentials
   # Set USE_LOCAL_AUTH=true for simplified local development
   
   # Push database schema
   npm run db:push
   
   # Start development server
   npm run dev
   ```

### Option 2: Docker Compose (Recommended)

1. **Prerequisites**
   - Docker and Docker Compose

2. **Setup Steps**
   ```bash
   # Clone repository
   git clone <repo-url>
   cd investment-contest-platform
   
   # Start services (PostgreSQL + App)
   docker-compose up -d
   
   # Initialize database schema
   docker-compose exec app npm run db:push
   ```

   This will:
   - Start PostgreSQL on port 5432
   - Start the app on port 5000
   - Use local authentication (no Replit Auth needed)

### Option 3: Manual Database Setup

1. **Install PostgreSQL**
   ```bash
   # macOS
   brew install postgresql
   brew services start postgresql
   
   # Ubuntu/Debian
   sudo apt update
   sudo apt install postgresql postgresql-contrib
   sudo systemctl start postgresql
   
   # Windows
   # Download from https://www.postgresql.org/download/windows/
   ```

2. **Create Database**
   ```sql
   psql -U postgres
   CREATE DATABASE investment_contest_db;
   CREATE USER contest_user WITH PASSWORD 'contest_pass';
   GRANT ALL PRIVILEGES ON DATABASE investment_contest_db TO contest_user;
   ```

## Production Deployment

### Environment Variables

Required production environment variables:
```bash
# Database
DATABASE_URL=postgresql://user:pass@host:5432/db

# Authentication
SESSION_SECRET=your-secure-session-secret
REPLIT_DOMAINS=your-domain.com
ISSUER_URL=https://replit.com/oidc
REPL_ID=your-repl-id

# Server
PORT=80
NODE_ENV=production

# Optional: Disable local auth in production
USE_LOCAL_AUTH=false
```

### Build and Deploy

1. **Build Application**
   ```bash
   npm run build
   ```

2. **Start Production Server**
   ```bash
   npm run start
   ```

### Platform-Specific Deployments

#### Replit Deployment
- Environment variables are automatically configured
- Database is provisioned automatically
- Authentication works out of the box

#### Heroku Deployment
```bash
# Install Heroku CLI
# Login to Heroku
heroku login

# Create app
heroku create your-app-name

# Add PostgreSQL addon
heroku addons:create heroku-postgresql:hobby-dev

# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set SESSION_SECRET=your-secure-secret
heroku config:set REPLIT_DOMAINS=your-app-name.herokuapp.com

# Deploy
git push heroku main

# Initialize database
heroku run npm run db:push
```

#### Railway Deployment
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and deploy
railway login
railway init
railway up

# Set environment variables in Railway dashboard
```

#### Docker Production
```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy built application
COPY dist ./dist
COPY client/dist ./client/dist

EXPOSE 80

CMD ["npm", "run", "start"]
```

## Database Management

### Migrations
```bash
# Apply schema changes
npm run db:push

# Generate migration files (if needed)
npm run db:generate

# Apply migrations
npm run db:migrate
```

### Backup and Restore
```bash
# Backup
pg_dump $DATABASE_URL > backup.sql

# Restore
psql $DATABASE_URL < backup.sql
```

## Monitoring and Logging

### Health Checks
The application includes health check endpoints:
- `GET /health` - Basic health check
- `GET /api/health` - API health check

### Logging
- Development: Console logging
- Production: Structured logging to stdout

### Performance Monitoring
Consider adding:
- Application monitoring (New Relic, Datadog)
- Database monitoring
- Error tracking (Sentry)

## Security Considerations

### Production Security
- Use HTTPS in production
- Set secure session configuration
- Implement rate limiting
- Validate all user inputs
- Use environment variables for secrets

### Database Security
- Use connection pooling
- Implement proper access controls
- Regular security updates
- Backup encryption

## Troubleshooting

### Common Issues

1. **Database Connection Issues**
   - Check DATABASE_URL format
   - Verify PostgreSQL is running
   - Check firewall settings

2. **Authentication Issues**
   - Verify Replit OAuth settings
   - Check REPLIT_DOMAINS configuration
   - For local dev: set USE_LOCAL_AUTH=true

3. **Port Conflicts**
   - Change PORT in environment
   - Check for running processes

4. **Build Failures**
   - Clear node_modules and reinstall
   - Check Node.js version compatibility
   - Verify all dependencies are installed

### Debug Mode
```bash
# Enable debug logging
DEBUG=* npm run dev

# Or specific debug categories
DEBUG=express:* npm run dev
```

### Database Debugging
```bash
# Connect to database
psql $DATABASE_URL

# Check tables
\dt

# Check data
SELECT * FROM users LIMIT 5;
```