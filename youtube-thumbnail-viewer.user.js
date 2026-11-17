// ==UserScript==
// @name         YouTube Thumbnail Viewer
// @namespace    https://github.com/Andrematomer/my-tampermonkey-userscripts
// @version      1.0.0
// @description  Tampermonkey menu command that opens the highest-resolution thumbnail of the current YouTube video.
// @author       Vinsensius Andre Wijaya
// @license      MIT
// @match        *://*.youtube.com/*
// @run-at       document-idle
// @grant        GM_registerMenuCommand
// @grant        GM_openInTab
// @grant        GM_notification
// @noframes
// @homepageURL  https://github.com/Andrematomer/my-tampermonkey-userscripts
// @updateURL    https://raw.githubusercontent.com/Andrematomer/my-tampermonkey-userscripts/main/youtube-thumbnail-viewer.user.js
// @downloadURL  https://raw.githubusercontent.com/Andrematomer/my-tampermonkey-userscripts/main/youtube-thumbnail-viewer.user.js
// ==/UserScript==

(() => {
  'use strict';

  const ID_RE = /^[\w-]{11}$/;
  const thumb = (id, name) => `https://i.ytimg.com/vi/${id}/${name}.jpg`;

  // Read from the URL at click time, so it is always correct after SPA navigation.
  function getVideoId() {
    const url = new URL(location.href);
    const v = url.searchParams.get('v');
    if (v && ID_RE.test(v)) return v;
    const m = url.pathname.match(/^\/(?:shorts|live|embed|v)\/([\w-]{11})/);
    return m ? m[1] : null;
  }

  function notify(text) {
    try {
      GM_notification({ title: 'YouTube Thumbnail Viewer', text, timeout: 4000 });
    } catch {
      alert(text);
    }
  }

  // maxresdefault does not exist for every video: YouTube then serves a 120px grey
  // placeholder instead of a 404. Detect that and fall back to the next best size.
  function isRealImage(url) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(img.naturalWidth > 120);
      img.onerror = () => resolve(false);
      img.src = url;
    });
  }

  async function bestThumbnail(id) {
    for (const name of ['maxresdefault', 'sddefault']) {
      const url = thumb(id, name);
      if (await isRealImage(url)) return url;
    }
    return thumb(id, 'hqdefault'); // always exists
  }

  function openTab(url) {
    if (typeof GM_openInTab === 'function') GM_openInTab(url, { active: true, insert: true });
    else window.open(url, '_blank', 'noopener');
  }

  GM_registerMenuCommand('🖼️ View Full-Res Thumbnail', async () => {
    const id = getVideoId();
    if (!id) {
      notify('No video found on this page. Open a video first, then try again.');
      return;
    }
    openTab(await bestThumbnail(id));
  });
})();
