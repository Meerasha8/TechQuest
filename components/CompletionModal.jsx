import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from 'react-native';
import { Colors, FontFamily, FontSize, Spacing, Radius, TouchTarget } from '../constants/theme';

/**
 * CompletionModal — shown when a user finishes all 3 missions on a quest.
 * Props:
 *   visible: boolean
 *   quest: object (the completed quest)
 *   xpGained: number
 *   didLevelUp: boolean
 *   newLevelName: string
 *   onClose: () => void
 */
export default function CompletionModal({ visible, quest, xpGained, didLevelUp, newLevelName, onClose }) {
  const [displayXP, setDisplayXP] = useState(0);
  const scaleAnim = useRef(new Animated.Value(0.7)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) {
      setDisplayXP(0);
      scaleAnim.setValue(0.7);
      opacityAnim.setValue(0);
      return;
    }

    // Entrance animation
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 180,
        friction: 12,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start();

    // XP counter animation
    if (!xpGained) return;
    let start = null;
    const duration = 800;
    const target = xpGained;

    const step = (timestamp) => {
      if (!start) start = timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayXP(Math.round(eased * target));
      if (progress < 1) requestAnimationFrame(step);
    };

    const raf = setTimeout(() => requestAnimationFrame(step), 400);
    return () => clearTimeout(raf);
  }, [visible, xpGained, scaleAnim, opacityAnim]);

  if (!quest) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <Animated.View
          style={[
            styles.card,
            {
              opacity: opacityAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          {/* Quest icon */}
          <Text style={styles.questIcon}>{quest.icon}</Text>

          {/* Title */}
          <Text style={styles.title}>Quest Complete! 🎉</Text>

          {/* Quest name */}
          <Text style={styles.questName}>{quest.name}</Text>

          {/* XP counter */}
          <View style={styles.xpRow}>
            <Text style={styles.xpPlus}>+</Text>
            <Text style={styles.xpCount}>{displayXP}</Text>
            <Text style={styles.xpLabel}> XP</Text>
          </View>

          {/* Level up banner (conditional) */}
          {didLevelUp && newLevelName && (
            <View style={styles.levelUpBanner}>
              <Text style={styles.levelUpText}>
                🎊  Level Up!  You're now a {newLevelName}!
              </Text>
            </View>
          )}

          {/* Continue button */}
          <TouchableOpacity
            style={styles.continueBtn}
            onPress={onClose}
            activeOpacity={0.85}
            accessibilityLabel="Continue"
          >
            <Text style={styles.continueBtnText}>Continue  →</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(26, 31, 53, 0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: Colors.primary,
    padding: Spacing.xxxl,
    alignItems: 'center',
    width: '100%',
    gap: Spacing.lg,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 12,
  },
  questIcon: {
    fontSize: 72,
  },
  title: {
    fontFamily: FontFamily.headingExtraBold,
    fontSize: 32,
    color: Colors.primary,
    textAlign: 'center',
  },
  questName: {
    fontFamily: FontFamily.mono,
    fontSize: FontSize.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  xpRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 2,
  },
  xpPlus: {
    fontFamily: FontFamily.headingExtraBold,
    fontSize: 28,
    color: Colors.primary,
  },
  xpCount: {
    fontFamily: FontFamily.headingExtraBold,
    fontSize: 48,
    color: Colors.primary,
    lineHeight: 56,
  },
  xpLabel: {
    fontFamily: FontFamily.headingBold,
    fontSize: 22,
    color: Colors.primary,
  },
  levelUpBanner: {
    backgroundColor: 'rgba(78, 203, 160, 0.15)',
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: Colors.success,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    width: '100%',
    alignItems: 'center',
  },
  levelUpText: {
    fontFamily: FontFamily.bodyBold,
    fontSize: FontSize.body,
    color: Colors.success,
    textAlign: 'center',
    lineHeight: FontSize.body * 1.4,
  },
  continueBtn: {
    height: TouchTarget.min,
    backgroundColor: Colors.primary,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginTop: Spacing.sm,
  },
  continueBtnText: {
    fontFamily: FontFamily.headingExtraBold,
    fontSize: FontSize.button,
    color: Colors.background,
    letterSpacing: 0.4,
  },
});
