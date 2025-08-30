# Screenshot Presenter

Screenshot Presenter turns any screenshot or image into a polished, share‑ready visual with a beautiful gradient background and a subtle frame. Use it in the browser or as a macOS desktop app that opens directly from Finder via “Open With” or a Quick Action.

## Features
- Auto styling: Derives a pleasant gradient from your image automatically.
- Custom gradient: Pick your own start/end colors, or shuffle the auto palette.
- Framing controls: Padding, corner radius, border size, and border opacity.
- Templates: Save named style presets with live thumbnails; apply with one click.
- Exports: Download as PNG or JPEG.
- Desktop app: Electron wrapper for macOS with image file associations — open images directly from Finder and the app renders them instantly.
- Local by design: All processing happens in your browser/the app; no uploads.

## Quick Start (Web)
1. Open `index.html` in a modern browser.
2. Drag & drop or click to upload an image.
3. Adjust styling as needed and click Download.

## Desktop App (macOS)
- Dev run:
  - `npm install`
  - `npm start`
- Build an installable app (DMG in `dist/`):
  - `npm run build:mac`
  - Open the DMG and drag “Screenshot Presenter” to Applications.
- “Open With”: After installation, right‑click any image → Open With → Screenshot Presenter.

Notes
- The app includes file associations for common image types (png, jpg/jpeg, webp, gif, tif/tiff).
- Builds are unsigned by default; on first launch, right‑click the app → Open.

## Quick Action (Finder Right‑Click)
Use either Shortcuts (macOS 12+) or Automator.

Shortcuts
- Open Shortcuts → New Shortcut.
- Details: Enable “Use as Quick Action”, set “Receive: Files” in “Finder”.
- Add action: “Open” and choose “Screenshot Presenter”.
- Save (e.g., “Style with Screenshot Presenter”).

Automator
- Open Automator → New → “Quick Action”.
- “Workflow receives current”: image files in Finder.
- Add “Open Finder Items”; set “Open with”: Screenshot Presenter.
- Save (e.g., “Style with Screenshot Presenter”).

## Project Structure
- `index.html` — App shell and controls
- `styles.css` — Dark, neumorphic UI styling and motion
- `app.js` — Canvas renderer, gradient generator, templates, downloads
- `electron-main.js` — Electron entry: loads UI, handles file open, default icon generator
- `package.json` — Scripts and `electron-builder` config (mac targets + file associations)
- `scripts/` — Utilities
  - `make-icon.sh` — Convert `build/icon.png` → `build/icon.icns`
  - `set-icon-from-path.sh` — Import any image and rebuild icon assets

## Icon
- The app uses `build/icon.icns` for the Dock icon. To update:
  - Replace `build/icon.png` with a 1024×1024 PNG and run `npm run make:icon`, or
  - Use `scripts/set-icon-from-path.sh /absolute/path/to/your/icon.png`.
  - Rebuild: `npm run build:mac`.

## How To Publish To GitHub
1. Create a new repository on GitHub (without adding a README/.gitignore there).
2. In the project folder, initialize Git and add a local `.gitignore`:
   - `git init`
   - Create `.gitignore` (example below) and save it.
3. Commit and push:
   - `git add .`
   - `git commit -m "Initial commit: Screenshot Presenter"`
   - `git branch -M main`
   - `git remote add origin https://github.com/<your-username>/<repo-name>.git`
   - `git push -u origin main`
4. Optional: Create a Release and upload the DMG from `dist/` so users can download the app directly.

Example `.gitignore`
```
node_modules/
.dist/
dist/
.DS_Store
npm-debug.log*
yarn-error.log
# Electron build caches
*.asar
**/.cache/
# Temporary icon assets
build/*.iconset/
```

## Roadmap Ideas
- Social size presets (1200×630, 1080×1350, etc.)
- Text/caption overlay with fonts and positioning
- Batch processing and multi-file queue from Quick Action
- Code-signing and notarization for smoother macOS installs

## License
Private project (no license specified). Add a license here if you plan to open-source it.

