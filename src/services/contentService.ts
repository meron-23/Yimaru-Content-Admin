import type { ContentItem, ContentStatus } from '../types/content';
import { getFirebaseInstance } from './firebase';
import { 
  collection, 
  getDocs, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export async function getContentItems(): Promise<ContentItem[]> {
  const { db } = getFirebaseInstance();
  const q = query(collection(db, 'content'), orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  const items: ContentItem[] = [];
  snapshot.forEach(docSnap => {
    items.push({ id: docSnap.id, ...docSnap.data() } as ContentItem);
  });
  return items;
}

export async function createContentItem(data: Omit<ContentItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<ContentItem> {
  const { db } = getFirebaseInstance();
  const nowIso = new Date().toISOString();
  
  // Use a custom document ID or let Firestore generate one. We'll generate a unique ID here to return it easily.
  const id = 'cnt_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
  
  const newItem: ContentItem = {
    ...data,
    id,
    createdAt: nowIso,
    updatedAt: nowIso,
  };

  await setDoc(doc(db, 'content', newItem.id), newItem);
  return newItem;
}

export async function updateContentItem(id: string, updates: Partial<ContentItem>): Promise<ContentItem> {
  const { db } = getFirebaseInstance();
  const nowIso = new Date().toISOString();
  
  const fullUpdates = {
    ...updates,
    updatedAt: nowIso
  };

  const docRef = doc(db, 'content', id);
  await updateDoc(docRef, fullUpdates);
  
  const updatedSnap = await getDoc(docRef);
  return { id: updatedSnap.id, ...updatedSnap.data() } as ContentItem;
}

export async function transitionContentStatus(
  id: string, 
  newStatus: ContentStatus, 
  extra: { rejectionReason?: string; scheduledAt?: string; approvedBy?: string } = {}
): Promise<ContentItem> {
  const updates: Record<string, unknown> = {
    status: newStatus,
  };

  if (newStatus === 'REJECTED' && extra.rejectionReason) {
    updates.rejectionReason = extra.rejectionReason;
  }
  if (newStatus === 'APPROVED') {
    updates.approvedBy = extra.approvedBy || 'Admin Reviewer';
  }
  if (newStatus === 'SCHEDULED' && extra.scheduledAt) {
    updates.scheduledAt = extra.scheduledAt;
  }
  if (newStatus === 'PUBLISHED') {
    updates.publishedAt = new Date().toISOString();
  }

  return updateContentItem(id, updates as Partial<ContentItem>);
}

export async function deleteContentItem(id: string): Promise<void> {
  const { db } = getFirebaseInstance();
  await deleteDoc(doc(db, 'content', id));
}

export async function duplicateContentItem(id: string): Promise<ContentItem> {
  const { db } = getFirebaseInstance();
  const docRef = doc(db, 'content', id);
  const snap = await getDoc(docRef);
  
  if (!snap.exists()) {
    throw new Error('Source content item not found');
  }
  
  const source = snap.data() as ContentItem;

  const { scheduledAt, publishedAt, rejectionReason, ...rest } = source;
  return createContentItem({
    ...rest,
    title: `${source.title} (Copy)`,
    status: 'DRAFT',
  });
}

// Keeping this around just to appease the App.tsx import signature for now until we remove it.
export function resetToSeedData(): ContentItem[] {
  console.warn("Reset to seed data is disabled since moving to Live Firebase.");
  return [];
}

export async function uploadImageFile(file: File): Promise<string> {
  const { storage } = getFirebaseInstance();
  const storageRef = ref(storage, `images/${Date.now()}_${file.name}`);
  const snapshot = await uploadBytes(storageRef, file);
  return await getDownloadURL(snapshot.ref);
}
