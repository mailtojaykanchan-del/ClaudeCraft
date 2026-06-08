# Minecraft Codex Edition

An offline Minecraft-style voxel game packaged as a Mac app with a download-only GitHub Pages site.

## Website

Open `index.html` for the public download website.
The playable game page is `game.html` so the Mac app can still update without turning the website into the game.

## Mac App

Download `Minecraft-Codex-Edition-Drag-Install.dmg`, open it, then drag `Minecraft Codex Edition.app` to Applications.
Double-click `Minecraft Codex Edition.app` to open the game in its own app window.
You can also double-click `installers/Install Minecraft Codex Edition.command` to copy it into `/Applications`.
If macOS says Apple cannot verify the app or installer, right-click it and choose Open once.
If macOS says the app is damaged or incomplete, double-click `installers/Open Minecraft Codex Edition.command` to clear quarantine and open it.

## Updates

The app opens its bundled `game.html` first, then checks `version.json` on GitHub Pages.
If `version.json` has a newer version, the app loads the newer game page inside the same app window.
When publishing a new update, upload `index.html`, `game.html`, `version.json`, and any changed download files to GitHub Pages.

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
- Crafting recipes and crafting tables
- Creative mode includes every placeable block
- Main-menu username chooser
- Username, friends list, and shared world-code lobby
- Codex chat answers for speed and incline
- Local no-sign-in Codex builder commands
- Trees, caves, ores, rivers, and biomes
