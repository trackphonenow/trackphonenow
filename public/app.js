/**
 * TrackPhoneNow - Core Client Logic & Cellular Geolocation
 */

// --- 1. Audio Alerts (Web Audio API) ---
let audioCtx = null;
let soundEnabled = true;

function initAudio() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
}

function playSound(type) {
  if (!soundEnabled) return;
  try {
    initAudio();
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    const now = audioCtx.currentTime;

    if (type === 'beep') {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, now);
      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.12);
    } else if (type === 'radar') {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(520, now);
      osc.frequency.exponentialRampToValueAtTime(1040, now + 0.18);
      gain.gain.setValueAtTime(0.03, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.22);
    } else if (type === 'locked') {
      [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.08);
        gain.gain.setValueAtTime(0.06, now + i * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.6);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now + i * 0.08);
        osc.stop(now + 0.6);
      });
    }
  } catch (e) {
    console.warn('Audio not allowed yet:', e);
  }
}

// --- 2. Live Radar Canvas (Hero iPhone Screen) ---
function initHeroRadar() {
  const canvas = document.getElementById('radarCanvasHero');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let angle = 0;
  const blips = [
    { distance: 0.35, angle: 0.8, alpha: 0.9 },
    { distance: 0.62, angle: 2.2, alpha: 0.75 },
    { distance: 0.85, angle: 4.2, alpha: 0.8 }
  ];

  function draw() {
    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = width / 2 - 8;

    ctx.clearRect(0, 0, width, height);

    // Background circle
    ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.fill();

    // Concentric grid circles
    for (let r = 1; r <= 3; r++) {
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.25)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(centerX, centerY, (radius / 3) * r, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Crosshairs
    ctx.strokeStyle = 'rgba(16, 185, 129, 0.2)';
    ctx.beginPath();
    ctx.moveTo(centerX - radius, centerY);
    ctx.lineTo(centerX + radius, centerY);
    ctx.moveTo(centerX, centerY - radius);
    ctx.lineTo(centerX, centerY + radius);
    ctx.stroke();

    // Radar Sweep Beam
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(angle);
    const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, radius);
    grad.addColorStop(0, 'rgba(16, 185, 129, 0.5)');
    grad.addColorStop(1, 'rgba(16, 185, 129, 0.0)');

    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, radius, 0, -Math.PI / 4, true);
    ctx.closePath();
    ctx.fillStyle = 'rgba(16, 185, 129, 0.15)';
    ctx.fill();

    // Sweep line
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(radius, 0);
    ctx.stroke();
    ctx.restore();

    // Draw blips
    blips.forEach(b => {
      const bx = centerX + Math.cos(b.angle) * (radius * b.distance);
      const by = centerY + Math.sin(b.angle) * (radius * b.distance);
      
      const diff = Math.abs((angle % (Math.PI * 2)) - (b.angle % (Math.PI * 2)));
      if (diff < 0.05) {
        b.alpha = 1.0;
        playSound('beep');
      } else {
        b.alpha = Math.max(0.2, b.alpha - 0.005);
      }

      ctx.fillStyle = `rgba(16, 185, 129, ${b.alpha})`;
      ctx.beginPath();
      ctx.arc(bx, by, 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = `rgba(56, 189, 248, ${b.alpha * 0.7})`;
      ctx.beginPath();
      ctx.arc(bx, by, 7 * (1 - b.alpha + 0.2), 0, Math.PI * 2);
      ctx.stroke();
    });

    angle += 0.025;
    requestAnimationFrame(draw);
  }

  draw();
}

