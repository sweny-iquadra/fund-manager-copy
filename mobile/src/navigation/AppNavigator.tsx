import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontSize } from '@/lib/theme';
import { useAuth } from '@/context/AuthContext';
import { Loading } from '@/components/ui/Loading';

import { WelcomeScreen } from '@/screens/WelcomeScreen';
import { LoginScreen } from '@/screens/LoginScreen';
import { RegisterScreen } from '@/screens/RegisterScreen';
import { HomeScreen } from '@/screens/HomeScreen';
import { ContestsScreen } from '@/screens/ContestsScreen';
import { ContestDetailScreen } from '@/screens/ContestDetailScreen';
import { PortfolioScreen } from '@/screens/PortfolioScreen';
import { LeaderboardScreen } from '@/screens/LeaderboardScreen';
import { AccountScreen } from '@/screens/AccountScreen';

export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
};

export type AuthStackParamList = {
  Welcome: undefined;
  Login: undefined;
  Register: undefined;
};

export type MainTabParamList = {
  HomeTab: undefined;
  ContestsTab: undefined;
  LeaderboardTab: undefined;
  AccountTab: undefined;
};

export type HomeStackParamList = {
  Home: undefined;
  ContestDetail: { contestId: number };
  Portfolio: { contestId: number };
};

export type ContestsStackParamList = {
  Contests: undefined;
  ContestDetail: { contestId: number };
  Portfolio: { contestId: number };
};

const RootStack = createNativeStackNavigator<RootStackParamList>();
const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();
const HomeStack = createNativeStackNavigator<HomeStackParamList>();
const ContestsStack = createNativeStackNavigator<ContestsStackParamList>();

function AuthNavigator() {
  const { refreshUser } = useAuth();

  const handleAuthSuccess = async () => {
    await refreshUser();
  };

  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Welcome">
        {({ navigation }) => (
          <WelcomeScreen
            onLogin={() => navigation.navigate('Login')}
            onRegister={() => navigation.navigate('Register')}
          />
        )}
      </AuthStack.Screen>
      <AuthStack.Screen name="Login">
        {({ navigation }) => (
          <LoginScreen
            onRegister={() => navigation.navigate('Register')}
            onSuccess={handleAuthSuccess}
          />
        )}
      </AuthStack.Screen>
      <AuthStack.Screen name="Register">
        {({ navigation }) => (
          <RegisterScreen
            onLogin={() => navigation.navigate('Login')}
            onSuccess={handleAuthSuccess}
          />
        )}
      </AuthStack.Screen>
    </AuthStack.Navigator>
  );
}

function HomeStackNavigator() {
  return (
    <HomeStack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <HomeStack.Screen name="Home">
        {({ navigation }) => (
          <HomeScreen
            onNavigateToContests={() => navigation.getParent()?.navigate('ContestsTab')}
            onNavigateToContest={(id) => navigation.navigate('ContestDetail', { contestId: id })}
            onNavigateToLeaderboard={() => navigation.getParent()?.navigate('LeaderboardTab')}
          />
        )}
      </HomeStack.Screen>
      <HomeStack.Screen name="ContestDetail" options={{ headerShown: true, title: 'Contest' }}>
        {({ navigation, route }) => (
          <ContestDetailScreen
            contestId={(route.params as any).contestId}
            onNavigateToPortfolio={(id) => navigation.navigate('Portfolio', { contestId: id })}
            onGoBack={() => navigation.goBack()}
          />
        )}
      </HomeStack.Screen>
      <HomeStack.Screen name="Portfolio" options={{ headerShown: true, title: 'Portfolio' }}>
        {({ navigation, route }) => (
          <PortfolioScreen
            contestId={(route.params as any).contestId}
            onGoBack={() => navigation.goBack()}
          />
        )}
      </HomeStack.Screen>
    </HomeStack.Navigator>
  );
}

function ContestsStackNavigator() {
  return (
    <ContestsStack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <ContestsStack.Screen name="Contests">
        {({ navigation }) => (
          <ContestsScreen
            onNavigateToContest={(id) => navigation.navigate('ContestDetail', { contestId: id })}
          />
        )}
      </ContestsStack.Screen>
      <ContestsStack.Screen name="ContestDetail" options={{ headerShown: true, title: 'Contest' }}>
        {({ navigation, route }) => (
          <ContestDetailScreen
            contestId={(route.params as any).contestId}
            onNavigateToPortfolio={(id) => navigation.navigate('Portfolio', { contestId: id })}
            onGoBack={() => navigation.goBack()}
          />
        )}
      </ContestsStack.Screen>
      <ContestsStack.Screen name="Portfolio" options={{ headerShown: true, title: 'Portfolio' }}>
        {({ navigation, route }) => (
          <PortfolioScreen
            contestId={(route.params as any).contestId}
            onGoBack={() => navigation.goBack()}
          />
        )}
      </ContestsStack.Screen>
    </ContestsStack.Navigator>
  );
}

function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          if (route.name === 'HomeTab') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'ContestsTab') {
            iconName = focused ? 'trophy' : 'trophy-outline';
          } else if (route.name === 'LeaderboardTab') {
            iconName = focused ? 'podium' : 'podium-outline';
          } else if (route.name === 'AccountTab') {
            iconName = focused ? 'person' : 'person-outline';
          } else {
            iconName = 'ellipse';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          paddingTop: 8,
          paddingBottom: 8,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: fontSize.xs,
          fontWeight: '500',
        },
      })}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeStackNavigator}
        options={{ tabBarLabel: 'Home' }}
      />
      <Tab.Screen
        name="ContestsTab"
        component={ContestsStackNavigator}
        options={{ tabBarLabel: 'Contests' }}
      />
      <Tab.Screen
        name="LeaderboardTab"
        options={{ tabBarLabel: 'Leaderboard' }}
      >
        {({ navigation }) => (
          <LeaderboardScreen
            onNavigateToContest={(id) =>
              navigation.navigate('ContestsTab', {
                screen: 'ContestDetail',
                params: { contestId: id },
              })
            }
          />
        )}
      </Tab.Screen>
      <Tab.Screen
        name="AccountTab"
        options={{ tabBarLabel: 'Account' }}
      >
        {() => <AccountScreen onLogout={() => {}} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}

export function AppNavigator() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <Loading fullScreen text="Loading..." />;
  }

  return (
    <NavigationContainer>
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <RootStack.Screen name="Main" component={MainTabNavigator} />
        ) : (
          <RootStack.Screen name="Auth" component={AuthNavigator} />
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
}
