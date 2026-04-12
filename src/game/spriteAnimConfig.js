/** Matches docs/06_art_direction_guide.md — adjust endFrame when your sheet has fewer/more frames. */
export const HERO_SHEET_TEXTURE_KEY = "player-hero-sheet";
export const HERO_SHEET_FRAME = { frameWidth: 64, frameHeight: 64, endFrame: 7 };

/**
 * Call from BootScene.create after preload. Safe no-op if optional sheet was not loaded.
 * Uncomment spritesheet line in BootScene.preload when assets/sprites/player/hero_sheet.png exists.
 */
export function registerHeroSheetAnimationsIfPresent(scene) {
  if (!scene.textures.exists(HERO_SHEET_TEXTURE_KEY)) {
    return;
  }
  if (scene.anims.exists("hero-sheet-run")) {
    return;
  }
  scene.anims.create({
    key: "hero-sheet-run",
    frames: scene.anims.generateFrameNumbers(HERO_SHEET_TEXTURE_KEY, { start: 0, end: HERO_SHEET_FRAME.endFrame }),
    frameRate: 10,
    repeat: -1
  });
  scene.anims.create({
    key: "hero-sheet-idle",
    frames: [{ key: HERO_SHEET_TEXTURE_KEY, frame: 0 }],
    frameRate: 1,
    repeat: 0
  });
}
