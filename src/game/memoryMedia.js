/**
 * Fallback video URLs (secret relic + finale) when you add files back.
 * Dungeon boss memories use image/video sequences from memoryGalleries.js instead.
 */

import { firstMediaPathForDungeon } from "./memoryGalleries";

export const MEMORY_MEDIA_CANDIDATES = {
  5: ["assets/media/popup_05_secret.mp4", "assets/media/popup_05_secret.mov"],
  final: ["assets/media/final_video.mp4", "assets/media/final_video.mov"]
};

export function getMemoryMediaCandidates(popupId) {
  const key = popupId === "final" ? "final" : popupId;
  const list = MEMORY_MEDIA_CANDIDATES[key];
  return list ? [...list] : [];
}

/** State.debug display: first asset per dungeon + legacy video slots. */
export function getInitialMediaPathsForState() {
  return {
    1: firstMediaPathForDungeon("father_childhood"),
    2: firstMediaPathForDungeon("my_childhood"),
    3: firstMediaPathForDungeon("modern_day"),
    5: MEMORY_MEDIA_CANDIDATES[5][0],
    final: MEMORY_MEDIA_CANDIDATES.final[0]
  };
}

export function formatMemoryMediaHint(urls) {
  if (!urls?.length) {
    return "No media path configured for this slot.";
  }
  return `Add or convert media (tried in order):\n${urls.join("\n")}`;
}

export function attachVideoSrcWithFallbacks(video, urls, { onReady, onFailed }) {
  if (!urls?.length) {
    onFailed?.();
    return;
  }
  let index = 0;
  let settled = false;
  const finishOk = () => {
    if (settled) {
      return;
    }
    settled = true;
    onReady?.();
  };
  const tryLoad = () => {
    if (index >= urls.length) {
      if (!settled) {
        settled = true;
        onFailed?.();
      }
      return;
    }
    const path = urls[index];
    index += 1;
    video.src = `/${encodeURI(path)}`;
  };
  video.onerror = () => tryLoad();
  video.onloadeddata = () => finishOk();
  tryLoad();
}
