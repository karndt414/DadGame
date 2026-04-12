/**
 * Ordered memories shown after each dungeon boss (and secret relic).
 * Paths are under assets/media/ — add .mp4/.mov alongside names below when you have video exports.
 */

const FATHER_PHOTOS = [
  "assets/media/392CE91A-8CB0-4BE1-A6C2-F8A9836B12D2_1_201_a.jpeg",
  "assets/media/5A41FD18-103E-43B8-A28A-C4503D48EB19_1_201_a.jpeg",
  "assets/media/B7EDF7F9-7E70-4721-9FBF-AB8969BAB7BC_1_201_a.jpeg",
  "assets/media/CE6DA6CF-4F58-4E8D-9C32-3AEFAA647D86_1_201_a.jpeg",
  "assets/media/F8A09748-9210-4525-9FBF-1927B58C95FD_1_201_a.jpeg"
];

/** @typedef {{ kind: 'image' | 'video'; paths: string[] }} MemoryItem */

/** @type {Record<string, MemoryItem[]>} */
export const DUNGEON_MEMORY_GALLERIES = {
  father_childhood: [
    ...FATHER_PHOTOS.map((path) => ({ kind: "image", paths: [path] })),
    { kind: "image", paths: ["assets/media/snow.jpeg"] },
    { kind: "image", paths: ["assets/media/Christmas.jpeg"] }
  ],
  my_childhood: [
    { kind: "image", paths: ["assets/media/graduation.jpeg"] },
    { kind: "image", paths: ["assets/media/babyKoree.jpeg"] },
    { kind: "image", paths: ["assets/media/hammer.jpeg"] },
    { kind: "image", paths: ["assets/media/volleyball.jpeg"] },
    { kind: "image", paths: ["assets/media/volleyball2.jpeg"] }
  ],
  modern_day: [
    { kind: "image", paths: ["assets/media/Bike.jpeg"] },
    { kind: "image", paths: ["assets/media/Present.jpeg"] }
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
