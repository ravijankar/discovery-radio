// ═══════════════════════════════════════════
//  DISCOVERY I — AUDIO RECEPTION SYSTEM
//  app.js — Runtime Logic
// ═══════════════════════════════════════════

// ── STATE ───────────────────────────────────
let audio = null, currentStation = null, playing = false;
let streamIndex = 0;
let currentVolume = 0.5;
let nowPlayingTimer = null;

// ── DOM REFS ─────────────────────────────────
const philWrap    = document.getElementById('philWrap');
const recvStat   = document.getElementById('recvStation');
const recvDesc   = document.getElementById('recvDesc');
const freqOut    = document.getElementById('freqReadout');
const sigOut     = document.getElementById('sigReadout');
const modeOut    = document.getElementById('modeReadout');
const errorStrip = document.getElementById('errorStrip');
const consoleOut = document.getElementById('consoleOut');
const npwArtist  = document.getElementById('npwArtist');
const npwTitle   = document.getElementById('npwTitle');
const npwAlbum   = document.getElementById('npwAlbum');
const npwArt     = document.getElementById('npwArt');
const npwPlaceholder = document.getElementById('npwPlaceholder');

// ── VU METERS ────────────────────────────────
const vuL = document.getElementById('vuL');
const vuR = document.getElementById('vuR');
const vuBarsL = [], vuBarsR = [];

function levelClass(i, total, h) {
  const pct = h / 28;
  if (pct > 0.85) return 'l4';
  if (pct > 0.6)  return 'l3';
  return (i / total) > 0.5 ? 'l2' : 'l1';
}

for (let i = 0; i < 20; i++) {
  [vuL, vuR].forEach((container, ci) => {
    const b = document.createElement('div');
    b.className = 'vu-bar';
    container.appendChild(b);
    (ci === 0 ? vuBarsL : vuBarsR).push(b);
  });
}

let vuTimer = null;
function animateVU(on) {
  clearInterval(vuTimer);
  if (!on) {
    [...vuBarsL, ...vuBarsR].forEach(b => { b.style.height = '3px'; b.className = 'vu-bar'; });
    return;
  }
  vuTimer = setInterval(() => {
    [vuBarsL, vuBarsR].forEach(bars => {
      bars.forEach((b, i) => {
        const h = Math.random() * 22 + 3;
        b.style.height = h + 'px';
        b.className = 'vu-bar ' + levelClass(i, bars.length, h);
      });
    });
  }, 85);
}

// ── SIGNAL METERS ────────────────────────────
let meterTimer = null;
function animateMeters(on) {
  clearInterval(meterTimer);
  document.getElementById('mSig').style.width   = '0%';
  document.getElementById('mBuf').style.width   = '0%';
  document.getElementById('mNoise').style.width = '5%';
  document.getElementById('mSigVal').textContent   = '0%';
  document.getElementById('mBufVal').textContent   = '0%';
  document.getElementById('mNoiseVal').textContent = '5%';
  if (!on) return;
  meterTimer = setInterval(() => {
    const sig   = 75 + Math.random() * 20;
    const buf   = 85 + Math.random() * 12;
    const noise = 2  + Math.random() * 8;
    document.getElementById('mSig').style.width    = sig   + '%';
    document.getElementById('mBuf').style.width    = buf   + '%';
    document.getElementById('mNoise').style.width  = noise + '%';
    document.getElementById('mSigVal').textContent   = Math.round(sig)   + '%';
    document.getElementById('mBufVal').textContent   = Math.round(buf)   + '%';
    document.getElementById('mNoiseVal').textContent = Math.round(noise) + '%';
  }, 1200);
}

// ── CONSOLE LOG ──────────────────────────────
const logLines = [];
function addLog(msg, cls = '') {
  const ts = new Date().toISOString().substr(11, 8);
  logLines.push({ ts, msg, cls });
  if (logLines.length > 14) logLines.shift();
  consoleOut.innerHTML = logLines.map(l =>
    `<div class="console-line ${l.cls}"><span class="console-ts">${l.ts}</span><span>${l.msg}</span></div>`
  ).join('');
  consoleOut.scrollTop = consoleOut.scrollHeight;
}

// ── VOLUME KNOB ──────────────────────────────
const knobCanvas  = document.getElementById('volKnob');
const knobCtx     = knobCanvas.getContext('2d');
const knobValEl   = document.getElementById('volKnobVal');
const MIN_ANGLE   = 135;

function knobAngleFromVol(v) {
  return MIN_ANGLE + (v / 100) * 270;
}