// --- 3. Country & Carrier Real-Time Detection ---
const countryList = [
  { code: 'us', dial: '+1', name: 'United States', placeholder: '(555) 019-2834' },
  { code: 'gb', dial: '+44', name: 'United Kingdom', placeholder: '7911 123456' },
  { code: 'ca', dial: '+1', name: 'Canada', placeholder: '(555) 019-2834' },
  { code: 'fr', dial: '+33', name: 'France', placeholder: '6 12 34 56 78' },
  { code: 'de', dial: '+49', name: 'Germany', placeholder: '151 23456789' },
  { code: 'es', dial: '+34', name: 'Spain', placeholder: '612 345 678' },
  { code: 'it', dial: '+39', name: 'Italy', placeholder: '312 345 6789' },
  { code: 'be', dial: '+32', name: 'Belgium', placeholder: '470 12 34 56' },
  { code: 'nl', dial: '+31', name: 'Netherlands', placeholder: '6 12345678' },
  { code: 'sa', dial: '+966', name: 'Saudi Arabia', placeholder: '50 123 4567' },
  { code: 'ae', dial: '+971', name: 'United Arab Emirates', placeholder: '50 123 4567' },
  { code: 'qa', dial: '+974', name: 'Qatar', placeholder: '3312 3456' },
  { code: 'kw', dial: '+965', name: 'Kuwait', placeholder: '5123 4567' },
  { code: 'om', dial: '+968', name: 'Oman', placeholder: '9123 4567' },
  { code: 'bh', dial: '+973', name: 'Bahrain', placeholder: '3612 3456' },
  { code: 'dz', dial: '+213', name: 'Algeria', placeholder: '550 12 34 56' },
  { code: 'tn', dial: '+216', name: 'Tunisia', placeholder: '20 123 456' },
  { code: 'eg', dial: '+20', name: 'Egypt', placeholder: '10 1234 5678' },
  { code: 'tr', dial: '+90', name: 'Turkey', placeholder: '532 123 4567' },
  { code: 'pt', dial: '+351', name: 'Portugal', placeholder: '912 345 678' },
  { code: 'ch', dial: '+41', name: 'Switzerland', placeholder: '78 123 45 67' },
  { code: 'se', dial: '+46', name: 'Sweden', placeholder: '70 123 45 67' },
  { code: 'no', dial: '+47', name: 'Norway', placeholder: '412 34 567' },
  { code: 'dk', dial: '+45', name: 'Denmark', placeholder: '20 12 34 56' },
  { code: 'at', dial: '+43', name: 'Austria', placeholder: '664 1234567' },
  { code: 'ie', dial: '+353', name: 'Ireland', placeholder: '85 123 4567' },
  { code: 'au', dial: '+61', name: 'Australia', placeholder: '412 345 678' },
  { code: 'br', dial: '+55', name: 'Brazil', placeholder: '11 91234-5678' },
  { code: 'mx', dial: '+52', name: 'Mexico', placeholder: '55 1234 5678' },
  { code: 'in', dial: '+91', name: 'India', placeholder: '98765 43210' }
];

let currentCountry = countryList[0];
let currentDial = '+1';

