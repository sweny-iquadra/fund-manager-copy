# FinanceFantasy Mobile App

A React Native mobile app for the FinanceFantasy investment contest platform, built with Expo.

## Features

- **Authentication**: Login, Register with email/password
- **Home Dashboard**: Account balance, active contests, quick stats
- **Contests**: Browse, filter, join and manage contests
- **Portfolio Management**: Search stocks/crypto, allocate investments
- **Leaderboard**: Real-time rankings across contests
- **Account**: Profile, transactions, settings
- **Admin Features**: Contest requests management, create contests

## Tech Stack

- **Framework**: React Native with Expo SDK 51
- **Navigation**: React Navigation (Stack + Bottom Tabs)
- **State Management**: TanStack Query (React Query)
- **Styling**: Custom theme system with consistent colors, spacing, typography
- **Storage**: Expo SecureStore for tokens
- **Icons**: Expo Vector Icons (Ionicons)

## Getting Started

### Prerequisites

- Node.js 18+
- Expo CLI (`npm install -g expo-cli`)
- Expo Go app on your device (iOS or Android)

### Installation

1. Navigate to the mobile directory:
   ```bash
   cd mobile
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure the API URL:
   Create a `.env` file in the mobile directory:
   ```
   EXPO_PUBLIC_API_URL=https://your-app-url.replit.dev
   ```

4. Start the development server:
   ```bash
   npm start
   ```

5. Scan the QR code with Expo Go (Android) or Camera app (iOS)

## Project Structure

```
mobile/
├── App.tsx                 # Main app entry
├── app.json               # Expo configuration
├── assets/                # App icons and splash screens
├── src/
│   ├── components/        # Reusable UI components
│   │   ├── ui/           # Base UI components (Button, Input, Card, etc.)
│   │   ├── contests/     # Contest-related components
│   │   ├── leaderboard/  # Leaderboard components
│   │   └── portfolio/    # Portfolio components
│   ├── context/          # React contexts (Auth)
│   ├── hooks/            # Custom hooks
│   ├── lib/              # Utilities, API client, theme
│   ├── navigation/       # Navigation configuration
│   └── screens/          # App screens
│       ├── admin/        # Admin screens
│       └── *.tsx         # Main screens
└── package.json
```

## Screens

### Authentication
- **WelcomeScreen**: Landing page with branding
- **LoginScreen**: Email/password login
- **RegisterScreen**: New user registration

### Main App
- **HomeScreen**: Dashboard with stats and active contests
- **ContestsScreen**: Browse and filter all contests
- **ContestDetailScreen**: Contest info, join, leaderboard preview
- **PortfolioScreen**: Manage portfolio allocations
- **LeaderboardScreen**: Contest rankings
- **AccountScreen**: Profile, transactions, settings

### Admin
- **ContestRequestsScreen**: Review pending contest requests
- **CreateContestScreen**: Create new contests

## Theming

The app uses a centralized theme system in `src/lib/theme.ts`:

- **Colors**: Primary blue (#2196F3), accent gold (#F5A623), success/error states
- **Spacing**: xs (4), sm (8), md (16), lg (24), xl (32), xxl (48)
- **Typography**: Consistent font sizes and weights
- **Shadows**: Platform-specific shadow styles

## API Integration

API client in `src/lib/api.ts` handles:
- Authentication tokens (stored securely)
- Request/response handling
- Error handling
- Endpoints for contests, portfolio, user, stocks

## Building for Production

### iOS
```bash
expo build:ios
```

### Android
```bash
expo build:android
```

## Contributing

1. Follow the existing code style
2. Use TypeScript for type safety
3. Keep components small and focused
4. Use the theme system for consistent styling
