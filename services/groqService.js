// services/groqService.js
// TechQuest AI Service — powered by Groq (free, works in India)
// Get your free API key at: console.groq.com → Sign up → API Keys

const GROQ_API_KEY = process.env.EXPO_PUBLIC_GROQ_API_KEY;
const API_URL = 'https://api.groq.com/openai/v1/chat/completions';

// ─── Core fetcher ──────────────────────────────────────────────────────────────
async function callGroq(systemPrompt, messages, model = 'llama-3.1-8b-instant', maxTokens = 300) {
  if (!GROQ_API_KEY) {
    throw new Error('Missing EXPO_PUBLIC_GROQ_API_KEY');
  }

  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      temperature: 0.7,
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages,
      ],
    }),
  });

  const data = await response.json();
  if (data.error) throw new Error(data.error.message);
  return data.choices[0].message.content;
}

// ─── 1. AI Guide ──────────────────────────────────────────────────────────────
const GUIDE_SYSTEM = `You are a friendly AI guide in TechQuest, an app helping seniors aged 60-85 learn AI tools. Answer in plain simple English, no jargon, max 4 sentences, warm and encouraging. If they mention ChatGPT, Claude, Google Lens, Google Maps, Google Translate, or Gemini — suggest the quest for that tool. End with a simple follow-up question.`;

export async function sendGuideMessage(conversationHistory, userMessage) {
  const messages = [
    ...conversationHistory,
    { role: 'user', content: userMessage },
  ];
  return callGroq(GUIDE_SYSTEM, messages, 'llama-3.1-8b-instant', 300);
}

// ─── 2. News Article Generator ────────────────────────────────────────────────
const NEWS_SYSTEM = `You write tech news for seniors aged 60-85. Simple language only. Be warm and practical.`;

const NEWS_FALLBACK = {
  category: 'AI TOOLS',
  headline: 'AI Tools Are Getting Easier to Use',
  summary:
    'New AI tools help with everyday tasks like writing and translating. Most are free on your phone. They get smarter and easier every month.',
  whyItMatters: 'These tools can help you stay connected and save time every day.',
  readTime: '2 min read',
};

export async function generateNewsArticle() {
  const userMsg =
    'Write about ONE recent technology topic useful for seniors. ' +
    'Reply with ONLY a raw JSON object, no markdown, no code fences. Exact format:\n' +
    '{"category":"AI TOOLS","headline":"max 8 words","summary":"exactly 3 simple sentences","whyItMatters":"1 sentence direct and personal","readTime":"2 min read"}\n' +
    'Category must be exactly one of: "AI TOOLS", "STAYING SAFE", or "NEW GADGETS".';

  try {
    const text = await callGroq(NEWS_SYSTEM, [{ role: 'user', content: userMsg }], 'llama-3.1-8b-instant', 300);
    const clean = text.replace(/```json?/gi, '').replace(/```/g, '').trim();
    const article = JSON.parse(clean);
    return {
      id: `news-${Date.now()}`,
      category:     article.category     || 'AI TOOLS',
      headline:     article.headline     || NEWS_FALLBACK.headline,
      summary:      article.summary      || NEWS_FALLBACK.summary,
      whyItMatters: article.whyItMatters || NEWS_FALLBACK.whyItMatters,
      readTime:     article.readTime     || '2 min read',
    };
  } catch (e) {
    console.warn('generateNewsArticle error — using fallback:', e);
    return { ...NEWS_FALLBACK, id: `news-fallback-${Date.now()}` };
  }
}

// ─── 3. Quest Recommendation ──────────────────────────────────────────────────
const RECOMMEND_SYSTEM = `You are an encouraging learning coach for seniors.`;

export async function getQuestRecommendation(completedQuestIds, allQuests) {
  const completedNames = completedQuestIds
    .map((id) => allQuests.find((q) => q.id === id)?.name)
    .filter(Boolean);
  const availableNames = allQuests
    .filter((q) => q.status === 'active' || q.status === 'locked')
    .map((q) => q.name);
  const completedPart = completedNames.length > 0
    ? `Completed quests: ${completedNames.join(', ')}.`
    : 'I have not completed any quests yet.';
  const userMsg = `${completedPart}\nAvailable quests: ${availableNames.join(', ')}.\nRecommend the best next quest in 2 simple sentences.`;
  return callGroq(RECOMMEND_SYSTEM, [{ role: 'user', content: userMsg }], 'llama-3.1-8b-instant', 200);
}

