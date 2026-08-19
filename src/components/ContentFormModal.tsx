import React, { useState, useEffect } from 'react';
import type { ContentItem, ContentType } from '../types/content';
import { CONTENT_TYPE_METADATA } from '../utils/telegramTemplates';
import { validateContent } from '../utils/workflow';
import type { ValidationError } from '../utils/workflow';
import { uploadImageFile } from '../services/contentService';
import { TelegramPreviewCard } from './TelegramPreviewCard';
import { 
  X, 
  BookOpen, 
  FileText, 
  MessageSquareQuote, 
  Image as ImageIcon, 
  Video, 
  Smartphone, 
  Upload, 
  Eye, 
  Save, 
  Send,
  AlertCircle,
  Link as LinkIcon
} from 'lucide-react';

interface ContentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveDraft: (itemData: Partial<ContentItem>) => Promise<void>;
  onSubmitForApproval: (itemData: Partial<ContentItem>) => Promise<void>;
  initialData?: ContentItem | null;
}

export const ContentFormModal: React.FC<ContentFormModalProps> = ({
  isOpen,
  onClose,
  onSaveDraft,
  onSubmitForApproval,
  initialData
}) => {
  const [contentType, setContentType] = useState<ContentType>('word_of_day');
  const [formData, setFormData] = useState<Partial<ContentItem>>({
    title: '',
    contentType: 'word_of_day',
    status: 'DRAFT',
    imageUrl: '',
    youtubeUrl: '',
    appUrl: '',
    callToAction: ''
  });

  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [showPreviewDrawer, setShowPreviewDrawer] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialData) {
      setContentType(initialData.contentType);
      setFormData(initialData);
    } else {
      setContentType('word_of_day');
      setFormData({
        title: '',
        contentType: 'word_of_day',
        status: 'DRAFT',
        imageUrl: '',
        youtubeUrl: '',
        appUrl: '',
        callToAction: ''
      });
    }
    setErrors([]);
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleTypeChange = (type: ContentType) => {
    setContentType(type);
    setFormData(prev => ({
      ...prev,
      contentType: type,
      title: prev.title || `${CONTENT_TYPE_METADATA[type].label}`
    }));
    setErrors([]);
  };

  const handleInputChange = (field: keyof ContentItem, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setErrors(prev => prev.filter(e => e.field !== field));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const url = await uploadImageFile(file);
      handleInputChange('imageUrl', url);
    } catch (err) {
      console.error('Failed to upload image:', err);
    } finally {
      setIsUploading(false);
    }
  };

  const validate = () => {
    const validationErrors = validateContent({ ...formData, contentType });
    setErrors(validationErrors);
    return validationErrors.length === 0;
  };

  const handleSave = async (submitForApproval: boolean) => {
    if (submitForApproval) {
      if (!validate()) return;
    } else {
      if (!formData.title || !formData.title.trim()) {
        setErrors([{ field: 'title', message: 'Title is required to save a draft.' }]);
        return;
      }
      setErrors([]); // clear any other validation errors when saving draft
    }

    try {
      setIsSubmitting(true);
      const dataToSave: Partial<ContentItem> = {
        ...formData,
        contentType
      };

      if (submitForApproval) {
        await onSubmitForApproval(dataToSave);
      } else {
        await onSaveDraft(dataToSave);
      }
      onClose();
    } catch (err) {
      console.error('Error saving content:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getFieldError = (field: string) => {
    return errors.find(e => e.field === field)?.message;
  };

  const iconsMap: Record<ContentType, React.ReactNode> = {
    word_of_day: <BookOpen className="w-5 h-5 text-blue-500" />,
    definition: <FileText className="w-5 h-5 text-purple-500" />,
    phrase: <MessageSquareQuote className="w-5 h-5 text-pink-500" />,
    informative_photo: <ImageIcon className="w-5 h-5 text-emerald-500" />,
    youtube_resource: <Video className="w-5 h-5 text-red-500" />,
    app_resource: <Smartphone className="w-5 h-5 text-amber-500" />
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-in fade-in">
      
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-6xl max-h-[92vh] flex flex-col overflow-hidden">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              {initialData ? 'Edit Educational Content' : 'Create New Educational Content'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Fill in content details. Preview updates in real-time.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowPreviewDrawer(!showPreviewDrawer)}
              className="lg:hidden flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[var(--brand-primary)]/10 text-[var(--brand-primary)] border border-[var(--brand-primary)]/30"
            >
              <Eye className="w-4 h-4" />
              <span>{showPreviewDrawer ? 'Hide Preview' : 'Show Preview'}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Content Split View */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-200 dark:divide-slate-800">
          
          {/* Left Column: Form Controls */}
          <div className="lg:col-span-7 p-6 space-y-6 overflow-y-auto">
            
            {/* 1. Content Type Selector Grid */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
                1. Select Content Type
              </label>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {(Object.keys(CONTENT_TYPE_METADATA) as ContentType[]).map(type => {
                  const meta = CONTENT_TYPE_METADATA[type];
                  const isSelected = contentType === type;
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => handleTypeChange(type)}
                      className={`p-3 rounded-xl border-2 transition-all text-left flex flex-col gap-2 ${
                        isSelected 
                        ? 'border-[var(--brand-primary)] bg-[var(--brand-primary)]/10 ring-2 ring-[var(--brand-primary)]/20' 
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        {iconsMap[type]}
                        {isSelected && <span className="w-2 h-2 rounded-full bg-[var(--brand-primary)]" />}
                      </div>
                      <div>
                        <div className="font-semibold text-xs text-slate-900 dark:text-white leading-tight">
                          {meta.label}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Title Input */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                Title <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={formData.title || ''}
                onChange={e => handleInputChange('title', e.target.value)}
                placeholder="e.g. Word of the Day: Resilient"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]"
              />
              {getFieldError('title') && (
                <p className="mt-1 text-xs text-rose-500 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" /> {getFieldError('title')}
                </p>
              )}
            </div>

            {/* 3. Type-Specific Fields */}
            <div className="space-y-4 pt-2 border-t border-slate-100 dark:border-slate-800">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                2. Educational Details ({CONTENT_TYPE_METADATA[contentType].label})
              </label>

              {/* WORD OF THE DAY FIELDS */}
              {contentType === 'word_of_day' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Word <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.word || ''}
                        onChange={e => handleInputChange('word', e.target.value)}
                        placeholder="e.g. Resilient"
                        className="w-full px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-800 text-sm"
                      />
                      {getFieldError('word') && <p className="text-xs text-rose-500 mt-1">{getFieldError('word')}</p>}
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Pronunciation (IPA)
                      </label>
                      <input
                        type="text"
                        value={formData.pronunciation || ''}
                        onChange={e => handleInputChange('pronunciation', e.target.value)}
                        placeholder="e.g. rɪˈzɪl.jənt"
                        className="w-full px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-800 text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Definition <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      rows={2}
                      value={formData.definition || ''}
                      onChange={e => handleInputChange('definition', e.target.value)}
                      placeholder="Able to recover quickly from difficulties or challenges."
                      className="w-full px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-800 text-sm"
                    />
                    {getFieldError('definition') && <p className="text-xs text-rose-500 mt-1">{getFieldError('definition')}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Example Sentence
                    </label>
                    <textarea
                      rows={2}
                      value={formData.exampleSentence || ''}
                      onChange={e => handleInputChange('exampleSentence', e.target.value)}
                      placeholder="She remained resilient despite facing unexpected obstacles."
                      className="w-full px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-800 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Related Words / Synonyms
                    </label>
                    <input
                      type="text"
                      value={formData.relatedWords || ''}
                      onChange={e => handleInputChange('relatedWords', e.target.value)}
                      placeholder="tough, adaptable, robust, flexible"
                      className="w-full px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-800 text-sm"
                    />
                  </div>
                </div>
              )}

              {/* DEFINITION FIELDS */}
              {contentType === 'definition' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Term / Concept <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.term || ''}
                      onChange={e => handleInputChange('term', e.target.value)}
                      placeholder="e.g. Oxford Comma"
                      className="w-full px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-800 text-sm"
                    />
                    {getFieldError('term') && <p className="text-xs text-rose-500 mt-1">{getFieldError('term')}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Definition <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      rows={2}
                      value={formData.definition || ''}
                      onChange={e => handleInputChange('definition', e.target.value)}
                      placeholder="The final comma in a list of three or more items..."
                      className="w-full px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-800 text-sm"
                    />
                    {getFieldError('definition') && <p className="text-xs text-rose-500 mt-1">{getFieldError('definition')}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Simple Explanation
                    </label>
                    <textarea
                      rows={2}
                      value={formData.simpleExplanation || ''}
                      onChange={e => handleInputChange('simpleExplanation', e.target.value)}
                      placeholder="It clarifies ambiguity in lists!"
                      className="w-full px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-800 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Example
                    </label>
                    <textarea
                      rows={2}
                      value={formData.example || ''}
                      onChange={e => handleInputChange('example', e.target.value)}
                      placeholder="We bought apples, oranges, and bananas."
                      className="w-full px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-800 text-sm"
                    />
                  </div>
                </div>
              )}

              {/* PHRASE OF THE DAY FIELDS */}
              {contentType === 'phrase' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Phrase <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.phrase || ''}
                      onChange={e => handleInputChange('phrase', e.target.value)}
                      placeholder="e.g. Break the ice"
                      className="w-full px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-800 text-sm"
                    />
                    {getFieldError('phrase') && <p className="text-xs text-rose-500 mt-1">{getFieldError('phrase')}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Meaning <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      rows={2}
                      value={formData.meaning || ''}
                      onChange={e => handleInputChange('meaning', e.target.value)}
                      placeholder="To do or say something that relieves tension..."
                      className="w-full px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-800 text-sm"
                    />
                    {getFieldError('meaning') && <p className="text-xs text-rose-500 mt-1">{getFieldError('meaning')}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      When to Use It
                    </label>
                    <input
                      type="text"
                      value={formData.whenToUse || ''}
                      onChange={e => handleInputChange('whenToUse', e.target.value)}
                      placeholder="In social gatherings or initial meetings."
                      className="w-full px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-800 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Example Sentence
                    </label>
                    <textarea
                      rows={2}
                      value={formData.exampleSentence || ''}
                      onChange={e => handleInputChange('exampleSentence', e.target.value)}
                      placeholder="He told a joke to break the ice."
                      className="w-full px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-800 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Example Conversation
                    </label>
                    <textarea
                      rows={2}
                      value={formData.exampleConversation || ''}
                      onChange={e => handleInputChange('exampleConversation', e.target.value)}
                      placeholder={'A: "Hi everyone!"\nB: "Great to meet you!"'}
                      className="w-full px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-800 text-sm"
                    />
                  </div>
                </div>
              )}

              {/* INFORMATIVE PHOTO FIELDS */}
              {contentType === 'informative_photo' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Caption / Description
                    </label>
                    <textarea
                      rows={3}
                      value={formData.caption || ''}
                      onChange={e => handleInputChange('caption', e.target.value)}
                      placeholder="Master prepositions of time with this cheat sheet..."
                      className="w-full px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-800 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Optional Additional Information
                    </label>
                    <textarea
                      rows={2}
                      value={formData.additionalInfo || ''}
                      onChange={e => handleInputChange('additionalInfo', e.target.value)}
                      placeholder="Key takeaway or tip..."
                      className="w-full px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-800 text-sm"
                    />
                  </div>
                </div>
              )}

              {/* YOUTUBE RESOURCE FIELDS */}
              {contentType === 'youtube_resource' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      YouTube Video URL <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="url"
                      value={formData.youtubeUrl || ''}
                      onChange={e => handleInputChange('youtubeUrl', e.target.value)}
                      placeholder="https://www.youtube.com/watch?v=..."
                      className="w-full px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-800 text-sm"
                    />
                    {getFieldError('youtubeUrl') && <p className="text-xs text-rose-500 mt-1">{getFieldError('youtubeUrl')}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Description
                    </label>
                    <textarea
                      rows={3}
                      value={formData.description || ''}
                      onChange={e => handleInputChange('description', e.target.value)}
                      placeholder="In this 10-minute video, Teacher Alex breaks down pronunciation..."
                      className="w-full px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-800 text-sm"
                    />
                  </div>
                </div>
              )}

              {/* APP RESOURCE FIELDS */}
              {contentType === 'app_resource' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Application URL <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="url"
                      value={formData.appUrl || ''}
                      onChange={e => handleInputChange('appUrl', e.target.value)}
                      placeholder="https://app.englishlearning.com/quiz/104"
                      className="w-full px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-800 text-sm"
                    />
                    {getFieldError('appUrl') && <p className="text-xs text-rose-500 mt-1">{getFieldError('appUrl')}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Description
                    </label>
                    <textarea
                      rows={3}
                      value={formData.description || ''}
                      onChange={e => handleInputChange('description', e.target.value)}
                      placeholder="Practice vocabulary directly in our English Learning App!"
                      className="w-full px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-800 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Call to Action Button Label
                    </label>
                    <input
                      type="text"
                      value={formData.callToAction || ''}
                      onChange={e => handleInputChange('callToAction', e.target.value)}
                      placeholder="📱 Take Quiz in App"
                      className="w-full px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-800 text-sm"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* 4. Shared Links & Media */}
            <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                3. Optional Links & Image Attachment
              </label>

              {/* Image Upload / URL Input */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Image Attachment {contentType === 'informative_photo' && <span className="text-rose-500">*</span>}
                </label>
                
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <input
                    type="url"
                    value={formData.imageUrl || ''}
                    onChange={e => handleInputChange('imageUrl', e.target.value)}
                    placeholder="Paste image URL (https://...)"
                    className="flex-1 px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-800 text-sm"
                  />
                  
                  <label className="cursor-pointer px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold border border-slate-200 dark:border-slate-700 flex items-center justify-center gap-2 transition">
                    <Upload className="w-4 h-4" />
                    <span>{isUploading ? 'Uploading...' : 'Upload File'}</span>
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                  </label>
                </div>
                {getFieldError('imageUrl') && <p className="text-xs text-rose-500 mt-1">{getFieldError('imageUrl')}</p>}

                {/* Thumbnail Preview */}
                {formData.imageUrl && (
                  <div className="mt-2.5 relative w-32 h-20 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100">
                    <img src={formData.imageUrl} alt="Uploaded preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => handleInputChange('imageUrl', '')}
                      className="absolute top-1 right-1 p-0.5 rounded-full bg-slate-900/70 text-white hover:bg-rose-600 transition"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {/* Shared YouTube & App URLs if not primary */}
              {contentType !== 'youtube_resource' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                    <LinkIcon className="w-3.5 h-3.5 text-red-500" />
                    <span>YouTube Resource URL (Optional)</span>
                  </label>
                  <input
                    type="url"
                    value={formData.youtubeUrl || ''}
                    onChange={e => handleInputChange('youtubeUrl', e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=..."
                    className="w-full px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-800 text-sm"
                  />
                </div>
              )}

              {contentType !== 'app_resource' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                    <LinkIcon className="w-3.5 h-3.5 text-[var(--brand-primary)]" />
                    <span>Application Link URL (Optional)</span>
                  </label>
                  <input
                    type="url"
                    value={formData.appUrl || ''}
                    onChange={e => handleInputChange('appUrl', e.target.value)}
                    placeholder="https://app.englishlearning.com/..."
                    className="w-full px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-800 text-sm"
                  />
                </div>
              )}

            </div>

          </div>

          {/* Right Column: Real-time Live Yimaru Preview */}
          <div className={`lg:col-span-5 p-6 bg-slate-50/50 dark:bg-slate-900/50 flex flex-col ${
            showPreviewDrawer ? 'block' : 'hidden lg:flex'
          }`}>
            <div className="sticky top-0 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Live Yimaru Preview
                </span>
                <span className="text-xs px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-semibold">
                  Auto Updating
                </span>
              </div>

              <TelegramPreviewCard item={{ ...formData, contentType }} />
            </div>
          </div>

        </div>

        {/* Modal Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 text-sm font-semibold transition"
            >
              Cancel
            </button>
            {errors.length > 0 && (
              <span className="text-sm font-semibold text-rose-500 flex items-center gap-1.5 animate-pulse">
                <AlertCircle className="w-4 h-4" /> Please fill in all required fields
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleSave(false)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-100 text-sm font-semibold transition disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>Save Draft</span>
            </button>

            <button
              type="button"
              disabled={isSubmitting || !formData.title}
              onClick={() => handleSave(true)}
              className="flex items-center gap-2 px-5 py-2 rounded-xl text-white text-sm font-semibold shadow-md hover:opacity-90 active:scale-95 transition disabled:opacity-50"
              style={{ backgroundColor: '#9A288D' }}
            >
              <Send className="w-4 h-4" />
              <span>Submit for Approval</span>
            </button>
          </div>
        </div>

      </div>

    </div>
  );
};
