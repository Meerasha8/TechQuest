// services/claudeService.js
// Re-export shim — keeps GuideScreen.jsx and NewsScreen.jsx working
// without any changes. All logic lives in groqService.js.
export { sendGuideMessage, generateNewsArticle, getQuestRecommendation, analyzeScam } from './groqService';
