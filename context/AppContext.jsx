import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { QUESTS as FALLBACK_QUESTS } from '../data/quests';
import {
  createUser,
  getUserById,
  getAllQuests,
  getUserQuestProgress,
  upsertQuestStep,
  buildQuestList,
  getShowcasePosts,
  createShowcasePost,
  togglePostLike,
  getUserLikes,
  getLeaderboard,
  saveScamReport,
  getUserScamHistory,
  logSpamEducationView,
  getNewsArticles,
  subscribeToLeaderboard,
  subscribeToShowcase,
} from '../services/supabaseService';

const USER_ID_KEY = 'user_id';

// ─── Level helpers (exported for use in screens) ───────────────────────────────
const LEVELS = [
  { min: 0,    max: 299,      name: 'Beginner',    num: 1 },
  { min: 300,  max: 699,      name: 'Explorer',    num: 2 },
  { min: 700,  max: 1199,     name: 'Trailblazer', num: 3 },
  { min: 1200, max: 1999,     name: 'Pioneer',     num: 4 },
  { min: 2000, max: Infinity, name: 'Legend',      num: 5 },
];

export function getLevel(xp = 0) {
  return (LEVELS.find((l) => xp >= l.min && xp <= l.max) || LEVELS[LEVELS.length - 1]).name;
}

export function getLevelNum(xp = 0) {
  return (LEVELS.find((l) => xp >= l.min && xp <= l.max) || LEVELS[LEVELS.length - 1]).num;
}

export function getLevelProgress(xp = 0) {
  const lvl = LEVELS.find((l) => xp >= l.min && xp <= l.max) || LEVELS[LEVELS.length - 1];
  if (lvl.max === Infinity) {
    return { current: xp - lvl.min, max: Math.max(xp - lvl.min, 1), nextName: 'Legend', nextNum: 5 };
  }
  const nextLvl = LEVELS[lvl.num] || lvl;
  return {
    current:  xp - lvl.min,
    max:      lvl.max - lvl.min + 1,
    nextName: nextLvl.name,
    nextNum:  lvl.num + 1,
  };
}

// ─── Context ──────────────────────────────────────────────────────────────────
const AppContext = createContext(null);

