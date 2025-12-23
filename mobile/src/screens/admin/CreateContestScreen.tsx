import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '@/lib/theme';
import { modesApi, categoriesApi, contestsApi } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Loading } from '@/components/ui/Loading';

interface CreateContestScreenProps {
  onGoBack: () => void;
  onSuccess: () => void;
}

export function CreateContestScreen({ onGoBack, onSuccess }: CreateContestScreenProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [contestName, setContestName] = useState('');
  const [selectedModeId, setSelectedModeId] = useState<number | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [contestType, setContestType] = useState<'classic' | 'eliminator'>('classic');
  const [entryFee, setEntryFee] = useState('0.00');
  const [prizePool, setPrizePool] = useState('0.00');
  const [maxParticipants, setMaxParticipants] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data: modes, isLoading: modesLoading } = useQuery({
    queryKey: ['modes'],
    queryFn: () => modesApi.getAll(),
  });

  const { data: categories, isLoading: categoriesLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesApi.getAll(),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => contestsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contests'] });
      Alert.alert('Success', 'Contest request submitted successfully!');
      onSuccess();
    },
    onError: (error: any) => {
      Alert.alert('Error', error.message || 'Failed to create contest');
    },
  });

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!contestName.trim()) newErrors.contestName = 'Contest name is required';
    if (!selectedModeId) newErrors.mode = 'Please select a mode';
    if (!selectedCategoryId) newErrors.category = 'Please select a category';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;

    const now = new Date();
    const openDate = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const closeDate = new Date(openDate.getTime() + 7 * 24 * 60 * 60 * 1000);
    const startDate = closeDate;
    const endDate = new Date(startDate.getTime() + 30 * 24 * 60 * 60 * 1000);

    createMutation.mutate({
      contestName,
      modeId: selectedModeId,
      categoryId: selectedCategoryId,
      contestType,
      entryFee,
      prizePool,
      maxParticipants: maxParticipants ? parseInt(maxParticipants) : null,
      openDate: openDate.toISOString(),
      closeDate: closeDate.toISOString(),
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    });
  };

  if (modesLoading || categoriesLoading) {
    return <Loading fullScreen text="Loading..." />;
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onGoBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Create Contest</Text>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Card style={styles.formCard}>
            <CardHeader>
              <Text style={styles.cardTitle}>Contest Details</Text>
            </CardHeader>
            <CardContent>
              <Input
                label="Contest Name"
                value={contestName}
                onChangeText={setContestName}
                placeholder="Enter contest name"
                error={errors.contestName}
              />

              <Text style={styles.fieldLabel}>Contest Type</Text>
              <View style={styles.typeSelector}>
                <TouchableOpacity
                  style={[
                    styles.typeOption,
                    contestType === 'classic' && styles.typeOptionActive,
                  ]}
                  onPress={() => setContestType('classic')}
                >
                  <Ionicons
                    name="trophy-outline"
                    size={24}
                    color={contestType === 'classic' ? colors.textOnPrimary : colors.textSecondary}
                  />
                  <Text
                    style={[
                      styles.typeText,
                      contestType === 'classic' && styles.typeTextActive,
                    ]}
                  >
                    Classic
                  </Text>
                  <Text style={[styles.typeDescription, contestType === 'classic' && styles.typeDescriptionActive]}>
                    App-wide competition
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.typeOption,
                    contestType === 'eliminator' && styles.typeOptionActive,
                  ]}
                  onPress={() => setContestType('eliminator')}
                >
                  <Ionicons
                    name="flash-outline"
                    size={24}
                    color={contestType === 'eliminator' ? colors.textOnPrimary : colors.textSecondary}
                  />
                  <Text
                    style={[
                      styles.typeText,
                      contestType === 'eliminator' && styles.typeTextActive,
                    ]}
                  >
                    Eliminator
                  </Text>
                  <Text style={[styles.typeDescription, contestType === 'eliminator' && styles.typeDescriptionActive]}>
                    Small group battles
                  </Text>
                </TouchableOpacity>
              </View>
            </CardContent>
          </Card>

          <Card style={styles.formCard}>
            <CardHeader>
              <Text style={styles.cardTitle}>Mode & Category</Text>
            </CardHeader>
            <CardContent>
              <Text style={styles.fieldLabel}>Select Mode</Text>
              {errors.mode && <Text style={styles.errorText}>{errors.mode}</Text>}
              <View style={styles.optionsGrid}>
                {modes?.map((mode: any) => (
                  <TouchableOpacity
                    key={mode.id}
                    style={[
                      styles.optionCard,
                      selectedModeId === mode.id && styles.optionCardActive,
                    ]}
                    onPress={() => setSelectedModeId(mode.id)}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        selectedModeId === mode.id && styles.optionTextActive,
                      ]}
                    >
                      {mode.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.fieldLabel}>Select Category</Text>
              {errors.category && <Text style={styles.errorText}>{errors.category}</Text>}
              <View style={styles.optionsGrid}>
                {categories?.map((category: any) => (
                  <TouchableOpacity
                    key={category.id}
                    style={[
                      styles.optionCard,
                      selectedCategoryId === category.id && styles.optionCardActive,
                    ]}
                    onPress={() => setSelectedCategoryId(category.id)}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        selectedCategoryId === category.id && styles.optionTextActive,
                      ]}
                      numberOfLines={2}
                    >
                      {category.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </CardContent>
          </Card>

          <Card style={styles.formCard}>
            <CardHeader>
              <Text style={styles.cardTitle}>Pricing</Text>
            </CardHeader>
            <CardContent>
              <View style={styles.priceRow}>
                <View style={styles.priceField}>
                  <Input
                    label="Entry Fee ($)"
                    value={entryFee}
                    onChangeText={setEntryFee}
                    placeholder="0.00"
                    keyboardType="decimal-pad"
                  />
                </View>
                <View style={styles.priceField}>
                  <Input
                    label="Prize Pool ($)"
                    value={prizePool}
                    onChangeText={setPrizePool}
                    placeholder="0.00"
                    keyboardType="decimal-pad"
                  />
                </View>
              </View>

              <Input
                label="Max Participants (optional)"
                value={maxParticipants}
                onChangeText={setMaxParticipants}
                placeholder="Leave empty for unlimited"
                keyboardType="number-pad"
              />
            </CardContent>
          </Card>

          <Button
            title={user?.isSuperAdmin ? 'Create Contest' : 'Submit for Approval'}
            onPress={handleSubmit}
            loading={createMutation.isPending}
            fullWidth
            size="lg"
            style={styles.submitButton}
          />

          {!user?.isSuperAdmin && (
            <Text style={styles.infoText}>
              Your contest request will be reviewed by a super admin before becoming active.
            </Text>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray[50],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
  },
  backButton: {
    marginRight: spacing.md,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingTop: 0,
    paddingBottom: spacing.xxl,
  },
  formCard: {
    marginBottom: spacing.lg,
  },
  cardTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  fieldLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.text,
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  errorText: {
    fontSize: fontSize.sm,
    color: colors.error,
    marginBottom: spacing.sm,
  },
  typeSelector: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  typeOption: {
    flex: 1,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
  },
  typeOptionActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  typeText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    marginTop: spacing.sm,
  },
  typeTextActive: {
    color: colors.textOnPrimary,
  },
  typeDescription: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  typeDescriptionActive: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  optionCard: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  optionCardActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  optionText: {
    fontSize: fontSize.sm,
    color: colors.text,
  },
  optionTextActive: {
    color: colors.textOnPrimary,
    fontWeight: fontWeight.medium,
  },
  priceRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  priceField: {
    flex: 1,
  },
  submitButton: {
    marginTop: spacing.md,
  },
  infoText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.md,
  },
});
