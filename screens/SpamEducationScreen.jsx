// screens/SpamEducationScreen.jsx
// TechQuest — Spam Education: standalone full-screen learning hub for seniors

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppContext } from '../context/AppContext';
import { askAboutEmail } from '../services/groqService';
import { Colors, FontFamily, FontSize, Spacing, Radius, TouchTarget } from '../constants/theme';

// ─── Hardcoded data ────────────────────────────────────────────────────────────

const SPAM_EXAMPLES = [
  {
    id: 'spam-1',
    sender: 'PayPal Security',
    initials: 'PP',
    avatarColor: '#003087',
    subject: 'URGENT: Your account will be closed in 24 hours!',
    body: 'Dear Valued Customer, We have detected suspicious activity on your PayPal account. You must verify your information immediately or your account will be permanently suspended. Click here to confirm your details now.',
    warnings: ['Fake urgency', 'Threatens account closure', 'Asks you to click a link', 'Not from real PayPal'],
  },
  {
    id: 'spam-2',
    sender: 'Medicare Benefits',
    initials: 'MB',
    avatarColor: '#1565C0',
    subject: 'You have unclaimed Medicare benefits — act now',
    body: 'You are eligible for a $800 Medicare benefit refund. To receive your payment, please provide your Medicare ID number and bank account details so we can process the transfer within 48 hours.',
    warnings: ['Asks for bank details', 'Too good to be true', 'Fake government sender', 'Requests Medicare ID'],
  },
  {
    id: 'spam-3',
    sender: 'Apple ID Team',
    initials: 'AI',
    avatarColor: '#555555',
    subject: 'Your Apple ID has been locked — verify immediately',
    body: 'We noticed your Apple ID was used to sign in from an unknown device in Russia. If this was not you, click the link below to unlock your account. Failure to respond in 12 hours will result in permanent deletion.',
    warnings: ['Fear tactic', 'Fake Apple sender', 'Suspicious location claim', 'Threatening deadline'],
  },
  {
    id: 'spam-4',
    sender: 'IRS Tax Refund',
    initials: 'IR',
    avatarColor: '#C62828',
    subject: 'You have a pending tax refund of $1,240',
    body: 'The Internal Revenue Service has calculated you are owed a tax refund of $1,240.00. To process your refund, please confirm your Social Security Number and direct deposit information using the secure form linked below.',
    warnings: ['IRS never emails refunds', 'Asks for Social Security Number', 'Fake government email', 'Financial scam'],
  },
  {
    id: 'spam-5',
    sender: 'Your Bank Alert',
    initials: 'BA',
    avatarColor: '#1B5E20',
    subject: 'Suspicious transaction detected on your account',
    body: 'A transaction of $499.99 was attempted on your debit card. If you did not authorize this, please click the link below and log in to freeze your card immediately. This link expires in 30 minutes.',
    warnings: ['Creates panic', 'Fake time pressure', 'Asks you to log in via link', 'Not from real bank'],
  },
];

const RED_FLAGS = [
  "Urgent or threatening language — 'Act now or lose your account'",
  'Asks for your password, Social Security Number or bank details',
  'Sender address looks wrong — e.g. paypa1.com instead of paypal.com',
  "Generic greeting like 'Dear Customer' instead of your name",
  'Suspicious links — hover or long-press to see where they really go',
  'Promises of money, prizes or refunds you never signed up for',
  'Poor spelling and grammar throughout the email',
  'Requests to click a link and log in to verify your account',
];

const CONTACT_CARDS = [
  {
    id: 'contact-1',
    emoji: '🏛️',
    title: 'Report to the FTC',
    description: 'The Federal Trade Commission handles fraud reports. Visit reportfraud.ftc.gov to file a free report.',
    action: 'url',
    url: 'https://reportfraud.ftc.gov',
  },
  {
    id: 'contact-2',
    emoji: '🌐',
    title: 'Report to the FBI (IC3)',
    description: "The FBI's Internet Crime Complaint Center tracks online scams. Visit ic3.gov to file a complaint.",
    action: 'url',
    url: 'https://www.ic3.gov',
  },
  {
    id: 'contact-3',
    emoji: '📧',
    title: "Use your email's spam button",
    description: "In Gmail or Outlook, open the email and tap 'Report Spam' or 'Junk'. This helps protect everyone.",
    action: 'alert',
    alertTitle: "Use your email's spam button",
    alertMsg: "Open your email app, find the suspicious email, and look for a 'Spam' or 'Junk' button.",
  },
  {
    id: 'contact-4',
    emoji: '👨‍👩‍👧',
    title: 'Ask a family member',
    description: 'When in doubt, forward the email to someone you trust. A family member or friend can help you decide.',
    action: 'alert',
    alertTitle: 'Ask a family member',
    alertMsg: 'Forward the email to a trusted family member or friend and ask for their opinion.',
  },
];

