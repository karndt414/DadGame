/**
 * Ordered memories shown after each dungeon boss (and secret relic).
 * Paths are under assets/media/ — add .mp4/.mov alongside names below when you have video exports.
 */

/** @typedef {{ kind: 'image' | 'video'; paths: string[] }} MemoryItem */

/** @type {Record<string, MemoryItem[]>} */
export const DUNGEON_MEMORY_GALLERIES = {
  father_childhood: [
    { kind: "image", paths: ["assets/media/dungeon_1_memory.jpeg"] },
    { kind: "image", paths: ["assets/media/dungeon_1_memory2.jpeg"] },
    { kind: "image", paths: ["assets/media/dungeon_1_memory3a.jpeg"] },
    { kind: "image", paths: ["assets/media/dungeon_1_memory3b.jpeg"] },
    { kind: "image", paths: ["assets/media/dungeon_1_memory4.jpeg"] },
    { kind: "video", paths: ["assets/media/dungeon_1_memory5a.mov", "assets/media/dungeon_1_memory5b.mov"] },
    { kind: "video", paths: ["assets/media/dungeon_1_memory6.mov"] },
    { kind: "video", paths: ["assets/media/dungeon_1_memory7.mov"] }
  ],
  my_childhood: [
    { kind: "image", paths: ["assets/media/dungeon_2_memory.JPEG"] },
    { kind: "video", paths: ["assets/media/dungeon_2_memory.mov", "assets/media/dungeon_2_memory2.mov"] },
    { kind: "video", paths: ["assets/media/dungeon_2_final_memory.mov"] }
  ],
  modern_day: [
    { kind: "video", paths: ["assets/media/dungeon_3_memory.mov"] },
    { kind: "video", paths: ["assets/media/dungeon_3_final_memory.mov"] }
  ]
};

/** Optional extra beat when finding the secret relic (not tied to a dungeon). */
export const SECRET_RELIC_GALLERY = [
  { kind: "image", paths: ["assets/media/F8A09748-9210-4525-9FBF-1927B58C95FD_1_201_a.jpeg"] }
];

export function getDungeonMemoryGallery(dungeonId) {
  const g = DUNGEON_MEMORY_GALLERIES[dungeonId];
  return g ? [...g] : [];
}

export function firstMediaPathForDungeon(dungeonId) {
  const g = DUNGEON_MEMORY_GALLERIES[dungeonId];
  return g?.[0]?.paths?.[0] ?? "";
}

export function isVideoPath(path) {
  return /\.(mp4|mov|webm|m4v)$/i.test(path || "");
}
