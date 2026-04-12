# Asset Library

Starter and production art live under `assets/`. **Phaser loads paths from** [`src/scenes/BootScene.js`](../src/scenes/BootScene.js) `preload()`. The JSON index [`src/data/assetManifest.json`](../src/data/assetManifest.json) mirrors that list for authoring.

## Phaser texture key → file (production swaps)

Keep **keys** stable; replace the **file** at the path shown.

| Texture key | File | Memory / design beat |
|-------------|------|----------------------|
| `player-hero-lv1` | `sprites/player/hero_idle.svg` | Default hero (overworld + early dungeon) |
| `player-hero-lv2` | `sprites/player/hero_lv2.svg` | After Father Childhood — dodge era |
| `player-hero-lv3` | `sprites/player/hero_lv3.svg` | After My Childhood — shot era |
| `player-hero-lv4` | `sprites/player/hero_lv4.svg` | After Modern Day — explosion era |
| `player-hero-lv5` | `sprites/player/hero_lv5.svg` | Final boss presentation |
| `bg-zone-1` | `tiles/zone1_meadow_bg.svg` | Father Childhood dungeon mood |
| `bg-zone-2` | `tiles/zone2_golf_bg.svg` | My Childhood / mini golf |
| `bg-zone-3` | `tiles/zone3_commerce_bg.svg` | Overworld hub |
| `bg-zone-4` | `tiles/zone4_backyard_bg.svg` | Modern Day / backyard |
| `bg-final` | `tiles/final_arena_bg.svg` | Finale arena |
| `enemy-meadow-scout` | `sprites/enemies/meadow_scout.svg` | Zone 1 trash |
| `enemy-sap-slime` | `sprites/enemies/sap_slime.svg` | Zone 1 brute |
| `enemy-thorn-sentry` | `sprites/enemies/thorn_sentry.svg` | Zone 1 shooter |
| `enemy-golf-caddie-bot` | `sprites/enemies/golf_caddie_bot.svg` | Zone 2 trash |
| `enemy-golf-bunker-mite` | `sprites/enemies/golf_bunker_mite.svg` | Zone 2 brute |
| `enemy-golf-flag-wisp` | `sprites/enemies/golf_flag_wisp.svg` | Zone 2 shooter |
| `enemy-market-crate-crab` | `sprites/enemies/market_crate_crab.svg` | Hub / commerce flavor (loaded; optional future use) |
| `enemy-market-sign-sprite` | `sprites/enemies/market_sign_sprite.svg` | Hub / commerce flavor |
| `enemy-market-neon-orb` | `sprites/enemies/market_neon_orb.svg` | Hub / commerce flavor |
| `enemy-backyard-fence-imp` | `sprites/enemies/backyard_fence_imp.svg` | Zone 4 trash |
| `enemy-backyard-lantern-bug` | `sprites/enemies/backyard_lantern_bug.svg` | Zone 4 shooter |
| `enemy-backyard-mower-bot` | `sprites/enemies/backyard_mower_bot.svg` | Zone 4 brute |
| `boss-memory-warden` | `sprites/bosses/memory_warden.svg` | Dungeon + final boss |
| `ui-heart-full` / `ui-heart-empty` | `ui/heart_full.svg`, `ui/heart_empty.svg` | Life |
| `ui-shrine` / `ui-relic` | `ui/shrine_icon.svg`, `ui/relic_icon.svg` | Trivia / secret pickup |
| `ui-popup-frame` | `ui/popup_frame.svg` | Memory video frame |
| `fx-slash-lv1` … `fx-slash-lv4` | `sprites/effects/slash_lv*.svg` | Melee tier read |
| `fx-crystal-shot` | `sprites/effects/crystal_shot.svg` | Ranged ability |
| `fx-crystal-explosion` | `sprites/effects/crystal_explosion.svg` | Special |
| `pickup-yellow-crystal` | `sprites/effects/yellow_crystal.svg` | World pickup |

## Memory video slots (code source of truth)

Playback order and fallbacks are defined in [`src/game/memoryMedia.js`](../src/game/memoryMedia.js) (`MEMORY_MEDIA_CANDIDATES`). The game tries **`.mp4` first** (broad browser support), then **`.mov`** if present.

| Popup id | Dungeon / beat | Typical files on disk |
|----------|----------------|------------------------|
| `1` | Father Childhood — boss clear | `media/popup_01.mp4` |
| `2` | My Childhood — boss clear | `media/popup_02.mp4` or `popup_02.mov` |
| `3` | Modern Day — boss clear | `media/popup_03.mp4` or `popup_03.mov` |
| `5` | Secret relic (if triggered) | `media/popup_05_secret.mp4` or `popup_05_secret.mov` |
| `final` | After final boss | `media/final_video.mp4` or `final_video.mov` |

`media/popup_04.mp4` is on disk but **not wired** in `MEMORY_MEDIA_CANDIDATES` yet; add a slot there if you want a fourth beat.

`game.registry` state still exposes `mediaPaths` with **preferred** (first) URLs for debugging; UI playback uses the candidate lists above.

## Optional hero sprite sheet (run cycle)

1. Export a horizontal strip: **64×64** frames, **8** frames in one row → **512×64** PNG (adjust `endFrame` in code if fewer frames).
2. Save as `sprites/player/hero_sheet.png`.
3. In [`src/scenes/BootScene.js`](../src/scenes/BootScene.js), **uncomment** the `this.load.spritesheet(...)` block for `player-hero-sheet`.
4. [`src/game/spriteAnimConfig.js`](../src/game/spriteAnimConfig.js) registers `hero-sheet-run` and `hero-sheet-idle` in `BootScene.create` when that texture exists. Gameplay still uses SVG hero images until you switch objects to a `Sprite` and `play()` those keys (optional polish).

## Recommended production pass

1. Replace SVGs with PNG or animated sheets per [`docs/06_art_direction_guide.md`](../docs/06_art_direction_guide.md).
2. Re-encode memory clips to **H.264 `.mp4`** for Chrome/Edge; keep `.mov` as backup if you like.
3. Keep filenames stable or update [`memoryMedia.js`](../src/game/memoryMedia.js) and [`BootScene.js`](../src/scenes/BootScene.js) together.
