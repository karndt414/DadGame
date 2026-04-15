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
  unlockedAbilities: { slash: false, dodge: false, shoot: false, explosion: false },
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
  fairyHeartBonus: 0,
  bigFattyGiftClaimed: false,
  deathCount: 0,
  swordHintShownAfterFirstDeath: false,
  overworldIntroMessage: "",
  memoryKeysCollected: 0,
  finalBossUnlocked: false,
  overworldMessage: "Three memory dungeons await."
};

const dungeons = [
  {
    id: "father_childhood",
    name: "The Forgotten Past",
    subtitle: "How did you begin?",
    mood: "zone1",
    key: "dungeon-father-childhood",
    color: 0x6b8cff,
    enemyCount: 8,
    bossHp: 16,
    popupId: 1,
    rewardAbility: "dodge",
    unlockTier: 2,
    shrineQuestionIds: ["q02_adventure_game", "q04_prop_crew"]
  },
  {
    id: "my_childhood",
    name: "Recent History",
    subtitle: "What were you?",
    mood: "zone2",
    key: "dungeon-my-childhood",
    color: 0xd4a017,
    enemyCount: 9,
    bossHp: 18,
    popupId: 2,
    rewardAbility: "shoot",
    unlockTier: 3,
    shrineQuestionIds: ["q01_mini_golf"]
  },
  {
    id: "modern_day",
    name: "The Modern Era",
    subtitle: "What have you become?",
    mood: "zone4",
    key: "dungeon-modern-day",
    color: 0x5ce1e6,
    enemyCount: 10,
    bossHp: 20,
    popupId: 3,
    rewardAbility: "explosion",
    unlockTier: 4,
    shrineQuestionIds: ["q03_grilling"]
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
