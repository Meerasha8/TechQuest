import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Keyboard,
  Animated,
  PanResponder,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppContext } from '../context/AppContext';
import { Colors, FontFamily, FontSize, Spacing, Radius, TouchTarget } from '../constants/theme';

// ─── Tool chip colors ──────────────────────────────────────────────────────────
const TOOL_COLORS = {
  ChatGPT:          { bg: 'rgba(16,163,127,0.2)',   text: '#10A37F' },
  'Claude AI':      { bg: 'rgba(245,200,66,0.2)',   text: Colors.primary },
  Claude:           { bg: 'rgba(245,200,66,0.2)',   text: Colors.primary },
  'Google Lens':    { bg: 'rgba(66,133,244,0.2)',   text: '#4285F4' },
  'Google Maps':    { bg: 'rgba(255,123,92,0.2)',   text: Colors.secondary },
  'Google Translate':{ bg: 'rgba(52,168,83,0.2)',   text: '#34A853' },
  Gemini:           { bg: 'rgba(142,108,243,0.2)',  text: '#8E6CF3' },
};

const FILTER_CHIPS = [
  { id: 'all', label: 'All' },
  { id: 'ChatGPT', label: 'ChatGPT' },
  { id: 'Claude AI', label: 'Claude' },
  { id: 'Google Lens', label: 'Google Lens' },
];

// ─── ToolChip ──────────────────────────────────────────────────────────────────
function ToolChip({ tool }) {
  const cfg = TOOL_COLORS[tool] || { bg: Colors.chipLocked, text: Colors.textSecondary };
  return (
    <View style={[tcStyles.chip, { backgroundColor: cfg.bg }]}>
      <Text style={[tcStyles.text, { color: cfg.text }]}>{tool}</Text>
    </View>
  );
}

const tcStyles = StyleSheet.create({
  chip: { alignSelf: 'flex-start', paddingHorizontal: Spacing.md, paddingVertical: 4, borderRadius: Radius.full },
  text: { fontFamily: FontFamily.mono, fontSize: 12, letterSpacing: 0.3 },
});

// ─── Avatar ────────────────────────────────────────────────────────────────────
function Avatar({ initial, size = 44 }) {
  return (
    <View style={[avStyles.circle, { width: size, height: size, borderRadius: size / 2 }]}>
      <Text style={[avStyles.letter, { fontSize: size * 0.4 }]}>{initial}</Text>
    </View>
  );
}