function setupPhoneInputs() {
  const dropdownBtn = document.getElementById('countryDropdownBtn');
  const dropdownMenu = document.getElementById('countryDropdownMenu');
  const dropdownChevron = document.getElementById('dropdownChevron');
  const countrySearchInput = document.getElementById('countrySearchInput');
  const countryListContainer = document.getElementById('countryListContainer');
  const flagImg = document.getElementById('flagImg');
  const countryNameDisplay = document.getElementById('countryNameDisplay');
  const dialCodeDisplay = document.getElementById('dialCodeDisplay');
  const phoneInput = document.getElementById('phoneNumberInput');
  const carrierBadge = document.getElementById('carrierBadge');

  if (!phoneInput) return;

  function renderCountries(query = '') {
    if (!countryListContainer) return;
    const q = query.trim().toLowerCase();
    const filtered = countryList.filter(c => 
      c.name.toLowerCase().includes(q) || 
      c.dial.includes(q) || 
      c.code.toLowerCase().includes(q)
    );

    if (filtered.length === 0) {
      countryListContainer.innerHTML = `<div class="py-4 text-center text-xs text-slate-400">No country found</div>`;
      return;
    }

    countryListContainer.innerHTML = filtered.map(c => {
      const isSelected = c.dial === currentCountry.dial && c.name === currentCountry.name;
      return `
        <button 
          type="button" 
          class="country-opt w-full flex items-center justify-between px-3 py-2 rounded-xl text-left hover:bg-indigo-50/90 transition group cursor-pointer ${isSelected ? 'bg-indigo-50/60' : ''}"
          data-dial="${c.dial}"
          data-code="${c.code}"
          data-name="${c.name}"
          data-placeholder="${c.placeholder}"
        >
          <div class="flex items-center gap-2.5 min-w-0">
            <img src="https://flagcdn.com/w40/${c.code}.png" alt="${c.name}" class="w-5 h-3.5 object-cover rounded-xs shadow-xs border border-slate-200 flex-shrink-0" />
            <span class="text-sm font-semibold text-slate-800 group-hover:text-indigo-600 truncate">${c.name}</span>
          </div>
          <div class="flex items-center gap-2 flex-shrink-0">
            <span class="text-xs font-bold font-mono px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 group-hover:bg-indigo-100 group-hover:text-indigo-700">${c.dial}</span>
            <i class="ph-bold ph-check text-emerald-600 text-sm ${isSelected ? '' : 'invisible'}"></i>
          </div>
        </button>
      `;
    }).join('');

    countryListContainer.querySelectorAll('.country-opt').forEach(btn => {
      btn.addEventListener('click', () => {
        selectCountry({
          dial: btn.dataset.dial,
          code: btn.dataset.code,
          name: btn.dataset.name,
          placeholder: btn.dataset.placeholder
        });
      });
    });
  }

  function selectCountry(country) {
    currentCountry = country;
    currentDial = country.dial;
    sessionStorage.setItem('user_geo_country', country.code.toLowerCase());

    if (flagImg) {
      flagImg.src = `https://flagcdn.com/w40/${country.code}.png`;
      flagImg.alt = country.name;
    }
    if (countryNameDisplay) countryNameDisplay.textContent = country.name;
    if (dialCodeDisplay) dialCodeDisplay.textContent = `(${country.dial})`;
    phoneInput.placeholder = country.placeholder;

    if (dropdownMenu) dropdownMenu.classList.add('hidden');
    if (dropdownChevron) dropdownChevron.classList.remove('rotate-180');
    if (dropdownBtn) dropdownBtn.setAttribute('aria-expanded', 'false');

    renderCountries(countrySearchInput ? countrySearchInput.value : '');
    updateCarrierPreview();
  }

  // Auto-detect visitor country by IP address
  autoDetectCountry();

  async function autoDetectCountry() {
    try {
      let code = null;

      // 1. Session check
      const savedCode = sessionStorage.getItem('user_geo_country');
      if (savedCode) {
        const found = countryList.find(c => c.code.toLowerCase() === savedCode.toLowerCase());
        if (found) {
          selectCountry(found);
          return;
        }
      }

      // 2. Local backend Geo-IP endpoint
      try {
        const res = await fetch('/api/geo-ip');
        const data = await res.json();
        if (data && data.success && data.countryCode) {
          code = data.countryCode.toLowerCase();
        }
      } catch (e) {}

      // 3. Ultra-fast direct Geo-IP fallback
      if (!code) {
        try {
          const fallbackRes = await fetch('https://api.country.is/');
          const fallbackData = await fallbackRes.json();
          if (fallbackData && fallbackData.country) {
            code = fallbackData.country.toLowerCase();
          }
        } catch (e) {}
      }

      // 4. Secondary fallback
      if (!code) {
        try {
          const ipWhoRes = await fetch('https://ipwho.is/');
          const ipWhoData = await ipWhoRes.json();
          if (ipWhoData && ipWhoData.country_code) {
            code = ipWhoData.country_code.toLowerCase();
          }
        } catch (e) {}
      }

      if (code) {
        sessionStorage.setItem('user_geo_country', code);
        const match = countryList.find(c => c.code.toLowerCase() === code);
        if (match) {
          selectCountry(match);
        }
      }
    } catch (err) {}
  }

  if (dropdownBtn && dropdownMenu) {
    renderCountries();

    dropdownBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isHidden = dropdownMenu.classList.contains('hidden');
      if (isHidden) {
        dropdownMenu.classList.remove('hidden');
        if (dropdownChevron) dropdownChevron.classList.add('rotate-180');
        dropdownBtn.setAttribute('aria-expanded', 'true');
        if (countrySearchInput) {
          countrySearchInput.value = '';
          renderCountries('');
          setTimeout(() => countrySearchInput.focus(), 50);
        }
      } else {
        dropdownMenu.classList.add('hidden');
        if (dropdownChevron) dropdownChevron.classList.remove('rotate-180');
        dropdownBtn.setAttribute('aria-expanded', 'false');
      }
    });

    if (countrySearchInput) {
      countrySearchInput.addEventListener('input', (e) => {
        renderCountries(e.target.value);
      });
      countrySearchInput.addEventListener('click', (e) => e.stopPropagation());
    }

    document.addEventListener('click', (e) => {
      if (!dropdownBtn.contains(e.target) && !dropdownMenu.contains(e.target)) {
        dropdownMenu.classList.add('hidden');
        if (dropdownChevron) dropdownChevron.classList.remove('rotate-180');
        dropdownBtn.setAttribute('aria-expanded', 'false');
      }
    });
  }

  const pastePhoneBtn = document.getElementById('pastePhoneBtn');
  if (pastePhoneBtn) {
    pastePhoneBtn.addEventListener('click', async () => {
      try {
        const text = await navigator.clipboard.readText();
        if (text) {
          const cleaned = text.replace(/[^\d+]/g, '');
          phoneInput.value = cleaned;
          formatPhoneInput();
          updateCarrierPreview();
          phoneInput.focus();
        }
      } catch (err) {
        phoneInput.focus();
      }
    });
  }

  phoneInput.addEventListener('input', () => {
    formatPhoneInput();
    updateCarrierPreview();
  });

  function formatPhoneInput() {
    const raw = phoneInput.value.replace(/\D/g, '');
    if (raw.length > 3 && raw.length <= 6) {
      phoneInput.value = `${raw.slice(0, 3)} ${raw.slice(3)}`;
    } else if (raw.length > 6) {
      phoneInput.value = `${raw.slice(0, 3)} ${raw.slice(3, 6)} ${raw.slice(6, 10)}`;
    }
  }

  function updateCarrierPreview() {
    const rawVal = phoneInput.value.trim().replace(/\D/g, '');
    if (rawVal.length < 2) {
      if (carrierBadge) {
        carrierBadge.innerHTML = `<span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span> <span>Ready to locate · Enter number with or without leading 0</span>`;
      }
      return;
    }

    let carrier = `${currentCountry.name} Cellular 4G/5G`;
    if (currentDial === '+1') {
      carrier = 'Verizon / AT&T';
    } else if (currentDial === '+44') {
      carrier = 'EE / Vodafone UK';
    } else if (currentDial === '+33') {
      carrier = rawVal.startsWith('6') || rawVal.startsWith('7') ? 'Orange / SFR' : 'Bouygues Telecom';
    } else if (currentDial === '+1') {
      carrier = 'Verizon / AT&T';
    } else if (currentDial === '+44') {
      carrier = 'EE / Vodafone UK';
    } else if (currentDial === '+34') {
      carrier = 'Movistar / Vodafone ES';
    } else if (currentDial === '+49') {
      carrier = 'Deutsche Telekom / Vodafone DE';
    } else if (currentDial === '+966') {
      carrier = 'STC / Mobily';
    } else if (currentDial === '+971') {
      carrier = 'Etisalat / du';
    }

    if (carrierBadge) {
      carrierBadge.innerHTML = `<span class="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span> <span class="font-bold text-emerald-300">${carrier}</span> · <span class="text-white/80">Active Cellular Route</span>`;
    }
  }
}

