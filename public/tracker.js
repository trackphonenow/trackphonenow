/**
 * TrackPhoneNow - Unblockable Local Attribution & Real-Time Traffic Tracker
 * Pure First-Party Analytics - 0% AdBlock Loss, 100% Exact Visitor Attribution
 */
(function() {
  'use strict';

  // Do not track internal admin panel pages
  if (window.location.pathname.startsWith('/admin')) return;

  function initTracker() {
    try {
      // 1. Unique Anonymous Session / Visitor Identifier
      let vid = localStorage.getItem('tpn_vid');
      if (!vid) {
        vid = 'v_' + Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
        localStorage.setItem('tpn_vid', vid);
      }

      // 2. Prevent rapid duplicate pageview spam (5-second debounce per URL)
      const lastPingKey = 'tpn_last_ping_' + window.location.pathname;
      const lastPing = parseInt(sessionStorage.getItem(lastPingKey) || '0', 10);
      const now = Date.now();
      if (now - lastPing < 4000) return;
      sessionStorage.setItem(lastPingKey, now.toString());

      // 3. Collect Attribution Parameters
      const currentUrl = new URL(window.location.href);
      const referrer = document.referrer || '';
      const utmSource = currentUrl.searchParams.get('utm_source') || '';
      const utmMedium = currentUrl.searchParams.get('utm_medium') || '';
      const utmCampaign = currentUrl.searchParams.get('utm_campaign') || '';

      const payload = {
        sessionId: vid,
        referrer: referrer,
        landingPage: window.location.pathname + window.location.search,
        screenWidth: window.innerWidth || screen.width || 0,
        screenHeight: window.innerHeight || screen.height || 0,
        utmSource: utmSource,
        utmMedium: utmMedium,
        utmCampaign: utmCampaign,
        title: document.title || '',
        tz: Intl.DateTimeFormat().resolvedOptions().timeZone || ''
      };

      const dataStr = JSON.stringify(payload);

      // 4. Send via Beacon or keepalive Fetch
      if (navigator.sendBeacon) {
        const blob = new Blob([dataStr], { type: 'application/json' });
        navigator.sendBeacon('/api/track-visitor', blob);
      } else {
        fetch('/api/track-visitor', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: dataStr,
          keepalive: true
        }).catch(function() {});
      }
    } catch (e) {
      // Silent fail
    }
  }

  // Trigger when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTracker);
  } else {
    initTracker();
  }

  // Global helper for custom conversion tracking
  window.tpnTrackEvent = function(eventName, extraData) {
    try {
      const vid = localStorage.getItem('tpn_vid') || 'v_anon';
      const payload = {
        sessionId: vid,
        event: eventName,
        landingPage: window.location.pathname,
        extra: extraData || {}
      };
      if (navigator.sendBeacon) {
        navigator.sendBeacon('/api/track-event', new Blob([JSON.stringify(payload)], { type: 'application/json' }));
      }
    } catch (e) {}
  };
})();
