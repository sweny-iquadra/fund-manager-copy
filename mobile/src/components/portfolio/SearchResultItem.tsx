import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '@/lib/theme';
import { stocksApi, cryptoApi, SearchResult, StockPrice } from '@/lib/api';
import { Badge } from '@/components/ui/Badge';

interface SearchResultItemProps {
  company: SearchResult;
  onSelect: (company: SearchResult & { currentPrice?: number }) => void;
}

export function SearchResultItem({ company, onSelect }: SearchResultItemProps) {
  const isCrypto = company.type === 'Cryptocurrency';
  
  const { data: priceData, isLoading: priceLoading, error: priceError } = useQuery<StockPrice>({
    queryKey: [isCrypto ? 'crypto-price' : 'stock-price', company.symbol],
    queryFn: () => isCrypto 
      ? cryptoApi.getPrice(company.symbol) 
      : stocksApi.getPrice(company.symbol),
    staleTime: 60000,
  });

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(price);
  };

  const handlePress = () => {
    onSelect({
      ...company,
      currentPrice: priceData?.price,
    });
  };

  const change = priceData?.change || 0;
  const changePercent = priceData?.changePercent || 0;
  const isPositive = change >= 0;

  return (
    <TouchableOpacity 
      style={styles.container} 
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <View style={styles.leftSection}>
        <View style={styles.nameRow}>
          {isCrypto && (
            <Ionicons name="logo-bitcoin" size={16} color={colors.warning} style={styles.cryptoIcon} />
          )}
          <Text style={styles.companyName} numberOfLines={1}>
            {company.name}
          </Text>
        </View>
        <View style={styles.symbolRow}>
          <Badge 
            label={company.symbol} 
            variant={isCrypto ? 'primary' : 'outline'} 
            style={styles.symbolBadge}
          />
          <Text style={styles.typeText}>{company.type}</Text>
        </View>
      </View>

      <View style={styles.rightSection}>
        {priceLoading ? (
          <ActivityIndicator size="small" color={colors.primary} />
        ) : priceData ? (
          <View style={styles.priceContainer}>
            <Text style={styles.priceText}>{formatPrice(priceData.price)}</Text>
            <View style={styles.changeRow}>
              <Ionicons 
                name={isPositive ? 'trending-up' : 'trending-down'} 
                size={12} 
                color={isPositive ? colors.success : colors.error} 
              />
              <Text style={[styles.changeText, isPositive ? styles.positive : styles.negative]}>
                {changePercent.toFixed(2)}%
              </Text>
            </View>
          </View>
        ) : (
          <Text style={styles.loadingText}>--</Text>
        )}
        <Ionicons name="add-circle" size={24} color={colors.primary} style={styles.addIcon} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  leftSection: {
    flex: 1,
    marginRight: spacing.sm,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  cryptoIcon: {
    marginRight: spacing.xs,
  },
  companyName: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    color: colors.text,
    flex: 1,
  },
  symbolRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  symbolBadge: {
    marginRight: spacing.xs,
  },
  typeText: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priceContainer: {
    alignItems: 'flex-end',
    marginRight: spacing.sm,
  },
  priceText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  changeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  changeText: {
    fontSize: fontSize.xs,
    marginLeft: 2,
  },
  positive: {
    color: colors.success,
  },
  negative: {
    color: colors.error,
  },
  loadingText: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginRight: spacing.sm,
  },
  addIcon: {
    marginLeft: spacing.xs,
  },
});