// --- 4. Live Global Ticker Feed ---
async function initLiveFeed() {
  const tickerEl = document.getElementById('tickerFeed');
  if (!tickerEl) return;

  try {
    const res = await fetch('/api/live-feed');
    const data = await res.json();
    if (data.success && data.feed) {
      tickerEl.innerHTML = data.feed.map(item => `
        <div class="inline-flex items-center gap-2 bg-slate-800/80 border border-slate-700 rounded-full px-3 py-1 text-xs text-slate-300">
          <span class="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
          <span class="font-bold text-white">${item.country}</span>
          <span class="text-emerald-400 font-mono">${item.carrier}</span>
          <span class="text-slate-400 font-mono text-[11px]">${item.accuracy}</span>
          <span class="text-slate-500 text-[10px]">${item.time}</span>
        </div>
      `).join('');
    }
  } catch (err) {}
}

// --- 5. Interactive FAQ Accordion ---
function setupFaqAccordion() {
  const triggers = document.querySelectorAll('.wdes-faq-trigger, .faq-trigger');
  triggers.forEach(trigger => {
    trigger.addEventListener('click', () => {
      const item = trigger.closest('.wdes-faq-item, .faq-item');
      if (!item) return;
      const isOpen = item.classList.contains('active');
      const sign = trigger.querySelector('.wdes-faq-sign');
      const content = item.querySelector('.wdes-faq-content, .faq-answer');

      // Close all
      document.querySelectorAll('.wdes-faq-item, .faq-item').forEach(other => {
        other.classList.remove('active');
        const otherSign = other.querySelector('.wdes-faq-sign');
        if (otherSign) otherSign.textContent = '+';
        const otherContent = other.querySelector('.wdes-faq-content, .faq-answer');
        if (otherContent) {
          otherContent.style.maxHeight = '0px';
          otherContent.style.opacity = '0';
        }
      });

      if (!isOpen) {
        item.classList.add('active');
        if (sign) sign.textContent = '−';
        if (content) {
          content.style.maxHeight = '300px';
          content.style.opacity = '1';
        }
        playSound('beep');
      }
    });
  });
}

// --- 6. Realistic Phone Locator Scan Sequence ---
let currentScannedPhone = '';
let currentLookupData = null;