// ─── Sub-components ────────────────────────────────────────────────────────────

function SectionHeading({ title }) {
  return <Text style={styles.sectionHeading}>{title}</Text>;
}

function SpamExampleCard({ item }) {
  return (
    <View style={styles.emailCard}>
      {/* Row 1: Avatar + sender name + SUSPICIOUS badge */}
      <View style={styles.senderRow}>
        <View style={styles.senderLeft}>
          <View style={[styles.avatar, { backgroundColor: item.avatarColor }]}>
            <Text style={styles.avatarText}>{item.initials}</Text>
          </View>
          <Text style={styles.senderName} numberOfLines={1}>{item.sender}</Text>
        </View>
        <View style={styles.suspiciousBadge}>
          <Text style={styles.suspiciousText}>SUSPICIOUS</Text>
        </View>
      </View>

      {/* Row 2: Subject */}
      <Text style={styles.emailSubject}>{item.subject}</Text>

      {/* Row 3: Body preview */}
      <Text style={styles.emailBody} numberOfLines={3}>{item.body}</Text>

      {/* Row 4: Warning pills — horizontal scroll */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.warningScroll}
        contentContainerStyle={styles.warningScrollContent}
      >
        {item.warnings.map((w, idx) => (
          <View key={idx} style={styles.warningPill}>
            <Text style={styles.warningPillText}>{w}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

function RedFlagRow({ text, isLast }) {
  return (
    <View style={[styles.flagRow, !isLast && styles.flagRowBorder]}>
      <View style={styles.warningCircle}>
        <Text style={styles.warningEmoji}>⚠️</Text>
      </View>
      <Text style={styles.flagText}>{text}</Text>
    </View>
  );
}

// ─── Main Screen ───────────────────────────────────────────────────────────────

export default function SpamEducationScreen() {
  const { logSpamLesson } = useAppContext();
  const [emailInput, setEmailInput] = useState('');
  const [aiAnswer, setAiAnswer] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Log view on mount — fails silently via AppContext wrapper
  useEffect(() => {
    logSpamLesson?.();
  }, []);

  // Defined outside return() per stability rules
  const handleCheckEmail = async () => {
    const trimmed = emailInput.trim();
    if (!trimmed || isLoading) return;
    setIsLoading(true);
    setAiAnswer(null);
    const reply = await askAboutEmail(trimmed);
    setAiAnswer(reply);
    setIsLoading(false);
  };

  const handleContactPress = (card) => {
    if (card.action === 'url') {
      Linking.openURL(card.url);
    } else {
      Alert.alert(card.alertTitle, card.alertMsg);
    }
  };

  const handleThisHelped = () => {
    Alert.alert('Great!', 'We are glad the assistant was helpful. Stay safe out there! 🛡️');
  };

  const handleStillUnsure = () => {
    Alert.alert('Good choice!', 'Forwarding to a trusted family member is always the smartest move. Stay safe!');
  };

  return (
    <View style={styles.screen}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >

          {/* ━━ SECTION A: Header ━━ */}
          <View style={styles.header}>
            <Text style={styles.headerIcon} accessibilityLabel="Shield icon">🛡️</Text>
            <Text style={styles.headerTitle}>Learn to spot spam</Text>
            <Text style={styles.headerSubtitle}>
              Real examples of scam emails and what to do about them
            </Text>
          </View>

          {/* ━━ SECTION B: Fake email examples ━━ */}
          <SectionHeading title="What spam looks like" />
          {SPAM_EXAMPLES.map((item) => (
            <SpamExampleCard key={item.id} item={item} />
          ))}

          {/* ━━ SECTION C: Red flags checklist ━━ */}
          <SectionHeading title="Red flags to always watch for" />
          <View style={styles.flagsList}>
            {RED_FLAGS.map((flag, idx) => (
              <RedFlagRow
                key={idx}
                text={flag}
                isLast={idx === RED_FLAGS.length - 1}
              />
            ))}
          </View>

          {/* ━━ SECTION D: Who to contact ━━ */}
          <SectionHeading title="Who to contact if you receive spam" />
          {CONTACT_CARDS.map((card) => (
            <TouchableOpacity
              key={card.id}
              style={styles.contactCard}
              onPress={() => handleContactPress(card)}
              activeOpacity={0.85}
              accessibilityLabel={card.title}
              accessibilityRole="button"
            >
              <View style={styles.contactTop}>
                <Text style={styles.contactEmoji}>{card.emoji}</Text>
                <Text style={styles.contactTitle}>{card.title}</Text>
              </View>
              <Text style={styles.contactDescription}>{card.description}</Text>
              <View style={styles.contactOpenRow}>
                <View style={styles.openBtn}>
                  <Text style={styles.openBtnText}>Open →</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}

          {/* ━━ SECTION E: AI mini-chat ━━ */}
          <SectionHeading title="Ask our safety assistant" />
          <Text style={styles.aiSubheading}>
            Paste part of a suspicious email and ask if it's safe
          </Text>

          <View style={styles.aiCard}>
            <TextInput
              style={styles.aiInput}
              placeholder="Paste text from the suspicious email here..."
              placeholderTextColor={Colors.textSecondary}
              multiline
              value={emailInput}
              onChangeText={setEmailInput}
              textAlignVertical="top"
              editable={!isLoading}
            />

            <TouchableOpacity
              style={[styles.aiButton, isLoading && styles.aiButtonDisabled]}
              onPress={handleCheckEmail}
              disabled={isLoading}
              activeOpacity={0.85}
              accessibilityLabel="Check email with AI assistant"
              accessibilityRole="button"
            >
              {isLoading ? (
                <ActivityIndicator color={Colors.background} size="small" />
              ) : (
                <Text style={styles.aiButtonText}>Check this with AI</Text>
              )}
            </TouchableOpacity>

            {aiAnswer !== null && (
              <>
                <View style={styles.aiAnswerCard}>
                  <Text style={styles.aiAnswerText}>{aiAnswer}</Text>
                </View>
                <View style={styles.aiFeedbackRow}>
                  <TouchableOpacity
                    style={styles.helpedBtn}
                    onPress={handleThisHelped}
                    activeOpacity={0.8}
                    accessibilityLabel="This answer helped me"
                    accessibilityRole="button"
                  >
                    <Text style={styles.helpedBtnText}>This helped</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.unsureBtn}
                    onPress={handleStillUnsure}
                    activeOpacity={0.8}
                    accessibilityLabel="Still unsure, call family"
                    accessibilityRole="button"
                  >
                    <Text style={styles.unsureBtnText}>Still unsure — call family</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>

          {/* Bottom safe-area padding */}
          <View style={{ height: 48 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  safeArea: { flex: 1 },
  scrollContent: { paddingBottom: Spacing.xl },

  // ── Section A — Header ──
  header: {
    backgroundColor: Colors.primary,
    paddingVertical: 32,
    paddingHorizontal: Spacing.xl,
  },
  headerIcon: {
    fontSize: 36,
    marginBottom: Spacing.sm,
  },
  headerTitle: {
    fontFamily: FontFamily.headingBold,
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: Spacing.xs,
  },
  headerSubtitle: {
    fontFamily: FontFamily.body,
    fontSize: 18,
    color: 'rgba(255,255,255,0.85)',
    lineHeight: 28,
  },

  // ── Section headings ──
  sectionHeading: {
    fontFamily: FontFamily.headingBold,
    fontSize: FontSize.sectionHeader,   // 22px
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: 28,
    marginHorizontal: Spacing.xl,
    marginBottom: Spacing.sm,
  },

  // ── Section B — Email cards ──
  emailCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.lg,           // 16
    padding: Spacing.xl,               // 20
    marginHorizontal: Spacing.xl,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    // Raised card shadow
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  senderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  senderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: Spacing.sm,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
    flexShrink: 0,
  },
  avatarText: {
    fontFamily: FontFamily.bodyBold,
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  senderName: {
    fontFamily: FontFamily.bodyBold,
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    flex: 1,
  },
  suspiciousBadge: {
    backgroundColor: '#FF4444',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 99,
    flexShrink: 0,
  },
  suspiciousText: {
    fontFamily: FontFamily.bodyBold,
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  emailSubject: {
    fontFamily: FontFamily.bodyBold,
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    marginTop: 12,
    lineHeight: 26,
  },
  emailBody: {
    fontFamily: FontFamily.body,
    fontSize: 16,
    color: '#666666',
    marginTop: 6,
    lineHeight: 24,
  },
  warningScroll: { marginTop: 12 },
  warningScrollContent: { paddingRight: Spacing.xl },
  warningPill: {
    backgroundColor: '#FF4444',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 99,
    marginRight: 8,
  },
  warningPillText: {
    fontFamily: FontFamily.bodyBold,
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: '700',
  },

  // ── Section C — Red flags ──
  flagsList: {
    marginHorizontal: Spacing.xl,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  flagRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 14,
    paddingHorizontal: Spacing.xl,
  },
  flagRowBorder: {
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.border,
  },
  warningCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,68,68,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  warningEmoji: { fontSize: 14 },
  flagText: {
    fontFamily: FontFamily.body,
    fontSize: 18,
    color: Colors.textPrimary,
    marginLeft: 14,
    flex: 1,
    lineHeight: 26,
  },

  // ── Section D — Contact cards ──
  contactCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.lg,
    padding: Spacing.xl,
    marginHorizontal: Spacing.xl,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  contactTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  contactEmoji: {
    fontSize: 32,
    marginRight: Spacing.md,
  },
  contactTitle: {
    fontFamily: FontFamily.bodyBold,
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    flex: 1,
  },
  contactDescription: {
    fontFamily: FontFamily.body,
    fontSize: 16,
    color: '#666666',
    lineHeight: 24,
    marginTop: Spacing.xs,
  },
  contactOpenRow: {
    alignItems: 'flex-end',
    marginTop: Spacing.md,
  },
  openBtn: {
    backgroundColor: Colors.primary,
    minHeight: 44,
    paddingHorizontal: 16,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  openBtnText: {
    fontFamily: FontFamily.bodyBold,
    fontSize: 16,
    color: Colors.background,
    fontWeight: '700',
  },

  // ── Section E — AI chat ──
  aiSubheading: {
    fontFamily: FontFamily.body,
    fontSize: 16,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
    marginHorizontal: Spacing.xl,
    marginBottom: Spacing.md,
    lineHeight: 24,
  },
  aiCard: {
    marginHorizontal: Spacing.xl,
    borderRadius: Radius.lg,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    gap: Spacing.md,
  },
  aiInput: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
    fontSize: 16,
    fontFamily: FontFamily.body,
    color: Colors.textPrimary,
    minHeight: 100,
    textAlignVertical: 'top',
    backgroundColor: Colors.background,
    lineHeight: 24,
  },
  aiButton: {
    minHeight: TouchTarget.min,   // 56px
    borderRadius: 12,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: Spacing.xl,
  },
  aiButtonDisabled: { opacity: 0.5 },
  aiButtonText: {
    fontFamily: FontFamily.headingBold,
    fontSize: 18,
    fontWeight: '700',
    color: Colors.background,
  },
  aiAnswerCard: {
    borderRadius: 12,
    backgroundColor: 'rgba(78,203,160,0.10)',
    borderLeftWidth: 4,
    borderLeftColor: Colors.success,
    padding: 16,
  },
  aiAnswerText: {
    fontFamily: FontFamily.body,
    fontSize: 18,
    color: Colors.textPrimary,
    lineHeight: 28,
  },
  aiFeedbackRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  helpedBtn: {
    flex: 1,
    minHeight: 48,
    borderRadius: Radius.md,
    borderWidth: 2,
    borderColor: Colors.success,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
  },
  helpedBtnText: {
    fontFamily: FontFamily.bodyBold,
    fontSize: 16,
    color: Colors.success,
    fontWeight: '700',
  },
  unsureBtn: {
    flex: 1,
    minHeight: 48,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xs,
    paddingVertical: Spacing.xs,
  },
  unsureBtnText: {
    fontFamily: FontFamily.body,
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});
