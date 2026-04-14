import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  SectionList,
  StyleSheet,
  Animated,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import QuestCard from '../components/QuestCard';
import { useAppContext } from '../context/AppContext';
import { Colors, FontFamily, FontSize, Spacing, Radius } from '../constants/theme';

// ─── XP Progress Bar ─────────────────────────────────────────────────────────
function XPBar({ xp, levelName, levelNum, progress }) {
  const widthAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(widthAnim, {
      toValue: Math.min(progress, 1),
      duration: 700,
      delay: 300,
      useNativeDriver: false,
    }).start();
  }, [widthAnim, progress]);

  const barWidth = widthAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={xpStyles.wrapper}>
      <View style={xpStyles.labelRow}>
        <Text style={xpStyles.levelLabel}>Level {levelNum}: {levelName}</Text>
        <Text style={xpStyles.xpLabel}>{xp.toLocaleString()} XP</Text>
      </View>
      <View style={xpStyles.track}>
        <Animated.View style={[xpStyles.fill, { width: barWidth }]} />
      </View>
    </View>
  );
}

const xpStyles = StyleSheet.create({
  wrapper: {
    marginTop: Spacing.md,
    gap: Spacing.xs + 2,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  levelLabel: {
    fontFamily: FontFamily.mono,
    fontSize: 13,
    color: Colors.primary,
  },
  xpLabel: {
    fontFamily: FontFamily.body,
    fontSize: 13,
    color: Colors.textSecondary,
  },
  track: {
    height: 10,
    backgroundColor: Colors.surface,
    borderRadius: Radius.full,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: Radius.full,
  },
});

// ─── Level Badge ─────────────────────────────────────────────────────────────
function LevelBadge({ levelNum, levelName }) {
  return (
    <View style={badgeStyles.container}>
      <Text style={badgeStyles.text}>Lv {levelNum} · {levelName}</Text>
    </View>
  );
}

const badgeStyles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 1,
    alignSelf: 'flex-start',
  },
  text: {
    fontFamily: FontFamily.mono,
    fontSize: 12,
    color: Colors.primary,
    letterSpacing: 0.4,
  },
});

// ─── HomeScreen ───────────────────────────────────────────────────────────────
export default function HomeScreen({ navigation }) {
  const { userName, quests, getCurrentUserXP, getLevel, getLevelNum, getLevelProgress } = useAppContext();

  const xp = getCurrentUserXP();
  const levelName = getLevel(xp);
  const levelNum = getLevelNum(xp);
  const { current, max } = getLevelProgress(xp);
  const progressRatio = max > 0 ? current / max : 0;

  const handleQuestPress = (quest) => {
    navigation.navigate('QuestDetail', { questId: quest.id });
  };

  const renderItem = ({ item }) => (
    <QuestCard quest={item} onPress={() => handleQuestPress(item)} />
  );

  const ListHeader = () => (
    <View>
      <View style={styles.greetingRow}>
        <View style={styles.greetingLeft}>
          <Text style={styles.greetingText} numberOfLines={1}>
            Hello, {userName} 👋
          </Text>
          <LevelBadge levelNum={levelNum} levelName={levelName} />
        </View>
      </View>
      <View style={styles.xpSection}>
        <XPBar xp={xp} levelName={levelName} levelNum={levelNum} progress={progressRatio} />
      </View>
      <View style={[styles.sectionRow, { marginBottom: Spacing.xl }]}>
        <Text style={[styles.sectionLabel, { fontSize: FontSize.screenTitle }]}>🗺️  Your Quest Map</Text>
      </View>
    </View>
  );

  const sections = [
    { title: '🤖  AI Tools', data: quests.filter(q => q.questCategory !== 'Everyday Apps') },
    { title: '📱  Everyday Apps', data: quests.filter(q => q.questCategory === 'Everyday Apps') }
  ].filter(s => s.data.length > 0);

  const renderSectionHeader = ({ section: { title } }) => (
    <View style={[styles.sectionRow, { marginTop: title.includes('AI') ? 0 : Spacing.xl }]}>
      <Text style={styles.sectionLabel}>{title}</Text>
    </View>
  );

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.background} />
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          renderSectionHeader={renderSectionHeader}
          ListHeaderComponent={ListHeader}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          showsVerticalScrollIndicator={false}
          stickySectionHeadersEnabled={false}
        />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  safeArea: { flex: 1 },
  listContent: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: 100,
  },
  greetingRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  greetingLeft: {
    gap: Spacing.sm,
    flex: 1,
  },
  greetingText: {
    fontFamily: FontFamily.headingExtraBold,
    fontSize: FontSize.screenTitle,
    color: Colors.textPrimary,
    lineHeight: FontSize.screenTitle * 1.2,
  },
  xpSection: { marginBottom: Spacing.lg },
  sectionRow: { marginBottom: Spacing.md },
  sectionLabel: {
    fontFamily: FontFamily.headingBold,
    fontSize: FontSize.sectionHeader,
    color: Colors.textPrimary,
  },
  separator: { height: Spacing.md },
});
