// services/supabaseService.js
// All Supabase DB calls for TechQuest

import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── Supabase client ──────────────────────────────────────────────────────────

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// ─── Level helper ──────────────────────────────────────────────────────────────
function xpToLevel(xp) {
  if (xp >= 2000) return 'Legend';
  if (xp >= 1200) return 'Pioneer';
  if (xp >= 700)  return 'Trailblazer';
  if (xp >= 300)  return 'Explorer';
  return 'Beginner';
}

// ─── Relative time helper ──────────────────────────────────────────────────────
function timeAgo(timestamp) {
  if (!timestamp) return '';
  const diff = Date.now() - new Date(timestamp).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins  < 2)  return 'Just now';
  if (hours < 1)  return `${mins}m ago`;
  if (days  < 1)  return `${hours}h ago`;
  return `${days}d ago`;
}

// ─── USER FUNCTIONS ───────────────────────────────────────────────────────────

export async function createUser(name) {
  try {
    const { data, error } = await supabase
      .from('users')
      .insert({ name, xp: 0, level: 'Beginner' })
      .select()
      .single();
    if (error) throw error;
    return data;
  } catch (e) {
    console.error('createUser error:', e);
    return null;
  }
}

export async function getUserById(id) {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .maybeSingle();          // ← was .single() — maybeSingle() returns null instead of throwing on 0 rows
    if (error) throw error;
    return data;               // null if user not found — callers handle this gracefully
  } catch (e) {
    console.error('getUserById error:', e);
    return null;
  }
}

export async function updateUserXP(userId, xpToAdd) {
  try {
    // Fetch current XP first
    const { data: user, error: fetchErr } = await supabase
      .from('users')
      .select('xp')
      .eq('id', userId)
      .single();
    if (fetchErr) throw fetchErr;

    const newXP = (user?.xp || 0) + xpToAdd;
    const newLevel = xpToLevel(newXP);

    const { data, error } = await supabase
      .from('users')
      .update({ xp: newXP, level: newLevel })
      .eq('id', userId)
      .select()
      .single();
    if (error) throw error;
    return data;
  } catch (e) {
    console.error('updateUserXP error:', e);
    return null;
  }
}

// ─── STREAK HELPER (internal) ─────────────────────────────────────────────────
async function updateUserStreak(userId) {
  try {
    const { data: u } = await supabase
      .from('users')
      .select('streak, last_active_date')
      .eq('id', userId)
      .maybeSingle();

    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    if (u?.last_active_date === today) return;            // already updated today

    const yDate = new Date();
    yDate.setDate(yDate.getDate() - 1);
    const yesterday = yDate.toISOString().split('T')[0];

    const newStreak = u?.last_active_date === yesterday ? (u.streak || 0) + 1 : 1;

    await supabase
      .from('users')
      .update({ streak: newStreak, last_active_date: today })
      .eq('id', userId);
  } catch (e) {
    console.warn('updateUserStreak error:', e);
  }
}

// ─── QUEST FUNCTIONS ──────────────────────────────────────────────────────────

export async function getAllQuests() {
  try {
    const { data, error } = await supabase
      .from('quests')
      .select('*')
      .order('order_index', { ascending: true });
    if (error) throw error;
    return data || [];
  } catch (e) {
    console.error('getAllQuests error:', e);
    return [];
  }
}

export async function getUserQuestProgress(userId) {
  try {
    const { data, error } = await supabase
      .from('quest_progress')
      .select('*')
      .eq('user_id', userId);
    if (error) throw error;
    return data || [];
  } catch (e) {
    console.error('getUserQuestProgress error:', e);
    return [];
  }
}

