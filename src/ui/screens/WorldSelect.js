// Screen: WORLD SELECT — jelajahi semua stage tanpa menyelesaikan yang lain.

import { app } from '../../core/App.js';
import { WORLD_META, WORLD_ORDER } from '../../core/Constants.js';
import { enterWorld } from '../../core/GameFlow.js';
import { MISSIONS_ALL, COLLECTIBLE_TOTALS } from '../../worlds/index.js';

const RECOMMENDED = { w1: 'Pemula', w2: 'Naik level 2', w3: 'Naik level 4', w4: 'Naik level 6', w5: 'Naik level 8 (bos)' };

export function buildWorldSelect() {
  const s = app.save.state;
  const el = document.createElement('div');
  el.className = 'screen panel-screen world-select-screen';

  const cards = WORLD_ORDER.map((id, i) => {
    const meta = WORLD_META[id];
    const doneMissions = (MISSIONS_ALL[id] ?? []).filter((m) => s.missions?.[m.id]?.done).length;
    const totalMissions = (MISSIONS_ALL[id] ?? []).length;
    const stamps = s.stamps?.[id] ?? 0;
    const totalStamps = COLLECTIBLE_TOTALS[id] ?? 0;
    const completed = (s.completedWorlds ?? []).includes(id);
    const victory = !!s.defeatedBoss;

    return `
      <button class="world-card-row ${completed ? 'completed' : ''}" data-world="${id}">
        <div class="wc-num">${i + 1}</div>
        <div class="wc-info">
          <b>${meta.name}</b>
          <small>${meta.subtitle}</small>
          <span class="md-chip ${completed ? 'wc-donechip' : ''}">${completed ? '✅ Rute selesai' : `📋 ${doneMissions}/${totalMissions} misi`}</span>
          <span class="md-chip wc-stampchip">🔖 ${stamps}/${totalStamps}</span>
          ${RECOMMENDED[id] ? `<span class="md-chip wc-lvl">⭐ ${RECOMMENDED[id]}</span>` : ''}
          ${victory && id === 'w5' ? '<span class="md-chip" style="background:#ffe9a6;color:#6b4d00">👑 Bos tertaklukkan</span>' : ''}
        </div>
        <div class="wc-go">→</div>
      </button>`;
  }).join('');

  el.innerHTML = `
    <div class="md-card wide-card world-select-card">
      <h2 class="screen-title">🗺️ Jelajahi Dunia</h2>
      <p class="screen-sub">Semua stage bisa dijelajahi kapan pun kamu mau. Selesaikan rute utama di setiap dunia untuk membuka pesawat MAILWING.</p>
      <div class="world-list">${cards}</div>
      <div class="settings-foot">
        <button class="md-btn text" data-close>← Tutup (E)</button>
      </div>
    </div>`;

  el.querySelectorAll('[data-world]').forEach((b) => b.addEventListener('click', () => {
    const id = b.dataset.world;
    app.save.save();
    app.ui.closeAll();
    app.ui.modalOpen = false;
    enterWorld(id, 'landing'); // GameFlow stops World/HUD; WorldScene rebuilds
  }));
  el.querySelector('[data-close]').addEventListener('click', () => {
    app.ui.showScreen('pause');
  });
  return el;
}
