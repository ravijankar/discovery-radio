// ═══════════════════════════════════════════
//  WJC3 RADIO — Single-Station Player
// ═══════════════════════════════════════════

const STATION = {
  call: 'WJC3',
  name: 'WJC3 Radio',
  desc: 'Personal Jazz Archive · Live Stream',
  streams: [
    'https://radio.ravijankar.com/listen/jc3_radio/radio.mp3',
  ],
  nowPlayingUrl: 'https://radio.ravijankar.com/api/nowplaying/jc3_radio',
};

// ── TOKEN ────────────────────────────────────
const TOKEN = new URLSearchParams(location.search).get('token') || '';

// ── STATE ────────────────────────────────────
let audio = null;
let playing = false;
let currentVolume = 0.5;
let nowPlayingTimer = null;
let progressTimer = null;
let npElapsedBase = 0;
let npDuration = 0;
let npPollTime = 0;

// ── DOM ──────────────────────────────────────
const philWrap       = document.getElementById('philWrap');
const eyeLabel      = document.getElementById('eyeLabel');
const statusVal     = document.getElementById('statusVal');
const listenerCount = document.getElementById('listenerCount');
const npArt         = document.getElementById('npArt');
const npArtPlaceholder = document.getElementById('npArtPlaceholder');
const npArtist      = document.getElementById('npArtist');
const npTitle       = document.getElementById('npTitle');
const npAlbum       = document.getElementById('npAlbum');
const npElapsed     = document.getElementById('npElapsed');
const npDurationEl  = document.getElementById('npDuration');
const npFill        = document.getElementById('npFill');
const errorStrip    = document.getElementById('errorStrip');
const logOut        = document.getElementById('logOut');

// ── LOG ──────────────────────────────────────
const logLines = [];
function addLog(msg, cls = '') {
  const ts = new Date().toISOString().substr(11, 8);
  logLines.push({ ts, msg, cls });
  if (logLines.length > 10) logLines.shift();
  logOut.innerHTML = logLines.map(l =>
    `<div class="log-line ${l.cls}"><span class="log-ts">${l.ts}</span><span>${l.msg}</span></div>`
  ).join('');
}

// ── UTC CLOCK ────────────────────────────────
function tickClock() {
  const now = new Date();
  document.getElementById('utcClock').textContent =
    String(now.getUTCHours()).padStart(2,'0') + ':' +
    String(now.getUTCMinutes()).padStart(2,'0') + ':' +
    String(now.getUTCSeconds()).padStart(2,'0');
}
tickClock();
setInterval(tickClock, 1000);

// ── VU METER ─────────────────────────────────
const vuL = document.getElementById('vuL');
const vuR = document.getElementById('vuR');
const vuBarsL = [], vuBarsR = [];
for (let i = 0; i < 16; i++) {
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
        const pct = h / 28;
        const cls = pct > 0.85 ? 'l4' : pct > 0.6 ? 'l3' : 'l1';
        b.style.height = h + 'px';
        b.className = 'vu-bar ' + cls;
      });
    });
  }, 85);
}

// ── SIGNAL METERS ────────────────────────────
let meterTimer = null;
function animateMeters(on) {
  clearInterval(meterTimer);
  document.getElementById('mSig').style.width  = '0%';
  document.getElementById('mBuf').style.width  = '0%';
  document.getElementById('mSigVal').textContent = '0%';
  document.getElementById('mBufVal').textContent = '0%';
  if (!on) return;
  meterTimer = setInterval(() => {
    const sig = 75 + Math.random() * 20;
    const buf = 85 + Math.random() * 12;
    document.getElementById('mSig').style.width    = sig + '%';
    document.getElementById('mBuf').style.width    = buf + '%';
    document.getElementById('mSigVal').textContent = Math.round(sig) + '%';
    document.getElementById('mBufVal').textContent = Math.round(buf) + '%';
  }, 1200);
}

// ── VOLUME KNOB ──────────────────────────────
const knobCanvas = document.getElementById('volKnob');
const knobCtx    = knobCanvas.getContext('2d');
const MIN_ANGLE  = 135;

