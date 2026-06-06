# Minecraft Codex Edition

An offline Minecraft-style voxel game built in one HTML file with Three.js.

## Play

Open `index.html` in a browser. Keep `three.min.js` in the same folder.

## Mac App

Download `Minecraft-Codex-Edition-Drag-Install.dmg`, open it, then drag `Minecraft Codex Edition.app` to Applications.
You can also use `Minecraft-Codex-Edition-Installer.pkg` for the package installer.
Double-click `Minecraft Codex Edition.app` to open the game in its own app window.
You can also double-click `installers/Install Minecraft Codex Edition.command` to copy it into `/Applications`.
If macOS says Apple cannot verify the app or installer, right-click it and choose Open once.

## Updates

The app opens its bundled game first, then checks `version.json` on GitHub Pages.
If `version.json` has a newer version, the app loads the newer game page inside the same app window.
When publishing a new update, upload `index.html`, `version.json`, and any changed download files to GitHub Pages.

## Controls

- `WASD` move
- `Space` jump or fly upward in creative
- `Shift` sneak or fly downward in creative
- Left click break
- Right click place
- `C` craft
- `T` or `/` open the Minecraft Codex Edition builder
- `Esc` pause

## Features

- Survival and creative modes
- Infinite chunk loading
- Block breaking and survival inventory counts
- Crafting recipes
- Local no-sign-in Codex builder commands
- Trees, caves, ores, rivers, and biomes
