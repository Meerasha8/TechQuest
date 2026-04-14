import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppContext } from '../context/AppContext';
import { Colors, FontFamily, FontSize, Spacing, Radius, TouchTarget } from '../constants/theme';

// ─── Podium config ─────────────────────────────────────────────────────────────
const PODIUM_CONFIG = {
  1: { height: 140, border: '#F5C842', avatar: 56, crown: '👑', label: '1st' },
  2: { height: 110, border: '#B4B2A9', avatar: 48, crown: '🥈', label: '2nd' },
  3: { height: 100, border: '#EF9F27', avatar: 44, crown: '🥉', label: '3rd' },
};

// ─── Avatar ────────────────────────────────────────────────────────────────────
function Avatar({ initial, size, borderColor }) {
  return (
    <View style={[avStyles.ring, { width: size + 4, height: size + 4, borderRadius: (size + 4) / 2, borderColor }]}>
      <View style={[avStyles.circle, { width: size, height: size, borderRadius: size / 2 }]}>
        <Text style={[avStyles.letter, { fontSize: size * 0.38 }]}>{initial}</Text>
      </View>
    </View>
  );
}

const avStyles = StyleSheet.create({
  ring: { borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  circle: { backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center' },
  letter: { fontFamily: FontFamily.headingExtraBold, color: Colors.textPrimary },
});

// ─── Podium Card ───────────────────────────────────────────────────────────────
function PodiumCard({ user, rank }) {
  const cfg = PODIUM_CONFIG[rank];
  return (
    <View style={[pdStyles.card, { height: cfg.height, borderColor: cfg.border }]}>
      <Text style={pdStyles.crown}>{cfg.crown}</Text>
      <Avatar initial={user.name?.[0]?.toUpperCase() || '?'} size={cfg.avatar} borderColor={cfg.border} />
      <Text style={pdStyles.name} numberOfLines={1}>{user.name.split(' ')[0]}</Text>
      <Text style={[pdStyles.xp, { color: cfg.border }]}>{(user.xp || 0).toLocaleString()} XP</Text>
      <Text style={pdStyles.rankLabel}>{cfg.label}</Text>
    </View>
  );
}

const pdStyles = StyleSheet.create({
  card: { flex: 1, backgroundColor: Colors.surface, borderRadius: Radius.lg, borderWidth: 2, alignItems: 'center', justifyContent: 'flex-end', paddingBottom: Spacing.md, paddingTop: Spacing.sm, paddingHorizontal: Spacing.sm, gap: Spacing.xs, alignSelf: 'flex-end' },
  crown: { fontSize: 20 },
  name: { fontFamily: FontFamily.headingBold, fontSize: 14, color: Colors.textPrimary, textAlign: 'center' },
  xp: { fontFamily: FontFamily.mono, fontSize: 12 },
  rankLabel: { fontFamily: FontFamily.body, fontSize: 12, color: Colors.textSecondary },
});

// ─── Rank Row ──────────────────────────────────────────────────────────────────
function RankRow({ user, rank, isCurrentUser }) {
  return (
    <View style={[rrStyles.row, isCurrentUser && rrStyles.rowYou]}>
      {isCurrentUser && <View style={rrStyles.youBorder} />}
      <Text style={[rrStyles.rank, isCurrentUser && rrStyles.rankYou]}>#{rank}</Text>
      <View style={[rrStyles.avatar, isCurrentUser && rrStyles.avatarYou]}>
        <Text style={rrStyles.avatarLetter}>{user.name?.[0]?.toUpperCase() || '?'}</Text>
      </View>
      <View style={rrStyles.info}>
        <Text style={[rrStyles.name, isCurrentUser && rrStyles.nameYou]}>
          {user.name}{isCurrentUser ? '  (You)' : ''}
        </Text>
        <Text style={rrStyles.level}>{user.level || 'Explorer'}</Text>
      </View>
      <Text style={[rrStyles.xp, isCurrentUser && rrStyles.xpYou]}>
        {(user.xp || 0).toLocaleString()} XP
      </Text>
    </View>
  );
}

const rrStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', minHeight: TouchTarget.min, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, borderRadius: Radius.md, backgroundColor: Colors.surface, gap: Spacing.md },
  rowYou: { backgroundColor: 'rgba(245,200,66,0.1)', borderColor: Colors.primary, borderWidth: 1.5 },
  youBorder: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, backgroundColor: Colors.primary, borderTopLeftRadius: Radius.md, borderBottomLeftRadius: Radius.md },
  rank: { fontFamily: FontFamily.mono, fontSize: 14, color: Colors.textSecondary, width: 32 },
  rankYou: { color: Colors.primary },
  avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.surface, borderWidth: 1.5, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  avatarYou: { borderColor: Colors.primary, backgroundColor: 'rgba(245,200,66,0.15)' },
  avatarLetter: { fontFamily: FontFamily.headingBold, fontSize: 15, color: Colors.textPrimary },
  info: { flex: 1 },
  name: { fontFamily: FontFamily.bodyBold, fontSize: FontSize.body, color: Colors.textPrimary },
  nameYou: { color: Colors.primary },
  level: { fontFamily: FontFamily.body, fontSize: FontSize.caption, color: Colors.textSecondary, marginTop: 2 },
  xp: { fontFamily: FontFamily.mono, fontSize: 13, color: Colors.textSecondary },
  xpYou: { color: Colors.primary },
});

