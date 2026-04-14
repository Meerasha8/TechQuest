import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Linking,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useAppContext } from '../context/AppContext';
import { askAboutSpam } from '../services/groqService';
import { Colors, FontFamily, FontSize, Spacing, Radius, TouchTarget } from '../constants/theme';

const MOCK_EMAILS = [
  {
    id: 'email-1',
    sender: 'Bank Security <alert@bankalert-update123.com>',
    subject: 'URGENT: Your account has been suspended!',
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
    sender: 'Package Delivery <no-reply@fedex-tracker-update.com>',
    subject: 'Action Required: Unpaid delivery fee',
    preview: 'Your package could not be delivered due to an unpaid fee of $2.99. Click here to pay the fee to release your package.',
    flags: ['Unexpected package', 'Small suspicious fee', 'Fake sender address'],
  },
  {
    id: 'email-4',
    sender: 'Tech Support <support@geeksquad.com>',
    subject: 'Your anti-virus subscription auto-renewed ($399)',
    preview: 'Thank you for your purchase of $399.99! If you did not make this purchase, call us immediately at 1-800-XXX-XXXX to refund.',
    flags: ['Fake high charge', 'Urgent phone number', 'Scare tactic'],
  }
];

const CHECKLIST = [
  'Urgent or threatening language (e.g. "Account closing in 24 hours")',
  'Asks for your password, SSN, or bank details',
  'Misspelled sender address or weird domain name',
  'Too good to be true offers (e.g. "You won a lottery")',
  'Generic greetings like "Dear customer"',
  'Requests payment via gift cards or crypto',
];

