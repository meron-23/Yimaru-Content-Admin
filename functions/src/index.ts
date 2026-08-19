import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { defineSecret } from 'firebase-functions/params';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { logger } from 'firebase-functions';
import { renderTelegramPost, type ContentItem } from './telegram.js';

initializeApp();

const db = getFirestore();
const telegramBotToken = defineSecret('TELEGRAM_BOT_TOKEN');
const telegramChatId = defineSecret('TELEGRAM_CHAT_ID');

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
