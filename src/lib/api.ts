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
  runTransaction,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { deleteObject, getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { defaultSiteData } from '../content/defaultSiteData';
import {
  isDraftManagedCategoryLabel,
  resolveManagedHeaderChildPath,
  shouldAutoGenerateManagedHeaderChildPath,
} from './menuCategories';
import { createMemberCompanySlug } from './contentUtils';
import type { AdminAuthResponse, AdminProvider, AdminUser } from '../types/admin';
import type { Inquiry, InquiryInput, InquiryStatus } from '../types/inquiry';
import type { SiteData } from '../types/siteData';
import { getFirebaseAuth, getFirebaseDb, getFirebaseStorage } from './firebase';

type AdminProfileDoc = {
  name?: string;
  email?: string;
  provider?: AdminProvider;
  createdAt?: string;
  updatedAt?: string;
  approved?: boolean;
};

const COLLECTIONS = {
  admins: 'admins',
  inquiries: 'inquiries',
  siteData: 'siteData',
};

const SITE_DATA_DOC_ID = 'current';
const VALID_STATUSES = new Set<InquiryStatus>(['new', 'in_progress', 'completed']);
export const ADMIN_APPROVAL_PENDING_MESSAGE = '관리자 승인 대기 중입니다. 승인 후 다시 로그인해 주세요.';
const SITE_DATA_STALE_SAVE_MESSAGE = '다른 화면의 변경사항이 먼저 저장됐어. 새로고침한 뒤 다시 저장해 줘.';
const LEGACY_ABOUT_COPY = {
  introTitle: '회사소개 페이지는 회사가 누구인지보다 어떤 방식으로 일하는지까지 보여줘야 합니다.',
  introDescription:
    '이 페이지는 마이스파트너의 방향, 일하는 방식, 강점을 정리하는 구조로 두었고, 실제 회사 문구는 이후 직접 교체할 수 있게 placeholder로 남겨두었습니다.',
  identityTitle: '회사소개에서는 핵심 메시지와 일하는 기준이 먼저 보여야 합니다.',
  identityDescription:
    '실제 소개 문구는 이후 바꾸더라도, 어떤 성격의 회사인지와 어떤 서비스를 중심으로 일하는지는 먼저 구조로 잡아두는 편이 좋습니다.',
  identityCardTitle: '회사 소개 문장 Placeholder',
  ownerCardTitle: '직접 교체할 항목',
  strengthTitle: '회사소개에는 강점과 협업 방식이 같이 들어가야 신뢰가 생깁니다.',
  strengthDescription: '연혁만 나열하는 방식보다, 고객이 왜 이 회사를 선택해야 하는지 바로 이해할 수 있게 구성하는 편이 더 좋습니다.',
  processTitle: '문의부터 운영까지 어떤 흐름으로 일하는지 정리해 두면 회사 소개가 훨씬 선명해집니다.',
  processDescription: '실제 회사소개 페이지에서도 협업 절차가 보이면 고객이 문의 전부터 기대치를 맞추기 쉬워집니다.',
};
const LEGACY_ABOUT_CONTENT = {
  introEyebrow: 'About',
  identityEyebrow: 'Who We Are',
  strengthEyebrow: 'Why Mice Partner',
  processEyebrow: 'Working Process',
  messageTitle: '마이스파트너는 현장에서 바로 작동하는 운영 구조를 만드는 팀입니다.',
  messageBody:
    '우리는 행사 소개 문구를 예쁘게 정리하는 것보다 실제 운영 흐름이 끊기지 않게 만드는 일을 더 중요하게 생각합니다.\n\n고객이 처음 문의하는 순간부터 행사 종료 후 결과를 정리하는 시점까지, 커뮤니케이션과 현장 운영이 같은 기준으로 움직이는 구조를 만듭니다.',
  identityPoints: [
    '행사 목적과 일정에 맞는 운영 범위를 먼저 정리합니다.',
    '현장 등록, 체크인, 협력사 커뮤니케이션처럼 실제 실행 구간을 기준으로 제안합니다.',
    '행사 종료 후 결과 정리와 다음 운영 개선까지 연결될 수 있게 기록을 남깁니다.',
  ],
  highlights: [
    {
      title: '지역 기반 실행력',
      description: '대전과 충청권 행사 운영 환경을 이해한 상태에서 빠르게 협력 체계를 만들 수 있습니다.',
      iconKey: 'map',
      imageUrl: '',
    },
    {
      title: '운영 커뮤니케이션',
      description: '주최기관, 협력사, 스태프가 같은 기준으로 움직이도록 정보 구조를 정리합니다.',
      iconKey: 'message',
      imageUrl: '',
    },
    {
      title: '웹과 현장의 연결',
      description: '웹사이트 문구, 참가자 안내, 현장 운영이 끊기지 않도록 한 흐름으로 설계합니다.',
      iconKey: 'globe',
      imageUrl: '',
    },
  ],
  processSteps: [
    {
      step: '01',
      title: '문의 수집',
      description: '고객의 요청 범위를 빠르게 파악해 필요한 자료와 다음 액션을 정리합니다.',
    },
    {
      step: '02',
      title: '운영 설계',
      description: '행사 운영 범위, 안내 구조, 협업 포인트를 실제 실행 관점에서 정리합니다.',
    },
    {
      step: '03',
      title: '실행과 회고',
      description: '행사 운영 후 결과와 개선 포인트를 남겨 반복 가능한 운영 체계를 만듭니다.',
    },
  ],
} as const;

function normalizeMenuPath(path: string) {
  const [pathname] = String(path || '').split('#');
  return pathname.split('?')[0] || '/';
}

function normalizeMenuLabel(label: string) {
  return String(label || '').trim().replace(/\s+/g, '');
}

function normalizeLegacyHeaderChildPath(parentPath: string, childPath: string, childLabel: string, fallbackPath = '') {
  const normalizedParentPath = normalizeMenuPath(parentPath);
  const normalizedChildPath = String(childPath || '').trim();
  const normalizedChildLabel = normalizeMenuLabel(childLabel);

  if (normalizedParentPath === '/resources' && normalizedChildPath.startsWith('/resources#')) {
    if (normalizedChildLabel.includes('소식')) {
      return '/resources/notices';
    }

    if (normalizedChildLabel.includes('자료')) {
      return '/resources/files';
    }

    return fallbackPath || normalizedChildPath;
  }

  if (normalizedParentPath === '/about') {
    if (normalizedChildPath === '/about#about-identity' || normalizedChildLabel.includes('회사개요') || normalizedChildLabel.includes('브랜드소개')) {
      return '/about/overview';
    }

    if (
      normalizedChildPath === '/about#about-strengths' ||
      normalizedChildPath === '/about#about-strength' ||
      normalizedChildLabel.includes('강점소개') ||
      normalizedChildLabel.includes('사업영역')
    ) {
      return '/about/business';
    }

    if (normalizedChildPath === '/about#about-process' || normalizedChildLabel.includes('운영프로세스')) {
      return '/about/process';
    }
  }

  if (normalizedParentPath === '/members') {
    return resolveManagedHeaderChildPath(normalizedParentPath, childLabel, normalizedChildPath, fallbackPath);
  }

  if (normalizedParentPath === '/cases') {
    const [pathWithoutHash] = normalizedChildPath.split('#');
    const [, search = ''] = pathWithoutHash.split('?');
    const queryCategory = new URLSearchParams(search).get('category') || '';

    if (
      shouldAutoGenerateManagedHeaderChildPath(normalizedParentPath, normalizedChildPath) ||
      !queryCategory.trim() ||
      isDraftManagedCategoryLabel(queryCategory)
    ) {
      return resolveManagedHeaderChildPath(normalizedParentPath, childLabel, normalizedChildPath, fallbackPath);
    }
  }

  if (shouldAutoGenerateManagedHeaderChildPath(normalizedParentPath, normalizedChildPath)) {
    return resolveManagedHeaderChildPath(normalizedParentPath, childLabel, normalizedChildPath, fallbackPath);
  }

  return normalizedChildPath || fallbackPath;
}

function normalizeAboutMenuChildren(
  parentLabel: string,
  children: Array<{ label: string; path: string }>,
  fallbackChildren: Array<{ label: string; path: string }>,
) {
  const usedLabels = new Set([normalizeMenuLabel(parentLabel)]);

  return fallbackChildren.map((fallbackChild, index) => {
    const candidate = children[index];
    const rawLabel = String(candidate?.label || fallbackChild.label).trim();
    const normalizedLabel = normalizeMenuLabel(rawLabel);

    if (!normalizedLabel || usedLabels.has(normalizedLabel)) {
      usedLabels.add(normalizeMenuLabel(fallbackChild.label));
      return {
        label: fallbackChild.label,
        path: fallbackChild.path,
      };
    }

    usedLabels.add(normalizedLabel);
    return {
      label: rawLabel,
      path: fallbackChild.path,
    };
  });
}

function hasOwnKey(target: unknown, key: string) {
  return Boolean(target && typeof target === 'object' && Object.prototype.hasOwnProperty.call(target, key));
}

function nowIso() {
  return new Date().toISOString();
}

function normalizeEmail(email?: string | null) {
  return String(email || '').trim().toLowerCase();
}

function matchesLegacyValue(value: unknown, legacy: unknown) {
  return JSON.stringify(value) === JSON.stringify(legacy);
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

function isAdminApproved(profile?: AdminProfileDoc, hasExistingProfile = true) {
  if (!hasExistingProfile) {
    return false;
  }

  return profile?.approved !== false;
}

function assertApprovedAdminProfile(profile?: AdminProfileDoc, hasExistingProfile = true) {
  if (!isAdminApproved(profile, hasExistingProfile)) {
    throw new Error(ADMIN_APPROVAL_PENDING_MESSAGE);
  }
}

export function isAdminApprovalPendingError(error: unknown) {
  return error instanceof Error && error.message === ADMIN_APPROVAL_PENDING_MESSAGE;
}

function mapAdminUser(user: User, profile?: AdminProfileDoc): AdminUser {
  return {
    id: user.uid,
    name: inferName(user, profile?.name),
    email: normalizeEmail(profile?.email || user.email),
    provider: inferProvider(user, profile?.provider),
    createdAt: String(profile?.createdAt || nowIso()),
    approved: isAdminApproved(profile),
  };
}

function mapAdminProfileToUser(id: string, profile?: AdminProfileDoc): AdminUser {
  const email = normalizeEmail(profile?.email);
  const name = String(profile?.name || email.split('@')[0] || '관리자').trim();

  return {
    id,
    name: name || '관리자',
    email,
    provider: profile?.provider === 'google' ? 'google' : 'password',
    createdAt: String(profile?.createdAt || nowIso()),
    approved: isAdminApproved(profile),
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
  const code = getFirebaseErrorCode(error);

  const messages: Record<string, string> = {
    'storage/unauthorized': '이미지 업로드 권한이 없습니다. 다시 로그인하거나 관리자 승인 상태를 확인해 봐.',
    'storage/canceled': '이미지 업로드가 취소되었습니다.',
    'storage/invalid-format': '지원하지 않는 파일 형식입니다.',
    'storage/quota-exceeded': '스토리지 업로드 한도를 초과했습니다.',
  };

  return messages[code] || fallback;
}

function getFirebaseErrorCode(error: unknown) {
  return typeof error === 'object' && error && 'code' in error ? String(error.code) : '';
}

function sanitizeStoragePathSegment(value: string) {
  return String(value || 'content')
    .trim()
    .replace(/\\/g, '/')
    .replace(/[^a-zA-Z0-9/_-]/g, '-')
    .replace(/\/{2,}/g, '/')
    .replace(/^\/|\/$/g, '') || 'content';
}

async function uploadAdminStorageObject(user: User, page: string, file: File, contentType: string) {
  const safeName = sanitizeFileName(file.name || 'file');
  const safePage = sanitizeStoragePathSegment(page);
  const storage = getFirebaseStorage();
  const storageRef = ref(storage, `admin-assets/${user.uid}/${safePage}/${Date.now()}-${safeName}`);

  const executeUpload = async (forceRefresh = false) => {
    await user.getIdToken(forceRefresh);
    return uploadBytes(storageRef, file, {
      contentType,
    });
  };

  try {
    return await executeUpload(false);
  } catch (error) {
    if (getFirebaseErrorCode(error) !== 'storage/unauthorized') {
      throw error;
    }

    return executeUpload(true);
  }
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
  const hasExistingProfile = snapshot.exists();
  const existing = snapshot.exists() ? (snapshot.data() as AdminProfileDoc) : {};

  const profile: AdminProfileDoc = {
    name: inferName(user, profilePatch?.name || existing.name),
    email: normalizeEmail(profilePatch?.email || existing.email || user.email),
    provider: inferProvider(user, profilePatch?.provider || existing.provider),
    createdAt: existing.createdAt || nowIso(),
    updatedAt: nowIso(),
  };

  if (typeof profilePatch?.approved === 'boolean') {
    profile.approved = profilePatch.approved;
  } else if (!hasExistingProfile) {
    profile.approved = false;
  } else if (typeof existing.approved === 'boolean') {
    profile.approved = existing.approved;
  }

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

async function getSignedInAdminUser(options?: { requireApproved?: boolean }) {
  const user = await waitForAuthUser();
  if (!user) {
    throw new Error('관리자 인증이 필요합니다.');
  }

  const requireApproved = options?.requireApproved !== false;
  const profile = await ensureAdminProfile(user);
  if (requireApproved) {
    assertApprovedAdminProfile(profile);
  }
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
      approved: false,
    });
    await signOut(auth);
    return {
      token: '',
      user: mapAdminUser(credential.user, profile),
    };
  } catch (error) {
    if (error instanceof Error && error.message === ADMIN_APPROVAL_PENDING_MESSAGE) {
      throw error;
    }
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
    assertApprovedAdminProfile(profile);

    const token = await credential.user.getIdToken();
    return {
      token,
      user: mapAdminUser(credential.user, profile),
    };
  } catch (error) {
    if (isAdminApprovalPendingError(error)) {
      await signOut(getFirebaseAuth());
      throw error;
    }
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
    assertApprovedAdminProfile(profile);

    const token = await user.getIdToken();
    return {
      token,
      user: mapAdminUser(user, profile),
    };
  } catch (error) {
    if (isAdminApprovalPendingError(error)) {
      await signOut(getFirebaseAuth());
      throw error;
    }
    throw new Error(mapFirebaseAuthError(error, 'Google 로그인에 실패했습니다.'));
  }
}

export async function fetchCurrentAdmin(_adminToken: string, options?: { requireApproved?: boolean }): Promise<AdminUser> {
  return getSignedInAdminUser(options);
}

export async function fetchAdminUsers(_adminToken: string): Promise<AdminUser[]> {
  await getSignedInAdminUser();

  const db = getFirebaseDb();
  const snap = await getDocs(collection(db, COLLECTIONS.admins));

  return snap.docs
    .map((entry) => mapAdminProfileToUser(entry.id, entry.data() as AdminProfileDoc))
    .sort((left, right) => String(left.createdAt).localeCompare(String(right.createdAt)));
}

export async function updateAdminApproval(adminId: string, approved: boolean, _adminToken: string): Promise<AdminUser> {
  const currentAdmin = await getSignedInAdminUser();

  if (!adminId) {
    throw new Error('잘못된 관리자 ID입니다.');
  }

  if (currentAdmin.id === adminId && !approved) {
    throw new Error('현재 로그인한 관리자는 승인 해제할 수 없습니다.');
  }

  const db = getFirebaseDb();
  const ref = doc(db, COLLECTIONS.admins, adminId);
  const snapshot = await getDoc(ref);

  if (!snapshot.exists()) {
    throw new Error('관리자 계정을 찾을 수 없습니다.');
  }

  await updateDoc(ref, {
    approved,
    updatedAt: nowIso(),
  });

  const updated = await getDoc(ref);
  return mapAdminProfileToUser(updated.id, updated.data() as AdminProfileDoc);
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

  const finalizeSiteData = (normalized: SiteData, rawSiteData?: Record<string, unknown> | null): SiteData => {
    const normalizedUpdatedAt = String(rawSiteData?.updatedAt || '').trim();
    const removedPagePaths = new Set(['/services']);
    const isRemovedPagePath = (path: string) => removedPagePaths.has(normalizeMenuPath(path));
    const defaultHeaderMap = new Map(
      defaultSiteData.content.menus.headerItems.map((item) => [normalizeMenuPath(item.path), item]),
    );
    const defaultHeaderLabelMap = new Map(
      defaultSiteData.content.menus.headerItems.map((item) => [normalizeMenuLabel(item.label), item]),
    );
    defaultHeaderLabelMap.set('자료실', defaultSiteData.content.menus.headerItems.find((item) => normalizeMenuPath(item.path) === '/resources')!);

    const headerItems = normalized.content.menus.headerItems
      .map((item) => {
        const normalizedPath = normalizeMenuPath(item.path);
        const normalizedLabel = normalizeMenuLabel(item.label);
        const hasLegacyResourceChildren = item.children.some((child) => String(child.path || '').startsWith('/resources#'));
        const isLegacyResourceMenu = normalizedPath === '/resources' && (hasLegacyResourceChildren || item.label === '자료실');
        const canonicalItem =
          defaultHeaderLabelMap.get(normalizedLabel) ||
          defaultHeaderMap.get(normalizedPath) ||
          (isLegacyResourceMenu ? defaultHeaderMap.get('/resources') : undefined);
        const resolvedPath = String(item.path || canonicalItem?.path || '/').trim();
        const rawChildren = Array.isArray(item.children)
          ? item.children
          : canonicalItem?.children || [];

        const resolvedLabel = String(item.label || canonicalItem?.label || '').trim();
        const normalizedChildren = rawChildren
          .map((child, index) => ({
            label: String(child?.label || canonicalItem?.children?.[index]?.label || '').trim(),
            path: normalizeLegacyHeaderChildPath(
              resolvedPath,
              String(child?.path || '').trim(),
              String(child?.label || ''),
              canonicalItem?.children?.[index]?.path || '',
            ),
          }))
          .filter((child) => child.label && child.path);
        const finalChildren =
          normalizeMenuPath(resolvedPath) === '/about'
            ? normalizeAboutMenuChildren(resolvedLabel, normalizedChildren, canonicalItem?.children || [])
            : normalizedChildren;

        return {
          ...item,
          label: resolvedLabel,
          path: resolvedPath,
          children: finalChildren,
        };
      })
      .filter((item) => item.label && item.path)
      .filter((item) => !isRemovedPagePath(item.path))
      .map((item) => ({
        ...item,
        children: item.children.filter((child) => !isRemovedPagePath(child.path)),
      }));
    const footerQuickLinks = normalized.content.menus.footerQuickLinks.filter((item) => !isRemovedPagePath(item.path));
    const resolveHomeCtaHref = (path: string, fallback: string) => {
      const trimmedPath = String(path || '').trim();

      if (!trimmedPath) {
        return fallback;
      }

      return isRemovedPagePath(trimmedPath) ? '/cases' : trimmedPath;
    };
    const homePrimaryCtaHref = resolveHomeCtaHref(
      normalized.content.home.primaryCtaHref,
      resolveHomeCtaHref(defaultSiteData.content.home.primaryCtaHref, '/cases'),
    );
    const homePositioningCtaHref = resolveHomeCtaHref(
      normalized.content.home.positioningCtaHref,
      resolveHomeCtaHref(defaultSiteData.content.home.positioningCtaHref, '/cases'),
    );
    const homeSecondaryCtaHref = resolveHomeCtaHref(
      normalized.content.home.secondaryCtaHref,
      resolveHomeCtaHref(defaultSiteData.content.home.secondaryCtaHref, '/cases'),
    );
    const homeResourcesCtaHref = resolveHomeCtaHref(
      normalized.content.home.resourcesCtaHref,
      defaultSiteData.content.home.resourcesCtaHref,
    );
    const homePartnersCtaHref = resolveHomeCtaHref(
      normalized.content.home.partnersCtaHref,
      defaultSiteData.content.home.partnersCtaHref,
    );
    const homeCtaButtonHref = resolveHomeCtaHref(
      normalized.content.home.ctaButtonHref,
      defaultSiteData.content.home.ctaButtonHref,
    );
    const defaultCaseEntryMap = new Map(
      defaultSiteData.content.cases.entries.map((item) => [String(item.slug || '').trim(), item]),
    );
    const normalizedCaseEntries = normalized.content.cases.entries.map((item) => {
      const fallback = defaultCaseEntryMap.get(String(item.slug || '').trim());

      return {
        ...fallback,
        ...item,
        updatedAt: String((item as { updatedAt?: string }).updatedAt || fallback?.updatedAt || '').trim(),
      };
    });
    const defaultMemberCompanyMap = new Map(
      defaultSiteData.content.members.companies.map((item) => [String(item.name || '').trim(), item]),
    );
    const normalizedMemberCompanies = normalized.content.members.companies.map((item) => {
      const fallback = defaultMemberCompanyMap.get(String(item.name || '').trim());
      const resolvedName = String(item.name || fallback?.name || '').trim();

      return {
        ...fallback,
        ...item,
        slug: String((item as { slug?: string }).slug || fallback?.slug || createMemberCompanySlug(resolvedName)).trim(),
        updatedAt: String((item as { updatedAt?: string }).updatedAt || fallback?.updatedAt || '').trim(),
        body: String((item as { body?: string }).body || fallback?.body || '').trim(),
      };
    });
    const rawContent = rawSiteData?.content;
    const rawHome =
      rawContent && typeof rawContent === 'object'
        ? ((rawContent as Record<string, unknown>).home as Record<string, unknown> | undefined)
        : undefined;
    const hasPersistedHeroSlides = hasOwnKey(rawHome, 'heroSlides');
    const fallbackHeroSlides = [
      {
        title: String(normalized.copy.home.heroTitle || '').trim(),
        description: String(normalized.copy.home.heroDescription || '').trim(),
        imageUrl: String(normalized.content.home.heroImageUrl || '').trim(),
      },
    ].filter((item) => item.title || item.description || item.imageUrl);
    const normalizedHeroSlides = Array.isArray(normalized.content.home.heroSlides)
      ? normalized.content.home.heroSlides
          .map((item) => ({
            title: String(item?.title || '').trim(),
            description: String(item?.description || '').trim(),
            imageUrl: String(item?.imageUrl || '').trim(),
          }))
          .filter((item) => item.title || item.description || item.imageUrl)
      : [];
    const heroSlides =
      hasPersistedHeroSlides && normalizedHeroSlides.length > 0
        ? normalizedHeroSlides
        : fallbackHeroSlides.length > 0
          ? fallbackHeroSlides
          : normalizedHeroSlides.length > 0
            ? normalizedHeroSlides
            : defaultSiteData.content.home.heroSlides;
    const primaryHeroImageUrl = String(heroSlides[0]?.imageUrl || normalized.content.home.heroImageUrl || '').trim();

    const aboutCopy = {
      ...normalized.copy.about,
      introTitle: normalized.copy.about.introTitle === LEGACY_ABOUT_COPY.introTitle ? defaultSiteData.copy.about.introTitle : normalized.copy.about.introTitle,
      introDescription:
        normalized.copy.about.introDescription === LEGACY_ABOUT_COPY.introDescription
          ? defaultSiteData.copy.about.introDescription
          : normalized.copy.about.introDescription,
      identityTitle:
        normalized.copy.about.identityTitle === LEGACY_ABOUT_COPY.identityTitle
          ? defaultSiteData.copy.about.identityTitle
          : normalized.copy.about.identityTitle,
      identityDescription:
        normalized.copy.about.identityDescription === LEGACY_ABOUT_COPY.identityDescription
          ? defaultSiteData.copy.about.identityDescription
          : normalized.copy.about.identityDescription,
      identityCardTitle:
        normalized.copy.about.identityCardTitle === LEGACY_ABOUT_COPY.identityCardTitle
          ? defaultSiteData.copy.about.identityCardTitle
          : normalized.copy.about.identityCardTitle,
      ownerCardTitle:
        normalized.copy.about.ownerCardTitle === LEGACY_ABOUT_COPY.ownerCardTitle
          ? defaultSiteData.copy.about.ownerCardTitle
          : normalized.copy.about.ownerCardTitle,
      strengthTitle:
        normalized.copy.about.strengthTitle === LEGACY_ABOUT_COPY.strengthTitle
          ? defaultSiteData.copy.about.strengthTitle
          : normalized.copy.about.strengthTitle,
      strengthDescription:
        normalized.copy.about.strengthDescription === LEGACY_ABOUT_COPY.strengthDescription
          ? defaultSiteData.copy.about.strengthDescription
          : normalized.copy.about.strengthDescription,
      processTitle:
        normalized.copy.about.processTitle === LEGACY_ABOUT_COPY.processTitle
          ? defaultSiteData.copy.about.processTitle
          : normalized.copy.about.processTitle,
      processDescription:
        normalized.copy.about.processDescription === LEGACY_ABOUT_COPY.processDescription
          ? defaultSiteData.copy.about.processDescription
          : normalized.copy.about.processDescription,
    };

    const aboutContent = {
      ...normalized.content.about,
      introEyebrow:
        normalized.content.about.introEyebrow === LEGACY_ABOUT_CONTENT.introEyebrow
          ? defaultSiteData.content.about.introEyebrow
          : normalized.content.about.introEyebrow,
      identityEyebrow:
        normalized.content.about.identityEyebrow === LEGACY_ABOUT_CONTENT.identityEyebrow
          ? defaultSiteData.content.about.identityEyebrow
          : normalized.content.about.identityEyebrow,
      strengthEyebrow:
        normalized.content.about.strengthEyebrow === LEGACY_ABOUT_CONTENT.strengthEyebrow
          ? defaultSiteData.content.about.strengthEyebrow
          : normalized.content.about.strengthEyebrow,
      processEyebrow:
        normalized.content.about.processEyebrow === LEGACY_ABOUT_CONTENT.processEyebrow
          ? defaultSiteData.content.about.processEyebrow
          : normalized.content.about.processEyebrow,
      messageTitle:
        normalized.content.about.messageTitle === LEGACY_ABOUT_CONTENT.messageTitle
          ? defaultSiteData.content.about.messageTitle
          : normalized.content.about.messageTitle,
      messageBody:
        normalized.content.about.messageBody === LEGACY_ABOUT_CONTENT.messageBody
          ? defaultSiteData.content.about.messageBody
          : normalized.content.about.messageBody,
      identityPoints:
        matchesLegacyValue(normalized.content.about.identityPoints, LEGACY_ABOUT_CONTENT.identityPoints)
          ? defaultSiteData.content.about.identityPoints
          : normalized.content.about.identityPoints,
      highlights:
        matchesLegacyValue(normalized.content.about.highlights, LEGACY_ABOUT_CONTENT.highlights)
          ? defaultSiteData.content.about.highlights
          : normalized.content.about.highlights,
      processSteps:
        matchesLegacyValue(normalized.content.about.processSteps, LEGACY_ABOUT_CONTENT.processSteps)
          ? defaultSiteData.content.about.processSteps
          : normalized.content.about.processSteps,
    };

    return {
      ...normalized,
      updatedAt: normalizedUpdatedAt,
      copy: {
        ...normalized.copy,
        about: aboutCopy,
      },
      content: {
        ...normalized.content,
        home: {
          ...normalized.content.home,
          heroImageUrl: primaryHeroImageUrl,
          heroSlides,
          primaryCtaHref: homePrimaryCtaHref,
          positioningCtaHref: homePositioningCtaHref,
          secondaryCtaHref: homeSecondaryCtaHref,
          resourcesCtaHref: homeResourcesCtaHref,
          partnersCtaHref: homePartnersCtaHref,
          ctaButtonHref: homeCtaButtonHref,
        },
        cases: {
          ...normalized.content.cases,
          entries: normalizedCaseEntries,
        },
        members: {
          ...normalized.content.members,
          companies: normalizedMemberCompanies,
        },
        about: aboutContent,
        menus: {
          ...normalized.content.menus,
          headerItems,
          footerQuickLinks,
        },
        resources: {
          ...normalized.content.resources,
          notices: normalized.content.resources.notices.map((item) => ({
            category: String(item.category || '일반'),
            ...item,
          })),
        },
      },
    };
  };

  if (!data || typeof data !== 'object') {
    return defaultSiteData;
  }

  if ('copy' in data && 'content' in data) {
    return finalizeSiteData(mergeWithDefaults(defaultSiteData, data), data);
  }

  if ('item' in data && data.item && typeof data.item === 'object') {
    return finalizeSiteData(mergeWithDefaults(defaultSiteData, data.item), data.item as Record<string, unknown>);
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

export async function saveSiteDataWithTransform(
  _adminToken: string,
  transform: (current: SiteData) => SiteData,
): Promise<SiteData> {
  await getSignedInAdminUser();

  const db = getFirebaseDb();
  const ref = doc(db, COLLECTIONS.siteData, SITE_DATA_DOC_ID);

  return runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(ref);
    const current = snapshot.exists()
      ? normalizeSiteData(snapshot.data() as Record<string, unknown>)
      : defaultSiteData;
    const next = normalizeSiteData(transform(current));

    transaction.set(ref, {
      ...next,
      updatedAt: nowIso(),
    });

    return next;
  });
}

export async function saveSiteData(item: SiteData, _adminToken: string): Promise<SiteData> {
  await getSignedInAdminUser();

  const db = getFirebaseDb();
  const ref = doc(db, COLLECTIONS.siteData, SITE_DATA_DOC_ID);
  const normalizedItem = normalizeSiteData(item);
  const snapshot = await getDoc(ref);
  const latestUpdatedAt = snapshot.exists() ? String(snapshot.data()?.updatedAt || '').trim() : '';
  const localUpdatedAt = String(normalizedItem.updatedAt || '').trim();

  if (snapshot.exists() && latestUpdatedAt && localUpdatedAt !== latestUpdatedAt) {
    throw new Error(SITE_DATA_STALE_SAVE_MESSAGE);
  }

  const savedAt = nowIso();
  const savedItem = normalizeSiteData({
    ...normalizedItem,
    updatedAt: savedAt,
  } as Record<string, unknown>);

  await setDoc(ref, {
    ...savedItem,
    updatedAt: savedAt,
  });

  return savedItem;
}

export async function uploadAdminFile(file: File, page: string, _adminToken: string): Promise<string> {
  const user = await waitForAuthUser();
  if (!user) {
    throw new Error('관리자 인증이 필요합니다.');
  }
  const profile = await ensureAdminProfile(user);
  assertApprovedAdminProfile(profile);

  if (!file) {
    throw new Error('업로드할 파일을 선택해 주세요.');
  }

  try {
    const snapshot = await uploadAdminStorageObject(user, page, file, file.type || 'application/octet-stream');
    return await getDownloadURL(snapshot.ref);
  } catch (error) {
    throw new Error(mapFirebaseStorageError(error, '파일 업로드에 실패했습니다.'));
  }
}

export async function uploadAdminImage(file: File, page: string, _adminToken: string): Promise<string> {
  const user = await waitForAuthUser();
  if (!user) {
    throw new Error('관리자 인증이 필요합니다.');
  }
  const profile = await ensureAdminProfile(user);
  assertApprovedAdminProfile(profile);

  if (!file) {
    throw new Error('업로드할 이미지 파일을 선택해 주세요.');
  }

  if (!file.type.startsWith('image/')) {
    throw new Error('이미지 파일만 업로드할 수 있습니다.');
  }

  try {
    const snapshot = await uploadAdminStorageObject(user, page, file, file.type);
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
  const profile = await ensureAdminProfile(user);
  assertApprovedAdminProfile(profile);

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
