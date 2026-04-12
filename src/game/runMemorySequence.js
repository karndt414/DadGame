import { isVideoPath } from "./memoryGalleries";
import { attachVideoSrcWithFallbacks, formatMemoryMediaHint } from "./memoryMedia";
import { musicManager } from "../audio/musicManager";

/**
 * @param {Phaser.Scene} scene
 * @param {import('./memoryGalleries').MemoryItem[]} items
 */
export function runMemorySequence(scene, title, items, onContinue) {
  if (!items?.length) {
    onContinue();
    return;
  }

  const { width, height } = scene.scale;
  musicManager.playCelebration();
  scene.pauseGameplay();

  let index = 0;
  let mediaDom = null;
  let finished = false;
  const cx = width / 2;
  const cy = 300;

  scene.overlayBlock = scene.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.76).setDepth(300).setScrollFactor(0);
  const frame = scene.add.image(width / 2, height / 2, "ui-popup-frame").setDisplaySize(900, 520).setDepth(310).setScrollFactor(0);
  const heading = scene.add
    .text(width / 2, 172, title, {
      fontSize: "42px",
      color: "#f5e6b8",
      stroke: "#000000",
      strokeThickness: 5
    })
    .setOrigin(0.5)
    .setDepth(320)
    .setScrollFactor(0);

  const fallback = scene.add
    .text(cx, cy, "", {
      fontSize: "22px",
      color: "#d4e0d5",
      align: "center",
      wordWrap: { width: width * 0.68 }
    })
    .setOrigin(0.5)
    .setDepth(321)
    .setScrollFactor(0)
    .setVisible(false);

  const hint = scene.add
    .text(width / 2, 468, "", {
      fontSize: "24px",
      color: "#90f07d",
      stroke: "#000000",
      strokeThickness: 3
    })
    .setOrigin(0.5)
    .setDepth(323)
    .setScrollFactor(0);

  const teardownMedia = () => {
    if (mediaDom) {
      const el = mediaDom.node;
      if (el && typeof el.pause === "function") {
        el.pause();
      }
      mediaDom.destroy();
      mediaDom = null;
    }
  };

  const updateHint = () => {
    const total = items.length;
    if (index < total - 1) {
      hint.setText(`Memory ${index + 1} of ${total} — press ENTER for next`);
    } else {
      hint.setText(`Memory ${total} of ${total} — press ENTER to continue`);
    }
  };

  const mountStep = () => {
    teardownMedia();
    fallback.setVisible(false).setText("");
    const item = items[index];
    const urls = item.paths || [];
    const primary = urls[0] || "";
    const useVideo = item.kind === "video" || urls.some((u) => isVideoPath(u));

    if (useVideo && urls.length) {
      const video = document.createElement("video");
      video.muted = false;
      video.controls = true;
      video.autoplay = true;
      video.playsInline = true;
      video.style.width = "700px";
      video.style.maxWidth = "100%";
      video.style.borderRadius = "8px";
      video.style.boxShadow = "0 6px 18px rgba(0,0,0,0.45)";
      attachVideoSrcWithFallbacks(video, urls, {
        onReady: () => fallback.setVisible(false),
        onFailed: () => {
          fallback.setText(formatMemoryMediaHint(urls));
          fallback.setVisible(true);
        }
      });
      mediaDom = scene.add.dom(cx, cy, video).setDepth(322).setScrollFactor(0);
    } else if (primary) {
      const img = document.createElement("img");
      img.alt = "Memory";
      img.style.maxWidth = "700px";
      img.style.maxHeight = "420px";
      img.style.objectFit = "contain";
      img.style.borderRadius = "8px";
      img.style.boxShadow = "0 6px 18px rgba(0,0,0,0.45)";
      img.src = `/${encodeURI(primary)}`;
      img.onload = () => fallback.setVisible(false);
      img.onerror = () => {
        fallback.setText(`Couldn't load:\n${primary}`);
        fallback.setVisible(true);
      };
      mediaDom = scene.add.dom(cx, cy, img).setDepth(322).setScrollFactor(0);
    } else {
      fallback.setText("No media for this memory.");
      fallback.setVisible(true);
    }
    updateHint();
  };

  const done = () => {
    if (finished) {
      return;
    }
    finished = true;
    scene.input.keyboard.off("keydown-ENTER", onEnter);
    teardownMedia();
    scene.overlayBlock?.destroy();
    scene.overlayBlock = null;
    frame.destroy();
    heading.destroy();
    fallback.destroy();
    hint.destroy();
    scene.resumeGameplay();
    onContinue();
  };

  const onEnter = () => {
    if (finished) {
      return;
    }
    if (index < items.length - 1) {
      index += 1;
      mountStep();
    } else {
      done();
    }
  };

  scene.input.keyboard.on("keydown-ENTER", onEnter);
  mountStep();
}
