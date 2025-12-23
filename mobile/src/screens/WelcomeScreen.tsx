import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  SafeAreaView,
  Dimensions,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontSize, fontWeight, gradients } from '@/lib/theme';
import { Button } from '@/components/ui/Button';

const { height } = Dimensions.get('window');

interface WelcomeScreenProps {
  onLogin: () => void;
  onRegister: () => void;
}

export function WelcomeScreen({ onLogin, onRegister }: WelcomeScreenProps) {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={gradients.financial} style={styles.gradient}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.content}>
            <View style={styles.logoSection}>
              <View style={styles.logoContainer}>
                <Ionicons name="trending-up" size={64} color={colors.textOnPrimary} />
              </View>
              <Text style={styles.appName}>FinanceFantasy</Text>
              <Text style={styles.tagline}>Compete. Trade. Win.</Text>
            </View>

            <View style={styles.heroSection}>
              <Text style={styles.heroAmount}>$1,000,000</Text>
              <Text style={styles.heroSubtitle}>Virtual Portfolio</Text>
              <Text style={styles.heroDescription}>
                Enter fantasy finance competitions with virtual portfolios.{'\n'}
                Compete against traders worldwide and win real prize money based on your returns.
              </Text>
            </View>

            <View style={styles.features}>
              <View style={styles.featureRow}>
                <View style={styles.feature}>
                  <Ionicons name="trophy-outline" size={24} color={colors.accent} />
                  <Text style={styles.featureText}>Win Prizes</Text>
                </View>
                <View style={styles.feature}>
                  <Ionicons name="analytics-outline" size={24} color={colors.accent} />
                  <Text style={styles.featureText}>Track Performance</Text>
                </View>
              </View>
              <View style={styles.featureRow}>
                <View style={styles.feature}>
                  <Ionicons name="people-outline" size={24} color={colors.accent} />
                  <Text style={styles.featureText}>Compete Globally</Text>
                </View>
                <View style={styles.feature}>
                  <Ionicons name="shield-checkmark-outline" size={24} color={colors.accent} />
                  <Text style={styles.featureText}>Risk-Free</Text>
                </View>
              </View>
            </View>

            <View style={styles.actions}>
              <Button
                title="Get Started"
                onPress={onRegister}
                variant="primary"
                size="lg"
                fullWidth
                style={styles.primaryButton}
                textStyle={styles.primaryButtonText}
              />
              <Button
                title="Sign In"
                onPress={onLogin}
                variant="outline"
                size="lg"
                fullWidth
                style={styles.secondaryButton}
                textStyle={styles.secondaryButtonText}
              />
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    justifyContent: 'space-between',
  },
  logoSection: {
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  appName: {
    fontSize: fontSize.xxxl,
    fontWeight: fontWeight.bold,
    color: colors.textOnPrimary,
  },
  tagline: {
    fontSize: fontSize.lg,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: spacing.xs,
  },
  heroSection: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  heroAmount: {
    fontSize: 48,
    fontWeight: fontWeight.bold,
    color: colors.accent,
  },
  heroSubtitle: {
    fontSize: fontSize.xl,
    color: colors.textOnPrimary,
    marginTop: spacing.xs,
  },
  heroDescription: {
    fontSize: fontSize.md,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginTop: spacing.md,
    lineHeight: 24,
  },
  features: {
    paddingVertical: spacing.lg,
  },
  featureRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: spacing.md,
  },
  feature: {
    alignItems: 'center',
    flex: 1,
  },
  featureText: {
    fontSize: fontSize.sm,
    color: colors.textOnPrimary,
    marginTop: spacing.xs,
  },
  actions: {
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
  primaryButton: {
    backgroundColor: colors.accent,
  },
  primaryButtonText: {
    color: colors.text,
    fontWeight: fontWeight.bold,
  },
  secondaryButton: {
    borderColor: 'rgba(255, 255, 255, 0.5)',
    backgroundColor: 'transparent',
  },
  secondaryButtonText: {
    color: colors.textOnPrimary,
  },
});
