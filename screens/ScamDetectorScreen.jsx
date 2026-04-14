// screens/ScamDetectorScreen.jsx
// TechQuest — Scam Check + Spam Education (tabbed view)

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppContext } from '../context/AppContext';
import { analyzeScam, askAboutSpam } from '../services/groqService';
import { Colors, FontFamily, FontSize, Spacing, Radius, TouchTarget } from '../constants/theme';

// ─── Shared: Segmented Tab Control ──────────────────────────────────────────
function TabSegment({ activeTab, onTabChange }) {
  const TABS = [
    { id: 'check', label: '🔍  Check' },
    { id: 'learn', label: '🏫  Learn' },
  ];
  return (
    <View style={segStyles.wrapper}>
      {TABS.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <TouchableOpacity
            key={tab.id}
            style={[segStyles.tab, isActive && segStyles.tabActive]}
            onPress={() => onTabChange(tab.id)}
            activeOpacity={0.8}
            accessibilityLabel={tab.label}
          >
            <Text style={[segStyles.tabText, isActive && segStyles.tabTextActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const segStyles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: Radius.full,
    padding: 4,
    marginVertical: Spacing.lg,
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: Radius.full,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: Colors.primary,
  },
  tabText: {
    fontFamily: FontFamily.bodyBold,
    fontSize: 15,
    color: Colors.textSecondary,
  },
  tabTextActive: {
    color: Colors.background,
  },
});

// ─── TAB 1: Check a Message ──────────────────────────────────────────────────
const VERDICT_CONFIG = {
  SCAM: {
    banner: '⚠️  THIS IS A SCAM',
    bannerColor: '#FF4444',
    borderColor: 'rgba(255,68,68,0.5)',
    bannerBg: 'rgba(255,68,68,0.12)',
  },
  SUSPICIOUS: {
    banner: '⚠️  BE CAREFUL',
    bannerColor: Colors.secondary,
    borderColor: Colors.secondary,
    bannerBg: 'rgba(255,123,92,0.12)',
  },
  SAFE: {
    banner: '✓  LOOKS SAFE',
    bannerColor: Colors.success,
    borderColor: Colors.success,
    bannerBg: 'rgba(78,203,160,0.12)',
  },
};

const RISK_COLORS = {
  HIGH:   { bg: 'rgba(255,68,68,0.18)',   text: '#FF4444' },
  MEDIUM: { bg: 'rgba(255,123,92,0.18)',  text: Colors.secondary },
  LOW:    { bg: 'rgba(78,203,160,0.18)',  text: Colors.success },
};

function RiskChip({ level }) {
  const cfg = RISK_COLORS[level] || RISK_COLORS.MEDIUM;
  return (
    <View style={[rcStyles.chip, { backgroundColor: cfg.bg }]}>
      <Text style={[rcStyles.text, { color: cfg.text }]}>Risk: {level}</Text>
    </View>
  );
}
const rcStyles = StyleSheet.create({
  chip: { alignSelf: 'flex-start', paddingHorizontal: Spacing.md, paddingVertical: 4, borderRadius: Radius.full },
  text: { fontFamily: FontFamily.mono, fontSize: 12, letterSpacing: 0.5 },
});

function ResultCard({ result, onCheckAnother }) {
  const cfg = VERDICT_CONFIG[result.verdict] || VERDICT_CONFIG.SUSPICIOUS;
  const showWarnings = (result.verdict === 'SCAM' || result.verdict === 'SUSPICIOUS') &&
    result.warning_signs?.length > 0;
  return (
    <View style={[rdStyles.card, { borderColor: cfg.borderColor }]}>
      <View style={[rdStyles.banner, { backgroundColor: cfg.bannerBg }]}>
        <Text style={[rdStyles.bannerText, { color: cfg.bannerColor }]}>{cfg.banner}</Text>
      </View>
      <RiskChip level={result.risk_level} />
      <View style={rdStyles.section}>
        <Text style={rdStyles.sectionLabel}>What this means:</Text>
        <Text style={rdStyles.bodyText}>{result.explanation}</Text>
      </View>
      {showWarnings && (
        <View style={rdStyles.section}>
          <Text style={[rdStyles.sectionLabel, { color: Colors.secondary }]}>Warning signs:</Text>
          {result.warning_signs.map((sign, i) => (
            <View key={i} style={rdStyles.bulletRow}>
              <Text style={rdStyles.bullet}>•</Text>
              <Text style={rdStyles.bodyText}>{sign}</Text>
            </View>
          ))}
        </View>
      )}
      <View style={rdStyles.section}>
        <Text style={rdStyles.sectionLabel}>What to do:</Text>
        <Text style={rdStyles.bodyText}>{result.what_to_do}</Text>
      </View>
      <TouchableOpacity style={rdStyles.anotherBtn} onPress={onCheckAnother} activeOpacity={0.8} accessibilityLabel="Check another message">
        <Text style={rdStyles.anotherBtnText}>Check Another Message</Text>
      </TouchableOpacity>
    </View>
  );
}

const rdStyles = StyleSheet.create({
  card: { backgroundColor: Colors.surface, borderRadius: Radius.lg, borderWidth: 2, padding: Spacing.lg, gap: Spacing.lg, marginBottom: Spacing.xl },
  banner: { borderRadius: Radius.md, paddingVertical: Spacing.md, paddingHorizontal: Spacing.lg, alignItems: 'center' },
  bannerText: { fontFamily: FontFamily.headingExtraBold, fontSize: 24, textAlign: 'center' },
  section: { gap: Spacing.xs },
  sectionLabel: { fontFamily: FontFamily.bodyBold, fontSize: 16, color: Colors.primary },
  bodyText: { fontFamily: FontFamily.body, fontSize: FontSize.body, color: Colors.textPrimary, lineHeight: FontSize.body * 1.6 },
  bulletRow: { flexDirection: 'row', gap: Spacing.sm, alignItems: 'flex-start' },
  bullet: { fontFamily: FontFamily.body, fontSize: FontSize.body, color: Colors.secondary, lineHeight: FontSize.body * 1.6 },
  anotherBtn: { height: TouchTarget.min, borderRadius: Radius.full, borderWidth: 2, borderColor: Colors.primary, alignItems: 'center', justifyContent: 'center', marginTop: Spacing.sm },
  anotherBtnText: { fontFamily: FontFamily.bodyBold, fontSize: FontSize.button, color: Colors.primary },
});

function HistoryRow({ item }) {
  const [expanded, setExpanded] = useState(false);
  const colorMap = { SCAM: '#FF4444', SUSPICIOUS: Colors.secondary, SAFE: Colors.success };
  const color = colorMap[item.verdict] || Colors.textSecondary;
  const preview = item.inputText?.slice(0, 60) + (item.inputText?.length > 60 ? '...' : '');
  return (
    <TouchableOpacity style={hrStyles.row} onPress={() => setExpanded((e) => !e)} activeOpacity={0.8}>
      <View style={hrStyles.topRow}>
        <View style={[hrStyles.chip, { backgroundColor: `${color}20` }]}>
          <Text style={[hrStyles.chipText, { color }]}>{item.verdict}</Text>
        </View>
        <Text style={hrStyles.time}>{item.timestamp}</Text>
      </View>
      <Text style={hrStyles.preview}>{expanded ? item.inputText : preview}</Text>
      {expanded && <Text style={hrStyles.explanation}>{item.explanation}</Text>}
    </TouchableOpacity>
  );
}
const hrStyles = StyleSheet.create({
  row: { backgroundColor: Colors.surface, borderRadius: Radius.md, padding: Spacing.lg, gap: Spacing.sm },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  chip: { paddingHorizontal: Spacing.md, paddingVertical: 3, borderRadius: Radius.full },
  chipText: { fontFamily: FontFamily.mono, fontSize: 12, letterSpacing: 0.5 },
  time: { fontFamily: FontFamily.body, fontSize: FontSize.caption, color: Colors.textSecondary },
  preview: { fontFamily: FontFamily.body, fontSize: 16, color: Colors.textSecondary, lineHeight: 24 },
  explanation: { fontFamily: FontFamily.body, fontSize: 16, color: Colors.textPrimary, lineHeight: 24, marginTop: Spacing.xs },
});

function CheckMessageView() {
  const { scamHistory, saveScamToHistory } = useAppContext();
  const [inputText, setInputText] = useState('');
  const [result, setResult] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);
  const scrollRef = useRef(null);

  const handleCheck = async () => {
    const trimmed = inputText.trim();
    if (!trimmed || analyzing) return;
    setAnalyzing(true);
    setResult(null);
    const analysis = await analyzeScam(trimmed);
    setResult(analysis);
    await saveScamToHistory(trimmed, analysis.verdict, analysis.explanation, analysis.risk_level);
    setAnalyzing(false);
    setTimeout(() => scrollRef.current?.scrollTo({ y: 360, animated: true }), 200);
  };

  const handleCheckAnother = () => {
    setInputText('');
    setResult(null);
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  };

  const displayHistory = scamHistory.slice(0, 10);

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={checkStyles.content}
        keyboardShouldPersistTaps="handled"
      >
        <View style={checkStyles.inputCard}>
          <Text style={checkStyles.inputLabel}>Paste the suspicious message here:</Text>
          <TextInput
            style={[checkStyles.textArea, inputFocused && checkStyles.textAreaFocused]}
            multiline
            placeholder="e.g. You have won a prize! Call this number to claim..."
            placeholderTextColor={Colors.textSecondary}
            value={inputText}
            onChangeText={setInputText}
            onFocus={() => setInputFocused(true)}
            onBlur={() => setInputFocused(false)}
            textAlignVertical="top"
            editable={!analyzing}
          />
          <TouchableOpacity
            style={[checkStyles.checkBtn, (!inputText.trim() || analyzing) && checkStyles.checkBtnDisabled]}
            onPress={handleCheck}
            disabled={!inputText.trim() || analyzing}
            activeOpacity={0.85}
            accessibilityLabel="Check this message for scam"
          >
            {analyzing ? (
              <>
                <ActivityIndicator color={Colors.background} size="small" />
                <Text style={checkStyles.checkBtnText}>  Analyzing...</Text>
              </>
            ) : (
              <Text style={checkStyles.checkBtnText}>Check Message 🔍</Text>
            )}
          </TouchableOpacity>
        </View>

        {result && <ResultCard result={result} onCheckAnother={handleCheckAnother} />}

        <Text style={checkStyles.historyTitle}>Your Recent Checks</Text>
        {displayHistory.length === 0 ? (
          <Text style={checkStyles.emptyText}>No checks yet. Stay safe out there! 🛡️</Text>
        ) : (
          <View style={checkStyles.historyList}>
            {displayHistory.map((item, i) => (
              <React.Fragment key={item.id}>
                <HistoryRow item={item} />
                {i < displayHistory.length - 1 && <View style={checkStyles.divider} />}
              </React.Fragment>
            ))}
          </View>
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const checkStyles = StyleSheet.create({
  content: { gap: Spacing.lg, paddingBottom: Spacing.xl },
  inputCard: { backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.xl, gap: Spacing.md },
  inputLabel: { fontFamily: FontFamily.bodyBold, fontSize: FontSize.body, color: Colors.textPrimary, lineHeight: FontSize.body * 1.4 },
  textArea: { backgroundColor: Colors.background, borderRadius: Radius.md, borderWidth: 2, borderColor: Colors.border, padding: Spacing.lg, fontFamily: FontFamily.body, fontSize: FontSize.body, color: Colors.textPrimary, minHeight: 120, lineHeight: FontSize.body * 1.5 },
  textAreaFocused: { borderColor: Colors.primary },
  checkBtn: { height: TouchTarget.min, backgroundColor: Colors.primary, borderRadius: Radius.lg, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  checkBtnDisabled: { opacity: 0.4 },
  checkBtnText: { fontFamily: FontFamily.headingExtraBold, fontSize: 20, color: Colors.background, letterSpacing: 0.3 },
  historyTitle: { fontFamily: FontFamily.headingBold, fontSize: 20, color: Colors.textPrimary },
  emptyText: { fontFamily: FontFamily.body, fontSize: FontSize.body, color: Colors.textSecondary, textAlign: 'center', paddingVertical: Spacing.xl, lineHeight: FontSize.body * 1.6 },
  historyList: { backgroundColor: Colors.surface, borderRadius: Radius.lg, overflow: 'hidden' },
  divider: { height: 1, backgroundColor: Colors.border, marginHorizontal: Spacing.lg },
});

// ─── TAB 2: Learn — Spot Scams ───────────────────────────────────────────────
const MOCK_EMAILS = [
  {
    id: 'email-1',
    sender: 'Bank Security <alert@bankalert-update123.com>',
    subject: '⚠️ URGENT: Your account has been suspended!',
    preview: 'Dear customer, your account will be closed in 24 hours unless you click here to verify your password immediately.',
    flags: ['Fake urgent language', 'Suspicious link', 'Asks for password'],
  },
  {
    id: 'email-2',
    sender: 'IRS Official <refund@irs-tax-notice.net>',
    subject: 'You have a pending tax refund of $1,450',
    preview: 'Click the link below and enter your Social Security Number and bank details so we can wire your refund today.',
    flags: ['Too good to be true', 'Asks for SSN', 'Not a .gov address'],
  },
  {
    id: 'email-3',
    sender: 'FedEx Tracking <no-reply@fedex-tracker-update.com>',
    subject: 'Action Required: Unpaid delivery fee',
    preview: 'Your package could not be delivered due to an unpaid fee of $2.99. Click here immediately to release your package.',
    flags: ['Unexpected package', 'Small suspicious fee', 'Fake sender address'],
  },
  {
    id: 'email-4',
    sender: 'Geek Squad Support <support@geeksquad-billing.com>',
    subject: 'Your anti-virus subscription auto-renewed ($399.99)',
    preview: 'Thank you for your purchase! If you did not authorize this charge, call 1-800-XXX-XXXX immediately to cancel.',
    flags: ['Fake high charge', 'Urgent phone number', 'Scare tactic'],
  },
  {
    id: 'email-5',
    sender: 'Medicare Benefits <info@medicare-center-us.com>',
    subject: 'Claim your free medical device before deadline!',
    preview: 'You qualify for a FREE back brace, knee brace, and more under your Medicare benefits. Reply with your Medicare ID to claim.',
    flags: ['Asks for Medicare ID', 'Too good to be true', 'Unofficial domain'],
  },
];

const CHECKLIST = [
  { flag: 'Urgent or threatening language (e.g. "Act now! Account closing!")' },
  { flag: 'Asks for your password, Social Security Number, or bank details' },
  { flag: 'Misspelled or strange sender address (e.g. "irs-tax-notice.net" not ".gov")' },
  { flag: 'Too good to be true offers — free prizes, big refunds, free devices' },
  { flag: 'Generic greetings like "Dear customer" instead of your name' },
  { flag: 'Requests payment via gift cards, wire transfer, or cryptocurrency' },
  { flag: 'Links or buttons that lead to suspicious-looking websites' },
  { flag: 'Pressure to respond immediately or something bad will happen' },
];

function LearnView() {
  const { logSpamLesson } = useAppContext();
  const [chatInput, setChatInput] = useState('');
  const [chatResponse, setChatResponse] = useState(null);
  const [isAsking, setIsAsking] = useState(false);

  useEffect(() => {
    logSpamLesson?.();
  }, []);

  const handleAsk = async () => {
    if (!chatInput.trim() || isAsking) return;
    setIsAsking(true);
    setChatResponse(null);
    const reply = await askAboutSpam(chatInput.trim());
    setChatResponse(reply);
    setIsAsking(false);
    setChatInput('');
  };

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={learnStyles.content}
      keyboardShouldPersistTaps="handled"
    >
      {/* Section 1: Mock Email Examples */}
      <View style={learnStyles.sectionHeader}>
        <Text style={learnStyles.sectionTitle}>Real-looking Fake Emails</Text>
        <Text style={learnStyles.sectionSub}>These look real — but they are traps. Tap each one to see why.</Text>
      </View>

      {MOCK_EMAILS.map((email) => (
        <View key={email.id} style={learnStyles.emailCard}>
          <View style={learnStyles.emailEnvelope}>
            <Text style={learnStyles.emailField}>
              <Text style={learnStyles.emailFieldLabel}>From: </Text>
              <Text style={learnStyles.emailSenderText}>{email.sender}</Text>
            </Text>
            <Text style={learnStyles.emailField}>
              <Text style={learnStyles.emailFieldLabel}>Subj: </Text>
              <Text style={learnStyles.emailSubjectText}>{email.subject}</Text>
            </Text>
          </View>
          <Text style={learnStyles.emailPreview}>{email.preview}</Text>
          <View style={learnStyles.flagsRow}>
            {email.flags.map((flag, idx) => (
              <View key={idx} style={learnStyles.flagBadge}>
                <Text style={learnStyles.flagText}>⚠️  {flag}</Text>
              </View>
            ))}
          </View>
        </View>
      ))}

      {/* Section 2: Checklist */}
      <View style={learnStyles.sectionHeader}>
        <Text style={learnStyles.sectionTitle}>🚩  Red Flags to Watch For</Text>
        <Text style={learnStyles.sectionSub}>If you see any of these, be very careful!</Text>
      </View>
      <View style={learnStyles.checklistCard}>
        {CHECKLIST.map((item, idx) => (
          <View key={idx} style={learnStyles.checkRow}>
            <View style={learnStyles.checkDot} />
            <Text style={learnStyles.checkText}>{item.flag}</Text>
          </View>
        ))}
      </View>

      {/* Section 3: Who to contact */}
      <View style={learnStyles.sectionHeader}>
        <Text style={learnStyles.sectionTitle}>📞  Who to Contact</Text>
        <Text style={learnStyles.sectionSub}>If something seems wrong, report it or ask for help.</Text>
      </View>

      <View style={learnStyles.contactRow}>
        <TouchableOpacity
          style={learnStyles.contactCard}
          onPress={() => Linking.openURL('https://reportfraud.ftc.gov/')}
          activeOpacity={0.8}
          accessibilityLabel="Report to FTC"
        >
          <Text style={learnStyles.contactEmoji}>🇺🇸</Text>
          <Text style={learnStyles.contactTitle}>FTC</Text>
          <Text style={learnStyles.contactDesc}>Report scams to the US government</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={learnStyles.contactCard}
          onPress={() => Linking.openURL('https://www.ic3.gov/')}
          activeOpacity={0.8}
          accessibilityLabel="Report to FBI IC3"
        >
          <Text style={learnStyles.contactEmoji}>👮</Text>
          <Text style={learnStyles.contactTitle}>FBI IC3</Text>
          <Text style={learnStyles.contactDesc}>Report internet crimes</Text>
        </TouchableOpacity>
      </View>

      <View style={learnStyles.wideCard}>
        <Text style={learnStyles.contactEmoji}>📧</Text>
        <View style={{ flex: 1 }}>
          <Text style={learnStyles.contactTitle}>Email Provider</Text>
          <Text style={learnStyles.contactDesc}>
            In Gmail or Outlook, open the email and tap the three-dot menu → "Report spam" or "Report phishing".
          </Text>
        </View>
      </View>

      <View style={[learnStyles.wideCard, { borderColor: Colors.success }]}>
        <Text style={learnStyles.contactEmoji}>👨‍👩‍👧</Text>
        <View style={{ flex: 1 }}>
          <Text style={learnStyles.contactTitle}>Call a Family Member</Text>
          <Text style={learnStyles.contactDesc}>
            When in doubt, show the message to someone you trust before clicking anything.
          </Text>
        </View>
      </View>

      {/* Section 4: AI Q&A */}
      <View style={learnStyles.sectionHeader}>
        <Text style={learnStyles.sectionTitle}>🤖  Ask About an Email</Text>
        <Text style={learnStyles.sectionSub}>Type any question and our AI will explain in simple words.</Text>
      </View>

      <View style={learnStyles.chatCard}>
        <TextInput
          style={learnStyles.chatInput}
          value={chatInput}
          onChangeText={setChatInput}
          placeholder='e.g. "Is an email asking for gift cards ever real?"'
          placeholderTextColor={Colors.textSecondary}
          editable={!isAsking}
          multiline
          textAlignVertical="top"
        />
        <TouchableOpacity
          style={[learnStyles.askBtn, (!chatInput.trim() || isAsking) && { opacity: 0.4 }]}
          onPress={handleAsk}
          disabled={!chatInput.trim() || isAsking}
          activeOpacity={0.85}
          accessibilityLabel="Ask AI about spam"
        >
          {isAsking
            ? <ActivityIndicator color={Colors.background} size="small" />
            : <Text style={learnStyles.askBtnText}>Ask AI  →</Text>
          }
        </TouchableOpacity>

        {chatResponse && (
          <View style={learnStyles.replyBox}>
            <Text style={learnStyles.replyLabel}>AI Answer:</Text>
            <Text style={learnStyles.replyText}>{chatResponse}</Text>
          </View>
        )}
      </View>

      <View style={{ height: 60 }} />
    </ScrollView>
  );
}

const learnStyles = StyleSheet.create({
  content: { gap: Spacing.md, paddingBottom: Spacing.xl },
  sectionHeader: { gap: Spacing.xs, marginTop: Spacing.lg },
  sectionTitle: { fontFamily: FontFamily.headingBold, fontSize: FontSize.sectionHeader, color: Colors.primary },
  sectionSub: { fontFamily: FontFamily.body, fontSize: 16, color: Colors.textSecondary, lineHeight: 24 },

  // Email cards
  emailCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,68,68,0.3)',
  },
  emailEnvelope: {
    backgroundColor: 'rgba(255,68,68,0.07)',
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,68,68,0.2)',
    gap: Spacing.xs,
  },
  emailField: { fontFamily: FontFamily.body, fontSize: 13, color: Colors.textSecondary, lineHeight: 19 },
  emailFieldLabel: { fontFamily: FontFamily.bodyBold, color: Colors.textSecondary },
  emailSenderText: { color: '#FF8888', fontFamily: FontFamily.mono, fontSize: 12 },
  emailSubjectText: { color: Colors.textPrimary, fontFamily: FontFamily.bodyBold, fontSize: 14 },
  emailPreview: { padding: Spacing.md, fontFamily: FontFamily.body, fontSize: 15, color: Colors.textPrimary, lineHeight: 22 },
  flagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs, paddingHorizontal: Spacing.md, paddingBottom: Spacing.md },
  flagBadge: { backgroundColor: 'rgba(255,68,68,0.12)', paddingHorizontal: Spacing.sm, paddingVertical: 4, borderRadius: Radius.sm, borderWidth: 1, borderColor: 'rgba(255,68,68,0.4)' },
  flagText: { fontFamily: FontFamily.bodyBold, fontSize: 12, color: '#FF6666' },

  // Checklist
  checklistCard: { backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.lg, gap: Spacing.md },
  checkRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md },
  checkDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#FF4444', marginTop: 8, flexShrink: 0 },
  checkText: { flex: 1, fontFamily: FontFamily.body, fontSize: 16, color: Colors.textPrimary, lineHeight: 26 },

  // Contact cards
  contactRow: { flexDirection: 'row', gap: Spacing.md },
  contactCard: { flex: 1, backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.lg, alignItems: 'center', gap: Spacing.sm, borderWidth: 1, borderColor: Colors.border, minHeight: TouchTarget.min },
  contactEmoji: { fontSize: 36 },
  contactTitle: { fontFamily: FontFamily.headingBold, fontSize: 16, color: Colors.textPrimary, textAlign: 'center' },
  contactDesc: { fontFamily: FontFamily.body, fontSize: 14, color: Colors.textSecondary, textAlign: 'center', lineHeight: 20 },
  wideCard: { flexDirection: 'row', backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.lg, alignItems: 'flex-start', gap: Spacing.md, borderWidth: 1, borderColor: Colors.border },

  // AI Chat
  chatCard: { backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.lg, gap: Spacing.md },
  chatInput: { backgroundColor: Colors.background, borderRadius: Radius.md, borderWidth: 2, borderColor: Colors.border, padding: Spacing.md, fontFamily: FontFamily.body, fontSize: FontSize.body, color: Colors.textPrimary, minHeight: 90, lineHeight: FontSize.body * 1.5 },
  askBtn: { height: TouchTarget.min, backgroundColor: Colors.primary, borderRadius: Radius.full, alignItems: 'center', justifyContent: 'center' },
  askBtnText: { fontFamily: FontFamily.headingBold, fontSize: 20, color: Colors.background },
  replyBox: { backgroundColor: 'rgba(78,203,160,0.08)', borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.success, padding: Spacing.md, gap: Spacing.xs },
  replyLabel: { fontFamily: FontFamily.bodyBold, fontSize: 14, color: Colors.success },
  replyText: { fontFamily: FontFamily.body, fontSize: FontSize.body, color: Colors.textPrimary, lineHeight: FontSize.body * 1.55 },
});

// ─── ScamDetectorScreen ───────────────────────────────────────────────────────
export default function ScamDetectorScreen() {
  const [activeTab, setActiveTab] = useState('check');

  return (
    <View style={styles.screen}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Header */}
        <View style={styles.headerBlock}>
          <Text style={styles.title}>Scam Shield 🛡️</Text>
          <Text style={styles.subtitle}>Check suspicious messages and learn to stay safe.</Text>
        </View>

        {/* Tab Toggle */}
        <TabSegment activeTab={activeTab} onTabChange={setActiveTab} />

        {/* Tab Content */}
        <View style={{ flex: 1, paddingHorizontal: Spacing.xl }}>
          {activeTab === 'check' ? <CheckMessageView /> : <LearnView />}
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  safeArea: { flex: 1 },
  headerBlock: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    gap: Spacing.xs,
  },
  title: { fontFamily: FontFamily.headingExtraBold, fontSize: 26, color: Colors.textPrimary },
  subtitle: { fontFamily: FontFamily.body, fontSize: 16, color: Colors.textSecondary, lineHeight: 24 },
});
