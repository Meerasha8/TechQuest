// screens/ProgressScreen.jsx
// TechQuest — Personal Learning Progress (private to current user)

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppContext } from '../context/AppContext';
import { generateProgressMessage } from '../services/groqService';
import { Colors, FontFamily, FontSize, Spacing, Radius, TouchTarget } from '../constants/theme';

// ─── Animated XP Bar ─────────────────────────────────────────────────────────
function XPProgressBar({ progress, xpCurrent, xpMax }) {
  const widthAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(widthAnim, {
      toValue: Math.min(progress, 1),
      duration: 900,
      delay: 300,
      useNativeDriver: false,
    }).start();
  }, [widthAnim, progress]);

  const barWidth = widthAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });
  const remaining = xpMax - xpCurrent;

  return (
    <View style={xpStyles.wrapper}>
      <View style={xpStyles.track}>
        <Animated.View style={[xpStyles.fill, { width: barWidth }]} />
      </View>
      <Text style={xpStyles.sub}>
        {remaining > 0 ? `${remaining} more XP to next level` : '🏆 Maximum level reached!'}
      </Text>
    </View>
  );
}

const xpStyles = StyleSheet.create({
  wrapper: { gap: Spacing.sm },
  track: { height: 14, backgroundColor: Colors.background, borderRadius: Radius.full, overflow: 'hidden' },
  fill: { height: '100%', backgroundColor: Colors.primary, borderRadius: Radius.full },
  sub: { fontFamily: FontFamily.body, fontSize: FontSize.caption, color: Colors.textSecondary },
});

// ─── Stat Tile ────────────────────────────────────────────────────────────────
function StatTile({ emoji, value, label }) {
  return (
    <View style={tileStyles.tile}>
      <Text style={tileStyles.emoji}>{emoji}</Text>
      <Text style={tileStyles.value}>{value}</Text>
      <Text style={tileStyles.label}>{label}</Text>
    </View>
  );
}

const tileStyles = StyleSheet.create({
  tile: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.sm,
    alignItems: 'center',
    gap: Spacing.xs,
  },
  emoji: { fontSize: 28 },
  value: { fontFamily: FontFamily.headingExtraBold, fontSize: 26, color: Colors.primary },
  label: { fontFamily: FontFamily.body, fontSize: 12, color: Colors.textSecondary, textAlign: 'center' },
});

