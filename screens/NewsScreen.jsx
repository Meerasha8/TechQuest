import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  Animated,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { generateNewsArticle } from '../services/groqService';
import { getNewsArticles, saveNewsArticle } from '../services/supabaseService';
import { Colors, FontFamily, FontSize, Spacing, Radius } from '../constants/theme';

// ─── Seed articles (shown if DB is empty) ─────────────────────────────────────
const SEED_ARTICLES = [
  {
    id: 'n1',
    category: 'AI TOOLS',
    headline: 'ChatGPT Can Now See Your Photos',
    summary: 'OpenAI added the ability for ChatGPT to look at pictures you take with your phone. You can show it a photo of anything — a plant, a rash, a receipt — and ask questions about it. This feature is free for all users starting this month.',
    whyItMatters: 'You can finally show ChatGPT that suspicious mole or confusing pill bottle label.',
    readTime: '2 min read',
  },
  {
    id: 'n2',
    category: 'STAYING SAFE',
    headline: 'New Phone Scam Uses AI Voices',
    summary: 'Scammers are now using AI to clone the voices of family members. They call pretending to be a grandchild in trouble and ask for money urgently. The FBI has issued a warning about this new trick.',
    whyItMatters: 'If you get an urgent call asking for money, always hang up and call that person back directly on their real number.',
    readTime: '2 min read',
  },
  {
    id: 'n3',
    category: 'NEW GADGETS',
    headline: "Apple's New iPad Is Thinner Than Ever",
    summary: 'Apple released the thinnest iPad ever made this year. It is lighter than a notepad and has a screen that makes everything look vivid and real. Prices start at $599 at any Apple Store.',
    whyItMatters: 'If your tablet feels heavy or slow, this might be worth considering for your next upgrade.',
    readTime: '3 min read',
  },
  {
    id: 'n4',
    category: 'AI TOOLS',
    headline: 'Google Translate Now Works Without Internet',
    summary: 'You can now use Google Translate on your phone even when you have no wifi or data. Download a language pack in the app settings when you are on wifi. It works for over 50 languages offline.',
    whyItMatters: 'Perfect for traveling abroad without worrying about your data plan.',
    readTime: '2 min read',
  },
];

const CATEGORY_COLORS = {
  'AI TOOLS':    Colors.primary,
  'STAYING SAFE':Colors.secondary,
  'NEW GADGETS': Colors.success,
};