async function startScan() {
  const phoneInput = document.getElementById('phoneNumberInput');
  const num = phoneInput.value.trim().replace(/\D/g, '');
  if (num.length < 6) {
    phoneInput.classList.add('ring-2', 'ring-red-500');
    setTimeout(() => phoneInput.classList.remove('ring-2', 'ring-red-500'), 1500);
    return;
  }

  currentScannedPhone = currentDial + ' ' + phoneInput.value.trim();
  playSound('radar');

  const scanModal = document.getElementById('scanModal');
  scanModal.classList.remove('hidden');

  try {
    const res = await fetch('/api/lookup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: currentDial + num })
    });
    const result = await res.json();
    if (result.success) {
      currentLookupData = result.data;
    }
  } catch (e) {}

  runScanSequence();
}

function runScanSequence() {
  const steps = [
    {
      title: 'Connecting to Cellular Network...',
      detail: 'Querying carrier gateway & active cell routing...',
      progress: 25,
      delay: 1300
    },
    {
      title: 'Carrier & Network Confirmed',
      detail: `Operator: ${currentLookupData ? currentLookupData.carrier : 'Cellular Active'} | Status: Online`,
      progress: 55,
      delay: 1500
    },
    {
      title: 'Connecting to GPS Satellites...',
      detail: `Signal Strength: ${currentLookupData ? currentLookupData.rssi : '-68 dBm'} | Pinging location coordinates...`,
      progress: 80,
      delay: 1600
    },
    {
      title: 'Phone Location Found! Coordinates Ready',
      detail: 'GPS satellite match verified: Accuracy within ±3.5 meters.',
      progress: 100,
      delay: 1400
    }
  ];

  const scanTitle = document.getElementById('scanStepTitle');
  const scanDetail = document.getElementById('scanStepDetail');
  const scanBar = document.getElementById('scanProgressBar');
  const scanPercent = document.getElementById('scanPercent');
  const scanTerminal = document.getElementById('scanTerminalLogs');

  let currentStepIdx = 0;

  function nextStep() {
    if (currentStepIdx < steps.length) {
      const step = steps[currentStepIdx];
      scanTitle.textContent = step.title;
      scanDetail.textContent = step.detail;
      scanBar.style.width = `${step.progress}%`;
      scanPercent.textContent = `${step.progress}%`;

      const logLine = document.createElement('div');
      logLine.className = 'text-xs font-mono text-emerald-400 py-0.5 flex items-center space-x-2';
      logLine.innerHTML = `<span class="text-slate-500">[${new Date().toLocaleTimeString()}]</span> <span>›</span> <span class="text-slate-200">${step.title}</span>`;
      scanTerminal.appendChild(logLine);
      scanTerminal.scrollTop = scanTerminal.scrollHeight;

      playSound('beep');

      currentStepIdx++;
      setTimeout(nextStep, step.delay);
    } else {
      playSound('locked');
      setTimeout(() => {
        document.getElementById('scanModal').classList.add('hidden');
        
        const token = localStorage.getItem('authToken');
        const isRealUser = token && token !== 'tok_demo_preview';

        if (!isRealUser) {
          // Guest User: Force registration / login to save target phone & create console
          if (currentScannedPhone) {
            localStorage.setItem('pendingTargetPhone', currentScannedPhone);
          }
          window.location.href = `/auth.html?phone=${encodeURIComponent(currentScannedPhone || '')}&mode=register`;
        } else {
          // Logged in user: Show payment checkout or direct to console
          showPaywallModal();
        }
      }, 700);
    }
  }

  nextStep();
}