function drawKnob(vol) {
  const c = knobCanvas;
  const cx = c.width / 2, cy = c.height / 2;
  const r = cx - 6;
  knobCtx.clearRect(0, 0, c.width, c.height);

  const startRad = MIN_ANGLE * Math.PI / 180;
  const endRad   = (MIN_ANGLE + 270) * Math.PI / 180;
  const valRad   = (MIN_ANGLE + (vol / 100) * 270) * Math.PI / 180;

  knobCtx.beginPath();
  knobCtx.arc(cx, cy, r, startRad, endRad, false);
  knobCtx.strokeStyle = '#2a2a2a';
  knobCtx.lineWidth = 4; knobCtx.lineCap = 'round';
  knobCtx.stroke();

  knobCtx.beginPath();
  knobCtx.arc(cx, cy, r, startRad, valRad, false);
  knobCtx.strokeStyle = vol > 0 ? '#d4820a' : '#333';
  knobCtx.lineWidth = 4; knobCtx.lineCap = 'round';
  knobCtx.stroke();

  for (let i = 0; i <= 10; i++) {
    const a = (MIN_ANGLE + (i / 10) * 270) * Math.PI / 180;
    knobCtx.beginPath();
    knobCtx.moveTo(cx + Math.cos(a) * (r - 7), cy + Math.sin(a) * (r - 7));
    knobCtx.lineTo(cx + Math.cos(a) * (r - 2), cy + Math.sin(a) * (r - 2));
    knobCtx.strokeStyle = i * 10 <= vol ? '#7a4a05' : '#1e1e1e';
    knobCtx.lineWidth = i % 5 === 0 ? 2 : 1;
    knobCtx.stroke();
  }

  const bodyR = r - 12;
  const grad = knobCtx.createRadialGradient(cx - bodyR * 0.2, cy - bodyR * 0.2, 1, cx, cy, bodyR);
  grad.addColorStop(0, '#222');
  grad.addColorStop(1, '#0a0a0a');
  knobCtx.beginPath();
  knobCtx.arc(cx, cy, bodyR, 0, Math.PI * 2);
  knobCtx.fillStyle = grad;
  knobCtx.fill();
  knobCtx.strokeStyle = '#333';
  knobCtx.lineWidth = 1;
  knobCtx.stroke();

  const pa = valRad;
  knobCtx.beginPath();
  knobCtx.moveTo(cx + Math.cos(pa) * bodyR * 0.3, cy + Math.sin(pa) * bodyR * 0.3);
  knobCtx.lineTo(cx + Math.cos(pa) * bodyR * 0.85, cy + Math.sin(pa) * bodyR * 0.85);
  knobCtx.strokeStyle = vol > 0 ? '#d4820a' : '#555';
  knobCtx.lineWidth = 2; knobCtx.lineCap = 'round';
  knobCtx.stroke();

  knobCtx.beginPath();
  knobCtx.arc(cx, cy, 3, 0, Math.PI * 2);
  knobCtx.fillStyle = '#444';
  knobCtx.fill();
}

function setVolume(v) {
  v = Math.max(0, Math.min(100, Math.round(v)));
  currentVolume = v / 100;
  document.getElementById('volSlider').value = v;
  document.getElementById('volKnobVal').textContent = v + '%';
  if (audio) audio.volume = Math.pow(currentVolume, 2);
  drawKnob(v);
}

let knobDragging = false, knobDragStartY = 0, knobDragStartVol = 80;
knobCanvas.addEventListener('mousedown', e => {
  knobDragging = true; knobDragStartY = e.clientY;
  knobDragStartVol = Math.round(currentVolume * 100); e.preventDefault();
});
window.addEventListener('mousemove', e => {
  if (!knobDragging) return;
  setVolume(knobDragStartVol + (knobDragStartY - e.clientY) * 0.6);
});
window.addEventListener('mouseup', () => { knobDragging = false; });
knobCanvas.addEventListener('touchstart', e => {
  knobDragging = true; knobDragStartY = e.touches[0].clientY;
  knobDragStartVol = Math.round(currentVolume * 100); e.preventDefault();
}, { passive: false });
window.addEventListener('touchmove', e => {
  if (!knobDragging) return;
  setVolume(knobDragStartVol + (knobDragStartY - e.touches[0].clientY) * 0.6);
}, { passive: false });
window.addEventListener('touchend', () => { knobDragging = false; });
knobCanvas.addEventListener('wheel', e => {
  e.preventDefault();
  setVolume(Math.round(currentVolume * 100) - Math.sign(e.deltaY) * 3);
}, { passive: false });
document.getElementById('volSlider').addEventListener('input', function () { setVolume(parseInt(this.value)); });
setVolume(50);

