#!/bin/zsh
set -e

SCRIPT_DIR="${0:A:h}"
REPO_DIR="${SCRIPT_DIR:h}"
APP_SRC="$REPO_DIR/Minecraft Codex.app"
APP_DST="/Applications/Minecraft Codex.app"

echo "Installing Minecraft Codex..."
echo

if [ ! -d "$APP_SRC" ]; then
  echo "Could not find Minecraft Codex.app next to this installer."
  echo
  echo "Press any key to close."
  read -k 1
  exit 1
fi

if [ -d "$APP_DST" ]; then
  rm -rf "$APP_DST"
fi

cp -R "$APP_SRC" "$APP_DST"
chmod +x "$APP_DST/Contents/MacOS/MinecraftCodex"
xattr -dr com.apple.quarantine "$APP_DST" 2>/dev/null || true
xattr -cr "$APP_DST" 2>/dev/null || true

echo "Done. Minecraft Codex is now in Applications."
echo "Open it from Applications like a normal app."
echo
echo "Press any key to close."
read -k 1