// --- 7. Crypto Checkout Modal & Countdown ---
const CRYPTO_CONFIG = {
  usdt_trc20: {
    id: 'usdt_trc20',
    name: 'Tether USDT (TRC-20)',
    network: 'NETWORK: TRON (TRC-20)',
    symbol: 'USDT',
    address: 'TT44hVQek5xLh7qz2FhpBdmbMziyBGyzPX',
    explorer: 'https://tronscan.org/address/TT44hVQek5xLh7qz2FhpBdmbMziyBGyzPX/transactions',
    explorerName: 'View Address on TronScan',
    amount: '24.99 USDT',
    note: 'Send only USDT via TRON (TRC20) network. Instant validation upon block confirmation.'
  },
  usdt_bep20: {
    id: 'usdt_bep20',
    name: 'Tether USDT (BEP-20)',
    network: 'NETWORK: BNB SMART CHAIN (BEP-20)',
    symbol: 'USDT',
    address: '0x35dd60066ae6337b4D0273b129c0E222235B9F8C',
    explorer: 'https://bscscan.com/token/0x55d398326f99059fF775485246999027B3197955?a=0x35dd60066ae6337b4D0273b129c0E222235B9F8C#transactions',
    explorerName: 'View Address on BscScan',
    amount: '24.99 USDT',
    note: 'Send only USDT via BNB Smart Chain (BEP20). Very low network fee.'
  },
  usdt_erc20: {
    id: 'usdt_erc20',
    name: 'Tether USDT (ERC-20)',
    network: 'NETWORK: ETHEREUM MAINNET (ERC-20)',
    symbol: 'USDT',
    address: '0x35dd60066ae6337b4D0273b129c0E222235B9F8C',
    explorer: 'https://etherscan.io/token/0xdAC17F958D2ee523a2206206994597C13D831ec7?a=0x35dd60066ae6337b4D0273b129c0E222235B9F8C#transactions',
    explorerName: 'View Address on Etherscan',
    amount: '24.99 USDT',
    note: 'Send only USDT via Ethereum (ERC-20). Verify sufficient gas for network transfer.'
  },
  btc: {
    id: 'btc',
    name: 'Bitcoin (BTC)',
    network: 'NETWORK: BITCOIN (NATIVE SEGWIT)',
    symbol: 'BTC',
    address: 'bc1q0v3g205psatdcj09ufzczahq50jusvvnlzsygu',
    explorer: 'https://mempool.space/address/bc1q0v3g205psatdcj09ufzczahq50jusvvnlzsygu',
    explorerName: 'View Address on Mempool Space',
    amount: '0.000015 BTC',
    note: 'Send native Bitcoin (BTC) to this SegWit address.'
  },
  eth: {
    id: 'eth',
    name: 'Ethereum (ETH)',
    network: 'NETWORK: ETHEREUM (ERC-20)',
    symbol: 'ETH',
    address: '0x35dd60066ae6337b4D0273b129c0E222235B9F8C',
    explorer: 'https://etherscan.io/address/0x35dd60066ae6337b4D0273b129c0E222235B9F8C',
    explorerName: 'View Address on Etherscan',
    amount: '0.00042 ETH',
    note: 'Send native ETH via Ethereum Mainnet.'
  },
  sol: {
    id: 'sol',
    name: 'Solana (SOL)',
    network: 'NETWORK: SOLANA MAINNET',
    symbol: 'SOL',
    address: 't9QLb3arVUMcQ8JALe3Ptz318GfZkzmRAXvoM8yANFe',
    explorer: 'https://solscan.io/account/t9QLb3arVUMcQ8JALe3Ptz318GfZkzmRAXvoM8yANFe',
    explorerName: 'View Address on Solscan',
    amount: '0.0075 SOL',
    note: 'Send native SOL directly via Solana Network (sub-second confirmations).'
  },
  ltc: {
    id: 'ltc',
    name: 'Litecoin (LTC)',
    network: 'NETWORK: LITECOIN NETWORK',
    symbol: 'LTC',
    address: 'LVW74nrfMVpsTY7Kd62tkzfNF5aasM7ieS',
    explorer: 'https://litecoinspace.org/address/LVW74nrfMVpsTY7Kd62tkzfNF5aasM7ieS',
    explorerName: 'View Address on LitecoinSpace',
    amount: '0.015 LTC',
    note: 'Send native LTC via Litecoin Network. Ultra-low gas fees.'
  }
};

let activeCryptoKey = 'usdt_trc20';

function selectCrypto(key) {
  const cfg = CRYPTO_CONFIG[key];
  if (!cfg) return;
  activeCryptoKey = key;

  // Update tabs highlight
  Object.keys(CRYPTO_CONFIG).forEach(k => {
    const tabBtn = document.getElementById(`tab-${k}`);
    if (tabBtn) {
      if (k === key) {
        tabBtn.className = "py-2 px-1 rounded-xl text-center transition bg-white text-emerald-700 shadow-xs border border-emerald-300 font-bold";
      } else {
        tabBtn.className = "py-2 px-1 rounded-xl text-center transition text-slate-600 hover:text-slate-900 font-bold";
      }
    }
  });

  // Update elements
  const netLabel = document.getElementById('cryptoNetworkLabel');
  const curName = document.getElementById('cryptoCurrencyName');
  const amtDisplay = document.getElementById('cryptoAmountDisplay');
  const addrInput = document.getElementById('cryptoAddressInput');
  const expLink = document.getElementById('cryptoExplorerLink');
  const expName = document.getElementById('cryptoExplorerName');
  const noteText = document.getElementById('cryptoNoteText');
  const toastMsg = document.getElementById('copyToastMsg');

  if (netLabel) netLabel.textContent = cfg.network;
  if (curName) curName.textContent = cfg.name;
  if (amtDisplay) amtDisplay.textContent = cfg.amount;
  if (addrInput) addrInput.value = cfg.address;
  if (expLink) expLink.href = cfg.explorer;
  if (expName) expName.textContent = cfg.explorerName;
  if (noteText) noteText.textContent = cfg.note;
  if (toastMsg) toastMsg.textContent = '';

  // Render QR Code
  renderCryptoQR(cfg.address);
}

