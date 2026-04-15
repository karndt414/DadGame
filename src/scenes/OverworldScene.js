import Phaser from "phaser";
import { musicManager } from "../audio/musicManager";

const PLAYER_TEXTURE_KEYS = ["player-hero-lv1", "player-hero-lv2", "player-hero-lv3", "player-hero-lv4", "player-hero-lv5"];

const HUB_ENTRANCES = [
  { dungeonId: "father_childhood", x: 260, y: 240, bgKey: "bg-zone-1" },
  { dungeonId: "my_childhood", x: 640, y: 190, bgKey: "bg-zone-2" },
  { dungeonId: "modern_day", x: 1020, y: 260, bgKey: "bg-zone-4" }
];

export class OverworldScene extends Phaser.Scene {
  constructor() {
    super("overworld");
    this.secretRoomNodes = [];
    this.secretRoomPortal = null;
    this.secretRoomWarpZone = null;
    this.secretRoomExitZone = null;
    this.secretFountain = null;
    this.secretRoomStatusNode = null;
    this.bigFattyFairy = null;
    this.secretWarpCooldownUntil = 0;
    this.secretRoomMode = "overworld";
    this.swordPopupNodes = [];
    this.swordPopupActive = false;
    this.swordHintNodes = [];
    this.overworldIntroActive = false;
    this.overworldIntroNodes = [];
  }