function drawKnob(vol) {
  const c   = knobCanvas;
  const cx  = c.width  / 2;
  const cy  = c.height / 2;
  const r   = cx - 6;
  const ctx = knobCtx;
  ctx.clearRect(0, 0, c.width, c.height);

  const startRad = MIN_ANGLE * Math.PI / 180;
  const endRad   = (MIN_ANGLE + 270) * Math.PI / 180;
  const valRad   = knobAngleFromVol(vol) * Math.PI / 180;

  // Track (dim)
  ctx.beginPath();
  ctx.arc(cx, cy, r, startRad, endRad, false);
  ctx.strokeStyle = '#2a2a2a';
  ctx.lineWidth   = 4;
  ctx.lineCap     = 'round';
  ctx.stroke();

  // Value arc (amber)
  ctx.beginPath();
  ctx.arc(cx, cy, r, startRad, valRad, false);
  ctx.strokeStyle = vol > 0 ? '#d4820a' : '#333';
  ctx.lineWidth   = 4;
  ctx.lineCap     = 'round';
  ctx.stroke();

  // Tick marks
  for (let i = 0; i <= 10; i++) {
    const a  = (MIN_ANGLE + (i / 10) * 270) * Math.PI / 180;
    const ir = r - 7;
    const or = r - 2;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * ir, cy + Math.sin(a) * ir);
    ctx.lineTo(cx + Math.cos(a) * or, cy + Math.sin(a) * or);
    ctx.strokeStyle = i * 10 <= vol ? '#7a4a05' : '#1e1e1e';
    ctx.lineWidth   = i % 5 === 0 ? 2 : 1;
    ctx.stroke();
  }

  // Knob body
  const bodyR = r - 14;
  const grad  = ctx.createRadialGradient(cx - bodyR * 0.2, cy - bodyR * 0.2, 1, cx, cy, bodyR);
  grad.addColorStop(0, '#222');
  grad.addColorStop(1, '#0a0a0a');
  ctx.beginPath();
  ctx.arc(cx, cy, bodyR, 0, Math.PI * 2);
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.strokeStyle = '#333';
  ctx.lineWidth   = 1;
  ctx.stroke();

  // Pointer
  const pa  = valRad;
  const pr1 = bodyR * 0.3;
  const pr2 = bodyR * 0.85;
  ctx.beginPath();
  ctx.moveTo(cx + Math.cos(pa) * pr1, cy + Math.sin(pa) * pr1);
  ctx.lineTo(cx + Math.cos(pa) * pr2, cy + Math.sin(pa) * pr2);
  ctx.strokeStyle = vol > 0 ? '#d4820a' : '#555';
  ctx.lineWidth   = 2;
  ctx.lineCap     = 'round';
  ctx.stroke();

  // Center dot
  ctx.beginPath();
  ctx.arc(cx, cy, 3, 0, Math.PI * 2);
  ctx.fillStyle = '#444';
  ctx.fill();
}

function setVolume(v) {
  v = Math.max(0, Math.min(100, Math.round(v)));
  currentVolume = v / 100;
  document.getElementById('volSlider').value = v;
  knobValEl.textContent = v + '%';
  if (audio) audio.volume = Math.pow(currentVolume, 2);
  drawKnob(v);
}

// Knob drag
let knobDragging = false, knobDragStartY = 0, knobDragStartVol = 80;

knobCanvas.addEventListener('mousedown', e => {
  knobDragging     = true;
  knobDragStartY   = e.clientY;
  knobDragStartVol = Math.round(currentVolume * 100);
  e.preventDefault();
});
window.addEventListener('mousemove', e => {
  if (!knobDragging) return;
  setVolume(knobDragStartVol + (knobDragStartY - e.clientY) * 0.6);
});
window.addEventListener('mouseup', () => { knobDragging = false; });

// Touch
knobCanvas.addEventListener('touchstart', e => {
  knobDragging     = true;
  knobDragStartY   = e.touches[0].clientY;
  knobDragStartVol = Math.round(currentVolume * 100);
  e.preventDefault();
}, { passive: false });
window.addEventListener('touchmove', e => {
  if (!knobDragging) return;
  setVolume(knobDragStartVol + (knobDragStartY - e.touches[0].clientY) * 0.6);
}, { passive: false });
window.addEventListener('touchend', () => { knobDragging = false; });

// Scroll wheel
knobCanvas.addEventListener('wheel', e => {
  e.preventDefault();
  setVolume(Math.round(currentVolume * 100) - Math.sign(e.deltaY) * 3);
}, { passive: false });

// Sync hidden slider
document.getElementById('volSlider').addEventListener('input', function () {
  setVolume(parseInt(this.value));
});

setVolume(50);

// ── NOW PLAYING ──────────────────────────────
function startNowPlaying(st) {
  if (!st.nowPlayingUrl) return;
  clearInterval(nowPlayingTimer);
  pollNowPlaying(st);
  nowPlayingTimer = setInterval(() => pollNowPlaying(st), 15000);
}

function stopNowPlaying() {
  clearInterval(nowPlayingTimer);
  nowPlayingTimer = null;
}

