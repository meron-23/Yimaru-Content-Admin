import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore, type DocumentData } from 'firebase-admin/firestore';

type ContentItem = DocumentData & {
  id: string;
  status?: string;
  scheduledAt?: string;
  imageUrl?: string;
};

const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;
const botToken = process.env.TELEGRAM_BOT_TOKEN;
const chatId = process.env.TELEGRAM_CHAT_ID;

if (!serviceAccount || !botToken || !chatId) {
  throw new Error('FIREBASE_SERVICE_ACCOUNT, TELEGRAM_BOT_TOKEN, and TELEGRAM_CHAT_ID are required');
}

if (!getApps().length) {
  initializeApp({ credential: cert(JSON.parse(serviceAccount)) });
}

const db = getFirestore();
let renderTelegramPost: typeof import('./index.js')['renderTelegramPost'];

async function sendTelegramPost(item: ContentItem): Promise<number> {
  const rendered = renderTelegramPost(item as never);
  const method = rendered.imageUrl ? 'sendPhoto' : 'sendMessage';
  const payload = rendered.imageUrl
    ? { chat_id: chatId, photo: rendered.imageUrl, caption: rendered.text, parse_mode: 'Markdown', reply_markup: rendered.buttons.length ? { inline_keyboard: [rendered.buttons] } : undefined }
    : { chat_id: chatId, text: rendered.text, parse_mode: 'Markdown', reply_markup: rendered.buttons.length ? { inline_keyboard: [rendered.buttons] } : undefined };

  const response = await fetch(`https://api.telegram.org/bot${botToken}/${method}`, {
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

async function main(): Promise<void> {
  ({ renderTelegramPost } = await import('./index.js'));
  const now = new Date().toISOString();
  const snapshot = await db.collection('content').where('status', '==', 'SCHEDULED').limit(100).get();
  let published = 0;

  for (const document of snapshot.docs) {
    const item = { id: document.id, ...document.data() } as ContentItem;
    if (!item.scheduledAt || item.scheduledAt > now) continue;

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

  console.log(`Scheduler finished. Published ${published} item(s).`);
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});