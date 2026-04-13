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
  }

  create() {
    this.state = this.registry.get("state");
    this.dungeons = this.registry.get("dungeons") || [];
    this.physics.world.setBounds(0, 0, 1280, 720);

    musicManager.setMood("zone3");
    musicManager.tryStart();

    this.add.image(640, 360, "bg-zone-3").setDisplaySize(1280, 720);
    this.add.rectangle(640, 360, 1280, 720, 0x06110b, 0.32);

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
    this.lastFootstepAt = 0;

    this.swordPickup = null;
    if (!this.state.unlockedAbilities?.slash) {
      this.swordPickup = this.add.image(640, 560, "fx-slash-lv1").setDisplaySize(74, 36).setDepth(90);
      this.swordPickup.setTint(0xf5e6b8);
      this.tweens.add({
        targets: this.swordPickup,
        y: this.swordPickup.y - 8,
        duration: 800,
        yoyo: true,
        repeat: -1
      });

      this.swordPrompt = this.add
        .text(640, 528, "Press E to equip the sword", {
          fontSize: "20px",
          color: "#f5e6b8",
          stroke: "#000000",
          strokeThickness: 3
        })
        .setOrigin(0.5);
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

  setStatus(text) {
    this.statusText.setText(text);
    this.statusPanel.width = Math.max(420, Math.min(1120, text.length * 11));
  }

  update() {
    const speed = 235;
    const vx = (this.cursors.left.isDown ? -1 : 0) + (this.cursors.right.isDown ? 1 : 0);
    const vy = (this.cursors.up.isDown ? -1 : 0) + (this.cursors.down.isDown ? 1 : 0);
    const len = Math.hypot(vx, vy) || 1;
    if ((vx !== 0 || vy !== 0) && this.time.now - this.lastFootstepAt > 190) {
      this.lastFootstepAt = this.time.now;
      musicManager.playSfx("footstep", { throttleMs: 55, gain: 0.022, pitch: 0.98 });
    }
    this.player.body.setVelocity((vx / len) * speed, (vy / len) * speed);

    if (Phaser.Input.Keyboard.JustDown(this.cursors.interact)) {
      this.tryInteract();
    }
  }

  tryInteract() {
    this.syncFinalGateState();
    musicManager.playSfx("interact", { throttleMs: 90, gain: 0.03 });

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
        this.setStatus("Sword equipped. Slash unlocked.");
        musicManager.playSfx("pickup", { throttleMs: 90, gain: 0.055, pitch: 1.08 });
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
