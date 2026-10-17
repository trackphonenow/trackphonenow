const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DATA_DIR = path.join(__dirname);
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const SESSIONS_FILE = path.join(DATA_DIR, 'sessions.json');
const TOKENS_FILE = path.join(DATA_DIR, 'tokens.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function readJSON(file, fallback) {
  try {
    if (fs.existsSync(file)) {
      const data = fs.readFileSync(file, 'utf8');
      return JSON.parse(data);
    }
  } catch (e) {
    console.error(`Error reading ${file}:`, e);
  }
  return fallback;
}

function writeJSON(file, data) {
  try {
    fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
  } catch (e) {
    console.error(`Error writing ${file}:`, e);
  }
}

// In-Memory caches backed by JSON
let users = readJSON(USERS_FILE, []);
let trackingSessions = readJSON(SESSIONS_FILE, []);
let tokens = readJSON(TOKENS_FILE, {}); // token -> { userId, expiresAt }

function hashPassword(password, salt) {
  return crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
}

// Seed Demo User if none exists
if (users.length === 0) {
  const salt = crypto.randomBytes(16).toString('hex');
  const demoUser = {
    id: 'user_demo_01',
    name: 'Karim Alaoui',
    email: 'client@trackphonenow.com',
    phone: '+212 661-234567',
    salt,
    passwordHash: hashPassword('admin123', salt),
    plan: '24h_pass', // '24h_pass', 'pro_monthly', 'canceled'
    planName: '24-Hour Express Pass ($0.99)',
    planStatus: 'active',
    planExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    autoRenew: true,
    subscriptionAmount: '$0.99',
    monthlyRenewalAmount: '$24.99',
    createdAt: new Date().toISOString()
  };
  users.push(demoUser);
  writeJSON(USERS_FILE, users);
}

// Store API Functions
const Store = {
  // Users
  createUser({ name, email, password, phone }) {
    const existing = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (existing) {
      throw new Error('An account with this email already exists.');
    }

    const salt = crypto.randomBytes(16).toString('hex');
    const passwordHash = hashPassword(password, salt);
    const id = 'usr_' + crypto.randomBytes(8).toString('hex');

    const newUser = {
      id,
      name: name || email.split('@')[0],
      email: email.toLowerCase().trim(),
      phone: phone || '',
      salt,
      passwordHash,
      plan: '24h_pass',
      planName: '24-Hour Express Pass ($0.99)',
      planStatus: 'active',
      planExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      autoRenew: true,
      subscriptionAmount: '$0.99',
      monthlyRenewalAmount: '$24.99',
      createdAt: new Date().toISOString()
    };

    users.push(newUser);
    writeJSON(USERS_FILE, users);

    const token = this.createToken(id);
    return { user: this.sanitizeUser(newUser), token };
  },

  authenticateUser({ email, password }) {
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase().trim());
    if (!user) {
      throw new Error('Invalid email or password.');
    }

    const hash = hashPassword(password, user.salt);
    if (hash !== user.passwordHash) {
      throw new Error('Invalid email or password.');
    }

    const token = this.createToken(user.id);
    return { user: this.sanitizeUser(user), token };
  },

  createToken(userId) {
    const token = 'tok_' + crypto.randomBytes(24).toString('hex');
    tokens[token] = {
      userId,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
    };
    writeJSON(TOKENS_FILE, tokens);
    return token;
  },

  getUserByToken(token) {
    if (!token) return null;
    if (token === 'tok_demo_preview') {
      const demoUser = users.find(u => u.id === 'user_demo_01') || users[0];
      return demoUser ? this.sanitizeUser(demoUser) : null;
    }
    const session = tokens[token];
    if (!session) return null;
    if (new Date(session.expiresAt) < new Date()) {
      delete tokens[token];
      writeJSON(TOKENS_FILE, tokens);
      return null;
    }
    const user = users.find(u => u.id === session.userId);
    return user ? this.sanitizeUser(user) : null;
  },

  getUserById(id) {
    const user = users.find(u => u.id === id);
    return user ? this.sanitizeUser(user) : null;
  },

  cancelSubscription(userId) {
    const user = users.find(u => u.id === userId);
    if (!user) throw new Error('User not found.');
    user.autoRenew = false;
    user.planStatus = 'canceled_at_period_end';
    writeJSON(USERS_FILE, users);
    return this.sanitizeUser(user);
  },

  sanitizeUser(user) {
    const { salt, passwordHash, ...safe } = user;
    return safe;
  },

  // Sessions (Tracked devices)
  saveSession(sessionData) {
    const idx = trackingSessions.findIndex(s => s.id === sessionData.id);
    if (idx >= 0) {
      trackingSessions[idx] = sessionData;
    } else {
      trackingSessions.unshift(sessionData);
    }
    writeJSON(SESSIONS_FILE, trackingSessions);
  },

  getSession(id) {
    return trackingSessions.find(s => s.id === id) || null;
  },

  getUserSessions(userId) {
    if (!userId) return trackingSessions;
    return trackingSessions.filter(s => s.userId === userId || s.userId === 'user_demo_01');
  },

  deleteSession(id, userId) {
    const initialLen = trackingSessions.length;
    trackingSessions = trackingSessions.filter(s => {
      if (s.id === id) {
        if (!userId || s.userId === userId || s.userId === 'user_demo_01') return false;
      }
      return true;
    });
    if (trackingSessions.length !== initialLen) {
      writeJSON(SESSIONS_FILE, trackingSessions);
      return true;
    }
    return false;
  },

  // Crypto Payments
  recordCryptoPayment({ userId, currency, txHash, plan, amount, walletAddress }) {
    const paymentId = 'pay_' + crypto.randomBytes(8).toString('hex');
    const payment = {
      id: paymentId,
      userId: userId || 'guest',
      currency,
      txHash: txHash || 'tx_pending_confirm_' + crypto.randomBytes(6).toString('hex'),
      plan: plan || '24h_pass',
      amount: amount || '$0.99',
      walletAddress,
      status: 'CONFIRMED',
      timestamp: new Date().toISOString()
    };
    const paymentsFile = path.join(DATA_DIR, 'payments.json');
    const payments = readJSON(paymentsFile, []);
    payments.unshift(payment);
    writeJSON(paymentsFile, payments);

    if (userId) {
      const user = users.find(u => u.id === userId);
      if (user) {
        user.planStatus = 'active';
        user.planExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
        writeJSON(USERS_FILE, users);
      }
    }
    return payment;
  }
};

module.exports = Store;
