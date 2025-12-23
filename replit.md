# Investment Contest Platform

## Overview

This is a full-stack investment contest platform built with React frontend and Express backend. The application allows users to participate in investment contests across different categories (S&P 500, Tech, Crypto, etc.) with real-time portfolio tracking and leaderboards.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes

### December 2024
- Added comprehensive local development setup with README.md and setup guides
- Created alternative authentication system for local development (localAuth.ts)
- Added Docker Compose configuration for easy local setup
- Created deployment guides for multiple platforms
- Fixed database schema issues with contest participants table
- User confirmed application works as expected and requested local development setup

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack Query for server state management
- **UI Components**: Radix UI components with shadcn/ui styling
- **Styling**: Tailwind CSS with custom design tokens
- **Build Tool**: Vite for development and production builds

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Replit Auth with OpenID Connect
- **Session Management**: Express sessions with PostgreSQL storage
- **API Design**: RESTful API with comprehensive error handling

### Database Design
- **ORM**: Drizzle with PostgreSQL dialect
- **Key Tables**: Users, contests, modes, categories, portfolio allocations, leaderboards
- **Relationships**: Proper foreign key constraints and indexes
- **Sessions**: Dedicated session table for authentication

## Key Components

### Authentication System
- **Provider**: Replit Auth with OIDC
- **Session Storage**: PostgreSQL-backed sessions
- **User Management**: Automatic user creation and profile management
- **Authorization**: Role-based access with admin privileges

### Contest Management
- **Contest Types**: Classic (app-wide) and Eliminator (small group)
- **Investment Modes**: S&P 500, Tech Stocks, Cryptocurrency, Penny Stocks, Bonds
- **Categories**: Different rule sets within each mode
- **Lifecycle**: Open → Active → Completed states

### Portfolio System
- **Allocation Management**: Percentage-based portfolio allocation
- **Real-time Tracking**: Integration with financial data APIs
- **Performance Calculation**: Real-time returns and rankings
- **Investment Constraints**: Category-specific rules and limits

### Financial Data Integration
- **Primary Source**: Finnhub API for stock data
- **Fallback Sources**: Yahoo Finance and CoinGecko
- **Data Types**: Real-time prices, historical data, cryptocurrency prices
- **Caching Strategy**: Efficient API usage with proper error handling

## Data Flow

1. **User Authentication**: Replit Auth → Session Creation → User Profile
2. **Contest Participation**: Browse Contests → Join Contest → Allocate Portfolio
3. **Performance Tracking**: Real-time Data Fetch → Calculate Returns → Update Leaderboard
4. **User Interface**: React Components → TanStack Query → REST API → Database

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: PostgreSQL connection pooling
- **drizzle-orm**: Database ORM and query builder
- **@tanstack/react-query**: Server state management
- **@radix-ui/***: Accessible UI components
- **tailwindcss**: Utility-first CSS framework

### Financial APIs
- **Finnhub**: Primary stock market data
- **Yahoo Finance**: Backup stock data
- **CoinGecko**: Cryptocurrency data

### Authentication
- **openid-client**: OIDC authentication
- **passport**: Authentication middleware
- **express-session**: Session management

## Deployment Strategy

### Development
- **Dev Server**: Vite dev server with HMR
- **Database**: PostgreSQL with Drizzle migrations
- **Environment**: NODE_ENV=development

### Production Build
- **Frontend**: Vite build to static assets
- **Backend**: ESBuild bundling for Node.js
- **Database**: Production PostgreSQL with connection pooling
- **Deployment**: Single server deployment with static file serving

### Environment Variables
- `DATABASE_URL`: PostgreSQL connection string
- `SESSION_SECRET`: Session encryption key
- `FINNHUB_API_KEY`: Financial data API key
- `REPLIT_DOMAINS`: Allowed domains for OIDC
- `ISSUER_URL`: OIDC issuer URL

## Key Features

### User Experience
- **Responsive Design**: Mobile-first approach with desktop optimization
- **Real-time Updates**: Live portfolio performance and leaderboards
- **Intuitive Navigation**: Clean, accessible interface design
- **Error Handling**: Comprehensive error states and user feedback

### Admin Features
- **Contest Creation**: Full contest management capabilities
- **User Management**: Admin privileges and user oversight
- **Data Initialization**: Seeding default modes and categories
- **Performance Monitoring**: System health and user activity tracking

### Security Considerations
- **Authentication**: Secure OIDC implementation
- **Session Management**: Secure session handling with PostgreSQL
- **Input Validation**: Zod schema validation on all inputs
- **Error Handling**: Secure error messages without data leakage