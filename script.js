/* ==========================================================
   Summoner's Tally — app logic
   ========================================================== */

// ---------- state ----------
const state = {
  p1Name: '',
  p2Name: '',
  winPoints: 8,
  gameLength: 30, // minutes
  score1: 0,
  score2: 0,
  gameOver: false,
  finalRoundsActive: false,
  finalRoundsRemaining: 2,
};

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
const lengthGroup = setupPresetGroup('length-presets', 'game-length', 2); // default: 30m

// ---------- custom toggle helper (points / game length) ----------
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
const customLength = setupCustomToggle('custom-length-toggle', 'custom-length-input', 'game-length', lengthGroup);

// ---------- setup form submit ----------
document.getElementById('setup-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const p1 = document.getElementById('p1-name').value.trim();
  const p2 = document.getElementById('p2-name').value.trim();
  const win = parseInt(document.getElementById('win-points').value, 10);
  const length = parseInt(document.getElementById('game-length').value, 10);
  const errorEl = document.getElementById('form-error');

  if (!p1 || !p2 || !win || win < 1 || !length || length < 1) {
    errorEl.classList.remove('hidden');
    return;
  }
  errorEl.classList.add('hidden');

  state.p1Name = p1;
  state.p2Name = p2;
  state.winPoints = win;
  state.gameLength = length;
  state.score1 = 0;
  state.score2 = 0;

  launchMatch();
});

// ---------- screens ----------
const setupScreen = document.getElementById('setup-screen');
const matchScreen = document.getElementById('match-screen');

function launchMatch() {
  document.getElementById('p1-label').textContent = state.p1Name;
  document.getElementById('p2-label').textContent = state.p2Name;
  document.getElementById('target-label').textContent = state.winPoints;
  reviveControls();
  renderScores();
  setupScreen.classList.add('hidden');
  matchScreen.classList.remove('hidden');
  matchScreen.classList.add('flex');
  startTimer(state.gameLength);
}

function goToSetup(prefill) {
  stopTimer();
  matchScreen.classList.add('hidden');
  matchScreen.classList.remove('flex');
  setupScreen.classList.remove('hidden');
  if (!prefill) {
    document.getElementById('setup-form').reset();
    pointsGroup.reset();
    lengthGroup.reset();
    customPoints.reset();
    customLength.reset();
  }
}
const confirmModal = createConfirmModal();

document.getElementById('new-match-btn').addEventListener('click', () => {
  confirmModal.show({
    title: 'End this match?',
    message: 'Going back to setup will discard the current scores and timer for this game.',
    confirmText: 'YES, END MATCH',
    onConfirm: () => goToSetup(false),
  });
});

// ---------- match timer + final rounds (sudden death) ----------
let timerInterval = null;
let timerEndTs = null;
const timerChip = document.querySelector('.timer-chip');
const timerIcon = document.getElementById('timer-icon');
const timerEl = document.getElementById('game-timer');
const endRoundBtn = document.getElementById('end-round-btn');

const finalRoundsModal = createFinalRoundsModal({ onBegin: activateFinalRounds });

function startTimer(minutes) {
  stopTimer();
  state.finalRoundsActive = false;
  state.finalRoundsRemaining = 2;
  timerChip.classList.remove('timer-warning', 'timer-up');
  timerIcon.textContent = '⏱';
  endRoundBtn.classList.add('hidden');
  timerEndTs = Date.now() + minutes * 60000;
  updateTimer();
  timerInterval = setInterval(updateTimer, 1000);
}

function stopTimer() {
  if (timerInterval) clearInterval(timerInterval);
  timerInterval = null;
}

function updateTimer() {
  const remaining = timerEndTs - Date.now();
  if (remaining <= 0) {
    timerEl.textContent = '00:00';
    timerChip.classList.add('timer-up');
    stopTimer();
    if (!state.finalRoundsActive && !state.gameOver) {
      finalRoundsModal.show();
    }
    return;
  }
  const totalSec = Math.ceil(remaining / 1000);
  const m = String(Math.floor(totalSec / 60)).padStart(2, '0');
  const s = String(totalSec % 60).padStart(2, '0');
  timerEl.textContent = `${m}:${s}`;
  timerChip.classList.toggle('timer-warning', remaining <= 60000);
}