// ─── Quest Breakdown Card ─────────────────────────────────────────────────────
function QuestCard({ quest, onResume }) {
  const done = quest.status === 'completed';
  const locked = quest.status === 'locked';
  const stepsDone = quest.missions.filter((m) => m.done).length;

  const CHIP = {
    watch: { label: 'Watch', activeColor: '#4ECBA0', inactiveColor: Colors.textSecondary },
    try:   { label: 'Try',   activeColor: '#F5C842', inactiveColor: Colors.textSecondary },
    share: { label: 'Share', activeColor: '#FF7B5C', inactiveColor: Colors.textSecondary },
  };

  return (
    <View style={[cardStyles.card, done && cardStyles.cardDone, locked && cardStyles.cardLocked]}>
      {/* Top row: icon + name + XP */}
      <View style={cardStyles.topRow}>
        <View style={[cardStyles.iconBox, { backgroundColor: quest.iconBg || Colors.surface }]}>
          <Text style={cardStyles.icon}>{quest.icon}</Text>
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={cardStyles.name}>{quest.name}</Text>
          <Text style={cardStyles.xp}>
            {done ? `✅  +${quest.xp} XP earned` : `Up to +${quest.xp} XP`}
          </Text>
        </View>
        <Text style={[cardStyles.progress, done && cardStyles.progressDone]}>
          {stepsDone}/3
        </Text>
      </View>

      {/* Step chips */}
      <View style={cardStyles.chipsRow}>
        {quest.missions.map((m) => {
          const cfg = CHIP[m.type];
          return (
            <View
              key={m.id}
              style={[
                cardStyles.chip,
                m.done
                  ? { backgroundColor: `${cfg.activeColor}22`, borderColor: cfg.activeColor }
                  : { backgroundColor: 'transparent', borderColor: Colors.border },
              ]}
            >
              <Text
                style={[cardStyles.chipText, { color: m.done ? cfg.activeColor : Colors.textSecondary }]}
              >
                {cfg.label} {m.done ? '✓' : '·'}
              </Text>
            </View>
          );
        })}
      </View>

      {/* Resume button */}
      {!done && (
        <TouchableOpacity
          style={[cardStyles.resumeBtn, locked && cardStyles.resumeBtnGhost]}
          onPress={() => !locked && onResume(quest)}
          disabled={locked}
          activeOpacity={0.8}
          accessibilityLabel={locked ? `${quest.name} is locked` : `Resume ${quest.name}`}
        >
          <Text style={[cardStyles.resumeText, locked && cardStyles.resumeTextGhost]}>
            {locked ? '🔒  Complete previous quest to unlock' : 'Resume Quest  →'}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const cardStyles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    gap: Spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: Colors.border,
  },
  cardDone: { borderLeftColor: Colors.success },
  cardLocked: { opacity: 0.65 },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  iconBox: { width: 48, height: 48, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  icon: { fontSize: 24 },
  name: { fontFamily: FontFamily.headingBold, fontSize: 18, color: Colors.textPrimary },
  xp: { fontFamily: FontFamily.mono, fontSize: 13, color: Colors.primary },
  progress: { fontFamily: FontFamily.headingExtraBold, fontSize: 22, color: Colors.textSecondary },
  progressDone: { color: Colors.success },
  chipsRow: { flexDirection: 'row', gap: Spacing.sm },
  chip: { borderWidth: 1, borderRadius: Radius.full, paddingHorizontal: Spacing.md, paddingVertical: 4 },
  chipText: { fontFamily: FontFamily.bodyBold, fontSize: 13 },
  resumeBtn: {
    height: TouchTarget.min,
    backgroundColor: Colors.primary,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resumeBtnGhost: { backgroundColor: 'transparent', borderWidth: 1, borderColor: Colors.border },
  resumeText: { fontFamily: FontFamily.headingBold, fontSize: 17, color: Colors.background },
  resumeTextGhost: { color: Colors.textSecondary, fontSize: 14 },
});

// ─── ProgressScreen ───────────────────────────────────────────────────────────
export default function ProgressScreen({ navigation }) {
  const {
    user,
    quests,
    getCurrentUserXP,
    getLevel,
    getLevelNum,
    getLevelProgress,
  } = useAppContext();

  const [aiMessage, setAiMessage]   = useState(null);
  const [aiLoading, setAiLoading]   = useState(true);

  const xp              = getCurrentUserXP();
  const levelName       = getLevel(xp);
  const levelNum        = getLevelNum(xp);
  const { current: xpCurrent, max: xpMax } = getLevelProgress(xp);
  const progressRatio   = xpMax > 0 ? xpCurrent / xpMax : 0;

  const completedQuests = quests.filter((q) => q.status === 'completed');
  const nextActive      = quests.find((q) => q.status === 'active');
  const totalStepsDone  = quests.reduce((acc, q) => acc + q.missions.filter((m) => m.done).length, 0);
  const totalSteps      = quests.length * 3;

  // Load AI motivational message once on mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setAiLoading(true);
      const msg = await generateProgressMessage(
        completedQuests.length,
        quests.length,
        levelName,
        nextActive?.name,
      );
      if (!cancelled) { setAiMessage(msg); setAiLoading(false); }
    })();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleResume = (quest) => {
    navigation.navigate('QuestDetail', { questId: quest.id });
  };

  return (
    <View style={styles.screen}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
        >
          {/* ── Header ── */}
          <View style={styles.headerRow}>
            <View style={{ gap: Spacing.xs }}>
              <Text style={styles.title}>My Progress 📊</Text>
              <Text style={styles.subtitle}>Hello, {user?.name || 'Learner'}!</Text>
            </View>
            <View style={styles.levelBadge}>
              <Text style={styles.levelBadgeText}>Lv {levelNum}</Text>
              <Text style={styles.levelBadgeSub}>{levelName}</Text>
            </View>
          </View>

          {/* ── XP Card ── */}
          <View style={styles.xpCard}>
            <View style={styles.xpTopRow}>
              <Text style={styles.xpLabel}>Total XP</Text>
              <Text style={styles.xpValue}>{xp.toLocaleString()} XP</Text>
            </View>
            <XPProgressBar progress={progressRatio} xpCurrent={xpCurrent} xpMax={xpMax} />
          </View>

          {/* ── Stat Tiles ── */}
          <View style={styles.tilesRow}>
            <StatTile emoji="🏆" value={`${completedQuests.length}/${quests.length}`} label="Quests Done" />
            <StatTile emoji="⚡" value={`${totalStepsDone}/${totalSteps}`}          label="Steps Done" />
            <StatTile emoji="🔥" value={`${user?.streak || 0}`}                     label="Day Streak" />
          </View>

          {/* ── AI Coach Message ── */}
          <View style={styles.aiCard}>
            <Text style={styles.aiChip}>💬  Your Coach Says</Text>
            {aiLoading ? (
              <View style={styles.aiLoadRow}>
                <ActivityIndicator size="small" color={Colors.primary} />
                <Text style={styles.aiLoadText}>Personalizing your message…</Text>
              </View>
            ) : (
              <Text style={styles.aiText}>{aiMessage}</Text>
            )}
          </View>

          {/* ── Tools Mastered Badges ── */}
          {completedQuests.length > 0 && (
            <View style={{ gap: Spacing.md }}>
              <Text style={styles.sectionTitle}>🌟  Tools Mastered</Text>
              <View style={styles.badgesRow}>
                {completedQuests.map((q) => (
                  <View key={q.id} style={[styles.badge, { backgroundColor: q.iconBg || Colors.surface }]}>
                    <Text style={styles.badgeIcon}>{q.icon}</Text>
                    <Text style={styles.badgeName} numberOfLines={1}>{q.name.split(' ')[0]}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* ── Per-Quest Breakdown ── */}
          <Text style={styles.sectionTitle}>📋  Quest Breakdown</Text>
          <View style={styles.questList}>
            {quests.map((quest) => (
              <QuestCard key={quest.id} quest={quest} onResume={handleResume} />
            ))}
          </View>

          <View style={{ height: 80 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  safeArea: { flex: 1 },
  content: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.lg, gap: Spacing.lg },

  // Header
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  title: { fontFamily: FontFamily.headingExtraBold, fontSize: 28, color: Colors.textPrimary },
  subtitle: { fontFamily: FontFamily.body, fontSize: FontSize.body, color: Colors.textSecondary },
  levelBadge: {
    backgroundColor: Colors.surface,
    borderWidth: 2,
    borderColor: Colors.primary,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    gap: 2,
  },
  levelBadgeText: { fontFamily: FontFamily.headingExtraBold, fontSize: 22, color: Colors.primary },
  levelBadgeSub:  { fontFamily: FontFamily.mono, fontSize: 11, color: Colors.textSecondary },

  // XP card
  xpCard: { backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.lg, gap: Spacing.md },
  xpTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  xpLabel: { fontFamily: FontFamily.headingBold, fontSize: 18, color: Colors.textPrimary },
  xpValue: { fontFamily: FontFamily.headingExtraBold, fontSize: 28, color: Colors.primary },

  // Stat tiles
  tilesRow: { flexDirection: 'row', gap: Spacing.md },

  // AI card
  aiCard: {
    backgroundColor: 'rgba(245,200,66,0.08)',
    borderWidth: 1.5,
    borderColor: 'rgba(245,200,66,0.35)',
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  aiChip: { fontFamily: FontFamily.bodyBold, fontSize: 13, color: Colors.primary, letterSpacing: 0.5 },
  aiLoadRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  aiLoadText: { fontFamily: FontFamily.body, fontSize: 16, color: Colors.textSecondary },
  aiText: { fontFamily: FontFamily.body, fontSize: FontSize.body, color: Colors.textPrimary, lineHeight: FontSize.body * 1.55 },

  // Mastered badges
  sectionTitle: { fontFamily: FontFamily.headingBold, fontSize: 20, color: Colors.textPrimary },
  badgesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md },
  badge: { alignItems: 'center', gap: Spacing.xs, paddingVertical: Spacing.md, paddingHorizontal: Spacing.lg, borderRadius: Radius.lg, minWidth: 72 },
  badgeIcon: { fontSize: 30 },
  badgeName: { fontFamily: FontFamily.bodyBold, fontSize: 12, color: Colors.background },

  // Quest list
  questList: { gap: Spacing.md },
});