function updateNpw(artist, title, album, artUrl) {
  npwArtist.textContent = (artist || '—').toUpperCase();
  npwTitle.textContent  = (title  || '—').toUpperCase();
  npwAlbum.textContent  = (album  || '').toUpperCase();
  const parts = [artist, title].filter(Boolean);
  if (parts.length) recvDesc.textContent = parts.join(' — ').toUpperCase();
  if (artUrl) {
    npwArt.src = artUrl;
    npwArt.style.display = 'block';
    npwPlaceholder.style.display = 'none';
    npwArt.onerror = () => { npwArt.style.display = 'none'; npwPlaceholder.style.display = 'flex'; };
  } else {
    npwArt.style.display = 'none';
    npwPlaceholder.style.display = 'flex';
  }
}

function pollNowPlaying(st) {
  if (currentStation?.call !== st.call || !playing) return;

  if (st.nowPlayingUrl) {
    fetch(st.nowPlayingUrl)
      .then(r => r.json())
      .then(data => {
        if (currentStation?.call !== st.call) return;
        const song = data?.now_playing?.song;
        if (song) updateNpw(song.artist, song.title, song.album, song.art);
      })
      .catch(() => {});
  } else {
    const streamUrl = st.streams?.[streamIndex] || st.streams?.[0];
    if (!streamUrl) return;
    fetch('/api/icy-meta?url=' + encodeURIComponent(streamUrl))
      .then(r => r.json())
      .then(data => {
        if (currentStation?.call !== st.call) return;
        if (data.raw) updateNpw(data.artist, data.title, null, data.artUrl || null);
      })
      .catch(() => {});
  }
}

function clearNpw() {
  npwArtist.textContent = '—';
  npwTitle.textContent  = '—';
  npwAlbum.textContent  = '';
  npwArt.style.display  = 'none';
  npwPlaceholder.style.display = 'flex';
}

// ── PLAYBACK ENGINE ──────────────────────────
// Multi-source fallback: tries each URL in st.streams[] in order.
// Supports both direct streams and HLS (.m3u8) via native browser HLS.

philWrap.addEventListener('click', () => {
  if (playing || audio !== null) stopAll();
  else if (currentStation) {
    if (currentStation.call === 'LIBRARY') {
      tryStream(currentStation, null, 0);
    } else {
      const card = document.querySelector(`[data-call="${currentStation.call}"]`);
      if (card) tryStream(currentStation, card, 0);
    }
  }
});

function allOff() {
  document.querySelectorAll('.station-item').forEach(el => el.classList.remove('active'));
}

function destroyAudio() {
  if (audio) {
    audio.pause();
    audio.removeAttribute('src');
    audio.load();
    audio = null;
  }
  playing = false;
}

function tryStream(st, card, idx) {
  if (idx >= st.streams.length) { onAllFailed(st); return; }

  const url = st.streams[idx];
  addLog('TRYING SOURCE ' + (idx + 1) + '/' + st.streams.length + ': ' + url.split('/').pop().substring(0, 30), idx > 0 ? 'warn' : '');

  destroyAudio();
  audio = new Audio();
  // NOTE: Do NOT set crossOrigin here. Setting crossOrigin='anonymous'
  // triggers CORS preflight and blocks streams without ACAO:* header.
  audio.volume  = Math.pow(currentVolume, 2);
  audio.preload = 'none';

  // Skip HLS on browsers without native support (Chrome, Firefox)
  if (url.includes('.m3u8') && !audio.canPlayType('application/x-mpegURL') && !audio.canPlayType('application/vnd.apple.mpegurl')) {
    addLog('HLS NOT SUPPORTED — SKIPPING: ' + url.split('/').pop().substring(0, 25), 'warn');
    tryStream(st, card, idx + 1);
    return;
  }

  audio.src = url;

  // Timeout: if nothing plays within 12s, try next source
  let connectTimer = setTimeout(() => {
    if (!playing) {
      addLog('TIMEOUT ON SOURCE ' + (idx + 1) + ' — TRYING NEXT', 'warn');
      tryStream(st, card, idx + 1);
    }
  }, 12000);

  audio.addEventListener('playing', () => {
    clearTimeout(connectTimer);
    playing = true;
    streamIndex = idx;
    philWrap.classList.add('playing');
    sigOut.textContent  = 'LOCKED';
    modeOut.textContent = 'RECEIVING';
    errorStrip.classList.remove('show');
    addLog('SIGNAL LOCKED: ' + st.call + ' [SOURCE ' + (idx + 1) + ']', 'ok');
    addLog('RX: ' + st.loc + ' / ' + st.freq, 'ok');
    animateVU(true);
    animateMeters(true);
    startNowPlaying(st);
  }, { once: true });

  audio.addEventListener('ended', () => {
    if (currentStation?.call !== 'LIBRARY') return;
    advanceLibraryTrack();
  }, { once: true });

  audio.addEventListener('error', () => {
    clearTimeout(connectTimer);
    if (!playing) {
      const code = audio.error ? audio.error.code : '?';
      addLog('SOURCE ' + (idx + 1) + ' FAULT (ERR ' + code + ') — ADVANCING', 'warn');
      tryStream(st, card, idx + 1);
    }
  }, { once: true });

  audio.play().catch(err => {
    clearTimeout(connectTimer);
    if (!playing) {
      addLog('PLAY REJECTED: ' + err.name + ' — TRYING NEXT', 'warn');
      tryStream(st, card, idx + 1);
    }
  });
}

