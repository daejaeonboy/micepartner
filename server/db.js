import Database from 'better-sqlite3';
import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { defaultSiteCopy } from './defaultSiteCopy.js';
import { defaultSiteContent } from './defaultSiteContent.js';

const defaultDbPath = path.resolve(process.cwd(), process.env.DB_PATH || 'data/micepartner.sqlite');
mkdirSync(path.dirname(defaultDbPath), { recursive: true });

const db = new Database(defaultDbPath);
db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS inquiries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    organization_name TEXT NOT NULL,
    contact_name TEXT NOT NULL,
    email TEXT NOT NULL,
    event_date TEXT NOT NULL DEFAULT '',
    message TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'new',
    notes TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS site_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS admin_users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL DEFAULT '',
    provider TEXT NOT NULL DEFAULT 'password',
    google_sub TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS admin_sessions (
    token TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL,
    created_at TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    FOREIGN KEY(user_id) REFERENCES admin_users(id) ON DELETE CASCADE
  );
`);

const existingSiteCopy = db
  .prepare(`
    SELECT value
    FROM site_settings
    WHERE key = 'site_copy'
  `)
  .get();

const existingSiteData = db
  .prepare(`
    SELECT value
    FROM site_settings
    WHERE key = 'site_data'
  `)
  .get();

if (!existingSiteCopy) {
  db.prepare(`
    INSERT INTO site_settings (key, value, updated_at)
    VALUES ('site_copy', @value, @updatedAt)
  `).run({
    value: JSON.stringify(defaultSiteCopy),
    updatedAt: new Date().toISOString(),
  });
}

if (!existingSiteData) {
  let copy = defaultSiteCopy;

  if (existingSiteCopy) {
    try {
      copy = JSON.parse(existingSiteCopy.value);
    } catch {
      copy = defaultSiteCopy;
    }
  }

  db.prepare(`
    INSERT INTO site_settings (key, value, updated_at)
    VALUES ('site_data', @value, @updatedAt)
  `).run({
    value: JSON.stringify({
      copy,
      content: defaultSiteContent,
    }),
    updatedAt: new Date().toISOString(),
  });
}

const listStmt = db.prepare(`
  SELECT
    id,
    organization_name AS organizationName,
    contact_name AS contactName,
    email,
    event_date AS eventDate,
    message,
    status,
    notes,
    created_at AS createdAt
  FROM inquiries
  ORDER BY datetime(created_at) DESC, id DESC
`);

const createStmt = db.prepare(`
  INSERT INTO inquiries (
    organization_name,
    contact_name,
    email,
    event_date,
    message,
    status,
    notes,
    created_at
  ) VALUES (
    @organizationName,
    @contactName,
    @email,
    @eventDate,
    @message,
    'new',
    '',
    @createdAt
  )
`);

const getByIdStmt = db.prepare(`
  SELECT
    id,
    organization_name AS organizationName,
    contact_name AS contactName,
    email,
    event_date AS eventDate,
    message,
    status,
    notes,
    created_at AS createdAt
  FROM inquiries
  WHERE id = ?
`);

const updateStmt = db.prepare(`
  UPDATE inquiries
  SET status = @status, notes = @notes
  WHERE id = @id
`);

const getSiteCopyStmt = db.prepare(`
  SELECT value
  FROM site_settings
  WHERE key = 'site_copy'
`);

const saveSiteCopyStmt = db.prepare(`
  INSERT INTO site_settings (key, value, updated_at)
  VALUES ('site_copy', @value, @updatedAt)
  ON CONFLICT(key) DO UPDATE SET
    value = excluded.value,
    updated_at = excluded.updated_at
`);

const getSiteDataStmt = db.prepare(`
  SELECT value
  FROM site_settings
  WHERE key = 'site_data'
`);

const saveSiteDataStmt = db.prepare(`
  INSERT INTO site_settings (key, value, updated_at)
  VALUES ('site_data', @value, @updatedAt)
  ON CONFLICT(key) DO UPDATE SET
    value = excluded.value,
    updated_at = excluded.updated_at
`);

const getAdminUserByEmailStmt = db.prepare(`
  SELECT
    id,
    name,
    email,
    password_hash AS passwordHash,
    provider,
    google_sub AS googleSub,
    created_at AS createdAt
  FROM admin_users
  WHERE email = ?
`);

const getAdminUserByGoogleSubStmt = db.prepare(`
  SELECT
    id,
    name,
    email,
    password_hash AS passwordHash,
    provider,
    google_sub AS googleSub,
    created_at AS createdAt
  FROM admin_users
  WHERE google_sub = ?
`);

const getAdminUserByIdStmt = db.prepare(`
  SELECT
    id,
    name,
    email,
    password_hash AS passwordHash,
    provider,
    google_sub AS googleSub,
    created_at AS createdAt
  FROM admin_users
  WHERE id = ?
`);

const createAdminUserStmt = db.prepare(`
  INSERT INTO admin_users (name, email, password_hash, provider, google_sub, created_at)
  VALUES (@name, @email, @passwordHash, @provider, @googleSub, @createdAt)
`);

const updateAdminUserGoogleStmt = db.prepare(`
  UPDATE admin_users
  SET
    name = @name,
    provider = @provider,
    google_sub = @googleSub
  WHERE id = @id
