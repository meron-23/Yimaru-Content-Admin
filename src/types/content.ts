export type ContentType = 
  | 'word_of_day'
  | 'definition'
  | 'phrase'
  | 'informative_photo'
  | 'youtube_resource'
  | 'app_resource';

export type ContentStatus = 
  | 'DRAFT'
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'SCHEDULED'
  | 'PUBLISHED'
  | 'REJECTED'
  | 'ARCHIVED';

export interface ContentItem {
  id: string;
  contentType: ContentType;
  title: string;
  
  // Dynamic fields by content type
  // 1. Word of the Day
  word?: string;
  pronunciation?: string;
  definition?: string;
  exampleSentence?: string;
  relatedWords?: string;

  // 2. Definition
  term?: string;
  simpleExplanation?: string;
  example?: string;

  // 3. Phrase of the Day
  phrase?: string;
  meaning?: string;
  whenToUse?: string;
  exampleConversation?: string;

  // 4. Informative Photo
  caption?: string;
  additionalInfo?: string;

  // 5 & 6. YouTube / App Resource
  description?: string;
  callToAction?: string;

  // Shared Media & External URLs
  imageUrl?: string;
  youtubeUrl?: string;
  appUrl?: string;
  
  // Custom message body fallback / manual edit
  message?: string;

  // Status & Timestamps
  status: ContentStatus;
  createdAt: string; // ISO String
  updatedAt: string; // ISO String
  scheduledAt?: string | null; // ISO String
  publishedAt?: string | null; // ISO String
  rejectionReason?: string;
  approvedBy?: string;
  telegramMessageId?: number;
  telegramPublishedAt?: string | null;
  telegramPublishError?: string | null;
}

export interface ContentTypeInfo {
  type: ContentType;
  label: string;
  icon: string;
  description: string;
  badgeBg: string;
  badgeText: string;
}

export interface FilterState {
  searchQuery: string;
  contentType: ContentType | 'ALL';
  status: ContentStatus | 'ALL';
  dateRange: 'ALL' | 'TODAY' | 'THIS_WEEK' | 'THIS_MONTH';
  sortBy: 'createdAt' | 'updatedAt' | 'scheduledAt' | 'title';
  sortOrder: 'asc' | 'desc';
}

export interface SystemSettings {
  useLiveFirebase: boolean;
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  channelName: string;
  channelSubscriberCount: string;
}