// ── FORMAT TIME ──────────────────────────────
function fmtTime(s) {
  if (!s || isNaN(s)) return '—';
  s = Math.max(0, Math.floor(s));
  const m = Math.floor(s / 60);
  const ss = String(s % 60).padStart(2, '0');
  return m + ':' + ss;
}

// ── PROGRESS TICK ────────────────────────────
function tickProgress() {
  if (!playing || !npDuration) return;
  const elapsed = npElapsedBase + (Date.now() - npPollTime) / 1000;
  const pct = Math.min(100, (elapsed / npDuration) * 100);
  npFill.style.width = pct + '%';
  npElapsed.textContent = fmtTime(elapsed);
}

// ── NOW PLAYING ──────────────────────────────
function startNowPlaying() {
  clearInterval(nowPlayingTimer);
  clearInterval(progressTimer);
  pollNowPlaying();
  nowPlayingTimer = setInterval(pollNowPlaying, 15000);
  progressTimer   = setInterval(tickProgress, 1000);
}

function stopNowPlaying() {
  clearInterval(nowPlayingTimer);
  clearInterval(progressTimer);
  nowPlayingTimer = null;
  progressTimer   = null;
}

function updateNowPlaying(artist, title, album, art, elapsed, duration) {
  npArtist.textContent = (artist || '—').toUpperCase();
  npTitle.textContent  = (title  || '—').toUpperCase();
  npAlbum.textContent  = (album  || '').toUpperCase();
  if (art) {
    npArt.src = art;
    npArt.style.display = 'block';
    npArtPlaceholder.style.display = 'none';
    npArt.onerror = () => {
      npArt.style.display = 'none';
      npArtPlaceholder.style.display = 'flex';
    };
  } else {
    npArt.style.display = 'none';
    npArtPlaceholder.style.display = 'flex';
  }
  if (elapsed !== undefined && duration !== undefined) {
    npElapsedBase = elapsed;
    npDuration    = duration;
    npPollTime    = Date.now();
    npDurationEl.textContent = fmtTime(npDuration);
    tickProgress();
  }
}

function pollNowPlaying() {
  if (!playing) return;
  fetch(STATION.nowPlayingUrl)
    .then(r => r.json())
    .then(data => {
      if (!playing) return;
      const listeners = data?.listeners?.current;
      if (listeners !== undefined) listenerCount.textContent = listeners;
      const song = data?.now_playing?.song;
      const np   = data?.now_playing;
      if (song) {
        updateNowPlaying(song.artist, song.title, song.album, song.art,
          np?.elapsed, np?.duration);
      } else {
        pollIcyFallback();
      }
    })
    .catch(() => { if (playing) pollIcyFallback(); });
}

function pollIcyFallback() {
  const url = STATION.streams[0];
  fetch('/api/icy-meta?url=' + encodeURIComponent(url))
    .then(r => r.json())
    .then(data => {
      if (!playing) return;
      if (data.raw) updateNowPlaying(data.artist, data.title, null, data.artUrl || null);
    })
    .catch(() => {});
}

// ── PLAYBACK ──────────────────────────────────
function destroyAudio() {
  if (audio) {
    audio.pause();
    audio.removeAttribute('src');
    audio.load();
    audio = null;
  }
  playing = false;
}

