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
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '@/lib/theme';
import { modesApi, categoriesApi, contestRequestsApi } from '@/lib/api';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Loading } from '@/components/ui/Loading';

interface CreateContestScreenProps {
  onGoBack: () => void;
  onSuccess: () => void;
}

type DateTimeFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  helperText: string;
  error?: string;
};

const DateTimeField = ({ label, value, onChange, helperText, error }: DateTimeFieldProps) => {
  const [showIOSPicker, setShowIOSPicker] = useState(false);

  const currentDate = value ? new Date(value) : new Date();

  const formatDisplay = () => {
    if (!value) return 'Select date & time';
    try {
      return new Date(value).toLocaleString();
    } catch {
      return value;
    }
  };

  const handleAndroidPickers = () => {
    DateTimePickerAndroid.open({
      value: currentDate,
      mode: 'date',
      onChange: (event, selectedDate) => {
        if (event.type === 'set' && selectedDate) {
          DateTimePickerAndroid.open({
            value: selectedDate,
            mode: 'time',
            onChange: (timeEvent, selectedTime) => {
              if (timeEvent.type === 'set' && selectedTime) {
                const combined = new Date(selectedDate);
                combined.setHours(selectedTime.getHours());
                combined.setMinutes(selectedTime.getMinutes());
                combined.setSeconds(0);
                combined.setMilliseconds(0);
                onChange(combined.toISOString());
              }
            },
          });
        }
      },
    });
  };

  const handleIOSChange = (_event: any, selectedDate?: Date) => {
    if (selectedDate) {
      onChange(selectedDate.toISOString());
    }
    setShowIOSPicker(false);
  };

  const openPicker = () => {
    if (Platform.OS === 'android') {
      handleAndroidPickers();
    } else {
      setShowIOSPicker(true);
    }
  };

  return (
    <View style={styles.dateFieldContainer}>
      <Text style={styles.dateLabel}>{label}</Text>
      <TouchableOpacity style={[styles.dateInput, error && styles.inputError]} onPress={openPicker}>
        <Text style={value ? styles.dateValue : styles.datePlaceholder}>{formatDisplay()}</Text>
      </TouchableOpacity>
      {error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : (
        <Text style={styles.helperText}>{helperText}</Text>
      )}

      {showIOSPicker && (
        <DateTimePicker
          value={currentDate}
          mode="datetime"
          display="spinner"
          onChange={handleIOSChange}
        />
      )}
    </View>
  );
};

export function CreateContestScreen({ onGoBack, onSuccess }: CreateContestScreenProps) {
  const queryClient = useQueryClient();

  const [contestName, setContestName] = useState('');
  const [selectedModeId, setSelectedModeId] = useState<number | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [contestType, setContestType] = useState<'classic' | 'eliminator'>('classic');
  const [entryFee, setEntryFee] = useState('0.00');
  const [prizePool, setPrizePool] = useState('0.00');
  const [maxParticipants, setMaxParticipants] = useState('');
  const [openDate, setOpenDate] = useState('');
  const [closeDate, setCloseDate] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
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
    mutationFn: (data: any) => contestRequestsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contests'] });
      Alert.alert(
        'Success',
        "Contest request submitted for approval. You'll be notified when it's reviewed."
      );
      onSuccess();
    },
    onError: (error: any) => {
      Alert.alert('Error', error.message || 'Failed to create contest');
    },
  });

  const validate = () => {
    const newErrors: Record<string, string> = {};
    const isValidDate = (value: string) => value && !isNaN(new Date(value).getTime());
    const isValidAmount = (value: string, allowZero = false) => {
      const parsed = parseFloat(value);
      if (isNaN(parsed)) return false;
      return allowZero ? parsed >= 0 : parsed > 0;
    };

    if (!contestName.trim()) newErrors.contestName = 'Contest name is required';
    if (!selectedModeId) newErrors.mode = 'Please select a mode';
    if (!selectedCategoryId) newErrors.category = 'Please select a category';
    if (!isValidAmount(entryFee, true)) newErrors.entryFee = 'Entry fee must be a valid number';
    if (!isValidAmount(prizePool)) newErrors.prizePool = 'Prize pool must be greater than 0';
    if (!isValidDate(openDate)) newErrors.openDate = 'Enter a valid registration open date/time';
    if (!isValidDate(closeDate)) newErrors.closeDate = 'Enter a valid registration close date/time';
    if (!isValidDate(startDate)) newErrors.startDate = 'Enter a valid contest start date/time';
    if (!isValidDate(endDate)) newErrors.endDate = 'Enter a valid contest end date/time';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;

    const formatCurrency = (value: string) => {
      const parsed = parseFloat(value || '0');
      return (isNaN(parsed) ? 0 : parsed).toFixed(2);
    };

    createMutation.mutate({
      contestName,
      modeId: selectedModeId,
      categoryId: selectedCategoryId,
      contestType,
      entryFee: formatCurrency(entryFee),
      prizePool: formatCurrency(prizePool),
      maxParticipants: maxParticipants ? parseInt(maxParticipants) : undefined,
      openDate: new Date(openDate).toISOString(),
      closeDate: new Date(closeDate).toISOString(),
      startDate: new Date(startDate).toISOString(),
      endDate: new Date(endDate).toISOString(),
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
                    error={errors.entryFee}
                  />
                </View>
                <View style={styles.priceField}>
                  <Input
                    label="Prize Pool ($)"
                    value={prizePool}
                    onChangeText={setPrizePool}
                    placeholder="0.00"
                    keyboardType="decimal-pad"
                    error={errors.prizePool}
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

          <Card style={styles.formCard}>
            <CardHeader>
              <Text style={styles.cardTitle}>Schedule</Text>
            </CardHeader>
            <CardContent>
              <DateTimeField
                label="Registration Opens"
                value={openDate}
                onChange={setOpenDate}
                helperText="When participants can start joining"
                error={errors.openDate}
              />
              <DateTimeField
                label="Registration Closes"
                value={closeDate}
                onChange={setCloseDate}
                helperText="Last chance to join and submit allocations"
                error={errors.closeDate}
              />
              <DateTimeField
                label="Contest Starts"
                value={startDate}
                onChange={setStartDate}
                helperText="When the trading period begins"
                error={errors.startDate}
              />
              <DateTimeField
                label="Contest Ends"
                value={endDate}
                onChange={setEndDate}
                helperText="When the trading period ends"
                error={errors.endDate}
              />
            </CardContent>
          </Card>

          <Button
            title="Create Contest"
            onPress={handleSubmit}
            loading={createMutation.isPending}
            fullWidth
            size="lg"
            style={styles.submitButton}
          />
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
  dateFieldContainer: {
    marginBottom: spacing.md,
  },
  dateLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  dateInput: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    backgroundColor: colors.background,
  },
  dateValue: {
    fontSize: fontSize.md,
    color: colors.text,
  },
  datePlaceholder: {
    fontSize: fontSize.md,
    color: colors.textMuted,
  },
  helperText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  inputError: {
    borderColor: colors.error,
  },
});
