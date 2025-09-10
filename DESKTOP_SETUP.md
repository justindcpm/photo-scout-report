# Desktop App Setup Instructions

## Prerequisites
Make sure you have Node.js installed on your system.

## Setup Steps

### 1. Add Scripts to package.json
You need to manually add these scripts to your `package.json` file:

```json
{
  "main": "electron.js",
  "scripts": {
    "electron": "concurrently \"npm run dev\" \"wait-on http://localhost:8080 && electron .\"",
    "electron-dev": "NODE_ENV=development electron .",
    "build-desktop": "npm run build && electron-builder --config electron-builder.json",
    "build-desktop-win": "npm run build && electron-builder --win --config electron-builder.json",
    "pack": "electron-builder --dir",
    "dist": "electron-builder"
  }
}
```

### 2. Development Mode
To run the app in development mode:
```bash
npm run electron
```

### 3. Build for Production
To build the Windows installer:
```bash
npm run build-desktop-win
```

Or use the build script:
```bash
node build-desktop.js
```

### 4. Find Your App
After building, you'll find the installer in the `dist-electron` folder:
- Windows: `.exe` installer file
- The installer will create a desktop shortcut and start menu entry

## Features Added
- Native Windows application
- File menu with keyboard shortcuts
- Auto-updater ready
- Proper app icon and metadata
- Installable with desktop shortcut

## Customization
- Replace `public/favicon.ico` with your app icon
- Edit `electron-builder.json` to customize installer options
- Modify `electron.js` to change window behavior

## Troubleshooting
- If the build fails, make sure all dependencies are installed: `npm install`
- For Windows code signing, you'll need a certificate
- For distribution, consider setting up auto-updates

## Alternative Options
If Electron feels too heavy, consider:
- **Tauri** (Rust-based, smaller bundle)
- **PWA** (installable from browser)
- **Capacitor** (also supports desktop)