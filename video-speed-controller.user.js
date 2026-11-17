// ==UserScript==
// @name         Video Speed Controller
// @namespace    https://github.com/Andrematomer/my-tampermonkey-userscripts
// @version      1.0.0
// @description  D = faster (+0.1x), A = slower (-0.1x), S = reset to 1.0x on any HTML5 video.
// @author       Vinsensius Andre Wijaya
// @license      MIT
// @match        *://*/*
// @run-at       document-idle
// @grant        none
// @homepageURL  https://github.com/Andrematomer/my-tampermonkey-userscripts
// @updateURL    https://raw.githubusercontent.com/Andrematomer/my-tampermonkey-userscripts/main/video-speed-controller.user.js
// @downloadURL  https://raw.githubusercontent.com/Andrematomer/my-tampermonkey-userscripts/main/video-speed-controller.user.js
// ==/UserScript==

(() => {
  'use strict';

  const STEP = 0.1;
  const MIN = 0.1;
  const MAX = 16;
  const INDICATOR_MS = 800;

  const round1 = (n) => Math.round(n * 10) / 10;
  const clamp = (n) => Math.min(MAX, Math.max(MIN, round1(n)));

  // ---- never hijack typing ----
  function isTypingTarget(el) {
    if (!el || el.nodeType !== 1) return false;
    const tag = el.tagName;
    return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || el.isContentEditable;
  }

  function typingInProgress(e) {
    if (isTypingTarget(e.composedPath ? e.composedPath()[0] : e.target)) return true;
    let el = document.activeElement;
    while (el && el.shadowRoot && el.shadowRoot.activeElement) el = el.shadowRoot.activeElement;
    return isTypingTarget(el);
  }

  // ---- choose which video to control: playing > biggest on screen > first ----
  function pickVideo() {
    const videos = Array.from(document.querySelectorAll('video'));
    if (!videos.length) return null;
    const area = (v) => {
      const r = v.getBoundingClientRect();
      return Math.max(0, r.width) * Math.max(0, r.height);
    };
    const bySize = (a, b) => area(b) - area(a);
    const playing = videos.filter((v) => !v.paused && !v.ended).sort(bySize);
    if (playing.length) return playing[0];
    const visible = videos.filter((v) => area(v) > 0).sort(bySize);
    return visible[0] || videos[0];
  }

  // ---- on-screen indicator ----
  let badge = null;
  let fadeTimer = null;

  function showBadge(video, text) {
    if (!badge) {
      badge = document.createElement('div');
      badge.style.cssText = [
        'all: initial', 'position: fixed', 'z-index: 2147483647', 'pointer-events: none',
        'padding: 6px 12px', 'border-radius: 6px', 'background: rgba(0,0,0,.72)', 'color: #fff',
        'font: 600 20px/1.2 system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
        'font-variant-numeric: tabular-nums', 'opacity: 0',
      ].join(';');
    }
    // In fullscreen only the fullscreen element's subtree is visible.
    const parent = document.fullscreenElement || document.documentElement;
    if (badge.parentNode !== parent) parent.appendChild(badge);

    const r = video.getBoundingClientRect();
    const inView = r.width > 0 && r.height > 0;
    badge.style.left = `${Math.max(8, inView ? r.left + 16 : 16)}px`;
    badge.style.top = `${Math.max(8, inView ? r.top + 16 : 16)}px`;
    badge.textContent = text;

    clearTimeout(fadeTimer);
    badge.style.transition = 'none';
    badge.style.opacity = '1';
    fadeTimer = setTimeout(() => {
      badge.style.transition = 'opacity .25s ease';
      badge.style.opacity = '0';
    }, INDICATOR_MS);
  }

  // ---- hotkeys (by physical key position, so they work on any keyboard layout) ----
  function onKeyDown(e) {
    if (e.ctrlKey || e.altKey || e.metaKey || e.shiftKey || e.isComposing) return;
    if (e.code !== 'KeyD' && e.code !== 'KeyA' && e.code !== 'KeyS') return;
    if (typingInProgress(e)) return;

    const video = pickVideo();
    if (!video) return;

    let rate = video.playbackRate;
    if (e.code === 'KeyD') rate += STEP;
    else if (e.code === 'KeyA') rate -= STEP;
    else rate = 1;

    rate = clamp(rate);
    video.playbackRate = rate;
    showBadge(video, `${rate.toFixed(1)}x`);
  }

  window.addEventListener('keydown', onKeyDown, true);
})();
