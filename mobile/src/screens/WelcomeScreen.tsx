import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontSize, fontWeight, gradients, borderRadius } from '@/lib/theme';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';

interface WelcomeScreenProps {
  onLogin: () => void;
  onRegister: () => void;
}

const stats = [
  { value: '10K+', label: 'Active Traders' },
  { value: '$500K', label: 'Prize Pools' },
  { value: '25+', label: 'Active Contests' },
  { value: '$2M+', label: 'Total Payouts' },
];

const contestTypes = [
  {
    title: 'Classic Contests',
    description: 'Traditional format competitions',
    icon: 'trophy' as const,
    color: colors.primary,
    details: [
      'Open enrollment periods',
      'Fixed duration competitions',
      'Multiple prize tiers',
      'Real-time leaderboards',
    ],
    entryFee: '$10 - $100',
    prizePool: 'Up to $50,000',
    duration: '1-4 weeks',
  },
  {
    title: 'Eliminator Contests',
    description: 'Head-to-head competition',
    icon: 'flash' as const,
    color: colors.accent,
    details: [
      'Bracket-style competition',
      'Weekly eliminations',
      'Winner-take-all rounds',
      'Intense competition',
    ],
    entryFee: '$25 - $250',
    prizePool: 'Up to $100,000',
    duration: '6-8 weeks',
  },
];

const investmentModes = [
  {
    name: 'S&P 500',
    description: 'Blue-chip stocks',
    icon: 'business' as const,
    contests: 8,
    prizePool: '$125,000',
    participants: 2500,
  },
  {
    name: 'Tech Stocks',
    description: 'Technology sector',
    icon: 'laptop' as const,
    contests: 12,
    prizePool: '$200,000',
    participants: 4200,
  },
  {
    name: 'Cryptocurrency',
    description: 'Digital assets',
    icon: 'logo-bitcoin' as const,
    contests: 6,
    prizePool: '$80,000',
    participants: 1800,
  },
];

const howItWorks = [
  {
    step: '1',
    title: 'Choose Contest',
    description: 'Select from Classic or Eliminator contests in your preferred category',
  },
  {
    step: '2',
    title: 'Allocate Portfolio',
    description: 'Distribute your $1M virtual portfolio across up to 10 investments',
  },
  {
    step: '3',
    title: 'Track Performance',
    description: 'Monitor your rankings and returns in real-time leaderboards',
  },
  {
    step: '4',
    title: 'Win Prizes',
    description: 'Earn real money based on your final ranking and performance',
  },
];

const testimonials = [
  {
    text: "Best investment game I've ever played. The competition is real and the prizes are even better!",
    name: 'Michael R.',
    role: 'Top 10 Trader',
    rating: 5,
    initials: 'MR',
    color: colors.primary,
  },
  {
    text: 'Finally a platform that lets me test my investment strategies without real risk.',
    name: 'Sarah K.',
    role: 'Contest Winner',
    rating: 5,
    initials: 'SK',
    color: colors.accent,
  },
  {
    text: 'The eliminator format is incredibly exciting. Every week counts!',
    name: 'David L.',
    role: 'Regular Competitor',
    rating: 5,
    initials: 'DL',
    color: colors.success,
  },
];

