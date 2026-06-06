#!/bin/zsh
set -e

SCRIPT_DIR="${0:A:h}"
REPO_DIR="${SCRIPT_DIR:h}"
APP_SRC="$REPO_DIR/Minecraft Codex Edition.app"
APP_DST="/Applications/Minecraft Codex Edition.app"

echo "Opening Minecraft Codex Edition..."
echo

if [ ! -d "$APP_DST" ]; then
  if [ ! -d "$APP_SRC" ]; then
    echo "Could not find Minecraft Codex Edition.app."
    echo
    echo "Press any key to close."
    read -k 1
    exit 1
  fi

  echo "Installing Minecraft Codex Edition into Applications first..."
  cp -R "$APP_SRC" "$APP_DST"
fi

chmod +x "$APP_DST/Contents/MacOS/MinecraftCodex" 2>/dev/null || true
xattr -dr com.apple.quarantine "$APP_DST" 2>/dev/null || true
xattr -cr "$APP_DST" 2>/dev/null || true
codesign --force --deep --sign - "$APP_DST" >/dev/null 2>&1 || true

open "$APP_DST"

echo "If Minecraft Codex Edition still does not open, right-click it in Applications and choose Open."
echo
echo "Press any key to close."
read -k 1
