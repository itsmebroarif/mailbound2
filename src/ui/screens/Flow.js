// Flow screens: WORLD CARD (transition), INTRO CARD, GAME OVER, VICTORY,
// CREDITS (the grand finale with Arif Alexander's 12+9 roles).

import { app } from '../../core/App.js';
import { WORLD_META, WORLD_ORDER, GAME_VERSION } from '../../core/Constants.js';
import { enterWorld, toMenu } from '../../core/GameFlow.js';
import { died } from '../../core/GameFlow.js';

export function buildWorldCard({ worldId, worldIndex = 0, missions = 0 } = {}) {
  const meta = WORLD_META[worldId] ?? WORLD_META.w1;
  const el = document.createElement('div');
  el.className = 'screen world-card-screen';
  el.innerHTML = `
    <div class="md-card world-card">
      <div class="wc-kicker">WORLD ${worldIndex + 1} / ${WORLD_ORDER.length}</div>
      <h1 class="wc-title">${meta.name}</h1>
      <p class="wc-sub">${meta.subtitle}</p>
      <div class="wc-rule"></div>
      <p class="wc-body">${missions} misi menantimu di wilayah ini.<br/>Pesawatmu sudah siap di landasan. Terbanglah.</p>
      <button class="md-btn wc-btn" data-act="go">✈️ Mendar at ${meta.name}</button>
    </div>
    <div class="wc-jettrail"></div>
  `;
  el.querySelector('[data-act=go]').addEventListener('click', () => {
    app.ui.closeAll();
    app.ui.modalOpen = false;
    enterWorld(worldId, 'landing');
  });
  return el;
}

export function buildIntroCard() {
  const el = document.createElement('div');
  el.className = 'screen world-card-screen intro-card-screen';
  el.innerHTML = `
    <div class="md-card world-card">
      <div class="wc-kicker">PROLOG — THE LAST POSTAL ROUTE</div>
      <h1 class="wc-title">Setiap surat membangun dunia.</h1>
      <div class="wc-rule"></div>
      <p class="wc-body wc-body-left">
        Kamu adalah <b>Mailcaster</b>, kurir termuda yang diberi rute
        "The Final Route" — lima dunia, satu tas punggung, dan satu janji:
        <i>tidak ada surat yang hilang.</i><br><br>
        Tetapi surat-surat itu bukan sekadar kertas. Seseorang — atau sesuatu — ingin
        semua pesan sampai ke tangan yang salah, dan di ujung rute ada sebuah
        monster jelly yang sangat gemas nan ganas…
      </p>
      <button class="md-btn wc-btn" data-act="go">Mulai Pengiriman Pertama →</button>
    </div>
  `;
  el.querySelector('[data-act=go]').addEventListener('click', () => {
    app.ui.closeAll();
    app.ui.modalOpen = false;
    enterWorld('w1', 'landing');
  });
  return el;
}

export function buildGameOver({ reason = 'Kamu tumbang…' } = {}) {
  const el = document.createElement('div');
  el.className = 'screen gameover-screen';
  el.innerHTML = `
    <div class="md-card gameover-card">
      <div class="go-icon">💀</div>
      <h2 class="screen-title">${reason}</h2>
      <p class="screen-sub">Paketmu tetap aman di tas — kurir sejati tidak menyerah pada jalan.</p>
      <div class="pause-grid go-row">
        <button class="md-btn" data-act="retry">↻ Coba Lagi</button>
        <button class="md-btn outlined" data-act="menu">🏠 Kembali ke Menu</button>
      </div>
    </div>
  `;
  el.querySelector('[data-act=retry]').addEventListener('click', () => { died(); });
  el.querySelector('[data-act=menu]').addEventListener('click', () => { app.save.save(); toMenu(); });
  return el;
}