function onAllFailed(st) {
  destroyAudio();
  philWrap.classList.remove('playing');
  sigOut.textContent  = 'NONE';
  modeOut.textContent = 'FAULT';
  freqOut.textContent = '-- -- -- --';
  errorStrip.classList.add('show');
  allOff(); animateVU(false); animateMeters(false);
  clearNpw();
  stopNowPlaying();
  if (st.call === 'LIBRARY') {
    recvStat.innerHTML   = 'LOAD ERROR<span class="recv-cursor"></span>';
    recvDesc.textContent = 'Track unavailable — check server';
    addLog('LIBRARY TRACK FAILED TO LOAD', 'err');
  } else {
    recvStat.innerHTML   = 'SIGNAL LOST<span class="recv-cursor"></span>';
    recvDesc.textContent = 'All sources exhausted — station unavailable';
    addLog('ALL SOURCES EXHAUSTED: ' + st.call, 'err');
    addLog('STATION MAY BE OFFLINE OR GEO-RESTRICTED', 'warn');
  }
}

function playStation(st, card) {
  errorStrip.classList.remove('show');
  if (currentStation?.call === st.call && playing) { stopAll(); return; }
  stopNowPlaying();
  destroyAudio();
  allOff();
  clearLibraryActive();
  currentStation = st;
  card.classList.add('active');
  recvStat.innerHTML   = st.call + '<span class="recv-cursor"></span>';
  recvDesc.textContent = st.desc.toUpperCase();
  freqOut.textContent  = st.freq;
  sigOut.textContent   = 'ACQUIRING';
  modeOut.textContent  = 'CONNECTING';
  philWrap.classList.remove('playing');
  animateVU(false); animateMeters(false);
  npwArtist.textContent = st.name.toUpperCase();
  npwTitle.textContent  = 'ACQUIRING SIGNAL';
  npwAlbum.textContent  = '';
  npwArt.style.display  = 'none';
  npwPlaceholder.style.display = 'flex';
  addLog('ACQUIRING: ' + st.call + ' — ' + st.name.substring(0, 25).toUpperCase(), 'hi');
  addLog(st.streams.length + ' SOURCE(S) AVAILABLE — INITIATING LOCK');
  tryStream(st, card, 0);
}

function stopAll() {
  destroyAudio();
  philWrap.classList.remove('playing');
  sigOut.textContent   = 'NONE';
  modeOut.textContent  = 'STANDBY';
  recvStat.innerHTML   = 'NO SIGNAL<span class="recv-cursor"></span>';
  recvDesc.textContent = 'Awaiting station selection';
  freqOut.textContent  = '-- -- -- --';
  errorStrip.classList.remove('show');
  allOff(); animateVU(false); animateMeters(false);
  clearNpw();
  stopNowPlaying();
  clearLibraryActive();
  addLog('TRANSMISSION TERMINATED BY OPERATOR', 'warn');
}

// ── RENDER STATIONS ──────────────────────────
let rowNum = 1;
function buildItem(st) {
  const li = document.createElement('li');
  li.className      = 'station-item' + (st.featured ? ' featured' : '');
  li.dataset.call   = st.call;
  li.dataset.tags   = st.tags.join(',');
  li.dataset.text   = (st.call + st.name + st.loc + st.tags.join(' ')).toLowerCase();
  const srcLabel    = st.streams.length > 1 ? st.streams.length + ' SRC' : '1 SRC';
  li.innerHTML = `
    <div class="row-num">${String(rowNum++).padStart(2, '0')}</div>
    <div class="station-body">
      <div class="station-call"><span class="tx-dot"></span>${st.call}</div>
      <div class="station-name">${st.name.toUpperCase()}</div>
      <div class="station-tags">${st.tags.join(' · ').toUpperCase()}</div>
      ${st.featured ? '<div class="featured-badge">★ LOCAL</div>' : ''}
    </div>
    <div class="station-right">
      <div class="station-freq">${st.freq}</div>
      <div class="station-loc">${st.loc}</div>
      <div class="station-loc" style="color:var(--white-faint);font-size:0.4rem;letter-spacing:.2em;">${srcLabel}</div>
    </div>
  `;
  li.addEventListener('click', () => playStation(st, li));
  return li;
}

// ── SEARCH & FILTER ──────────────────────────
let activeFilter = 'all';
document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    activeFilter = btn.dataset.filter;
    applyFilters();
  });
});
document.getElementById('searchInput').addEventListener('input', applyFilters);

function applyFilters() {
  const q = document.getElementById('searchInput').value.toLowerCase();
  document.querySelectorAll('.station-item').forEach(el => {
    const ok = (!q || el.dataset.text.includes(q)) &&
               (activeFilter === 'all' || el.dataset.tags.includes(activeFilter));
    el.style.display = ok ? '' : 'none';
  });
}

