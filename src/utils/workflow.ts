import type { ContentItem, ContentStatus } from '../types/content';

export interface StatusMeta {
  label: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  dotColor: string;
  description: string;
}

export const STATUS_METADATA: Record<ContentStatus, StatusMeta> = {
  DRAFT: {
    label: 'Draft',
    badgeBg: 'bg-slate-100 dark:bg-slate-800/60',
    badgeText: 'text-slate-700 dark:text-slate-300',
    badgeBorder: 'border-slate-200 dark:border-slate-700',
    dotColor: 'bg-slate-400',
    description: 'Work in progress. Visible only to author and editors.'
  },
  PENDING_APPROVAL: {
    label: 'Waiting for Approval',
    badgeBg: 'bg-amber-50 dark:bg-amber-950/40',
    badgeText: 'text-amber-700 dark:text-amber-400',
    badgeBorder: 'border-amber-200 dark:border-amber-800/50',
    dotColor: 'bg-amber-500',
    description: 'Submitted for review by content lead or admin.'
  },
  APPROVED: {
    label: 'Approved',
    badgeBg: 'bg-blue-50 dark:bg-blue-950/40',
    badgeText: 'text-blue-700 dark:text-blue-400',
    badgeBorder: 'border-blue-200 dark:border-blue-800/50',
    dotColor: 'bg-blue-500',
    description: 'Approved by admin. Ready for scheduling.'
  },
  SCHEDULED: {
    label: 'Scheduled',
    badgeBg: 'bg-purple-50 dark:bg-purple-950/40',
    badgeText: 'text-purple-700 dark:text-purple-400',
    badgeBorder: 'border-purple-200 dark:border-purple-800/50',
    dotColor: 'bg-purple-500',
    description: 'Set to be published at a future date & time.'
  },
  PUBLISHED: {
    label: 'Published',
    badgeBg: 'bg-emerald-50 dark:bg-emerald-950/40',
    badgeText: 'text-emerald-700 dark:text-emerald-400',
    badgeBorder: 'border-emerald-200 dark:border-emerald-800/50',
    dotColor: 'bg-emerald-500',
    description: 'Published to the Telegram channel audience.'
  },
  REJECTED: {
    label: 'Needs Changes',
    badgeBg: 'bg-rose-50 dark:bg-rose-950/40',
    badgeText: 'text-rose-700 dark:text-rose-400',
    badgeBorder: 'border-rose-200 dark:border-rose-800/50',
    dotColor: 'bg-rose-500',
    description: 'Returned for revisions with reviewer comments.'
  },
  ARCHIVED: {
    label: 'Archived',
    badgeBg: 'bg-gray-100 dark:bg-gray-800/40',
    badgeText: 'text-gray-500 dark:text-gray-400',
    badgeBorder: 'border-gray-200 dark:border-gray-700',
    dotColor: 'bg-gray-400',
    description: 'Archived and hidden from active content lists.'
  }
};

export function getAllowedTransitions(currentStatus: ContentStatus): ContentStatus[] {
  switch (currentStatus) {
    case 'DRAFT':
      return ['PENDING_APPROVAL', 'ARCHIVED'];
    case 'PENDING_APPROVAL':
      return ['APPROVED', 'REJECTED', 'DRAFT'];
    case 'REJECTED':
      return ['PENDING_APPROVAL', 'DRAFT', 'ARCHIVED'];
    case 'APPROVED':
      return ['SCHEDULED', 'DRAFT', 'ARCHIVED'];
    case 'SCHEDULED':
      return ['APPROVED', 'PUBLISHED', 'DRAFT'];
    case 'PUBLISHED':
      return ['ARCHIVED'];
    case 'ARCHIVED':
      return ['DRAFT'];
    default:
      return [];
  }
}

export interface ValidationError {
  field: string;
  message: string;
}

export function validateContent(item: Partial<ContentItem>): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!item.title || !item.title.trim()) {
    errors.push({ field: 'title', message: 'Title is required.' });
  }

  if (!item.contentType) {
    errors.push({ field: 'contentType', message: 'Content type must be selected.' });
  }

  const type = item.contentType;

  if (type === 'word_of_day') {
    if (!item.word || !item.word.trim()) {
      errors.push({ field: 'word', message: 'Word is required for Word of the Day.' });
    }
    if (!item.definition || !item.definition.trim()) {
      errors.push({ field: 'definition', message: 'Definition is required for Word of the Day.' });
    }
  } else if (type === 'definition') {
    if (!item.term || !item.term.trim()) {
      errors.push({ field: 'term', message: 'Term is required for Definition.' });
    }
    if (!item.definition || !item.definition.trim()) {
      errors.push({ field: 'definition', message: 'Definition is required.' });
    }
  } else if (type === 'phrase') {
    if (!item.phrase || !item.phrase.trim()) {
      errors.push({ field: 'phrase', message: 'Phrase is required.' });
    }
    if (!item.meaning || !item.meaning.trim()) {
      errors.push({ field: 'meaning', message: 'Meaning is required for Phrase of the Day.' });
    }
  } else if (type === 'informative_photo') {
    if (!item.imageUrl || !item.imageUrl.trim()) {
      errors.push({ field: 'imageUrl', message: 'An image URL or uploaded photo is required for Informative Photo.' });
    }
  } else if (type === 'youtube_resource') {
    if (!item.youtubeUrl || !item.youtubeUrl.trim()) {
      errors.push({ field: 'youtubeUrl', message: 'YouTube URL is required.' });
    } else if (!isValidUrl(item.youtubeUrl)) {
      errors.push({ field: 'youtubeUrl', message: 'Please enter a valid URL (e.g. https://youtube.com/...).' });
    }
  } else if (type === 'app_resource') {
    if (!item.appUrl || !item.appUrl.trim()) {
      errors.push({ field: 'appUrl', message: 'Application URL is required.' });
    } else if (!isValidUrl(item.appUrl)) {
      errors.push({ field: 'appUrl', message: 'Please enter a valid URL (e.g. https://app.example.com/...).' });
    }
  } else if (type === 'quiz') {
    if (!item.quizQuestion || !item.quizQuestion.trim()) {
      errors.push({ field: 'quizQuestion', message: 'The quiz question is required.' });
    }
    if (!item.quizOptions || item.quizOptions.filter(o => o.trim()).length < 2) {
      errors.push({ field: 'quizOptions', message: 'At least 2 answer options are required.' });
    }
    if (!item.quizCorrectAnswer || !item.quizCorrectAnswer.trim()) {
      errors.push({ field: 'quizCorrectAnswer', message: 'The correct answer is required.' });
    }
  }

  if (item.youtubeUrl && item.youtubeUrl.trim() && !isValidUrl(item.youtubeUrl)) {
    errors.push({ field: 'youtubeUrl', message: 'Invalid YouTube URL format.' });
  }
  if (item.appUrl && item.appUrl.trim() && !isValidUrl(item.appUrl)) {
    errors.push({ field: 'appUrl', message: 'Invalid Application URL format.' });
  }

  if (item.status === 'SCHEDULED') {
    if (!item.scheduledAt) {
      errors.push({ field: 'scheduledAt', message: 'Scheduled date and time is required.' });
    }
  }

  return errors;
}

function isValidUrl(urlString: string): boolean {
  try {
    const url = new URL(urlString);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}
