import Phaser from "phaser";
import { musicManager } from "../audio/musicManager";
import { SECRET_RELIC_GALLERY, getDungeonMemoryGallery } from "../game/memoryGalleries";
import { runMemorySequence } from "../game/runMemorySequence";

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

const DUNGEON_BACKGROUND_KEYS = {
  father_childhood: "bg-zone-1",
  my_childhood: "bg-zone-2",
  modern_day: "bg-zone-4"
};
const PLAYER_TEXTURE_KEYS = ["player-hero-lv1", "player-hero-lv2", "player-hero-lv3", "player-hero-lv4", "player-hero-lv5"];
const SLASH_FX_KEYS = ["fx-slash-lv1", "fx-slash-lv2", "fx-slash-lv3", "fx-slash-lv4"];
const ABILITY_LABELS = {
  slash: "Slash",
  dodge: "Dodge",
  shoot: "Crystal Shot",
  explosion: "Crystal Explosion"
};
const ABILITY_CONTROL_HINTS = {
  slash: "Control: Click to slash",
  dodge: "Control: SHIFT to dodge",
  shoot: "Control: F to fire Crystal Shot",
  explosion: "Control: SPACE to cast Crystal Explosion"
};
const ABILITY_POPUP_ICON = {
  slash: { key: "fx-slash-lv1", width: 126, height: 62 },
  dodge: { key: "player-hero-lv2", width: 76, height: 76 },
  shoot: { key: "fx-crystal-shot", width: 58, height: 58 },
  explosion: { key: "fx-crystal-explosion", width: 104, height: 104 }
};
const WORLD_SIZES = [
  { width: 2200, height: 1400 },
  { width: 2400, height: 1500 },
  { width: 2600, height: 1600 },
  { width: 2800, height: 1700 }
];
const DUNGEON_ENEMY_CLASS_KEYS = {
  father_childhood: {
    regular: "enemy-meadow-scout",
    strong: "enemy-sap-slime"
  },
  my_childhood: {
    regular: "enemy-golf-caddie-bot",
    strong: "enemy-golf-bunker-mite"
  },
  modern_day: {
    regular: "enemy-backyard-fence-imp",
    strong: "enemy-backyard-mower-bot"
  }
};

const ENEMY_AI_PROFILE = {
  speed: 122,
  touchDamage: 1,
  touchRange: 40,
  dashSpeedScale: 1.8,
  dashDurationMs: 190,
  dashCooldownMinMs: 950,
  dashCooldownMaxMs: 1350,
  dashTriggerRange: 260
};

const BOSS_TUNING = {
  hpScale: 0.78,
  baseSpeed: 78,
  dashSpeed: 195,
  dashDurationMs: 280,
  dashCooldownMs: 3400,
  pulseCooldownMs: 5000,
  pulseRadius: 165,
  contactCooldownMs: 1000
};

/** Mini-boss texture per dungeon (final boss uses boss-memory-warden). */
const DUNGEON_BOSS_TEXTURE = {
  father_childhood: "boss-trench-overlord",
  my_childhood: "boss-vault-tyrant",
  modern_day: "boss-sound-architect"
};

const DUNGEON_BOSS_LABEL = {
  father_childhood: "Trench Overlord",
  my_childhood: "Vault Tyrant",
  modern_day: "Sound Architect"
};

const LOOT_TYPES = {
  heart: { label: "Heart Upgrade", color: 0xff8c8c },
  shield: { label: "Barrier Shield", color: 0x8fd7ff },
  damage: { label: "Damage Sigil", color: 0xffd784 },
  cooldown: { label: "Swift Rune", color: 0xb5ffa8 }
};

const DUNGEON_ARCH_THEME = {
  father_childhood: { wall: 0x252a45, roomStroke: 0x6b8cff, defaultFloorAlpha: 0.42 },
  my_childhood: { wall: 0x1e3018, roomStroke: 0xc9a227, defaultFloorAlpha: 0.4 },
  modern_day: { wall: 0x151d2e, roomStroke: 0x5ce1e6, defaultFloorAlpha: 0.4 }
};

const DUNGEON_ROOM_LAYOUTS = {
  /* Narrow WEST tower start → wide plaza → lower pit + east spire (reads as a “T” on the map). */
  father_childhood: {
    playerSpawnRel: { x: 0.5, y: 0.82 },
    floorPattern: "pixelGrid",
    rooms: [
      { id: "entry", x: 50, y: 100, w: 300, h: 1200, floorFill: 0x1a2a4a, floorAlpha: 0.48 },
      { id: "plaza", x: 400, y: 100, w: 1380, h: 580, floorFill: 0x152238, floorAlpha: 0.38 },
      { id: "pit", x: 400, y: 720, w: 1720, h: 620, floorFill: 0x0f1830, floorAlpha: 0.45 },
      { id: "spire", x: 1830, y: 100, w: 320, h: 580, floorFill: 0x243a60, floorAlpha: 0.5 }
    ],
    walls: [
      { x: 335, y: 100, w: 35, h: 410 },
      { x: 335, y: 650, w: 35, h: 650 },
      { x: 400, y: 692, w: 520, h: 28 },
      { x: 1080, y: 692, w: 700, h: 28 },
      { x: 1788, y: 100, w: 42, h: 240 },
      { x: 1788, y: 420, w: 42, h: 260 }
    ],
    anchors: {
      playerStart: "entry",
      crystal: "spire",
      shrine: "plaza",
      relic: "pit",
      boss: "pit"
    }
  },
  /* Full-width TOP runway → central shaft + west wing + east vault (horizontal opener, not a box). */
  my_childhood: {
    playerSpawnRel: { x: 0.52, y: 0.58 },
    floorPattern: "diagonalHatch",
    rooms: [
      { id: "runway", x: 80, y: 60, w: 2240, h: 200, floorFill: 0x2a5018, floorAlpha: 0.45 },
      { id: "west", x: 80, y: 300, w: 880, h: 1120, floorFill: 0x1e4014, floorAlpha: 0.42 },
      { id: "shaft", x: 1000, y: 300, w: 400, h: 1120, floorFill: 0x254818, floorAlpha: 0.48 },
      { id: "vault", x: 1450, y: 300, w: 870, h: 1120, floorFill: 0x355020, floorAlpha: 0.44 }
    ],
    walls: [
      { x: 80, y: 258, w: 1080, h: 28 },
      { x: 1320, y: 258, w: 1000, h: 28 },
      { x: 962, y: 300, w: 36, h: 360 },
      { x: 962, y: 820, w: 36, h: 600 },
      { x: 1422, y: 300, w: 36, h: 420 },
      { x: 1422, y: 880, w: 36, h: 540 }
    ],
    anchors: {
      playerStart: "runway",
      crystal: "vault",
      shrine: "shaft",
      relic: "vault",
      boss: "vault"
    }
  },
  /* Southwest ENTRY pad + climb shaft + one huge ARENA (most of the map is one floor). */
  modern_day: {
    playerSpawnRel: { x: 0.48, y: 0.72 },
    floorPattern: "circuitLines",
    rooms: [
      { id: "entry", x: 100, y: 1050, w: 520, h: 500, floorFill: 0x122040, floorAlpha: 0.52 },
      { id: "climb", x: 100, y: 450, w: 520, h: 580, floorFill: 0x0c1830, floorAlpha: 0.46 },
      { id: "arena", x: 660, y: 90, w: 1820, h: 1450, floorFill: 0x0a1428, floorAlpha: 0.36 }
    ],
    walls: [
      { x: 100, y: 1035, w: 180, h: 28 },
      { x: 380, y: 1035, w: 240, h: 28 },
      { x: 638, y: 450, w: 32, h: 260 },
      { x: 638, y: 820, w: 32, h: 500 }
    ],
    anchors: {
      playerStart: "entry",
      crystal: "arena",
      shrine: "arena",
      relic: "arena",
      boss: "arena"
    }
  }
};

