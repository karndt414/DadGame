import { writeFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(process.cwd());
const out = (p, c) => writeFileSync(resolve(root, p), `${c}\n`, "utf8");

const badge = (label, x = 10, y = 18) => `<text x="${x}" y="${y}" fill="#f4f7ff" font-family="Trebuchet MS" font-size="10" opacity="0.85">${label}</text>`;

const background = (name, a, b, accent) => `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1920 1080">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${a}"/>
      <stop offset="100%" stop-color="${b}"/>
    </linearGradient>
    <radialGradient id="fog" cx="50%" cy="22%" r="70%">
      <stop offset="0%" stop-color="${accent}" stop-opacity="0.33"/>
      <stop offset="100%" stop-color="#000000" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="1920" height="1080" fill="url(#bg)"/>
  <rect width="1920" height="1080" fill="url(#fog)"/>
  <g opacity="0.17" fill="none" stroke="#ffffff" stroke-width="2">
    <path d="M0 880 C260 820, 420 930, 710 860 C1000 790, 1290 920, 1920 820"/>
    <path d="M0 960 C280 900, 520 1010, 860 930 C1200 850, 1530 980, 1920 920"/>
  </g>
  <g opacity="0.19" fill="${accent}">
    <circle cx="300" cy="190" r="170"/>
    <circle cx="1560" cy="160" r="200"/>
    <circle cx="1020" cy="260" r="120"/>
  </g>
  ${badge(name, 22, 42)}
</svg>`;

const hero = (colorA, colorB, trim, mark) => `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96">
  <defs>
    <linearGradient id="cape" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${colorA}"/>
      <stop offset="100%" stop-color="${colorB}"/>
    </linearGradient>
  </defs>
  <ellipse cx="48" cy="84" rx="18" ry="8" fill="#000" opacity="0.28"/>
  <path d="M30 74 L66 74 L60 35 L36 35 Z" fill="url(#cape)" stroke="#172027" stroke-width="3"/>
  <circle cx="48" cy="28" r="12" fill="#f3ddc8" stroke="#1b1f24" stroke-width="3"/>
  <rect x="41" y="42" width="14" height="20" rx="5" fill="#d8e3f2" stroke="#1f2730" stroke-width="2"/>
  <path d="M26 72 Q48 55 70 72" fill="none" stroke="${trim}" stroke-width="4"/>
  <circle cx="48" cy="53" r="4" fill="${mark}"/>
</svg>`;

const enemy = (shape, p, q, glow, glyph) => `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96">
  <defs><radialGradient id="g" cx="50%" cy="35%" r="60%"><stop offset="0%" stop-color="${glow}"/><stop offset="100%" stop-color="${q}"/></radialGradient></defs>
  <ellipse cx="48" cy="84" rx="17" ry="7" fill="#000" opacity="0.3"/>
  ${shape === "orb" ? `<circle cx="48" cy="48" r="22" fill="url(#g)" stroke="${p}" stroke-width="4"/>` : ""}
  ${shape === "bot" ? `<rect x="28" y="30" width="40" height="36" rx="10" fill="url(#g)" stroke="${p}" stroke-width="4"/><rect x="22" y="42" width="8" height="18" rx="3" fill="${p}"/><rect x="66" y="42" width="8" height="18" rx="3" fill="${p}"/>` : ""}
  ${shape === "slime" ? `<path d="M22 56 Q30 28 48 28 Q66 28 74 56 Q74 72 48 72 Q22 72 22 56 Z" fill="url(#g)" stroke="${p}" stroke-width="4"/>` : ""}
  <path d="M34 46 L62 46" stroke="#121519" stroke-width="3" opacity="0.8"/>
  <circle cx="39" cy="46" r="4" fill="#f4f7ff"/><circle cx="57" cy="46" r="4" fill="#f4f7ff"/>
  <text x="48" y="63" text-anchor="middle" fill="${glyph}" font-size="10" font-family="Trebuchet MS">${glyph === "#" ? "STR" : glyph === "*" ? "SHT" : "REG"}</text>
</svg>`;

const boss = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160">
  <defs>
    <radialGradient id="core" cx="50%" cy="35%" r="60%">
      <stop offset="0%" stop-color="#ffd3de"/>
      <stop offset="100%" stop-color="#51364f"/>
    </radialGradient>
  </defs>
  <ellipse cx="80" cy="142" rx="34" ry="12" fill="#000" opacity="0.28"/>
  <path d="M44 38 L80 16 L116 38 L126 92 L80 126 L34 92 Z" fill="url(#core)" stroke="#1b1220" stroke-width="6"/>
  <circle cx="80" cy="76" r="18" fill="#ffe9f2" stroke="#47263a" stroke-width="5"/>
  <circle cx="72" cy="74" r="5" fill="#331727"/><circle cx="88" cy="74" r="5" fill="#331727"/>
  <path d="M68 88 Q80 98 92 88" fill="none" stroke="#5d324a" stroke-width="4"/>
  <path d="M18 64 L44 72" stroke="#2f1f31" stroke-width="8"/><path d="M142 64 L116 72" stroke="#2f1f31" stroke-width="8"/>
</svg>`;

const slash = (c1, c2) => `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 90">
  <defs><linearGradient id="s" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="${c1}"/><stop offset="100%" stop-color="${c2}"/></linearGradient></defs>
  <path d="M12 64 Q88 -4 168 24 Q104 28 36 80 Z" fill="url(#s)" stroke="#ffffff" stroke-opacity="0.45" stroke-width="3"/>
</svg>`;

const shot = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <defs><radialGradient id="p" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="#f7fdff"/><stop offset="100%" stop-color="#58b8ff"/></radialGradient></defs>
  <circle cx="32" cy="32" r="14" fill="url(#p)"/>
  <path d="M32 8 L39 24 L56 32 L39 40 L32 56 L25 40 L8 32 L25 24 Z" fill="#bfe8ff" opacity="0.62"/>
</svg>`;

const explosion = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160">
  <circle cx="80" cy="80" r="26" fill="#fff2c4"/>
  <circle cx="80" cy="80" r="46" fill="#ffd07a" opacity="0.72"/>
  <circle cx="80" cy="80" r="66" fill="#ff8f7d" opacity="0.42"/>
  <path d="M80 8 L90 42 L124 36 L98 58 L120 82 L88 80 L80 112 L72 80 L40 82 L62 58 L36 36 L70 42 Z" fill="#fff0b8" opacity="0.8"/>
</svg>`;

const crystal = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 72 96">
  <defs><linearGradient id="c" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#fff9ca"/><stop offset="100%" stop-color="#f2b740"/></linearGradient></defs>
  <ellipse cx="36" cy="86" rx="16" ry="6" fill="#000" opacity="0.25"/>
  <path d="M36 8 L52 34 L44 74 L28 74 L20 34 Z" fill="url(#c)" stroke="#a56f1d" stroke-width="3"/>
  <path d="M36 8 L36 74" stroke="#fff8dd" stroke-opacity="0.6"/>
</svg>`;

const heartFull = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><path d="M24 41 L8 26 Q2 20 2 13 Q2 6 9 5 Q15 4 19 10 Q23 4 30 5 Q37 6 37 13 Q37 20 31 26 Z" fill="#ff6670" stroke="#8f2734" stroke-width="3"/></svg>`;
const heartEmpty = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><path d="M24 41 L8 26 Q2 20 2 13 Q2 6 9 5 Q15 4 19 10 Q23 4 30 5 Q37 6 37 13 Q37 20 31 26 Z" fill="#2a2e34" stroke="#77808b" stroke-width="3"/></svg>`;

const shrine = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect x="14" y="26" width="36" height="24" rx="5" fill="#d6d8d0" stroke="#546057" stroke-width="3"/>
  <path d="M10 26 L32 10 L54 26 Z" fill="#f1e9bf" stroke="#5a614f" stroke-width="3"/>
  <circle cx="32" cy="36" r="6" fill="#87d5ff"/>
</svg>`;

const relic = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <defs><radialGradient id="r" cx="50%" cy="38%" r="55%"><stop offset="0%" stop-color="#e2fbff"/><stop offset="100%" stop-color="#72cfe0"/></radialGradient></defs>
  <circle cx="32" cy="32" r="18" fill="url(#r)" stroke="#2a5c66" stroke-width="3"/>
  <path d="M32 16 L38 30 L52 32 L38 34 L32 48 L26 34 L12 32 L26 30 Z" fill="#f7ffff" opacity="0.7"/>
</svg>`;

const popupFrame = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 720">
  <defs><linearGradient id="pf" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#22342a"/><stop offset="100%" stop-color="#0f1714"/></linearGradient></defs>
  <rect x="24" y="24" width="1232" height="672" rx="28" fill="url(#pf)" stroke="#9bc08b" stroke-width="8"/>
  <rect x="48" y="48" width="1184" height="624" rx="20" fill="none" stroke="#496558" stroke-width="4"/>
</svg>`;

out("assets/tiles/zone1_meadow_bg.svg", background("Father Childhood", "#243a27", "#121d16", "#7fbf74"));
out("assets/tiles/zone2_golf_bg.svg", background("My Childhood", "#2b3d26", "#182115", "#9bc86f"));
out("assets/tiles/zone3_commerce_bg.svg", background("Overworld", "#1f2f36", "#10181c", "#74b1c6"));
out("assets/tiles/zone4_backyard_bg.svg", background("Modern Day", "#3f3125", "#1f1510", "#d4a26b"));
out("assets/tiles/final_arena_bg.svg", background("Final Arena", "#31203a", "#130e17", "#d495ff"));

out("assets/sprites/player/hero_idle.svg", hero("#4f8cd8", "#2c5b8d", "#8ad3ff", "#a8ecff"));
out("assets/sprites/player/hero_lv2.svg", hero("#5eaf7a", "#2d7250", "#a7f0b9", "#d6ffe2"));
out("assets/sprites/player/hero_lv3.svg", hero("#b98a52", "#7a4d26", "#f6d8a3", "#ffe7bf"));
out("assets/sprites/player/hero_lv4.svg", hero("#9b6ad2", "#5a3a94", "#dcb6ff", "#edd5ff"));
out("assets/sprites/player/hero_lv5.svg", hero("#d25e78", "#8f2f45", "#ffb9c9", "#ffdbe4"));

out("assets/sprites/enemies/meadow_scout.svg", enemy("bot", "#264f36", "#4d8659", "#88d89f", "+"));
out("assets/sprites/enemies/thorn_sentry.svg", enemy("orb", "#3c2f57", "#6f57a3", "#cab3ff", "*"));
out("assets/sprites/enemies/sap_slime.svg", enemy("slime", "#4f3b24", "#9b7a4c", "#f6d79f", "#"));
out("assets/sprites/enemies/golf_caddie_bot.svg", enemy("bot", "#304464", "#4f77a8", "#9fcbff", "+"));
out("assets/sprites/enemies/golf_flag_wisp.svg", enemy("orb", "#254f4f", "#3e8b8b", "#a6f2ee", "*"));
out("assets/sprites/enemies/golf_bunker_mite.svg", enemy("slime", "#5b482f", "#b39564", "#ffefc8", "#"));
out("assets/sprites/enemies/backyard_fence_imp.svg", enemy("bot", "#5a3628", "#9f664f", "#ffc9b3", "+"));
out("assets/sprites/enemies/backyard_lantern_bug.svg", enemy("orb", "#5f4320", "#b07a31", "#ffd68d", "*"));
out("assets/sprites/enemies/backyard_mower_bot.svg", enemy("bot", "#2f2d31", "#65646c", "#d0d2dc", "#"));

out("assets/sprites/bosses/memory_warden.svg", boss);
out("assets/sprites/effects/slash_lv1.svg", slash("#f8fff2", "#b5ffd1"));
out("assets/sprites/effects/slash_lv2.svg", slash("#e8f7ff", "#7ec5ff"));
out("assets/sprites/effects/slash_lv3.svg", slash("#fff2d8", "#ffb26b"));
out("assets/sprites/effects/slash_lv4.svg", slash("#ffe7f8", "#ff7fd3"));
out("assets/sprites/effects/crystal_shot.svg", shot);
out("assets/sprites/effects/crystal_explosion.svg", explosion);
out("assets/sprites/effects/yellow_crystal.svg", crystal);
out("assets/ui/heart_full.svg", heartFull);
out("assets/ui/heart_empty.svg", heartEmpty);
out("assets/ui/shrine_icon.svg", shrine);
out("assets/ui/relic_icon.svg", relic);
out("assets/ui/popup_frame.svg", popupFrame);

console.log("Art refresh generated.");
