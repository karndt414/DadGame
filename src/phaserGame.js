import Phaser from "phaser";
import triviaData from "./data/triviaQuestions.json";
import { getInitialMediaPathsForState } from "./game/memoryMedia";
import { BootScene } from "./scenes/BootScene";
import { TitleScene } from "./scenes/TitleScene";
import { OverworldScene } from "./scenes/OverworldScene";
import { DungeonScene } from "./scenes/DungeonScene";
import { FinalBossScene } from "./scenes/FinalBossScene";

const gameState = {
  hearts: 3,
  maxHearts: 3,
  activePowerup: null,
  secretRelicFound: false,
  mediaPaths: getInitialMediaPathsForState(),
  trivia: triviaData.questions,
  unlockedAbilities: { slash: true, dodge: false, shoot: false, explosion: false },
  abilityTier: 1,
  dungeonProgress: {
    father_childhood: { completed: false, memoryKey: false },
    my_childhood: { completed: false, memoryKey: false },
    modern_day: { completed: false, memoryKey: false }
  },
  upgrades: {
    damageLevel: 0,
    cooldownLevel: 0,
    maxHeartUpgrades: 0,
    shieldCharges: 0,
    secretMemories: []
  },
  memoryKeysCollected: 0,
  finalBossUnlocked: false,
  overworldMessage: "Three memory dungeons await."
};

const dungeons = [
  {
    id: "father_childhood",
    name: "Father Childhood",
    subtitle: "1980s Arcade Trench",
    mood: "zone1",
    key: "dungeon-father-childhood",
    color: 0x6b8cff,
    enemyCount: 8,
    bossHp: 16,
    popupId: 1,
    rewardAbility: "dodge",
    unlockTier: 2,
    shrineQuestionId: "q02_adventure_game"
  },
  {
    id: "my_childhood",
    name: "My Childhood",
    subtitle: "Early 2000s Hero Realm",
    mood: "zone2",
    key: "dungeon-my-childhood",
    color: 0xd4a017,
    enemyCount: 9,
    bossHp: 18,
    popupId: 2,
    rewardAbility: "shoot",
    unlockTier: 3,
    shrineQuestionId: "q01_mini_golf"
  },
  {
    id: "modern_day",
    name: "Modern Day",
    subtitle: "Campus Studio Grid",
    mood: "zone4",
    key: "dungeon-modern-day",
    color: 0x5ce1e6,
    enemyCount: 10,
    bossHp: 20,
    popupId: 3,
    rewardAbility: "explosion",
    unlockTier: 4,
    shrineQuestionId: "q03_grilling"
  }
];

export function createGame(parentElement) {
  const config = {
    type: Phaser.AUTO,
    width: 1280,
    height: 720,
    parent: parentElement,
    backgroundColor: "#111111",
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: 1280,
      height: 720
    },
    physics: {
      default: "arcade",
      arcade: {
        debug: false
      }
    },
    dom: {
      createContainer: true
    },
    scene: [BootScene, TitleScene, OverworldScene, DungeonScene, FinalBossScene]
  };

  const game = new Phaser.Game(config);
  game.registry.set("state", structuredClone(gameState));
  game.registry.set("dungeons", dungeons);

  return game;
}
