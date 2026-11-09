// Screen: MAIN MENU — Material Design 3. Sits over the animated 3D diorama
// rendered by MainMenuScene behind it.

import { app } from '../../core/App.js';
import { WORLD_META, WORLD_ORDER } from '../../core/Constants.js';
import { playIntro, startCutscene } from '../../core/GameFlow.js';

const cls = (v) => v ? ' class="md-btn ' + v + '"' : ' class="md-btn"';

export function buildMainMenu() {
  const hasSave = app.save.exists();
  const curWorld = hasSave ? WORLD_ORDER[Math.min(app.save.state.world, WORLD_ORDER.length - 1)] : null;
  const meta = curWorld ? WORLD_META[curWorld] : null;

  const el = document.createElement('div');
  el.className = 'screen main-menu-screen';
  el.innerHTML = `
    <div class="mm-left">
      <div class="mm-brand">
        <div class="mm-kicker">PETUALANGAN AKSI KURIR POS</div>
        <h1 class="mm-title">MAIL<span>BOUND</span></h1>
        <p class="mm-tagline">Lima dunia. Satu tas. Setiap surat penting.</p>
      </div>

      <div class="mm-actions">
        ${hasSave ? `
        <button ${cls('')} data-act="continue">▶&nbsp; Lanjutkan — ${meta?.name ?? ''}</button>
        <button ${cls('outlined')} data-act="new">✉️&nbsp; Petualangan Baru</button>
        ` : `
        <button ${cls('')} data-act="new">✉️&nbsp; Mulai Petualangan Baru</button>
        `}
        <div class="mm-row">
          <button ${cls('tonal')} data-act="settings">⚙️ Pengaturan</button>
          <button ${cls('tonal')} data-act="credits">🎬 Kredit</button>
        </div>
        <div class="mm-row">
          <button ${cls('text')} data-act="world-select">🗺️ Jelajahi Dunia</button>
          <button ${cls('text')} data-act="replay-cutscene">🎬 Ulang Cutscene</button>
        </div>
      </div>

      <div class="mm-foot">
        <span class="md-chip">🖱️ Klik kiri — menyerang</span>
        <span class="md-chip">⇧ Tap — dash · Tahan — sprint</span>
        <span class="md-chip">WASD — bergerak</span>
      </div>
    </div>
    <div class="mm-right">
      ${hasSave ? saveCard() : ''}
    </div>
  `;

  wire(el);
  return el;
}

function saveCard() {
  const s = app.save.state;
  return `
    <div class="md-card mm-savecard">
      <div class="screen-title" style="font-size:20px">Progres Tersimpan</div>
      <div class="mm-stat"><span>Kurir Level</span><b>${s.player.level}</b></div>
      <div class="mm-stat"><span>Koin</span><b>${s.player.coins}</b></div>
      <div class="mm-stat"><span>Stempel</span><b>${Object.values(s.stamps ?? {}).reduce((a, v) => a + Number(v) || 0, 0)}</b></div>
      <div class="mm-stat"><span>Secret Item</span><b>${Object.keys(s.items ?? {}).length}</b></div>
      <div class="mm-stat"><span>Pengiriman</span><b>${s.deliveryCount}×</b></div>
      ${s.defeatedBoss ? `<span class="md-chip" style="margin-top:10px">👑 Gelirang gelar: Slime Slayer</span>` : ''}
    </div>
  `;
}

function wire(el) {
  const act = (act) => {
    switch (act) {
      case 'continue': {
        app.save.load();
        const idx = Math.min(app.save.state.world ?? 0, WORLD_ORDER.length - 1);
        closeAndGo(() => playIntro(idx));
        break;
      }
      case 'new': {
        if (app.save.exists()) {
          app.ui.showScreen('confirm', {
            title: 'Mulai petualangan baru?',
            body: 'Progres tersimpan akan ditimpa. Koin, level, dan secret item tidak akan dapat dikembalikan.',
            okText: 'Lanjutkan Baru', cancelText: 'Batal',
            onOk: () => { app.save.newGame(); closeAndGo(() => startCutscene('w1')); },
            onCancel: () => app.ui.showScreen('main-menu'),
          });
        } else closeAndGo(() => startCutscene('w1'));
        break;
      }
      case 'settings': app.ui.showScreen('settings', { from: 'main-menu' }); break;
      case 'world-select': app.ui.showScreen('world-select'); break;
      case 'credits': app.ui.showScreen('credits'); break;
      case 'replay-cutscene': closeAndGo(() => startCutscene('w1')); break;
    }
  };
  el.querySelectorAll('[data-act]').forEach((b) => b.addEventListener('click', () => act(b.dataset.act)));
}

function closeAndGo(fn) {
  app.ui.closeAll();
  app.ui.modalOpen = false;
  fn();
}