export async function upsertQuestStep(userId, questId, stepField, questXP) {
  try {
    // Fetch existing progress
    const { data: existing } = await supabase
      .from('quest_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('quest_id', questId)
      .maybeSingle();

    const merged = { ...(existing || {}), [stepField]: true };
    const allDone = merged.watch_done && merged.try_done && merged.share_done;
    const wasAlreadyCompleted = existing?.completed === true;

    const upsertData = {
      user_id: userId,
      quest_id: questId,
      watch_done: merged.watch_done || false,
      try_done:   merged.try_done   || false,
      share_done: merged.share_done || false,
      [stepField]: true,
      ...(allDone ? { completed: true, completed_at: new Date().toISOString() } : {}),
    };

    const { data, error } = await supabase
      .from('quest_progress')
      .upsert(upsertData, { onConflict: 'user_id,quest_id' })
      .select()
      .single();
    if (error) throw error;

    // Grant XP if quest just completed now (not previously)
    if (allDone && !wasAlreadyCompleted) {
      await updateUserXP(userId, questXP);
    }

    // Update streak — any step activity counts as an active day
    await updateUserStreak(userId);

    return { row: data, justCompleted: allDone && !wasAlreadyCompleted };
  } catch (e) {
    console.error('upsertQuestStep error:', e);
    return { row: null, justCompleted: false };
  }
}

/**
 * Pure function — merges quests + progress rows into a display-ready array.
 */
export function buildQuestList(dbQuests, progressRows) {
  if (!dbQuests || dbQuests.length === 0) return [];

  let foundFirstActive = false;

  return dbQuests.map((q) => {
    const prog = progressRows.find((p) => p.quest_id === q.id);
    const isCompleted = prog?.completed === true;

    let status;
    if (isCompleted) {
      status = 'completed';
    } else if (!foundFirstActive) {
      status = 'active';
      foundFirstActive = true;
    } else {
      status = 'locked';
    }

    return {
      // JS-friendly field names matching what QuestCard/screens expect
      id:            q.id,
      name:          q.name,
      subtitle:      q.subtitle,
      icon:          q.icon,
      iconBg:        q.icon_bg,
      xp:            q.xp,
      estimatedTime: q.estimated_time,
      questCategory: q.quest_category || 'AI Tools',
      status,
      missions: [
        { id: `${q.id}-watch`, type: 'watch', label: 'Watch', done: prog?.watch_done || false },
        { id: `${q.id}-try`,   type: 'try',   label: 'Try',   done: prog?.try_done   || false },
        { id: `${q.id}-share`, type: 'share', label: 'Share', done: prog?.share_done || false },
      ],
    };
  });
}

// ─── SHOWCASE FUNCTIONS ───────────────────────────────────────────────────────

export async function getShowcasePosts() {
  try {
    const { data, error } = await supabase
      .from('showcase_posts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);
    if (error) throw error;
    return (data || []).map((p) => ({
      id:            p.id,
      authorName:    p.author_name,
      authorInitial: p.author_name?.[0]?.toUpperCase() || '?',
      authorLevel:   p.author_level,
      tool:          p.tool,
      text:          p.text,
      likes:         p.likes || 0,
      likedByMe:     false, // resolved separately via userLikes
      timestamp:     timeAgo(p.created_at),
    }));
  } catch (e) {
    console.error('getShowcasePosts error:', e);
    return [];
  }
}

export async function createShowcasePost(userId, authorName, authorLevel, tool, text) {
  try {
    const { data, error } = await supabase
      .from('showcase_posts')
      .insert({ user_id: userId, author_name: authorName, author_level: authorLevel, tool, text, likes: 0 })
      .select()
      .single();
    if (error) throw error;
    return {
      id:            data.id,
      authorName:    data.author_name,
      authorInitial: data.author_name?.[0]?.toUpperCase() || '?',
      authorLevel:   data.author_level,
      tool:          data.tool,
      text:          data.text,
      likes:         0,
      likedByMe:     false,
      timestamp:     'Just now',
    };
  } catch (e) {
    console.error('createShowcasePost error:', e);
    return null;
  }
}

export async function togglePostLike(userId, postId, currentlyLiked) {
  try {
    if (currentlyLiked) {
      // Remove like
      await supabase
        .from('post_likes')
        .delete()
        .eq('user_id', userId)
        .eq('post_id', postId);

      // Decrement likes count
      const { data: post } = await supabase
        .from('showcase_posts')
        .select('likes')
        .eq('id', postId)
        .single();
      const newCount = Math.max(0, (post?.likes || 1) - 1);
      await supabase
        .from('showcase_posts')
        .update({ likes: newCount })
        .eq('id', postId);
      return newCount;
    } else {
      // Add like
      await supabase
        .from('post_likes')
        .insert({ user_id: userId, post_id: postId });

      const { data: post } = await supabase
        .from('showcase_posts')
        .select('likes')
        .eq('id', postId)
        .single();
      const newCount = (post?.likes || 0) + 1;
      await supabase
        .from('showcase_posts')
        .update({ likes: newCount })
        .eq('id', postId);
      return newCount;
    }
  } catch (e) {
    console.error('togglePostLike error:', e);
    return null;
  }
}

export async function getUserLikes(userId) {
  try {
    const { data, error } = await supabase
      .from('post_likes')
      .select('post_id')
      .eq('user_id', userId);
    if (error) throw error;
    return (data || []).map((r) => r.post_id);
  } catch (e) {
    console.error('getUserLikes error:', e);
    return [];
  }
}

// ─── LEADERBOARD FUNCTIONS ────────────────────────────────────────────────────

export async function getLeaderboard() {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, name, xp, level')
      .order('xp', { ascending: false })
      .limit(20);
    if (error) throw error;
    return data || [];
  } catch (e) {
    console.error('getLeaderboard error:', e);
    return [];
  }
}

// ─── SCAM FUNCTIONS ───────────────────────────────────────────────────────────

export async function saveScamReport(userId, inputText, verdict, explanation, riskLevel) {
  try {
    const { data, error } = await supabase
      .from('scam_reports')
      .insert({ user_id: userId, input_text: inputText, verdict, explanation, risk_level: riskLevel })
      .select()
      .single();
    if (error) throw error;
    return data;
  } catch (e) {
    console.error('saveScamReport error:', e);
    return null;
  }
}

export async function getUserScamHistory(userId) {
  try {
    const { data, error } = await supabase
      .from('scam_reports')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20);
    if (error) throw error;
    return (data || []).map((r) => ({
      id:          r.id,
      inputText:   r.input_text,
      verdict:     r.verdict,
      explanation: r.explanation,
      riskLevel:   r.risk_level,
      timestamp:   timeAgo(r.created_at),
    }));
  } catch (e) {
    console.error('getUserScamHistory error:', e);
    return [];
  }
}