function tryStream(idx) {
  if (idx >= STATION.streams.length) { onAllFailed(); return; }
  const base = STATION.streams[idx];
  const url = TOKEN ? `${base}${base.includes('?') ? '&' : '?'}token=${encodeURIComponent(TOKEN)}` : base;
  addLog('TRYING SOURCE ' + (idx + 1) + '/' + STATION.streams.length + ': ' + url.split('/').pop().substring(0, 35), idx > 0 ? 'warn' : '');

  destroyAudio();
  audio = new Audio();
  audio.volume  = Math.pow(currentVolume, 2);
  audio.preload = 'none';
  audio.src     = url;

  let connectTimer = setTimeout(() => {
    if (!playing) {
      addLog('TIMEOUT — TRYING NEXT SOURCE', 'warn');
      tryStream(idx + 1);
    }
  }, 12000);

  audio.addEventListener('playing', () => {
    clearTimeout(connectTimer);
    playing = true;
    philWrap.classList.add('playing');
    eyeLabel.textContent = 'DISENGAGE TRANSMISSION';
    setStatus('RECEIVING');
    errorStrip.classList.remove('show');
    addLog('SIGNAL LOCKED — SOURCE ' + (idx + 1), 'ok');
    animateVU(true);
    animateMeters(true);
    startNowPlaying();
  }, { once: true });

  audio.addEventListener('error', () => {
    clearTimeout(connectTimer);
    if (!playing) {
      addLog('SOURCE ' + (idx + 1) + ' FAULT — ADVANCING', 'warn');
      tryStream(idx + 1);
    }
  }, { once: true });

  audio.play().catch(err => {
    clearTimeout(connectTimer);
    if (!playing) {
      addLog('PLAY REJECTED: ' + err.name + ' — TRYING NEXT', 'warn');
      tryStream(idx + 1);
    }
  });
}

function onAllFailed() {
  destroyAudio();
  philWrap.classList.remove('playing');
  eyeLabel.textContent = 'ENGAGE TRANSMISSION';
  setStatus('FAULT');
  errorStrip.classList.add('show');
  npArtist.textContent = '—';
  npTitle.textContent  = 'TRANSMISSION FAULT';
  npAlbum.textContent  = '';
  npFill.style.width   = '0%';
  npElapsed.textContent = '—';
  npDurationEl.textContent = '—';
  npArt.style.display  = 'none';
  npArtPlaceholder.style.display = 'flex';
  animateVU(false);
  animateMeters(false);
  stopNowPlaying();
  addLog('ALL SOURCES EXHAUSTED — STATION UNAVAILABLE', 'err');
}

function startPlayback() {
  errorStrip.classList.remove('show');
  setStatus('ACQUIRING');
  npTitle.textContent  = 'ACQUIRING SIGNAL';
  npArtist.textContent = '—';
  npAlbum.textContent  = '';
  addLog('ACQUIRING WJC3 — INITIATING SIGNAL LOCK', 'hi');
  tryStream(0);
}

function stopPlayback() {
  destroyAudio();
  philWrap.classList.remove('playing');
  eyeLabel.textContent = 'ENGAGE TRANSMISSION';
  setStatus('STANDBY');
  errorStrip.classList.remove('show');
  npArtist.textContent = '—';
  npTitle.textContent  = 'AWAITING SIGNAL';
  npAlbum.textContent  = '';
  npFill.style.width   = '0%';
  npElapsed.textContent = '—';
  npDurationEl.textContent = '—';
  animateVU(false);
  animateMeters(false);
  stopNowPlaying();
  addLog('TRANSMISSION TERMINATED BY OPERATOR', 'warn');
}

function setStatus(s) {
  statusVal.textContent = s;
  statusVal.className   = 'stat-val status-val';
  if (s === 'RECEIVING') statusVal.classList.add('receiving');
  if (s === 'FAULT')     statusVal.classList.add('fault');
}

philWrap.addEventListener('click', () => {
  if (playing || audio !== null) stopPlayback();
  else startPlayback();
});

// ── INIT ─────────────────────────────────────
addLog('WJC3 AUDIO SYSTEM ONLINE', 'ok');
addLog('STREAM: ' + STATION.streams[0].split('/').slice(-2).join('/'), 'ok');
addLog('CLICK THE EYE TO BEGIN TRANSMISSION');
