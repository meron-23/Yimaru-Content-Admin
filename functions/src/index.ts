import { initializeApp } from 'firebase-admin/app';
import { getFirestore, type DocumentData } from 'firebase-admin/firestore';
import { defineSecret } from 'firebase-functions/params';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { logger } from 'firebase-functions';

initializeApp();

const db = getFirestore();
const telegramBotToken = defineSecret('TELEGRAM_BOT_TOKEN');
const telegramChatId = defineSecret('TELEGRAM_CHAT_ID');

type TelegramButton = {
  text: string;
  url: string;
};

type ContentItem = DocumentData & {
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
    default:
      text = `📢 *${item.title || 'Educational Content'}*\n\n${item.message || item.description || ''}`;
  }

  if (item.appUrl?.trim()) buttons.push({ text: item.callToAction || '📱 Practice in App', url: item.appUrl });
  if (item.youtubeUrl?.trim()) buttons.push({ text: '▶️ Watch on YouTube', url: item.youtubeUrl });

  return { text: text.trim(), imageUrl: item.imageUrl, buttons };
}

async function sendTelegramPost(item: ContentItem): Promise<number> {
  const rendered = renderTelegramPost(item);
  const method = rendered.imageUrl ? 'sendPhoto' : 'sendMessage';
  const payload = rendered.imageUrl
    ? { chat_id: telegramChatId.value(), photo: rendered.imageUrl, caption: rendered.text, parse_mode: 'Markdown', reply_markup: rendered.buttons.length ? { inline_keyboard: [rendered.buttons] } : undefined }
    : { chat_id: telegramChatId.value(), text: rendered.text, parse_mode: 'Markdown', reply_markup: rendered.buttons.length ? { inline_keyboard: [rendered.buttons] } : undefined };

  const response = await fetch(`https://api.telegram.org/bot${telegramBotToken.value()}/${method}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const result = await response.json() as { ok: boolean; description?: string; result?: { message_id: number } };

  if (!response.ok || !result.ok || !result.result) {
    throw new Error(result.description || `Telegram request failed with status ${response.status}`);
  }

  return result.result.message_id;
}

async function publishContentItem(contentId: string): Promise<number> {
  const contentRef = db.collection('content').doc(contentId);
  const snapshot = await contentRef.get();
  if (!snapshot.exists) throw new Error('Content item not found');

  const item = { id: snapshot.id, ...snapshot.data() } as ContentItem;
  if (item.status !== 'SCHEDULED' && item.status !== 'APPROVED') {
    throw new Error(`Content must be approved or scheduled before publishing (current status: ${item.status || 'unknown'})`);
  }

  try {
    const telegramMessageId = await sendTelegramPost(item);
    await contentRef.update({
      status: 'PUBLISHED',
      publishedAt: new Date().toISOString(),
      telegramMessageId,
      telegramPublishError: null,
      updatedAt: new Date().toISOString()
    });
    return telegramMessageId;
  } catch (error) {
    await contentRef.update({
      telegramPublishError: error instanceof Error ? error.message : 'Telegram publishing failed',
      updatedAt: new Date().toISOString()
    });
    throw error;
  }
}

export const publishContentNow = onCall({ secrets: [telegramBotToken, telegramChatId] }, async (request) => {
  const contentId = request.data?.contentId;
  if (typeof contentId !== 'string' || !contentId.trim()) {
    throw new HttpsError('invalid-argument', 'contentId is required');
  }

  try {
    const telegramMessageId = await publishContentItem(contentId);
    return { ok: true, telegramMessageId };
  } catch (error) {
    logger.error('Manual Telegram publish failed', { contentId, error });
    throw new HttpsError('failed-precondition', error instanceof Error ? error.message : 'Telegram publishing failed');
  }
});

export const publishScheduledContent = onSchedule({ schedule: 'every 1 minutes', timeZone: 'UTC', secrets: [telegramBotToken, telegramChatId] }, async () => {
  const now = new Date().toISOString();
  const snapshot = await db.collection('content').where('status', '==', 'SCHEDULED').limit(100).get();

  for (const document of snapshot.docs) {
    const item = { id: document.id, ...document.data() } as ContentItem;
    if (!item.scheduledAt || item.scheduledAt > now) continue;

    try {
      await publishContentItem(item.id);
      logger.info('Scheduled Telegram post published', { contentId: item.id });
    } catch (error) {
      logger.error('Scheduled Telegram publish failed', { contentId: item.id, error });
    }
  }
});
