# microBlock IDE (Offline version)

Offline version of microBlock IDE

## Using

```bash
# Clone project
git clone --recurse-submodules https://github.com/microBlock-IDE/microBlock-IDE-offline.git

# Install electron-rebuild
npm install --save-dev electron-rebuild

# Install the dependencies 
npm install

# Run program
npm start
```

## Build installers

**Windows** (on a Windows PC): `npm run dist:win` → `dist/*.exe`

**macOS** (must be built on a Mac — Windows cannot build Mac apps):

1. Copy the whole project folder to the Mac (including `microBlock-IDE` and `bin`).
2. Install Xcode Command Line Tools: `xcode-select --install`
3. Install Node.js 16 or 18 (e.g. `brew install node@18`).
4. In the project folder run: `bash build-mac.sh`
5. Result: `dist/Microblock-IDE-MBX-Edition-<version>-mac-x64.zip`. Unzip and drag the app to *Applications*.

The Mac app is Intel (x64); it runs on Apple Silicon (M1/M2/M3/M4) through Rosetta, which macOS installs automatically on first launch.

The app is not code-signed, so macOS blocks it the first time. Users can either open
*System Settings → Privacy & Security* and click **Open Anyway**, or run once in Terminal:

```bash
xattr -cr "/Applications/Microblock IDE (MBX Edition).app"
```

Mac users connecting boards with CH340/CP210x USB chips may need the matching USB driver.

