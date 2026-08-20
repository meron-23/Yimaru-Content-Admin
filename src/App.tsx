import { useState, useEffect, useCallback } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, type User } from 'firebase/auth';
import type { ContentItem } from './types/content';
import {
  getContentItems,
  createContentItem,
  updateContentItem,
  transitionContentStatus,
  deleteContentItem,
  duplicateContentItem
} from './services/contentService';

import { Sidebar } from './components/Sidebar';
import { DashboardView } from './components/DashboardView';
import { ContentLibraryView } from './components/ContentLibraryView';
import { UpcomingView } from './components/UpcomingView';
import { PublishedView } from './components/PublishedView';
import { ContentFormModal } from './components/ContentFormModal';
import { TelegramPreviewModal } from './components/TelegramPreviewModal';
import { ApprovalModal } from './components/ApprovalModal';
import { ScheduleModal } from './components/ScheduleModal';
import { ToastContainer } from './components/Toast';
import { LoginPage } from './components/LoginPage';
import type { ToastMessage } from './components/Toast';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { getFirebaseInstance } from './services/firebase';

// We define ActiveTab type for any legacy components that still import it from App.tsx
export type ActiveTab = 'dashboard' | 'content' | 'upcoming' | 'published';

function AppContent() {
  const { auth } = getFirebaseInstance();
  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [items, setItems] = useState<ContentItem[]>([]);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Modals state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ContentItem | null>(null);

  const [previewItem, setPreviewItem] = useState<ContentItem | null>(null);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);

  const [reviewItem, setReviewItem] = useState<ContentItem | null>(null);
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);

  const [scheduleTargetItem, setScheduleTargetItem] = useState<ContentItem | null>(null);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);

  const addToast = (type: 'success' | 'error' | 'info', message: string) => {
    const id = Date.now().toString(36) + Math.random().toString(36).substring(2, 5);
    setToasts(prev => [...prev, { id, type, message }]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const loadData = useCallback(async () => {
    try {
      const data = await getContentItems();
      setItems(data);
    } catch (err) {
      console.error('Failed to load content items:', err);
      addToast('error', 'Failed to load content from Firebase.');
    }
  }, []);

  useEffect(() => {
    return onAuthStateChanged(auth, currentUser => {
      setUser(currentUser);
      setIsAuthLoading(false);
    });
  }, [auth]);

  useEffect(() => {
    if (user) loadData();
  }, [user, loadData]);

  if (isAuthLoading) {
    return <div className="min-h-screen bg-slate-950" />;
  }

  if (!user) {
    return <LoginPage onSignIn={(email, password) => signInWithEmailAndPassword(auth, email, password).then(() => undefined)} />;
  }

  // Create / Edit Handlers
  const handleOpenCreate = () => {
    setEditingItem(null);
    setIsFormModalOpen(true);
  };

  const handleEditItem = (item: ContentItem) => {
    setEditingItem(item);
    setIsFormModalOpen(true);
  };

  const handleSaveDraft = async (data: Partial<ContentItem>) => {
    try {
      console.log('[handleSaveDraft] Saving draft with data:', data);
      if (editingItem) {
        await updateContentItem(editingItem.id, { ...data, status: 'DRAFT' });
        addToast('success', `Draft updated: "${data.title}"`);
      } else {
        await createContentItem({ ...(data as any), status: 'DRAFT' });
        addToast('success', `New draft saved: "${data.title}"`);
      }
      loadData();
    } catch(e: any) {
      console.error('[handleSaveDraft] FAILED:', e?.code, e?.message, e);
      addToast('error', `Failed to save draft: ${e?.message || 'Unknown error'}`);
    }
  };

  const handleSubmitForApproval = async (dataOrId: Partial<ContentItem> | string) => {
    try {
      console.log('[handleSubmitForApproval] Submitting:', dataOrId);
      if (typeof dataOrId === 'string') {
        await transitionContentStatus(dataOrId, 'PENDING_APPROVAL');
        addToast('info', 'Content submitted for editorial approval.');
      } else {
        if (editingItem) {
          await updateContentItem(editingItem.id, { ...dataOrId, status: 'PENDING_APPROVAL' });
          addToast('info', `Updated and submitted: "${dataOrId.title}"`);
        } else {
          await createContentItem({ ...(dataOrId as any), status: 'PENDING_APPROVAL' });
          addToast('info', `Submitted for approval: "${dataOrId.title}"`);
        }
      }
      loadData();
    } catch(e: any) {
      console.error('[handleSubmitForApproval] FAILED:', e?.code, e?.message, e);
      addToast('error', `Failed to submit: ${e?.message || 'Unknown error'}`);
    }
  };

  // Review & Approval Handlers
  const handleOpenReview = (item: ContentItem) => {
    setReviewItem(item);
    setIsApprovalModalOpen(true);
  };

  const handleApprove = async (id: string) => {
    try {
      await transitionContentStatus(id, 'APPROVED', { approvedBy: 'Admin Editor' });
      addToast('success', 'Content approved! Now ready for scheduling.');
      loadData();
    } catch(e: any) {
      console.error('[handleApprove] FAILED:', e?.code, e?.message, e);
      addToast('error', `Failed to approve content: ${e?.message || 'Unknown error'}`);
    }
  };

  const handleReject = async (id: string, reason: string) => {
    try {
      await transitionContentStatus(id, 'REJECTED', { rejectionReason: reason });
      addToast('error', 'Content rejected and returned to creator with feedback.');
      loadData();
    } catch(e) {
      addToast('error', 'Failed to reject content.');
    }
  };

  // Scheduling Handlers
  const handleOpenSchedule = (item: ContentItem) => {
    setScheduleTargetItem(item);
    setIsScheduleModalOpen(true);
  };

  const handleConfirmSchedule = async (id: string, scheduledAtIso: string) => {
    try {
      await transitionContentStatus(id, 'SCHEDULED', { scheduledAt: scheduledAtIso });
      addToast('success', `Post scheduled for ${new Date(scheduledAtIso).toLocaleString()}`);
      loadData();
    } catch(e) {
      addToast('error', 'Failed to schedule content.');
    }
  };

  const handleCancelSchedule = async (id: string) => {
    try {
      await transitionContentStatus(id, 'APPROVED');
      addToast('info', 'Schedule cancelled. Post returned to Approved status.');
      loadData();
    } catch(e) {
      addToast('error', 'Failed to cancel schedule.');
    }
  };

  // Publishing & Duplication
  const handlePublishNow = async (id: string) => {
    try {
      await transitionContentStatus(id, 'SCHEDULED', { scheduledAt: new Date().toISOString() });
      addToast('info', 'Post queued for Telegram publication within five minutes.');
      loadData();
    } catch(e: any) {
      console.error('[handlePublishNow] FAILED:', e?.code, e?.message, e);
      addToast('error', `Failed to publish content: ${e?.message || 'Unknown error'}`);
    }
  };

  const handleDuplicate = async (id: string) => {
    try {
      const copy = await duplicateContentItem(id);
      addToast('success', `Duplicated as new draft: "${copy.title}"`);
      loadData();
      setEditingItem(copy);
      setIsFormModalOpen(true);
    } catch(e) {
      addToast('error', 'Failed to duplicate content.');
    }
  };

  const handleArchive = async (id: string) => {
    try {
      await transitionContentStatus(id, 'ARCHIVED');
      addToast('info', 'Content item archived.');
      loadData();
    } catch(e) {
      addToast('error', 'Failed to archive content.');
    }
  };

  const handleRestore = async (id: string) => {
    try {
      await transitionContentStatus(id, 'DRAFT');
      addToast('info', 'Restored to Draft status.');
      loadData();
    } catch(e) {
      addToast('error', 'Failed to restore content.');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Permanently delete this content item?')) {
      try {
        await deleteContentItem(id);
        addToast('info', 'Item deleted.');
        loadData();
      } catch(e) {
        addToast('error', 'Failed to delete content.');
      }
    }
  };

  const handleOpenPreview = (item: ContentItem) => {
    setPreviewItem(item);
    setIsPreviewModalOpen(true);
  };

  const navigate = useNavigate();
  const onNavSelect = (tab: ActiveTab) => {
    const pathMap: Record<ActiveTab, string> = {
      dashboard: '/dashboard',
      content: '/content',
      upcoming: '/upcoming',
      published: '/published'
    };
    navigate(pathMap[tab]);
  };

  const pendingCount = items.filter(i => i.status === 'PENDING_APPROVAL').length;

  return (
    <div className="flex h-screen overflow-hidden bg-bg-primary text-text-main font-sans">
      <Sidebar 
        onOpenCreateModal={handleOpenCreate} 
        pendingCount={pendingCount} 
        onSignOut={() => signOut(auth)}
      />

      {/* Main Content Body */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto w-full">
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={
                <DashboardView
                  items={items}
                  onSelectTab={onNavSelect}
                  onPreviewItem={handleOpenPreview}
                  onReviewItem={handleOpenReview}
                />
              } />
              <Route path="/content" element={
                <ContentLibraryView
                  items={items}
                  onOpenCreate={handleOpenCreate}
                  onEditItem={handleEditItem}
                  onPreviewItem={handleOpenPreview}
                  onReviewItem={handleOpenReview}
                  onScheduleItem={handleOpenSchedule}
                  onSubmitForApproval={handleSubmitForApproval}
                  onPublishNow={handlePublishNow}
                  onDuplicate={handleDuplicate}
                  onDelete={handleDelete}
                  onRestore={handleRestore}
                  onArchive={handleArchive}
                />
              } />
              <Route path="/upcoming" element={
                <UpcomingView
                  items={items}
                  onPreviewItem={handleOpenPreview}
                  onScheduleItem={handleOpenSchedule}
                  onCancelSchedule={handleCancelSchedule}
                  onPublishNow={handlePublishNow}
                />
              } />
              <Route path="/published" element={
                <PublishedView
                  items={items}
                  onPreviewItem={handleOpenPreview}
                  onDuplicate={handleDuplicate}
                />
              } />
            </Routes>
          </div>
        </main>
      </div>

      {/* Modals & Drawers */}
      <ContentFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        onSaveDraft={handleSaveDraft}
        onSubmitForApproval={handleSubmitForApproval}
        initialData={editingItem}
      />

      <TelegramPreviewModal
        item={previewItem}
        isOpen={isPreviewModalOpen}
        onClose={() => setIsPreviewModalOpen(false)}
        onApprove={handleOpenReview}
        onSchedule={handleOpenSchedule}
      />

      <ApprovalModal
        item={reviewItem}
        isOpen={isApprovalModalOpen}
        onClose={() => setIsApprovalModalOpen(false)}
        onApprove={handleApprove}
        onReject={handleReject}
      />

      <ScheduleModal
        item={scheduleTargetItem}
        isOpen={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
        onConfirmSchedule={handleConfirmSchedule}
      />

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </div>
  );
}

export function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;
