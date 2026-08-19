import type { ContentItem, ContentType } from '../types/content';

export interface TelegramButton {
  text: string;
  url: string;
}

export interface RenderedTelegramPost {
  text: string;
  imageUrl?: string;
  buttons: TelegramButton[];
}

export function renderTelegramPost(item: Partial<ContentItem>): RenderedTelegramPost {
  const type = item.contentType || 'word_of_day';
  let body = '';
  const buttons: TelegramButton[] = [];

  switch (type) {
    case 'word_of_day': {
      const word = item.word || item.title || 'Resilient';
      const pron = item.pronunciation ? ` /${item.pronunciation}/` : '';
      const def = item.definition || item.description || 'Able to withstand or recover quickly from difficult conditions.';
      const sentence = item.exampleSentence || item.example || 'She remained resilient despite the unexpected difficulties.';
      const related = item.relatedWords || '';

      body = `📚 WORD OF THE DAY\n\n`;
      body += `🔤 *${word}*${pron}\n\n`;
      body += `💡 *Meaning*\n${def}\n\n`;
      body += `🗣️ *Example Sentence*\n"${sentence}"`;

      if (related.trim()) {
        body += `\n\n🔗 *Related Words*\n${related}`;
      }
      break;
    }

    case 'definition': {
      const term = item.term || item.title || 'Idiom';
      const def = item.definition || 'A group of words established by usage as having a meaning not deducible from those of the individual words.';
      const simple = item.simpleExplanation || '';
      const example = item.example || item.exampleSentence || '';

      body = `📖 ENGLISH DEFINITION\n\n`;
      body += `📌 *${term}*\n\n`;
      body += `💡 *Definition*\n${def}`;

      if (simple.trim()) {
        body += `\n\n💬 *Simple Explanation*\n${simple}`;
      }
      if (example.trim()) {
        body += `\n\n🗣️ *Example*\n"${example}"`;
      }
      break;
    }

    case 'phrase': {
      const phrase = item.phrase || item.title || 'Break the ice';
      const meaning = item.meaning || item.definition || 'To make people feel more comfortable in a social situation.';
      const whenToUse = item.whenToUse || '';
      const exampleSentence = item.exampleSentence || '';
      const conversation = item.exampleConversation || '';

      body = `💬 PHRASE OF THE DAY\n\n`;
      body += `✨ *"${phrase}"*\n\n`;
      body += `💡 *Meaning*\n${meaning}`;

      if (whenToUse.trim()) {
        body += `\n\n🎯 *When to Use*\n${whenToUse}`;
      }
      if (exampleSentence.trim()) {
        body += `\n\n🗣️ *Example Sentence*\n"${exampleSentence}"`;
      }
      if (conversation.trim()) {
        body += `\n\n💬 *Example Conversation*\n${conversation}`;
      }
      break;
    }

    case 'informative_photo': {
      const title = item.title || 'English Prepositions Cheat Sheet';
      const caption = item.caption || item.description || 'Master prepositions of time and place with this visual guide!';
      const additional = item.additionalInfo || '';

      body = `🖼️ *${title}*\n\n`;
      body += `${caption}`;

      if (additional.trim()) {
        body += `\n\n💡 *Key Takeaway*\n${additional}`;
      }
      break;
    }

    case 'youtube_resource': {
      const title = item.title || '10 Common English Mistakes & How to Avoid Them';
      const desc = item.description || 'Watch our latest video lesson to improve your pronunciation and fluency!';

      body = `🎬 YOUTUBE LESSON\n\n`;
      body += `▶️ *${title}*\n\n`;
      body += `${desc}`;

      if (item.youtubeUrl) {
        body += `\n\n📺 *Watch full video below:*`;
      }
      break;
    }

    case 'app_resource': {
      const title = item.title || 'Daily Vocabulary Quiz #42';
      const desc = item.description || 'Test your knowledge and practice new words directly in our English Learning App!';

      body = `🚀 APP EXERCISE\n\n`;
      body += `📲 *${title}*\n\n`;
      body += `${desc}`;

      if (item.callToAction) {
        body += `\n\n⚡ *${item.callToAction}*`;
      }
      break;
    }

    default: {
      body = `📢 *${item.title || 'Educational Content'}*\n\n${item.message || item.description || ''}`;
    }
  }

  // Add Action Buttons
  if (item.appUrl && item.appUrl.trim()) {
    buttons.push({
      text: item.callToAction || '📱 Practice in App',
      url: item.appUrl
    });
  }

  if (item.youtubeUrl && item.youtubeUrl.trim()) {
    buttons.push({
      text: '▶️ Watch on YouTube',
      url: item.youtubeUrl
    });
  }

  return {
    text: body.trim(),
    imageUrl: item.imageUrl || undefined,
    buttons
  };
}

export const CONTENT_TYPE_METADATA: Record<ContentType, { label: string; icon: string; description: string; color: string; bg: string }> = {
  word_of_day: {
    label: 'Word of the Day',
    icon: 'BookOpen',
    description: 'Highlight a vocabulary word with pronunciation, definition, and example sentence.',
    color: '#3b82f6',
    bg: '#eff6ff'
  },
  definition: {
    label: 'Definition',
    icon: 'FileText',
    description: 'Explain grammar rules, linguistic terms, or conceptual definitions simply.',
    color: '#8b5cf6',
    bg: '#f5f3ff'
  },
  phrase: {
    label: 'Phrase of the Day',
    icon: 'MessageSquareQuote',
    description: 'Teach common idioms, expressions, conversational phrases, and usage scenarios.',
    color: '#ec4899',
    bg: '#fdf2f8'
  },
  informative_photo: {
    label: 'Informative Photo / Infographic',
    icon: 'Image',
    description: 'Share visual infographics, diagrams, or visual vocabulary cheat sheets.',
    color: '#10b981',
    bg: '#ecfdf5'
  },
  youtube_resource: {
    label: 'YouTube Resource',
    icon: 'Video',
    description: 'Share YouTube video lessons, tutorials, or listening exercises.',
    color: '#ef4444',
    bg: '#fef2f2'
  },
  app_resource: {
    label: 'Application Resource',
    icon: 'Smartphone',
    description: 'Link directly to app exercises, quizzes, interactive lessons, or features.',
    color: '#f59e0b',
    bg: '#fffbeb'
  }
};
