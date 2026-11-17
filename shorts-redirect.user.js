// ==UserScript==
// @name         YouTube Shorts Redirect
// @namespace    https://github.com/Andrematomer/my-tampermonkey-userscripts
// @version      1.0.0
// @description  Redirects /shorts/<id> to the regular /watch?v=<id> player. No DOM dependency.
// @author       Vinsensius Andre Wijaya
// @license      MIT
// @match        *://*.youtube.com/*
// @run-at       document-start
// @grant        none
// @noframes
// @homepageURL  https://github.com/Andrematomer/my-tampermonkey-userscripts
// @updateURL    https://raw.githubusercontent.com/Andrematomer/my-tampermonkey-userscripts/main/shorts-redirect.user.js
// @downloadURL  https://raw.githubusercontent.com/Andrematomer/my-tampermonkey-userscripts/main/shorts-redirect.user.js
// ==/UserScript==

(() => {
  'use strict';

  const SHORTS_PATH = /^\/shorts\/([\w-]+)/;

  function redirectIfShorts() {
    const match = location.pathname.match(SHORTS_PATH);
    if (!match) return;
    // replace() swaps the current history entry, so the Back button
    // never lands on the /shorts/ URL and bounces you forward again.
    location.replace(`${location.origin}/watch?v=${match[1]}`);
  }

  // 1) Direct load / refresh of a Shorts URL.
  redirectIfShorts();

  // 2) YouTube is a single-page app: clicking a Short does not reload the page.
  //    It fires this event after each in-app navigation instead.
  document.addEventListener('yt-navigate-finish', redirectIfShorts);
  window.addEventListener('yt-navigate-finish', redirectIfShorts);

  // 3) Back/forward navigation to a Shorts entry.
  window.addEventListener('popstate', redirectIfShorts);
})();
