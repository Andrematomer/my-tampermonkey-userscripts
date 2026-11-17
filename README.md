# Minimal Userscripts

Five small [Tampermonkey](https://www.tampermonkey.net/) userscripts for a calmer, more controllable web.

## Philosophy

- **Minimalist.** Each script does one thing, in well under 200 lines. No frameworks, no build step, no dependencies.
- **Zero DOM dependency.** No scripts here target a site's CSS classes, element IDs or component tree, because those change every redesign. They use only stable platform features: the HTML5 `<video>` API, `visibilitychange`, `location.replace`, standard URLs, and overlays attached straight to `document.documentElement`.
- **Update-proof.** If a site redesigns tomorrow, these should keep working. The only site-specific knowledge is URL shapes (like `/shorts/<id>`) and the `yt-navigate-finish` event, both of which have been stable for years.

## Install

Click a link below. Tampermonkey opens an install page. Click **Install**. Scripts include `@updateURL`, so Tampermonkey will keep them current.

| Script | What it does | Install |
| --- | --- | --- |
| **Shorts Redirect** | Turns `/shorts/<id>` into the normal `/watch?v=<id>` player (no history loop). | [Install](https://raw.githubusercontent.com/Andrematomer/my-tampermonkey-userscripts/main/shorts-redirect.user.js) |
| **Mindful Reflection Overlay** | 20-second full-screen pause before distracting sites. 5-minute grace period after you confirm. | [Install](https://raw.githubusercontent.com/Andrematomer/my-tampermonkey-userscripts/main/mindful-reflection-overlay.user.js) |
| **Video Speed Controller** | `D` faster, `A` slower (±0.1x), `S` reset to 1.0x. Range 0.1x to 16x. Works on any HTML5 video. | [Install](https://raw.githubusercontent.com/Andrematomer/my-tampermonkey-userscripts/main/video-speed-controller.user.js) |
| **Video Auto-Pause** | Pauses videos when you switch tabs, resumes only the ones it paused. | [Install](https://raw.githubusercontent.com/Andrematomer/my-tampermonkey-userscripts/main/video-auto-pause.user.js) |
| **YouTube Thumbnail Viewer** | Tampermonkey menu command: open the full-res thumbnail of the current video in a new tab. | [Install](https://raw.githubusercontent.com/Andrematomer/my-tampermonkey-userscripts/main/youtube-thumbnail-viewer.user.js) |

## Configure the Mindful Reflection Overlay

Open the script in the Tampermonkey editor and edit the `SITES` list at the top:

```js
const SITES = [
  '*://*.youtube.com/',   // home page only, videos stay unblocked
  '*://*.reddit.com/*',
  '*://*.x.com/*',
];
```

Add one pattern per line, in the same style as Tampermonkey's `@match`:

| You want to block | Pattern |
| --- | --- |
| A whole site, including subdomains | `'*://*.tiktok.com/*'` |
| Only the home page of a site | `'*://*.youtube.com/'` |
| One section of a site | `'*://*.reddit.com/r/all/*'` |
| Both `http` and `https` | start with `*://` |

Rules:

- `*` is a wildcard. `*.example.com` also matches `example.com` itself.
- A pattern ending in `/` matches only that exact path. Query strings and `#hashes` are ignored.
- To remove a site, delete its line.
- You only edit this list. The script's `@match` is deliberately broad (`*://*/*`) and the list decides what is blocked.

Other knobs in the same block: `COUNTDOWN_SECONDS` (default 20) and `GRACE_MINUTES` (default 5). The grace period is stored per domain in `localStorage`, so clearing site data resets it.

## Notes

- **Close Tab** uses `window.close()`, which browsers only allow for tabs opened by a script or link. Otherwise it navigates to `about:blank`.
- **Video Auto-Pause** skips `music.youtube.com` by default so background music keeps playing. Add other hosts to `EXCLUDE_HOSTS` in that script.
- **Thumbnail Viewer** tries `maxresdefault.jpg` first and falls back to `sddefault`/`hqdefault` for older videos that have no max-res version.

## License

MIT. See [LICENSE](LICENSE).
