import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Linking,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppContext, getLevel, getLevelNum } from '../context/AppContext';
import CompletionModal from '../components/CompletionModal';
import { Colors, FontFamily, FontSize, Spacing, Radius, TouchTarget } from '../constants/theme';

// ─── Status config ─────────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  completed: { label: '✅  Completed', bg: Colors.chipCompleted, text: Colors.chipCompletedText },
  active:    { label: '⚡  In Progress', bg: Colors.chipActive, text: Colors.chipActiveText },
  locked:    { label: '🔒  Locked', bg: Colors.chipLocked, text: Colors.chipLockedText },
};

// ─── XP Ring ──────────────────────────────────────────────────────────────────
function XPRing({ done, total }) {
  return (
    <View style={ringStyles.wrapper}>
      <View style={ringStyles.ring}>
        <Text style={ringStyles.fraction}>{done}/{total}</Text>
        <Text style={ringStyles.label}>missions</Text>
      </View>
    </View>
  );
}

const ringStyles = StyleSheet.create({
  wrapper: { alignItems: 'center' },
  ring: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 3,
    borderColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
  },
  fraction: {
    fontFamily: FontFamily.mono,
    fontSize: 16,
    color: Colors.primary,
  },
  label: {
    fontFamily: FontFamily.body,
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 1,
  },
});

// ─── Step type chip ────────────────────────────────────────────────────────────
function StepChip({ type }) {
  const cfg = {
    watch: { label: 'WATCH', bg: 'rgba(78,203,160,0.18)', text: Colors.success },
    try:   { label: 'TRY',   bg: 'rgba(245,200,66,0.18)', text: Colors.primary },
    share: { label: 'SHARE', bg: 'rgba(255,123,92,0.18)', text: Colors.secondary },
  }[type] || { label: type.toUpperCase(), bg: Colors.chipLocked, text: Colors.textSecondary };

  return (
    <View style={[chipStyles.chip, { backgroundColor: cfg.bg }]}>
      <Text style={[chipStyles.text, { color: cfg.text }]}>{cfg.label}</Text>
    </View>
  );
}

const chipStyles = StyleSheet.create({
  chip: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    borderRadius: Radius.full,
    marginBottom: Spacing.sm,
  },
  text: {
    fontFamily: FontFamily.mono,
    fontSize: 12,
    letterSpacing: 0.5,
  },
});

// ─── Step node ─────────────────────────────────────────────────────────────────
function StepNode({ index, isActive, isDone }) {
  const bg = isDone ? Colors.success : isActive ? Colors.primary : Colors.textSecondary;
  return (
    <View style={[nodeStyles.circle, { backgroundColor: bg }]}>
      <Text style={nodeStyles.num}>{isDone ? '✓' : index + 1}</Text>
    </View>
  );
}

const nodeStyles = StyleSheet.create({
  circle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
    flexShrink: 0,
  },
  num: {
    fontFamily: FontFamily.headingBold,
    fontSize: 14,
    color: Colors.background,
  },
});

// ─── YouTube URLs per quest ────────────────────────────────────────────────────
const YOUTUBE_URLS = {
  ChatGPT:           'https://www.youtube.com/results?search_query=chatgpt+beginners+tutorial',
  'Claude AI':       'https://www.youtube.com/results?search_query=claude+ai+tutorial',
  'Google Lens':     'https://www.youtube.com/results?search_query=google+lens+how+to+use',
  'Google Translate':'https://www.youtube.com/results?search_query=google+translate+tutorial',
  'Google Maps':     'https://www.youtube.com/results?search_query=google+maps+tutorial+beginners',
  Gemini:            'https://www.youtube.com/results?search_query=google+gemini+tutorial',
  WhatsApp:          'https://www.youtube.com/results?search_query=whatsapp+tutorial+beginners',
  Telegram:          'https://www.youtube.com/results?search_query=telegram+tutorial+beginners',
  Zoom:              'https://www.youtube.com/results?search_query=zoom+tutorial+beginners',
  'Google Photos':   'https://www.youtube.com/results?search_query=google+photos+tutorial+beginners',
};