// ── CLOCKS ───────────────────────────────────
const missionStart = Date.now() - 42 * 24 * 60 * 60 * 1000; // 42 days into mission

function tick() {
  const now = new Date();
  const hh  = String(now.getUTCHours()).padStart(2, '0');
  const mm  = String(now.getUTCMinutes()).padStart(2, '0');
  const ss  = String(now.getUTCSeconds()).padStart(2, '0');
  document.getElementById('utcClock').textContent = hh + ':' + mm + ':' + ss;

  const elapsed = Math.floor((Date.now() - missionStart) / 1000);
  const metD = String(Math.floor(elapsed / 86400)).padStart(3, '0');
  const metH = String(Math.floor((elapsed % 86400) / 3600)).padStart(2, '0');
  const metM = String(Math.floor((elapsed % 3600) / 60)).padStart(2, '0');
  const metS = String(elapsed % 60).padStart(2, '0');
  document.getElementById('metClock').textContent = metD + ':' + metH + ':' + metM + ':' + metS;
}
tick();
setInterval(tick, 1000);

// ── STATION EDITOR ───────────────────────────
function loadUserStations() {
  try {
    const saved = localStorage.getItem('phil_stations');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.us)   STATIONS.us   = parsed.us;
      if (parsed.intl) STATIONS.intl = parsed.intl;
    }
  } catch (e) {}
}

function saveUserStations() {
  try {
    localStorage.setItem('phil_stations', JSON.stringify({ us: STATIONS.us, intl: STATIONS.intl }));
  } catch (e) {}
}

function rebuildMainList() {
  ['us', 'intl'].forEach(key => {
    document.getElementById(key === 'us' ? 'usGrid' : 'intlGrid').innerHTML = '';
  });
  rowNum = 1;
  ['us', 'intl'].forEach(key => {
    const grid    = document.getElementById(key === 'us' ? 'usGrid' : 'intlGrid');
    const countEl = document.getElementById(key === 'us' ? 'usCount' : 'intlCount');
    STATIONS[key].forEach(st => grid.appendChild(buildItem(st)));
    if (countEl) countEl.textContent = String(STATIONS[key].length).padStart(2, '0') + ' SOURCES';
  });
}

let editingRegion = null, editingIndex = null;
let dragSrcEl = null;

const overlay      = document.getElementById('editorOverlay');
const editorList   = document.getElementById('editorList');
const formWrap     = document.getElementById('editorFormWrap');
const formTitle    = document.getElementById('editorFormTitle');
const editorStatus = document.getElementById('editorStatus');
const fRegion      = document.getElementById('fRegion');
const fCall        = document.getElementById('fCall');
const fName        = document.getElementById('fName');
const fLoc         = document.getElementById('fLoc');
const fFreq        = document.getElementById('fFreq');
const fDesc        = document.getElementById('fDesc');
const fTags        = document.getElementById('fTags');
const fStreams      = document.getElementById('fStreams');

document.getElementById('editDbBtn').addEventListener('click', () => {
  overlay.classList.add('open');
  renderEditorList();
  clearForm();
});
document.getElementById('editorClose').addEventListener('click', () => {
  overlay.classList.remove('open');
});
overlay.addEventListener('click', e => {
  if (e.target === overlay) overlay.classList.remove('open');
});
document.getElementById('editorAddBtn').addEventListener('click', () => {
  editingRegion = null; editingIndex = null;
  clearForm();
  formTitle.textContent = 'NEW STATION';
  document.querySelectorAll('.editor-list-item').forEach(el => el.classList.remove('selected'));
});
document.getElementById('editorSaveBtn').addEventListener('click', saveStation);
document.getElementById('editorCancelBtn').addEventListener('click', () => {
  clearForm();
  editingRegion = null; editingIndex = null;
  document.querySelectorAll('.editor-list-item').forEach(el => el.classList.remove('selected'));
});

function clearForm() {
  fRegion.value  = 'us';
  fCall.value    = '';
  fName.value    = '';
  fLoc.value     = '';
  fFreq.value    = '';
  fDesc.value    = '';
  fTags.value    = '';
  fStreams.value  = '';
  editorStatus.textContent = '';
  editorStatus.className   = 'editor-status';
  formTitle.textContent    = 'NEW STATION';
}