export class DungeonScene extends Phaser.Scene {
  constructor() {
    super("dungeon");

    this.player = null;
    this.playerBody = null;
    this.enemies = [];
    this.boss = null;
    this.heartIcons = [];
    this.dungeonText = null;
    this.statusText = null;
    this.attackCooldown = 0;
    this.dodgeCooldown = 0;
    this.specialCooldown = 0;
    this.invulnUntil = 0;
    this.shrine = null;
    this.currentQuestion = null;
    this.questionNodes = [];
    this.overlayBlock = null;
    this.secretRelic = null;
    this.popupNodes = [];
    this.comboStep = 0;
    this.hudPanel = null;
    this.statusPanel = null;
    this.abilityTier = 1;
    this.abilityText = null;
    this.playerTextureKey = "player-hero-lv1";
    this.abilityCrystal = null;
    this.unlockedAbilities = { slash: true, dodge: false, shoot: false, explosion: false };
    this.rewardAbility = "dodge";
    this.shootCooldown = 0;
    this.lockedAbilityPromptAt = 0;
    this.pauseLocks = 0;
    this.worldWidth = 2200;
    this.worldHeight = 1400;
    this.wallPadding = 40;
    this.dodgeBurstUntil = 0;
    this.dodgeVector = new Phaser.Math.Vector2(0, 0);
    this.enemyProjectiles = [];
    this.enemyDebugText = null;
    this.bossDashUntil = 0;
    this.bossDashCooldown = 0;
    this.bossPulseCooldown = 0;
    this.bossContactCooldown = 0;
    this.wallBodies = null;
    this.wallRects = [];
    this.roomZones = [];
    this.layoutAnchors = null;
    this.lootDrops = [];
    this.memoryEchoes = [];
    this.damageBonus = 0;
    this.cooldownBonus = 0;
    this.lastFootstepAt = 0;
  }

  init(data) {
    this.dungeonId = data.dungeonId || "father_childhood";
    this.dungeons = this.registry.get("dungeons") || [];
    this.state = this.registry.get("state");
    this.dungeon = this.dungeons.find((d) => d.id === this.dungeonId) || this.dungeons[0];
    this.dungeonOrderIndex = Math.max(0, this.dungeons.findIndex((d) => d.id === this.dungeon?.id));
    this.rewardAbility = this.dungeon?.rewardAbility || "dodge";

    this.abilityTier = Math.max(1, Math.min(4, this.state.abilityTier || 1));
    this.playerTextureKey = PLAYER_TEXTURE_KEYS[this.abilityTier - 1] || "player-hero-lv1";
    const worldSize = WORLD_SIZES[this.dungeonOrderIndex] || WORLD_SIZES[0];
    this.worldWidth = worldSize.width;
    this.worldHeight = worldSize.height;

    if (!this.state.unlockedAbilities) {
      this.state.unlockedAbilities = { slash: true, dodge: false, shoot: false, explosion: false };
    }
    if (!this.state.upgrades) {
      this.state.upgrades = {
        damageLevel: 0,
        cooldownLevel: 0,
        maxHeartUpgrades: 0,
        shieldCharges: 0,
        secretMemories: []
      };
    }
    this.unlockedAbilities = this.state.unlockedAbilities;
    this.damageBonus = this.state.upgrades.damageLevel || 0;
    this.cooldownBonus = this.state.upgrades.cooldownLevel || 0;
    this.state.maxHearts = clamp(3 + (this.state.upgrades.maxHeartUpgrades || 0), 3, 6);

    this.state.hearts = this.state.maxHearts;

    // Reset transient runtime state when re-entering this reusable scene.
    this.enemies = [];
    this.boss = null;
    this.shrine = null;
    this.secretRelic = null;
    this.overlayBlock = null;
    this.popupNodes = [];
    this.questionNodes = [];
    this.currentQuestion = null;
    this.comboStep = 0;
    this.shootCooldown = 0;
    this.lockedAbilityPromptAt = 0;
    this.abilityCrystal = null;
    this.pauseLocks = 0;
    this.dodgeBurstUntil = 0;
    this.dodgeVector.set(0, 0);
    this.enemyProjectiles = [];
    this.bossDashUntil = 0;
    this.bossDashCooldown = 0;
    this.bossPulseCooldown = 0;
    this.bossContactCooldown = 0;
    this.wallBodies = null;
    this.wallRects = [];
    this.roomZones = [];
    this.layoutAnchors = null;
    this.lootDrops = [];
    this.memoryEchoes = [];
    this.lastFootstepAt = 0;
  }

  create() {
    const { width, height } = this.scale;
    this.pauseLocks = 0;
    this.physics.world.resume();

    musicManager.setMood(this.dungeon?.mood || "zone1");
    musicManager.tryStart();

    const bgKey = DUNGEON_BACKGROUND_KEYS[this.dungeon?.id] || "bg-zone-1";
    this.add.image(this.worldWidth / 2, this.worldHeight / 2, bgKey).setDisplaySize(this.worldWidth, this.worldHeight);

    this.physics.world.setBounds(
      this.wallPadding,
      this.wallPadding,
      this.worldWidth - this.wallPadding * 2,
      this.worldHeight - this.wallPadding * 2
    );
    this.cameras.main.setBounds(0, 0, this.worldWidth, this.worldHeight);

    this.buildDungeonArchitecture();

    const layoutDef = DUNGEON_ROOM_LAYOUTS[this.dungeon?.id] || DUNGEON_ROOM_LAYOUTS.father_childhood;
    const spawnRel = layoutDef.playerSpawnRel || { x: 0.5, y: 0.5 };
    const playerSpawn = this.getAnchorPoint("playerStart", spawnRel.x, spawnRel.y);
    this.player = this.physics.add.image(playerSpawn.x, playerSpawn.y, this.playerTextureKey);
    this.player.setDisplaySize(48, 48);
    this.player.setCollideWorldBounds(true);
    this.playerBody = this.player.body;
    if (this.wallBodies) {
      this.physics.add.collider(this.player, this.wallBodies);
    }
    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);

    this.spawnEnemyWave(this.dungeon?.enemyCount || 8);

    this.hudPanel = this.add.rectangle(178, 58, 336, 86, 0x0b1110, 0.45).setStrokeStyle(2, 0x6f8e69, 0.65).setDepth(110).setScrollFactor(0);

    this.dungeonText = this.add.text(20, 14, this.dungeon?.name || "Memory Dungeon", {
      fontSize: "28px",
      color: "#f5e6b8",
      stroke: "#000000",
      strokeThickness: 3
    }).setDepth(120).setScrollFactor(0);

    this.abilityText = this.add
      .text(20, 44, this.getAbilityHudText(), {
        fontSize: "20px",
        color: "#cde8c1",
        stroke: "#000000",
        strokeThickness: 3
      })
      .setDepth(120)
      .setScrollFactor(0);

    this.createHeartsUi();

    this.statusPanel = this.add
      .rectangle(width / 2, height - 28, 760, 42, 0x0b1110, 0.5)
      .setStrokeStyle(2, 0x6f8e69, 0.65)
      .setDepth(110)
      .setScrollFactor(0);

    this.statusText = this.add.text(width / 2, height - 28, "Defeat all enemies", {
      fontSize: "22px",
      color: "#ecf0e6",
      stroke: "#000000",
      strokeThickness: 3
    }).setOrigin(0.5).setDepth(120).setScrollFactor(0);

    this.enemyDebugText = this.add.text(20, height - 58, "Enemy debug: waiting", {
      fontSize: "15px",
      color: "#d7f3ff",
      stroke: "#000000",
      strokeThickness: 2
    }).setDepth(120).setScrollFactor(0);

    this.cursors = this.input.keyboard.addKeys({
      up: "W",
      left: "A",
      down: "S",
      right: "D",
      dodge: "SHIFT",
      special: "SPACE",
      shoot: "F",
      interact: "E",
      a: "ONE",
      b: "TWO",
      c: "THREE",
      d: "FOUR"
    });

    this.input.on("pointerdown", this.onAttack, this);
    this.spawnAbilityCrystal();
    this.spawnSecretRelic();
    this.spawnLootDrops();
    this.spawnMemoryEchoes();

