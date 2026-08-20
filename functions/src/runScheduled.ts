import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { renderTelegramPost, type ContentItem } from './telegram.js';

const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;
const botToken = process.env.TELEGRAM_BOT_TOKEN;
const configuredChatId = process.env.TELEGRAM_CHAT_ID;

if (!serviceAccount || !botToken || !configuredChatId) {
  throw new Error('FIREBASE_SERVICE_ACCOUNT, TELEGRAM_BOT_TOKEN, and TELEGRAM_CHAT_ID are required');
}

const chatId: string = configuredChatId;

if (!getApps().length) {
  initializeApp({ credential: cert(JSON.parse(serviceAccount)) });
}

const db = getFirestore();

function getImageDownloadUrl(imageUrl: string): string {
  const fileId = imageUrl.match(/drive\.google\.com\/file\/d\/([^/]+)/)?.[1]
    || imageUrl.match(/[?&]id=([^&]+)/)?.[1];

  return fileId
    ? `https://drive.google.com/uc?export=download&id=${encodeURIComponent(fileId)}`
    : imageUrl;
}

async function createTelegramPhoto(imageUrl: string): Promise<Blob> {
  const response = await fetch(getImageDownloadUrl(imageUrl));
  if (!response.ok) {
    throw new Error(`Image download failed with status ${response.status}`);
  }

  const contentType = response.headers.get('content-type') || '';
  if (!contentType.startsWith('image/')) {
    throw new Error(`Image URL returned ${contentType || 'unknown content'} instead of an image. Make the Drive file public.`);
  }

  return await response.blob();
}

async function sendTelegramPost(item: ContentItem): Promise<number> {
  const rendered = renderTelegramPost(item);
  const method = rendered.imageUrl ? 'sendPhoto' : 'sendMessage';
  let body: BodyInit;
  let headers: HeadersInit | undefined;

  if (rendered.imageUrl) {
    const form = new FormData();
    form.append('chat_id', chatId);
    form.append('photo', await createTelegramPhoto(rendered.imageUrl), 'content-image');
    form.append('caption', rendered.text);
    form.append('parse_mode', 'Markdown');
    if (rendered.buttons.length) {
      form.append('reply_markup', JSON.stringify({ inline_keyboard: [rendered.buttons] }));
    }
    body = form;
  } else {
    headers = { 'content-type': 'application/json' };
    body = JSON.stringify({
      chat_id: chatId,
      text: rendered.text,
      parse_mode: 'Markdown',
      reply_markup: rendered.buttons.length ? { inline_keyboard: [rendered.buttons] } : undefined
    });
  }

  const response = await fetch(`https://api.telegram.org/bot${botToken}/${method}`, {
    method: 'POST',
    headers,
    body
  });
  const result = await response.json() as { ok: boolean; description?: string; result?: { message_id: number } };
  if (!response.ok || !result.ok || !result.result) {
    throw new Error(result.description || `Telegram request failed with status ${response.status}`);
  }
  return result.result.message_id;
}

async function main(): Promise<void> {
  const now = new Date().toISOString();
  const snapshot = await db.collection('content').where('status', '==', 'SCHEDULED').limit(100).get();
  let published = 0;
  let waiting = 0;

  console.log(`Scheduler started at ${now}. Found ${snapshot.size} scheduled item(s).`);

  for (const document of snapshot.docs) {
    const item = { id: document.id, ...document.data() } as ContentItem;
    if (!item.scheduledAt || item.scheduledAt > now) {
      waiting += 1;
      console.log(`Waiting for ${item.id}; scheduledAt=${item.scheduledAt || 'missing'}`);
      continue;
    }

    try {
      const telegramMessageId = await sendTelegramPost(item);
      await document.ref.update({
        status: 'PUBLISHED',
        publishedAt: new Date().toISOString(),
        telegramMessageId,
        telegramPublishError: null,
        updatedAt: new Date().toISOString()
      });
      published += 1;
      console.log(`Published ${item.id} to Telegram`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Telegram publishing failed';
      await document.ref.update({ telegramPublishError: message, updatedAt: new Date().toISOString() });
      console.error(`Failed to publish ${item.id}: ${message}`);
      process.exitCode = 1;
    }
  }

  console.log(`Scheduler finished. Published ${published} item(s); ${waiting} item(s) still waiting.`);
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});