function renderCryptoQR(address) {
  const qrBox = document.getElementById('cryptoQrCode');
  if (!qrBox) return;
  qrBox.innerHTML = '';
  try {
    new QRCode(qrBox, {
      text: address,
      width: 105,
      height: 105,
      colorDark: "#0f172a",
      colorLight: "#ffffff"
    });
  } catch (e) {
    qrBox.innerHTML = `<span class="text-[10px] text-slate-400 font-mono">QR Error</span>`;
  }
}

function copyCryptoAddress() {
  const input = document.getElementById('cryptoAddressInput');
  if (!input) return;
  navigator.clipboard.writeText(input.value);
  const btn = document.getElementById('copyCryptoBtn');
  const toast = document.getElementById('copyToastMsg');
  if (btn) {
    btn.innerHTML = `<i class="ph-bold ph-check text-base"></i>`;
    setTimeout(() => {
      btn.innerHTML = `<i class="ph-bold ph-copy text-base"></i>`;
    }, 2000);
  }
  if (toast) {
    toast.textContent = '✓ Copied!';
    setTimeout(() => { toast.textContent = ''; }, 2500);
  }
}

function showPaywallModal() {
  const paywallModal = document.getElementById('paywallModal');
  if (!paywallModal) return;
  paywallModal.classList.remove('hidden');

  const phoneDisp = document.getElementById('paywallPhoneDisplay');
  if (phoneDisp) phoneDisp.textContent = currentScannedPhone || 'Active Client Session';

  selectCrypto('usdt_trc20');
  startCountdown(14, 59);
}

// Pricing Section Action Handler: Check if guest or logged in
window.handlePricingAction = function(planCode = 'pro_1month') {
  const token = localStorage.getItem('authToken');
  const isRealUser = token && token !== 'tok_demo_preview';

  if (!isRealUser) {
    // Guest: send to registration with plan parameter
    const phone = currentScannedPhone || localStorage.getItem('pendingTargetPhone') || '';
    window.location.href = `/auth.html?mode=register&plan=${encodeURIComponent(planCode)}${phone ? '&phone=' + encodeURIComponent(phone) : ''}`;
  } else {
    // Authenticated member: trigger payment checkout modal
    showPaywallModal();
  }
};

function closePaywallModal() {
  const paywallModal = document.getElementById('paywallModal');
  if (paywallModal) paywallModal.classList.add('hidden');
}

let countdownInterval = null;
function startCountdown(mins, secs) {
  if (countdownInterval) clearInterval(countdownInterval);
  let totalSecs = mins * 60 + secs;
  const timerDisplay = document.getElementById('countdownTimer');

  countdownInterval = setInterval(() => {
    if (totalSecs <= 0) {
      clearInterval(countdownInterval);
      return;
    }
    totalSecs--;
    const m = Math.floor(totalSecs / 60).toString().padStart(2, '0');
    const s = (totalSecs % 60).toString().padStart(2, '0');
    if (timerDisplay) timerDisplay.textContent = `${m}:${s}`;
  }, 1000);
}

