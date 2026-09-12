/* ==========================================================
   Summoner's Tally — Modal Components
   A tiny reusable Modal base class, plus two components built
   on top of it: the Winner modal and the Dice roll-off modal.
   Both are constructed and injected into <body> at runtime,
   so index.html stays free of one-off overlay markup.
   ========================================================== */

class Modal {
  constructor(id, innerHTML) {
    this.id = id;
    this.el = document.createElement('div');
    this.el.id = id;
    this.el.className = 'fixed inset-0 z-50 hidden items-center justify-center bg-[#010A13]/92 backdrop-blur-sm px-5';
    this.el.innerHTML = innerHTML;
    document.body.appendChild(this.el);

    // click on the dim backdrop closes the modal
    this.el.addEventListener('click', (e) => {
      if (e.target === this.el) this.close();
    });
  }
  q(sel) { return this.el.querySelector(sel); }
  qa(sel) { return this.el.querySelectorAll(sel); }
  open() { this.el.classList.remove('hidden'); this.el.classList.add('flex'); }
  close() { this.el.classList.add('hidden'); this.el.classList.remove('flex'); }
}

/* ------------------------------------------------------------
   Winner Modal component
   showWin(name, points, reason, duration) — reason is 'hold' (a
   player held at/above target) or 'battlefields' (claimed the
   winning point by controlling two battlefields, base 8-point
   game only). duration is the formatted match length (mm:ss),
   shown as a small footnote.
------------------------------------------------------------ */
function createWinnerModal({ onRematch, onNewMatch } = {}) {
  const modal = new Modal('winner-overlay', `
    <div class="absolute inset-0 overflow-hidden pointer-events-none" data-role="shards"></div>
    <div class="relative pop-in hex-frame bg-[#0A1428] px-8 py-10 max-w-sm w-full text-center">
      <p data-role="title" class="font-display text-[11px] tracking-[0.4em] text-[#C8AA6E] mb-3" style="font-weight:700;">VICTORY</p>
      <h2 data-role="name" class="font-display text-4xl text-[#F0E6D2] mb-2 break-words" style="font-weight:700;">Player</h2>
      <p data-role="message" class="text-[#8B98A5] text-sm mb-2 font-body">reached 8 points first.</p>
      <p data-role="duration" class="text-[#5B5A56] text-[11px] mb-6 font-body"></p>
      <div class="flex flex-col gap-3">
        <button data-role="rematch" class="gold-btn py-3 font-display text-base" style="font-weight:700;">↺ REMATCH</button>
        <button data-role="new-match" class="ghost-btn py-3 font-display text-base" style="font-weight:600;">NEW MATCH</button>
      </div>
    </div>
  `);

  function spawnShards() {
    const container = modal.q('[data-role="shards"]');
    container.innerHTML = '';
    const colors = ['#C8AA6E', '#0BC6E3', '#E0433E'];
    for (let i = 0; i < 24; i++) {
      const shard = document.createElement('div');
      const color = colors[i % colors.length];
      const size = 6 + Math.random() * 8;
      shard.className = 'shard';
      shard.style.left = Math.random() * 100 + 'vw';
      shard.style.width = size + 'px';
      shard.style.height = size + 'px';
      shard.style.background = color;
      shard.style.clipPath = 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)';
      shard.style.animationDuration = (2.5 + Math.random() * 2.5) + 's';
      shard.style.animationDelay = (Math.random() * 1.5) + 's';
      container.appendChild(shard);
    }
  }

  modal.q('[data-role="rematch"]').addEventListener('click', () => {
    modal.close();
    onRematch && onRematch();
  });
  modal.q('[data-role="new-match"]').addEventListener('click', () => {
    modal.close();
    onNewMatch && onNewMatch();
  });

  return {
    showWin(name, points, reason, duration) {
      modal.q('[data-role="title"]').textContent = 'VICTORY';
      modal.q('[data-role="title"]').style.color = '#C8AA6E';
      modal.q('[data-role="name"]').textContent = name;
      modal.q('[data-role="message"]').textContent = reason === 'battlefields'
        ? `seized two battlefields to claim the win at ${points} points.`
        : `held at ${points} points to claim the win.`;
      modal.q('[data-role="duration"]').textContent = duration ? `Match length: ${duration}` : '';
      spawnShards();
      modal.open();
    },
    close: () => modal.close(),
  };
}