export function WelcomeScreen({ onLogin, onRegister }: WelcomeScreenProps) {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <LinearGradient colors={gradients.financial} style={styles.heroSection}>
          <SafeAreaView>
            <View style={styles.header}>
              <View style={styles.logoRow}>
                <Ionicons name="trending-up" size={28} color={colors.textOnPrimary} />
                <Text style={styles.logoText}>FinanceFantasy</Text>
              </View>
              <View style={styles.headerButtons}>
                <TouchableOpacity onPress={onLogin}>
                  <Text style={styles.signInText}>Sign In</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.heroContent}>
              <Text style={styles.heroTitle}>Compete. Trade. Win.</Text>
              <Text style={styles.heroAmount}>$1,000,000</Text>
              <Text style={styles.heroSubtitle}>Virtual Portfolio</Text>
              <Text style={styles.heroDescription}>
                Enter fantasy finance competitions with virtual portfolios. Compete against traders worldwide and win real prize money based on your returns.
              </Text>

              <View style={styles.heroButtons}>
                <Button
                  title="Join Competition"
                  onPress={onRegister}
                  size="lg"
                  fullWidth
                  style={styles.primaryButton}
                  textStyle={styles.primaryButtonText}
                  icon={<Ionicons name="trophy" size={20} color={colors.text} />}
                />
                <Button
                  title="Watch Demo"
                  onPress={() => {}}
                  variant="outline"
                  size="lg"
                  fullWidth
                  style={styles.secondaryButton}
                  textStyle={styles.secondaryButtonText}
                />
              </View>
            </View>

            <View style={styles.statsBar}>
              {stats.map((stat, index) => (
                <View key={index} style={styles.statItem}>
                  <Text style={styles.statValue}>{stat.value}</Text>
                  <Text style={styles.statLabel}>{stat.label}</Text>
                </View>
              ))}
            </View>
          </SafeAreaView>
        </LinearGradient>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Choose Your Competition</Text>
          <Text style={styles.sectionSubtitle}>
            Select from different contest formats designed for every type of trader
          </Text>

          {contestTypes.map((contest, index) => (
            <Card key={index} style={styles.contestCard}>
              <CardContent style={styles.contestCardContent}>
                <View style={styles.contestHeader}>
                  <View style={[styles.contestIconContainer, { backgroundColor: contest.color + '20' }]}>
                    <Ionicons name={contest.icon} size={24} color={contest.color} />
                  </View>
                  <View style={styles.contestHeaderText}>
                    <Text style={styles.contestTitle}>{contest.title}</Text>
                    <Text style={styles.contestDescription}>{contest.description}</Text>
                  </View>
                </View>

                <View style={styles.contestDetails}>
                  {contest.details.map((detail, detailIndex) => (
                    <View key={detailIndex} style={styles.detailRow}>
                      <View style={styles.detailDot} />
                      <Text style={styles.detailText}>{detail}</Text>
                    </View>
                  ))}
                </View>

                <View style={styles.contestStats}>
                  <View style={styles.contestStatRow}>
                    <Text style={styles.contestStatLabel}>Entry Fee</Text>
                    <Text style={styles.contestStatValue}>{contest.entryFee}</Text>
                  </View>
                  <View style={styles.contestStatRow}>
                    <Text style={styles.contestStatLabel}>Prize Pool</Text>
                    <Text style={[styles.contestStatValue, { color: colors.success }]}>{contest.prizePool}</Text>
                  </View>
                  <View style={styles.contestStatRow}>
                    <Text style={styles.contestStatLabel}>Duration</Text>
                    <Text style={styles.contestStatValue}>{contest.duration}</Text>
                  </View>
                </View>
              </CardContent>
            </Card>
          ))}
        </View>

        <View style={[styles.section, styles.sectionGray]}>
          <Text style={styles.sectionTitle}>Investment Categories</Text>
          <Text style={styles.sectionSubtitle}>
            Choose your expertise area and compete in specialized markets
          </Text>

          {investmentModes.map((mode, index) => (
            <Card key={index} style={styles.modeCard}>
              <CardContent style={styles.modeCardContent}>
                <View style={styles.modeHeader}>
                  <View style={styles.modeIconContainer}>
                    <Ionicons name={mode.icon} size={20} color={colors.primary} />
                  </View>
                  <View style={styles.modeHeaderText}>
                    <Text style={styles.modeName}>{mode.name}</Text>
                    <Text style={styles.modeDescription}>{mode.description}</Text>
                  </View>
                </View>

                <View style={styles.modeStats}>
                  <View style={styles.modeStatItem}>
                    <Text style={styles.modeStatLabel}>Contests</Text>
                    <Text style={styles.modeStatValue}>{mode.contests}</Text>
                  </View>
                  <View style={styles.modeStatItem}>
                    <Text style={styles.modeStatLabel}>Prize Pool</Text>
                    <Text style={[styles.modeStatValue, { color: colors.success }]}>{mode.prizePool}</Text>
                  </View>
                  <View style={styles.modeStatItem}>
                    <Text style={styles.modeStatLabel}>Players</Text>
                    <Text style={styles.modeStatValue}>{mode.participants.toLocaleString()}</Text>
                  </View>
                </View>

                <TouchableOpacity style={styles.viewContestsButton} onPress={onLogin}>
                  <Text style={styles.viewContestsText}>View Contests</Text>
                </TouchableOpacity>
              </CardContent>
            </Card>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>How It Works</Text>
          <Text style={styles.sectionSubtitle}>Start competing in just 4 simple steps</Text>

          <View style={styles.stepsContainer}>
            {howItWorks.map((item, index) => (
              <View key={index} style={styles.stepItem}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>{item.step}</Text>
                </View>
                <Text style={styles.stepTitle}>{item.title}</Text>
                <Text style={styles.stepDescription}>{item.description}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={[styles.section, styles.sectionGray]}>
          <Text style={styles.sectionTitle}>What Traders Say</Text>
          <Text style={styles.sectionSubtitle}>
            Join thousands of successful traders competing on our platform
          </Text>

          {testimonials.map((testimonial, index) => (
            <Card key={index} style={styles.testimonialCard}>
              <CardContent style={styles.testimonialContent}>
                <View style={styles.starsRow}>
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Ionicons key={i} name="star" size={16} color="#FBBF24" />
                  ))}
                </View>
                <Text style={styles.testimonialText}>"{testimonial.text}"</Text>
                <View style={styles.testimonialAuthor}>
                  <View style={[styles.authorAvatar, { backgroundColor: testimonial.color }]}>
                    <Text style={styles.authorInitials}>{testimonial.initials}</Text>
                  </View>
                  <View>
                    <Text style={styles.authorName}>{testimonial.name}</Text>
                    <Text style={styles.authorRole}>{testimonial.role}</Text>
                  </View>
                </View>
              </CardContent>
            </Card>
          ))}
        </View>

        <LinearGradient colors={gradients.financial} style={styles.ctaSection}>
          <Text style={styles.ctaTitle}>Ready to Start Trading?</Text>
          <Text style={styles.ctaSubtitle}>
            Join thousands of traders competing for real prizes with virtual portfolios
          </Text>

          <View style={styles.ctaButtons}>
            <Button
              title="Start Competing Now"
              onPress={onRegister}
              size="lg"
              fullWidth
              style={styles.primaryButton}
              textStyle={styles.primaryButtonText}
              icon={<Ionicons name="trophy" size={20} color={colors.text} />}
            />
            <Button
              title="Learn More"
              onPress={() => {}}
              variant="outline"
              size="lg"
              fullWidth
              style={styles.secondaryButton}
              textStyle={styles.secondaryButtonText}
            />
          </View>

          <Text style={styles.ctaNote}>No credit card required • Free to start • Real prizes</Text>
        </LinearGradient>

        <View style={styles.footer}>
          <View style={styles.footerLogoRow}>
            <Ionicons name="trending-up" size={24} color={colors.primary} />
            <Text style={styles.footerLogo}>FinanceFantasy</Text>
          </View>
          <Text style={styles.footerText}>
            The premier fantasy finance platform for virtual trading competitions
          </Text>

          <View style={styles.footerLinks}>
            <View style={styles.footerLinkSection}>
              <Text style={styles.footerLinkTitle}>Platform</Text>
              <TouchableOpacity><Text style={styles.footerLink}>Contests</Text></TouchableOpacity>
              <TouchableOpacity><Text style={styles.footerLink}>Leaderboards</Text></TouchableOpacity>
              <TouchableOpacity><Text style={styles.footerLink}>Pricing</Text></TouchableOpacity>
            </View>
            <View style={styles.footerLinkSection}>
              <Text style={styles.footerLinkTitle}>Support</Text>
              <TouchableOpacity><Text style={styles.footerLink}>Help Center</Text></TouchableOpacity>
              <TouchableOpacity><Text style={styles.footerLink}>Contact Us</Text></TouchableOpacity>
              <TouchableOpacity><Text style={styles.footerLink}>FAQ</Text></TouchableOpacity>
            </View>
          </View>

          <View style={styles.footerBottom}>
            <Text style={styles.footerCopyright}>© 2024 FinanceFantasy. All rights reserved.</Text>
            <View style={styles.footerBottomLinks}>
              <TouchableOpacity><Text style={styles.footerBottomLink}>Privacy</Text></TouchableOpacity>
              <TouchableOpacity><Text style={styles.footerBottomLink}>Terms</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  heroSection: {
    paddingBottom: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoText: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.textOnPrimary,
    marginLeft: spacing.sm,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  signInText: {
    fontSize: fontSize.md,
    color: colors.textOnPrimary,
    fontWeight: fontWeight.medium,
  },
  heroContent: {
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
  },
  heroTitle: {
    fontSize: fontSize.xxxl,
    fontWeight: fontWeight.bold,
    color: colors.textOnPrimary,
    textAlign: 'center',
  },
  heroAmount: {
    fontSize: 48,
    fontWeight: fontWeight.bold,
    color: colors.accent,
    marginTop: spacing.sm,
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
    marginTop: spacing.lg,
    lineHeight: 24,
    paddingHorizontal: spacing.md,
  },
  heroButtons: {
    width: '100%',
    marginTop: spacing.xl,
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
  statsBar: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    marginTop: spacing.lg,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.accent,
  },
  statLabel: {
    fontSize: fontSize.xs,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  section: {
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  sectionGray: {
    backgroundColor: colors.gray[50],
  },
  sectionTitle: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  sectionSubtitle: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.md,
  },
  contestCard: {
    marginBottom: spacing.lg,
  },
  contestCardContent: {
    padding: spacing.lg,
  },
  contestHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  contestIconContainer: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  contestHeaderText: {
    flex: 1,
  },
  contestTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  contestDescription: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  contestDetails: {
    marginBottom: spacing.lg,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  detailDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.success,
    marginRight: spacing.sm,
  },
  detailText: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
  contestStats: {
    backgroundColor: colors.gray[50],
    borderRadius: borderRadius.md,
    padding: spacing.md,
  },
  contestStatRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  contestStatLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  contestStatValue: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  modeCard: {
    marginBottom: spacing.md,
  },
  modeCardContent: {
    padding: spacing.md,
  },
  modeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  modeIconContainer: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primaryLight + '30',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  modeHeaderText: {
    flex: 1,
  },
  modeName: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  modeDescription: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  modeStats: {
    flexDirection: 'row',
    marginBottom: spacing.md,
  },
  modeStatItem: {
    flex: 1,
  },
  modeStatLabel: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
  modeStatValue: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  viewContestsButton: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  viewContestsText: {
    fontSize: fontSize.md,
    color: colors.primary,
    fontWeight: fontWeight.medium,
  },
  stepsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  stepItem: {
    width: '50%',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    marginBottom: spacing.xl,
  },
  stepNumber: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  stepNumberText: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.textOnPrimary,
  },
  stepTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  stepDescription: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  testimonialCard: {
    marginBottom: spacing.md,
  },
  testimonialContent: {
    padding: spacing.lg,
  },
  starsRow: {
    flexDirection: 'row',
    marginBottom: spacing.md,
  },
  testimonialText: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    fontStyle: 'italic',
    lineHeight: 24,
    marginBottom: spacing.lg,
  },
  testimonialAuthor: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  authorAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  authorInitials: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.textOnPrimary,
  },
  authorName: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  authorRole: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  ctaSection: {
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
  },
  ctaTitle: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.textOnPrimary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  ctaSubtitle: {
    fontSize: fontSize.md,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.md,
  },
  ctaButtons: {
    width: '100%',
    gap: spacing.md,
  },
  ctaNote: {
    fontSize: fontSize.sm,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    marginTop: spacing.lg,
  },
  footer: {
    backgroundColor: colors.gray[50],
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  footerLogoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  footerLogo: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.primary,
    marginLeft: spacing.sm,
  },
  footerText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.xl,
  },
  footerLinks: {
    flexDirection: 'row',
    marginBottom: spacing.xl,
  },
  footerLinkSection: {
    flex: 1,
  },
  footerLinkTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    marginBottom: spacing.md,
  },
  footerLink: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  footerBottom: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerCopyright: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
  },
  footerBottomLinks: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  footerBottomLink: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
  },
});
