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

function createWinnerModal({ onRematch, onNewMatch } = {}) {
  const modal = new Modal('winner-overlay', `
    <div class="absolute inset-0 overflow-hidden pointer-events-none" data-role="shards"></div>
    <div class="relative pop-in hex-frame bg-[#0A1428] px-8 py-10 max-w-sm w-full text-center">
      <p data-role="title" class="font-display text-[11px] tracking-[0.4em] text-[#C8AA6E] mb-3" style="font-weight:700;">VICTORY</p>
      <h2 data-role="name" class="font-display text-4xl text-[#F0E6D2] mb-2 break-words" style="font-weight:700;">Player</h2>
      <p data-role="message" class="text-[#8B98A5] text-sm mb-8 font-body">reached 8 points first.</p>
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
    showWin(name, points, reason) {
      modal.q('[data-role="title"]').textContent = 'VICTORY';
      modal.q('[data-role="title"]').style.color = '#C8AA6E';
      modal.q('[data-role="name"]').textContent = name;
      modal.q('[data-role="message"]').textContent = reason === 'hold'
        ? `held at ${points} points to claim the win.`
        : `finishes the final rounds with the most points (${points}).`;
      spawnShards();
      modal.open();
    },
    showDraw(points) {
      modal.q('[data-role="title"]').textContent = 'DRAW';
      modal.q('[data-role="title"]').style.color = '#E0433E';
      modal.q('[data-role="name"]').textContent = 'Stalemate';
      modal.q('[data-role="message"]').textContent = `Both sides finish the final rounds tied at ${points} points.`;
      spawnShards();
      modal.open();
    },
    close: () => modal.close(),
  };
}

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

function createFinalRoundsModal({ onBegin } = {}) {
  const modal = new Modal('final-rounds-overlay', `
    <div class="relative pop-in hex-frame bg-[#0A1428] px-8 py-10 max-w-sm w-full text-center">
      <p class="font-display text-[11px] tracking-[0.4em] text-[#E0433E] mb-3" style="font-weight:700;">TIME'S UP</p>
      <h2 class="font-display text-3xl text-[#F0E6D2] mb-4" style="font-weight:700;">Final 2 Rounds</h2>
      <p class="text-[#8B98A5] text-sm mb-8 font-body leading-relaxed">
        Both sides get <span class="text-[#F0E6D2] font-semibold">two more rounds</span> to score or hold for the win.
        If no one holds by the end, whoever has the most points wins — equal points is a draw.
      </p>
      <button data-role="begin" class="gold-btn w-full py-3 font-display text-base" style="font-weight:700;">BEGIN FINAL ROUNDS</button>
    </div>
  `);

  modal.q('[data-role="begin"]').addEventListener('click', () => {
    modal.close();
    onBegin && onBegin();
  });

  return { show: () => modal.open() };
}

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