// ─── Shimmer skeleton ──────────────────────────────────────────────────────────
function SkeletonCard() {
  const shimmer = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(shimmer, { toValue: 0, duration: 800, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [shimmer]);
  const opacity = shimmer.interpolate({ inputRange: [0, 1], outputRange: [0.4, 0.75] });
  return (
    <Animated.View style={[skStyles.card, { opacity }]}>
      <View style={skStyles.chipBar} />
      <View style={skStyles.titleBar} />
      <View style={skStyles.titleBarShort} />
      <View style={skStyles.line} />
      <View style={skStyles.line} />
      <View style={skStyles.lineShort} />
    </Animated.View>
  );
}

const skStyles = StyleSheet.create({
  card: { backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.lg, gap: Spacing.md },
  chipBar: { width: 80, height: 22, backgroundColor: Colors.border, borderRadius: Radius.full },
  titleBar: { width: '85%', height: 22, backgroundColor: Colors.border, borderRadius: 4 },
  titleBarShort: { width: '60%', height: 22, backgroundColor: Colors.border, borderRadius: 4 },
  line: { width: '100%', height: 16, backgroundColor: Colors.border, borderRadius: 4 },
  lineShort: { width: '70%', height: 16, backgroundColor: Colors.border, borderRadius: 4 },
});

// ─── Category Chip ─────────────────────────────────────────────────────────────
function CategoryChip({ label, color }) {
  return (
    <View style={[ccStyles.chip, { backgroundColor: `${color}22` }]}>
      <Text style={[ccStyles.text, { color }]}>{label}</Text>
    </View>
  );
}

const ccStyles = StyleSheet.create({
  chip: { alignSelf: 'flex-start', paddingHorizontal: Spacing.md, paddingVertical: 4, borderRadius: Radius.full },
  text: { fontFamily: FontFamily.mono, fontSize: 11, letterSpacing: 0.8 },
});

// ─── Article Card ──────────────────────────────────────────────────────────────
function ArticleCard({ article }) {
  const color = CATEGORY_COLORS[article.category] || Colors.primary;
  return (
    <View style={acStyles.card}>
      <CategoryChip label={article.category} color={color} />
      <Text style={acStyles.headline}>{article.headline}</Text>
      <Text style={acStyles.summary}>{article.summary}</Text>
      <View style={acStyles.whyRow}>
        <Text style={acStyles.whyLabel}>Why this matters to you:</Text>
        <Text style={acStyles.whyText}>{article.whyItMatters}</Text>
      </View>
      <Text style={acStyles.readTime}>{article.readTime}</Text>
    </View>
  );
}

const acStyles = StyleSheet.create({
  card: { backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.lg, gap: Spacing.md },
  headline: { fontFamily: FontFamily.headingBold, fontSize: 20, color: Colors.textPrimary, lineHeight: 28 },
  summary: { fontFamily: FontFamily.body, fontSize: FontSize.body, color: Colors.textSecondary, lineHeight: FontSize.body * 1.6 },
  whyRow: { backgroundColor: Colors.background, borderRadius: Radius.md, padding: Spacing.md, borderLeftWidth: 3, borderLeftColor: Colors.primary },
  whyLabel: { fontFamily: FontFamily.bodyBold, fontSize: FontSize.caption, color: Colors.primary },
  whyText: { fontFamily: FontFamily.body, fontSize: FontSize.caption, color: Colors.textPrimary, lineHeight: FontSize.caption * 1.6, marginTop: Spacing.xs },
  readTime: { fontFamily: FontFamily.mono, fontSize: 12, color: Colors.textSecondary, letterSpacing: 0.3 },
});

// ─── Error Banner ──────────────────────────────────────────────────────────────
function ErrorBanner({ onRetry }) {
  return (
    <View style={errStyles.banner}>
      <Text style={errStyles.text}>Oops! Couldn't load new news. Check your connection and try again.</Text>
      <TouchableOpacity style={errStyles.retryBtn} onPress={onRetry} accessibilityLabel="Retry">
        <Text style={errStyles.retryText}>Try Again</Text>
      </TouchableOpacity>
    </View>
  );
}

const errStyles = StyleSheet.create({
  banner: { backgroundColor: 'rgba(255,123,92,0.15)', borderRadius: Radius.md, borderWidth: 1.5, borderColor: Colors.secondary, padding: Spacing.lg, gap: Spacing.md },
  text: { fontFamily: FontFamily.body, fontSize: FontSize.body, color: Colors.textPrimary, lineHeight: FontSize.body * 1.5 },
  retryBtn: { alignSelf: 'flex-start', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, backgroundColor: Colors.secondary, borderRadius: Radius.full },
  retryText: { fontFamily: FontFamily.bodyBold, fontSize: FontSize.body, color: Colors.background },
});

// ─── NewsScreen ───────────────────────────────────────────────────────────────
export default function NewsScreen() {
  const [articles, setArticles] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  // Load from DB on mount
  useEffect(() => {
    const load = async () => {
      try {
        const dbArticles = await getNewsArticles();
        setArticles(dbArticles.length > 0 ? dbArticles : SEED_ARTICLES);
      } catch (e) {
        console.warn('NewsScreen load error:', e);
        setArticles(SEED_ARTICLES);
      } finally {
        setInitialLoading(false);
      }
    };
    load();
  }, []);

  // Pull-to-refresh: generate + save + prepend
  const fetchNewArticle = useCallback(async () => {
    setRefreshing(true);
    setLoadError(false);
    try {
      const article = await generateNewsArticle();
      // Save to DB
      const saved = await saveNewsArticle(
        article.category,
        article.headline,
        article.summary,
        article.whyItMatters,
        article.readTime
      );
      const toAdd = saved || article;
      setArticles((prev) => [toAdd, ...prev]);
    } catch (e) {
      console.warn('NewsScreen refresh error:', e);
      setLoadError(true);
    } finally {
      setRefreshing(false);
    }
  }, []);

  const renderItem = ({ item }) => <ArticleCard article={item} />;

  const ListHeader = () => (
    <View style={styles.header}>
      <Text style={styles.title}>Tech This Week 📰</Text>
      <Text style={styles.subtitle}>Simple news about technology — just for you</Text>
      <Text style={styles.pullHint}>Pull down to load a new article</Text>
      {loadError && <ErrorBanner onRetry={fetchNewArticle} />}
    </View>
  );

  const ListSkeleton = () => (
    <View style={{ gap: Spacing.md, paddingHorizontal: Spacing.xl }}>
      <SkeletonCard />
      <SkeletonCard />
      <SkeletonCard />
    </View>
  );

  return (
    <View style={styles.screen}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <FlatList
          data={initialLoading || refreshing ? [] : articles}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          ListHeaderComponent={ListHeader}
          ListEmptyComponent={(initialLoading || refreshing) ? <ListSkeleton /> : null}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={{ height: Spacing.md }} />}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={fetchNewArticle}
              tintColor={Colors.primary}
              colors={[Colors.primary]}
              title="Loading new article..."
              titleColor={Colors.textSecondary}
            />
          }
        />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  safeArea: { flex: 1 },
  header: { paddingBottom: Spacing.lg, gap: Spacing.sm },
  title: { fontFamily: FontFamily.headingExtraBold, fontSize: 26, color: Colors.textPrimary },
  subtitle: { fontFamily: FontFamily.body, fontSize: FontSize.caption, color: Colors.textSecondary, lineHeight: FontSize.caption * 1.5 },
  pullHint: { fontFamily: FontFamily.body, fontSize: 13, color: Colors.textSecondary, fontStyle: 'italic' },
  listContent: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.lg, paddingBottom: 100 },
});