  create() {
    this.state = this.registry.get("state");
    this.dungeons = this.registry.get("dungeons") || [];
    this.worldWidth = 1680;
    this.worldHeight = 720;
    this.physics.world.setBounds(0, 0, this.worldWidth, this.worldHeight);
    this.secretWarpCooldownUntil = 0;
    this.secretRoomMode = "overworld";
    this.swordPopupNodes = [];
    this.swordPopupActive = false;
    this.swordHintNodes = [];
    this.overworldIntroActive = false;
    this.overworldIntroNodes = [];

    musicManager.setMood("zone3");
    musicManager.tryStart();

    this.add.image(640, 360, "bg-zone-3").setDisplaySize(1280, 720);
    this.add.rectangle(640, 360, 1280, 720, 0x06110b, 0.32);
    this.add.rectangle(1440, 360, 400, 720, 0x08140d, 0.72).setDepth(0);
    this.add.rectangle(1440, 360, 400, 720, 0x20382a, 0.14).setDepth(1);

    this.add
      .text(640, 56, "Memory Overworld", {
        fontSize: "44px",
        color: "#f5e6b8",
        stroke: "#000000",
        strokeThickness: 5
      })
      .setOrigin(0.5);

    this.player = this.physics.add.image(640, 610, PLAYER_TEXTURE_KEYS[Math.min(4, (this.state.abilityTier || 1) - 1)] || "player-hero-lv1");
    this.player.setDisplaySize(48, 48);
    this.player.setCollideWorldBounds(true);
    this.player.setDepth(200);
    this.lastFootstepAt = 0;

    this.swordPickup = null;
    this.swordPrompt = null;
    if (!this.state.unlockedAbilities?.slash && (this.state.deathCount || 0) > 0) {
      this.spawnSwordPickup();
      if ((this.state.deathCount || 0) === 1 && !this.state.swordHintShownAfterFirstDeath) {
        this.showNeedWeaponHint();
        this.state.swordHintShownAfterFirstDeath = true;
      }
    }

    this.cursors = this.input.keyboard.addKeys({
      up: "W",
      left: "A",
      down: "S",
      right: "D",
      interact: "E"
    });

    this.entranceNodes = HUB_ENTRANCES.map((entry) => {
      const dungeon = this.dungeons.find((d) => d.id === entry.dungeonId);
      const progress = this.state.dungeonProgress?.[entry.dungeonId];
      const complete = Boolean(progress?.completed);
      const title = dungeon?.name || "Memory gate";
      const eraLine = dungeon?.subtitle || "";
      const tile = this.add.image(entry.x, entry.y, entry.bgKey).setDisplaySize(246, 152).setAlpha(0.92);
      const ring = this.add.circle(entry.x, entry.y, 86, complete ? 0x68db8a : 0x8cb8ff, complete ? 0.28 : 0.22).setStrokeStyle(3, complete ? 0x9df4b6 : 0xc6dbff, 0.9);
      const heading = this.add
        .text(entry.x, entry.y - 102, title, {
          fontSize: "24px",
          color: complete ? "#b9f8cb" : "#eaf2ff",
          stroke: "#000000",
          strokeThickness: 3
        })
        .setOrigin(0.5);
      const sub = this.add
        .text(entry.x, entry.y - 74, eraLine, {
          fontSize: "15px",
          color: complete ? "#c8f5d8" : "#c8d8f0",
          stroke: "#000000",
          strokeThickness: 2
        })
        .setOrigin(0.5);
      const status = this.add
        .text(entry.x, entry.y + 94, complete ? "Memory Key recovered" : "Press E to enter", {
          fontSize: "20px",
          color: complete ? "#9cf4b7" : "#dce7f4",
          stroke: "#000000",
          strokeThickness: 2
        })
        .setOrigin(0.5);
      return { ...entry, tile, ring, heading, sub, status };
    });

    this.finalGate = {
      x: 640,
      y: 450,
      ring: this.add.circle(640, 450, 72, 0x4a4a4a, 0.34).setStrokeStyle(4, 0x9a9a9a, 0.8),
      label: this.add
        .text(640, 450, "Final Gate", {
          fontSize: "26px",
          color: "#efefef",
          stroke: "#000000",
          strokeThickness: 3
        })
        .setOrigin(0.5),
      status: this.add
        .text(640, 520, "Locked: recover all 3 memory keys", {
          fontSize: "20px",
          color: "#d6d6d6",
          stroke: "#000000",
          strokeThickness: 2
        })
        .setOrigin(0.5)
    };

    this.statusPanel = this.add.rectangle(640, 680, 1000, 40, 0x0b1110, 0.55).setStrokeStyle(2, 0x6f8e69, 0.7);
    this.statusText = this.add
      .text(640, 680, this.state.overworldMessage || "Explore the era dungeons.", {
        fontSize: "21px",
        color: "#ecf0e6",
        stroke: "#000000",
        strokeThickness: 3
      })
      .setOrigin(0.5);

    this.abilityText = this.add
      .text(20, 16, this.getAbilityHudText(), {
        fontSize: "22px",
        color: "#d6efcf",
        stroke: "#000000",
        strokeThickness: 3
      })
      .setOrigin(0, 0);

    this.keyCountText = this.add
      .text(20, 48, this.getKeyText(), {
        fontSize: "20px",
        color: "#f5e6b8",
        stroke: "#000000",
        strokeThickness: 3
      })
      .setOrigin(0, 0);

    this.syncFinalGateState();
    this.spawnSecretRoom();

    if (this.state.overworldIntroMessage) {
      this.playOverworldIntro(this.state.overworldIntroMessage);
      this.state.overworldIntroMessage = "";
    }
  }

  getAbilityHudText() {
    const abilityLabels = {
      slash: "Slash",
      dodge: "Dodge",
      shoot: "Crystal Shot",
      explosion: "Crystal Explosion"
    };
    const unlocked = Object.entries(this.state.unlockedAbilities || {})
      .filter(([, v]) => v)
      .map(([k]) => abilityLabels[k] || k);
    const list = unlocked.length ? unlocked.join(" / ") : "None";
    return `Abilities: ${list}`;
  }

  getKeyText() {
    const keys = this.state.memoryKeysCollected || 0;
    return `Memory Keys: ${keys}/3`;
  }

