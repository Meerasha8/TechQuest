import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from 'react-native';
import { Colors, FontFamily, FontSize, Spacing, Radius, TouchTarget } from '../constants/theme';

// ─── Status chip config ───────────────────────────────────────────────────────
const STATUS_CONFIG = {
  completed: {
    label: '✅  Completed',
    bg: Colors.chipCompleted,
    text: Colors.chipCompletedText,
  },
  active: {
    label: '⚡  In Progress',
    bg: Colors.chipActive,
    text: Colors.chipActiveText,
  },
  locked: {
    label: '🔒  Locked',
    bg: Colors.chipLocked,
    text: Colors.chipLockedText,
  },
};

// ─── Mission Dots (W · T · S) ────────────────────────────────────────────────
function MissionDot({ label, done, status }) {
  const dotColor =
    status === 'completed'
      ? done ? Colors.dotFilledSuccess : Colors.dotEmpty
      : done ? Colors.dotFilled : Colors.dotEmpty;

  return (
    <View style={styles.dotWrapper}>
      <View style={[styles.dot, { backgroundColor: dotColor }]} />
      <Text style={[styles.dotLabel, { color: done ? Colors.textPrimary : Colors.textSecondary }]}>
        {label}
      </Text>
    </View>
  );
}

// ─── QuestCard ────────────────────────────────────────────────────────────────
export default function QuestCard({ quest, onPress }) {
  const { name, subtitle, icon, iconBg, xp, estimatedTime, status, missions } = quest;
  const isActive = status === 'active';
  const isLocked = status === 'locked';
  const isCompleted = status === 'completed';

  // Pulsing glow animation for active card
  const glowAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!isActive) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1, duration: 1500, useNativeDriver: false }),
        Animated.timing(glowAnim, { toValue: 0, duration: 1500, useNativeDriver: false }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [isActive, glowAnim]);

  const borderColor = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(245,200,66,0.6)', 'rgba(245,200,66,1)'],
  });

  const chipConfig = STATUS_CONFIG[status];

  const cardContent = (
    <View style={[
      styles.card,
      isActive && styles.cardActive,
      isLocked && styles.cardLocked,
      isCompleted && styles.cardCompleted,
    ]}>
      {/* Active card gets animated border via Animated.View wrapper */}
      <View style={styles.inner}>

        {/* Top row: icon + title block + badge overlay */}
        <View style={styles.topRow}>
          {/* Tool Icon */}
          <View style={[styles.iconBox, { backgroundColor: iconBg }]}>
            <Text style={styles.iconEmoji}>{icon}</Text>
          </View>

          {/* Title + subtitle */}
          <View style={styles.titleBlock}>
            <Text style={styles.questName} numberOfLines={1}>{name}</Text>
            <Text style={styles.questSubtitle} numberOfLines={1}>{subtitle}</Text>
          </View>

          {/* Corner badge */}
          {isCompleted && (
            <View style={styles.cornerBadge}>
              <Text style={styles.cornerBadgeText}>✓</Text>
            </View>
          )}
          {isLocked && (
            <View style={[styles.cornerBadge, styles.cornerBadgeLocked]}>
              <Text style={styles.cornerBadgeText}>🔒</Text>
            </View>
          )}
        </View>

        {/* Status chip */}
        <View style={[styles.chip, { backgroundColor: chipConfig.bg }]}>
          <Text style={[styles.chipText, { color: chipConfig.text }]}>{chipConfig.label}</Text>
        </View>

        {/* Mission dots */}
        <View style={styles.dotsRow}>
          {missions.map((m) => (
            <MissionDot key={m.id} label={m.label} done={m.done} status={status} />
          ))}
        </View>

        {/* Meta row: XP + time */}
        <View style={styles.metaRow}>
          <View style={styles.metaPill}>
            <Text style={styles.metaText}>+{xp} XP</Text>
          </View>
          <View style={styles.metaPill}>
            <Text style={styles.metaText}>{estimatedTime}</Text>
          </View>
        </View>

        {/* Continue button — only for active */}
        {isActive && (
          <TouchableOpacity
            style={styles.continueBtn}
            onPress={onPress}
            activeOpacity={0.8}
            accessibilityLabel={`Continue ${name} quest`}
          >
            <Text style={styles.continueBtnText}>Continue Quest  →</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  if (isActive) {
    return (
      <Animated.View style={[styles.glowWrapper, { borderColor }]}>
        {cardContent}
      </Animated.View>
    );
  }

  return (
    <TouchableOpacity
      onPress={isLocked ? undefined : onPress}
      activeOpacity={isLocked ? 1 : 0.85}
      accessibilityLabel={isLocked ? `${name} quest — locked` : `Open ${name} quest`}
    >
      {cardContent}
    </TouchableOpacity>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const ICON_SIZE = 52;
const CORNER_BADGE = 32;

const styles = StyleSheet.create({
  // Active glow wrapper (Animated border)
  glowWrapper: {
    borderRadius: Radius.lg,
    borderWidth: 2,
    // shadow for glow on supported platforms
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 8,
  },

  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    overflow: 'hidden',
  },
  cardActive: {
    // Slightly brighter surface for active
    backgroundColor: '#2A3250',
  },
  cardLocked: {
    opacity: 0.65,
  },
  cardCompleted: {
    borderWidth: 1.5,
    borderColor: Colors.borderSuccess,
  },

  inner: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },

  // Top row
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  iconBox: {
    width: ICON_SIZE,
    height: ICON_SIZE,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconEmoji: {
    fontSize: 26,
  },
  titleBlock: {
    flex: 1,
  },
  questName: {
    fontFamily: FontFamily.mono,
    fontSize: FontSize.cardTitle,
    color: Colors.textPrimary,
    letterSpacing: 0.3,
  },
  questSubtitle: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.caption,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
    lineHeight: 20,
  },

  // Corner badge
  cornerBadge: {
    width: CORNER_BADGE,
    height: CORNER_BADGE,
    borderRadius: Radius.full,
    backgroundColor: Colors.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cornerBadgeLocked: {
    backgroundColor: Colors.chipLocked,
  },
  cornerBadgeText: {
    fontSize: 14,
  },

  // Status chip
  chip: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    borderRadius: Radius.full,
  },
  chipText: {
    fontFamily: FontFamily.bodyBold,
    fontSize: FontSize.caption,
    letterSpacing: 0.2,
  },

  // Mission dots
  dotsRow: {
    flexDirection: 'row',
    gap: Spacing.xl,
  },
  dotWrapper: {
    alignItems: 'center',
    gap: Spacing.xs,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  dotLabel: {
    fontFamily: FontFamily.body,
    fontSize: 13,
  },

  // Meta pills
  metaRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  metaPill: {
    backgroundColor: Colors.border,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  metaText: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.caption,
    color: Colors.textSecondary,
  },

  // Continue button
  continueBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.full,
    height: TouchTarget.min,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.xs,
  },
  continueBtnText: {
    fontFamily: FontFamily.bodyBold,
    fontSize: FontSize.button,
    color: '#111827',
    letterSpacing: 0.3,
  },
});
