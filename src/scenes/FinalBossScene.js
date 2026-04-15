import Phaser from "phaser";
import { musicManager } from "../audio/musicManager";
import { attachVideoSrcWithFallbacks, formatMemoryMediaHint, getMemoryMediaCandidates } from "../game/memoryMedia";

const PLAYER_TEXTURE_KEYS = ["player-hero-lv1", "player-hero-lv2", "player-hero-lv3", "player-hero-lv4", "player-hero-lv5"];

export class FinalBossScene extends Phaser.Scene {
  constructor() {
    super("final-boss");
  }

  getBossPhase() {
    if (!this.boss || !this.bossMaxHp) {
      return 1;
    }
    const ratio = this.boss.hp / this.bossMaxHp;
    if (ratio <= 0.34) {
      return 3;
    }
    if (ratio <= 0.68) {
      return 2;
    }
    return 1;
  }

  clearBossHazards() {
    this.bossProjectiles?.forEach((projectile) => projectile.node?.destroy());
    this.bossProjectiles = [];
    this.bossRings?.forEach((ring) => ring.node?.destroy());
    this.bossRings = [];
    this.bossOrbiters?.forEach((orbiter) => orbiter.node?.destroy());
    this.bossOrbiters = [];
  }

  spawnBossProjectileVolley(now, phase) {
    const spreadCount = phase >= 3 ? 7 : phase === 2 ? 5 : 3;
    const spreadArc = phase >= 3 ? 0.9 : 0.6;
    const baseAngle = Phaser.Math.Angle.Between(this.boss.x, this.boss.y, this.player.x, this.player.y);
    const speed = 190 + phase * 24;
    const damage = phase >= 3 ? 2 : 1;

    for (let i = 0; i < spreadCount; i += 1) {
      const progress = spreadCount === 1 ? 0 : i / (spreadCount - 1);
      const angle = baseAngle + Phaser.Math.Linear(-spreadArc, spreadArc, progress);
      const projectile = this.add.circle(this.boss.x, this.boss.y, 11, phase >= 3 ? 0xff7b7b : 0x9fe8ff, 0.92);
      projectile.setStrokeStyle(3, 0x180d0d, 0.8);
      this.bossProjectiles.push({
        node: projectile,
        x: this.boss.x,
        y: this.boss.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        speed,
        damage,
        lifeUntil: now + 3200,
        homingStrength: phase >= 3 ? 0.045 : phase === 2 ? 0.03 : 0.02
      });
    }

    musicManager.playSfx("enemyShoot", { throttleMs: 60, gain: 0.045, pitch: 0.88 + phase * 0.06 });
  }

  spawnBossOrbiters(now, phase) {
    const orbiterCount = phase >= 3 ? 3 : 2;
    const baseRadius = 66 + phase * 6;
    const spinDirection = now % 2 === 0 ? 1 : -1;

    for (let i = 0; i < orbiterCount; i += 1) {
      const angle = (Math.PI * 2 * i) / orbiterCount;
      const orbiter = this.add.circle(this.boss.x, this.boss.y, 12, phase >= 3 ? 0xffd46d : 0xc9f4c7, 0.9);
      orbiter.setStrokeStyle(3, 0x1b201d, 0.85);
      this.bossOrbiters.push({
        node: orbiter,
        angle,
        radius: baseRadius + i * 10,
        spin: (0.018 + phase * 0.004) * spinDirection,
        damage: phase >= 3 ? 2 : 1
      });
    }

    musicManager.playSfx("special", { throttleMs: 120, gain: 0.04, pitch: 0.88 + phase * 0.04 });
  }

  updateBossHazards(now, deltaSeconds) {
    const playerX = this.player.x;
    const playerY = this.player.y;

    this.bossProjectiles = (this.bossProjectiles || []).filter((projectile) => {
      projectile.x += projectile.vx * deltaSeconds;
      projectile.y += projectile.vy * deltaSeconds;

      const steerAngle = Phaser.Math.Angle.Between(projectile.x, projectile.y, playerX, playerY);
      const targetVx = Math.cos(steerAngle) * projectile.speed;
      const targetVy = Math.sin(steerAngle) * projectile.speed;
      projectile.vx = Phaser.Math.Linear(projectile.vx, targetVx, projectile.homingStrength);
      projectile.vy = Phaser.Math.Linear(projectile.vy, targetVy, projectile.homingStrength);

      projectile.node.setPosition(projectile.x, projectile.y);
      projectile.lifeUntil -= deltaSeconds * 1000;

      const dist = Phaser.Math.Distance.Between(projectile.x, projectile.y, playerX, playerY);
      if (dist < 28) {
        this.takeDamage(projectile.damage);
        projectile.node.destroy();
        return false;
      }

      if (projectile.lifeUntil <= 0 || projectile.x < -80 || projectile.x > this.scale.width + 80 || projectile.y < -80 || projectile.y > this.scale.height + 80) {
        projectile.node.destroy();
        return false;
      }

      return true;
    });

    this.bossRings = (this.bossRings || []).filter((ring) => {
      ring.radius += ring.expandSpeed * deltaSeconds;
      ring.lifeUntil -= deltaSeconds * 1000;
      ring.node.setPosition(this.boss.x, this.boss.y);
      ring.node.setRadius(ring.radius);
      ring.node.setAlpha(Math.max(0, 0.16 - ring.radius / 2400));

      const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.boss.x, this.boss.y);
      const hitBand = Math.abs(dist - ring.radius) <= ring.thickness;
      if (hitBand && !ring.hitPlayer) {
        ring.hitPlayer = true;
        this.takeDamage(ring.damage);
      }

      if (ring.lifeUntil <= 0 || ring.radius > Math.max(this.scale.width, this.scale.height)) {
        ring.node.destroy();
        return false;
      }

      return true;
    });

