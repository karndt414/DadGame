# Art Direction Guide: Dad Quest

## Visual Goal
- Adventure game vibes with slight retro flavor.
- Nostalgia-first tone with warm, celebratory mood.
- Readable at monitor distance with family watching.

## Style Pillars
- Silhouette-first readability: character and enemies should be identifiable at a glance.
- Chunky stylization over realism: clean forms, low detail noise.
- Warm heroic palette: greens, ambers, deep blues, grill ember oranges.
- Mild retro treatment: crisp edges, limited gradients, optional 1px outline.

## Technical Specs
- Camera/game resolution target: 1280x720.
- Sprite source size (single frame): 64x64 for player/enemies, 96x96 for mini-bosses, 128x128 for final boss.
- UI icon base size: 32x32 and 64x64.
- Backgrounds: 1280x720 static or 512x512 tileable chunks.
- Format: PNG for production, SVG allowed for draft placeholders.

## Palette
- Hero cream: #F2F4EC
- Hero accent green: #4E7A4F
- Meadow: #3C5F3A
- Golf turf: #496F2E
- Commerce steel blue: #2F4E66
- Grill ember: #D06A2A
- Alert red: #B13E3E
- Gold reward: #E5C46A
- UI dark: #141816
- UI parchment: #EADFB8

## Character Direction
- Player hero: light tunic + subtle green accent + confident stance.
- Enemy families:
  - Meadow: organic shapes (slime, vine, thorn).
  - Golf: playful hazards (orb, bunker imp).
  - Commerce: geometric/tech motifs (phantoms, portal disruptor).
  - Backyard: ember wisps, weedlings, mower-themed dash enemy.

## Boss Direction
- Mini-bosses should clearly map to zone themes.
- Final boss combines motifs from all zones, with strongest silhouette of the set.

## UI Direction
- Hearts are highly legible with strong contrast.
- Button language: parchment cards + green confirm accent.
- Popup frame: celebratory but clean, does not hide media focus.

## Animation Targets
- Player: idle (6), run (8), attack (6), dodge (6), special (8), hurt (4).
- Enemy basic: idle (4), move (6), hit (3), defeat (4).
- Boss: idle (8), attack A (8), attack B (8), phase transition (10), defeat (10).

## Accessibility and Readability
- Keep foreground/background contrast strong.
- Do not use color alone for state changes (add shape, flash, or icon).
- Avoid ultra-thin linework.

## Production Order
1. Player base sprite + basic enemies.
2. Zone backgrounds and hazard icons.
3. Bosses.
4. UI icon set and popup frame.
5. Polish pass and consistency check.
