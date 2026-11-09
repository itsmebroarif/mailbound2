// Screens: PAUSE + SETTINGS + generic CONFIRM dialog.

import { app } from '../../core/App.js';
import { toMenu, resumeWorld } from '../../core/GameFlow.js';

export function buildPause() {
  const el = document.createElement('div');
  el.className = 'screen pause-screen';
  el.innerHTML = `
    <div class="md-card pause-card">
      <h2 class="screen-title">Istirahat dulu ☕</h2>
      <p class="screen-sub">Kampanye disimpan otomatis di setiap pengiriman & ganti dunia.</p>
      <div class="pause-grid">
        <button class="md-btn" data-act="resume">▶ Lanjutkan</button>
        <button class="md-btn tonal" data-act="save">💾 Simpan Sekarang</button>
        <button class="md-btn tonal" data-act="journal">📖 Jurnal</button>
        <button class="md-btn tonal" data-act="inventory">🎒 Inventaris</button>
        <button class="md-btn tonal" data-act="skills">✨ Skills</button>
        <button class="md-btn tonal" data-act="settings">⚙️ Pengaturan</button>
        <button class="md-btn tonal" data-act="world-select">🗺️ Jelajah</button>
        <button class="md-btn outlined" data-act="menu">🏠 Menu Utama</button>
      </div>
      <div class="pause-hint md-chip">Tip: Kombo LMB 3× lalu Shadow Dash (3).</div>
    </div>
  `;
  wire(el);
  return el;
}

function wire(el) {
  el.querySelectorAll('[data-act]').forEach((b) => b.addEventListener('click', () => {
    const act = b.dataset.act;
    if (act === 'resume') { app.ui.closeAll(); app.ui.modalOpen = false; if (app.worldScene) app.worldScene.refocus(); return; }
    if (act === 'save') { app.save.save(); app.ui.toast('Kampanye tersimpan.', '💾'); }
    if (act === 'settings') app.ui.showScreen('settings', { from: 'pause' });
    if (act === 'journal') app.ui.showScreen('journal');
    if (act === 'inventory') app.ui.showScreen('inventory');
    if (act === 'skills') app.ui.showScreen('skills');
    if (act === 'world-select') app.ui.showScreen('world-select');
    if (act === 'menu') {
      app.save.save();
      app.audio.stopMusic();
      toMenu();
    }
  }));
}

export function buildSettings({ from = 'main-menu' } = {}) {
  const s = app.save.settings;
  const el = document.createElement('div');
  el.className = 'screen settings-screen';
  el.innerHTML = `
    <div class="md-card settings-card">
      <h2 class="screen-title">Pengaturan</h2>
      <label class="md-slider-row"><span>Kamera</span>
        <input type="range" min="20" max="220" value="${Math.round(s.sensitivity * 100)}" data-key="sensdeg">
        <b class="md-value" data-slot="sens">${Math.round(s.sensitivity * 100)}%</b></label>
      <label class="md-switch-row"><span>Sengetkan arah Y kamera</span>
        <input type="checkbox" data-key="invertY" ${s.invertY ? 'checked' : ''}></label>
      <label class="md-slider-row"><span>Volume Utama</span>
        <input type="range" min="0" max="100" value="${Math.round(s.volumes.master * 100)}" data-key="master">
        <b class="md-value" data-slot="master">${Math.round(s.volumes.master * 100)}%</b></label>
      <label class="md-slider-row"><span>Musik</span>
        <input type="range" min="0" max="100" value="${Math.round(s.volumes.music * 100)}" data-key="music">
        <b class="md-value" data-slot="music">${Math.round(s.volumes.music * 100)}%</b></label>
      <label class="md-slider-row"><span>Efek Suara</span>
        <input type="range" min="0" max="100" value="${Math.round(s.volumes.sfx * 100)}" data-key="sfx">
        <b class="md-value" data-slot="sfx">${Math.round(s.volumes.sfx * 100)}%</b></label>
      <div class="md-row-q">
        <label class="md-switch-row"><span>Kualitas Render</span></label>
        <div class="q-group">
          ${['low', 'medium', 'high'].map((q) => `<button class="md-btn ${s.quality === q ? '' : 'outlined'}" data-q="${q}">${q === 'low' ? 'Rendah' : q === 'medium' ? 'Sedang' : 'Tinggi'}</button>`).join('')}
        </div>
      </div>
      <label class="md-switch-row"><span>Tampilkan angka damage</span>
        <input type="checkbox" data-key="showDamage" ${s.showDamage ? 'checked' : ''}></label>
      <div class="settings-foot">
        <button class="md-btn text" data-act="back">← Kembali</button>
      </div>
    </div>
  `;

  el.querySelectorAll('input[type=range]').forEach((r) => {
    r.addEventListener('input', () => {
      const k = r.dataset.key;
      if (k === 'sensdeg') {
        app.save.saveSettings({ sensitivity: r.value / 100 });
        el.querySelector('[data-slot=sens]').textContent = `${r.value}%`;
      } else {
        app.audio.setVolumes({ [k]: r.value / 100 });
        app.save.saveSettings({ volumes: app.audio.volumes });
        el.querySelector(`[data-slot=${k}]`).textContent = `${r.value}%`;
      }
    });
  });
  el.querySelectorAll('input[type=checkbox]').forEach((c) => {
    c.addEventListener('change', () => app.save.saveSettings({ [c.dataset.key]: c.checked }));
  });
  el.querySelectorAll('[data-q]').forEach((b) => b.addEventListener('click', () => {
    app.save.saveSettings({ quality: b.dataset.q });
    app.renderer.setQuality(b.dataset.q);
    el.querySelectorAll('[data-q]').forEach((x) => x.classList.toggle('outlined', x.dataset.q !== b.dataset.q));
  }));
  el.querySelector('[data-act=back]').addEventListener('click', () => {
    if (from === 'pause') app.ui.showScreen('pause');
    else if (from === 'main-menu') app.ui.showScreen('main-menu');
    else resumeWorld();
  });
  return el;
}

export function buildConfirm({ title, body, okText = 'OK', cancelText = 'Batal', onOk, onCancel } = {}) {
  const el = document.createElement('div');
  el.className = 'screen confirm-screen';
  el.innerHTML = `
    <div class="md-card confirm-card">
      <h3 class="confirm-title">${title}</h3>
      <p class="confirm-body">${body}</p>
      <div class="confirm-row">
        <button class="md-btn outlined" data-act="cancel">${cancelText}</button>
        <button class="md-btn" data-act="ok">${okText}</button>
      </div>
    </div>
  `;
  el.querySelector('[data-act=ok]').addEventListener('click', () => { app.ui.closeAll(); app.ui.modalOpen = false; onOk?.(); });
  el.querySelector('[data-act=cancel]').addEventListener('click', () => { app.ui.closeAll(); app.ui.modalOpen = false; onCancel?.(); });
  return el;
}
