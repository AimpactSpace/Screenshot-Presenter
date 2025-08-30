// Screenshot Presenter — Vanilla JS, Canvas-based composition

(function(){
  const dpr = window.devicePixelRatio || 1;
  const canvas = document.getElementById('canvas');
  const ctx = canvas.getContext('2d');
  const fileInput = document.getElementById('fileInput');
  const dropzone = document.getElementById('dropzone');
  const downloadBtn = document.getElementById('downloadBtn');
  const paddingInput = document.getElementById('paddingInput');
  const radiusInput = document.getElementById('radiusInput');
  const randomizeBtn = document.getElementById('randomizeBtn');
  const gradientModeAuto = document.getElementById('gradientModeAuto');
  const gradientModeCustom = document.getElementById('gradientModeCustom');
  const gradientStart = document.getElementById('gradientStart');
  const gradientEnd = document.getElementById('gradientEnd');
  const borderSizeInput = document.getElementById('borderSizeInput');
  const borderOpacityInput = document.getElementById('borderOpacityInput');
  const formatSelect = document.getElementById('formatSelect');
  const templatesGrid = document.getElementById('templatesGrid');
  const templateNameInput = document.getElementById('templateName');
  const saveTemplateBtn = document.getElementById('saveTemplateBtn');

  let userImage = null; // HTMLImageElement
  let gradientSeed = Math.random();
  let templates = [];

  function setCanvasSize(w, h){
    // target logical size
    const width = Math.max(800, Math.min(1600, w));
    const height = Math.round(width * (h / w));
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function avgColor(img){
    // Sample downscaled image to get an average color
    const s = 32;
    const t = document.createElement('canvas');
    t.width = s; t.height = s;
    const c = t.getContext('2d', { willReadFrequently: true });
    const r = Math.min(s / img.width, s / img.height);
    const w = Math.max(1, Math.round(img.width * r));
    const h = Math.max(1, Math.round(img.height * r));
    c.drawImage(img, 0, 0, w, h);
    const { data } = c.getImageData(0, 0, w, h);
    let rSum = 0, gSum = 0, bSum = 0, n = 0;
    for(let i=0; i<data.length; i+=4){
      const a = data[i+3];
      if(a < 8) continue;
      rSum += data[i];
      gSum += data[i+1];
      bSum += data[i+2];
      n++;
    }
    if(n === 0) return { r: 24, g: 28, b: 40 };
    return { r: Math.round(rSum/n), g: Math.round(gSum/n), b: Math.round(bSum/n) };
  }

  function rgbToHsl(r,g,b){
    r/=255; g/=255; b/=255;
    const max=Math.max(r,g,b), min=Math.min(r,g,b);
    let h,s,l=(max+min)/2;
    if(max===min){ h=s=0; }
    else{
      const d=max-min;
      s=l>0.5? d/(2-max-min) : d/(max+min);
      switch(max){
        case r: h=(g-b)/d+(g<b?6:0); break;
        case g: h=(b-r)/d+2; break;
        case b: h=(r-g)/d+4; break;
      }
      h/=6;
    }
    return { h, s, l };
  }
  function hslToRgb(h,s,l){
    function hue2rgb(p,q,t){
      if(t<0) t+=1; if(t>1) t-=1;
      if(t<1/6) return p+(q-p)*6*t;
      if(t<1/2) return q;
      if(t<2/3) return p+(q-p)*(2/3-t)*6;
      return p;
    }
    let r,g,b;
    if(s===0){ r=g=b=l; }
    else{
      const q=l<0.5? l*(1+s) : l+s-l*s;
      const p=2*l-q;
      r=hue2rgb(p,q,h+1/3);
      g=hue2rgb(p,q,h);
      b=hue2rgb(p,q,h-1/3);
    }
    return { r:Math.round(r*255), g:Math.round(g*255), b:Math.round(b*255) };
  }
  function clamp01(x){ return Math.max(0, Math.min(1, x)); }

  function gradientFromImage(img){
    // Build a pleasing linear gradient from the image's average hue
    if(!img || !img.width || !img.height){
      // Fallback colors if no image provided
      const c1 = { r: 20, g: 26, b: 44 };
      const c2 = { r: 78, g: 94, b: 160 };
      return { c1, c2 };
    }
    const avg = avgColor(img);
    const base = rgbToHsl(avg.r, avg.g, avg.b);
    // nudge saturation and lightness
    const h1 = base.h;
    const h2 = (base.h + 0.08 + (gradientSeed*0.14)) % 1; // slight shift
    const c1 = hslToRgb(h1, clamp01(base.s*0.7 + 0.12), clamp01(0.16 + base.l*0.25));
    const c2 = hslToRgb(h2, clamp01(base.s*0.8 + 0.18), clamp01(0.42 + base.l*0.2));
    return { c1, c2 };
  }

  function roundedRectPath(x,y,w,h,r){
    const rr = Math.max(0, Math.min(r, Math.min(w,h)/2));
    ctx.beginPath();
    ctx.moveTo(x+rr, y);
    ctx.arcTo(x+w, y, x+w, y+h, rr);
    ctx.arcTo(x+w, y+h, x, y+h, rr);
    ctx.arcTo(x, y+h, x, y, rr);
    ctx.arcTo(x, y, x+w, y, rr);
    ctx.closePath();
  }

  function hexToRgb(hex){
    const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if(!m) return null;
    return { r: parseInt(m[1],16), g: parseInt(m[2],16), b: parseInt(m[3],16) };
  }

  function getSettings(){
    return {
      pad: parseInt(paddingInput.value, 10),
      radius: parseInt(radiusInput.value, 10),
      borderPx: parseInt(borderSizeInput.value, 10),
      borderAlpha: Math.max(0, Math.min(1, parseInt(borderOpacityInput.value, 10) / 100)),
      gradMode: gradientModeCustom.checked ? 'custom' : 'auto',
      gradStart: gradientStart.value,
      gradEnd: gradientEnd.value,
      gradientSeed,
    };
  }

  function applySettings(s){
    if(!s) return;
    paddingInput.value = s.pad;
    radiusInput.value = s.radius;
    borderSizeInput.value = s.borderPx;
    borderOpacityInput.value = Math.round((s.borderAlpha ?? 0.5) * 100);
    gradientSeed = s.gradientSeed ?? Math.random();
    if(s.gradMode === 'custom'){
      gradientModeCustom.checked = true;
      gradientModeAuto.checked = false;
      if(s.gradStart) gradientStart.value = s.gradStart;
      if(s.gradEnd) gradientEnd.value = s.gradEnd;
    }else{
      gradientModeAuto.checked = true;
      gradientModeCustom.checked = false;
    }
    syncGradientControls();
    draw();
  }

  // Re-define roundedRectPath to be context-agnostic
  function rrPath(ctx2, x,y,w,h,r){
    const rr = Math.max(0, Math.min(r, Math.min(w,h)/2));
    ctx2.beginPath();
    ctx2.moveTo(x+rr, y);
    ctx2.arcTo(x+w, y, x+w, y+h, rr);
    ctx2.arcTo(x+w, y+h, x, y+h, rr);
    ctx2.arcTo(x, y+h, x, y, rr);
    ctx2.arcTo(x, y, x+w, y, rr);
    ctx2.closePath();
  }

  function renderComposition(targetCtx, targetW, targetH, settings, image, opts={}){
    const { pad, radius, borderPx, borderAlpha, gradMode, gradStart, gradEnd } = settings;
    let c1, c2;
    if(gradMode === 'custom'){
      const s = hexToRgb(gradStart); const e = hexToRgb(gradEnd);
      c1 = s || { r:108, g:92, b:231 }; c2 = e || { r:0, g:217, b:255 };
    } else {
      const refImg = image || { width: 1200, height: 800 };
      ({ c1, c2 } = gradientFromImage(image || refImg));
    }
    const g = targetCtx.createLinearGradient(0,0,targetW,targetH);
    g.addColorStop(0, `rgb(${c1.r}, ${c1.g}, ${c1.b})`);
    g.addColorStop(1, `rgb(${c2.r}, ${c2.g}, ${c2.b})`);
    targetCtx.fillStyle = g;
    targetCtx.fillRect(0,0,targetW,targetH);

    const baseW = image ? image.width : 1000;
    const baseH = image ? image.height : 600;
    const scale = targetW / (baseW + pad*2 + borderPx*2);
    const iw = Math.round(baseW * scale);
    const ih = Math.round(baseH * scale);
    const x = Math.round(pad * scale);
    const y = Math.round(pad * scale);
    const border = Math.round(Math.max(0.5, borderPx * scale));
    const rr = Math.round(radius * scale);

    rrPath(targetCtx, x, y, iw, ih, rr);
    targetCtx.save();
    targetCtx.clip();
    if(image){
      targetCtx.drawImage(image, x, y, iw, ih);
    } else if(opts.placeholderIfNoImage){
      // placeholder pattern
      const gradIn = targetCtx.createLinearGradient(x,y,x+iw,y+ih);
      gradIn.addColorStop(0, 'rgba(255,255,255,.25)');
      gradIn.addColorStop(1, 'rgba(255,255,255,.05)');
      targetCtx.fillStyle = gradIn;
      targetCtx.fillRect(x, y, iw, ih);
      targetCtx.fillStyle = 'rgba(0,0,0,.08)';
      for(let i=0;i<8;i++){
        targetCtx.fillRect(x + Math.round(i*iw/8), y, 1, ih);
      }
    }
    targetCtx.restore();

    rrPath(targetCtx, x, y, iw, ih, rr);
    targetCtx.lineWidth = border;
    targetCtx.strokeStyle = `rgba(255,255,255,${borderAlpha})`;
    targetCtx.stroke();
  }

  function draw(){
    if(!userImage){
      // No image yet: enable saving template preview with placeholder
      const s = getSettings();
      const w = 1200; const h = 800;
      setCanvasSize(w, h);
      renderComposition(ctx, canvas.width/dpr, canvas.height/dpr, s, null, { placeholderIfNoImage: true });
      downloadBtn.disabled = true;
      saveTemplateBtn.disabled = false; // allow saving style-only template
      return;
    }
    const s = getSettings();
    const targetW = Math.min(1600, Math.max(900, userImage.width + s.pad*2 + s.borderPx*2));
    const scale = targetW / (userImage.width + s.pad*2 + s.borderPx*2);
    const compW = Math.round((userImage.width + s.pad*2 + s.borderPx*2) * scale);
    const compH = Math.round((userImage.height + s.pad*2 + s.borderPx*2) * scale);
    setCanvasSize(compW, compH);
    renderComposition(ctx, canvas.width/dpr, canvas.height/dpr, s, userImage);
    downloadBtn.disabled = false;
    saveTemplateBtn.disabled = false;
    // Subtle motion on re-render
    canvas.animate([
      { opacity: .92, transform: 'scale(.995)' },
      { opacity: 1, transform: 'scale(1)' }
    ], { duration: 180, easing: 'cubic-bezier(.2,.8,.2,1)' });
  }

  function handleFiles(files){
    if(!files || !files[0]) return;
    const file = files[0];
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        userImage = img;
        gradientSeed = Math.random();
        draw();
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  }

  // Events
  fileInput.addEventListener('change', (e) => handleFiles(e.target.files));
  paddingInput.addEventListener('input', draw);
  radiusInput.addEventListener('input', draw);
  borderSizeInput.addEventListener('input', draw);
  borderOpacityInput.addEventListener('input', draw);
  randomizeBtn.addEventListener('click', () => { gradientSeed = Math.random(); draw(); });

  function syncGradientControls(){
    const custom = gradientModeCustom.checked;
    gradientStart.disabled = !custom;
    gradientEnd.disabled = !custom;
    randomizeBtn.disabled = custom;
  }
  gradientModeAuto.addEventListener('change', () => { syncGradientControls(); draw(); });
  gradientModeCustom.addEventListener('change', () => { syncGradientControls(); draw(); });
  gradientStart.addEventListener('input', draw);
  gradientEnd.addEventListener('input', draw);

  // Drag & drop
  // Prevent double file dialog: clicking the input should not bubble to dropzone
  fileInput.addEventListener('click', (e) => e.stopPropagation());
  ;['dragenter','dragover'].forEach(ev => dropzone.addEventListener(ev, e => { e.preventDefault(); dropzone.classList.add('drag'); }));
  ;['dragleave','drop'].forEach(ev => dropzone.addEventListener(ev, e => { e.preventDefault(); dropzone.classList.remove('drag'); }));
  dropzone.addEventListener('drop', e => handleFiles(e.dataTransfer.files));
  dropzone.addEventListener('click', (e) => {
    if(e.target === fileInput) return; // extra guard
    fileInput.click();
  });

  // Download
  downloadBtn.addEventListener('click', () => {
    if(!userImage) return;
    const link = document.createElement('a');
    const ts = new Date().toISOString().replace(/[:.]/g,'-');
    const fmt = formatSelect.value === 'jpeg' ? 'jpeg' : 'png';
    link.download = `screenshot-presenter-${ts}.${fmt}`;
    link.href = fmt === 'jpeg' ? canvas.toDataURL('image/jpeg', 0.92) : canvas.toDataURL('image/png');
    link.click();
  });

  // Initial UI state
  syncGradientControls();

  // Template management
  const LS_KEY = 'ssp.templates.v1';
  function loadTemplates(){
    try{ templates = JSON.parse(localStorage.getItem(LS_KEY) || '[]'); }catch{ templates = []; }
  }
  function saveTemplates(){
    localStorage.setItem(LS_KEY, JSON.stringify(templates));
  }
  function renderTemplates(){
    templatesGrid.innerHTML = '';
    templates.forEach(t => {
      const card = document.createElement('div');
      card.className = 'template-card enter-pop';
      const img = document.createElement('img');
      img.className = 'template-thumb';
      img.src = t.thumb;
      img.alt = `Template ${t.name}`;
      const meta = document.createElement('div');
      meta.className = 'template-meta';
      const name = document.createElement('div');
      name.className = 'template-name';
      name.textContent = t.name;
      const row = document.createElement('div');
      row.className = 'template-actions-row';
      const useBtn = document.createElement('button');
      useBtn.className = 'btn-secondary';
      useBtn.textContent = 'Use';
      useBtn.addEventListener('click', () => applySettings(t.settings));
      const delBtn = document.createElement('button');
      delBtn.className = 'btn-danger';
      delBtn.textContent = 'Delete';
      delBtn.addEventListener('click', () => {
        templates = templates.filter(x => x.id !== t.id);
        saveTemplates();
        renderTemplates();
      });
      row.appendChild(useBtn); row.appendChild(delBtn);
      meta.appendChild(name); meta.appendChild(row);
      card.appendChild(img); card.appendChild(meta);
      templatesGrid.appendChild(card);
    });
  }

  function uuid(){ return Math.random().toString(36).slice(2) + Date.now().toString(36); }

  async function createTemplateThumb(settings){
    const tw = 600, th = 450;
    const t = document.createElement('canvas'); t.width = tw; t.height = th;
    const c = t.getContext('2d');
    renderComposition(c, tw, th, settings, userImage, { placeholderIfNoImage: true });
    return t.toDataURL('image/png');
  }

  async function onSaveTemplate(){
    const name = (templateNameInput.value || '').trim() || 'Untitled';
    const settings = getSettings();
    const thumb = await createTemplateThumb(settings);
    const tpl = { id: uuid(), name, settings, thumb };
    templates.unshift(tpl);
    saveTemplates();
    renderTemplates();
    // Motion feedback
    saveTemplateBtn.animate([
      { transform: 'scale(1)' }, { transform: 'scale(.96)' }, { transform: 'scale(1)' }
    ], { duration: 180, easing: 'cubic-bezier(.2,.8,.2,1)' });
  }

  templateNameInput.addEventListener('input', () => {
    saveTemplateBtn.disabled = false;
  });
  saveTemplateBtn.addEventListener('click', onSaveTemplate);

  loadTemplates();
  renderTemplates();
  // Initial render (placeholder if no image yet)
  draw();
  // Try to auto-open a file if Electron provided one
  // If running under Electron with nodeIntegration, allow loading an image file by path
  function tryLoadFilePathFromQuery(){
    try{
      const sp = new URLSearchParams(window.location.search);
      const raw = sp.get('open');
      if(!raw) return;
      const filePath = decodeURIComponent(raw);
      // Basic extension check
      if(!/\.(png|jpe?g|webp|gif|tiff?)$/i.test(filePath)) return;
      if(typeof require === 'function'){
        const fs = require('fs');
        const ext = (filePath.split('.').pop()||'').toLowerCase();
        const mime = ({ png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp', gif: 'image/gif', tif: 'image/tiff', tiff: 'image/tiff' })[ext] || 'application/octet-stream';
        const buf = fs.readFileSync(filePath);
        const b64 = buf.toString('base64');
        const img = new Image();
        img.onload = () => { userImage = img; gradientSeed = Math.random(); draw(); };
        img.onerror = () => console.error('Failed to load image from path:', filePath);
        img.src = `data:${mime};base64,${b64}`;
      }
    }catch(e){ console.error('Unable to auto-load file from query:', e); }
  }
  tryLoadFilePathFromQuery();
})();