/* ------------------------------------------------------------
   Confirm Modal component
   Generic yes/cancel dialog for destructive actions.
   show({ title, message, confirmText, onConfirm }) opens it.
------------------------------------------------------------ */
function createConfirmModal() {
  const modal = new Modal('confirm-overlay', `
    <div class="relative pop-in hex-frame bg-[#0A1428] px-8 py-9 max-w-sm w-full text-center">
      <p data-role="title" class="font-display text-2xl text-[#F0E6D2] mb-3" style="font-weight:700;">Are you sure?</p>
      <p data-role="message" class="text-[#8B98A5] text-sm mb-8 font-body leading-relaxed">This will end the current game.</p>
      <div class="flex flex-col gap-3">
        <button data-role="confirm" class="danger-btn py-3 font-display text-base" style="font-weight:700;">YES, END MATCH</button>
        <button data-role="cancel" class="ghost-btn py-3 font-display text-base" style="font-weight:600;">CANCEL</button>
      </div>
    </div>
  `);

  let pendingConfirm = null;

  modal.q('[data-role="confirm"]').addEventListener('click', () => {
    modal.close();
    pendingConfirm && pendingConfirm();
    pendingConfirm = null;
  });
  modal.q('[data-role="cancel"]').addEventListener('click', () => {
    modal.close();
    pendingConfirm = null;
  });

  return {
    show({ title, message, confirmText, onConfirm } = {}) {
      modal.q('[data-role="title"]').textContent = title || 'Are you sure?';
      modal.q('[data-role="message"]').textContent = message || 'This will end the current game.';
      modal.q('[data-role="confirm"]').textContent = confirmText || 'YES, END MATCH';
      pendingConfirm = onConfirm;
      modal.open();
    },
  };
}
/* ------------------------------------------------------------
   Champion Picker Modal component
   show({ excludeId, onPick }) opens a searchable grid of every
   champion in CHAMPIONS (see champions.js). Tapping a tile calls
   onPick(champion) and closes the modal.
------------------------------------------------------------ */
function createChampionPickerModal() {
  const modal = new Modal('champion-picker-overlay', `
    <div class="relative pop-in hex-frame bg-[#0A1428] px-5 pt-6 pb-5 max-w-lg w-full champion-modal-body">
      <p class="font-display text-[11px] tracking-[0.4em] text-[#C8AA6E] mb-1" style="font-weight:700;">CHOOSE YOUR</p>
      <h2 class="font-display text-2xl text-[#F0E6D2] mb-4" style="font-weight:700;">Champion</h2>
      <input type="text" data-role="search" placeholder="Search champion..." class="champion-search font-body" />
      <div data-role="grid" class="champion-grid"></div>
      <button data-role="close" class="ghost-btn w-full py-3 mt-4 font-display text-base" style="font-weight:600;">CLOSE</button>
    </div>
  `);

  const searchInput = modal.q('[data-role="search"]');
  const gridEl = modal.q('[data-role="grid"]');
  let onPickCb = null;
  let excludeId = null;

  function renderGrid(filter) {
    const q = (filter || '').trim().toLowerCase();
    gridEl.innerHTML = '';
    CHAMPIONS
      .filter(c => !q || c.name.toLowerCase().includes(q) || c.title.toLowerCase().includes(q))
      .forEach(c => {
        const tile = document.createElement('button');
        tile.type = 'button';
        tile.className = 'champion-tile' + (c.id === excludeId ? ' champion-tile-taken' : '');
        tile.style.backgroundImage =
          `linear-gradient(180deg, rgba(1,10,19,0.15), rgba(1,10,19,0.88)), url('${c.art}'), ` +
          `linear-gradient(160deg, ${c.accent} 0%, #0A1428 75%)`;
        tile.innerHTML = `
          <span class="champion-tile-name font-display">${c.name}</span>
          <span class="champion-tile-title font-body">${c.title}</span>
          ${c.id === excludeId ? '<span class="champion-tile-badge">OTHER SIDE</span>' : ''}
        `;
        tile.addEventListener('click', () => {
          modal.close();
          onPickCb && onPickCb(c);
        });
        gridEl.appendChild(tile);
      });
    if (!gridEl.children.length) {
      gridEl.innerHTML = `<p class="champion-grid-empty font-body">No champion matches "${filter}".</p>`;
    }
  }

  searchInput.addEventListener('input', () => renderGrid(searchInput.value));
  modal.q('[data-role="close"]').addEventListener('click', () => modal.close());

  return {
    show({ excludeId: exclude = null, onPick } = {}) {
      excludeId = exclude;
      onPickCb = onPick;
      searchInput.value = '';
      renderGrid('');
      modal.open();
    },
  };
}

/* ------------------------------------------------------------
   Match Menu Modal component
   Consolidates the less-frequent in-match actions (reset scores,
   back to setup) behind a single icon button so the two player
   panels can claim almost all of the screen.
   show() opens it.
------------------------------------------------------------ */
function createMatchMenuModal({ onReset, onBack } = {}) {
  const modal = new Modal('match-menu-overlay', `
    <div class="relative pop-in hex-frame bg-[#0A1428] px-7 py-8 max-w-sm w-full text-center">
      <p class="font-display text-[11px] tracking-[0.4em] text-[#C8AA6E] mb-5" style="font-weight:700;">MATCH MENU</p>
      <div class="flex flex-col gap-3">
        <button data-role="reset" class="ghost-btn py-3 font-display text-base" style="font-weight:600;">↺ RESET SCORES · SAME CHAMPIONS</button>
        <button data-role="back" class="danger-btn py-3 font-display text-base" style="font-weight:700;">↩ BACK TO SETUP</button>
        <button data-role="close" class="ghost-btn py-3 font-display text-base" style="font-weight:600;">CLOSE</button>
      </div>
    </div>
  `);

  modal.q('[data-role="reset"]').addEventListener('click', () => {
    modal.close();
    onReset && onReset();
  });
  modal.q('[data-role="back"]').addEventListener('click', () => {
    modal.close();
    onBack && onBack();
  });
  modal.q('[data-role="close"]').addEventListener('click', () => modal.close());

  return {
    show() { modal.open(); },
  };
}

