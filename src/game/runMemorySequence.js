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

  let itemIndex = 0;
  let pathIndex = 0;
  let mediaDom = null;
  let finished = false;
  const cx = width / 2;
  const cy = height / 2 + 8;
  const mediaWidth = Math.min(720, Math.max(520, Math.floor(width * 0.62)));
  const mediaHeight = 360;

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
    const item = items[itemIndex];
    const paths = item?.paths || [];
    if (paths.length > 1 && pathIndex < paths.length - 1) {
      hint.setText(`Memory ${itemIndex + 1} of ${total} — press ENTER for next part`);
    } else if (itemIndex < total - 1) {
      hint.setText(`Memory ${itemIndex + 1} of ${total} — press ENTER for next`);
    } else {
      hint.setText(`Memory ${total} of ${total} — press ENTER to continue`);
    }
  };

  const mountStep = () => {
    teardownMedia();
    fallback.setVisible(false).setText("");
    const item = items[itemIndex];
    const urls = item.paths || [];
    const currentPath = urls[pathIndex] || "";
    const useVideo = item.kind === "video" || isVideoPath(currentPath);
    musicManager.setVideoDuck(useVideo && urls.length > 0);

    const shell = document.createElement("div");
    shell.style.width = `${mediaWidth}px`;
    shell.style.height = `${mediaHeight}px`;
    shell.style.display = "flex";
    shell.style.alignItems = "center";
    shell.style.justifyContent = "center";
    shell.style.overflow = "hidden";
    shell.style.background = "rgba(0, 0, 0, 0.08)";
    shell.style.borderRadius = "8px";

    if (useVideo && urls.length) {
      const video = document.createElement("video");
      video.muted = false;
      video.controls = true;
      video.autoplay = true;
      video.playsInline = true;
      video.style.width = "100%";
      video.style.height = "100%";
      video.style.maxWidth = "100%";
      video.style.maxHeight = "100%";
      video.style.objectFit = "contain";
      video.style.display = "block";
      video.style.margin = "0";
      video.style.borderRadius = "8px";
      video.style.boxShadow = "0 6px 18px rgba(0,0,0,0.45)";
      video.onended = () => {
        musicManager.setVideoDuck(false);
        if (itemIndex === items.length - 1 && pathIndex === urls.length - 1) {
          done();
        }
      };
      shell.appendChild(video);
      attachVideoSrcWithFallbacks(video, [currentPath], {
        onReady: () => fallback.setVisible(false),
        onFailed: () => {
          musicManager.setVideoDuck(false);
          fallback.setText(formatMemoryMediaHint([currentPath]));
          fallback.setVisible(true);
        }
      });
      mediaDom = scene.add.dom(cx, cy, shell).setDepth(322).setScrollFactor(0);
    } else if (currentPath) {
      const img = document.createElement("img");
      img.alt = "Memory";
      img.style.width = "100%";
      img.style.height = "100%";
      img.style.maxWidth = "100%";
      img.style.maxHeight = "100%";
      img.style.objectFit = "contain";
      img.style.display = "block";
      img.style.margin = "0";
      img.style.borderRadius = "8px";
      img.style.boxShadow = "0 6px 18px rgba(0,0,0,0.45)";
      img.src = `/${encodeURI(currentPath)}`;
      img.onload = () => fallback.setVisible(false);
      img.onerror = () => {
        fallback.setText(`Couldn't load:\n${currentPath}`);
        fallback.setVisible(true);
      };
      shell.appendChild(img);
      mediaDom = scene.add.dom(cx, cy, shell).setDepth(322).setScrollFactor(0);
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
    musicManager.setVideoDuck(false);
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
    const item = items[itemIndex];
    const paths = item?.paths || [];
    if (pathIndex < paths.length - 1) {
      pathIndex += 1;
      mountStep();
      return;
    }
    if (itemIndex < items.length - 1) {
      itemIndex += 1;
      pathIndex = 0;
      mountStep();
    } else {
      done();
    }
  };

  scene.input.keyboard.on("keydown-ENTER", onEnter);
  mountStep();
}
