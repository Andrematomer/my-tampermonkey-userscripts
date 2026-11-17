// ==UserScript==
// @name         Video Auto-Pause on Tab Switch
// @namespace    https://github.com/Andrematomer/my-tampermonkey-userscripts
// @version      1.0.0
// @description  Pauses playing videos when you leave the tab and resumes only those it paused when you come back.
// @author       Vinsensius Andre Wijaya
// @license      MIT
// @match        *://*/*
// @run-at       document-idle
// @grant        none
// @homepageURL  https://github.com/Andrematomer/my-tampermonkey-userscripts
// @updateURL    https://raw.githubusercontent.com/Andrematomer/my-tampermonkey-userscripts/main/video-auto-pause.user.js
// @downloadURL  https://raw.githubusercontent.com/Andrematomer/my-tampermonkey-userscripts/main/video-auto-pause.user.js
// ==/UserScript==

(() => {
  'use strict';

  // Sites where you WANT playback to continue in the background (music players).
  // Matches the host itself and any subdomain.
  const EXCLUDE_HOSTS = [
    'music.youtube.com',
  ];

  const host = location.hostname;
  if (EXCLUDE_HOSTS.some((h) => host === h || host.endsWith('.' + h))) return;

  // Videos this script paused, so we never resume something the user paused themselves.
  const pausedByUs = new Set();

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      document.querySelectorAll('video').forEach((v) => {
        if (v.paused || v.ended) return;
        if (v === document.pictureInPictureElement) return; // PiP is meant to keep playing
        pausedByUs.add(v);
        v.pause();
      });
    } else {
      pausedByUs.forEach((v) => {
        if (v.isConnected && v.paused && !v.ended) {
          const p = v.play();
          if (p && typeof p.catch === 'function') p.catch(() => { /* autoplay policy: ignore */ });
        }
      });
      pausedByUs.clear();
    }
  });
})();
