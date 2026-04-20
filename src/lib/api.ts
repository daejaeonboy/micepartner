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
const APPROVED_ADMIN_PROFILE_CACHE_TTL_MS = 5 * 60 * 1000;
const IMAGE_UPLOAD_MAX_DIMENSION = 1920;
const IMAGE_UPLOAD_TARGET_BYTES = 900 * 1024;
const IMAGE_UPLOAD_MIN_SIZE_TO_COMPRESS = 350 * 1024;
const approvedAdminProfileCache = new Map<string, { profile: AdminProfileDoc; expiresAt: number }>();
export const ADMIN_APPROVAL_PENDING_MESSAGE = '愿由ъ옄 ?뱀씤 ?湲?以묒엯?덈떎. ?뱀씤 ???ㅼ떆 濡쒓렇?명빐 二쇱꽭??';
const SITE_DATA_STALE_SAVE_MESSAGE = '?ㅻⅨ ?붾㈃??蹂寃쎌궗??씠 癒쇱? ??λ릱?? ?덈줈怨좎묠?????ㅼ떆 ??ν빐 以?';
const LEGACY_ABOUT_COPY = {
  introTitle: '?뚯궗?뚭컻 ?섏씠吏???뚯궗媛 ?꾧뎄?몄?蹂대떎 ?대뼡 諛⑹떇?쇰줈 ?쇳븯?붿?源뚯? 蹂댁뿬以섏빞 ?⑸땲??',
  introDescription:
    '???섏씠吏??留덉씠?ㅽ뙆?몃꼫??諛⑺뼢, ?쇳븯??諛⑹떇, 媛뺤젏???뺣━?섎뒗 援ъ“濡??먯뿀怨? ?ㅼ젣 ?뚯궗 臾멸뎄???댄썑 吏곸젒 援먯껜?????덇쾶 placeholder濡??④꺼?먯뿀?듬땲??',
  identityTitle: '?뚯궗?뚭컻?먯꽌???듭떖 硫붿떆吏? ?쇳븯??湲곗???癒쇱? 蹂댁뿬???⑸땲??',
  identityDescription:
    '?ㅼ젣 ?뚭컻 臾멸뎄???댄썑 諛붽씀?붾씪?? ?대뼡 ?깃꺽???뚯궗?몄?? ?대뼡 ?쒕퉬?ㅻ? 以묒떖?쇰줈 ?쇳븯?붿???癒쇱? 援ъ“濡??≪븘?먮뒗 ?몄씠 醫뗭뒿?덈떎.',
  identityCardTitle: '?뚯궗 ?뚭컻 臾몄옣 Placeholder',
  ownerCardTitle: '吏곸젒 援먯껜????ぉ',
  strengthTitle: '?뚯궗?뚭컻?먮뒗 媛뺤젏怨??묒뾽 諛⑹떇??媛숈씠 ?ㅼ뼱媛???좊ː媛 ?앷퉩?덈떎.',
  strengthDescription: '?고쁺留??섏뿴?섎뒗 諛⑹떇蹂대떎, 怨좉컼???????뚯궗瑜??좏깮?댁빞 ?섎뒗吏 諛붾줈 ?댄빐?????덇쾶 援ъ꽦?섎뒗 ?몄씠 ??醫뗭뒿?덈떎.',
  processTitle: '臾몄쓽遺???댁쁺源뚯? ?대뼡 ?먮쫫?쇰줈 ?쇳븯?붿? ?뺣━???먮㈃ ?뚯궗 ?뚭컻媛 ?⑥뵮 ?좊챸?댁쭛?덈떎.',
  processDescription: '?ㅼ젣 ?뚯궗?뚭컻 ?섏씠吏?먯꽌???묒뾽 ?덉감媛 蹂댁씠硫?怨좉컼??臾몄쓽 ?꾨???湲곕?移섎? 留욎텛湲??ъ썙吏묐땲??',
};
const LEGACY_ABOUT_CONTENT = {
  introEyebrow: 'About',
  identityEyebrow: 'Who We Are',
  strengthEyebrow: 'Why Mice Partner',
  processEyebrow: 'Working Process',
  messageTitle: '留덉씠?ㅽ뙆?몃꼫???꾩옣?먯꽌 諛붾줈 ?묐룞?섎뒗 ?댁쁺 援ъ“瑜?留뚮뱶????낅땲??',
  messageBody:
    '?곕━???됱궗 ?뚭컻 臾멸뎄瑜??덉걯寃??뺣━?섎뒗 寃껊낫???ㅼ젣 ?댁쁺 ?먮쫫???딄린吏 ?딄쾶 留뚮뱶???쇱쓣 ??以묒슂?섍쾶 ?앷컖?⑸땲??\n\n怨좉컼??泥섏쓬 臾몄쓽?섎뒗 ?쒓컙遺???됱궗 醫낅즺 ??寃곌낵瑜??뺣━?섎뒗 ?쒖젏源뚯?, 而ㅻ??덉??댁뀡怨??꾩옣 ?댁쁺??媛숈? 湲곗??쇰줈 ?吏곸씠??援ъ“瑜?留뚮벊?덈떎.',
  identityPoints: [
    '?됱궗 紐⑹쟻怨??쇱젙??留욌뒗 ?댁쁺 踰붿쐞瑜?癒쇱? ?뺣━?⑸땲??',
    '?꾩옣 ?깅줉, 泥댄겕?? ?묐젰??而ㅻ??덉??댁뀡泥섎읆 ?ㅼ젣 ?ㅽ뻾 援ш컙??湲곗??쇰줈 ?쒖븞?⑸땲??',
    '?됱궗 醫낅즺 ??寃곌낵 ?뺣━? ?ㅼ쓬 ?댁쁺 媛쒖꽑源뚯? ?곌껐?????덇쾶 湲곕줉???④퉩?덈떎.',
  ],
  highlights: [
    {
      title: '吏??湲곕컲 ?ㅽ뻾??',
      description: '??꾧낵 異⑹껌沅??됱궗 ?댁쁺 ?섍꼍???댄빐???곹깭?먯꽌 鍮좊Ⅴ寃??묐젰 泥닿퀎瑜?留뚮뱾 ???덉뒿?덈떎.',
      iconKey: 'map',
      imageUrl: '',
    },
    {
      title: '?댁쁺 而ㅻ??덉??댁뀡',
      description: '二쇱턀湲곌?, ?묐젰?? ?ㅽ깭?꾧? 媛숈? 湲곗??쇰줈 ?吏곸씠?꾨줉 ?뺣낫 援ъ“瑜??뺣━?⑸땲??',
      iconKey: 'message',
      imageUrl: '',
    },
    {
      title: '?밴낵 ?꾩옣???곌껐',
      description: '?뱀궗?댄듃 臾멸뎄, 李멸????덈궡, ?꾩옣 ?댁쁺???딄린吏 ?딅룄濡????먮쫫?쇰줈 ?ㅺ퀎?⑸땲??',
      iconKey: 'globe',
      imageUrl: '',
    },
  ],
  processSteps: [
    {
      step: '01',
      title: '臾몄쓽 ?섏쭛',
      description: '怨좉컼???붿껌 踰붿쐞瑜?鍮좊Ⅴ寃??뚯븙???꾩슂???먮즺? ?ㅼ쓬 ?≪뀡???뺣━?⑸땲??',
    },
    {
      step: '02',
      title: '?댁쁺 ?ㅺ퀎',
      description: '?됱궗 ?댁쁺 踰붿쐞, ?덈궡 援ъ“, ?묒뾽 ?ъ씤?몃? ?ㅼ젣 ?ㅽ뻾 愿?먯뿉???뺣━?⑸땲??',
    },
    {
      step: '03',
      title: '?ㅽ뻾怨??뚭퀬',
      description: '?됱궗 ?댁쁺 ??寃곌낵? 媛쒖꽑 ?ъ씤?몃? ?④꺼 諛섎났 媛?ν븳 ?댁쁺 泥닿퀎瑜?留뚮벊?덈떎.',
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
    if (normalizedChildLabel.includes('?뚯떇')) {
      return '/resources/notices';
    }

    if (normalizedChildLabel.includes('?먮즺')) {
      return '/resources/files';
    }

    return fallbackPath || normalizedChildPath;
  }

  if (normalizedParentPath === '/about') {
    if (normalizedChildPath === '/about#about-identity' || normalizedChildLabel.includes('?뚯궗媛쒖슂') || normalizedChildLabel.includes('釉뚮옖?쒖냼媛?')) {
      return '/about/overview';
    }

    if (
      normalizedChildPath === '/about#about-strengths' ||
      normalizedChildPath === '/about#about-strength' ||
      normalizedChildLabel.includes('媛뺤젏?뚭컻') ||
      normalizedChildLabel.includes('?ъ뾽?곸뿭')
    ) {
      return '/about/business';
    }

    if (normalizedChildPath === '/about#about-process' || normalizedChildLabel.includes('?댁쁺?꾨줈?몄뒪')) {
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
    return '愿由ъ옄';
  }

  return email.split('@')[0] || '愿由ъ옄';
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
  const name = String(profile?.name || email.split('@')[0] || '愿由ъ옄').trim();

  return {
    id,
    name: name || '愿由ъ옄',
    email,
    provider: profile?.provider === 'google' ? 'google' : 'password',
    createdAt: String(profile?.createdAt || nowIso()),
    approved: isAdminApproved(profile),
  };
}

function mapFirebaseAuthError(error: unknown, fallback: string) {
  const code = typeof error === 'object' && error && 'code' in error ? String(error.code) : '';

  const messages: Record<string, string> = {
    'auth/email-already-in-use': '?대? ?깅줉??愿由ъ옄 ?대찓?쇱엯?덈떎.',
    'auth/invalid-email': '?щ컮瑜??대찓???뺤떇???꾨떃?덈떎.',
    'auth/missing-password': '鍮꾨?踰덊샇瑜??낅젰??二쇱꽭??',
    'auth/weak-password': '鍮꾨?踰덊샇??8???댁긽?쇰줈 ?ㅼ젙??二쇱꽭??',
    'auth/invalid-credential': '?대찓???먮뒗 鍮꾨?踰덊샇媛 ?щ컮瑜댁? ?딆뒿?덈떎.',
    'auth/user-not-found': '?대찓???먮뒗 鍮꾨?踰덊샇媛 ?щ컮瑜댁? ?딆뒿?덈떎.',
    'auth/wrong-password': '?대찓???먮뒗 鍮꾨?踰덊샇媛 ?щ컮瑜댁? ?딆뒿?덈떎.',
    'auth/popup-closed-by-user': 'Google 濡쒓렇??李쎌씠 ?ロ? ?몄쬆??痍⑥냼?섏뿀?듬땲??',
  };

  return messages[code] || fallback;
}

function mapFirebaseStorageError(error: unknown, fallback: string) {
  const code = getFirebaseErrorCode(error);

  const messages: Record<string, string> = {
    'storage/unauthorized': '?대?吏 ?낅줈??沅뚰븳???놁뒿?덈떎. ?ㅼ떆 濡쒓렇?명븯嫄곕굹 愿由ъ옄 ?뱀씤 ?곹깭瑜??뺤씤??遊?',
    'storage/canceled': '?대?吏 ?낅줈?쒓? 痍⑥냼?섏뿀?듬땲??',
    'storage/invalid-format': '吏?먰븯吏 ?딅뒗 ?뚯씪 ?뺤떇?낅땲??',
    'storage/quota-exceeded': '?ㅽ넗由ъ? ?낅줈???쒕룄瑜?珥덇낵?덉뒿?덈떎.',
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

  const executeUpload = () => {
    return uploadBytes(storageRef, file, {
      contentType,
    });
  };

  try {
    return await executeUpload();
  } catch (error) {
    if (getFirebaseErrorCode(error) !== 'storage/unauthorized') {
      throw error;
    }

    await user.getIdToken(true);
    return executeUpload();
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

async function getApprovedAdminProfileForUpload(user: User) {
  const now = Date.now();
  const cached = approvedAdminProfileCache.get(user.uid);

  if (cached && cached.expiresAt > now) {
    assertApprovedAdminProfile(cached.profile);
    return cached.profile;
  }

  const db = getFirebaseDb();
  const adminRef = doc(db, COLLECTIONS.admins, user.uid);
  const snapshot = await getDoc(adminRef);

  if (snapshot.exists()) {
    const profile = snapshot.data() as AdminProfileDoc;
    assertApprovedAdminProfile(profile);
    approvedAdminProfileCache.set(user.uid, {
      profile,
      expiresAt: now + APPROVED_ADMIN_PROFILE_CACHE_TTL_MS,
    });
    return profile;
  }

  const profile = await ensureAdminProfile(user);
  assertApprovedAdminProfile(profile);
  approvedAdminProfileCache.set(user.uid, {
    profile,
    expiresAt: now + APPROVED_ADMIN_PROFILE_CACHE_TTL_MS,
  });
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
    throw new Error('愿由ъ옄 ?몄쬆???꾩슂?⑸땲??');
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
    throw new Error('湲곌?紐? ?대떦?먮챸, ?대찓?? 臾몄쓽 ?댁슜? ?꾩닔?낅땲??');
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
    throw new Error('?섎せ??臾몄쓽 ID?낅땲??');
  }

  if (!VALID_STATUSES.has(status)) {
    throw new Error('?덉슜?섏? ?딆? ?곹깭媛믪엯?덈떎.');
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
    throw new Error('臾몄쓽 ?뺣낫瑜?李얠쓣 ???놁뒿?덈떎.');
  }

  return parseInquiry(updated.id, updated.data() as Record<string, unknown>);
}

export async function signUpAdmin(name: string, email: string, password: string): Promise<AdminAuthResponse> {
  const trimmedName = String(name || '').trim();
  const trimmedEmail = normalizeEmail(email);
  const trimmedPassword = String(password || '').trim();

  if (!trimmedName || !trimmedEmail || !trimmedPassword) {
    throw new Error('?대쫫, ?대찓?? 鍮꾨?踰덊샇瑜?紐⑤몢 ?낅젰??二쇱꽭??');
  }

  if (trimmedPassword.length < 8) {
    throw new Error('鍮꾨?踰덊샇??8???댁긽?댁뼱???⑸땲??');
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
    throw new Error(mapFirebaseAuthError(error, '愿由ъ옄 ?뚯썝媛?낆뿉 ?ㅽ뙣?덉뒿?덈떎.'));
  }
}

export async function logInAdmin(email: string, password: string): Promise<AdminAuthResponse> {
  const trimmedEmail = normalizeEmail(email);
  const trimmedPassword = String(password || '').trim();

  if (!trimmedEmail || !trimmedPassword) {
    throw new Error('?대찓?쇨낵 鍮꾨?踰덊샇瑜??낅젰??二쇱꽭??');
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
    throw new Error(mapFirebaseAuthError(error, '愿由ъ옄 濡쒓렇?몄뿉 ?ㅽ뙣?덉뒿?덈떎.'));
  }
}

export async function logInAdminWithGoogle(credential: string): Promise<AdminAuthResponse> {
  try {
    const auth = getFirebaseAuth();
    let user = auth.currentUser;

    if (!user) {
      if (!credential) {
        throw new Error('Google 濡쒓렇???좏겙???뺤씤?????놁뒿?덈떎.');
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
    throw new Error(mapFirebaseAuthError(error, 'Google 濡쒓렇?몄뿉 ?ㅽ뙣?덉뒿?덈떎.'));
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
    throw new Error('?섎せ??愿由ъ옄 ID?낅땲??');
  }

  if (currentAdmin.id === adminId && !approved) {
    throw new Error('?꾩옱 濡쒓렇?명븳 愿由ъ옄???뱀씤 ?댁젣?????놁뒿?덈떎.');
  }

  const db = getFirebaseDb();
  const ref = doc(db, COLLECTIONS.admins, adminId);
  const snapshot = await getDoc(ref);

  if (!snapshot.exists()) {
    throw new Error('愿由ъ옄 怨꾩젙??李얠쓣 ???놁뒿?덈떎.');
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
    defaultHeaderLabelMap.set('?먮즺??', defaultSiteData.content.menus.headerItems.find((item) => normalizeMenuPath(item.path) === '/resources')!);

    const headerItems = normalized.content.menus.headerItems
      .map((item) => {
        const normalizedPath = normalizeMenuPath(item.path);
        const normalizedLabel = normalizeMenuLabel(item.label);
        const hasLegacyResourceChildren = item.children.some((child) => String(child.path || '').startsWith('/resources#'));
        const isLegacyResourceMenu = normalizedPath === '/resources' && (hasLegacyResourceChildren || item.label === '?먮즺??');
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
        mobileImageUrl: '',
        linkUrl: '',
      },
    ].filter((item) => item.title || item.description || item.imageUrl || item.mobileImageUrl);
    const normalizedHeroSlides = Array.isArray(normalized.content.home.heroSlides)
      ? normalized.content.home.heroSlides
          .map((item) => ({
            title: String(item?.title || '').trim(),
            description: String(item?.description || '').trim(),
            imageUrl: String(item?.imageUrl || '').trim(),
            mobileImageUrl: String(item?.mobileImageUrl || '').trim(),
            linkUrl: String(item?.linkUrl || '').trim(),
          }))
          .filter((item) => item.title || item.description || item.imageUrl || item.mobileImageUrl || item.linkUrl)
      : [];
    const heroSlides =
      hasPersistedHeroSlides && normalizedHeroSlides.length > 0
        ? normalizedHeroSlides
        : fallbackHeroSlides.length > 0
          ? fallbackHeroSlides
          : normalizedHeroSlides.length > 0
            ? normalizedHeroSlides
            : defaultSiteData.content.home.heroSlides;
    const primaryHeroImageUrl = String(
      heroSlides[0]?.imageUrl || heroSlides[0]?.mobileImageUrl || normalized.content.home.heroImageUrl || '',
    ).trim();

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
            category: String(item.category || '?쇰컲'),
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

function replaceFileNameExtension(fileName: string, extension: string) {
  const safeExtension = extension.startsWith('.') ? extension : `.${extension}`;
  const index = fileName.lastIndexOf('.');

  if (index <= 0) {
    return `${fileName}${safeExtension}`;
  }

  return `${fileName.slice(0, index)}${safeExtension}`;
}

function loadImageElement(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const imageElement = new Image();
    imageElement.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(imageElement);
    };
    imageElement.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('?대?吏 ?붿퐫?⑹뿉 ?ㅽ뙣?덉뒿?덈떎.'));
    };
    imageElement.src = objectUrl;
  });
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), type, quality);
  });
}