// ─── Toggle ────────────────────────────────────────────────────────────────────
function Toggle({ options, active, onChange }) {
  return (
    <View style={tgStyles.row}>
      {options.map((opt) => (
        <TouchableOpacity key={opt} style={[tgStyles.pill, active === opt && tgStyles.pillActive]} onPress={() => onChange(opt)} activeOpacity={0.75}>
          <Text style={[tgStyles.text, active === opt && tgStyles.textActive]}>{opt}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const tgStyles = StyleSheet.create({
  row: { flexDirection: 'row', gap: Spacing.sm },
  pill: { height: TouchTarget.min, paddingHorizontal: Spacing.xl, borderRadius: Radius.full, borderWidth: 1.5, borderColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  pillActive: { backgroundColor: Colors.primary },
  text: { fontFamily: FontFamily.bodyBold, fontSize: FontSize.body, color: Colors.primary },
  textActive: { color: Colors.background },
});

// ─── LeaderboardScreen ────────────────────────────────────────────────────────
export default function LeaderboardScreen() {
  const { leaderboard, weeklyLeaderboard, user } = useAppContext();
  const [period, setPeriod] = useState('This Week');

  const source = period === 'This Week' ? (weeklyLeaderboard || []) : (leaderboard || []);
  // Sort by XP descending
  const sorted = [...source].sort((a, b) => (b.xp || 0) - (a.xp || 0));
  const top3 = sorted.slice(0, 3);
  const rest = sorted.slice(3);
  const rankRows = sorted.length >= 3 ? rest : sorted;
  const podiumOrder = top3.length >= 3 ? [top3[1], top3[0], top3[2]] : top3;

  return (
    <View style={styles.screen}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <Text style={styles.title}>Top Explorers 🏆</Text>
          <Toggle options={['This Week', 'All Time']} active={period} onChange={setPeriod} />
          <Text style={styles.note}>Leaderboard is optional — turn off in Settings</Text>

          {/* Podium */}
          {top3.length >= 3 && (
            <View style={styles.podiumRow}>
              <PodiumCard user={podiumOrder[0]} rank={2} />
              <PodiumCard user={podiumOrder[1]} rank={1} />
              <PodiumCard user={podiumOrder[2]} rank={3} />
            </View>
          )}

          {/* Ranked list */}
          <Text style={styles.sectionHeader}>Rankings</Text>
          {sorted.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No rankings yet for {period.toLowerCase()}.</Text>
            </View>
          ) : (
            <View style={styles.rankedList}>
              {rankRows.map((lbUser, i) => (
                <React.Fragment key={lbUser.id}>
                  <RankRow
                    user={lbUser}
                    rank={sorted.length >= 3 ? i + 4 : i + 1}
                    isCurrentUser={user && lbUser.id === user.id}
                  />
                  {i < rankRows.length - 1 && <View style={styles.divider} />}
                </React.Fragment>
              ))}
            </View>
          )}
          <View style={{ height: 100 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  safeArea: { flex: 1 },
  scrollContent: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.lg, gap: Spacing.lg },
  title: { fontFamily: FontFamily.headingExtraBold, fontSize: 26, color: Colors.textPrimary },
  note: { fontFamily: FontFamily.body, fontSize: FontSize.caption, color: Colors.textSecondary, textAlign: 'center', lineHeight: FontSize.caption * 1.5 },
  podiumRow: { flexDirection: 'row', alignItems: 'flex-end', gap: Spacing.sm, height: 160 },
  sectionHeader: { fontFamily: FontFamily.headingBold, fontSize: FontSize.sectionHeader, color: Colors.textPrimary },
  rankedList: { backgroundColor: Colors.surface, borderRadius: Radius.lg, overflow: 'hidden' },
  divider: { height: 1, backgroundColor: Colors.border, marginHorizontal: Spacing.lg },
  emptyState: { backgroundColor: Colors.surface, borderRadius: Radius.lg, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.xl, alignItems: 'center', justifyContent: 'center' },
  emptyStateText: { fontFamily: FontFamily.body, fontSize: FontSize.body, color: Colors.textSecondary, textAlign: 'center' },
});
