// ==UserScript==
// @name         Mindful Reflection Overlay
// @namespace    https://github.com/Andrematomer/my-tampermonkey-userscripts
// @version      1.0.0
// @description  Forces a 20-second pause before you use distracting sites. Edit the SITES list at the top of the script.
// @author       Vinsensius Andre Wijaya
// @license      MIT
// @match        *://*/*
// @run-at       document-start
// @grant        none
// @noframes
// @homepageURL  https://github.com/Andrematomer/my-tampermonkey-userscripts
// @updateURL    https://raw.githubusercontent.com/Andrematomer/my-tampermonkey-userscripts/main/mindful-reflection-overlay.user.js
// @downloadURL  https://raw.githubusercontent.com/Andrematomer/my-tampermonkey-userscripts/main/mindful-reflection-overlay.user.js
// ==/UserScript==

(() => {
  'use strict';

  /* ======================= EDIT ME ======================= *
   * One pattern per line, Tampermonkey @match style:
   *   scheme://host/path     (* is a wildcard)
   *   '*://*.reddit.com/*'   -> reddit.com and every subdomain, every page
   *   '*://*.youtube.com/'   -> ONLY the YouTube home page (path is exactly "/")
   * Query strings and #hashes are ignored when matching.
   * This list is the single source of truth. The @match above is
   * intentionally broad so you never have to edit two places.
   * ======================================================= */
  const SITES = [
    '*://*.youtube.com/',   // home page only, videos stay unblocked
    '*://*.reddit.com/*',
    '*://*.x.com/*',
  ];

  const COUNTDOWN_SECONDS = 20;
  const GRACE_MINUTES = 5;
  /* ======================================================= */

  const GRACE_MS = GRACE_MINUTES * 60 * 1000;
  const STORAGE_PREFIX = 'mindful-overlay:grace:';

  // ---------- pattern matching ----------
  const escapeRe = (s) => s.replace(/[.+?^${}()|[\]\\]/g, '\\$&');

  function patternToRegExp(pattern) {
    const m = pattern.match(/^(\*|https?):\/\/([^/]+)(\/.*)$/);
    if (!m) return null;
    const [, scheme, host, path] = m;
    const schemeRe = scheme === '*' ? 'https?' : scheme;
    let hostRe;
    if (host === '*') hostRe = '[^/]+';
    else if (host.startsWith('*.')) hostRe = '(?:[^/]+\\.)?' + escapeRe(host.slice(2));
    else hostRe = escapeRe(host);
    const pathRe = escapeRe(path).replace(/\*/g, '.*');
    return new RegExp(`^${schemeRe}://${hostRe}${pathRe}$`);
  }

  const MATCHERS = SITES.map(patternToRegExp).filter(Boolean);

  function isBlockedHere() {
    const url = `${location.protocol}//${location.hostname}${location.pathname}`;
    return MATCHERS.some((re) => re.test(url));
  }

  // ---------- grace period (per domain, localStorage) ----------
  const siteName = () => location.hostname.replace(/^(www|m|mobile|old|new)\./, '');
  const graceKey = () => STORAGE_PREFIX + siteName();

  function inGracePeriod() {
    try {
      const t = Number(localStorage.getItem(graceKey()));
      const age = Date.now() - t;
      return t > 0 && age >= 0 && age < GRACE_MS;
    } catch {
      return false;
    }
  }

  function startGracePeriod() {
    try {
      localStorage.setItem(graceKey(), String(Date.now()));
    } catch {
      /* storage blocked: overlay will simply show again next time */
    }
  }

  // ---------- overlay ----------
  let host = null;
  let tickTimer = null;
  let prevOverflow = '';

  const stopMedia = () => {
    document.querySelectorAll('video, audio').forEach((m) => {
      try { m.pause(); } catch { /* ignore */ }
    });
  };
  const onMediaPlay = (e) => {
    if (e.target && typeof e.target.pause === 'function') e.target.pause();
  };
  // Swallow site hotkeys (j/k on X, etc.) while the overlay is up.
  const onKeyDown = (e) => {
    if (e.key === 'Tab' || e.key === 'Enter' || e.key === ' ') return;
    e.stopImmediatePropagation();
  };

  const CSS = `
    :host { all: initial; }
    .wrap {
      position: fixed; inset: 0; box-sizing: border-box;
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      gap: 22px; padding: 24px; text-align: center;
      background: #0b0d10; color: #e8eaed;
      font: 16px/1.5 system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
    }
    h1 { margin: 0; max-width: 28em; font-size: clamp(22px, 4vw, 34px); font-weight: 600; }
    h1 b { color: #8ab4f8; font-weight: 600; }
    .count { font-size: clamp(64px, 14vw, 120px); font-weight: 200; font-variant-numeric: tabular-nums; }
    .bar { width: min(360px, 80vw); height: 4px; border-radius: 2px; background: #23272d; overflow: hidden; }
    .bar > i { display: block; height: 100%; width: 0; background: #8ab4f8; transition: width .25s linear; }
    .row { display: flex; flex-wrap: wrap; gap: 12px; justify-content: center; }
    button {
      font: inherit; padding: 10px 20px; border-radius: 8px; cursor: pointer;
      border: 1px solid #3c4043; background: #1b1e23; color: #e8eaed;
    }
    button:hover:not(:disabled) { background: #262a31; }
    button:disabled { opacity: .35; cursor: not-allowed; }
    button.primary:not(:disabled) { border-color: #8ab4f8; color: #8ab4f8; }
  `;

  function showOverlay() {
    if (host) return;

    host = document.createElement('div');
    host.style.cssText =
      'all: initial; position: fixed; inset: 0; z-index: 2147483647; display: block;';
    const root = host.attachShadow({ mode: 'closed' });

    const style = document.createElement('style');
    style.textContent = CSS;

    const wrap = document.createElement('div');
    wrap.className = 'wrap';
    wrap.setAttribute('role', 'dialog');
    wrap.setAttribute('aria-modal', 'true');

    const title = document.createElement('h1');
    title.append('Take a breath. Do you really need to be on ');
    const name = document.createElement('b');
    name.textContent = siteName();
    title.append(name, ' right now?');

    const count = document.createElement('div');
    count.className = 'count';
    count.textContent = String(COUNTDOWN_SECONDS);

    const bar = document.createElement('div');
    bar.className = 'bar';
    const fill = document.createElement('i');
    bar.append(fill);

    const row = document.createElement('div');
    row.className = 'row';

    const confirmBtn = document.createElement('button');
    confirmBtn.className = 'primary';
    confirmBtn.textContent = 'I really need to use this site';
    confirmBtn.disabled = true;

    const closeBtn = document.createElement('button');
    closeBtn.textContent = 'Close Tab';

    row.append(confirmBtn, closeBtn);
    wrap.append(title, count, bar, row);
    root.append(style, wrap);

    // Lock page scrolling and pause anything already playing.
    prevOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    stopMedia();
    document.addEventListener('play', onMediaPlay, true);
    window.addEventListener('keydown', onKeyDown, true);
    if (document.activeElement && document.activeElement.blur) document.activeElement.blur();

    document.documentElement.appendChild(host);

    // Countdown only advances while the tab is visible.
    let remaining = COUNTDOWN_SECONDS;
    let last = performance.now();
    tickTimer = setInterval(() => {
      const now = performance.now();
      if (!document.hidden) remaining = Math.max(0, remaining - (now - last) / 1000);
      last = now;
      count.textContent = String(Math.ceil(remaining));
      fill.style.width = `${(1 - remaining / COUNTDOWN_SECONDS) * 100}%`;
      if (remaining <= 0) {
        clearInterval(tickTimer);
        tickTimer = null;
        count.textContent = '0';
        confirmBtn.disabled = false;
        confirmBtn.focus();
      }
    }, 250);

    confirmBtn.addEventListener('click', () => {
      if (confirmBtn.disabled) return;
      startGracePeriod();
      hideOverlay();
    });

    closeBtn.addEventListener('click', () => {
      window.close(); // only works for tabs a script opened
      setTimeout(() => location.replace('about:blank'), 150);
    });
  }

  function hideOverlay() {
    if (!host) return;
    clearInterval(tickTimer);
    tickTimer = null;
    document.removeEventListener('play', onMediaPlay, true);
    window.removeEventListener('keydown', onKeyDown, true);
    document.documentElement.style.overflow = prevOverflow;
    host.remove();
    host = null;
  }

  function check() {
    if (isBlockedHere() && !inGracePeriod()) showOverlay();
    else hideOverlay();
  }

  // If the page strips our element, put it back (until the user confirms).
  new MutationObserver(() => {
    if (host && !host.isConnected) document.documentElement.appendChild(host);
  }).observe(document, { childList: true, subtree: false });

  // ---------- SPA navigation (YouTube/Reddit/X don't reload between pages) ----------
  if (!window.__mindfulNavHooked) {
    window.__mindfulNavHooked = true;
    for (const fn of ['pushState', 'replaceState']) {
      const orig = history[fn];
      history[fn] = function (...args) {
        const ret = orig.apply(this, args);
        window.dispatchEvent(new Event('mindful:navigate'));
        return ret;
      };
    }
  }
  window.addEventListener('mindful:navigate', check);
  window.addEventListener('popstate', check);
  window.addEventListener('hashchange', check);
  window.addEventListener('yt-navigate-finish', check);
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) check(); // re-check after grace may have expired
  });

  check();
})();