/* ------------------------------------------------------------
   Dice Roll-off Modal component
   show(blueName, redName) opens the modal, ready to roll.
   Rolls one six-sided die per side to decide who picks first.
------------------------------------------------------------ */
function createDiceModal() {
  const diePips = `
    <span class="pip"></span><span class="pip"></span><span class="pip"></span>
    <span class="pip"></span><span class="pip"></span><span class="pip"></span>
    <span class="pip"></span><span class="pip"></span><span class="pip"></span>
  `;

  const modal = new Modal('dice-overlay', `
    <div class="relative pop-in hex-frame bg-[#0A1428] px-7 py-9 max-w-sm w-full text-center">
      <p class="font-display text-[11px] tracking-[0.4em] text-[#C8AA6E] mb-1" style="font-weight:700;">ROLL-OFF</p>
      <h2 class="font-display text-2xl text-[#F0E6D2] mb-6" style="font-weight:700;">Who Picks First?</h2>

      <div class="flex items-center justify-center gap-6 mb-6">
        <div class="text-center">
          <div data-role="die-blue" class="die die-blue" data-face="1">${diePips}</div>
          <p data-role="label-blue" class="font-display text-xs tracking-[0.2em] text-[#0BC6E3] mt-3" style="font-weight:600;">BLUE</p>
        </div>
        <div class="font-display text-2xl text-[#5B5A56]">vs</div>
        <div class="text-center">
          <div data-role="die-red" class="die die-red" data-face="1">${diePips}</div>
          <p data-role="label-red" class="font-display text-xs tracking-[0.2em] text-[#E0433E] mt-3" style="font-weight:600;">RED</p>
        </div>
      </div>

      <p data-role="result" class="font-display text-base text-[#8B98A5] mb-6 min-h-[1.5em]" style="font-weight:600;">Tap roll to decide who goes first.</p>

      <div class="flex flex-col gap-3">
        <button data-role="roll" class="gold-btn py-3 font-display text-base" style="font-weight:700;">⚄ ROLL DICE</button>
        <button data-role="close" class="ghost-btn py-3 font-display text-base" style="font-weight:600;">CLOSE</button>
      </div>
    </div>
  `);

  const dieBlue = modal.q('[data-role="die-blue"]');
  const dieRed = modal.q('[data-role="die-red"]');
  const resultEl = modal.q('[data-role="result"]');
  const rollBtn = modal.q('[data-role="roll"]');

  modal.q('[data-role="close"]').addEventListener('click', () => modal.close());

  function rollDie() { return 1 + Math.floor(Math.random() * 6); }

  function roll() {
    rollBtn.disabled = true;
    dieBlue.classList.remove('die-winner');
    dieRed.classList.remove('die-winner');
    dieBlue.classList.add('die-rolling');
    dieRed.classList.add('die-rolling');
    resultEl.textContent = 'Rolling...';

    let ticks = 0;
    const spin = setInterval(() => {
      dieBlue.dataset.face = String(rollDie());
      dieRed.dataset.face = String(rollDie());
      ticks++;
      if (ticks > 9) {
        clearInterval(spin);
        finish();
      }
    }, 80);
  }

  function finish() {
    const blueVal = rollDie();
    const redVal = rollDie();
    dieBlue.dataset.face = String(blueVal);
    dieRed.dataset.face = String(redVal);
    dieBlue.classList.remove('die-rolling');
    dieRed.classList.remove('die-rolling');

    const blueName = modal._blueName || 'Blue side';
    const redName = modal._redName || 'Red side';

    if (blueVal === redVal) {
      resultEl.textContent = `Tie at ${blueVal}-${blueVal} — roll again.`;
    } else if (blueVal > redVal) {
      resultEl.textContent = `${blueName} rolled ${blueVal} vs ${redVal} — picks first!`;
      dieBlue.classList.add('die-winner');
    } else {
      resultEl.textContent = `${redName} rolled ${redVal} vs ${blueVal} — picks first!`;
      dieRed.classList.add('die-winner');
    }
    rollBtn.disabled = false;
  }

  rollBtn.addEventListener('click', roll);

  return {
    show(blueName, redName) {
      modal._blueName = blueName;
      modal._redName = redName;
      modal.q('[data-role="label-blue"]').textContent = blueName ? `BLUE · ${blueName}` : 'BLUE';
      modal.q('[data-role="label-red"]').textContent = redName ? `RED · ${redName}` : 'RED';
      resultEl.textContent = 'Tap roll to decide who goes first.';
      dieBlue.dataset.face = '1';
      dieRed.dataset.face = '1';
      dieBlue.classList.remove('die-winner');
      dieRed.classList.remove('die-winner');
      modal.open();
    },
  };
}