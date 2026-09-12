/* ==========================================================
   Summoner's Tally — app logic
   ========================================================== */

// The base/default Riftbound game: normal scoring caps at 7, the
// decisive final point only comes from HOLD or controlling two
// battlefields. Any other "first to N" target is treated as a plain
// race-to-N with no cap (kept for house-rule flexibility).
const BASE_GAME_TARGET = 8;
const BASE_GAME_CAP = 7;

// ---------- state ----------
const state = {
  p1Champion: null, // { id, name, title, display, accent, art }
  p2Champion: null,
  winPoints: 8,
  score1: 0,
  score2: 0,
  gameOver: false,
};

function isBaseGame() {
  return state.winPoints === BASE_GAME_TARGET;
}

// ---------- ambient embers ----------
function spawnEmbers() {
  const container = document.getElementById('ambient-embers');
  const colors = ['#C8AA6E', '#0BC6E3', '#E0433E'];
  for (let i = 0; i < 16; i++) {
    const el = document.createElement('div');
    const size = 2 + Math.random() * 3;
    el.className = 'ember';
    el.style.width = size + 'px';
    el.style.height = size + 'px';
    el.style.background = colors[i % colors.length];
    el.style.opacity = '0.45';
    el.style.left = Math.random() * 100 + 'vw';
    el.style.top = 35 + Math.random() * 65 + 'vh';
    el.style.setProperty('--dx', (Math.random() * 40 - 20) + 'px');
    el.style.animationDuration = (6 + Math.random() * 6) + 's';
    el.style.animationDelay = (Math.random() * 7) + 's';
    container.appendChild(el);
  }
}
spawnEmbers();

// ---------- generic preset-button group helper ----------
function setupPresetGroup(groupId, hiddenFieldId, defaultIndex) {
  const btns = Array.from(document.querySelectorAll(`#${groupId} .preset-btn`));
  const field = document.getElementById(hiddenFieldId);

  function select(btn) {
    btns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    field.value = btn.dataset.val;
  }
  btns.forEach(b => b.addEventListener('click', () => select(b)));
  select(btns[defaultIndex]);

  return { btns, select, reset: () => select(btns[defaultIndex]) };
}

const pointsGroup = setupPresetGroup('win-presets', 'win-points', 1);   // default: 8

// ---------- custom toggle helper (points target) ----------
function setupCustomToggle(toggleId, inputId, hiddenFieldId, presetGroup) {
  const toggle = document.getElementById(toggleId);
  const input = document.getElementById(inputId);
  const field = document.getElementById(hiddenFieldId);

  function activate() {
    presetGroup.btns.forEach(b => b.classList.remove('active'));
    toggle.classList.add('active');
    input.classList.remove('hidden');
    input.focus();
    if (input.value) field.value = input.value;
  }
  function deactivate() {
    toggle.classList.remove('active');
    input.classList.add('hidden');
    presetGroup.reset();
  }

  toggle.addEventListener('click', () => {
    toggle.classList.contains('active') ? deactivate() : activate();
  });
  input.addEventListener('input', () => {
    if (input.value) field.value = input.value;
  });

  return { activate, deactivate, reset: () => { deactivate(); input.value = ''; } };
}

const customPoints = setupCustomToggle('custom-points-toggle', 'custom-points-input', 'win-points', pointsGroup);

// ---------- champion picking (setup screen) ----------
const championPickerModal = createChampionPickerModal();

function championArtLayer(champion) {
  // Multiple background layers: real art (if a matching file exists in
  // assets/champions/) painted over a themed crest gradient fallback.
  // A missing/broken image layer simply renders transparent, so the
  // gradient underneath always shows through cleanly.
  return `linear-gradient(180deg, rgba(1,10,19,0.25), rgba(1,10,19,0.92)), url('${champion.art}'), ` +
    `linear-gradient(160deg, ${champion.accent} 0%, #0A1428 75%)`;
}

function renderChampionButton(side) {
  const btn = document.getElementById(`p${side}-champion-btn`);
  const champion = state[`p${side}Champion`];
  if (!champion) {
    btn.innerHTML = `<span class="champion-pick-placeholder">⚔ CHOOSE YOUR CHAMPION</span>`;
    btn.classList.remove('champion-pick-filled');
    return;
  }
  btn.classList.add('champion-pick-filled');
  btn.style.backgroundImage = championArtLayer(champion);
  btn.innerHTML = `
    <span class="champion-pick-info">
      <span class="champion-pick-name">${champion.name}</span>
      <span class="champion-pick-title">${champion.title}</span>
    </span>
    <span class="champion-pick-change">CHANGE ✎</span>
  `;
}

function pickChampion(side) {
  const other = side === 1 ? state.p2Champion : state.p1Champion;
  championPickerModal.show({
    excludeId: other ? other.id : null,
    onPick: (champion) => {
      state[`p${side}Champion`] = champion;
      renderChampionButton(side);
    },
  });
}

