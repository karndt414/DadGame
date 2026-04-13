import Phaser from "phaser";
import { musicManager } from "../audio/musicManager";
import { attachVideoSrcWithFallbacks, formatMemoryMediaHint, getMemoryMediaCandidates } from "../game/memoryMedia";

const PLAYER_TEXTURE_KEYS = ["player-hero-lv1", "player-hero-lv2", "player-hero-lv3", "player-hero-lv4", "player-hero-lv5"];

export class FinalBossScene extends Phaser.Scene {
  constructor() {
    super("final-boss");
  }

  create() {
    const { width, height } = this.scale;
    this.physics.world.resume();

    this.state = this.registry.get("state");
    if (!this.state.finalBossUnlocked) {
      this.state.overworldMessage = "Final gate is sealed. Recover all three memory keys.";
      this.scene.start("overworld");
      return;
    }

    this.abilityTier = Math.min(5, (this.state.abilityTier || 1) + 1);
    this.playerTextureKey = PLAYER_TEXTURE_KEYS[this.abilityTier - 1] || "player-hero-lv5";
    musicManager.setMood("final");
    musicManager.tryStart();

    this.add.image(width / 2, height / 2, "bg-final").setDisplaySize(width, height);

    this.add
      .text(width / 2, 90, "Final Boss: Memory Warden", {
        fontSize: "44px",
        color: "#f5e6b8",
        stroke: "#000000",
        strokeThickness: 5
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, 150, "All keys recovered. Defeat the warden to restore the final memory.", {
        fontSize: "26px",
        color: "#e5ece1"
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, 188, `Final Ability Lv.${this.abilityTier}`, {
        fontSize: "21px",
        color: "#cde8c1",
        stroke: "#000000",
        strokeThickness: 3
      })
      .setOrigin(0.5);

    this.player = this.physics.add.image(220, height / 2, this.playerTextureKey);
    this.player.setDisplaySize(50, 50);
    this.player.body.setCollideWorldBounds(true);

    this.boss = this.physics.add.image(width - 220, height / 2, "boss-memory-warden");
    this.boss.setDisplaySize(112, 112);
    this.boss.body.setCollideWorldBounds(true);
    this.boss.hp = 22;

    this.bossHpText = this.add.text(width - 44, 26, `Boss HP: ${this.boss.hp}`, {
      fontSize: "26px",
      color: "#ffc8c8",
      stroke: "#000000",
      strokeThickness: 3
    }).setOrigin(1, 0);

    this.createHeartsUi();

    this.cursors = this.input.keyboard.addKeys({
      up: "W",
      left: "A",
      down: "S",
      right: "D",
      dodge: "SHIFT",
      special: "SPACE"
    });

    this.attackCooldown = 0;
    this.dodgeCooldown = 0;
    this.specialCooldown = 0;
    this.invulnUntil = 0;
    this.comboStep = 0;
    this.dodgeBurstUntil = 0;
    this.lastFootstepAt = 0;
    this.dodgeVector = new Phaser.Math.Vector2(0, 0);
    this.input.on("pointerdown", this.attack, this);
  }

  createHeartsUi() {
    this.heartIcons?.forEach((icon) => icon.destroy());
    this.heartIcons = [];
    for (let i = 0; i < this.state.maxHearts; i += 1) {
      const key = i < this.state.hearts ? "ui-heart-full" : "ui-heart-empty";
      const icon = this.add.image(34 + i * 34, 32, key).setDisplaySize(28, 28).setOrigin(0.5);
      this.heartIcons.push(icon);
    }
  }

  updateHeartsUi() {
    this.heartIcons.forEach((icon, idx) => {
      icon.setTexture(idx < this.state.hearts ? "ui-heart-full" : "ui-heart-empty");
    });
  }

  update() {
    if (!this.boss) {
      return;
    }

    if (this.time.now < this.dodgeBurstUntil) {
      const dashSpeed = 620 + this.abilityTier * 40;
      this.player.body.setVelocity(this.dodgeVector.x * dashSpeed, this.dodgeVector.y * dashSpeed);
    } else {
      const speed = 230;
      const vx = (this.cursors.left.isDown ? -1 : 0) + (this.cursors.right.isDown ? 1 : 0);
      const vy = (this.cursors.up.isDown ? -1 : 0) + (this.cursors.down.isDown ? 1 : 0);
      const len = Math.hypot(vx, vy) || 1;
      if ((vx !== 0 || vy !== 0) && this.time.now - this.lastFootstepAt > 175) {
        this.lastFootstepAt = this.time.now;
        musicManager.playSfx("footstep", { throttleMs: 50, gain: 0.028, pitch: 0.92 });
      }
      this.player.body.setVelocity((vx / len) * speed, (vy / len) * speed);
    }

    const dir = new Phaser.Math.Vector2(this.player.x - this.boss.x, this.player.y - this.boss.y).normalize();
    this.boss.body.setVelocity(dir.x * 105, dir.y * 105);

    if (Phaser.Input.Keyboard.JustDown(this.cursors.dodge)) {
      this.tryDodge();
    }

    if (Phaser.Input.Keyboard.JustDown(this.cursors.special)) {
      this.trySpecial();
    }

    if (Phaser.Math.Distance.Between(this.player.x, this.player.y, this.boss.x, this.boss.y) < 56) {
      this.takeDamage(1);
    }

    if (this.boss.hp <= 0) {
      this.endRun();
    }
  }

  attack(pointer) {
    const now = this.time.now;
    if (now < this.attackCooldown || !this.boss) {
      return;
    }
    const combo = this.comboStep % 3;
    const tier = this.abilityTier;
    const damageBonus = tier >= 4 ? 1 : 0;
    const rangeBonus = tier * 8;
    const cooldownBonus = (tier - 1) * 20;
    const attackProfiles = [
      { cooldown: 240 - cooldownBonus, range: 118 + rangeBonus, damage: 1 + damageBonus, color: 0xf5f1da, scale: 1.0 + tier * 0.05 },
      { cooldown: 300 - cooldownBonus, range: 140 + rangeBonus, damage: 1 + damageBonus, color: 0x9fe8ff, scale: 1.25 + tier * 0.05 },
      { cooldown: 340 - cooldownBonus, range: 96 + rangeBonus, damage: 2 + damageBonus, color: 0xffd46d, scale: 0.9 + tier * 0.06 }
    ];
    const profile = attackProfiles[combo];
    this.attackCooldown = now + profile.cooldown;
    this.comboStep += 1;
    musicManager.playSfx("slash", { throttleMs: 55, gain: 0.048 });

    const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.boss.x, this.boss.y);
    if (dist < profile.range) {
      this.boss.hp -= profile.damage;
      musicManager.playSfx("enemyHit", { throttleMs: 70, gain: 0.04, pitch: 0.82 });
      this.bossHpText.setText(`Boss HP: ${this.boss.hp}`);
      this.hitSparkFx(this.boss.x, this.boss.y, profile.color, 2.2 + tier * 0.2);
    }

    const angle = Phaser.Math.Angle.Between(this.player.x, this.player.y, pointer.worldX, pointer.worldY);
    const offsetX = Math.cos(angle) * 38;
    const offsetY = Math.sin(angle) * 38;
    const fx = this.add.ellipse(this.player.x + offsetX, this.player.y + offsetY, 42, 18, profile.color, 0.9);
    fx.setRotation(angle);

    this.tweens.add({
      targets: fx,
      scale: 3.2 * profile.scale,
      alpha: 0,
      duration: 170,
      onComplete: () => fx.destroy()
    });
    this.cameras.main.shake(50, 0.002 + combo * 0.0008 + tier * 0.0004);
  }

  hitSparkFx(x, y, color, size = 1) {
    const burst = this.add.star(x, y, 6, 3 * size, 9 * size, color, 0.95);
    const ring = this.add.circle(x, y, 8 * size, color, 0.35);
    this.tweens.add({
      targets: [burst, ring],
      scaleX: 1.8,
      scaleY: 1.8,
      alpha: 0,
      duration: 140,
      onComplete: () => {
        burst.destroy();
        ring.destroy();
      }
    });
  }

  takeDamage(amount) {
    const now = this.time.now;
    if (now < this.invulnUntil) {
      return;
    }
    this.invulnUntil = now + 600;
    musicManager.playSfx("hurt", { throttleMs: 65, gain: 0.05 });
    this.state.hearts -= amount;
    this.updateHeartsUi();

    this.player.setTint(0xffa2a2);
    this.time.delayedCall(170, () => this.player?.clearTint());

    if (this.state.hearts <= 0) {
      this.state.hearts = this.state.maxHearts;
      this.scene.restart();
    }
  }

  tryDodge() {
    const now = this.time.now;
    if (now < this.dodgeCooldown) {
      return;
    }
    this.dodgeCooldown = now + Math.max(700, 1200 - this.abilityTier * 110);
    musicManager.playSfx("dodge", { throttleMs: 90, gain: 0.052 });
    this.invulnUntil = now + 420 + this.abilityTier * 70;
    this.dodgeBurstUntil = now + (150 + this.abilityTier * 20);

    const moveX = (this.cursors.left.isDown ? -1 : 0) + (this.cursors.right.isDown ? 1 : 0);
    const moveY = (this.cursors.up.isDown ? -1 : 0) + (this.cursors.down.isDown ? 1 : 0);
    if (moveX !== 0 || moveY !== 0) {
      this.dodgeVector.set(moveX, moveY).normalize();
    } else {
      const pointer = this.input.activePointer;
      this.dodgeVector.set(pointer.worldX - this.player.x, pointer.worldY - this.player.y);
      if (this.dodgeVector.lengthSq() < 0.001) {
        this.dodgeVector.set(1, 0);
      } else {
        this.dodgeVector.normalize();
      }
    }

    const ghostCount = 2 + this.abilityTier;
    for (let i = 0; i < ghostCount; i += 1) {
      const ghost = this.add.image(this.player.x, this.player.y, this.playerTextureKey);
      ghost.setDisplaySize(50, 50);
      ghost.setTint(0x77c6ff);
      this.time.delayedCall(i * 42, () => {
        this.tweens.add({
          targets: ghost,
          x: ghost.x - 12,
          alpha: 0,
          duration: 230,
          onComplete: () => ghost.destroy()
        });
      });
    }

    this.player.setTint(0x77c6ff);
    this.time.delayedCall(420, () => this.player?.clearTint());
  }

  trySpecial() {
    const now = this.time.now;
    if (now < this.specialCooldown) {
      return;
    }
    this.specialCooldown = now + Math.max(4200, 8500 - this.abilityTier * 900);
    musicManager.playSfx("special", { throttleMs: 120, gain: 0.058 });
    this.castSpecialWave();
  }

  castSpecialWave() {
    const tier = this.abilityTier;
    const colors = [0xf8cc65, 0x9fe8ff, 0xff6f6f];
    colors.forEach((color, idx) => {
      const ring = this.add.circle(this.player.x, this.player.y, 30 + idx * (14 + tier), color, 0.35);
      this.tweens.add({
        targets: ring,
        scale: 4 + idx + tier * 0.35,
        alpha: 0,
        duration: 320 + idx * 80 + tier * 30,
        onComplete: () => ring.destroy()
      });
    });

    this.hitSparkFx(this.boss.x, this.boss.y, 0xffe28c, 3 + tier * 0.2);
    musicManager.playSfx("enemyHit", { throttleMs: 70, gain: 0.045, pitch: 0.76 });
    this.boss.hp -= 2 + (tier >= 4 ? 1 : 0);
    this.bossHpText.setText(`Boss HP: ${this.boss.hp}`);
    const kb = new Phaser.Math.Vector2(this.boss.x - this.player.x, this.boss.y - this.player.y).normalize();
    this.boss.body.setVelocity(kb.x * (210 + tier * 24), kb.y * (210 + tier * 24));
    this.cameras.main.shake(180, 0.005 + tier * 0.0009);
  }

  endRun() {
    this.boss.destroy();
    this.boss = null;
    musicManager.playSfx("uiConfirm", { throttleMs: 120, gain: 0.065, pitch: 1.16 });
    musicManager.playCelebration();

    const { width, height } = this.scale;
    const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.85);
    const frame = this.add.image(width / 2, height / 2, "ui-popup-frame").setDisplaySize(920, 540);

    const heading = this.add
      .text(width / 2, 150, "All Memory Keys restored", {
        fontSize: "40px",
        color: "#f4efe3",
        stroke: "#000000",
        strokeThickness: 5
      })
      .setOrigin(0.5);

    const finalUrls = getMemoryMediaCandidates("final");
    const fallback = this.add
      .text(width / 2, 304, formatMemoryMediaHint(finalUrls), {
        fontSize: "24px",
        color: "#d4e0d5",
        align: "center",
        wordWrap: { width: width * 0.68 }
      })
      .setOrigin(0.5);

    let videoNode = null;
    if (finalUrls.some((u) => /\.(mp4|mov|webm)$/i.test(u))) {
      const video = document.createElement("video");
      video.controls = true;
      video.autoplay = true;
      video.playsInline = true;
      video.style.width = "720px";
      video.style.maxWidth = "100%";
      video.style.borderRadius = "8px";
      attachVideoSrcWithFallbacks(video, finalUrls, {
        onReady: () => fallback.setVisible(false),
        onFailed: () => fallback.setVisible(true)
      });
      videoNode = this.add.dom(width / 2, 304, video);
    }

    const end = this.add
      .text(width / 2, 500, "Press ENTER to return to title", {
        fontSize: "30px",
        color: "#90f07d",
        stroke: "#000000",
        strokeThickness: 4
      })
      .setOrigin(0.5);

    this.input.keyboard.once("keydown-ENTER", () => {
      musicManager.playSfx("uiConfirm", { throttleMs: 70, gain: 0.045, pitch: 1.05 });
      if (videoNode?.node?.pause) {
        videoNode.node.pause();
      }
      [overlay, frame, heading, fallback, end, videoNode].filter(Boolean).forEach((n) => n.destroy());
      this.state.hearts = this.state.maxHearts;
      this.state.secretRelicFound = false;
      this.state.unlockedAbilities = { slash: false, dodge: false, shoot: false, explosion: false };
      this.state.abilityTier = 1;
      this.state.dungeonProgress = {
        father_childhood: { completed: false, memoryKey: false },
        my_childhood: { completed: false, memoryKey: false },
        modern_day: { completed: false, memoryKey: false }
      };
        this.state.upgrades = {
          damageLevel: 0,
          cooldownLevel: 0,
          maxHeartUpgrades: 0,
          shieldCharges: 0,
          secretMemories: []
        };
        this.state.maxHearts = 3;
      this.state.memoryKeysCollected = 0;
      this.state.finalBossUnlocked = false;
      this.state.overworldMessage = "Three memory dungeons await.";
      this.scene.start("title");
    });
  }
}