function activateFinalRounds() {
  state.finalRoundsActive = true;
  state.finalRoundsRemaining = 2;
  timerIcon.textContent = '⚔';
  timerChip.classList.add('timer-up');
  timerChip.classList.remove('timer-warning');
  endRoundBtn.classList.remove('hidden');
  updateRoundsChip();
}

function updateRoundsChip() {
  timerEl.textContent = `${state.finalRoundsRemaining} LEFT`;
  endRoundBtn.textContent = `⚔ END ROUND · ${state.finalRoundsRemaining} LEFT`;
}

endRoundBtn.addEventListener('click', () => {
  if (!state.finalRoundsActive || state.gameOver) return;
  state.finalRoundsRemaining--;
  if (state.finalRoundsRemaining <= 0) {
    resolveFinalRounds();
  } else {
    updateRoundsChip();
  }
});

function resolveFinalRounds() {
  state.finalRoundsActive = false;
  endRoundBtn.classList.add('hidden');
  if (state.score1 === state.score2) {
    endGame();
    winnerModal.showDraw(state.score1);
  } else {
    const name = state.score1 > state.score2 ? state.p1Name : state.p2Name;
    const points = Math.max(state.score1, state.score2);
    endGame();
    winnerModal.showWin(name, points, 'points');
  }
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

  updateHoldButtons();
}

function updateHoldButtons() {
  const holdBtn1 = document.getElementById('p1-hold');
  const holdBtn2 = document.getElementById('p2-hold');
  const eligible1 = state.score1 >= state.winPoints;
  const eligible2 = state.score2 >= state.winPoints;

  holdBtn1.disabled = !eligible1 || state.gameOver;
  holdBtn2.disabled = !eligible2 || state.gameOver;
  holdBtn1.classList.toggle('hold-ready', eligible1 && !state.gameOver);
  holdBtn2.classList.toggle('hold-ready', eligible2 && !state.gameOver);
}

document.querySelectorAll('.point-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    if (state.gameOver) return;
    const player = btn.dataset.player;
    const key = player === '1' ? 'score1' : 'score2';
    const scoreEl = document.getElementById(`p${player}-score`);

    state[key] += 1;
    renderScores();

    scoreEl.classList.remove('score-bump');
    void scoreEl.offsetWidth;
    scoreEl.classList.add('score-bump');
  });
});

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

document.querySelectorAll('.hold-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    if (state.gameOver || btn.disabled) return;
    const player = btn.dataset.player;
    const key = player === '1' ? 'score1' : 'score2';
    if (state[key] < state.winPoints) return;
    const name = player === '1' ? state.p1Name : state.p2Name;
    endGame();
    winnerModal.showWin(name, state[key], 'hold');
  });
});

document.getElementById('reset-scores-btn').addEventListener('click', () => {
  if (state.gameOver) return;
  state.score1 = 0;
  state.score2 = 0;
  renderScores();
});

// ---------- game-over control lock ----------
function endGame() {
  state.gameOver = true;
  stopTimer();
  state.finalRoundsActive = false;
  endRoundBtn.classList.add('hidden');
  document.querySelectorAll('.point-btn, .correction-link, .hold-btn').forEach(el => {
    el.disabled = true;
    el.classList.add('opacity-40', 'pointer-events-none');
  });
}

function reviveControls() {
  state.gameOver = false;
  document.querySelectorAll('.point-btn, .correction-link, .hold-btn').forEach(el => {
    el.disabled = false;
    el.classList.remove('opacity-40', 'pointer-events-none');
  });
  updateHoldButtons();
}

// ---------- modal components ----------
const winnerModal = createWinnerModal({
  onRematch: () => {
    state.score1 = 0;
    state.score2 = 0;
    reviveControls();
    renderScores();
    startTimer(state.gameLength);
  },
  onNewMatch: () => goToSetup(false),
});

const diceModal = createDiceModal();

document.getElementById('setup-dice-btn').addEventListener('click', () => {
  diceModal.show(document.getElementById('p1-name').value.trim(), document.getElementById('p2-name').value.trim());
});
document.getElementById('match-dice-btn').addEventListener('click', () => {
  diceModal.show(state.p1Name, state.p2Name);
});