import Phaser from "phaser";
import { HERO_SHEET_FRAME, HERO_SHEET_TEXTURE_KEY, registerHeroSheetAnimationsIfPresent } from "../game/spriteAnimConfig";

export class BootScene extends Phaser.Scene {
  constructor() {
    super("boot");
  }

  preload() {
    this.load.setPath("/");

    this.load.svg("bg-zone-1", "assets/tiles/zone1_meadow_bg.svg");
    this.load.svg("bg-zone-2", "assets/tiles/zone2_golf_bg.svg");
    this.load.svg("bg-zone-3", "assets/tiles/zone3_commerce_bg.svg");
    this.load.svg("bg-zone-4", "assets/tiles/zone4_backyard_bg.svg");
    this.load.svg("bg-final", "assets/tiles/final_arena_bg.svg");

    this.load.svg("player-hero", "assets/sprites/player/hero_idle.svg");
    this.load.svg("player-hero-lv1", "assets/sprites/player/hero_idle.svg");
    this.load.svg("player-hero-lv2", "assets/sprites/player/hero_lv2.svg");
    this.load.svg("player-hero-lv3", "assets/sprites/player/hero_lv3.svg");
    this.load.svg("player-hero-lv4", "assets/sprites/player/hero_lv4.svg");
    this.load.svg("player-hero-lv5", "assets/sprites/player/hero_lv5.svg");

    this.load.svg("enemy-meadow-scout", "assets/sprites/enemies/meadow_scout.svg");
    this.load.svg("enemy-sap-slime", "assets/sprites/enemies/sap_slime.svg");
    this.load.svg("enemy-thorn-sentry", "assets/sprites/enemies/thorn_sentry.svg");
    this.load.svg("enemy-golf-caddie-bot", "assets/sprites/enemies/golf_caddie_bot.svg");
    this.load.svg("enemy-golf-bunker-mite", "assets/sprites/enemies/golf_bunker_mite.svg");
    this.load.svg("enemy-golf-flag-wisp", "assets/sprites/enemies/golf_flag_wisp.svg");
    this.load.svg("enemy-market-crate-crab", "assets/sprites/enemies/market_crate_crab.svg");
    this.load.svg("enemy-market-sign-sprite", "assets/sprites/enemies/market_sign_sprite.svg");
    this.load.svg("enemy-market-neon-orb", "assets/sprites/enemies/market_neon_orb.svg");
    this.load.svg("enemy-backyard-mower-bot", "assets/sprites/enemies/backyard_mower_bot.svg");
    this.load.svg("enemy-backyard-lantern-bug", "assets/sprites/enemies/backyard_lantern_bug.svg");
    this.load.svg("enemy-backyard-fence-imp", "assets/sprites/enemies/backyard_fence_imp.svg");
    this.load.svg("boss-memory-warden", "assets/sprites/bosses/memory_warden.svg");
    this.load.svg("boss-trench-overlord", "assets/sprites/bosses/boss_trench_overlord.svg");
    this.load.svg("boss-vault-tyrant", "assets/sprites/bosses/boss_vault_tyrant.svg");
    this.load.svg("boss-sound-architect", "assets/sprites/bosses/boss_sound_architect.svg");

    this.load.svg("ui-heart-full", "assets/ui/heart_full.svg");
    this.load.svg("ui-heart-empty", "assets/ui/heart_empty.svg");
    this.load.svg("ui-shrine", "assets/ui/shrine_icon.svg");
    this.load.svg("ui-relic", "assets/ui/relic_icon.svg");
    this.load.svg("ui-popup-frame", "assets/ui/popup_frame.svg");

    this.load.svg("fx-slash-lv1", "assets/sprites/effects/slash_lv1.svg");
    this.load.svg("fx-slash-lv2", "assets/sprites/effects/slash_lv2.svg");
    this.load.svg("fx-slash-lv3", "assets/sprites/effects/slash_lv3.svg");
    this.load.svg("fx-slash-lv4", "assets/sprites/effects/slash_lv4.svg");
    this.load.svg("fx-crystal-shot", "assets/sprites/effects/crystal_shot.svg");
    this.load.svg("fx-crystal-explosion", "assets/sprites/effects/crystal_explosion.svg");
    this.load.svg("pickup-yellow-crystal", "assets/sprites/effects/yellow_crystal.svg");

    // Optional production sheet: horizontal strip, 64×64 frames (see assets/README).
    // Uncomment when assets/sprites/player/hero_sheet.png exists.
    // this.load.spritesheet(HERO_SHEET_TEXTURE_KEY, "assets/sprites/player/hero_sheet.png", {
    //   frameWidth: HERO_SHEET_FRAME.frameWidth,
    //   frameHeight: HERO_SHEET_FRAME.frameHeight,
    //   endFrame: HERO_SHEET_FRAME.endFrame
    // });
  }

  create() {
    registerHeroSheetAnimationsIfPresent(this);
    this.scene.start("title");
  }
}