  syncFinalGateState() {
    const completeCount = Object.values(this.state.dungeonProgress || {}).filter((d) => d?.completed).length;
    this.state.memoryKeysCollected = completeCount;
    this.state.finalBossUnlocked = completeCount >= 3;

    this.keyCountText?.setText(this.getKeyText());
    this.abilityText?.setText(this.getAbilityHudText());

    if (this.state.finalBossUnlocked) {
      this.finalGate.ring.setFillStyle(0x74d9a3, 0.3).setStrokeStyle(4, 0xbef8d8, 0.95);
      this.finalGate.status.setText("Press E at gate to challenge final boss").setColor("#b8f7d0");
    } else {
      this.finalGate.ring.setFillStyle(0x4a4a4a, 0.34).setStrokeStyle(4, 0x9a9a9a, 0.8);
      this.finalGate.status.setText("Locked: recover all 3 memory keys").setColor("#d6d6d6");
    }
  }

  spawnSecretRoom() {
    this.secretRoomNodes.forEach((node) => node.destroy());
    this.secretRoomNodes = [];
    this.secretRoomPortal = null;
    this.secretRoomWarpZone = null;
    this.secretRoomExitZone = null;
    this.secretFountain = null;
    this.secretRoomStatusNode = null;
    this.bigFattyFairy = null;

    if (!this.state.finalBossUnlocked) {
      return;
    }

    const roomX = 1508;
    const roomY = 360;
    const roomFrame = this.add.rectangle(roomX, roomY, 180, 560, 0x13281a, 0.9).setStrokeStyle(4, 0x9af0b0, 0.9);
    const roomGlow = this.add.circle(roomX, roomY - 108, 70, 0x9af0b0, 0.16).setStrokeStyle(2, 0xc7f9d7, 0.7);
    const roomLabel = this.add
      .text(roomX, 114, "Big Fatty's Fountain", {
        fontSize: "26px",
        color: "#d8ffdf",
        stroke: "#000000",
        strokeThickness: 3
      })
      .setOrigin(0.5);

    const fountainBase = this.add.circle(roomX, roomY + 112, 62, 0x7bcfbd, 0.34).setStrokeStyle(4, 0xd8fff0, 0.9);
    const fountainPool = this.add.circle(roomX, roomY + 112, 40, 0x3fa8c7, 0.9).setStrokeStyle(3, 0xcff8ff, 0.9);
    const fountainCore = this.add.circle(roomX, roomY + 112, 14, 0xe8fbff, 0.95);
    const fountainMist = this.add.circle(roomX, roomY + 78, 28, 0xbdf4ff, 0.16);

    const portalRing = this.add.circle(roomX, roomY + 54, 44, 0x7cf0a1, 0.2).setStrokeStyle(4, 0xd7ffe4, 0.95);
    const portalCore = this.add.circle(roomX, roomY + 54, 18, 0xc9ffe0, 0.95);
    const fairyHalo = this.add.circle(roomX, roomY - 14, 34, 0xfff6b0, 0.16).setStrokeStyle(2, 0xfff1c7, 0.75);
    const fairy = this.add.image(roomX, roomY - 14, "big-fatty-fairy").setDisplaySize(76, 76).setDepth(4);
    const fairyLabel = this.add
      .text(roomX, roomY + 20, this.state.bigFattyGiftClaimed ? "Big Fatty" : "Big Fatty", {
        fontSize: "24px",
        color: "#fff4b8",
        stroke: "#000000",
        strokeThickness: 3
      })
      .setOrigin(0.5);
    const status = this.add
      .text(roomX, roomY + 300, this.state.bigFattyGiftClaimed ? "+5 hearts already claimed" : "Press E to meet Big Fatty", {
        fontSize: "18px",
        color: this.state.bigFattyGiftClaimed ? "#c9dfcf" : "#edf7d8",
        stroke: "#000000",
        strokeThickness: 2,
        align: "center",
        wordWrap: { width: 150 }
      })
      .setOrigin(0.5);

    const sparkleA = this.add.circle(roomX - 44, roomY - 42, 5, 0xeaffb9, 0.95);
    const sparkleB = this.add.circle(roomX + 34, roomY + 10, 4, 0x9ef8ff, 0.9);

    [
      roomFrame,
      roomGlow,
      roomLabel,
      fountainBase,
      fountainPool,
      fountainCore,
      fountainMist,
      portalRing,
      portalCore,
      fairyHalo,
      fairy,
      fairyLabel,
      status,
      sparkleA,
      sparkleB,
    ].forEach((node) => {
      this.secretRoomNodes.push(node);
    });

    this.bigFattyFairy = fairy;
    this.secretRoomPortal = portalCore;
    this.secretFountain = fountainCore;
    this.secretRoomStatusNode = status;

    this.secretRoomWarpZone = {
      x: 1278,
      y: 360,
      top: 88,
      bottom: 632,
      width: 24
    };
    this.secretRoomExitZone = {
      x: 1458,
      y: 360,
      top: 88,
      bottom: 632,
      width: 24
    };

    this.tweens.add({
      targets: [portalRing, portalCore, fairyHalo, fairy, sparkleA, sparkleB],
      alpha: { from: 0.55, to: 1 },
      scale: { from: 0.96, to: 1.08 },
      duration: 900,
      yoyo: true,
      repeat: -1
    });
  }

