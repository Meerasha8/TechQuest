import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Speech from 'expo-speech';
import { useAppContext } from '../context/AppContext';
import { sendGuideMessage } from '../services/claudeService';
import TypingIndicator from '../components/TypingIndicator';
import { Colors, FontFamily, FontSize, Spacing, Radius, TouchTarget } from '../constants/theme';

// ─── Tool name detection for inline quest card ─────────────────────────────────
const QUEST_TOOL_NAMES = ['ChatGPT', 'Claude', 'Google Lens', 'Google Maps', 'Google Translate', 'Gemini'];

function detectQuestInText(text) {
  return QUEST_TOOL_NAMES.find((name) =>
    text.toLowerCase().includes(name.toLowerCase())
  ) || null;
}

// ─── Inline Mini Quest Card ────────────────────────────────────────────────────
function InlineQuestCard({ questName, quest, navigation }) {
  if (!quest) return null;
  return (
    <TouchableOpacity
      style={iqStyles.card}
      onPress={() => navigation.navigate('QuestDetail', { questId: quest.id })}
      activeOpacity={0.85}
      accessibilityLabel={`Start ${questName} quest`}
    >
      <View style={iqStyles.left}>
        <View style={[iqStyles.iconBox, { backgroundColor: quest.iconBg }]}>
          <Text style={iqStyles.icon}>{quest.icon}</Text>
        </View>
        <View>
          <Text style={iqStyles.name}>{quest.name}</Text>
          <Text style={iqStyles.meta}>⚡ +{quest.xp} XP  ·  {quest.estimatedTime}</Text>
        </View>
      </View>
      <View style={iqStyles.btn}>
        <Text style={iqStyles.btnText}>Start Quest →</Text>
      </View>
    </TouchableOpacity>
  );
}