const avStyles = StyleSheet.create({
  circle: { backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  letter: { fontFamily: FontFamily.headingExtraBold, color: Colors.background },
});

// ─── Filter Pill ───────────────────────────────────────────────────────────────
function FilterPill({ label, active, onPress }) {
  return (
    <TouchableOpacity
      style={[fpStyles.pill, active && fpStyles.pillActive]}
      onPress={onPress}
      activeOpacity={0.75}
      accessibilityLabel={`Filter by ${label}`}
    >
      <Text style={[fpStyles.text, active && fpStyles.textActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

const fpStyles = StyleSheet.create({
  pill: { height: 40, paddingHorizontal: Spacing.lg, borderRadius: Radius.full, borderWidth: 1.5, borderColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  pillActive: { backgroundColor: Colors.primary },
  text: { fontFamily: FontFamily.mono, fontSize: 12, color: Colors.primary, letterSpacing: 0.3 },
  textActive: { color: Colors.background },
});

// ─── Post Card ─────────────────────────────────────────────────────────────────
function PostCard({ post, isLiked, onToggleLike }) {
  const [expanded, setExpanded] = useState(false);
  const isLong = post.text.length > 140;
  const displayText = isLong && !expanded ? post.text.slice(0, 140) + '...' : post.text;

  return (
    <View style={pcStyles.card}>
      <View style={pcStyles.topRow}>
        <Avatar initial={post.authorInitial || post.authorName?.[0] || '?'} size={44} />
        <View style={pcStyles.meta}>
          <Text style={pcStyles.name}>{post.authorName}</Text>
          <Text style={pcStyles.level}>{post.authorLevel}</Text>
        </View>
        <Text style={pcStyles.time}>{post.timestamp}</Text>
      </View>
      <ToolChip tool={post.tool} />
      <Text style={pcStyles.text}>{displayText}</Text>
      {isLong && (
        <TouchableOpacity onPress={() => setExpanded((e) => !e)}>
          <Text style={pcStyles.readMore}>{expanded ? 'Show less' : 'Read more'}</Text>
        </TouchableOpacity>
      )}
      <TouchableOpacity
        style={pcStyles.heartBtn}
        onPress={() => onToggleLike(post.id)}
        accessibilityLabel={`Like post by ${post.authorName}`}
      >
        <Text style={pcStyles.heartIcon}>{isLiked ? '❤️' : '🤍'}</Text>
        <Text style={[pcStyles.heartCount, isLiked && pcStyles.heartCountLiked]}>
          {post.likes}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const pcStyles = StyleSheet.create({
  card: { backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.lg, gap: Spacing.md },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  meta: { flex: 1 },
  name: { fontFamily: FontFamily.bodyBold, fontSize: FontSize.body, color: Colors.textPrimary },
  level: { fontFamily: FontFamily.mono, fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  time: { fontFamily: FontFamily.body, fontSize: FontSize.caption, color: Colors.textSecondary },
  text: { fontFamily: FontFamily.body, fontSize: FontSize.body, color: Colors.textPrimary, lineHeight: FontSize.body * 1.6 },
  readMore: { fontFamily: FontFamily.bodyBold, fontSize: FontSize.caption, color: Colors.primary, marginTop: -Spacing.sm },
  heartBtn: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, minWidth: 48, minHeight: 48 },
  heartIcon: { fontSize: 22 },
  heartCount: { fontFamily: FontFamily.bodyBold, fontSize: FontSize.body, color: Colors.textSecondary },
  heartCountLiked: { color: Colors.secondary },
});

// ─── Share Modal ───────────────────────────────────────────────────────────────
function ShareModal({ visible, onClose, onPost }) {
  const TOOLS = ['ChatGPT', 'Claude AI', 'Google Lens', 'Google Maps', 'Gemini'];
  const [selectedTool, setSelectedTool] = useState('ChatGPT');
  const [text, setText] = useState('');
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(0)).current;

  const handlePost = () => {
    if (!text.trim()) return;
    onPost(selectedTool, text.trim());
    setText('');
    onClose();
  };

  const closeModal = () => {
    Keyboard.dismiss();
    onClose();
  };

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gestureState) =>
          Math.abs(gestureState.dy) > Math.abs(gestureState.dx) && gestureState.dy > 6,
        onPanResponderMove: (_, gestureState) => {
          translateY.setValue(Math.max(0, gestureState.dy));
        },
        onPanResponderRelease: (_, gestureState) => {
          if (gestureState.dy > 90 || gestureState.vy > 1.1) {
            closeModal();
          } else {
            Animated.spring(translateY, {
              toValue: 0,
              useNativeDriver: true,
              bounciness: 0,
            }).start();
          }
        },
        onPanResponderTerminate: () => {
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
            bounciness: 0,
          }).start();
        },
      }),
    [translateY]
  );

  const keyboardVerticalOffset = Platform.select({
    ios: insets.top + 12,
    android: 0,
    default: 0,
  });

  const bottomSafePadding = Math.max(insets.bottom, Spacing.lg);

  useEffect(() => {
    if (visible) {
      translateY.setValue(0);
    }
  }, [visible, translateY]);

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={closeModal}>
      <View style={smStyles.overlay}>
        <Pressable style={smStyles.backdrop} onPress={closeModal} />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={keyboardVerticalOffset}
          style={smStyles.kavWrapper}
        >
          <Animated.View
            style={[
              smStyles.sheet,
              { paddingBottom: bottomSafePadding, transform: [{ translateY }] },
            ]}
          >
            <View style={smStyles.dragArea} {...panResponder.panHandlers}>
              <View style={smStyles.handle} />
            </View>

            <View style={smStyles.headerRow}>
              <Text style={smStyles.title}>Share What You Made</Text>
              <TouchableOpacity
                style={smStyles.closeBtn}
                onPress={closeModal}
                activeOpacity={0.8}
                accessibilityLabel="Close share modal"
              >
                <Text style={smStyles.closeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
              contentContainerStyle={smStyles.scrollContent}
            >
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={{ flexGrow: 0 }}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={{ gap: Spacing.sm, paddingVertical: Spacing.xs }}
              >
                {TOOLS.map((t) => (
                  <FilterPill key={t} label={t} active={selectedTool === t} onPress={() => setSelectedTool(t)} />
                ))}
              </ScrollView>

              <TextInput
                style={smStyles.input}
                multiline
                placeholder="What did you make or learn?"
                placeholderTextColor={Colors.textSecondary}
                value={text}
                onChangeText={setText}
                textAlignVertical="top"
                returnKeyType="done"
                blurOnSubmit
              />

              <TouchableOpacity
                style={[smStyles.postBtn, !text.trim() && smStyles.postBtnDisabled]}
                onPress={handlePost}
                disabled={!text.trim()}
                activeOpacity={0.85}
                accessibilityLabel="Post to showcase"
              >
                <Text style={smStyles.postBtnText}>Post to Showcase  →</Text>
              </TouchableOpacity>
            </ScrollView>
          </Animated.View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const smStyles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)' },
  kavWrapper: { width: '100%', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
    maxHeight: '88%',
    gap: Spacing.md,
  },
  dragArea: { alignItems: 'center', paddingVertical: Spacing.xs },
  handle: { width: 48, height: 4, backgroundColor: Colors.border, borderRadius: 2 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontFamily: FontFamily.headingBold, fontSize: FontSize.sectionHeader, color: Colors.textPrimary },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  closeBtnText: { fontFamily: FontFamily.headingBold, fontSize: 16, color: Colors.textSecondary },
  scrollContent: { gap: Spacing.lg, paddingBottom: Spacing.sm },
  input: { backgroundColor: Colors.background, borderRadius: Radius.md, borderWidth: 2, borderColor: Colors.border, padding: Spacing.lg, fontFamily: FontFamily.body, fontSize: FontSize.body, color: Colors.textPrimary, minHeight: 120, lineHeight: FontSize.body * 1.5 },
  postBtn: { height: TouchTarget.min, backgroundColor: Colors.primary, borderRadius: Radius.full, alignItems: 'center', justifyContent: 'center' },
  postBtnDisabled: { opacity: 0.4 },
  postBtnText: { fontFamily: FontFamily.bodyBold, fontSize: FontSize.button, color: Colors.background },
});