// ─── 4. Scam Analyzer ─────────────────────────────────────────────────────────
const SCAM_SYSTEM = `You are a scam detection expert helping senior citizens stay safe. Analyze the message and respond ONLY with a raw JSON object, no markdown, no fences:
{"verdict":"SCAM","risk_level":"HIGH","explanation":"2 sentences max, simple English, explain why it is or isn't a scam","warning_signs":["sign1","sign2"],"what_to_do":"1 sentence advice"}
verdict must be exactly "SCAM", "SAFE", or "SUSPICIOUS". risk_level must be "HIGH", "MEDIUM", or "LOW". Be definitive. Seniors need clear answers.`;

const SCAM_FALLBACK = {
  verdict: 'SUSPICIOUS',
  risk_level: 'MEDIUM',
  explanation: 'Could not analyze this message. When in doubt, do not respond to it.',
  warning_signs: [],
  what_to_do: 'Show this message to a trusted family member.',
};

export async function analyzeScam(text) {
  try {
    const response = await callGroq(
      SCAM_SYSTEM,
      [{ role: 'user', content: text }],
      'llama-3.3-70b-versatile',  // More accurate model for safety-critical analysis
      400
    );
    const clean = response.replace(/```json?/gi, '').replace(/```/g, '').trim();
    const result = JSON.parse(clean);
    // Validate required fields
    if (!result.verdict || !result.risk_level) throw new Error('Invalid scam response structure');
    return {
      verdict:       result.verdict,
      risk_level:    result.risk_level,
      explanation:   result.explanation   || SCAM_FALLBACK.explanation,
      warning_signs: Array.isArray(result.warning_signs) ? result.warning_signs : [],
      what_to_do:    result.what_to_do    || SCAM_FALLBACK.what_to_do,
    };
  } catch (e) {
    console.warn('analyzeScam error — using fallback:', e);
    return SCAM_FALLBACK;
  }
}

// ─── 5. Progress Motivational Message ───────────────────────────────────────
const PROGRESS_SYSTEM = `You write short, warm encouraging messages for senior citizens learning technology. Keep it to 1-2 sentences maximum, no jargon, very warm and celebratory.`;

export async function generateProgressMessage(completedCount, totalCount, levelName, nextQuestName) {
  const nextPart = nextQuestName
    ? ` Their next available quest is "${nextQuestName}"."`
    : ' They have completed every quest available — they are a true TechQuest Legend!';
  const userMsg = `The user has completed ${completedCount} out of ${totalCount} quests. Their current level is "${levelName}".${nextPart} Write one warm, encouraging sentence that celebrates their progress and gently nudges them forward.`;

  try {
    return await callGroq(PROGRESS_SYSTEM, [{ role: 'user', content: userMsg }], 'llama-3.1-8b-instant', 150);
  } catch (e) {
    const fallbacks = [
      `You've already taken the first step — and that's what matters most! Keep going! 🌟`,
      `You're a ${levelName} now, and every quest makes you stronger! 💪`,
      `Amazing work on ${completedCount} quests! You're showing the world what seniors can do! 🚀`,
    ];
    return fallbacks[completedCount % fallbacks.length];
  }
}

// ─── 6. Spam Education Chat ───────────────────────────────────────────────────
const SPAM_EDU_SYSTEM = `You are a patient, empathetic teacher. Answer a senior citizen's question about spam, phishing, or staying safe online. Keep answers in very simple English, max 3 sentences, no jargon, warm and reassuring tone.`;

export async function askAboutSpam(userQuestion) {
  try {
    return await callGroq(
      SPAM_EDU_SYSTEM,
      [{ role: 'user', content: userQuestion }],
      'llama-3.1-8b-instant',
      300
    );
  } catch (e) {
    console.warn('askAboutSpam error:', e);
    return "I'm having trouble connecting right now, but always remember: if you are unsure about an email, it's best to show it to a trusted family member.";
  }
}

// ─── 7. Email Safety Check (SpamEducationScreen) ──────────────────────────────
// ADD THIS FUNCTION TO services/groqService.js
const EMAIL_SAFETY_SYSTEM = `You are a friendly digital safety assistant for senior citizens. The user is asking whether an email they received is legitimate or spam. Answer in 2–3 plain English sentences. Never use jargon. Always end with a clear recommendation: safe to ignore, report it, or call a family member.`;

export async function askAboutEmail(userQuestion) {
  try {
    return await callGroq(
      EMAIL_SAFETY_SYSTEM,
      [{ role: 'user', content: userQuestion }],
      'llama-3.1-8b-instant',
      300
    );
  } catch (e) {
    return "I wasn't able to check that right now. If you're unsure, it's always safest to ignore the email and ask a family member.";
  }
}