document.getElementById('p1-champion-btn').addEventListener('click', () => pickChampion(1));
document.getElementById('p2-champion-btn').addEventListener('click', () => pickChampion(2));

// ---------- setup form submit ----------
document.getElementById('setup-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const win = parseInt(document.getElementById('win-points').value, 10);
  const errorEl = document.getElementById('form-error');

  if (!state.p1Champion || !state.p2Champion || !win || win < 1) {
    errorEl.classList.remove('hidden');
    return;
  }
  errorEl.classList.add('hidden');

  state.winPoints = win;
  state.score1 = 0;
  state.score2 = 0;

  launchMatch();
});

// ---------- screens ----------
const setupScreen = document.getElementById('setup-screen');
const matchScreen = document.getElementById('match-screen');
const siteFooter = document.getElementById('site-footer');

function applyChampionToPanel(side) {
  const champion = state[`p${side}Champion`];
  const panel = document.getElementById(`p${side}-panel`);
  const label = document.getElementById(`p${side}-label`);
  if (!champion) return;
  panel.style.setProperty('--accent', champion.accent);
  panel.style.backgroundImage = championArtLayer(champion);
  label.textContent = champion.name;
}

// show/hide the "2 BATTLEFIELDS" finisher button — only relevant to the
// base 8-point game, where it's a second valid way (besides HOLD) to
// claim the decisive final point
function applyGameModeUI() {
  const baseGame = isBaseGame();
  document.getElementById('p1-battlefields').classList.toggle('hidden', !baseGame);
  document.getElementById('p2-battlefields').classList.toggle('hidden', !baseGame);
}

function launchMatch() {
  applyChampionToPanel(1);
  applyChampionToPanel(2);
  document.getElementById('target-label').textContent = state.winPoints;
  applyGameModeUI();
  reviveControls();
  renderScores();
  setupScreen.classList.add('hidden');
  matchScreen.classList.remove('hidden');
  matchScreen.classList.add('flex');
  siteFooter.classList.add('hidden');
  startStopwatch();
}

function goToSetup(prefill) {
  stopStopwatch();
  matchScreen.classList.add('hidden');
  matchScreen.classList.remove('flex');
  setupScreen.classList.remove('hidden');
  siteFooter.classList.remove('hidden');
  if (!prefill) {
    document.getElementById('setup-form').reset();
    pointsGroup.reset();
    customPoints.reset();
    state.p1Champion = null;
    state.p2Champion = null;
    renderChampionButton(1);
    renderChampionButton(2);
  }
}
const confirmModal = createConfirmModal();

const matchMenuModal = createMatchMenuModal({
  onReset: () => {
    if (state.gameOver) return;
    state.score1 = 0;
    state.score2 = 0;
    renderScores();
  },
  onBack: () => {
    confirmModal.show({
      title: 'End this match?',
      message: 'Going back to setup will discard the current scores and timer for this game.',
      confirmText: 'YES, END MATCH',
      onConfirm: () => goToSetup(false),
    });
  },
});

document.getElementById('match-menu-btn').addEventListener('click', () => {
  matchMenuModal.show();
});

// ---------- match stopwatch ----------
// No fixed game length — the clock just counts up so you can see how
// long the match ran, shown live in the center strip and again on the
// winner screen once the match ends.
let stopwatchInterval = null;
let stopwatchStartTs = null;
let lastMatchDuration = '';
const timerEl = document.getElementById('game-timer');