const iqStyles = StyleSheet.create({
  card: {
    backgroundColor: Colors.background,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    padding: Spacing.md,
    marginTop: Spacing.sm,
    gap: Spacing.sm,
  },
  left: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  iconBox: { width: 36, height: 36, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  icon: { fontSize: 18 },
  name: { fontFamily: FontFamily.mono, fontSize: 13, color: Colors.primary },
  meta: { fontFamily: FontFamily.body, fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  btn: { backgroundColor: Colors.primary, borderRadius: Radius.full, paddingVertical: 8, paddingHorizontal: 16, alignSelf: 'flex-start' },
  btnText: { fontFamily: FontFamily.bodyBold, fontSize: 14, color: Colors.background },
});

// ─── Chat Bubble ───────────────────────────────────────────────────────────────
function ChatBubble({ message, quests, navigation }) {
  const isUser = message.role === 'user';
  const detectedTool = !isUser ? detectQuestInText(message.text) : null;
  const linkedQuest = detectedTool ? quests.find((q) => q.name.toLowerCase().includes(detectedTool.toLowerCase())) : null;

  return (
    <View style={[cbStyles.wrapper, isUser && cbStyles.wrapperUser]}>
      <View style={[cbStyles.bubble, isUser ? cbStyles.bubbleUser : cbStyles.bubbleAI]}>
        <Text style={[cbStyles.text, isUser && cbStyles.textUser]}>{message.text}</Text>
        {linkedQuest && (
          <InlineQuestCard
            questName={detectedTool}
            quest={linkedQuest}
            navigation={navigation}
          />
        )}
      </View>
      <Text style={[cbStyles.time, isUser && cbStyles.timeUser]}>{message.time}</Text>
    </View>
  );
}

const cbStyles = StyleSheet.create({
  wrapper: { alignItems: 'flex-start', marginBottom: Spacing.md, maxWidth: '82%', alignSelf: 'flex-start' },
  wrapperUser: { alignSelf: 'flex-end', alignItems: 'flex-end' },
  bubble: { backgroundColor: Colors.surface, borderRadius: Radius.lg, borderTopLeftRadius: 4, padding: Spacing.lg },
  bubbleUser: { backgroundColor: Colors.primary, borderTopLeftRadius: Radius.lg, borderTopRightRadius: 4 },
  text: { fontFamily: FontFamily.body, fontSize: FontSize.body, color: Colors.textPrimary, lineHeight: FontSize.body * 1.6 },
  textUser: { fontFamily: FontFamily.bodyBold, color: Colors.background },
  time: { fontFamily: FontFamily.body, fontSize: 12, color: Colors.textSecondary, marginTop: 4 },
  timeUser: { textAlign: 'right' },
});

// ─── Suggestion Chip ───────────────────────────────────────────────────────────
function SuggestionChip({ text, onPress }) {
  return (
    <TouchableOpacity
      style={scStyles.chip}
      onPress={() => onPress(text)}
      activeOpacity={0.75}
      accessibilityLabel={text}
    >
      <Text style={scStyles.text}>{text}</Text>
    </TouchableOpacity>
  );
}

const scStyles = StyleSheet.create({
  chip: { backgroundColor: Colors.surface, borderWidth: 1.5, borderColor: Colors.primary, borderRadius: Radius.full, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, minHeight: 48, justifyContent: 'center', marginBottom: Spacing.sm },
  text: { fontFamily: FontFamily.mono, fontSize: 13, color: Colors.primary, letterSpacing: 0.2 },
});

const SUGGESTIONS = [
  'What is ChatGPT?',
  'Which tool helps me translate?',
  'What quest should I try next?',
  'How do I use Google Maps?',
];

const INITIAL_MESSAGES = [
  {
    id: 'ai-0',
    role: 'ai',
    text: "Hello! I'm your AI Guide 👋 I'm here to help you learn about technology. What would you like to know?",
    time: 'Just now',
  },
];

// ─── GuideScreen ──────────────────────────────────────────────────────────────
export default function GuideScreen({ navigation }) {
  const { quests } = useAppContext();
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  // Claude conversation history: {role: 'user' | 'assistant', content: string}
  const [conversationHistory, setConversationHistory] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);
  const flatListRef = useRef(null);

  const hasMessaged = messages.length > 1;
  const lastAIMessage = [...messages].reverse().find((m) => m.role === 'ai');

  const handleSpeakLastMessage = () => {
    if (!lastAIMessage) return;
    Speech.speak(lastAIMessage.text, { rate: 0.85, pitch: 1.0 });
  };

  const sendMessage = async (text) => {
    const trimmed = text.trim();
    if (!trimmed || isTyping) return;
    setInputText('');

    const userMsg = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: trimmed,
      time: 'Just now',
    };
    setMessages((prev) => [...prev, userMsg]);

    const newHistory = [...conversationHistory, { role: 'user', content: trimmed }];
    setConversationHistory(newHistory);
    setIsTyping(true);

    try {
      const reply = await sendGuideMessage(conversationHistory, trimmed);
      const aiMsg = {
        id: `ai-${Date.now()}`,
        role: 'ai',
        text: reply,
        time: 'Just now',
      };
      setMessages((prev) => [...prev, aiMsg]);
      setConversationHistory((prev) => [...prev, { role: 'assistant', content: reply }]);
    } catch (e) {
      console.warn('Claude guide error:', e);
      const errMsg = {
        id: `ai-err-${Date.now()}`,
        role: 'ai',
        text: "Oops! I couldn't connect right now. Please check your internet and try again.",
        time: 'Just now',
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  useEffect(() => {
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
  }, [messages, isTyping]);

  const renderItem = ({ item }) => (
    <ChatBubble message={item} quests={quests} navigation={navigation} />
  );

  return (
    <View style={styles.screen}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* ── Header ── */}
        <View style={styles.header}>
          <View style={styles.robotAvatar}>
            <Text style={styles.robotEmoji}>🤖</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>Your AI Guide</Text>
            <Text style={styles.headerSub}>Ask me anything about technology!</Text>
          </View>
          {/* Speak last message button */}
          <TouchableOpacity
            style={styles.speakBtn}
            onPress={handleSpeakLastMessage}
            accessibilityLabel="Read last message aloud"
          >
            <Text style={styles.speakEmoji}>🔊</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.divider} />

        {/* ── Chat + input ── */}
        <KeyboardAvoidingView
          style={styles.kav}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={styles.chatContent}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            ListFooterComponent={isTyping ? <TypingIndicator /> : null}
          />

          {/* Suggestion chips */}
          {!hasMessaged && (
            <View style={styles.suggestionsBlock}>
              {SUGGESTIONS.map((s) => (
                <SuggestionChip key={s} text={s} onPress={sendMessage} />
              ))}
            </View>
          )}

          {/* Input bar */}
          <View style={styles.inputBar}>
            <TouchableOpacity
              style={styles.micBtn}
              onPress={handleSpeakLastMessage}
              accessibilityLabel="Read last message aloud"
            >
              <Text style={styles.micEmoji}>🎤</Text>
            </TouchableOpacity>

            <TextInput
              style={[styles.input, inputFocused && styles.inputFocused]}
              placeholder="Ask a question..."
              placeholderTextColor={Colors.textSecondary}
              value={inputText}
              onChangeText={setInputText}
              onFocus={() => setInputFocused(true)}
              onBlur={() => setInputFocused(false)}
              returnKeyType="send"
              onSubmitEditing={() => sendMessage(inputText)}
              blurOnSubmit={false}
              multiline={false}
              editable={!isTyping}
            />

            <TouchableOpacity
              style={[styles.sendBtn, (!inputText.trim() || isTyping) && styles.sendBtnDisabled]}
              onPress={() => sendMessage(inputText)}
              disabled={!inputText.trim() || isTyping}
              activeOpacity={0.8}
              accessibilityLabel="Send message"
            >
              <Text style={styles.sendArrow}>→</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  safeArea: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingHorizontal: Spacing.xl, paddingTop: Spacing.lg, paddingBottom: Spacing.md },
  robotAvatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  robotEmoji: { fontSize: 24 },
  headerTitle: { fontFamily: FontFamily.headingExtraBold, fontSize: 22, color: Colors.textPrimary },
  headerSub: { fontFamily: FontFamily.body, fontSize: FontSize.caption, color: Colors.textSecondary, marginTop: 2, lineHeight: 20 },
  speakBtn: { width: 48, height: 48, borderRadius: 24, borderWidth: 1.5, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  speakEmoji: { fontSize: 20 },
  divider: { height: 1, backgroundColor: Colors.border, marginHorizontal: Spacing.xl },
  kav: { flex: 1 },
  chatContent: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.lg, paddingBottom: Spacing.md },
  suggestionsBlock: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.sm, paddingBottom: Spacing.md },
  inputBar: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md, backgroundColor: Colors.surface, borderTopWidth: 1, borderTopColor: Colors.border },
  micBtn: { width: 48, height: 48, borderRadius: 24, borderWidth: 1.5, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  micEmoji: { fontSize: 22 },
  input: { flex: 1, height: TouchTarget.min, backgroundColor: Colors.background, borderRadius: Radius.md, borderWidth: 2, borderColor: Colors.border, paddingHorizontal: Spacing.lg, fontFamily: FontFamily.body, fontSize: FontSize.body, color: Colors.textPrimary },
  inputFocused: { borderColor: Colors.primary },
  sendBtn: { width: 48, height: 48, borderRadius: 24, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  sendBtnDisabled: { opacity: 0.35 },
  sendArrow: { fontFamily: FontFamily.headingExtraBold, fontSize: 20, color: Colors.background },
});