export function buildVictory({ stats = {} } = {}) {
  const el = document.createElement('div');
  el.className = 'screen victory-screen';
  el.innerHTML = `
    <div class="md-card victory-card">
      <div class="go-icon">👑</div>
      <div class="wc-kicker">RUTE TERAKHIR TELAH SELESAI</div>
      <h1 class="screen-title victory-title">UYEHH TELAH TERTAKLUKKAN 🎉</h1>
      <p class="screen-sub">Kamu membuktikan bahwa satu tas penuh surat bisa mengubah dunia.</p>
      <div class="v-stats">
        <span class="md-chip">💰 ${stats.coins ?? 0} koin</span>
        <span class="md-chip">🔖 ${stats.stamps ?? 0} stempel</span>
        <span class="md-chip">📨 ${stats.deliveries ?? 0} pengiriman</span>
        <span class="md-chip">⏱️ ${Math.round((stats.playtimeMs ?? 0) / 60000)} mnt bermain</span>
      </div>
      <div class="settings-foot" style="justify-content:center;gap:12px">
        <button class="md-btn wc-btn" data-act="credits">🎬 Lihat Kredit</button>
        <button class="md-btn tonal" data-act="menu">Kembali ke Menu</button>
      </div>
    </div>
    <div class="wc-jettrail"></div>
  `;
  el.querySelector('[data-act=credits]').addEventListener('click', () => app.ui.showScreen('credits'));
  el.querySelector('[data-act=menu]').addEventListener('click', () => toMenu());
  return el;
}

export function buildCredits() {
  const roles = [
    'Developer', 'Designer', 'Tester', 'Analyze', 'Marketing', 'Customer Service',
    'Editor', 'Script Writer', 'Dubber', 'Research', 'Accountant', 'Business Development',
  ];
  const el = document.createElement('div');
  el.className = 'screen credits-screen';
  el.innerHTML = `
    <div class="credits-panel">
      <h1 class="credits-logo">MAIL<span>BOUND</span></h1>
      <div class="credits-scroll">
        <p class="credits-note">(ini adalah credits pribadi — bukan kolaborasi tim.)</p>

        <p class="credits-block-title">Dikembangkan, dirancang & disempurnakan oleh</p>
        <h2 class="credits-solo">ARIF ALEXANDER</h2>
        <p class="credits-block-title">Memegang setiap peran:</p>
        ${roles.map((r) => `
          <div class="credits-role">
            <span class="credits-role-tag">${roleIcon(r)}</span>
            <span class="credits-role-name">${r}</span>
          </div>
        `).join('')}

        <div class="credits-gap"></div>
        <p class="credits-block-title">Cinta dan dukungan</p>
        <div class="credits-role"><span>💌</span><span class="credits-role-name">Kamu — Kurir Terbesar</span></div>
        <div class="credits-role"><span>☕</span><span class="credits-role-name">Kopi & Tengah Malam</span></div>

        <div class="credits-gap"></div>
        <p class="credits-block-title">GAME</p>
        <div class="credits-role"><span>📬</span><span class="credits-role-name">MAILBOUND v${GAME_VERSION}</span></div>
        <div class="credits-role"><span>🎮</span><span class="credits-role-name">Visual: Three.js · Engine: Phaser 3</span></div>
        <div class="credits-role"><span>🎵</span><span class="credits-role-name">Musik & SFX disintesis Web Audio API</span></div>
        <div class="credits-role"><span>🎨</span><span class="credits-role-name">UI: Material Design 3</span></div>
        <div class="credits-gap"></div>
        <p class="credits-epilogue">Terima kasih telah mengantar setiap surat.</p>
        <div class="credits-gap"></div>
      </div>
      <div class="credits-btns">
        <button class="md-btn outlined" data-act="menu">🏠 Kembali ke Menu</button>
      </div>
    </div>
  `;
  el.querySelector('[data-act=menu]').addEventListener('click', () => toMenu());
  return el;
}

function roleIcon(role) {
  return {
    'Developer': '💻', 'Designer': '🖌️', 'Tester': '🐞', 'Analyze': '📊',
    'Marketing': '📣', 'Customer Service': '🎧', 'Editor': '✂️',
    'Script Writer': '📝', 'Dubber': '🎙️', 'Research': '🔬',
    'Accountant': '🧮', 'Business Development': '📈',
  }[role] ?? '✨';
}
