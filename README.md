# BELOW / Beneath RPG - Spore Grotto Level 1 Floor Only

This build keeps the existing player, inventory, UI, crafting, save, item, and combat systems.

Level 1 has been rebuilt as a clean authored starting point:

- old procedural mine room/corridor generation is not used for Level 1
- Level 1 is a large open floor-only room
- no ore deposits
- no mushrooms
- no props
- no cave wall decoration
- no enemies
- no portals drawn on the map
- the visible floor is composed from a repeatable Spore Grotto 32x32 floor tileset

Important files:

- `src/maps/mine.js` — Level 1 map definition
- `assets/levels/spore_level1_background.png` — composed floor-only Level 1 background
- `assets/levels/spore_floor_tileset_32.png` — repeatable source floor tileset strip

Run locally by opening `index.html`, or push the full folder contents to GitHub Pages.