// ─── Individual step card ──────────────────────────────────────────────────────
function StepCard({ mission, index, isActive, isDone, isLocked, questId, questName, onStepDone }) {
  const [tryText, setTryText] = useState('');
  const [shareText, setShareText] = useState('');
  const [tryFocused, setTryFocused] = useState(false);
  const [shareFocused, setShareFocused] = useState(false);

  const descriptions = {
    watch: `Watch a short 2-minute intro video about ${questName}`,
    try:   `Try ${questName} yourself — then paste what you got back below`,
    share: 'Tell the community what you made or learned!',
  };

  const handleWatch = async () => {
    const url = YOUTUBE_URLS[questName] || 'https://youtube.com';
    await Linking.openURL(url);
    onStepDone('watch', null);
  };

  const handleTryDone = () => {
    if (!tryText.trim()) return;
    onStepDone('try', null);
  };

  const handleShare = () => {
    if (!shareText.trim()) return;
    onStepDone('share', shareText.trim());
  };

  return (
    <View style={[stepStyles.card, isLocked && stepStyles.cardLocked, isDone && stepStyles.cardDone]}>
      <View style={stepStyles.headerRow}>
        <StepNode index={index} isActive={isActive} isDone={isDone} />
        <View style={{ flex: 1 }}>
          <StepChip type={mission.type} />
          <Text style={[stepStyles.desc, isLocked && stepStyles.textMuted]}>
            {descriptions[mission.type]}
          </Text>
        </View>
      </View>

      {/* WATCH */}
      {mission.type === 'watch' && !isLocked && (
        <TouchableOpacity
          style={[stepStyles.actionBtn, isDone && stepStyles.actionBtnDone]}
          onPress={isDone ? undefined : handleWatch}
          activeOpacity={isDone ? 1 : 0.8}
          accessibilityLabel="Watch tutorial video"
        >
          <Text style={[stepStyles.actionBtnText, isDone && stepStyles.actionBtnTextDone]}>
            {isDone ? '✓  Watched' : '▶  Watch Now'}
          </Text>
        </TouchableOpacity>
      )}

      {/* TRY */}
      {mission.type === 'try' && !isLocked && (
        <View style={stepStyles.inputGroup}>
          <TextInput
            style={[stepStyles.textArea, tryFocused && stepStyles.textAreaFocused]}
            multiline
            minHeight={80}
            placeholder="Paste what the AI gave you back here..."
            placeholderTextColor={Colors.textSecondary}
            value={tryText}
            onChangeText={setTryText}
            onFocus={() => setTryFocused(true)}
            onBlur={() => setTryFocused(false)}
            textAlignVertical="top"
            editable={!isDone}
          />
          {!isDone ? (
            <TouchableOpacity
              style={[stepStyles.actionBtn, !tryText.trim() && stepStyles.actionBtnDisabled]}
              onPress={handleTryDone}
              disabled={!tryText.trim()}
              activeOpacity={0.8}
              accessibilityLabel="Mark try step as done"
            >
              <Text style={stepStyles.actionBtnText}>Mark as Done  ✓</Text>
            </TouchableOpacity>
          ) : (
            <View style={[stepStyles.actionBtn, stepStyles.actionBtnDone]}>
              <Text style={[stepStyles.actionBtnText, stepStyles.actionBtnTextDone]}>✓  Done!</Text>
            </View>
          )}
        </View>
      )}

      {/* SHARE */}
      {mission.type === 'share' && !isLocked && (
        <View style={stepStyles.inputGroup}>
          <TextInput
            style={[stepStyles.textArea, shareFocused && stepStyles.textAreaFocused]}
            multiline
            minHeight={80}
            placeholder="Describe what you created or learned..."
            placeholderTextColor={Colors.textSecondary}
            value={shareText}
            onChangeText={setShareText}
            onFocus={() => setShareFocused(true)}
            onBlur={() => setShareFocused(false)}
            textAlignVertical="top"
            editable={!isDone}
          />
          {!isDone ? (
            <TouchableOpacity
              style={[stepStyles.shareBtn, !shareText.trim() && stepStyles.actionBtnDisabled]}
              onPress={handleShare}
              disabled={!shareText.trim()}
              activeOpacity={0.8}
              accessibilityLabel="Post to showcase"
            >
              <Text style={stepStyles.shareBtnText}>Post to Showcase  →</Text>
            </TouchableOpacity>
          ) : (
            <View style={[stepStyles.shareBtn, stepStyles.actionBtnDone]}>
              <Text style={[stepStyles.shareBtnText, stepStyles.actionBtnTextDoneWhite]}>✓  Shared!</Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const stepStyles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderLeftWidth: 4,
    borderLeftColor: Colors.border,
    gap: Spacing.md,
  },
  cardLocked: {
    opacity: 0.45,
    borderLeftColor: Colors.textSecondary,
  },
  cardDone: { borderLeftColor: Colors.success },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  desc: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.body,
    color: Colors.textPrimary,
    lineHeight: FontSize.body * 1.5,
  },
  textMuted: { color: Colors.textSecondary },
  actionBtn: {
    height: TouchTarget.min,
    borderRadius: Radius.full,
    borderWidth: 2,
    borderColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnDone: {
    backgroundColor: Colors.chipCompleted,
    borderColor: Colors.success,
  },
  actionBtnDisabled: { opacity: 0.4 },
  actionBtnText: {
    fontFamily: FontFamily.bodyBold,
    fontSize: FontSize.button,
    color: Colors.primary,
  },
  actionBtnTextDone: { color: Colors.success },
  shareBtn: {
    height: TouchTarget.min,
    borderRadius: Radius.full,
    backgroundColor: Colors.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareBtnText: {
    fontFamily: FontFamily.bodyBold,
    fontSize: FontSize.button,
    color: Colors.background,
  },
  actionBtnTextDoneWhite: { color: Colors.background },
  inputGroup: { gap: Spacing.md },
  textArea: {
    backgroundColor: Colors.background,
    borderRadius: Radius.md,
    borderWidth: 2,
    borderColor: Colors.border,
    padding: Spacing.lg,
    fontFamily: FontFamily.body,
    fontSize: FontSize.body,
    color: Colors.textPrimary,
    lineHeight: FontSize.body * 1.5,
  },
  textAreaFocused: { borderColor: Colors.primary },
});

// ─── QuestDetailScreen ────────────────────────────────────────────────────────
export default function QuestDetailScreen({ route, navigation }) {
  const { questId } = route.params;
  const {
    quests,
    completeStep,
    clearCompletedQuest,
    justCompletedQuestId,
    addShowcasePost,
    getCurrentUserXP,
    getLevel: getLevelName,
    getLevelNum: getLevelNumber,
  } = useAppContext();

  const quest = quests.find((q) => q.id === questId);

  // Detect level-up when quest completes
  const [prevXP, setPrevXP] = useState(getCurrentUserXP());
  const [modalLeveledUp, setModalLeveledUp] = useState(false);
  const [newLevelName, setNewLevelName] = useState('');

  const isModalVisible = justCompletedQuestId === questId;

  // Capture prevXP before step completes
  const handleStepDone = (stepType, shareText) => {
    const xpBefore = getCurrentUserXP();
    const lvlBefore = getLevelNumber(xpBefore);
    setPrevXP(xpBefore);

    completeStep(questId, stepType);

    if (shareText && quest) {
      addShowcasePost(quest.name, shareText);
    }

    // Check level-up after state update (use quest xp as proxy)
    const xpAfter = xpBefore + (quest?.xp || 0);
    const lvlAfter = getLevelNumber(xpAfter);
    if (lvlAfter > lvlBefore) {
      setModalLeveledUp(true);
      setNewLevelName(getLevelName(xpAfter));
    } else {
      setModalLeveledUp(false);
    }
  };

  const handleModalClose = () => {
    clearCompletedQuest();
    navigation.goBack();
  };

  if (!quest) {
    return (
      <View style={styles.screen}>
        <Text style={{ color: Colors.textPrimary, fontSize: FontSize.body, margin: 20 }}>
          Quest not found.
        </Text>
      </View>
    );
  }

  const chipConfig = STATUS_CONFIG[quest.status] || STATUS_CONFIG.locked;
  const doneMissions = quest.missions.filter((m) => m.done).length;

  return (
    <View style={styles.screen}>
      {/* ── Fixed Hero Header ── */}
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            accessibilityLabel="Go back"
          >
            <Text style={styles.backText}>←  Back</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.heroCard}>
          <View style={styles.heroLeft}>
            <View style={[styles.heroIconBox, { backgroundColor: quest.iconBg }]}>
              <Text style={styles.heroIcon}>{quest.icon}</Text>
            </View>
            <View style={styles.heroText}>
              <Text style={styles.heroName}>{quest.name}</Text>
              <Text style={styles.heroSubtitle}>{quest.subtitle}</Text>
              <View style={[styles.statusChip, { backgroundColor: chipConfig.bg }]}>
                <Text style={[styles.statusChipText, { color: chipConfig.text }]}>
                  {chipConfig.label}
                </Text>
              </View>
            </View>
          </View>
          <XPRing done={doneMissions} total={quest.missions.length} />
        </View>
      </SafeAreaView>

      {/* ── Scrollable Steps ── */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.sectionHeader}>Your Missions</Text>
          <View style={styles.stepperList}>
            {quest.missions.map((mission, index) => {
              const isDone = mission.done;
              const prevDone = index === 0 || quest.missions[index - 1].done;
              const isActive = !isDone && prevDone;
              const isLocked = !isDone && !prevDone;
              return (
                <StepCard
                  key={mission.id}
                  mission={mission}
                  index={index}
                  isActive={isActive}
                  isDone={isDone}
                  isLocked={isLocked}
                  questId={questId}
                  questName={quest.name}
                  onStepDone={handleStepDone}
                />
              );
            })}
          </View>
          <View style={{ height: 100 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* ── AI Guide FAB ── */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('Main', { screen: 'Guide' })}
        activeOpacity={0.85}
        accessibilityLabel="Ask AI Guide"
      >
        <Text style={styles.fabEmoji}>🤖</Text>
      </TouchableOpacity>

      {/* ── Completion Modal ── */}
      <CompletionModal
        visible={isModalVisible}
        quest={quest}
        xpGained={quest?.xp || 0}
        didLevelUp={modalLeveledUp}
        newLevelName={newLevelName}
        onClose={handleModalClose}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  safeArea: { backgroundColor: Colors.background },
  header: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  backBtn: {
    alignSelf: 'flex-start',
    minHeight: TouchTarget.icon,
    justifyContent: 'center',
  },
  backText: {
    fontFamily: FontFamily.bodyBold,
    fontSize: FontSize.body,
    color: Colors.primary,
  },
  heroCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    marginHorizontal: Spacing.xl,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  heroLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
    gap: Spacing.md,
  },
  heroIconBox: {
    width: 56,
    height: 56,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroIcon: { fontSize: 28 },
  heroText: { flex: 1, gap: Spacing.xs },
  heroName: {
    fontFamily: FontFamily.headingExtraBold,
    fontSize: 24,
    color: Colors.textPrimary,
  },
  heroSubtitle: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.caption,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  statusChip: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.md,
    paddingVertical: 3,
    borderRadius: Radius.full,
    marginTop: Spacing.xs,
  },
  statusChipText: {
    fontFamily: FontFamily.bodyBold,
    fontSize: 13,
  },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xxxl,
  },
  sectionHeader: {
    fontFamily: FontFamily.headingBold,
    fontSize: FontSize.sectionHeader,
    color: Colors.textPrimary,
    marginBottom: Spacing.lg,
  },
  stepperList: { gap: Spacing.md },
  fab: {
    position: 'absolute',
    bottom: 28,
    right: 24,
    width: TouchTarget.fab,
    height: TouchTarget.fab,
    borderRadius: TouchTarget.fab / 2,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 8,
  },
  fabEmoji: { fontSize: 26 },
});