export function AppContextProvider({ children }) {
  const [user, setUser] = useState(null);           // { id, name, xp, level }
  const [quests, setQuests] = useState([]);
  const [showcasePosts, setShowcasePosts] = useState([]);
  const [userLikes, setUserLikes] = useState([]);   // array of post IDs
  const [leaderboard, setLeaderboard] = useState([]);
  const [scamHistory, setScamHistory] = useState([]);
  const [justCompletedQuestId, setJustCompletedQuestId] = useState(null);
  const [loading, setLoading] = useState(true);

  // ── Load all data on mount ─────────────────────────────────────────────────
  useEffect(() => {
    const init = async () => {
      try {
        // 1. Check for saved user
        const savedId = await AsyncStorage.getItem(USER_ID_KEY);
        let loadedUser = null;
        if (savedId) {
          loadedUser = await getUserById(savedId); // returns null if user not in DB
          if (loadedUser) {
            setUser(loadedUser);
          } else {
            // Stale ID (e.g. DB was wiped) — clear it so next launch shows Onboarding
            await AsyncStorage.removeItem(USER_ID_KEY);
          }
        }

        // 2. Load quests from DB (fallback to local data)
        const dbQuests = await getAllQuests();
        const questSource = dbQuests.length > 0 ? dbQuests : null;

        if (questSource) {
          const progressRows = loadedUser
            ? await getUserQuestProgress(loadedUser.id)
            : [];
          setQuests(buildQuestList(questSource, progressRows));
        } else {
          // Use local fallback data
          setQuests(FALLBACK_QUESTS);
        }

        // 3. Load showcase posts
        const posts = await getShowcasePosts();
        setShowcasePosts(posts);

        // 4. Load user likes + scam history
        if (loadedUser) {
          const [likes, history] = await Promise.all([
            getUserLikes(loadedUser.id),
            getUserScamHistory(loadedUser.id),
          ]);
          setUserLikes(likes);
          setScamHistory(history);
        }

        // 5. Load leaderboard
        const lb = await getLeaderboard();
        setLeaderboard(lb);
      } catch (e) {
        console.warn('AppContext init error:', e);
        setQuests(FALLBACK_QUESTS);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  // ── Realtime subscriptions ──────────────────────────────────────────────────
  useEffect(() => {
    const lbChannel = subscribeToLeaderboard(async () => {
      const lb = await getLeaderboard();
      setLeaderboard(lb);
    });

    const showcaseChannel = subscribeToShowcase((newRow) => {
      // Avoid duplicating posts we added ourselves optimistically
      setShowcasePosts((prev) => {
        if (prev.find((p) => p.id === newRow.id)) return prev;
        const mapped = {
          id:            newRow.id,
          authorName:    newRow.author_name,
          authorInitial: newRow.author_name?.[0]?.toUpperCase() || '?',
          authorLevel:   newRow.author_level,
          tool:          newRow.tool,
          text:          newRow.text,
          likes:         0,
          likedByMe:     false,
          timestamp:     'Just now',
        };
        return [mapped, ...prev];
      });
    });

    return () => {
      lbChannel?.unsubscribe?.();
      showcaseChannel?.unsubscribe?.();
    };
  }, []);

  // ── Helpers ────────────────────────────────────────────────────────────────
  const _refreshQuests = useCallback(async (userId) => {
    const dbQuests = await getAllQuests();
    if (dbQuests.length > 0) {
      const progressRows = await getUserQuestProgress(userId);
      setQuests(buildQuestList(dbQuests, progressRows));
    }
  }, []);

  // ── Actions ────────────────────────────────────────────────────────────────

  const registerUser = useCallback(async (name) => {
    try {
      const newUser = await createUser(name);
      if (!newUser) throw new Error('createUser returned null');
      await AsyncStorage.setItem(USER_ID_KEY, newUser.id);
      setUser(newUser);
      // Load quests with fresh progress (empty)
      const dbQuests = await getAllQuests();
      if (dbQuests.length > 0) {
        setQuests(buildQuestList(dbQuests, []));
      }
    } catch (e) {
      console.error('registerUser error:', e);
      throw e; // Re-throw so OnboardingScreen can handle
    }
  }, []);

  const completeStep = useCallback(async (questId, stepType) => {
    if (!user?.id) return false;
    const STEP_FIELD_MAP = { watch: 'watch_done', try: 'try_done', share: 'share_done' };
    const stepField = STEP_FIELD_MAP[stepType];
    if (!stepField) return false;

    const questData = quests.find((q) => q.id === questId);
    const questXP = questData?.xp || 0;

    const { justCompleted } = await upsertQuestStep(user.id, questId, stepField, questXP);

    // Refresh quest list from DB
    await _refreshQuests(user.id);

    // Refresh user XP
    const updatedUser = await getUserById(user.id);
    if (updatedUser) setUser(updatedUser);

    if (justCompleted) {
      setJustCompletedQuestId(questId);
    }

    return justCompleted;
  }, [user, quests, _refreshQuests]);

  const clearCompletedQuest = useCallback(() => {
    setJustCompletedQuestId(null);
  }, []);

  const addShowcasePost = useCallback(async (tool, text) => {
    if (!user?.id) return;
    const xp = user.xp || 0;
    const authorLevel = getLevel(xp);

    // Optimistic UI
    const tempPost = {
      id:            `temp-${Date.now()}`,
      authorName:    user.name,
      authorInitial: user.name?.[0]?.toUpperCase() || 'Y',
      authorLevel,
      tool,
      text,
      likes:         0,
      likedByMe:     false,
      timestamp:     'Just now',
    };
    setShowcasePosts((prev) => [tempPost, ...prev]);

    // Persist to DB
    const saved = await createShowcasePost(user.id, user.name, authorLevel, tool, text);
    if (saved) {
      // Replace temp entry with real DB row
      setShowcasePosts((prev) => prev.map((p) => p.id === tempPost.id ? saved : p));
    }
  }, [user]);

  const toggleLike = useCallback(async (postId) => {
    if (!user?.id) return;
    const currentlyLiked = userLikes.includes(postId);

    // Optimistic update
    setUserLikes((prev) =>
      currentlyLiked ? prev.filter((id) => id !== postId) : [...prev, postId]
    );
    setShowcasePosts((prev) =>
      prev.map((p) => p.id === postId
        ? { ...p, likes: currentlyLiked ? p.likes - 1 : p.likes + 1 }
        : p
      )
    );

    // Persist
    await togglePostLike(user.id, postId, currentlyLiked);
  }, [user, userLikes]);

  const refreshLeaderboard = useCallback(async () => {
    const lb = await getLeaderboard();
    setLeaderboard(lb);
  }, []);

  const refreshNews = useCallback(async () => {
    return getNewsArticles();
  }, []);

  const saveScamToHistory = useCallback(async (inputText, verdict, explanation, riskLevel) => {
    if (!user?.id) return;
    const saved = await saveScamReport(user.id, inputText, verdict, explanation, riskLevel);
    if (saved) {
      const mapped = {
        id:          saved.id,
        inputText:   saved.input_text,
        verdict:     saved.verdict,
        explanation: saved.explanation,
        riskLevel:   saved.risk_level,
        timestamp:   'Just now',
      };
      setScamHistory((prev) => [mapped, ...prev]);
    }
  }, [user]);

  const logSpamLesson = useCallback(async () => {
    if (!user?.id) return;
    await logSpamEducationView(user.id);
  }, [user]);

  const getCurrentUserXP = useCallback(() => user?.xp || 0, [user]);

  const value = {
    // State
    user,
    quests,
    showcasePosts,
    userLikes,
    leaderboard,
    scamHistory,
    justCompletedQuestId,
    loading,
    // Actions
    registerUser,
    completeStep,
    clearCompletedQuest,
    addShowcasePost,
    toggleLike,
    refreshLeaderboard,
    refreshNews,
    saveScamToHistory,
    logSpamLesson,
    getCurrentUserXP,
    // Helpers
    getLevel,
    getLevelNum,
    getLevelProgress,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppContext must be used within AppContextProvider');
  return ctx;
}

export default AppContext;