// ─── ShowcaseScreen ────────────────────────────────────────────────────────────
export default function ShowcaseScreen() {
  const { showcasePosts, userLikes, toggleLike, addShowcasePost } = useAppContext();
  const [activeFilter, setActiveFilter] = useState('all');
  const [modalVisible, setModalVisible] = useState(false);

  const filteredPosts = activeFilter === 'all'
    ? showcasePosts
    : showcasePosts.filter((p) =>
        p.tool === activeFilter ||
        (activeFilter === 'Claude AI' && p.tool === 'Claude')
      );

  return (
    <View style={styles.screen}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.headerBlock}>
          <Text style={styles.title}>What Everyone's Making 🌟</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
            {FILTER_CHIPS.map((chip) => (
              <FilterPill key={chip.id} label={chip.label} active={activeFilter === chip.id} onPress={() => setActiveFilter(chip.id)} />
            ))}
          </ScrollView>
        </View>
        <FlatList
          data={filteredPosts}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <PostCard
              post={item}
              isLiked={userLikes.includes(item.id)}
              onToggleLike={toggleLike}
            />
          )}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={{ height: Spacing.md }} />}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No posts yet. Be the first to share!</Text>
          }
        />
      </SafeAreaView>
      <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)} activeOpacity={0.85} accessibilityLabel="Share what you made">
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
      <ShareModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onPost={addShowcasePost}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  safeArea: { flex: 1 },
  headerBlock: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.lg, paddingBottom: Spacing.md, gap: Spacing.md },
  title: { fontFamily: FontFamily.headingExtraBold, fontSize: 26, color: Colors.textPrimary },
  filterRow: { gap: Spacing.sm, paddingVertical: Spacing.xs },
  listContent: { paddingHorizontal: Spacing.xl, paddingBottom: 100 },
  emptyText: { fontFamily: FontFamily.body, fontSize: FontSize.body, color: Colors.textSecondary, textAlign: 'center', marginTop: 40 },
  fab: {
    position: 'absolute', bottom: 28, right: 24,
    width: TouchTarget.fab, height: TouchTarget.fab,
    borderRadius: TouchTarget.fab / 2, backgroundColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.5, shadowRadius: 8, elevation: 8,
  },
  fabText: { fontFamily: FontFamily.headingExtraBold, fontSize: 30, color: Colors.background, lineHeight: 34 },
});