export default function SpamEducationView() {
  const { logSpamLesson } = useAppContext();
  const [chatInput, setChatInput] = useState('');
  const [chatResponse, setChatResponse] = useState(null);
  const [isAsking, setIsAsking] = useState(false);

  useEffect(() => {
    logSpamLesson();
  }, [logSpamLesson]);

  const handleAsk = async () => {
    if (!chatInput.trim() || isAsking) return;
    setIsAsking(true);
    setChatResponse(null);
    const reply = await askAboutSpam(chatInput.trim());
    setChatResponse(reply);
    setIsAsking(false);
    setChatInput('');
  };

  const handleContact = (type) => {
    switch (type) {
      case 'ftc':
        Linking.openURL('https://reportfraud.ftc.gov/');
        break;
      case 'ic3':
        Linking.openURL('https://www.ic3.gov/');
        break;
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.headerTitle}>Learn to Spot Scams 🏫</Text>
        <Text style={styles.headerSubtitle}>
          Scammers use tricks to steal your money or information. Let's look at some examples.
        </Text>

        {/* 1. MOCK EMAILS */}
        <Text style={styles.sectionTitle}>Examples of Fake Emails</Text>
        {MOCK_EMAILS.map((email) => (
          <View key={email.id} style={styles.emailCard}>
            <Text style={styles.emailSender} numberOfLines={1}>From: {email.sender}</Text>
            <Text style={styles.emailSubject} numberOfLines={1}>Subj: {email.subject}</Text>
            <Text style={styles.emailPreview}>{email.preview}</Text>
            <View style={styles.flagsRow}>
              {email.flags.map((flag, idx) => (
                <View key={idx} style={styles.flagBadge}>
                  <Text style={styles.flagText}>⚠️ {flag}</Text>
                </View>
              ))}
            </View>
          </View>
        ))}

        {/* 2. RED FLAGS CHECKLIST */}
        <Text style={[styles.sectionTitle, { marginTop: Spacing.xl }]}>Red Flags to Watch For</Text>
        <View style={styles.checklistCard}>
          {CHECKLIST.map((item, idx) => (
            <View key={idx} style={styles.checkItemRow}>
              <Text style={styles.checkIcon}>🚩</Text>
              <Text style={styles.checkText}>{item}</Text>
            </View>
          ))}
        </View>

        {/* 3. WHO TO CONTACT */}
        <Text style={[styles.sectionTitle, { marginTop: Spacing.xl }]}>Who to Contact</Text>
        <View style={styles.contactGrid}>
          <TouchableOpacity style={styles.contactCard} onPress={() => handleContact('ftc')}>
            <Text style={styles.contactIcon}>🇺🇸</Text>
            <Text style={styles.contactTitle}>FTC</Text>
            <Text style={styles.contactSub}>reportfraud.ftc.gov</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.contactCard} onPress={() => handleContact('ic3')}>
            <Text style={styles.contactIcon}>👮</Text>
            <Text style={styles.contactTitle}>FBI IC3</Text>
            <Text style={styles.contactSub}>ic3.gov</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.familyCard}>
            <Text style={styles.familyIcon}>👨‍👩‍👧</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.contactTitle}>Call a Family Member</Text>
              <Text style={styles.contactSub}>When in doubt, show the message to someone you trust before clicking anything.</Text>
            </View>
        </View>

        {/* 4. AI MINI CHAT */}
        <Text style={[styles.sectionTitle, { marginTop: Spacing.xl }]}>Ask About This</Text>
        <Text style={styles.chatDesc}>Curious about a specific scam? Ask our AI!</Text>
        
        <View style={styles.chatSection}>
          <TextInput
            style={styles.chatInput}
            value={chatInput}
            onChangeText={setChatInput}
            placeholder="e.g. Is it safe to click a text tracking link?"
            placeholderTextColor={Colors.textSecondary}
            editable={!isAsking}
            multiline
          />
          <TouchableOpacity 
            style={[styles.askBtn, (!chatInput.trim() || isAsking) && { opacity: 0.5 }]} 
            onPress={handleAsk}
            disabled={!chatInput.trim() || isAsking}
          >
            {isAsking ? <ActivityIndicator color={Colors.background} size="small" /> : <Text style={styles.askBtnText}>Ask ↑</Text>}
          </TouchableOpacity>

          {chatResponse && (
            <View style={styles.chatReplyBox}>
              <Text style={styles.chatReplyLabel}>🤖 AI Answer:</Text>
              <Text style={styles.chatReplyText}>{chatResponse}</Text>
            </View>
          )}
        </View>

        <View style={{ height: Spacing.xxxl }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  headerTitle: {
    fontFamily: FontFamily.headingExtraBold,
    fontSize: 26,
    color: Colors.textPrimary,
  },
  headerSubtitle: {
    fontFamily: FontFamily.body,
    fontSize: 16,
    color: Colors.textSecondary,
    lineHeight: 24,
    marginTop: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontFamily: FontFamily.headingBold,
    fontSize: 20,
    color: Colors.primary,
    marginBottom: Spacing.lg,
  },
  
  // EMAIL CARDS
  emailCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  emailSender: { fontFamily: FontFamily.bodyBold, fontSize: 13, color: Colors.textSecondary },
  emailSubject: { fontFamily: FontFamily.bodyBold, fontSize: 16, color: Colors.textPrimary, marginVertical: Spacing.xs },
  emailPreview: { fontFamily: FontFamily.body, fontSize: 14, color: Colors.textPrimary, lineHeight: 20, marginBottom: Spacing.md },
  flagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs },
  flagBadge: { backgroundColor: 'rgba(255,68,68,0.1)', paddingHorizontal: Spacing.sm, paddingVertical: 4, borderRadius: Radius.sm, borderWidth: 1, borderColor: '#FF4444' },
  flagText: { fontFamily: FontFamily.bodyBold, fontSize: 11, color: '#FF4444' },

  // CHECKLIST
  checklistCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  checkItemRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm },
  checkIcon: { fontSize: 18, marginTop: 2 },
  checkText: { flex: 1, fontFamily: FontFamily.body, fontSize: 16, color: Colors.textPrimary, lineHeight: 24 },

  // CONTACT
  contactGrid: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.md },
  contactCard: { flex: 1, backgroundColor: Colors.surface, padding: Spacing.md, borderRadius: Radius.md, alignItems: 'center', borderColor: Colors.border, borderWidth: 1 },
  contactIcon: { fontSize: 32, marginBottom: Spacing.xs },
  contactTitle: { fontFamily: FontFamily.headingBold, fontSize: 16, color: Colors.textPrimary },
  contactSub: { fontFamily: FontFamily.body, fontSize: 13, color: Colors.textSecondary, textAlign: 'center', marginTop: 2 },
  familyCard: { flexDirection: 'row', backgroundColor: Colors.surface, padding: Spacing.lg, borderRadius: Radius.md, alignItems: 'center', borderColor: Colors.border, borderWidth: 1, gap: Spacing.md },
  familyIcon: { fontSize: 40 },

  // CHAT
  chatDesc: { fontFamily: FontFamily.body, fontSize: 16, color: Colors.textSecondary, marginBottom: Spacing.md },
  chatSection: { backgroundColor: Colors.surface, padding: Spacing.lg, borderRadius: Radius.lg },
  chatInput: { fontFamily: FontFamily.body, fontSize: 16, color: Colors.textPrimary, minHeight: 80, textAlignVertical: 'top', backgroundColor: Colors.background, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md, padding: Spacing.md },
  askBtn: { backgroundColor: Colors.primary, height: TouchTarget.min, borderRadius: Radius.full, alignItems: 'center', justifyContent: 'center', marginTop: Spacing.md },
  askBtnText: { fontFamily: FontFamily.headingBold, fontSize: 16, color: Colors.background },
  chatReplyBox: { marginTop: Spacing.lg, padding: Spacing.md, backgroundColor: 'rgba(78,203,160,0.1)', borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.success },
  chatReplyLabel: { fontFamily: FontFamily.headingBold, fontSize: 14, color: Colors.success, marginBottom: Spacing.xs },
  chatReplyText: { fontFamily: FontFamily.body, fontSize: 16, color: Colors.textPrimary, lineHeight: 24 },
});
