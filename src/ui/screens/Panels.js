// Screen builders: JOURNAL, INVENTORY (skillbook included as SKILLS).

import { app } from '../../core/App.js';
import { SKILLS, CONFIG, WORLD_META, WORLD_ORDER } from '../../core/Constants.js';
import { ITEMS } from '../../systems/ItemEffects.js';
import { MISSIONS_ALL, COLLECTIBLE_TOTALS } from '../../worlds/index.js';
import { resumeWorld } from '../../core/GameFlow.js';

function headerHTML(title, sub) {
  return `<h2 class="screen-title">${title}</h2><p class="screen-sub">${sub}</p>`;
}

function journalRows() {
  const done = app.save.state.missions ?? {};
  let html = '';
  for (const worldId of WORLD_ORDER) {
    const list = (MISSIONS_ALL[worldId] ?? []).filter((m) => !m.hidden);
    if (!list.length) continue;
    const doneCount = list.filter((m) => done[m.id]?.done).length;
    html += `
      <div class="journal-world">
        <div class="journal-world-head">
          <b>${WORLD_META[worldId].name}</b>
          <span class="md-chip">${doneCount}/${list.length} tugas</span>
        </div>`;
    for (const m of list) {
      const d = done[m.id]?.done;
      html += `
        <div class="journal-row ${d ? 'done' : ''}">
          <span class="jr-icon">${d ? '✅' : '📨'}</span>
          <div>
            <b>${m.title}</b>
            <div class="jr-desc">${m.type === 'boss' ? '⚔️ Pertarungan utama' : `Dari ${m.fromName || 'pos ronda'} · ${m.reward.xp} XP · ${m.reward.coins} koin`}</div>
          </div>
        </div>`;
    }
    const stamps = app.save.state.stamps?.[worldId] ?? 0;
    const total = COLLECTIBLE_TOTALS[worldId] ?? 0;
    html += `<div class="journal-row"><span class="jr-icon">🔖</span><div><b>Stempel tersembunyi</b>
      <div class="jr-desc">${stamps}/${total} ditemukan</div></div></div>
    </div>`;
  }
  return html;
}

export function buildJournal() {
  const el = document.createElement('div');
  el.className = 'screen panel-screen';
  el.innerHTML = `
    <div class="md-card wide-card">
      ${headerHTML('📖 Jurnal Kurir', 'Dunia, misi pengiriman, dan stempel tersembunyi')}
      <div class="journal-list">${journalRows()}</div>
      <div class="settings-foot"><button class="md-btn text" data-close>← Tutup (E)</button></div>
    </div>`;
  el.querySelector('[data-close]').addEventListener('click', () => {
    app.ui.closeAll(); app.ui.modalOpen = false;
    if (app.worldScene) app.worldScene.refocus();
  });
  return el;
}

export function buildInventory() {
  const s = app.save.state;
  const coins = s.player.coins;
  const items = Object.entries(s.items ?? {}).filter(([, v]) => v);
  const stamps = Object.entries(s.stamps ?? {}).filter(([, v]) => Number(v) > 0);
  const el = document.createElement('div');
  el.className = 'screen panel-screen';
  el.innerHTML = `
    <div class="md-card wide-card">
      ${headerHTML('🎒 Inventaris Kurir', 'Secret item dari teman-teman NPC akan selalu membantumu')}
      <div class="inv-stats">
        <span class="md-chip">💰 ${coins} koin</span>
        <span class="md-chip">📨 ${s.deliveryCount} pengiriman</span>
        <span class="md-chip">🔖 ${stamps.reduce((a, [, v]) => a + (Number(v) || 0), 0)} stempel</span>
      </div>
      <div class="inv-grid">
        ${items.length ? items.map(([id]) => {
          const it = ITEMS[id];
          if (!it) return '';
          return `<div class="inv-item"><span class="inv-icon">${it.icon}</span>
            <div><b>${it.name}</b><div class="inv-desc">${it.desc}</div></div></div>`;
        }).join('') : `<div class="inv-empty">Belum ada secret item. Coba ngobrol lama dengan para warga 😉</div>`}
      </div>
      <div class="settings-foot"><button class="md-btn text" data-close>← Tutup (E)</button></div>
    </div>`;
  el.querySelector('[data-close]').addEventListener('click', () => {
    app.ui.closeAll(); app.ui.modalOpen = false;
    if (app.worldScene) app.worldScene.refocus();
  });
  return el;
}

export function buildSkills() {
  const level = app.save.state.player.level;
  const unlocks = CONFIG.skillUnlocks;
  const el = document.createElement('div');
  el.className = 'screen panel-screen';
  el.innerHTML = `
    <div class="md-card wide-card">
      ${headerHTML('✨ Buku Skill Kurir', `Level saat ini: ${level} — skill terbuka otomatis seiring level`)}
      <div class="skill-list">
        ${SKILLS.map((s, i) => {
          const need = unlocks[i] ?? 1;
          const open = level >= need;
          return `<div class="skill-row ${open ? '' : 'locked'}">
            <div class="skill-key">[${s.key}]</div>
            <div class="skill-main">
              <b>${s.name}</b> <span class="md-chip">CD ${s.cd}s · ${s.energy} energi</span>
              <div class="inv-desc">${s.desc}</div>
            </div>
            <div class="skill-state">${open ? '✅ terbuka' : `🔒 level ${need}`}</div>
          </div>`;
        }).join('')}
      </div>
      <div class="settings-foot"><button class="md-btn text" data-close>← Tutup</button></div>
    </div>`;
  el.querySelector('[data-close]').addEventListener('click', () => {
    app.ui.closeAll(); app.ui.modalOpen = false;
    if (app.worldScene) app.worldScene.refocus();
  });
  return el;
}
