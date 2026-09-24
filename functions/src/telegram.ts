import type { DocumentData } from 'firebase-admin/firestore';

export type TelegramButton = {
  text: string;
  url: string;
};

export type ContentItem = DocumentData & {
  id: string;
  title?: string;
  contentType?: string;
  word?: string;
  pronunciation?: string;
  definition?: string;
  exampleSentence?: string;
  relatedWords?: string;
  term?: string;
  simpleExplanation?: string;
  example?: string;
  phrase?: string;
  meaning?: string;
  whenToUse?: string;
  exampleConversation?: string;
  caption?: string;
  additionalInfo?: string;
  description?: string;
  callToAction?: string;
  imageUrl?: string;
  youtubeUrl?: string;
  appUrl?: string;
  message?: string;
  status?: string;
  scheduledAt?: string;
  // Quiz fields
  quizQuestion?: string;
  quizOptions?: string[];
  quizCorrectAnswer?: string;
  quizExplanation?: string;
  quizTopic?: string;
};

export function renderTelegramPost(item: ContentItem): { text: string; imageUrl?: string; buttons: TelegramButton[] } {
  const type = item.contentType || 'word_of_day';
  const buttons: TelegramButton[] = [];
  let text = '';

  switch (type) {
    case 'word_of_day':
      text = `📚 WORD OF THE DAY\n\n🔤 *${item.word || item.title || 'Resilient'}*${item.pronunciation ? ` /${item.pronunciation}/` : ''}\n\n💡 *Meaning*\n${item.definition || item.description || ''}\n\n🗣️ *Example Sentence*\n"${item.exampleSentence || item.example || ''}"`;
      if (item.relatedWords?.trim()) text += `\n\n🔗 *Related Words*\n${item.relatedWords}`;
      break;
    case 'definition':
      text = `📖 ENGLISH DEFINITION\n\n📌 *${item.term || item.title || 'Idiom'}*\n\n💡 *Definition*\n${item.definition || ''}`;
      if (item.simpleExplanation?.trim()) text += `\n\n💬 *Simple Explanation*\n${item.simpleExplanation}`;
      if ((item.example || item.exampleSentence)?.trim()) text += `\n\n🗣️ *Example*\n"${item.example || item.exampleSentence}"`;
      break;
    case 'phrase':
      text = `💬 PHRASE OF THE DAY\n\n✨ *"${item.phrase || item.title || 'Break the ice'}"*\n\n💡 *Meaning*\n${item.meaning || item.definition || ''}`;
      if (item.whenToUse?.trim()) text += `\n\n🎯 *When to Use*\n${item.whenToUse}`;
      if (item.exampleSentence?.trim()) text += `\n\n🗣️ *Example Sentence*\n"${item.exampleSentence}"`;
      if (item.exampleConversation?.trim()) text += `\n\n💬 *Example Conversation*\n${item.exampleConversation}`;
      break;
    case 'informative_photo':
      text = `🖼️ *${item.title || 'English lesson'}*\n\n${item.caption || item.description || ''}`;
      if (item.additionalInfo?.trim()) text += `\n\n💡 *Key Takeaway*\n${item.additionalInfo}`;
      break;
    case 'youtube_resource':
      text = `🎬 YOUTUBE LESSON\n\n▶️ *${item.title || 'Video lesson'}*\n\n${item.description || ''}`;
      break;
    case 'app_resource':
      text = `🚀 APP EXERCISE\n\n📲 *${item.title || 'Practice exercise'}*\n\n${item.description || ''}`;
      if (item.callToAction?.trim()) text += `\n\n⚡ *${item.callToAction}*`;
      break;
    case 'quiz': {
      const question = item.quizQuestion || item.title || 'Which sentence is correct?';
      const options = item.quizOptions && item.quizOptions.length > 0
        ? item.quizOptions
        : [];
      const topic = item.quizTopic ? ` — ${item.quizTopic}` : '';
      text = `🧠 ENGLISH QUIZ${topic}\n\n❓ *${question}*`;
      if (options.length > 0) {
        text += `\n\n${options.map(opt => `  ${opt}`).join('\n')}`;
      }
      text += `\n\n👇 *Reply with your answer!*`;
      if (item.quizExplanation?.trim()) text += `\n\n💡 *Answer & Explanation*\n${item.quizExplanation}`;
      break;
    }
    default:
      text = `📢 *${item.title || 'Educational Content'}*\n\n${item.message || item.description || ''}`;
  }

  if (item.appUrl?.trim()) buttons.push({ text: item.callToAction || '📱 Practice in App', url: item.appUrl });
  if (item.youtubeUrl?.trim()) buttons.push({ text: '▶️ Watch on YouTube', url: item.youtubeUrl });

  return { text: text.trim(), imageUrl: item.imageUrl, buttons };
}
