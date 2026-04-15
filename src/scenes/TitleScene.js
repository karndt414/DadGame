import Phaser from "phaser";
import { musicManager } from "../audio/musicManager";

export class TitleScene extends Phaser.Scene {
  constructor() {
    super("title");
  }

  startBossRush() {
    const state = this.registry.get("state");
    state.hearts = state.maxHearts;
    state.unlockedAbilities = { slash: true, dodge: true, shoot: true, explosion: true };
    state.abilityTier = 5;
    state.dungeonProgress = {
      father_childhood: { completed: true, memoryKey: true },
      my_childhood: { completed: true, memoryKey: true },
      modern_day: { completed: true, memoryKey: true }
    };
    state.upgrades = {
      damageLevel: 3,
      cooldownLevel: 3,
      maxHeartUpgrades: 0,
      shieldCharges: 0,
      secretMemories: []
    };
    state.fairyHeartBonus = 0;
    state.bigFattyGiftClaimed = false;
    state.deathCount = 0;
    state.swordHintShownAfterFirstDeath = false;
    state.memoryKeysCollected = 3;
    state.finalBossUnlocked = true;
    state.overworldMessage = "Boss rush: skipping straight to the final fight.";
    state.overworldIntroMessage = "";
    this.scene.start("final-boss");
  }

  create() {
    const { width, height } = this.scale;
    musicManager.setMood("title");
    musicManager.stopCurrentTrack();
    musicManager.usingAssetTracks = true;
    void musicManager.tryStart();

    this.add.rectangle(width / 2, height / 2, width, height, 0x1a2217);

    this.add
      .text(width / 2, 110, "The Legend of Dadinator", {
        fontFamily: "Trebuchet MS",
        fontSize: "46px",
        color: "#e5d19a",
        stroke: "#000000",
        strokeThickness: 4
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, 220, "A birthday hero rises today. Three memory dungeons await.", {
        fontSize: "28px",
        color: "#f2f4ec"
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, 220, "Find the crystals to gain powers!", {
        fontSize: "28px",
        color: "#f2f4ec"
      })
      .setOrigin(0.5,-1.5);

    this.add
      .text(width / 2, 360, "Controls: WASD move, E interact", {
        fontSize: "22px",
        color: "#d5d8ce",
        align: "center",
        wordWrap: { width: width * 0.8 }
      })
      .setOrigin(0.5);

    const start = this.add
      .text(width / 2, 500, "Press ENTER to Begin", {
        fontSize: "34px",
        color: "#8ae06e",
        stroke: "#000000",
        strokeThickness: 5
      })
      .setOrigin(0.5);

    this.tweens.add({
      targets: start,
      alpha: 0.3,
      duration: 700,
      yoyo: true,
      repeat: -1
    });

    this.input.keyboard.once("keydown-ENTER", async () => {
      musicManager.playSfx("uiConfirm", { throttleMs: 80, gain: 0.05, pitch: 1.08 });
      musicManager.usingAssetTracks = true;
      await musicManager.tryStart();
      this.registry.get("state").overworldIntroMessage = "";
      this.scene.start("overworld");
    });

    this.input.keyboard.once("keydown-B", () => {
      musicManager.playSfx("uiConfirm", { throttleMs: 80, gain: 0.05, pitch: 1.18 });
      this.startBossRush();
    });

    this.input.once("pointerdown", async () => {
      musicManager.playSfx("interact", { throttleMs: 80, gain: 0.035 });
      await musicManager.tryStart();
    });
  }
}
