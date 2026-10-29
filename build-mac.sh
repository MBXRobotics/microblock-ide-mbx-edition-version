#!/bin/bash
# Build the macOS app. Run this ON A MAC from the project folder:
#   bash build-mac.sh
# Output: dist/Microblock-IDE-MBX-Edition-<version>-mac-x64.zip
set -e
cd "$(dirname "$0")"

command -v node >/dev/null || { echo "Node.js not found. Install Node 16 or 18 (e.g. 'brew install node@18')."; exit 1; }
xcode-select -p >/dev/null 2>&1 || { echo "Xcode Command Line Tools missing. Run: xcode-select --install"; exit 1; }

# Mac tools must be executable (permissions are lost when copied from Windows)
chmod +x bin/arduino-cli/arduino-cli bin/esptool/esptool

# Remove Windows node_modules (native modules are built per-OS) and reinstall
rm -rf node_modules
npm install

# Build (native modules are rebuilt for Electron x64 automatically)
npx electron-builder --mac --x64

echo ""
echo "Done. App is in: dist/"
ls dist/*.zip