function renderEditorList() {
  editorList.innerHTML = '';
  ['us', 'intl'].forEach(region => {
    STATIONS[region].forEach((st, idx) => {
      const li = document.createElement('li');
      li.className = 'editor-list-item';
      li.draggable = true;
      li.dataset.region = region;
      li.dataset.idx    = idx;
      li.innerHTML = `
        <div class="eli-drag" title="Drag to reorder">⠿</div>
        <div style="flex:1;min-width:0;">
          <div class="eli-call">${st.call}</div>
          <div class="eli-loc">${st.loc}</div>
        </div>
        <div style="display:flex;align-items:center;gap:6px;">
          <span class="eli-badge">${region.toUpperCase()}</span>
          <button class="eli-delete" title="Remove station" data-region="${region}" data-idx="${idx}">✕</button>
        </div>
      `;
      li.addEventListener('click', e => {
        if (e.target.classList.contains('eli-delete') || e.target.classList.contains('eli-drag')) return;
        document.querySelectorAll('.editor-list-item').forEach(el => el.classList.remove('selected'));
        li.classList.add('selected');
        loadStationIntoForm(region, idx);
      });
      li.querySelector('.eli-delete').addEventListener('click', e => {
        e.stopPropagation();
        deleteStation(region, idx);
      });

      li.addEventListener('dragstart', e => {
        dragSrcEl = li;
        e.dataTransfer.effectAllowed = 'move';
        setTimeout(() => li.classList.add('dragging'), 0);
      });
      li.addEventListener('dragend', () => {
        li.classList.remove('dragging');
        document.querySelectorAll('.editor-list-item').forEach(el => el.classList.remove('drag-over'));
        dragSrcEl = null;
      });
      li.addEventListener('dragover', e => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; });
      li.addEventListener('dragenter', e => {
        e.preventDefault();
        if (dragSrcEl && li !== dragSrcEl) li.classList.add('drag-over');
      });
      li.addEventListener('dragleave', () => li.classList.remove('drag-over'));
      li.addEventListener('drop', e => {
        e.preventDefault();
        e.stopPropagation();
        li.classList.remove('drag-over');
        if (!dragSrcEl || dragSrcEl === li) return;
        const items = [...editorList.querySelectorAll('.editor-list-item')];
        const srcPos = items.indexOf(dragSrcEl);
        const tgtPos = items.indexOf(li);
        reorderStations(srcPos, tgtPos);
      });

      editorList.appendChild(li);
    });
  });
}

function reorderStations(srcPos, tgtPos) {
  const flat = [];
  ['us', 'intl'].forEach(region => {
    STATIONS[region].forEach(st => flat.push({ st, region }));
  });
  const [moved] = flat.splice(srcPos, 1);
  flat.splice(tgtPos, 0, moved);
  STATIONS.us   = flat.filter(x => x.region === 'us').map(x => x.st);
  STATIONS.intl = flat.filter(x => x.region === 'intl').map(x => x.st);
  saveUserStations();
  rebuildMainList();
  renderEditorList();
}

function loadStationIntoForm(region, idx) {
  const st = STATIONS[region][idx];
  editingRegion  = region;
  editingIndex   = idx;
  fRegion.value  = region;
  fCall.value    = st.call;
  fName.value    = st.name;
  fLoc.value     = st.loc;
  fFreq.value    = st.freq;
  fDesc.value    = st.desc;
  fTags.value    = st.tags.join(',');
  fStreams.value  = st.streams.join('\n');
  formTitle.textContent    = 'EDITING: ' + st.call;
  editorStatus.textContent = '';
  editorStatus.className   = 'editor-status';
}

function saveStation() {
  const call    = fCall.value.trim().toUpperCase();
  const name    = fName.value.trim();
  const loc     = fLoc.value.trim().toUpperCase();
  const freq    = fFreq.value.trim();
  const desc    = fDesc.value.trim();
  const tags    = fTags.value.split(',').map(t => t.trim().toLowerCase()).filter(Boolean);
  const streams = fStreams.value.split('\n').map(s => s.trim()).filter(Boolean);
  const region  = fRegion.value;

  if (!call || !name || !streams.length) {
    editorStatus.textContent = '⚠ CALL SIGN, NAME AND AT LEAST ONE STREAM URL REQUIRED';
    editorStatus.className   = 'editor-status err';
    return;
  }

  const station = { call, name, loc, freq, desc, tags, streams };

  if (editingRegion !== null && editingIndex !== null) {
    STATIONS[editingRegion][editingIndex] = station;
    if (editingRegion !== region) {
      STATIONS[editingRegion].splice(editingIndex, 1);
      STATIONS[region].push(station);
    }
  } else {
    STATIONS[region].push(station);
  }

  saveUserStations();
  rebuildMainList();
  renderEditorList();
  clearForm();
  editingRegion = null; editingIndex = null;
  editorStatus.textContent = '✓ STATION SAVED AND INDEXED';
  editorStatus.className   = 'editor-status ok';
  addLog('DB UPDATE: ' + call + ' ADDED/MODIFIED', 'ok');
}

function deleteStation(region, idx) {
  const st = STATIONS[region][idx];
  if (!confirm('Remove ' + st.call + ' from the database?')) return;
  STATIONS[region].splice(idx, 1);
  saveUserStations();
  rebuildMainList();
  renderEditorList();
  clearForm();
  addLog('DB UPDATE: ' + st.call + ' REMOVED', 'warn');
}

// ── INIT ─────────────────────────────────────
loadUserStations();
rebuildMainList();

addLog('AUDIO RECEPTION SUBSYSTEM ONLINE', 'ok');
addLog('PHIL 9000 INTERFACE ACTIVE', 'ok');
addLog('CORS-FREE PLAYBACK ENGINE ACTIVE', 'ok');
addLog((STATIONS.us.length + STATIONS.intl.length) + ' BROADCAST SOURCES INDEXED');
addLog('AWAITING OPERATOR SELECTION');