export async function logSpamEducationView(userId) {
  try {
    await supabase.from('spam_education_views').insert({ user_id: userId });
  } catch (e) {
    console.warn('logSpamEducationView error:', e);
  }
}

// ─── NEWS FUNCTIONS ───────────────────────────────────────────────────────────

export async function getNewsArticles() {
  try {
    const { data, error } = await supabase
      .from('news_articles')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);
    if (error) throw error;
    return (data || []).map((a) => ({
      id:           a.id,
      category:     a.category,
      headline:     a.headline,
      summary:      a.summary,
      whyItMatters: a.why_it_matters,
      readTime:     a.read_time,
    }));
  } catch (e) {
    console.error('getNewsArticles error:', e);
    return [];
  }
}

export async function saveNewsArticle(category, headline, summary, whyItMatters, readTime) {
  try {
    const { data, error } = await supabase
      .from('news_articles')
      .insert({ category, headline, summary, why_it_matters: whyItMatters, read_time: readTime })
      .select()
      .single();
    if (error) throw error;
    return {
      id:           data.id,
      category:     data.category,
      headline:     data.headline,
      summary:      data.summary,
      whyItMatters: data.why_it_matters,
      readTime:     data.read_time,
    };
  } catch (e) {
    console.error('saveNewsArticle error:', e);
    return null;
  }
}

// ─── REALTIME FUNCTIONS ───────────────────────────────────────────────────────

export function subscribeToLeaderboard(callback) {
  const channel = supabase
    .channel('leaderboard-changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, () => callback())
    .subscribe();
  return channel;
}

export function subscribeToShowcase(callback) {
  const channel = supabase
    .channel('showcase-inserts')
    .on('postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'showcase_posts' },
      (payload) => callback(payload.new)
    )
    .subscribe();
  return channel;
}