    this.bossOrbiters = (this.bossOrbiters || []).filter((orbiter) => {
      orbiter.angle += orbiter.spin;
      const orbitX = this.boss.x + Math.cos(orbiter.angle) * orbiter.radius;
      const orbitY = this.boss.y + Math.sin(orbiter.angle) * orbiter.radius;
      orbiter.node.setPosition(orbitX, orbitY);

      if (Phaser.Math.Distance.Between(orbitX, orbitY, playerX, playerY) < 30) {
        this.takeDamage(orbiter.damage);
      }

      if (!this.boss) {
        orbiter.node.destroy();
        return false;
      }

      return true;
    });
  }

  updateBossBehavior(now) {
    if (!this.boss) {
      return;
    }

    const phase = this.getBossPhase();
    if (phase !== this.bossPhase) {
      this.bossPhase = phase;
      this.bossPhaseUntil = now + 900;
      this.boss.setTint(phase === 3 ? 0xffb17d : phase === 2 ? 0x93d7ff : 0xffffff);
      this.cameras.main.shake(180, 0.004 + phase * 0.001);
      this.time.delayedCall(650, () => this.boss?.clearTint());
      this.clearBossHazards();
      this.spawnBossOrbiters(now, phase);
      this.bossNextVolleyAt = now + 240;
      this.bossNextOrbitAt = now + 1400;
      this.bossNextDashAt = now + 900;
    }

    const playerVector = new Phaser.Math.Vector2(this.player.x - this.boss.x, this.player.y - this.boss.y);
    const distance = playerVector.length() || 1;
    playerVector.normalize();
    const sideways = new Phaser.Math.Vector2(-playerVector.y, playerVector.x);
    const strafeDirection = Math.sin(now / (640 - phase * 40)) >= 0 ? 1 : -1;
    const chaseSpeed = [112, 138, 162][phase - 1];
    const strafeSpeed = [28, 44, 60][phase - 1] * strafeDirection;

    const targetX = playerVector.x * chaseSpeed + sideways.x * strafeSpeed;
    const targetY = playerVector.y * chaseSpeed + sideways.y * strafeSpeed;
    this.boss.body.setVelocity(targetX, targetY);

    if (now >= (this.bossNextDashAt || 0)) {
      this.bossNextDashAt = now + [2300, 1850, 1450][phase - 1];
      this.bossDashEndAt = now + 180;
      this.bossDashVector = new Phaser.Math.Vector2(this.player.x - this.boss.x, this.player.y - this.boss.y);
      if (this.bossDashVector.lengthSq() < 0.001) {
        this.bossDashVector.set(1, 0);
      } else {
        this.bossDashVector.normalize();
      }
      this.bossDashSpeed = [320, 360, 410][phase - 1];
      this.boss.setTint(0xffe28c);
      musicManager.playSfx("bossDash", { throttleMs: 65, gain: 0.06, pitch: 0.94 + phase * 0.05 });
      this.time.delayedCall(110, () => this.boss?.clearTint());
      this.hitSparkFx(this.boss.x + this.bossDashVector.x * 26, this.boss.y + this.bossDashVector.y * 26, 0xffe28c, 1.3 + phase * 0.15);
    }

    if (this.bossDashEndAt && now < this.bossDashEndAt) {
      this.boss.body.setVelocity(this.bossDashVector.x * this.bossDashSpeed, this.bossDashVector.y * this.bossDashSpeed);
    }

    if (now >= (this.bossNextVolleyAt || 0)) {
      this.bossNextVolleyAt = now + [2400, 1850, 1450][phase - 1];
      this.spawnBossProjectileVolley(now, phase);
    }

    if (phase >= 3 && now >= (this.bossNextOrbitAt || 0)) {
      this.bossNextOrbitAt = now + 3900;
      this.spawnBossOrbiters(now, phase);
    }

    if (this.bossPhaseUntil && now >= this.bossPhaseUntil) {
      this.bossPhaseUntil = 0;
      this.boss.clearTint();
    }

    if (distance < 56) {
      this.takeDamage(phase >= 3 ? 2 : 1);
    }
  }

  tryShoot(time) {
    if (time < this.shootCooldown || this.overlayBlock) {
      return;
    }
    if (!this.state.unlockedAbilities?.shoot) {
      return;
    }

    const pointer = this.input.activePointer;
    const angle = Phaser.Math.Angle.Between(this.player.x, this.player.y, pointer.worldX, pointer.worldY);
    const distance = 320 + this.abilityTier * 24;
    const toX = this.player.x + Math.cos(angle) * distance;
    const toY = this.player.y + Math.sin(angle) * distance;

    this.shootCooldown = time + Math.max(260, 760 - this.abilityTier * 60);
    musicManager.playSfx("shoot", { throttleMs: 55, gain: 0.046 });

    const shot = this.add.image(this.player.x, this.player.y, "fx-crystal-shot");
    shot.setDisplaySize(26, 26).setRotation(angle + Math.PI / 2);
    this.tweens.add({
      targets: shot,
      x: toX,
      y: toY,
      alpha: 0,
      duration: 210,
      onComplete: () => shot.destroy()
    });

    const shotWidth = 34;
    const shotDamage = Math.max(2, 2 + (this.abilityTier >= 4 ? 1 : 0));
    const dirX = Math.cos(angle);
    const dirY = Math.sin(angle);

    const hitAlongPath = (target) => {
      const relX = target.x - this.player.x;
      const relY = target.y - this.player.y;
      const forward = relX * dirX + relY * dirY;
      if (forward < 0 || forward > distance) {
        return false;
      }
      const perp = Math.abs(relX * dirY - relY * dirX);
      return perp < shotWidth;
    };

    if (this.boss && hitAlongPath(this.boss)) {
      this.boss.hp -= shotDamage;
      this.bossHpText.setText(`Boss HP: ${this.boss.hp}`);
      this.hitSparkFx(this.boss.x, this.boss.y, 0x9fe8ff, 1.9 + this.abilityTier * 0.15);
    }
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
    this.bossMaxHp = 50;
    this.boss.hp = this.bossMaxHp;
    this.bossPhase = 1;
    this.bossNextDashAt = this.time.now + 900;
    this.bossNextVolleyAt = this.time.now + 520;
    this.bossNextOrbitAt = this.time.now + 2700;
    this.bossDashEndAt = 0;
    this.bossDashVector = new Phaser.Math.Vector2(0, 0);
    this.bossDashSpeed = 0;
    this.bossPhaseUntil = 0;
    this.bossProjectiles = [];
    this.bossRings = [];
    this.bossOrbiters = [];

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
      shoot: "F",
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

    const now = this.time.now;
    const deltaSeconds = Math.min(0.05, (this.game.loop.delta || 16.7) / 1000);
    this.updateBossBehavior(now);
    this.updateBossHazards(now, deltaSeconds);

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

    if (Phaser.Input.Keyboard.JustDown(this.cursors.dodge)) {
      this.tryDodge();
    }

    if (Phaser.Input.Keyboard.JustDown(this.cursors.shoot)) {
      this.tryShoot(now);
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
      this.state.overworldMessage = "Defeated by the Memory Warden. Return from the overworld when ready.";
      this.scene.start("overworld");
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
    this.clearBossHazards();
    this.boss.destroy();
    this.boss = null;
    musicManager.playSfx("uiConfirm", { throttleMs: 120, gain: 0.065, pitch: 1.16 });
    musicManager.stopAll({ resetStarted: true });

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
      musicManager.setVideoDuck(true);
      const video = document.createElement("video");
      video.preload = "auto";
      video.controls = true;
      video.autoplay = true;
      video.playsInline = true;
      video.style.width = `${width}px`;
      video.style.height = `${height}px`;
      video.style.maxWidth = "100%";
      video.style.maxHeight = "100%";
      video.style.objectFit = "contain";
      video.style.display = "block";
      video.style.background = "#000000";
      video.style.borderRadius = "0";
      attachVideoSrcWithFallbacks(video, finalUrls, {
        onReady: () => {
          fallback.setVisible(false);
          void video.play().catch(() => {});
        },
        onFailed: () => {
          musicManager.setVideoDuck(false);
          fallback.setVisible(true);
        }
      });
      video.onended = () => {
        musicManager.setVideoDuck(false);
      };
      videoNode = this.add.dom(width / 2, height / 2, video).setDepth(1000).setScrollFactor(0);
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
      musicManager.setVideoDuck(false);
      musicManager.stopAll({ resetStarted: true });
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