`);

const createAdminSessionStmt = db.prepare(`
  INSERT INTO admin_sessions (token, user_id, created_at, expires_at)
  VALUES (@token, @userId, @createdAt, @expiresAt)
`);

const getSessionUserStmt = db.prepare(`
  SELECT
    u.id,
    u.name,
    u.email,
    u.provider,
    u.created_at AS createdAt
  FROM admin_sessions s
  JOIN admin_users u ON u.id = s.user_id
  WHERE s.token = @token
    AND datetime(s.expires_at) > datetime('now')
`);

const deleteAdminSessionStmt = db.prepare(`
  DELETE FROM admin_sessions
  WHERE token = ?
`);

function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const hashed = scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hashed}`;
}

function verifyPassword(password, storedHash) {
  if (!storedHash || !storedHash.includes(':')) {
    return false;
  }

  const [salt, originalHash] = storedHash.split(':');
  const passwordHash = scryptSync(password, salt, 64);
  const originalBuffer = Buffer.from(originalHash, 'hex');

  if (passwordHash.length !== originalBuffer.length) {
    return false;
  }

  return timingSafeEqual(passwordHash, originalBuffer);
}

function sanitizeAdminUser(user) {
  if (!user) {
    return null;
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    provider: user.provider === 'google' ? 'google' : 'password',
    createdAt: user.createdAt,
  };
}

export const inquiryRepository = {
  list() {
    return listStmt.all();
  },
  create(input) {
    const createdAt = new Date().toISOString();
    const result = createStmt.run({
      ...input,
      eventDate: input.eventDate || '',
      createdAt,
    });

    return this.getById(Number(result.lastInsertRowid));
  },
  getById(id) {
    return getByIdStmt.get(id);
  },
  update(id, input) {
    updateStmt.run({ id, ...input });
    return this.getById(id);
  },
};

export const siteContentRepository = {
  get() {
    const row = getSiteCopyStmt.get();

    if (!row) {
      return defaultSiteCopy;
    }

    try {
      return JSON.parse(row.value);
    } catch {
      return defaultSiteCopy;
    }
  },
  save(input) {
    saveSiteCopyStmt.run({
      value: JSON.stringify(input),
      updatedAt: new Date().toISOString(),
    });

    return this.get();
  },
};

export const siteDataRepository = {
  get() {
    const row = getSiteDataStmt.get();

    if (!row) {
      return {
        copy: defaultSiteCopy,
        content: defaultSiteContent,
      };
    }

    try {
      const parsed = JSON.parse(row.value);
      return {
        copy: parsed.copy || defaultSiteCopy,
        content: parsed.content || defaultSiteContent,
      };
    } catch {
      return {
        copy: defaultSiteCopy,
        content: defaultSiteContent,
      };
    }
  },
  save(input) {
    saveSiteDataStmt.run({
      value: JSON.stringify(input),
      updatedAt: new Date().toISOString(),
    });

    return this.get();
  },
};

export const adminRepository = {
  getByEmail(email) {
    return getAdminUserByEmailStmt.get(email);
  },
  getByGoogleSub(googleSub) {
    return getAdminUserByGoogleSubStmt.get(googleSub);
  },
  getById(id) {
    return getAdminUserByIdStmt.get(id);
  },
  createPasswordUser({ name, email, password }) {
    const createdAt = new Date().toISOString();
    const result = createAdminUserStmt.run({
      name,
      email,
      passwordHash: hashPassword(password),
      provider: 'password',
      googleSub: '',
      createdAt,
    });

    return sanitizeAdminUser(this.getById(Number(result.lastInsertRowid)));
  },
  verifyPasswordUser(email, password) {
    const user = this.getByEmail(email);

    if (!user || !verifyPassword(password, user.passwordHash)) {
      return null;
    }

    return sanitizeAdminUser(user);
  },
  createOrUpdateGoogleUser({ name, email, googleSub }) {
    const existingByGoogle = this.getByGoogleSub(googleSub);
    if (existingByGoogle) {
      return sanitizeAdminUser(existingByGoogle);
    }

    const existingByEmail = this.getByEmail(email);

    if (existingByEmail) {
      updateAdminUserGoogleStmt.run({
        id: existingByEmail.id,
        name: name || existingByEmail.name,
        provider: 'google',
        googleSub,
      });

      return sanitizeAdminUser(this.getById(existingByEmail.id));
    }

    const createdAt = new Date().toISOString();
    const result = createAdminUserStmt.run({
      name,
      email,
      passwordHash: '',
      provider: 'google',
      googleSub,
      createdAt,
    });

    return sanitizeAdminUser(this.getById(Number(result.lastInsertRowid)));
  },
  createSession(userId) {
    const token = randomBytes(32).toString('hex');
    const createdAt = new Date().toISOString();
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString();

    createAdminSessionStmt.run({
      token,
      userId,
      createdAt,
      expiresAt,
    });

    return token;
  },
  getSessionUser(token) {
    return getSessionUserStmt.get({ token }) || null;
  },
  deleteSession(token) {
    deleteAdminSessionStmt.run(token);
  },
};