  claimBigFattyGift() {
    if (this.state.bigFattyGiftClaimed) {
      this.setStatus("Big Fatty already gave you the heart blessing.");
      musicManager.playSfx("uiConfirm", { throttleMs: 80, gain: 0.04, pitch: 0.95 });
      return;
    }

    this.state.bigFattyGiftClaimed = true;
    this.state.fairyHeartBonus = 5;
    this.state.maxHearts = Math.min(11, 3 + (this.state.upgrades?.maxHeartUpgrades || 0) + this.state.fairyHeartBonus);
    this.state.hearts = this.state.maxHearts;
    this.state.overworldMessage = "Big Fatty gave you a bonus five hearts.";

    this.bigFattyFairy?.setTint(0xfff1b0);
    this.secretRoomStatusNode?.setText("+5 hearts claimed");

    musicManager.playCelebration();
    musicManager.playSfx("pickup", { throttleMs: 90, gain: 0.07, pitch: 1.12 });
    this.setStatus("Big Fatty blesses you with +5 bonus hearts.");
  }

  spawnSwordPickup() {
    if (this.swordPickup || this.state.unlockedAbilities?.slash) {
      return;
    }

    this.swordPickup = this.add.image(640, 576, "fx-slash-lv1").setDisplaySize(74, 36).setDepth(90);
    this.swordPickup.setTint(0xf5e6b8);
    this.tweens.add({
      targets: this.swordPickup,
      y: this.swordPickup.y - 8,
      duration: 800,
      yoyo: true,
      repeat: -1
    });

    this.swordPrompt = this.add
      .text(640, 544, "Press E to equip the sword", {
        fontSize: "20px",
        color: "#f5e6b8",
        stroke: "#000000",
        strokeThickness: 3
      })
      .setOrigin(0.5);
  }

  showNeedWeaponHint() {
    this.swordHintNodes.forEach((node) => node.destroy());
    this.swordHintNodes = [];

    const { width } = this.scale;
    const hint = this.add
      .text(width / 2, 156, "looks like you need a weapon", {
        fontSize: "28px",
        color: "#f5e6b8",
        stroke: "#000000",
        strokeThickness: 5
      })
      .setOrigin(0.5)
      .setDepth(230)
      .setScrollFactor(0);

    this.swordHintNodes.push(hint);
    this.tweens.add({
      targets: hint,
      alpha: { from: 0.25, to: 1 },
      duration: 500,
      yoyo: true,
      repeat: 4
    });

    this.time.delayedCall(3000, () => {
      this.swordHintNodes.forEach((node) => node.destroy());
      this.swordHintNodes = [];
    });
  }

  playOverworldIntro(message) {
    if (!message || this.overworldIntroActive) {
      return;
    }

    this.overworldIntroActive = true;
    const { width, height } = this.scale;
    const backdrop = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 1).setDepth(1000).setScrollFactor(0);
    const text = this.add
      .text(width / 2, height / 2, message, {
        fontSize: "30px",
        color: "#f5e6b8",
        stroke: "#000000",
        strokeThickness: 5,
        align: "center",
        wordWrap: { width: width * 0.8 }
      })
      .setOrigin(0.5)
      .setDepth(1001)
      .setScrollFactor(0);

