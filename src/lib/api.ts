import {
  type User,
  createUserWithEmailAndPassword,
  signInWithCredential,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  GoogleAuthProvider,
  onAuthStateChanged,
} from 'firebase/auth';
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { deleteObject, getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { defaultSiteData } from '../content/defaultSiteData';
import {
  buildSitePageLayoutsFromTemplates,
  isTemplateCompatibleWithPage,
  normalizeTemplateLayouts,
  templateCatalogMap,
} from '../content/publicPageLayouts';
import type { AdminAuthResponse, AdminProvider, AdminUser } from '../types/admin';
import type { Inquiry, InquiryInput, InquiryStatus } from '../types/inquiry';
import type { SitePageTemplates } from '../types/pageTemplate';
import type { SiteData } from '../types/siteData';
import { getFirebaseAuth, getFirebaseDb, getFirebaseStorage } from './firebase';
import { syncCustomPages } from './customPages';

type AdminProfileDoc = {
  name?: string;
  email?: string;
  provider?: AdminProvider;
  createdAt?: string;
  updatedAt?: string;
};

const COLLECTIONS = {
  admins: 'admins',
  inquiries: 'inquiries',
  siteData: 'siteData',
} as const;

const SITE_DATA_DOC_ID = 'current';
const VALID_STATUSES = new Set<InquiryStatus>(['new', 'in_progress', 'completed']);

function nowIso() {
  return new Date().toISOString();
}

function normalizeEmail(email?: string | null) {
  return String(email || '').trim().toLowerCase();
}

function normalizeStoredPath(path: string) {
  const [pathname] = String(path || '').split('#');
  return pathname.split('?')[0] || '/';
}

function inferName(user: User, fallback?: string) {
  const name = String(fallback || user.displayName || '').trim();
  if (name) {
    return name;
  }

  const email = normalizeEmail(user.email);
  if (!email) {
    return '관리자';
  }

  return email.split('@')[0] || '관리자';
}

function inferProvider(user: User, fallback?: AdminProvider): AdminProvider {
  if (fallback) {
    return fallback;
  }

  const hasGoogleProvider = user.providerData.some((item) => item.providerId === 'google.com');
  return hasGoogleProvider ? 'google' : 'password';
}

function mapAdminUser(user: User, profile?: AdminProfileDoc): AdminUser {
  return {
    id: user.uid,
    name: inferName(user, profile?.name),
    email: normalizeEmail(profile?.email || user.email),
    provider: inferProvider(user, profile?.provider),
    createdAt: String(profile?.createdAt || nowIso()),
  };
}

function mapFirebaseAuthError(error: unknown, fallback: string) {
  const code = typeof error === 'object' && error && 'code' in error ? String(error.code) : '';

  const messages: Record<string, string> = {
    'auth/email-already-in-use': '이미 등록된 관리자 이메일입니다.',
    'auth/invalid-email': '올바른 이메일 형식이 아닙니다.',
    'auth/missing-password': '비밀번호를 입력해 주세요.',
    'auth/weak-password': '비밀번호는 8자 이상으로 설정해 주세요.',
    'auth/invalid-credential': '이메일 또는 비밀번호가 올바르지 않습니다.',
    'auth/user-not-found': '이메일 또는 비밀번호가 올바르지 않습니다.',
    'auth/wrong-password': '이메일 또는 비밀번호가 올바르지 않습니다.',
    'auth/popup-closed-by-user': 'Google 로그인 창이 닫혀 인증이 취소되었습니다.',
  };

  return messages[code] || fallback;
}

function mapFirebaseStorageError(error: unknown, fallback: string) {
  const code = typeof error === 'object' && error && 'code' in error ? String(error.code) : '';

  const messages: Record<string, string> = {
    'storage/unauthorized': '이미지 업로드 권한이 없습니다.',
    'storage/canceled': '이미지 업로드가 취소되었습니다.',
    'storage/invalid-format': '지원하지 않는 파일 형식입니다.',
    'storage/quota-exceeded': '스토리지 업로드 한도를 초과했습니다.',
  };

  return messages[code] || fallback;
}

async function waitForAuthUser() {
  const auth = getFirebaseAuth();
  const current = auth.currentUser;
  if (current) {
    return current;
  }

  return new Promise<User | null>((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe();
      resolve(user);
    });
  });
}

