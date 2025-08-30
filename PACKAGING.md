Packaging and installing Screenshot Presenter as a macOS app

Overview
- One-time setup to generate app icon and build the .app.
- After installation, use “Open With” from Finder or create a Quick Action for right‑click use without Terminal.

Steps
1) Prepare the app icon (once)
- Easiest: generate the default icon included with the repo:
  npm run icon:default
  This creates build/icon.png and build/icon.icns automatically.
- Or, to use your own 1024×1024 PNG, place it at build/icon.png and run:
  npm run make:icon

2) Build the mac app (once per update)
- Install dependencies:
  npm install
- Build the app:
  npm run build:mac
- The output .dmg and .zip will be in the dist/ folder. Open the .dmg and drag “Screenshot Presenter” into Applications.

3) Use “Open With” directly (no Terminal)
- Right‑click any image in Finder → Open With → Screenshot Presenter.
- The app opens, auto‑applies the default styling, and is ready to download.

Optional: Create a Finder Quick Action (no Terminal)
Option A: Shortcuts app (macOS 12+)
- Open Shortcuts → New Shortcut.
- Shortcut Details: Enable “Use as Quick Action” for Finder files.
- Add action “Open App” (or “Open Files” → “Open with” → choose Screenshot Presenter). Save as “Style with Screenshot Presenter”.
- Now: Right‑click image → Quick Actions → Style with Screenshot Presenter.

Option B: Automator (older macOS)
- Open Automator → New → Quick Action.
- Workflow receives: image files in Finder.
- Add “Open Finder Items” action, select “Screenshot Presenter”. Save as “Style with Screenshot Presenter”.

Notes
- File associations: The app registers for common image types (png, jpg, jpeg, webp, gif, tif, tiff) so it appears in “Open With”.
- Defaults: The app remembers your last-used styling. You can save named templates and apply them quickly inside the app.
