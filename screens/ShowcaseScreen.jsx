import React, { useState } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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

  const handlePost = () => {
    if (!text.trim()) return;
    onPost(selectedTool, text.trim());
    setText('');
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <TouchableOpacity style={smStyles.backdrop} activeOpacity={1} onPress={onClose} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={smStyles.kavWrapper}>
        <View style={smStyles.sheet}>
          <View style={smStyles.handle} />
          <Text style={smStyles.title}>Share What You Made</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }} contentContainerStyle={{ gap: Spacing.sm, paddingVertical: Spacing.xs }}>
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
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const smStyles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  kavWrapper: { position: 'absolute', bottom: 0, left: 0, right: 0 },
  sheet: { backgroundColor: Colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: Spacing.xl, gap: Spacing.lg, paddingBottom: 40 },
  handle: { width: 48, height: 4, backgroundColor: Colors.border, borderRadius: 2, alignSelf: 'center', marginBottom: Spacing.sm },
  title: { fontFamily: FontFamily.headingBold, fontSize: FontSize.sectionHeader, color: Colors.textPrimary },
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