    const intro = this.dungeon?.subtitle
      ? `${this.dungeon.subtitle}: defeat enemies, beat the boss, recover the memory key.`
      : "Defeat enemies, beat the boss, recover the memory key.";
    this.setStatus(intro);
  }

  update(time) {
    if (!this.playerBody) {
      return;
    }

    const hasActiveOverlay = Boolean(this.overlayBlock || this.currentQuestion || this.popupNodes.length > 0);
    if (!hasActiveOverlay && this.pauseLocks > 0) {
      // Fail-safe: clear stale pause lock so gameplay cannot freeze permanently.
      this.pauseLocks = 0;
    }

    if (this.pauseLocks > 0 && hasActiveOverlay) {
      this.playerBody.setVelocity(0, 0);
      this.enemies.forEach((enemy) => enemy.body?.setVelocity(0, 0));
      this.boss?.body?.setVelocity(0, 0);
      return;
    }

    this.updateMovement();
    this.updateEnemies(time);
    this.updateLootCollection();
    this.updateEnemyDebugText();

    if (Phaser.Input.Keyboard.JustDown(this.cursors.dodge)) {
      this.tryDodge(time);
    }

    if (Phaser.Input.Keyboard.JustDown(this.cursors.shoot)) {
      this.tryShoot(time);
    }

    if (Phaser.Input.Keyboard.JustDown(this.cursors.special)) {
      this.trySpecial(time);
    }

    if (Phaser.Input.Keyboard.JustDown(this.cursors.interact)) {
      this.tryInteract();
    }

    if (this.boss && this.boss.hp <= 0) {
      this.handleBossDefeat();
    }

    if (!this.boss && this.enemies.length === 0 && !this.shrine) {
      this.spawnShrine();
      this.spawnBoss();
      this.setStatus("Optional trivia shrine available. Defeat the mini-boss.");
    }
  }

  buildDungeonArchitecture() {
    const layout = DUNGEON_ROOM_LAYOUTS[this.dungeon?.id] || DUNGEON_ROOM_LAYOUTS.father_childhood;
    this.layoutAnchors = layout.anchors;
    const theme = DUNGEON_ARCH_THEME[this.dungeon?.id] || DUNGEON_ARCH_THEME.father_childhood;

    this.roomZones = layout.rooms.map((room) => {
      const fill = room.floorFill ?? 0x101820;
      const alpha = room.floorAlpha ?? theme.defaultFloorAlpha ?? 0.4;
      const stroke = room.floorStroke ?? theme.roomStroke;
      const sw = room.strokeWidth ?? 2;
      const zone = this.add.rectangle(room.x + room.w / 2, room.y + room.h / 2, room.w, room.h, fill, alpha).setDepth(15);
      zone.setStrokeStyle(sw, stroke, 0.55);
      return { ...room, node: zone };
    });

    this.wallRects = [];
    this.wallBodies = this.physics.add.staticGroup();

    layout.walls.forEach((wall) => {
      if (wall.gap) {
        return;
      }
      const node = this.add.rectangle(wall.x + wall.w / 2, wall.y + wall.h / 2, wall.w, wall.h, theme.wall, 0.95).setDepth(65);
      this.physics.add.existing(node, true);
      this.wallBodies.add(node);
      this.wallRects.push(new Phaser.Geom.Rectangle(wall.x, wall.y, wall.w, wall.h));
    });

    this.drawFloorPatternOverlay(layout, theme);
  }

  drawFloorPatternOverlay(layout, theme) {
    const mode = layout.floorPattern;
    if (!mode) {
      return;
    }
    const g = this.add.graphics().setDepth(14);
    const c = theme.roomStroke;
    const a = 0.14;
    layout.rooms.forEach((room) => {
      const { x, y, w, h } = room;
      if (mode === "pixelGrid") {
        g.lineStyle(1, c, a);
        for (let px = x + 40; px < x + w; px += 40) {
          g.lineBetween(px, y, px, y + h);
        }
        for (let py = y + 40; py < y + h; py += 40) {
          g.lineBetween(x, py, x + w, py);
        }
      } else if (mode === "diagonalHatch") {
        g.lineStyle(2, c, a * 1.2);
        const step = 56;
        for (let i = -h; i < w + h; i += step) {
          g.lineBetween(x + i, y, x + i + h, y + h);
        }
      } else if (mode === "circuitLines") {
        g.lineStyle(1, c, a);
        for (let py = y + 80; py < y + h; py += 100) {
          g.lineBetween(x + 40, py, x + w - 40, py);
        }
        g.lineStyle(2, c, a * 0.8);
        for (let px = x + 120; px < x + w; px += 200) {
          g.lineBetween(px, y + 60, px, y + h - 60);
        }
      }
    });
  }

  getRoomById(roomId) {
    return this.roomZones.find((room) => room.id === roomId) || this.roomZones[0];
  }

  getAnchorPoint(anchorKey, relX = 0.5, relY = 0.5) {
    const roomId = this.layoutAnchors?.[anchorKey];
    const room = this.getRoomById(roomId);
    if (!room) {
      return { x: this.worldWidth * relX, y: this.worldHeight * relY };
    }
    const fx = Phaser.Math.Clamp(relX, 0.05, 0.95);
    const fy = Phaser.Math.Clamp(relY, 0.05, 0.95);
    return { x: room.x + room.w * fx, y: room.y + room.h * fy };
  }

  getRandomPointInRoom(roomId, margin = 58) {
    const room = this.getRoomById(roomId);
    if (!room) {
      return {
        x: Phaser.Math.Between(this.wallPadding + 80, this.worldWidth - 80),
        y: Phaser.Math.Between(this.wallPadding + 80, this.worldHeight - 80)
      };
    }
    return {
      x: Phaser.Math.Between(Math.round(room.x + margin), Math.round(room.x + room.w - margin)),
      y: Phaser.Math.Between(Math.round(room.y + margin), Math.round(room.y + room.h - margin))
    };
  }

  pauseGameplay() {
    this.pauseLocks += 1;
    this.playerBody?.setVelocity(0, 0);
    this.enemies.forEach((enemy) => enemy.body?.setVelocity(0, 0));
    this.boss?.body?.setVelocity(0, 0);
  }

  resumeGameplay() {
    if (this.pauseLocks <= 0) {
      return;
    }
    this.pauseLocks -= 1;
  }

  getAbilityHudText() {
    const unlocked = Object.entries(this.unlockedAbilities)
      .filter(([, isUnlocked]) => isUnlocked)
      .map(([key]) => ABILITY_LABELS[key]);
    const list = unlocked.length ? unlocked.join(" / ") : "None";
    return `Abilities Lv.${this.abilityTier}: ${list}`;
  }

  updateAbilityHud() {
    this.abilityText?.setText(this.getAbilityHudText());
  }

  spawnAbilityCrystal() {
    if (this.unlockedAbilities[this.rewardAbility]) {
      this.updateAbilityHud();
      return;
    }

    const anchor = this.getAnchorPoint("crystal", 0.35, 0.3);
    const x = anchor.x;
    const y = anchor.y;
    this.abilityCrystal = this.add.image(x, y, "pickup-yellow-crystal").setDisplaySize(34, 44).setDepth(90);
    this.tweens.add({
      targets: this.abilityCrystal,
      y: this.abilityCrystal.y - 10,
      duration: 760,
      yoyo: true,
      repeat: -1
    });

    this.setStatus(`Collect the yellow crystal to unlock ${ABILITY_LABELS[this.rewardAbility]}.`);
  }

  collectAbilityCrystal() {
    if (!this.abilityCrystal) {
      return;
    }
    if (Phaser.Math.Distance.Between(this.player.x, this.player.y, this.abilityCrystal.x, this.abilityCrystal.y) > 54) {
      return;
    }

    this.unlockedAbilities[this.rewardAbility] = true;
    this.state.unlockedAbilities = this.unlockedAbilities;
    musicManager.playSfx("pickup", { throttleMs: 90, gain: 0.06, pitch: 1.08 });
    this.state.abilityTier = Math.max(this.state.abilityTier || 1, this.dungeon?.unlockTier || 2);
    this.abilityTier = Math.max(this.abilityTier, this.dungeon?.unlockTier || 2);

    const burst = this.add.image(this.abilityCrystal.x, this.abilityCrystal.y, "fx-crystal-explosion");
    burst.setDisplaySize(92, 92).setAlpha(0.85);
    this.tweens.add({
      targets: burst,
      scale: 1.35,
      alpha: 0,
      duration: 260,
      onComplete: () => burst.destroy()
    });

    this.abilityCrystal.destroy();
    this.abilityCrystal = null;

    this.updateAbilityHud();
    this.setStatus(`${ABILITY_LABELS[this.rewardAbility]} unlocked from the yellow crystal.`);
    this.showAbilityUnlockPopup(this.rewardAbility);
  }

  showAbilityUnlockPopup(abilityKey) {
    const { width, height } = this.scale;
    const iconConfig = ABILITY_POPUP_ICON[abilityKey] || ABILITY_POPUP_ICON.slash;

    musicManager.playCelebration();
    this.pauseGameplay();

    this.overlayBlock = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.56).setDepth(250).setScrollFactor(0);

    const frame = this.add.image(width / 2, height / 2, "ui-popup-frame").setDisplaySize(640, 300).setDepth(260).setScrollFactor(0);
    const heading = this.add
      .text(width / 2, height / 2 - 82, "Yellow Crystal Resonance", {
        fontSize: "38px",
        color: "#f5e6b8",
        stroke: "#000000",
        strokeThickness: 5
      })
      .setOrigin(0.5)
      .setDepth(270)
      .setScrollFactor(0);

    const icon = this.add.image(width / 2, height / 2 - 14, iconConfig.key).setDisplaySize(iconConfig.width, iconConfig.height).setDepth(271).setScrollFactor(0);
    const unlockedText = this.add
      .text(width / 2, height / 2 + 56, `${ABILITY_LABELS[abilityKey]} Unlocked`, {
        fontSize: "34px",
        color: "#8ff19d",
        stroke: "#000000",
        strokeThickness: 4
      })
      .setOrigin(0.5)
      .setDepth(272)
      .setScrollFactor(0);

    const hintText = this.add
      .text(width / 2, height / 2 + 94, ABILITY_CONTROL_HINTS[abilityKey] || "Control unlocked", {
        fontSize: "21px",
        color: "#dae4d2"
      })
      .setOrigin(0.5)
      .setDepth(272)
      .setScrollFactor(0);

    const promptText = this.add
      .text(width / 2, height / 2 + 124, "Power active now. Keep pushing forward.", {
        fontSize: "18px",
        color: "#c8d1c2"
      })
      .setOrigin(0.5)
      .setDepth(272)
      .setScrollFactor(0);

    const nodes = [this.overlayBlock, frame, heading, icon, unlockedText, hintText, promptText];
    this.time.delayedCall(1500, () => {
      nodes.forEach((n) => n.destroy());
      if (this.overlayBlock && !this.currentQuestion && this.popupNodes.length === 0) {
        this.overlayBlock = null;
      }
      this.resumeGameplay();
    });
  }

  showLockedAbilityHint(abilityKey) {
    const now = this.time.now;
    if (now - this.lockedAbilityPromptAt < 900) {
      return;
    }
    this.lockedAbilityPromptAt = now;
    this.setStatus(`Find the yellow crystal to unlock ${ABILITY_LABELS[abilityKey]}.`);
  }

  createHeartsUi() {
    this.heartIcons.forEach((icon) => icon.destroy());
    this.heartIcons = [];

    for (let i = 0; i < this.state.maxHearts; i += 1) {
      const key = i < this.state.hearts ? "ui-heart-full" : "ui-heart-empty";
      const icon = this.add.image(34 + i * 34, 68, key).setDisplaySize(28, 28).setOrigin(0.5).setDepth(120).setScrollFactor(0);
      this.heartIcons.push(icon);
    }
  }

  setStatus(text) {
    if (!this.statusText) {
      return;
    }
    this.statusText.setText(text);
    if (this.statusPanel) {
      this.statusPanel.width = Math.min(1080, Math.max(360, text.length * 11.2));
    }
  }

  updateHeartsUi() {
    this.heartIcons.forEach((icon, idx) => {
      icon.setTexture(idx < this.state.hearts ? "ui-heart-full" : "ui-heart-empty");
    });
  }

  updateMovement() {
    if (this.time.now < this.dodgeBurstUntil) {
      const dashSpeed = 560 + this.abilityTier * 35;
      this.playerBody.setVelocity(this.dodgeVector.x * dashSpeed, this.dodgeVector.y * dashSpeed);
      return;
    }

    const speed = 220;
    const vx = (this.cursors.left.isDown ? -1 : 0) + (this.cursors.right.isDown ? 1 : 0);
    const vy = (this.cursors.up.isDown ? -1 : 0) + (this.cursors.down.isDown ? 1 : 0);

    const len = Math.hypot(vx, vy) || 1;
    if ((vx !== 0 || vy !== 0) && this.time.now - this.lastFootstepAt > 165) {
      this.lastFootstepAt = this.time.now;
      musicManager.playSfx("footstep", { throttleMs: 45, gain: 0.03, pitch: 0.95 + this.dungeonOrderIndex * 0.05 });
    }
    this.playerBody.setVelocity((vx / len) * speed, (vy / len) * speed);
  }

  spawnEnemyWave(count) {
    const classKeys = DUNGEON_ENEMY_CLASS_KEYS[this.dungeon?.id] || DUNGEON_ENEMY_CLASS_KEYS.father_childhood;
    const roomIds = this.roomZones.map((room) => room.id);

    for (let i = 0; i < count; i += 1) {
      const enemyClass = i % 5 === 4 ? "strong" : "regular";
      const enemyKey = classKeys[enemyClass] || classKeys.regular;
      const roomId = roomIds[(i + 1) % roomIds.length] || "entry";
      const spawn = this.getRandomPointInRoom(roomId, 70);
      const profile = ENEMY_AI_PROFILE;

      const enemy = this.physics.add.image(spawn.x, spawn.y, enemyKey);

      enemy.setDisplaySize(enemyClass === "strong" ? 46 : 38, enemyClass === "strong" ? 46 : 38);
      enemy.setCollideWorldBounds(true);
      enemy.hp = enemyClass === "strong" ? 7 : 3;
      enemy.enemyClass = enemyClass;
      enemy.moveSpeed = profile.speed;
      enemy.touchDamage = enemyClass === "strong" ? 2 : 1;
      enemy.nextTouchAt = 0;
      enemy.dashUntil = 0;
      enemy.dashDir = new Phaser.Math.Vector2(1, 0);
      enemy.nextDashAt = this.time.now + Phaser.Math.Between(profile.dashCooldownMinMs, profile.dashCooldownMaxMs);
      enemy.lastDebugX = enemy.x;
      enemy.lastDebugY = enemy.y;
      enemy.body.setAllowGravity(false);
      enemy.body.setEnable(true);
      enemy.body.moves = true;
      enemy.body.setDrag(0, 0);
      if (this.wallBodies) {
        this.physics.add.collider(enemy, this.wallBodies);
      }
      this.physics.add.overlap(this.player, enemy, () => {
        const now = this.time.now;
        if (now > (enemy.nextTouchAt || 0)) {
          this.takeDamage(enemy.touchDamage || 1);
          musicManager.playSfx("hurt", { throttleMs: 70, gain: 0.045 });
          enemy.nextTouchAt = now + (enemy.enemyClass === "strong" ? 900 : 760);
        }
      });

      this.enemies.push(enemy);
    }
  }

  setEnemyVelocity(enemy, direction, speedScale = 1) {
    if (!enemy?.body || enemy.body.enable === false || !direction) {
      return;
    }

    const dx = direction.x;
    const dy = direction.y;
    if (!Number.isFinite(dx) || !Number.isFinite(dy)) {
      enemy.body.setVelocity(0, 0);
      return;
    }

    const len = Math.hypot(dx, dy);
    if (len < 0.0001) {
      enemy.body.setVelocity(0, 0);
      return;
    }

    const speed = (enemy.moveSpeed || 100) * speedScale;
    enemy.body.setVelocity((dx / len) * speed, (dy / len) * speed);
  }

  updateEnemies(now) {
    const playerPos = new Phaser.Math.Vector2(this.player.x, this.player.y);

    this.enemies.forEach((enemy) => {
      if (!enemy?.body || enemy.body.enable === false) {
        return;
      }

      const profile = ENEMY_AI_PROFILE;

      const dx = playerPos.x - enemy.x;
      const dy = playerPos.y - enemy.y;
      const dist = Math.hypot(dx, dy) || 1;
      const dirX = dx / dist;
      const dirY = dy / dist;

      if (now < (enemy.dashUntil || 0)) {
        enemy.body.setVelocity(dirX * profile.speed * profile.dashSpeedScale, dirY * profile.speed * profile.dashSpeedScale);
      } else if (now > (enemy.nextDashAt || 0) && dist < profile.dashTriggerRange) {
        enemy.dashDir.set(dirX, dirY);
        enemy.dashUntil = now + profile.dashDurationMs;
        enemy.nextDashAt = now + Phaser.Math.Between(profile.dashCooldownMinMs, profile.dashCooldownMaxMs);
        enemy.setTint(0xffc7a6);
        this.time.delayedCall(140, () => enemy?.active && enemy.clearTint());
        enemy.body.setVelocity(dirX * profile.speed * profile.dashSpeedScale, dirY * profile.speed * profile.dashSpeedScale);
      } else {
        enemy.body.setVelocity(dirX * profile.speed, dirY * profile.speed);
      }

    });

    this.updateEnemyProjectiles();

    if (this.boss?.body) {
      this.updateBossBehavior(playerPos, now);
    }
  }

  updateEnemyDebugText() {
    if (!this.enemyDebugText) {
      return;
    }

    const enemy = this.enemies.find((candidate) => candidate?.body && candidate.body.enable !== false);
    if (!enemy) {
      this.enemyDebugText.setText("Enemy debug: none active");
      return;
    }

    const deltaX = enemy.x - (enemy.lastDebugX ?? enemy.x);
    const deltaY = enemy.y - (enemy.lastDebugY ?? enemy.y);
    const velocity = enemy.body?.velocity?.length?.() || 0;

    this.enemyDebugText.setText(
      `Enemy debug: ${enemy.enemyClass || "regular"} x:${enemy.x.toFixed(1)} y:${enemy.y.toFixed(1)} ` +
        `dx:${deltaX.toFixed(2)} dy:${deltaY.toFixed(2)} v:${velocity.toFixed(2)}`
    );

    enemy.lastDebugX = enemy.x;
    enemy.lastDebugY = enemy.y;
  }

  spawnEnemyProjectile(x, y, direction, speed, damage = 1, color = 0xb6c8ff, ttl = 2200, radius = 6) {
    const dir = direction?.clone?.() || new Phaser.Math.Vector2(1, 0);
    if (dir.lengthSq() < 0.0001) {
      dir.set(1, 0);
    } else {
      dir.normalize();
    }

    const proj = this.add.circle(x, y, radius, color, 0.9).setDepth(102);
    proj.vx = dir.x * speed;
    proj.vy = dir.y * speed;
    proj.damage = damage;
    proj.expiresAt = this.time.now + ttl;
    this.enemyProjectiles.push(proj);
  }

  updateEnemyProjectiles() {
    if (!this.enemyProjectiles.length) {
      return;
    }

    const dt = this.game.loop.delta / 1000;
    this.enemyProjectiles = this.enemyProjectiles.filter((proj) => {
      if (!proj || !proj.active) {
        proj?.destroy();
        return false;
      }

      proj.x += proj.vx * dt;
      proj.y += proj.vy * dt;

      const expired = this.time.now > proj.expiresAt;
      const oob =
        proj.x < this.wallPadding ||
        proj.x > this.worldWidth - this.wallPadding ||
        proj.y < this.wallPadding ||
        proj.y > this.worldHeight - this.wallPadding;

      const hitPlayer = Phaser.Math.Distance.Between(proj.x, proj.y, this.player.x, this.player.y) < 18;
      if (hitPlayer) {
        this.takeDamage(proj.damage || 1);
        musicManager.playSfx("hurt", { throttleMs: 60, gain: 0.04, pitch: 1.05 });
      }

      if (expired || oob || hitPlayer) {
        proj.destroy();
        return false;
      }

      return true;
    });
  }

  updateBossBehavior(target, now) {
    const toPlayer = new Phaser.Math.Vector2(target.x - this.boss.x, target.y - this.boss.y);
    const dist = toPlayer.length();
    const dir = dist > 0.001 ? toPlayer.clone().normalize() : new Phaser.Math.Vector2(1, 0);

    if (now < this.bossDashUntil) {
      this.boss.body.setVelocity(dir.x * BOSS_TUNING.dashSpeed, dir.y * BOSS_TUNING.dashSpeed);
    } else if (now > this.bossDashCooldown) {
      this.bossDashUntil = now + BOSS_TUNING.dashDurationMs;
      this.bossDashCooldown = now + BOSS_TUNING.dashCooldownMs;
      musicManager.playSfx("bossDash", { throttleMs: 280, gain: 0.055, pitch: 0.78 });
      this.boss.setTint(0xff9ea1);
      this.time.delayedCall(300, () => this.boss?.clearTint());
    } else {
      this.boss.body.setVelocity(dir.x * BOSS_TUNING.baseSpeed, dir.y * BOSS_TUNING.baseSpeed);
    }

    if (dist < 44 && now > this.bossContactCooldown) {
      this.takeDamage(1);
      this.bossContactCooldown = now + BOSS_TUNING.contactCooldownMs;
    }

    if (now > this.bossPulseCooldown) {
      this.bossPulseCooldown = now + BOSS_TUNING.pulseCooldownMs;
      musicManager.playSfx("bossPulse", { throttleMs: 260, gain: 0.06, pitch: 0.85 });
      const pulse = this.add.circle(this.boss.x, this.boss.y, 28, 0xff8f8f, 0.28);
      this.tweens.add({
        targets: pulse,
        scale: 3.5,
        alpha: 0,
        duration: 380,
        onComplete: () => pulse.destroy()
      });

      if (dist < BOSS_TUNING.pulseRadius) {
        this.takeDamage(1);
      }
    }
  }

  onAttack(pointer) {
    const now = this.time.now;
    if (now < this.attackCooldown || this.overlayBlock) {
      return;
    }
    if (!this.unlockedAbilities.slash) {
      this.showLockedAbilityHint("slash");
      return;
    }
    const tier = this.abilityTier;
    const damageBonus = tier >= 3 ? 1 : 0;
    const rangeBonus = tier * 8;
    const cooldownBonus = (tier - 1) * 20 + (this.cooldownBonus || 0) * 16;

    const combo = this.comboStep % 3;
    const attackProfiles = [
      { cooldown: 240 - cooldownBonus, range: 98 + rangeBonus, arcWidth: 0.9 + tier * 0.02, damage: 1 + damageBonus, color: 0xf5f1da, scale: 1.0 + tier * 0.05 },
      { cooldown: 300 - cooldownBonus, range: 124 + rangeBonus, arcWidth: 1.22 + tier * 0.03, damage: 1 + damageBonus, color: 0x9fe8ff, scale: 1.25 + tier * 0.05 },
      { cooldown: 340 - cooldownBonus, range: 84 + rangeBonus, arcWidth: 0.56 + tier * 0.02, damage: 2 + damageBonus, color: 0xffd46d, scale: 0.9 + tier * 0.06 }
    ];
    const profile = attackProfiles[combo];
    this.attackCooldown = now + profile.cooldown;
    musicManager.playSfx("slash", { throttleMs: 55, gain: 0.045 + this.abilityTier * 0.004 });

    const attackArc = Phaser.Math.Angle.Between(this.player.x, this.player.y, pointer.worldX, pointer.worldY);
    const attackRange = profile.range;

    this.slashFx(attackArc, profile.color, profile.scale, combo, tier);
    this.comboStep += 1;

    this.enemies = this.enemies.filter((enemy) => {
      const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, enemy.x, enemy.y);
      if (dist > attackRange) {
        return true;
      }
      const a = Phaser.Math.Angle.Between(this.player.x, this.player.y, enemy.x, enemy.y);
      const delta = Phaser.Math.Angle.Wrap(a - attackArc);
      if (Math.abs(delta) < profile.arcWidth) {
        const scaledDamage = Math.max(1, Math.round(profile.damage * (1 + this.getDamageScaleBonus())));
        enemy.hp -= scaledDamage;
        musicManager.playSfx("enemyHit", { throttleMs: 45, gain: 0.032 });
        enemy.setTint(enemy.hp <= 1 ? 0xf18d8d : 0xffffff);
        this.hitSparkFx(enemy.x, enemy.y, profile.color, 1 + combo * 0.4 + tier * 0.12);
      }
      if (enemy.hp <= 0) {
        musicManager.playSfx("enemyDown", { throttleMs: 40, gain: 0.038 });
        this.hitSparkFx(enemy.x, enemy.y, 0xff6f6f, 1.8);
        enemy.destroy();
        return false;
      }
      return true;
    });

    if (this.boss) {
      const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.boss.x, this.boss.y);
      if (dist < attackRange + 12) {
        const scaledDamage = Math.max(1, Math.round(profile.damage * (1 + this.getDamageScaleBonus())));
        this.boss.hp -= scaledDamage;
        musicManager.playSfx("enemyHit", { throttleMs: 70, gain: 0.04, pitch: 0.85 });
        this.updateBossHpDisplay();
        this.hitSparkFx(this.boss.x, this.boss.y, profile.color, 2.1 + tier * 0.2);
      }
    }

    if (this.enemies.length === 0 && !this.boss) {
      this.setStatus("Enemies cleared. Mini-boss incoming.");
    }
  }

  slashFx(angle, color, scaleBoost, combo, tier) {
    const radius = 40 + combo * 6 + tier * 4;
    const offsetX = Math.cos(angle) * radius;
    const offsetY = Math.sin(angle) * radius;

    const slashKey = SLASH_FX_KEYS[Math.min(this.abilityTier, 4) - 1] || "fx-slash-lv1";
    const arc = this.add.image(this.player.x + offsetX, this.player.y + offsetY, slashKey);
    arc.setDisplaySize(98, 44);
    arc.setTint(color);
    arc.setRotation(angle + (combo === 2 ? 0 : Math.PI / 8));

    const trail = this.add.rectangle(this.player.x + offsetX * 0.5, this.player.y + offsetY * 0.5, 62, 8, color, 0.5);
    trail.setRotation(angle);

    const core = this.add.circle(this.player.x, this.player.y, 8, color, 0.85);

    this.cameras.main.shake(55, 0.002 + combo * 0.0008 + tier * 0.00045);

    this.tweens.add({
      targets: [arc, trail, core],
      scaleX: 1.9 * scaleBoost,
      scaleY: 1.25 * scaleBoost,
      alpha: 0,
      duration: 150 + combo * 20 + tier * 8,
      onComplete: () => {
        arc.destroy();
        trail.destroy();
        core.destroy();
      }
    });
  }

  hitSparkFx(x, y, color, size = 1) {
    const burst = this.add.star(x, y, 6, 3 * size, 9 * size, color, 0.95);
    const ring = this.add.circle(x, y, 8 * size, color, 0.35);
    this.tweens.add({
      targets: [burst, ring],
      scaleX: 1.8,
      scaleY: 1.8,
      alpha: 0,
      duration: 130,
      onComplete: () => {
        burst.destroy();
        ring.destroy();
      }
    });
  }

  tryDodge(time) {
    if (time < this.dodgeCooldown || this.overlayBlock) {
      return;
    }
    if (!this.unlockedAbilities.dodge) {
      this.showLockedAbilityHint("dodge");
      return;
    }
    this.dodgeCooldown = time + Math.max(760, 1200 - this.abilityTier * 110);
    musicManager.playSfx("dodge", { throttleMs: 80, gain: 0.05 });
    this.invulnUntil = time + 420 + this.abilityTier * 70;
    this.dodgeBurstUntil = time + (140 + this.abilityTier * 20);

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
      ghost.setDisplaySize(48, 48);
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
    this.time.delayedCall(420, () => {
      if (this.player) {
        this.player.clearTint();
      }
    });
  }

  trySpecial(time) {
    if (time < this.specialCooldown || this.overlayBlock) {
      return;
    }
    if (!this.unlockedAbilities.explosion) {
      this.showLockedAbilityHint("explosion");
      return;
    }
    this.specialCooldown = time + Math.max(3800, 8500 - this.abilityTier * 900 - (this.cooldownBonus || 0) * 240);
    musicManager.playSfx("special", { throttleMs: 100, gain: 0.056 });

    const colors = [0xf8cc65, 0x9fe8ff, 0xff6f6f];
    colors.forEach((color, idx) => {
      const ring = this.add.circle(this.player.x, this.player.y, 30 + idx * (14 + this.abilityTier), color, 0.35);
      this.tweens.add({
        targets: ring,
        scale: 4 + idx + this.abilityTier * 0.35,
        alpha: 0,
        duration: 320 + idx * 80 + this.abilityTier * 30,
        onComplete: () => ring.destroy()
      });
    });

    const shardCount = 12 + this.abilityTier * 4;
    for (let i = 0; i < shardCount; i += 1) {
      const angle = (Math.PI * 2 * i) / shardCount;
      const shard = this.add.rectangle(this.player.x, this.player.y, 26, 4, 0xffe8a3, 0.85);
      shard.setRotation(angle);
      this.tweens.add({
        targets: shard,
        x: this.player.x + Math.cos(angle) * (230 + this.abilityTier * 18),
        y: this.player.y + Math.sin(angle) * (230 + this.abilityTier * 18),
        alpha: 0,
        duration: 340 + this.abilityTier * 20,
        onComplete: () => shard.destroy()
      });
    }

    const explosion = this.add.image(this.player.x, this.player.y, "fx-crystal-explosion");
    explosion.setDisplaySize(120 + this.abilityTier * 22, 120 + this.abilityTier * 22).setAlpha(0.85);
    this.tweens.add({
      targets: explosion,
      scale: 1.45,
      alpha: 0,
      duration: 260,
      onComplete: () => explosion.destroy()
    });
    this.cameras.main.shake(180, 0.005 + this.abilityTier * 0.0009);

    const specialRadius = 220 + this.abilityTier * 28;
    const specialDamage = Math.max(2, Math.round((2 + (this.abilityTier >= 3 ? 1 : 0)) * (1 + this.getDamageScaleBonus())));
    const knockback = 210 + this.abilityTier * 26;

    this.enemies.forEach((enemy) => {
      const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, enemy.x, enemy.y);
      if (dist < specialRadius) {
        enemy.hp -= specialDamage;
        const kb = new Phaser.Math.Vector2(enemy.x - this.player.x, enemy.y - this.player.y).normalize();
        enemy.body.setVelocity(kb.x * knockback, kb.y * knockback);
        this.hitSparkFx(enemy.x, enemy.y, 0xffe28c, 1.6 + this.abilityTier * 0.15);
      }
    });

    this.enemies = this.enemies.filter((enemy) => {
      if (enemy.hp <= 0) {
        enemy.destroy();
        return false;
      }
      return true;
    });

    if (this.boss) {
      const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.boss.x, this.boss.y);
      if (dist < specialRadius + 20) {
        this.boss.hp -= specialDamage;
        this.updateBossHpDisplay();
        const kb = new Phaser.Math.Vector2(this.boss.x - this.player.x, this.boss.y - this.player.y).normalize();
        this.boss.body.setVelocity(kb.x * (190 + this.abilityTier * 22), kb.y * (190 + this.abilityTier * 22));
        this.hitSparkFx(this.boss.x, this.boss.y, 0xffe28c, 2.2 + this.abilityTier * 0.2);
      }
    }
  }

  tryShoot(time) {
    if (time < this.shootCooldown || this.overlayBlock) {
      return;
    }
    if (!this.unlockedAbilities.shoot) {
      this.showLockedAbilityHint("shoot");
      return;
    }

    const pointer = this.input.activePointer;
    const angle = Phaser.Math.Angle.Between(this.player.x, this.player.y, pointer.worldX, pointer.worldY);
    const distance = 320 + this.abilityTier * 24;
    const toX = this.player.x + Math.cos(angle) * distance;
    const toY = this.player.y + Math.sin(angle) * distance;

    this.shootCooldown = time + Math.max(260, 760 - this.abilityTier * 60 - (this.cooldownBonus || 0) * 35);
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
    const shotDamage = Math.max(2, Math.round((2 + (this.abilityTier >= 4 ? 1 : 0)) * (1 + this.getDamageScaleBonus())));
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

    this.enemies = this.enemies.filter((enemy) => {
      if (!hitAlongPath(enemy)) {
        return true;
      }
      enemy.hp -= shotDamage;
      this.hitSparkFx(enemy.x, enemy.y, 0x9fe8ff, 1.5 + this.abilityTier * 0.1);
      if (enemy.hp <= 0) {
        enemy.destroy();
        return false;
      }
      return true;
    });

    if (this.boss && hitAlongPath(this.boss)) {
      this.boss.hp -= shotDamage;
      this.updateBossHpDisplay();
      this.hitSparkFx(this.boss.x, this.boss.y, 0x9fe8ff, 1.9 + this.abilityTier * 0.15);
    }
  }

  updateBossHpDisplay() {
    if (!this.bossHpText || !this.boss) {
      return;
    }
    const label = DUNGEON_BOSS_LABEL[this.dungeon?.id] || "Boss";
    this.bossHpText.setText(`${label} · ${this.boss.hp} HP`);
  }

  spawnShrine() {
    const anchor = this.getAnchorPoint("shrine", 0.5, 0.2);
    const x = anchor.x;
    const y = anchor.y;
    this.shrine = this.add.image(x, y, "ui-shrine").setDisplaySize(42, 42);
    this.setStatus("Optional Trivia Shrine available (Press E nearby)");
  }

  spawnBoss() {
    const anchor = this.getAnchorPoint("boss", 0.84, 0.58);
    const bossX = anchor.x;
    const bossY = anchor.y;
    const bossKey = DUNGEON_BOSS_TEXTURE[this.dungeon?.id] || "boss-memory-warden";
    this.boss = this.physics.add.image(bossX, bossY, bossKey);
    this.boss.setDisplaySize(bossKey === "boss-vault-tyrant" ? 92 : 88, bossKey === "boss-vault-tyrant" ? 92 : 88);
    this.boss.clearTint();
    this.boss.setCollideWorldBounds(true);
    if (this.wallBodies) {
      this.physics.add.collider(this.boss, this.wallBodies);
    }
    this.boss.hp = Math.max(8, Math.round((this.dungeon?.bossHp || 16) * BOSS_TUNING.hpScale));
    this.bossDashUntil = 0;
    this.bossDashCooldown = this.time.now + 2400;
    this.bossPulseCooldown = this.time.now + 2600;
    this.bossContactCooldown = this.time.now;

    this.bossHpText = this.add.text(this.scale.width - 44, 20, "", {
      fontSize: "22px",
      color: "#ffc7c7",
      stroke: "#000000",
      strokeThickness: 3
    }).setOrigin(1, 0).setScrollFactor(0);
    this.updateBossHpDisplay();
  }

  spawnSecretRelic() {
    const anchor = this.getAnchorPoint("relic", 0.9, 0.14);
    const x = anchor.x;
    const y = anchor.y;
    this.secretRelic = this.add.image(x, y, "ui-relic").setDisplaySize(24, 24);
    this.tweens.add({
      targets: this.secretRelic,
      y: this.secretRelic.y - 8,
      duration: 700,
      yoyo: true,
      repeat: -1
    });
  }

  spawnLootDrops() {
    const roomIds = this.roomZones.map((room) => room.id);
    const lootCount = 5 + this.dungeonOrderIndex;
    for (let i = 0; i < lootCount; i += 1) {
      const roomId = roomIds[(i + 1) % roomIds.length] || "entry";
      const point = this.getRandomPointInRoom(roomId, 78);
      const roll = Phaser.Math.FloatBetween(0, 1);
      let type = "heart";
      if (roll > 0.82) {
        type = "cooldown";
      } else if (roll > 0.6) {
        type = "shield";
      } else if (roll > 0.34) {
        type = "damage";
      }

      const color = LOOT_TYPES[type].color;
      const orb = this.add.circle(point.x, point.y, 10, color, 0.9).setDepth(96);
      const halo = this.add.circle(point.x, point.y, 16, color, 0.2).setDepth(95);
      this.tweens.add({
        targets: [orb, halo],
        y: point.y - 5,
        duration: 760,
        yoyo: true,
        repeat: -1
      });

      this.lootDrops.push({ type, orb, halo, x: point.x, y: point.y, collected: false });
    }
  }

  spawnMemoryEchoes() {
    const roomIds = this.roomZones.map((room) => room.id);
    const echoesToSpawn = 2;
    for (let i = 0; i < echoesToSpawn; i += 1) {
      const roomId = roomIds[(i + 2) % roomIds.length] || "entry";
      const point = this.getRandomPointInRoom(roomId, 90);
      const node = this.add.image(point.x, point.y, "ui-relic").setDisplaySize(18, 18).setTint(0xb8f2ff).setDepth(97);
      this.tweens.add({
        targets: node,
        alpha: 0.35,
        duration: 520,
        yoyo: true,
        repeat: -1
      });
      this.memoryEchoes.push({ node, roomId, collected: false });
    }
  }

  updateLootCollection() {
    this.lootDrops.forEach((drop) => {
      if (drop.collected) {
        return;
      }
      const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, drop.x, drop.y);
      if (dist > 28) {
        return;
      }

      drop.collected = true;
      drop.orb.destroy();
      drop.halo.destroy();
      this.applyLootEffect(drop.type);
    });

    this.memoryEchoes.forEach((echo) => {
      if (echo.collected || !echo.node) {
        return;
      }
      const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, echo.node.x, echo.node.y);
      if (dist > 36) {
        return;
      }
      echo.collected = true;
      echo.node.destroy();
      this.registerSecretMemoryEcho(echo.roomId);
    });
  }

  applyLootEffect(type) {
    musicManager.playSfx("pickup", { throttleMs: 35, gain: 0.045 });
    if (type === "heart") {
      if ((this.state.upgrades.maxHeartUpgrades || 0) < 3) {
        this.state.upgrades.maxHeartUpgrades += 1;
      }
      this.state.maxHearts = clamp(3 + this.state.upgrades.maxHeartUpgrades, 3, 6);
      this.state.hearts = clamp(this.state.hearts + 1, 1, this.state.maxHearts);
      this.createHeartsUi();
      this.setStatus(`${LOOT_TYPES[type].label}: Max hearts now ${this.state.maxHearts}.`);
      return;
    }

    if (type === "shield") {
      this.state.upgrades.shieldCharges = clamp((this.state.upgrades.shieldCharges || 0) + 1, 0, 3);
      this.setStatus(`${LOOT_TYPES[type].label}: ${this.state.upgrades.shieldCharges} shield charge(s).`);
      return;
    }

    if (type === "damage") {
      this.state.upgrades.damageLevel = clamp((this.state.upgrades.damageLevel || 0) + 1, 0, 6);
      this.damageBonus = this.state.upgrades.damageLevel;
      this.setStatus(`${LOOT_TYPES[type].label}: Damage up x${(1 + this.getDamageScaleBonus()).toFixed(2)}.`);
      return;
    }

    this.state.upgrades.cooldownLevel = clamp((this.state.upgrades.cooldownLevel || 0) + 1, 0, 5);
    this.cooldownBonus = this.state.upgrades.cooldownLevel;
    this.setStatus(`${LOOT_TYPES[type].label}: Skills recharge faster.`);
  }

  registerSecretMemoryEcho(roomId) {
    const memoryKey = `${this.dungeon?.id || "dungeon"}:${roomId}:${this.state.upgrades.secretMemories.length}`;
    const current = this.state.upgrades.secretMemories || [];
    if (!current.includes(memoryKey)) {
      current.push(memoryKey);
      this.state.upgrades.secretMemories = current;
    }

    if ((this.state.upgrades.damageLevel || 0) < 6) {
      this.state.upgrades.damageLevel += 1;
      this.damageBonus = this.state.upgrades.damageLevel;
    }

    this.hitSparkFx(this.player.x, this.player.y, 0xb8f2ff, 1.6);
    musicManager.playSfx("secret", { throttleMs: 130, gain: 0.055 });
    this.setStatus("Secret memory discovered. Attack strength increased.");
  }

  getDamageScaleBonus() {
    return (this.damageBonus || 0) * 0.12;
  }

  tryInteract() {
    if (this.overlayBlock) {
      return;
    }

    musicManager.playSfx("interact", { throttleMs: 90, gain: 0.032 });

    this.collectAbilityCrystal();

    if (this.shrine && Phaser.Math.Distance.Between(this.player.x, this.player.y, this.shrine.x, this.shrine.y) < 70) {
      this.openQuestion();
      return;
    }

    if (this.secretRelic && Phaser.Math.Distance.Between(this.player.x, this.player.y, this.secretRelic.x, this.secretRelic.y) < 55) {
      this.state.secretRelicFound = true;
      this.secretRelic.destroy();
      this.secretRelic = null;
      runMemorySequence(this, "Secret Memory Found!", SECRET_RELIC_GALLERY, () => {
        this.setStatus("Secret relic found. Bonus memory unlocked.");
      });
    }
  }

  openQuestion() {
    this.pauseGameplay();
    musicManager.playSfx("uiConfirm", { throttleMs: 120, gain: 0.04 });
    this.overlayBlock = this.add
      .rectangle(this.scale.width / 2, this.scale.height / 2, this.scale.width, this.scale.height, 0x000000, 0.65)
      .setScrollFactor(0);

    this.currentQuestion = this.state.trivia.find((q) => q.id === this.dungeon?.shrineQuestionId) || this.state.trivia[0];

    const title = this.add.text(120, 120, "Memory Shrine", {
      fontSize: "36px",
      color: "#f0e6be"
    }).setScrollFactor(0);

    const prompt = this.add.text(120, 180, this.currentQuestion.prompt, {
      fontSize: "28px",
      color: "#f6f6f1",
      wordWrap: { width: this.scale.width - 240 }
    }).setScrollFactor(0);

    const choiceNodes = this.currentQuestion.choices.map((choice, idx) => {
      return this.add.text(140, 260 + idx * 52, `${idx + 1}. ${choice}`, {
        fontSize: "25px",
        color: "#d8e3ce"
      }).setScrollFactor(0);
    });

    const footer = this.add.text(120, 520, "Press 1-4 to answer", {
      fontSize: "22px",
      color: "#d1d4ca"
    }).setScrollFactor(0);

    this.questionNodes = [title, prompt, ...choiceNodes, footer];

    this.answerKeys = [this.cursors.a, this.cursors.b, this.cursors.c, this.cursors.d];
    this.answerListeners = this.answerKeys.map((key, idx) => key.on("down", () => this.resolveQuestion(idx)));
  }

  resolveQuestion(selectedIndex) {
    if (!this.currentQuestion) {
      return;
    }

    const correct = selectedIndex === this.currentQuestion.correctIndex;
    if (correct) {
      musicManager.playSfx("uiConfirm", { throttleMs: 100, gain: 0.05, pitch: 1.1 });
      this.state.hearts = clamp(this.state.hearts + 1, 1, this.state.maxHearts);
      this.updateHeartsUi();
      this.setStatus("Correct. You gained a heart or powerup.");
      if (this.shrine) {
        this.shrine.destroy();
        this.shrine = null;
      }
      this.closeQuestion();
      return;
    }

    musicManager.playSfx("hurt", { throttleMs: 70, gain: 0.05, pitch: 0.9 });
    this.takeDamage(1);
    this.setStatus(`Wrong answer. Hint: ${this.currentQuestion.hint}`);
    this.closeQuestion();
  }

  closeQuestion() {
    if (this.answerKeys) {
      this.answerKeys.forEach((key, idx) => {
        key.off("down", this.answerListeners?.[idx]);
      });
    }
    this.answerKeys = null;
    this.answerListeners = null;

    this.questionNodes.forEach((n) => n.destroy());
    this.questionNodes = [];

    if (this.overlayBlock) {
      this.overlayBlock.destroy();
      this.overlayBlock = null;
    }
    this.currentQuestion = null;
    musicManager.playSfx("uiConfirm", { throttleMs: 70, gain: 0.035, pitch: 0.95 });
    this.resumeGameplay();
  }

  takeDamage(amount) {
    const now = this.time.now;
    if (now < this.invulnUntil) {
      return;
    }

    if ((this.state.upgrades?.shieldCharges || 0) > 0) {
      this.state.upgrades.shieldCharges -= 1;
      musicManager.playSfx("shield", { throttleMs: 70, gain: 0.05 });
      this.invulnUntil = now + 350;
      this.player.setTint(0x8fd7ff);
      this.time.delayedCall(140, () => {
        if (this.player) {
          this.player.clearTint();
        }
      });
      this.setStatus(`Barrier shield absorbed hit (${this.state.upgrades.shieldCharges} charge left).`);
      return;
    }

    this.state.hearts -= amount;
    musicManager.playSfx("hurt", { throttleMs: 65, gain: 0.05 });
    this.updateHeartsUi();
    this.invulnUntil = now + 600;

    this.player.setTint(0xff9f9f);
    this.time.delayedCall(180, () => {
      if (this.player) {
        this.player.clearTint();
      }
    });

    if (this.state.hearts <= 0) {
      this.scene.restart({ dungeonId: this.dungeon?.id });
    }
  }

  handleBossDefeat() {
    if (!this.boss) {
      return;
    }

    if (this.shrine) {
      this.shrine.destroy();
      this.shrine = null;
    }

    this.boss.destroy();
    musicManager.playSfx("uiConfirm", { throttleMs: 120, gain: 0.06, pitch: 1.15 });
    this.boss = null;
    if (this.bossHpText) {
      this.bossHpText.destroy();
      this.bossHpText = null;
    }

    const progress = this.state.dungeonProgress?.[this.dungeon?.id];
    if (progress) {
      progress.completed = true;
      progress.memoryKey = true;
    }

    const wasUnlocked = Boolean(this.unlockedAbilities[this.rewardAbility]);
    this.state.abilityTier = Math.max(this.state.abilityTier || 1, this.dungeon?.unlockTier || 2);
    if (!wasUnlocked) {
      this.unlockedAbilities[this.rewardAbility] = true;
      this.state.unlockedAbilities = this.unlockedAbilities;
    }

    const completeCount = Object.values(this.state.dungeonProgress || {}).filter((d) => d?.completed).length;
    this.state.memoryKeysCollected = completeCount;
    this.state.finalBossUnlocked = completeCount >= 3;

    const rewardText = wasUnlocked
      ? "Memory key recovered."
      : `Memory key recovered. New power: ${ABILITY_LABELS[this.rewardAbility]}.`;
    this.state.overworldMessage = `${this.dungeon?.name || "Dungeon"} cleared. ${rewardText}`;

    const gallery = getDungeonMemoryGallery(this.dungeon?.id);
    runMemorySequence(this, `Memory Key restored: ${this.dungeon?.name || "Era"}`, gallery, () => {
      this.scene.start("overworld");
    });
  }
}