function formatDuration(ms) {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  const mm = String(m).padStart(2, '0');
  const ss = String(s).padStart(2, '0');
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

function startStopwatch() {
  stopStopwatch();
  stopwatchStartTs = Date.now();
  updateStopwatch();
  stopwatchInterval = setInterval(updateStopwatch, 1000);
}

function stopStopwatch() {
  if (stopwatchInterval) clearInterval(stopwatchInterval);
  stopwatchInterval = null;
}

function updateStopwatch() {
  timerEl.textContent = formatDuration(Date.now() - stopwatchStartTs);
}

// ---------- scoring ----------
function renderScores() {
  document.getElementById('p1-score').textContent = state.score1;
  document.getElementById('p2-score').textContent = state.score2;

  const pct1 = Math.min(100, (state.score1 / state.winPoints) * 100);
  const pct2 = Math.min(100, (state.score2 / state.winPoints) * 100);
  document.getElementById('p1-bar').style.width = pct1 + '%';
  document.getElementById('p2-bar').style.width = pct2 + '%';
  document.getElementById('p1-frac').textContent = `${state.score1} / ${state.winPoints}`;
  document.getElementById('p2-frac').textContent = `${state.score2} / ${state.winPoints}`;

  updateFinisherButtons();
}

// the threshold at which HOLD (and, in the base game, 2 BATTLEFIELDS)
// becomes available: in the base 8-point game that's 7 (scoring itself
// is capped at 7, so the decisive point can only come from a finisher
// action); for any other target it's simply the target itself
function finisherThreshold() {
  return isBaseGame() ? BASE_GAME_CAP : state.winPoints;
}

function updateFinisherButtons() {
  const threshold = finisherThreshold();
  const eligible1 = state.score1 >= threshold;
  const eligible2 = state.score2 >= threshold;

  ['1', '2'].forEach(p => {
    const eligible = p === '1' ? eligible1 : eligible2;
    const holdBtn = document.getElementById(`p${p}-hold`);
    holdBtn.disabled = !eligible || state.gameOver;
    holdBtn.classList.toggle('hold-ready', eligible && !state.gameOver);

    const bfBtn = document.getElementById(`p${p}-battlefields`);
    bfBtn.disabled = !eligible || state.gameOver;
    bfBtn.classList.toggle('hold-ready', eligible && !state.gameOver);
  });
}

function bumpScore(player) {
  if (state.gameOver) return;
  const key = player === '1' ? 'score1' : 'score2';
  const scoreEl = document.getElementById(`p${player}-score`);

  // base game: normal scoring is capped at 7 — the decisive point only
  // comes from HOLD or 2 BATTLEFIELDS
  if (isBaseGame() && state[key] >= BASE_GAME_CAP) {
    scoreEl.classList.remove('score-shake');
    void scoreEl.offsetWidth;
    scoreEl.classList.add('score-shake');
    return;
  }

  state[key] += 1;
  renderScores();

  scoreEl.classList.remove('score-bump');
  void scoreEl.offsetWidth;
  scoreEl.classList.add('score-bump');
}

document.querySelectorAll('.point-btn').forEach(btn => {
  btn.addEventListener('click', () => bumpScore(btn.dataset.player));
});

// tapping the big score number itself is an equally valid — and even
// bigger — touch target for adding a point mid-game
document.getElementById('p1-score').addEventListener('click', () => bumpScore('1'));
document.getElementById('p2-score').addEventListener('click', () => bumpScore('2'));

document.querySelectorAll('.correction-link').forEach(btn => {
  btn.addEventListener('click', () => {
    if (state.gameOver) return;
    const player = btn.dataset.player;
    const key = player === '1' ? 'score1' : 'score2';
    const scoreEl = document.getElementById(`p${player}-score`);

    if (state[key] === 0) {
      scoreEl.classList.remove('score-shake');
      void scoreEl.offsetWidth;
      scoreEl.classList.add('score-shake');
      return;
    }
    state[key] -= 1;
    renderScores();
  });
});

function claimWin(player, reason) {
  if (state.gameOver) return;
  const key = player === '1' ? 'score1' : 'score2';
  if (state[key] < finisherThreshold()) return;
  const champion = player === '1' ? state.p1Champion : state.p2Champion;
  endGame();
  winnerModal.showWin(champion.name, state[key], reason, lastMatchDuration);
}

document.getElementById('p1-hold').addEventListener('click', () => claimWin('1', 'hold'));
document.getElementById('p2-hold').addEventListener('click', () => claimWin('2', 'hold'));
document.getElementById('p1-battlefields').addEventListener('click', () => claimWin('1', 'battlefields'));
document.getElementById('p2-battlefields').addEventListener('click', () => claimWin('2', 'battlefields'));

// ---------- game-over control lock ----------
function endGame() {
  state.gameOver = true;
  lastMatchDuration = stopwatchStartTs ? formatDuration(Date.now() - stopwatchStartTs) : '';
  stopStopwatch();
  document.querySelectorAll('.point-btn, .correction-link, .finisher-btn').forEach(el => {
    el.disabled = true;
    el.classList.add('opacity-40', 'pointer-events-none');
  });
}

function reviveControls() {
  state.gameOver = false;
  document.querySelectorAll('.point-btn, .correction-link, .finisher-btn').forEach(el => {
    el.disabled = false;
    el.classList.remove('opacity-40', 'pointer-events-none');
  });
  updateFinisherButtons();
}

// ---------- modal components ----------
const winnerModal = createWinnerModal({
  onRematch: () => {
    state.score1 = 0;
    state.score2 = 0;
    reviveControls();
    renderScores();
    startStopwatch();
  },
  onNewMatch: () => goToSetup(false),
});

const diceModal = createDiceModal();

document.getElementById('setup-dice-btn').addEventListener('click', () => {
  diceModal.show(
    state.p1Champion ? state.p1Champion.name : '',
    state.p2Champion ? state.p2Champion.name : ''
  );
});
document.getElementById('match-dice-btn').addEventListener('click', () => {
  diceModal.show(state.p1Champion.name, state.p2Champion.name);
});