// ── LIBRARY MODE ─────────────────────────────
let libraryData         = null;
let activeLibraryItem   = null;
let currentLibraryContext = null;

function clearLibraryActive() {
  if (activeLibraryItem) { activeLibraryItem.classList.remove('active'); activeLibraryItem = null; }
  currentLibraryContext = null;
}

function formatTrackName(filename) {
  return filename
    .replace(/\.[^.]+$/, '')
    .replace(/_[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, '')
    .replace(/^\d{1,3}[\s\-_.]+/, '')
    .trim();
}

async function loadLibrary() {
  const list = document.getElementById('libraryList');
  list.innerHTML = '<div class="lib-status">SCANNING MEDIA ARCHIVE...</div>';
  try {
    const r = await fetch('/api/library');
    if (!r.ok) throw new Error('HTTP ' + r.status);
    libraryData = await r.json();
    renderLibrary(libraryData);
    addLog('ARCHIVE INDEXED: ' + libraryData.length + ' ARTISTS', 'ok');
  } catch (e) {
    list.innerHTML = '<div class="lib-status lib-err">ARCHIVE UNAVAILABLE</div>';
    addLog('LIBRARY FETCH FAILED: ' + e.message, 'err');
  }
}

function renderLibrary(artists) {
  const list = document.getElementById('libraryList');
  list.innerHTML = '';
  const query = (document.getElementById('libSearchInput')?.value || '').toLowerCase();

  let rendered = 0;
  artists.forEach(artist => {
    const matchesArtist = !query || artist.name.toLowerCase().includes(query);
    const filteredAlbums = artist.albums.map(album => {
      const matchesAlbum = matchesArtist || album.name.toLowerCase().includes(query);
      const filteredTracks = matchesAlbum
        ? album.tracks
        : album.tracks.filter(t => formatTrackName(t).toLowerCase().includes(query));
      return filteredTracks.length ? { ...album, tracks: filteredTracks } : null;
    }).filter(Boolean);

    if (!filteredAlbums.length) return;
    rendered++;

    const section = document.createElement('div');
    section.className = 'lib-artist';

    const totalTracks = filteredAlbums.reduce((n, a) => n + a.tracks.length, 0);
    const header = document.createElement('div');
    header.className = 'lib-artist-header';
    header.innerHTML =
      `<span class="lib-expand-icon">▶</span>` +
      `<span class="lib-artist-name">${artist.name.toUpperCase()}</span>` +
      `<span class="lib-artist-meta">${filteredAlbums.length} ALB · ${totalTracks} TRK</span>`;

    const body = document.createElement('div');
    body.className = 'lib-artist-body';
    const autoExpand = !!query;
    body.style.display = autoExpand ? 'block' : 'none';
    if (autoExpand) header.querySelector('.lib-expand-icon').textContent = '▼';

    filteredAlbums.forEach(album => {
      const albumEl = document.createElement('div');
      albumEl.className = 'lib-album';
      const elements = buildAlbumTrackItems(artist.name, album.name, album.tracks);

      if (album.name) {
        const albumHeader = document.createElement('div');
        albumHeader.className = 'lib-album-header';

        const expandIcon = document.createElement('span');
        expandIcon.className = 'lib-expand-icon';
        expandIcon.textContent = autoExpand ? '▼' : '▶';

        const albumName = document.createElement('span');
        albumName.className = 'lib-album-name';
        albumName.textContent = album.name.toUpperCase();

        const albumMeta = document.createElement('span');
        albumMeta.className = 'lib-album-meta';
        albumMeta.textContent = album.tracks.length + ' TRK';

        const playAllBtn = document.createElement('button');
        playAllBtn.className = 'lib-play-album-btn';
        playAllBtn.textContent = '▶ ALL';
        playAllBtn.addEventListener('click', e => {
          e.stopPropagation();
          playLibraryTrack({ artist: artist.name, album: album.name, tracks: album.tracks, trackIdx: 0, elements });
        });

        albumHeader.appendChild(expandIcon);
        albumHeader.appendChild(albumName);
        albumHeader.appendChild(albumMeta);
        albumHeader.appendChild(playAllBtn);

        const trackList = document.createElement('div');
        trackList.className = 'lib-track-list';
        trackList.style.display = autoExpand ? 'block' : 'none';
        elements.forEach(el => trackList.appendChild(el));

        albumHeader.addEventListener('click', () => {
          const open = trackList.style.display !== 'none';
          trackList.style.display = open ? 'none' : 'block';
          expandIcon.textContent = open ? '▶' : '▼';
        });

        albumEl.appendChild(albumHeader);
        albumEl.appendChild(trackList);
      } else {
        elements.forEach(el => albumEl.appendChild(el));
      }

      body.appendChild(albumEl);
    });

    header.addEventListener('click', () => {
      const open = body.style.display !== 'none';
      body.style.display = open ? 'none' : 'block';
      header.querySelector('.lib-expand-icon').textContent = open ? '▶' : '▼';
    });

    section.appendChild(header);
    section.appendChild(body);
    list.appendChild(section);
  });

  if (!rendered) {
    list.innerHTML = '<div class="lib-status">NO MATCHES</div>';
  }
}

function buildAlbumTrackItems(artist, album, tracks) {
  const elements = [];
  tracks.forEach((track, i) => {
    const el = document.createElement('div');
    el.className = 'lib-track';
    el.innerHTML =
      `<span class="lib-track-num">${String(i + 1).padStart(2, '0')}</span>` +
      `<span class="lib-track-name">${formatTrackName(track).toUpperCase()}</span>`;
    el.addEventListener('click', () =>
      playLibraryTrack({ artist, album, tracks, trackIdx: i, elements }));
    elements.push(el);
  });
  return elements;
}

function advanceLibraryTrack() {
  if (!currentLibraryContext) {
    playing = false;
    philWrap.classList.remove('playing');
    sigOut.textContent  = 'COMPLETE';
    modeOut.textContent = 'STANDBY';
    animateVU(false);
    animateMeters(false);
    addLog('TRACK COMPLETE', 'ok');
    return;
  }
  const { artist, album, tracks, trackIdx, elements } = currentLibraryContext;
  const nextIdx = trackIdx + 1;
  if (nextIdx >= tracks.length) {
    playing = false;
    philWrap.classList.remove('playing');
    sigOut.textContent  = 'COMPLETE';
    modeOut.textContent = 'STANDBY';
    animateVU(false);
    animateMeters(false);
    if (activeLibraryItem) { activeLibraryItem.classList.remove('active'); activeLibraryItem = null; }
    currentLibraryContext = null;
    addLog('ALBUM COMPLETE', 'ok');
    return;
  }
  addLog('ADVANCING: TRACK ' + (nextIdx + 1) + ' OF ' + tracks.length);
  playLibraryTrack({ artist, album, tracks, trackIdx: nextIdx, elements });
}

function playLibraryTrack({ artist, album, tracks, trackIdx, elements }) {
  const filename = tracks[trackIdx];
  const el       = elements[trackIdx];

  const isSame = currentStation?.call === 'LIBRARY' &&
                 activeLibraryItem === el && playing;
  if (isSame) { stopAll(); return; }

  clearLibraryActive();
  activeLibraryItem = el;
  if (el) el.classList.add('active');
  currentLibraryContext = { artist, album, tracks, trackIdx, elements };

  const parts    = [artist, album, filename].filter(Boolean).map(encodeURIComponent);
  const streamUrl = '/api/library/stream/' + parts.join('/');

  const st = {
    call:    'LIBRARY',
    name:    artist,
    loc:     album || 'LOCAL LIBRARY',
    freq:    'FILE',
    desc:    formatTrackName(filename),
    tags:    [],
    streams: [streamUrl],
  };

  errorStrip.classList.remove('show');
  stopNowPlaying();
  destroyAudio();
  allOff();
  currentStation = st;

  recvStat.innerHTML   = formatTrackName(filename).toUpperCase() + '<span class="recv-cursor"></span>';
  recvDesc.textContent = artist.toUpperCase() + (album ? ' — ' + album.toUpperCase() : '');
  freqOut.textContent  = 'FILE';
  sigOut.textContent   = 'LOADING';
  modeOut.textContent  = 'BUFFERING';
  philWrap.classList.remove('playing');
  animateVU(false);
  animateMeters(false);

  npwArtist.textContent = artist.toUpperCase();
  npwTitle.textContent  = formatTrackName(filename).toUpperCase();
  npwAlbum.textContent  = album.toUpperCase();
  npwArt.style.display  = 'none';
  npwPlaceholder.style.display = 'flex';

  addLog('ACCESSING ARCHIVE: ' + artist.substring(0, 22).toUpperCase(), 'hi');
  addLog('TRACK: ' + formatTrackName(filename).substring(0, 28).toUpperCase());

  tryStream(st, null, 0);
}

// Mode toggle
document.getElementById('modeBroadcastBtn').addEventListener('click', () => {
  document.getElementById('broadcastPanel').style.display = '';
  document.getElementById('libraryPanel').style.display   = 'none';
  document.getElementById('modeBroadcastBtn').classList.add('active');
  document.getElementById('modeLibraryBtn').classList.remove('active');
});

document.getElementById('modeLibraryBtn').addEventListener('click', () => {
  document.getElementById('broadcastPanel').style.display = 'none';
  document.getElementById('libraryPanel').style.display   = '';
  document.getElementById('modeLibraryBtn').classList.add('active');
  document.getElementById('modeBroadcastBtn').classList.remove('active');
  if (!libraryData) loadLibrary();
});

document.getElementById('libSearchInput').addEventListener('input', () => {
  if (libraryData) renderLibrary(libraryData);
});