async function ensureAdminProfile(user: User, profilePatch?: Partial<AdminProfileDoc>) {
  const db = getFirebaseDb();
  const ref = doc(db, COLLECTIONS.admins, user.uid);
  const snapshot = await getDoc(ref);
  const existing = snapshot.exists() ? (snapshot.data() as AdminProfileDoc) : {};

  const profile: AdminProfileDoc = {
    name: inferName(user, profilePatch?.name || existing.name),
    email: normalizeEmail(profilePatch?.email || existing.email || user.email),
    provider: inferProvider(user, profilePatch?.provider || existing.provider),
    createdAt: existing.createdAt || nowIso(),
    updatedAt: nowIso(),
  };

  await setDoc(ref, profile, { merge: true });
  return profile;
}

function parseInquiry(id: string, data: Record<string, unknown>): Inquiry {
  const statusRaw = String(data.status || 'new') as InquiryStatus;
  const status = VALID_STATUSES.has(statusRaw) ? statusRaw : 'new';

  return {
    id,
    organizationName: String(data.organizationName || ''),
    contactName: String(data.contactName || ''),
    email: String(data.email || ''),
    eventDate: String(data.eventDate || ''),
    message: String(data.message || ''),
    status,
    notes: String(data.notes || ''),
    createdAt: String(data.createdAt || nowIso()),
  };
}

async function getSignedInAdminUser() {
  const user = await waitForAuthUser();
  if (!user) {
    throw new Error('관리자 인증이 필요합니다.');
  }

  const profile = await ensureAdminProfile(user);
  return mapAdminUser(user, profile);
}

export async function submitInquiry(input: InquiryInput): Promise<Inquiry> {
  const organizationName = String(input.organizationName || '').trim();
  const contactName = String(input.contactName || '').trim();
  const email = normalizeEmail(input.email);
  const eventDate = String(input.eventDate || '').trim();
  const message = String(input.message || '').trim();

  if (!organizationName || !contactName || !email || !message) {
    throw new Error('기관명, 담당자명, 이메일, 문의 내용은 필수입니다.');
  }

  const payload = {
    organizationName,
    contactName,
    email,
    eventDate,
    message,
    status: 'new' as InquiryStatus,
    notes: '',
    createdAt: nowIso(),
  };

  const db = getFirebaseDb();
  const ref = await addDoc(collection(db, COLLECTIONS.inquiries), payload);
  return {
    id: ref.id,
    ...payload,
  };
}

export async function fetchInquiries(_adminToken: string): Promise<Inquiry[]> {
  await getSignedInAdminUser();

  const db = getFirebaseDb();
  const snap = await getDocs(query(collection(db, COLLECTIONS.inquiries), orderBy('createdAt', 'desc')));
  return snap.docs.map((entry) => parseInquiry(entry.id, entry.data() as Record<string, unknown>));
}

export async function updateInquiryStatus(
  id: string,
  status: InquiryStatus,
  notes: string,
  _adminToken: string,
): Promise<Inquiry> {
  await getSignedInAdminUser();

  if (!id) {
    throw new Error('잘못된 문의 ID입니다.');
  }

  if (!VALID_STATUSES.has(status)) {
    throw new Error('허용되지 않은 상태값입니다.');
  }

  const db = getFirebaseDb();
  const ref = doc(db, COLLECTIONS.inquiries, id);
  const trimmedNotes = String(notes || '').trim();

  await updateDoc(ref, {
    status,
    notes: trimmedNotes,
  });

  const updated = await getDoc(ref);
  if (!updated.exists()) {
    throw new Error('문의 정보를 찾을 수 없습니다.');
  }

  return parseInquiry(updated.id, updated.data() as Record<string, unknown>);
}

export async function signUpAdmin(name: string, email: string, password: string): Promise<AdminAuthResponse> {
  const trimmedName = String(name || '').trim();
  const trimmedEmail = normalizeEmail(email);
  const trimmedPassword = String(password || '').trim();

  if (!trimmedName || !trimmedEmail || !trimmedPassword) {
    throw new Error('이름, 이메일, 비밀번호를 모두 입력해 주세요.');
  }

  if (trimmedPassword.length < 8) {
    throw new Error('비밀번호는 8자 이상이어야 합니다.');
  }

  try {
    const auth = getFirebaseAuth();
    const credential = await createUserWithEmailAndPassword(auth, trimmedEmail, trimmedPassword);

    await updateProfile(credential.user, {
      displayName: trimmedName,
    });

    const profile = await ensureAdminProfile(credential.user, {
      name: trimmedName,
      email: trimmedEmail,
      provider: 'password',
    });

    const token = await credential.user.getIdToken();
    return {
      token,
      user: mapAdminUser(credential.user, profile),
    };
  } catch (error) {
    throw new Error(mapFirebaseAuthError(error, '관리자 회원가입에 실패했습니다.'));
  }
}

