// Minimal Electron wrapper for Screenshot Presenter
// - Opens index.html locally
// - Accepts image paths from Finder (open-file) or CLI args and passes them to the renderer via query param

const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow = null;
let pendingOpenPath = null;

function resolveIndex(){
  // index.html is in project root
  return path.join(__dirname, 'index.html');
}

function createWindow(){
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 900,
    backgroundColor: '#0c0f14',
    title: 'Screenshot Presenter',
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    }
  });

  // If we already have a path to open, pass it via search params
  const search = pendingOpenPath ? `?open=${encodeURIComponent(pendingOpenPath)}` : '';
  mainWindow.loadFile(resolveIndex(), { search });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function openWithPath(p){
  if(!p) return;
  pendingOpenPath = p;
  if(mainWindow){
    const search = `?open=${encodeURIComponent(pendingOpenPath)}`;
    mainWindow.loadFile(resolveIndex(), { search });
  }
}

async function generateDefaultIcon(){
  // Generates a simple gradient + "SP" glyph icon at 1024x1024 and writes to build/icon.png
  const win = new BrowserWindow({
    show: false,
    width: 1024,
    height: 1024,
    backgroundColor: '#0c0f14',
    webPreferences: { offscreen: true, nodeIntegration: false, contextIsolation: true }
  });
  const html = `<!doctype html><meta charset=utf-8><style>
    html,body{margin:0;height:100%;background:#0c0f14}
    canvas{display:block}
  </style><canvas id=c width=1024 height=1024></canvas>
  <script>
    const c = document.getElementById('c');
    const ctx = c.getContext('2d');
    const w = c.width, h = c.height;
    // background gradient
    const g = ctx.createLinearGradient(0,0,w,h);
    g.addColorStop(0, '#1a1f35');
    g.addColorStop(1, '#7a6cff');
    ctx.fillStyle = g; ctx.fillRect(0,0,w,h);
    // soft inner vignette
    const rg = ctx.createRadialGradient(w*0.5,h*0.45,0,w*0.5,h*0.5,w*0.6);
    rg.addColorStop(0,'rgba(255,255,255,0.08)');
    rg.addColorStop(1,'rgba(255,255,255,0.0)');
    ctx.fillStyle = rg; ctx.fillRect(0,0,w,h);
    // rounded square plate
    const r = 220; const x = (w-640)/2; const y = (h-640)/2;
    ctx.beginPath();
    const rr = r; const ww = 640; const hh = 640;
    ctx.moveTo(x+rr, y);
    ctx.arcTo(x+ww, y, x+ww, y+hh, rr);
    ctx.arcTo(x+ww, y+hh, x, y+hh, rr);
    ctx.arcTo(x, y+hh, x, y, rr);
    ctx.arcTo(x, y, x+ww, y, rr);
    ctx.closePath();
    const pg = ctx.createLinearGradient(x,y,x+ww,y+hh);
    pg.addColorStop(0,'rgba(255,255,255,0.12)');
    pg.addColorStop(1,'rgba(255,255,255,0.04)');
    ctx.fillStyle = pg; ctx.fill();
    ctx.lineWidth = 6; ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.stroke();
    // glyph: SP
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 300px -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('SP', w/2, h/2+32);
    // return PNG
    document.title = c.toDataURL('image/png');
  <\/script>`;
  await win.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(html));
  const dataUrl = await win.webContents.executeJavaScript('document.title');
  const b64 = dataUrl.split(',')[1];
  const outDir = path.join(__dirname, 'build');
  const outPng = path.join(outDir, 'icon.png');
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(outPng, Buffer.from(b64, 'base64'));
  return outPng;
}

// macOS: file opened via Finder or dock
app.on('open-file', (event, filePath) => {
  event.preventDefault();
  openWithPath(filePath);
});

// Single-instance lock so subsequent launches pass path to first instance
const gotTheLock = app.requestSingleInstanceLock();
if(!gotTheLock){
  app.quit();
} else {
  app.on('second-instance', (event, argv) => {
    // argv may contain a file path on non-mac platforms
    const maybePath = argv.find(a => /\.(png|jpe?g|webp|gif|tiff?)$/i.test(a));
    if(maybePath) openWithPath(maybePath);
    if(mainWindow){
      if(mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  app.whenReady().then(async () => {
    if(process.env.GEN_ICON === '1'){
      try{
        const p = await generateDefaultIcon();
        console.log('Default icon generated at', p);
      }catch(e){
        console.error('Icon generation failed:', e);
      } finally {
        app.quit();
        return;
      }
    }
    // On first run, pick up a file path if provided via argv (non-mac)
    if(process.platform !== 'darwin'){
      const maybePath = process.argv.find(a => /\.(png|jpe?g|webp|gif|tiff?)$/i.test(a));
      if(maybePath) pendingOpenPath = maybePath;
    }
    createWindow();

    app.on('activate', () => {
      if(BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  });

  app.on('window-all-closed', () => {
    if(process.platform !== 'darwin') app.quit();
  });
}