async function optimizeImageFileForUpload(file: File) {
  const lowerType = String(file.type || '').toLowerCase();
  const isSvg = lowerType === 'image/svg+xml';
  const canOptimizeInBrowser = typeof window !== 'undefined' && typeof document !== 'undefined' && typeof URL !== 'undefined';

  if (!canOptimizeInBrowser || isSvg) {
    return {
      file,
      contentType: file.type || 'application/octet-stream',
    };
  }

  try {
    const sourceImage = await loadImageElement(file);
    const width = Math.max(1, sourceImage.naturalWidth || sourceImage.width);
    const height = Math.max(1, sourceImage.naturalHeight || sourceImage.height);
    const longestEdge = Math.max(width, height);
    const resizeRatio = longestEdge > IMAGE_UPLOAD_MAX_DIMENSION ? IMAGE_UPLOAD_MAX_DIMENSION / longestEdge : 1;
    const targetWidth = Math.max(1, Math.round(width * resizeRatio));
    const targetHeight = Math.max(1, Math.round(height * resizeRatio));

    const canvas = document.createElement('canvas');
    canvas.width = targetWidth;
    canvas.height = targetHeight;

    const context = canvas.getContext('2d');
    if (!context) {
      return {
        file,
        contentType: file.type || 'application/octet-stream',
      };
    }

    context.drawImage(sourceImage, 0, 0, targetWidth, targetHeight);

    const candidateQualities = [0.86, 0.8, 0.74, 0.68];
    let selectedBlob: Blob | null = null;

    for (const quality of candidateQualities) {
      const blob = await canvasToBlob(canvas, 'image/webp', quality);
      if (!blob) {
        continue;
      }

      if (!selectedBlob || blob.size < selectedBlob.size) {
        selectedBlob = blob;
      }

      if (blob.size <= IMAGE_UPLOAD_TARGET_BYTES) {
        selectedBlob = blob;
        break;
      }
    }

    if (!selectedBlob) {
      return {
        file,
        contentType: file.type || 'application/octet-stream',
      };
    }

    // 원본이 이미 최적화된 WebP 포맷인 경우에만 원본을 유지 (자동 WebP 변환 강제)
    const isOriginalWebp = lowerType === 'image/webp';
    const shouldKeepOriginal = isOriginalWebp && file.size <= selectedBlob.size && resizeRatio === 1;
    
    if (shouldKeepOriginal) {
      return {
        file,
        contentType: file.type || 'application/octet-stream',
      };
    }

    const compressedFileName = replaceFileNameExtension(sanitizeFileName(file.name || 'image'), '.webp');
    const optimizedFile = new File([selectedBlob], compressedFileName, {
      type: 'image/webp',
      lastModified: Date.now(),
    });

    return {
      file: optimizedFile,
      contentType: optimizedFile.type,
    };
  } catch {
    return {
      file,
      contentType: file.type || 'application/octet-stream',
    };
  }
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
  const profile = await getApprovedAdminProfileForUpload(user);
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
  const profile = await getApprovedAdminProfileForUpload(user);
  assertApprovedAdminProfile(profile);

  if (!file) {
    throw new Error('업로드할 이미지 파일을 선택해 주세요.');
  }

  if (!file.type.startsWith('image/')) {
    throw new Error('이미지 파일만 업로드할 수 있습니다.');
  }

  try {
    const optimized = await optimizeImageFileForUpload(file);
    const snapshot = await uploadAdminStorageObject(user, page, optimized.file, optimized.contentType);
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
    throw new Error('愿由ъ옄 ?몄쬆???꾩슂?⑸땲??');
  }
  const profile = await getApprovedAdminProfileForUpload(user);
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

    throw new Error(mapFirebaseStorageError(error, '?대?吏 ??젣???ㅽ뙣?덉뒿?덈떎.'));
  }
}