export async function logInAdmin(email: string, password: string): Promise<AdminAuthResponse> {
  const trimmedEmail = normalizeEmail(email);
  const trimmedPassword = String(password || '').trim();

  if (!trimmedEmail || !trimmedPassword) {
    throw new Error('이메일과 비밀번호를 입력해 주세요.');
  }

  try {
    const auth = getFirebaseAuth();
    const credential = await signInWithEmailAndPassword(auth, trimmedEmail, trimmedPassword);
    const profile = await ensureAdminProfile(credential.user, {
      email: trimmedEmail,
      provider: 'password',
    });

    const token = await credential.user.getIdToken();
    return {
      token,
      user: mapAdminUser(credential.user, profile),
    };
  } catch (error) {
    throw new Error(mapFirebaseAuthError(error, '관리자 로그인에 실패했습니다.'));
  }
}

export async function logInAdminWithGoogle(credential: string): Promise<AdminAuthResponse> {
  try {
    const auth = getFirebaseAuth();
    let user = auth.currentUser;

    if (!user) {
      if (!credential) {
        throw new Error('Google 로그인 토큰을 확인할 수 없습니다.');
      }

      const googleCredential = GoogleAuthProvider.credential(credential);
      const result = await signInWithCredential(auth, googleCredential);
      user = result.user;
    }

    const profile = await ensureAdminProfile(user, {
      provider: 'google',
    });

    const token = await user.getIdToken();
    return {
      token,
      user: mapAdminUser(user, profile),
    };
  } catch (error) {
    throw new Error(mapFirebaseAuthError(error, 'Google 로그인에 실패했습니다.'));
  }
}

export async function fetchCurrentAdmin(_adminToken: string): Promise<AdminUser> {
  return getSignedInAdminUser();
}

export async function deleteAdminSession(_adminToken: string): Promise<void> {
  const auth = getFirebaseAuth();
  await signOut(auth);
}

export function normalizeSiteData(data: Record<string, unknown> | null | undefined): SiteData {
  const mergeWithDefaults = <T>(defaults: T, value: unknown): T => {
    if (Array.isArray(defaults)) {
      return (Array.isArray(value) ? value : defaults) as T;
    }

    if (defaults && typeof defaults === 'object') {
      const source = value && typeof value === 'object' ? (value as Record<string, unknown>) : {};

      return Object.entries(defaults as Record<string, unknown>).reduce(
        (accumulator, [key, defaultValue]) => {
          accumulator[key] = mergeWithDefaults(defaultValue, source[key]);
          return accumulator;
        },
        {} as Record<string, unknown>,
      ) as T;
    }

    return (value === undefined ? defaults : value) as T;
  };

  const finalizeSiteData = (normalized: SiteData): SiteData => {
    const headerItems = normalized.content.menus.headerItems.map((item) => {
      const hasLegacyResourceChildren = item.children.some((child) => String(child.path || '').startsWith('/resources#'));
      const isLegacyResourceMenu = item.path === '/resources' && (hasLegacyResourceChildren || item.label === '자료실');

      if (!isLegacyResourceMenu) {
        return item;
      }

      return {
        ...item,
        label: '정보센터',
        path: '/resources',
        children: [
          { label: '소식', path: '/resources/notices' },
          { label: '자료', path: '/resources/files' },
        ],
      };
    });

    const templates = Object.entries(normalized.templates || {}).reduce<SitePageTemplates>((accumulator, [rawPath, rawTemplateId]) => {
      const path = normalizeStoredPath(rawPath);
      const templateId = String(rawTemplateId || '').trim();

      if (!path || !templateId || !(templateId in templateCatalogMap) || !isTemplateCompatibleWithPage(path, templateId)) {
        return accumulator;
      }

      accumulator[path] = templateId as keyof typeof templateCatalogMap;
      return accumulator;
    }, {});

    const mergedTemplates = {
      ...defaultSiteData.templates,
      ...templates,
    };
    const mergedTemplateLayouts = normalizeTemplateLayouts(
      normalized.templateLayouts as Partial<typeof defaultSiteData.templateLayouts> | undefined,
    );

    const normalizedContent = syncCustomPages(
      {
        ...normalized.content,
        menus: {
          ...normalized.content.menus,
          headerItems,
        },
        resources: {
          ...normalized.content.resources,
          notices: normalized.content.resources.notices.map((item) => ({
            category: String(item.category || '일반'),
            ...item,
          })),
        },
      },
      mergedTemplates,
      mergedTemplateLayouts,
    );

    return {
      ...normalized,
      layouts: buildSitePageLayoutsFromTemplates(mergedTemplates, mergedTemplateLayouts),
      templates: {
        ...mergedTemplates,
      },
      templateLayouts: mergedTemplateLayouts,
      content: normalizedContent,
    };
  };

  if (!data || typeof data !== 'object') {
    return defaultSiteData;
  }

  if ('copy' in data && 'content' in data) {
    return finalizeSiteData(mergeWithDefaults(defaultSiteData, data));
  }

  if ('item' in data && data.item && typeof data.item === 'object') {
    return finalizeSiteData(mergeWithDefaults(defaultSiteData, data.item));
  }

  return defaultSiteData;
}