// --- 8. Confirm Crypto Payment & Unlock Target Map ---
async function handleConfirmCryptoPayment() {
  const btn = document.getElementById('confirmCryptoPaymentBtn');
  const txHash = (document.getElementById('cryptoTxHashInput')?.value || '').trim();

  if (!txHash || txHash.length < 8) {
    alert('Please enter your valid transaction hash (TXID) from your crypto wallet or exchange so our nodes can verify the blockchain confirmation.');
    document.getElementById('cryptoTxHashInput')?.focus();
    return;
  }

  btn.disabled = true;
  btn.innerHTML = `<span class="animate-spin mr-2">⚙</span> Verifying Blockchain Mempool...`;

  try {
    const token = localStorage.getItem('authToken');
    
    // Call server crypto confirmation endpoint
    const res = await fetch('/api/payment/crypto-confirm', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: JSON.stringify({
        currency: activeCryptoKey,
        txHash: txHash,
        plan: 'pro_1month',
        amount: '$24.99'
      })
    });

    const data = await res.json();
    
    if (res.ok) {
      btn.innerHTML = `✓ Payment Broadcasted! Status: PENDING`;
      btn.className = "w-full py-3.5 px-6 rounded-2xl bg-amber-600 text-white font-extrabold text-sm flex items-center justify-center gap-2";

      setTimeout(() => {
        if (!token) {
          window.location.href = `/auth.html?phone=${encodeURIComponent(currentScannedPhone || '')}&plan=pro_1month&tx=${encodeURIComponent(txHash)}`;
        } else {
          window.location.href = `/dashboard.html?tab=billing`;
        }
      }, 1000);
    } else {
      btn.disabled = false;
      btn.innerHTML = `⚠️ ${data.error || 'Verification Failed. Try Again.'}`;
      btn.className = "w-full py-3.5 px-6 rounded-2xl bg-red-600 text-white font-extrabold text-sm flex items-center justify-center gap-2";
    }

  } catch (err) {
    btn.disabled = false;
    btn.innerHTML = `⚠️ Network Error. Please Try Again.`;
    btn.className = "w-full py-3.5 px-6 rounded-2xl bg-red-600 text-white font-extrabold text-sm flex items-center justify-center gap-2";
  }
}
// --- Language Switcher Functions ---
window.toggleLangDropdown = function() {
  const menu = document.getElementById('langDropdownMenu');
  if (menu) menu.classList.toggle('hidden');
};

window.selectSiteLanguage = function(code) {
  if (window.i18n && typeof window.i18n.setLanguage === 'function') {
    window.i18n.setLanguage(code, true);
  }
  const menu = document.getElementById('langDropdownMenu');
  if (menu) menu.classList.add('hidden');
};

// Close dropdown on outside click
document.addEventListener('click', (e) => {
  const btn = document.getElementById('langDropdownBtn');
  const menu = document.getElementById('langDropdownMenu');
  if (btn && menu && !btn.contains(e.target) && !menu.contains(e.target)) {
    menu.classList.add('hidden');
  }
});

// --- 9. Initialization ---
document.addEventListener('DOMContentLoaded', () => {
  // Initialize internationalization (detect GeoIP & apply translations)
  if (window.i18n && typeof window.i18n.init === 'function') {
    window.i18n.init();
  }

  initHeroRadar();
  setupPhoneInputs();
  initLiveFeed();
  setupFaqAccordion();

  // Dynamic Auth State Navigation & Inscription Routing
  const token = localStorage.getItem('authToken');
  const isRealUser = token && token !== 'tok_demo_preview';
  const navLoginBtn = document.getElementById('navLoginBtn');
  const navRegisterBtn = document.getElementById('navRegisterBtn');
  const navConsoleBtn = document.getElementById('navConsoleBtn');
  const bottomCtaBtn = document.getElementById('bottomCtaBtn');

  if (isRealUser) {
    if (navLoginBtn) navLoginBtn.style.display = 'none';
    if (navRegisterBtn) navRegisterBtn.style.display = 'none';
    if (navConsoleBtn) navConsoleBtn.style.display = 'inline-flex';
    if (bottomCtaBtn) {
      bottomCtaBtn.textContent = 'Go To Member Console';
      bottomCtaBtn.onclick = () => { window.location.href = '/dashboard.html'; };
    }
  } else {
    // Clear legacy preview token if present so visitors aren't falsely authenticated
    if (token === 'tok_demo_preview') {
      localStorage.removeItem('authToken');
      localStorage.removeItem('authUser');
    }
    if (navLoginBtn) navLoginBtn.style.display = '';
    if (navRegisterBtn) navRegisterBtn.style.display = '';
    if (navConsoleBtn) navConsoleBtn.style.display = 'none';
    if (bottomCtaBtn) {
      bottomCtaBtn.textContent = 'Activate Pro Pass ($24.99)';
      bottomCtaBtn.onclick = () => { handlePricingAction('pro_1month'); };
    }
  }

  const soundBtn = document.getElementById('soundToggleBtn');
  if (soundBtn) {
    soundBtn.addEventListener('click', () => {
      soundEnabled = !soundEnabled;
      soundBtn.innerHTML = soundEnabled ? '🔊 Audio: ON' : '🔇 Audio: OFF';
      soundBtn.classList.toggle('text-emerald-400', soundEnabled);
      soundBtn.classList.toggle('text-slate-500', !soundEnabled);
    });
  }

  const trackBtn = document.getElementById('trackNowBtn');
  if (trackBtn) {
    trackBtn.addEventListener('click', startScan);
  }

  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('paywall') === '1' || urlParams.get('crypto') === '1') {
    currentScannedPhone = '+1 (202) 555-0143';
    showPaywallModal();
  }
});
