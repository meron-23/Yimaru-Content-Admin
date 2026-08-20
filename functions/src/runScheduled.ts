import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import sharp from 'sharp';
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

async function downloadTelegramImage(imageUrl: string): Promise<{ blob: Blob; filename: string }> {
  const response = await fetch(getImageDownloadUrl(imageUrl));
  if (!response.ok) {
    throw new Error(`Image download failed with status ${response.status}`);
  }

  const contentType = response.headers.get('content-type') || '';
  const bytes = new Uint8Array(await response.arrayBuffer());
  const isJpeg = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  const isPng = bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47;
  const isGif = bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46;
  const isWebp = bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 && bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50;
  const isAvif = bytes[4] === 0x66 && bytes[5] === 0x74 && bytes[6] === 0x79 && bytes[7] === 0x70 && bytes.slice(8, 12).some((byte, index) => byte === [0x61, 0x76, 0x69, 0x66][index]);

  if (!isJpeg && !isPng && !isGif && !isWebp && !isAvif) {
    throw new Error(`Image URL returned ${contentType || 'unknown content'} and did not contain a supported image. Make the Drive file public and use JPG or PNG.`);
  }

  const extension = isJpeg ? 'jpg' : isPng ? 'png' : isGif ? 'gif' : isWebp ? 'webp' : 'avif';
  if (isAvif) {
    const jpegBytes = await sharp(bytes).jpeg({ quality: 90 }).toBuffer();
    return {
      blob: new Blob([new Uint8Array(jpegBytes)], { type: 'image/jpeg' }),
      filename: 'content-image.jpg'
    };
  }

  return {
    blob: new Blob([bytes], { type: contentType.startsWith('image/') ? contentType : `image/${extension}` }),
    filename: `content-image.${extension}`
  };
}

async function sendTelegramPost(item: ContentItem): Promise<number> {
  const rendered = renderTelegramPost(item);
  const method = rendered.imageUrl ? 'sendPhoto' : 'sendMessage';
  let telegramMethod: 'sendPhoto' | 'sendDocument' | 'sendMessage' = method;
  let body: BodyInit;
  let headers: HeadersInit | undefined;

  if (rendered.imageUrl) {
    const image = await downloadTelegramImage(rendered.imageUrl);
    const form = new FormData();
    form.append('chat_id', chatId);
    form.append('photo', image.blob, image.filename);
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

  const response = await fetch(`https://api.telegram.org/bot${botToken}/${telegramMethod}`, {
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