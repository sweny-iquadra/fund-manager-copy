import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '@/lib/theme';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Logo } from '@/components/Logo';
import { useAuth } from '@/context/AuthContext';

interface RegisterScreenProps {
  onLogin: () => void;
  onSuccess: () => void;
}

export function RegisterScreen({ onLogin, onSuccess }: RegisterScreenProps) {
  const { register } = useAuth();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!firstName.trim()) newErrors.firstName = 'First name is required';
    if (!lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Please enter a valid email';
    }
    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }
    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;

    setLoading(true);
    try {
      await register({ email, password, firstName, lastName });
      onSuccess();
    } catch (error: any) {
      Alert.alert('Registration Failed', error.message || 'Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Logo size="lg" />
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Join the competition today</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.nameRow}>
              <View style={styles.nameField}>
                <Input
                  label="First Name"
                  value={firstName}
                  onChangeText={setFirstName}
                  placeholder="John"
                  autoCapitalize="words"
                  error={errors.firstName}
                />
              </View>
              <View style={styles.nameField}>
                <Input
                  label="Last Name"
                  value={lastName}
                  onChangeText={setLastName}
                  placeholder="Doe"
                  autoCapitalize="words"
                  error={errors.lastName}
                />
              </View>
            </View>

            <Input
              label="Email"
              value={email}
              onChangeText={setEmail}
              placeholder="john@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              error={errors.email}
              leftIcon={<Ionicons name="mail-outline" size={20} color={colors.textSecondary} />}
            />

            <Input
              label="Password"
              value={password}
              onChangeText={setPassword}
              placeholder="Create a strong password"
              isPassword
              error={errors.password}
              hint="At least 8 characters"
              leftIcon={<Ionicons name="lock-closed-outline" size={20} color={colors.textSecondary} />}
            />

            <Input
              label="Confirm Password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Confirm your password"
              isPassword
              error={errors.confirmPassword}
              leftIcon={<Ionicons name="lock-closed-outline" size={20} color={colors.textSecondary} />}
            />

            <Button
              title="Create Account"
              onPress={handleRegister}
              loading={loading}
              fullWidth
              size="lg"
              style={styles.registerButton}
            />
          </View>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or sign up with</Text>
            <View style={styles.dividerLine} />
          </View>

          <View style={styles.socialButtons}>
            <TouchableOpacity style={styles.socialButton}>
              <Ionicons name="logo-google" size={24} color={colors.text} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.socialButton}>
              <Ionicons name="logo-apple" size={24} color={colors.text} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.socialButton}>
              <Ionicons name="logo-facebook" size={24} color="#1877F2" />
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <TouchableOpacity onPress={onLogin}>
              <Text style={styles.footerLink}>Sign In</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.terms}>
            By creating an account, you agree to our{' '}
            <Text style={styles.termsLink}>Terms of Service</Text> and{' '}
            <Text style={styles.termsLink}>Privacy Policy</Text>
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: spacing.lg,
  },
  header: {
    alignItems: 'center',
    marginTop: spacing.lg,
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.text,
    marginTop: spacing.lg,
  },
  subtitle: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  form: {
    marginBottom: spacing.lg,
  },
  nameRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  nameField: {
    flex: 1,
  },
  registerButton: {
    marginTop: spacing.md,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    paddingHorizontal: spacing.md,
  },
  socialButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  socialButton: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  footerText: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
  footerLink: {
    fontSize: fontSize.md,
    color: colors.primary,
    fontWeight: fontWeight.semibold,
  },
  terms: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  termsLink: {
    color: colors.primary,
  },
});