function sanitizeFileName(fileName: string) {
  return fileName
    .normalize('NFKD')
    .replace(/[^\w.-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();
}

export async function fetchSiteData(): Promise<SiteData> {
  const db = getFirebaseDb();
  const ref = doc(db, COLLECTIONS.siteData, SITE_DATA_DOC_ID);
  const snapshot = await getDoc(ref);

  if (!snapshot.exists()) {
    return defaultSiteData;
  }

  return normalizeSiteData(snapshot.data() as Record<string, unknown>);
}

export async function saveSiteData(item: SiteData, _adminToken: string): Promise<SiteData> {
  await getSignedInAdminUser();

  const db = getFirebaseDb();
  const ref = doc(db, COLLECTIONS.siteData, SITE_DATA_DOC_ID);
  const normalizedItem = normalizeSiteData(item);

  await setDoc(ref, {
    ...normalizedItem,
    updatedAt: nowIso(),
  });

  return normalizedItem;
}

export async function uploadAdminImage(file: File, page: string, _adminToken: string): Promise<string> {
  const user = await waitForAuthUser();
  if (!user) {
    throw new Error('관리자 인증이 필요합니다.');
  }

  if (!file) {
    throw new Error('업로드할 이미지 파일을 선택해 주세요.');
  }

  if (!file.type.startsWith('image/')) {
    throw new Error('이미지 파일만 업로드할 수 있습니다.');
  }

  const safeName = sanitizeFileName(file.name || 'image');
  const storage = getFirebaseStorage();
  const storageRef = ref(storage, `admin-assets/${user.uid}/${page}/${Date.now()}-${safeName}`);

  try {
    const snapshot = await uploadBytes(storageRef, file, {
      contentType: file.type,
    });
    return getDownloadURL(snapshot.ref);
  } catch (error) {
    throw new Error(mapFirebaseStorageError(error, '이미지 업로드에 실패했습니다.'));
  }
}

export async function deleteAdminImage(imageUrl: string, _adminToken: string): Promise<void> {
  const trimmedUrl = String(imageUrl || '').trim();
  if (!trimmedUrl) {
    return;
  }

  const user = await waitForAuthUser();
  if (!user) {
    throw new Error('관리자 인증이 필요합니다.');
  }

  const isFirebaseStorageUrl =
    trimmedUrl.startsWith('gs://') ||
    trimmedUrl.includes('firebasestorage.googleapis.com') ||
    trimmedUrl.includes('storage.googleapis.com') ||
    trimmedUrl.includes('.firebasestorage.app');

  if (!isFirebaseStorageUrl) {
    return;
  }

  try {
    const storage = getFirebaseStorage();
    const imageRef = ref(storage, trimmedUrl);

    if (!imageRef.fullPath.startsWith(`admin-assets/${user.uid}/`)) {
      return;
    }

    await deleteObject(imageRef);
  } catch (error) {
    const code = typeof error === 'object' && error && 'code' in error ? String(error.code) : '';

    if (code === 'storage/object-not-found' || code === 'storage/invalid-url') {
      return;
    }

    throw new Error(mapFirebaseStorageError(error, '이미지 삭제에 실패했습니다.'));
  }
}
