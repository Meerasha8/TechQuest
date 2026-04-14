import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Animated,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppContext } from '../context/AppContext';
import { Colors, FontFamily, FontSize, Spacing, Radius, TouchTarget } from '../constants/theme';

// ─── Floating Orb ─────────────────────────────────────────────────────────────
function FloatingOrb({ color, size, top, left, delay }) {
  const opacity = useRef(new Animated.Value(0.15)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.45, duration: 3000, delay, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.1, duration: 3000, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [opacity, delay]);
  return (
    <Animated.View
      style={[orbStyles.orb, { width: size, height: size, borderRadius: size / 2, backgroundColor: color, top, left, opacity }]}
    />
  );
}

const orbStyles = StyleSheet.create({ orb: { position: 'absolute' } });

function BadgePill({ label }) {
  return (
    <View style={badgeStyles.pill}>
      <Text style={badgeStyles.text}>{label}</Text>
    </View>
  );
}

const badgeStyles = StyleSheet.create({
  pill: { borderWidth: 1.5, borderColor: Colors.primary, borderRadius: Radius.full, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm },
  text: { fontFamily: FontFamily.mono, fontSize: 12, color: Colors.primary, letterSpacing: 0.3 },
});

// ─── OnboardingScreen ─────────────────────────────────────────────────────────
export default function OnboardingScreen({ navigation }) {
  const { registerUser } = useAppContext();
  const [name, setName] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleStart = async () => {
    const trimmed = name.trim();
    if (!trimmed || isLoading) return;

    setIsLoading(true);
    try {
      await registerUser(trimmed);
      navigation.replace('Main');
    } catch (e) {
      console.warn('Registration error:', e);
      // Still navigate — the user can continue even if DB fails
      navigation.replace('Main');
    } finally {
      setIsLoading(false);
    }
  };

  const canProceed = name.trim().length > 0 && !isLoading;

  return (
    <View style={styles.screen}>
      <FloatingOrb color={Colors.primary}   size={220} top={-60}  left={-80} delay={0} />
      <FloatingOrb color={Colors.secondary} size={160} top={180}  left={260} delay={1200} />
      <FloatingOrb color={Colors.success}   size={130} top={500}  left={-40} delay={600} />

      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <KeyboardAvoidingView style={styles.kav} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <ScrollView
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.logoBlock}>
              <Text style={styles.logoText}>TechQuest</Text>
              <Text style={styles.tagline}>Your journey into AI starts here</Text>
            </View>

            <View style={styles.card}>
              <Text style={styles.inputLabel}>What should we call you?</Text>
              <TextInput
                style={[styles.input, isFocused && styles.inputFocused]}
                placeholder="Enter your name..."
                placeholderTextColor={Colors.textSecondary}
                value={name}
                onChangeText={setName}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                autoCapitalize="words"
                autoCorrect={false}
                returnKeyType="go"
                onSubmitEditing={handleStart}
                maxLength={32}
                editable={!isLoading}
              />
              <Text style={styles.hint}>No email. No password. Just your name.</Text>

              <TouchableOpacity
                style={[styles.startBtn, !canProceed && styles.startBtnDisabled]}
                onPress={handleStart}
                activeOpacity={0.85}
                disabled={!canProceed}
                accessibilityLabel="Start my journey"
              >
                {isLoading ? (
                  <ActivityIndicator color={Colors.background} size="small" />
                ) : (
                  <Text style={styles.startBtnText}>Start My Journey  →</Text>
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.badgesRow}>
              <BadgePill label="🤖  ChatGPT" />
              <BadgePill label="✨  Claude" />
              <BadgePill label="🔍  Google Lens" />
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  safeArea: { flex: 1 },
  kav: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: Spacing.xl, paddingVertical: Spacing.xxxl, gap: Spacing.xxl },
  logoBlock: { alignItems: 'center', gap: Spacing.sm },
  logoText: { fontFamily: FontFamily.headingExtraBold, fontSize: 42, color: Colors.primary, letterSpacing: 1 },
  tagline: { fontFamily: FontFamily.body, fontSize: FontSize.body, color: Colors.textSecondary, textAlign: 'center', lineHeight: FontSize.body * 1.6 },
  card: { backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.xl, gap: Spacing.md },
  inputLabel: { fontFamily: FontFamily.bodyBold, fontSize: FontSize.body, color: Colors.textPrimary, lineHeight: FontSize.body * 1.4 },
  input: { height: 64, backgroundColor: Colors.background, borderRadius: Radius.md, borderWidth: 2, borderColor: Colors.border, paddingHorizontal: Spacing.xl, fontFamily: FontFamily.body, fontSize: 20, color: Colors.textPrimary },
  inputFocused: { borderColor: Colors.primary },
  hint: { fontFamily: FontFamily.body, fontSize: FontSize.caption, color: Colors.textSecondary, fontStyle: 'italic', lineHeight: FontSize.caption * 1.5 },
  startBtn: { height: TouchTarget.min, backgroundColor: Colors.primary, borderRadius: Radius.full, alignItems: 'center', justifyContent: 'center', marginTop: Spacing.xs },
  startBtnDisabled: { opacity: 0.45 },
  startBtnText: { fontFamily: FontFamily.headingExtraBold, fontSize: FontSize.button, color: Colors.background, letterSpacing: 0.4 },
  badgesRow: { flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap', gap: Spacing.sm },
});