    this.overworldIntroNodes = [backdrop, text];
    this.player.setVelocity(0, 0);
    this.player.setVisible(false);

    this.time.delayedCall(3000, () => {
      this.overworldIntroNodes.forEach((node) => node.destroy());
      this.overworldIntroNodes = [];
      this.player.setVisible(true);
      this.overworldIntroActive = false;
    });
  }

  showSwordPickupPopup() {
    if (this.swordPopupActive) {
      return;
    }

    const { width, height } = this.scale;
    this.swordPopupActive = true;
    const backdrop = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.58).setDepth(240).setScrollFactor(0);
    const frame = this.add.image(width / 2, height / 2, "ui-popup-frame").setDisplaySize(620, 270).setDepth(250).setScrollFactor(0);
    const heading = this.add
      .text(width / 2, height / 2 - 70, "Sword Acquired", {
        fontSize: "36px",
        color: "#f5e6b8",
        stroke: "#000000",
        strokeThickness: 5
      })
      .setOrigin(0.5)
      .setDepth(251)
      .setScrollFactor(0);
    const icon = this.add.image(width / 2, height / 2 - 6, "fx-slash-lv1").setDisplaySize(118, 58).setDepth(251).setScrollFactor(0);
    const text = this.add
      .text(width / 2, height / 2 + 54, "Slash unlocked.\nClick to strike enemies.", {
        fontSize: "22px",
        color: "#dbe9d5",
        align: "center"
      })
      .setOrigin(0.5)
      .setDepth(251)
      .setScrollFactor(0);
    const hint = this.add
      .text(width / 2, height / 2 + 98, "Click to continue", {
        fontSize: "18px",
        color: "#c5ffb8"
      })
      .setOrigin(0.5)
      .setDepth(251)
      .setScrollFactor(0);

    this.swordPopupNodes = [backdrop, frame, heading, icon, text, hint];
    musicManager.playCelebration();
    musicManager.playSfx("uiConfirm", { throttleMs: 90, gain: 0.055, pitch: 1.12 });

    const dismiss = () => {
      if (!this.swordPopupActive) {
        return;
      }
      this.swordPopupActive = false;
      this.input.off("pointerdown", dismiss);
      this.swordPopupNodes.forEach((node) => node.destroy());
      this.swordPopupNodes = [];
      this.setStatus("Sword equipped. Slash unlocked.");
    };

    this.input.once("pointerdown", dismiss);
    this.time.delayedCall(1400, dismiss);
  }

  teleportToBigFattyFountain() {
    if (!this.secretFountain) {
      return;
    }

    this.secretRoomMode = "fountain";
    this.secretWarpCooldownUntil = this.time.now + 900;
    this.player.setVelocity(0, 0);
    this.player.setPosition(this.secretFountain.x - 34, this.secretFountain.y + 86);
    this.cameras.main.centerOn(this.secretFountain.x, this.secretFountain.y);
    this.cameras.main.flash(180, 180, 255, 220);
    musicManager.playSfx("uiConfirm", { throttleMs: 120, gain: 0.055, pitch: 1.08 });
    this.setStatus("You arrive at Big Fatty's Fountain.");
  }

  teleportBackToOverworld() {
    this.secretRoomMode = "overworld";
    this.secretWarpCooldownUntil = this.time.now + 900;
    this.player.setVelocity(0, 0);
    this.player.setPosition(1260, 360);
    this.cameras.main.centerOn(640, 360);
    this.cameras.main.flash(180, 220, 180, 220);
    musicManager.playSfx("uiConfirm", { throttleMs: 120, gain: 0.05, pitch: 0.98 });
    this.setStatus("You step back into the overworld.");
  }

  setStatus(text) {
    this.statusText.setText(text);
    this.statusPanel.width = Math.max(420, Math.min(1120, text.length * 11));
  }

  update() {
    if (this.overworldIntroActive) {
      return;
    }

    if (this.swordPopupActive) {
      return;
    }

    const speed = 235;
    const vx = (this.cursors.left.isDown ? -1 : 0) + (this.cursors.right.isDown ? 1 : 0);
    const vy = (this.cursors.up.isDown ? -1 : 0) + (this.cursors.down.isDown ? 1 : 0);
    const len = Math.hypot(vx, vy) || 1;
    if ((vx !== 0 || vy !== 0) && this.time.now - this.lastFootstepAt > 190) {
      this.lastFootstepAt = this.time.now;
      musicManager.playSfx("footstep", { throttleMs: 55, gain: 0.022, pitch: 0.98 });
    }
    this.player.body.setVelocity((vx / len) * speed, (vy / len) * speed);

    if (this.state.finalBossUnlocked && this.time.now > this.secretWarpCooldownUntil) {
      if (
        this.secretRoomMode === "overworld" &&
        this.secretRoomWarpZone &&
        this.player.x >= this.secretRoomWarpZone.x &&
        this.player.y >= this.secretRoomWarpZone.top &&
        this.player.y <= this.secretRoomWarpZone.bottom
      ) {
        this.teleportToBigFattyFountain();
      } else if (
        this.secretRoomMode === "fountain" &&
        this.secretRoomExitZone &&
        this.player.x <= this.secretRoomExitZone.x &&
        this.player.y >= this.secretRoomExitZone.top &&
        this.player.y <= this.secretRoomExitZone.bottom
      ) {
        this.teleportBackToOverworld();
      }
    }

    if (Phaser.Input.Keyboard.JustDown(this.cursors.interact)) {
      this.tryInteract();
    }
  }

  tryInteract() {
    this.syncFinalGateState();
    musicManager.playSfx("interact", { throttleMs: 90, gain: 0.03 });

    if (this.state.finalBossUnlocked && this.secretRoomPortal) {
      const secretDist = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.secretRoomPortal.x, this.secretRoomPortal.y);
      if (secretDist < 104) {
        this.claimBigFattyGift();
        return;
      }
    }

    if (this.swordPickup) {
      const swordDist = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.swordPickup.x, this.swordPickup.y);
      if (swordDist < 72) {
        this.state.unlockedAbilities = this.state.unlockedAbilities || {};
        this.state.unlockedAbilities.slash = true;
        this.swordPickup.destroy();
        this.swordPickup = null;
        this.swordPrompt?.destroy();
        this.swordPrompt = null;
        this.abilityText?.setText(this.getAbilityHudText());
        this.showSwordPickupPopup();
        return;
      }
    }

    const nearbyDungeon = this.entranceNodes.find(
      (entry) => Phaser.Math.Distance.Between(this.player.x, this.player.y, entry.x, entry.y) < 94
    );
    if (nearbyDungeon) {
      const dungeon = this.dungeons.find((d) => d.id === nearbyDungeon.dungeonId);
      if (!dungeon) {
        this.setStatus("That memory gate is unstable right now.");
        return;
      }
      this.state.hearts = this.state.maxHearts;
      musicManager.playSfx("uiConfirm", { throttleMs: 90, gain: 0.05, pitch: 1.05 });
      this.scene.start("dungeon", { dungeonId: dungeon.id });
      return;
    }

    const gateDist = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.finalGate.x, this.finalGate.y);
    if (gateDist < 90) {
      if (!this.state.finalBossUnlocked) {
        this.setStatus("Final gate sealed. Restore all three memory keys first.");
        return;
      }
      this.state.hearts = this.state.maxHearts;
      musicManager.playSfx("uiConfirm", { throttleMs: 90, gain: 0.055, pitch: 1.12 });
      this.scene.start("final-boss");
      return;
    }

    this.setStatus("Move near a dungeon gate or the final gate, then press E.");
  }
}
