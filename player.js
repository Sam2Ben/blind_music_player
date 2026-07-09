(function () {
  const STORAGE = 'aicrafters-blindtest-v2';
  const CIRC = 339.292;
  const TEAMS = ['Équipe A', 'Équipe B'];

  let tracks = [...window.TRACKS];
  let order = tracks.map((_, i) => i);
  let pos = 0;
  let filterCat = 'ALL';
  let guessMode = 'titre';
  let clipSec = 10;
  let scores = {};
  let playing = false;
  let chronoIv = null;
  let chronoLeft = 0;
  let chronoTotal = 0;
  let stopAt = null;
  let mp3Ready = {};
  let customBlobs = {};

  const audio = document.getElementById('audio');

  TEAMS.forEach((t) => { scores[t] = 0; });

  function load() {
    try {
      const s = JSON.parse(localStorage.getItem(STORAGE) || '{}');
      if (s.scores) scores = s.scores;
      if (s.order) order = s.order;
      if (typeof s.pos === 'number') pos = s.pos;
      if (s.customTracks) tracks = [...window.TRACKS, ...s.customTracks];
    } catch (_) { /* ignore */ }
  }

  function save() {
    localStorage.setItem(STORAGE, JSON.stringify({
      scores, order, pos,
      customTracks: tracks.filter((t) => t.custom),
    }));
  }

  function currentTrack() {
    return tracks[order[pos]];
  }

  function trackSrc(t) {
    if (customBlobs[t.id]) return customBlobs[t.id];
    return t.mp3 || '';
  }

  function fmt(sec) {
    if (sec === 0) return '∞';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return m > 0 ? `${m}:${String(s).padStart(2, '0')}` : String(s);
  }

  function setRing(frac) {
    document.getElementById('ringFg').style.strokeDashoffset = String(CIRC * (1 - frac));
  }

  function setProgress(frac) {
    document.getElementById('progressBar').style.width = `${Math.min(100, frac * 100)}%`;
  }

  function stopPlay() {
    if (chronoIv) clearInterval(chronoIv);
    chronoIv = null;
    playing = false;
    stopAt = null;
    audio.pause();
    document.getElementById('vinyl').classList.remove('playing');
    document.getElementById('bars').classList.remove('on');
    document.getElementById('btnPlay').textContent = '▶ Jouer';
  }

  function tickChrono() {
    if (clipSec === 0) {
      setRing(audio.duration ? audio.currentTime / audio.duration : 0.5);
      setProgress(audio.duration ? audio.currentTime / audio.duration : 0);
      if (stopAt && audio.currentTime >= stopAt) stopPlay();
      return;
    }
    chronoLeft -= 0.1;
    const left = Math.max(0, chronoLeft);
    document.getElementById('timerDigits').textContent = fmt(Math.ceil(left));
    setRing(left / chronoTotal);
    setProgress(1 - left / chronoTotal);
    if (left <= 0) stopPlay();
  }

  async function checkMp3(t) {
    const src = t.mp3;
    if (!src) return false;
    if (mp3Ready[t.id] !== undefined) return mp3Ready[t.id];
    try {
      const r = await fetch(src, { method: 'HEAD' });
      mp3Ready[t.id] = r.ok;
    } catch {
      mp3Ready[t.id] = false;
    }
    return mp3Ready[t.id];
  }

  async function scanAllMp3() {
    await Promise.all(tracks.map((t) => checkMp3(t)));
    const n = tracks.filter((t) => mp3Ready[t.id] || customBlobs[t.id]).length;
    document.getElementById('audioCount').textContent = `${n}/${tracks.length}`;
    renderList();
    updateMp3Status();
  }

  function updateMp3Status() {
    const t = currentTrack();
    const el = document.getElementById('mp3Status');
    if (customBlobs[t.id] || mp3Ready[t.id]) {
      el.textContent = '● MP3 prêt';
      el.className = 'mp3-status ok';
    } else {
      el.textContent = '○ MP3 manquant';
      el.className = 'mp3-status miss';
    }
  }

  function loadAudioForRound() {
    const t = currentTrack();
    const src = trackSrc(t);
    stopPlay();
    document.getElementById('timerDigits').textContent = '—';
    setRing(0);
    setProgress(0);
    if (src) {
      audio.src = src;
      audio.load();
    } else {
      audio.removeAttribute('src');
    }
    updateMp3Status();
  }

  function startPlay() {
    const t = currentTrack();
    const src = trackSrc(t);
    if (!src) {
      alert(`MP3 manquant : ${t.mp3}\n\nLance : python scripts/download_audio.py\nOu importe un fichier via 📁`);
      return;
    }
    stopPlay();
    audio.currentTime = 0;
    chronoTotal = clipSec || 999;
    chronoLeft = clipSec || 999;
    stopAt = clipSec > 0 ? clipSec : null;

    audio.play().then(() => {
      playing = true;
      document.getElementById('vinyl').classList.add('playing');
      document.getElementById('bars').classList.add('on');
      document.getElementById('btnPlay').textContent = '⏹ Stop';
      if (clipSec === 0) {
        document.getElementById('timerDigits').textContent = '∞';
        setRing(1);
      } else {
        document.getElementById('timerDigits').textContent = fmt(clipSec);
        setRing(1);
      }
      chronoIv = setInterval(tickChrono, 100);
    }).catch(() => {
      alert('Impossible de lire le MP3. Vérifie le fichier ou utilise un serveur local (python -m http.server).');
    });
  }

  function renderScores() {
    document.getElementById('scores').innerHTML = TEAMS.map(
      (t) => `<div class="score-card"><div class="pts">${scores[t] || 0}</div><div class="name">${t}</div></div>`
    ).join('');
  }

  function renderFilters() {
    const el = document.getElementById('filters');
    const cats = [{ id: 'ALL', label: 'Tout' }, ...Object.entries(window.CAT_LABELS).map(([id, c]) => ({ id, label: c.label }))];
    el.innerHTML = cats.map(
      (c) => `<button type="button" class="filter-chip ${filterCat === c.id ? 'on' : ''}" data-cat="${c.id}">${c.label}</button>`
    ).join('');
    el.querySelectorAll('.filter-chip').forEach((btn) => {
      btn.addEventListener('click', () => {
        filterCat = btn.dataset.cat;
        renderFilters();
        renderList();
      });
    });
  }

  function renderList() {
    const ul = document.getElementById('trackList');
    ul.innerHTML = order.map((idx, i) => {
      const t = tracks[idx];
      if (filterCat !== 'ALL' && t.categorie !== filterCat) return '';
      const active = i === pos ? 'active' : '';
      const has = mp3Ready[t.id] || customBlobs[t.id];
      const dot = has ? 'dot-ok' : 'dot-miss';
      return `<li class="${active}" data-i="${i}"><span class="dot ${dot}"></span><span class="t-title">${t.titre}</span><span class="t-artist">${t.artiste}</span></li>`;
    }).join('');
    ul.querySelectorAll('li').forEach((li) => {
      li.addEventListener('click', () => {
        pos = Number(li.dataset.i);
        save();
        renderRound();
      });
    });
  }

  function renderTeamRow() {
    const el = document.getElementById('teamRow');
    el.innerHTML = TEAMS.map(
      (t) => `
        <button type="button" data-team="${t}" data-pts="1">${t} +1</button>
        <button type="button" class="bonus" data-team="${t}" data-pts="2">${t} +2</button>`
    ).join('');
    el.querySelectorAll('button').forEach((btn) => {
      btn.addEventListener('click', () => {
        scores[btn.dataset.team] = (scores[btn.dataset.team] || 0) + Number(btn.dataset.pts);
        save();
        renderScores();
      });
    });
  }

  function renderRound() {
    const t = currentTrack();
    if (!t) return;
    const cat = window.CAT_LABELS[t.categorie] || { label: t.categorie, color: '#ccc' };
    const pill = document.getElementById('catPill');
    pill.textContent = cat.label;
    pill.style.background = cat.color;
    document.getElementById('roundNum').textContent = `${pos + 1} / ${order.length}`;
    document.getElementById('trendLine').textContent = t.trend || '';
    document.getElementById('indice').textContent = t.indice ? `Indice : ${t.indice}` : '';
    document.getElementById('answerBox').classList.add('hidden');
    const hints = { titre: 'le TITRE', artiste: "l'ARTISTE", lesdeux: 'titre + artiste (+2)' };
    document.querySelector('.mode-label').textContent = `Devine ${hints[guessMode]} :`;
    loadAudioForRound();
    renderList();
  }

  function reveal() {
    const t = currentTrack();
    stopPlay();
    document.getElementById('ansTitle').textContent = t.titre;
    document.getElementById('ansArtist').textContent = t.artiste;
    document.getElementById('ansNote').textContent = t.trend || '';
    const reel = document.getElementById('ansReel');
    const isIa = t.reelOuIa === 'ia';
    reel.textContent = isIa ? '🤖 Généré par IA' : '✅ Musique réelle';
    reel.style.background = isIa ? '#FF7A4D' : '#46D6A8';
    reel.style.color = '#fff';
    document.getElementById('answerBox').classList.remove('hidden');
  }

  document.querySelectorAll('.mode-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.mode-btn').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      guessMode = btn.dataset.mode;
      renderRound();
    });
  });

  document.querySelectorAll('.clip').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.clip').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      clipSec = Number(btn.dataset.sec);
    });
  });

  document.getElementById('btnPlay').addEventListener('click', () => {
    if (playing) stopPlay();
    else startPlay();
  });

  document.getElementById('btnPrev').addEventListener('click', () => {
    pos = (pos - 1 + order.length) % order.length;
    save();
    renderRound();
  });

  document.getElementById('btnNext').addEventListener('click', () => {
    pos = (pos + 1) % order.length;
    save();
    renderRound();
  });

  document.getElementById('btnReveal').addEventListener('click', reveal);

  document.getElementById('btnShuffle').addEventListener('click', () => {
    for (let i = order.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [order[i], order[j]] = [order[j], order[i]];
    }
    pos = 0;
    save();
    renderRound();
  });

  document.getElementById('btnReset').addEventListener('click', () => {
    if (!confirm('Remettre les scores à zéro ?')) return;
    TEAMS.forEach((t) => { scores[t] = 0; });
    save();
    renderScores();
  });

  document.getElementById('btnFs').addEventListener('click', () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      document.body.classList.add('present-mode');
    } else {
      document.exitFullscreen();
    }
  });

  document.addEventListener('fullscreenchange', () => {
    if (!document.fullscreenElement) return;
    document.body.classList.add('present-mode');
  });

  document.getElementById('btnFormateur').addEventListener('click', () => {
    document.body.classList.toggle('present-mode');
    const on = !document.body.classList.contains('present-mode');
    document.getElementById('btnFormateur').textContent = on ? '🎛 Formateur' : '👁 Mode présentation';
  });

  document.getElementById('fileImport').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const t = currentTrack();
    if (customBlobs[t.id]) URL.revokeObjectURL(customBlobs[t.id]);
    customBlobs[t.id] = URL.createObjectURL(file);
    loadAudioForRound();
    scanAllMp3();
    e.target.value = '';
  });

  audio.addEventListener('ended', () => stopPlay());

  load();
  renderScores();
  renderFilters();
  renderTeamRow();
  renderRound();
  scanAllMp3();
})();
