// DialogueSystem — DOM bottom panel. Typewriter engine, choices, secret gifts,
// mission accept/complete hand-off. Designed for long-form NPC chit-chat.

import { app } from '../core/App.js';
import { ITEMS } from '../systems/ItemEffects.js';

export class DialogueSystem {
  constructor(ctx) {
    this.ctx = ctx;          // WorldScene
    this.panel = null;
    this.state = 'closed';   // lines | choices | closed
    this._lines = [];
    this._lineIdx = 0;
    this._typeTimer = null;
    this._npc = null;
    this._onDone = null;
    this._boundsHook();
  }

  open(npc) {
    if (this.state !== 'closed') return;
    this._npcName = npc.name;
    npc.facePlayer(this.ctx.player.pos);

    // count a "talk" toward secret-item progress
    const s = app.save.state;
    s.dialogue[npc.id] = (s.dialogue[npc.id] ?? 0) + 1;
    app.save.save();

    const offers = this.ctx.delivery.offersFor(npc);
    const deliver = this.ctx.delivery.deliveriesTo(npc);
    const deliveryDone = deliver ? true : false;

    if (deliver) {
      this._lines = [
        `${npc.name.split(' ')[0]} takes the parcel gently, eyes shining.`,
        '"Carefully stamped and perfectly intact… you are a true courier!"',
      ];
      this._onDone = () => {
        this._closeUi();
        this.ctx.delivery.completeDeliveryAt(npc);
      };
      this._play();
      return;
    }

    // first talk or repeat
    const first = this._isFirstTalk(npc);
    this._lines = (first ? npc.dialog.intro : npc.dialog.repeat).slice();
    this._onDone = () => this._showChoices(npc, offers);
    this._play();
  }

  close() {
    this._closeUi();
  }

  /* ------------------------------------------------------------------ */
  _isFirstTalk(npc) {
    const n = app.save.state.dialogue[npc.id] ?? 1;
    return n <= 1;
  }

  _play() {
    this._ensurePanel();
    this.state = 'lines';
    this._lineIdx = 0;
    this.panel.classList.add('open');
    this._typeLine(this._lines[0]);
    app.ui.modalOpen = true;
    app.input.releaseLock();
    this.panel.querySelector('.dlg-name').textContent = this._npcName ?? '';
  }

  _showChoices(npc, offers) {
    this._ensurePanel();
    this._npcName = npc.name;
    this.state = 'choices';
    const nameEl = this.panel.querySelector('.dlg-name');
    nameEl.textContent = npc.name;

    const list = [];
    if (offers?.length) {
      for (const m of offers) {
        list.push({
          label: `✉️ Terima misi: ${m.title}`,
          sub: `${m.rewards.xp} XP · ${m.rewards.coins} koin${m.fragile ? ' · fragile' : ''}${m.timeLimit ? ' · timed' : ''}`,
          cls: 'primary',
          icon: '📨',
          action: () => {
            this.ctx.delivery.accept(m);
            this._closeUi();
          },
        });
      }
    }

    // secret flow
    if (npc.secret && !this._secretGranted(npc)) {
      const sec = this._secretChoice(npc);
      if (sec) list.push(sec);
    }

    list.push({
      label: '☕ Duduk sebentar',
      sub: '+8 HP',
      action: () => {
        this.ctx.player.stats.heal(8);
        this._closeUi();
      },
      cls: '',
    });
    list.push({
      label: '👋 Sampai jumpa',
      cls: '',
      action: () => this._closeUi(),
    });

    const body = this.panel.querySelector('.dlg-body');
    body.innerHTML = '';
    const cc = this.panel.querySelector('.dlg-choices');
    cc.innerHTML = '';
    const title = document.createElement('div');
    title.className = 'dlg-hint';
    title.textContent = '…apa yang ingin kau tanyakan?';
    cc.appendChild(title);

    for (const item of list) {
      const b = document.createElement('button');
      b.className = `dlg-choice ${item.cls ?? ''}`;
      b.innerHTML = `
        <span class="dc-icon">${item.icon ?? '💬'}</span>
        <span class="dc-text">
          <b>${item.label.replace(/^[^:]+:\s*/, '')}</b>
          ${item.sub ? `<small>${item.sub}</small>` : ''}
        </span>`;
      b.addEventListener('click', () => {
        app.audio.sfx('ui_click');
        item.action();
      });
      cc.appendChild(b);
    }
  }

  _secretChoice(npc) {
    const sc = npc.secret;
    const id = sc.item;
    const item = ITEMS[id];
    if (!item) return null;

    const stamps = Object.entries(app.save.state.stamps ?? {}).reduce((a, [, v]) => a + Number(v || 0), 0);
    const talkN = app.save.state.dialogue[npc.id] ?? 1;
    const ready = sc.type === 'bring' ? stamps >= sc.need : talkN >= sc.need;

    return {
      label: ready
        ? `🕊️ "Ada hal rahasia yang ingin kuberi…"`
        : `🔒 "Aku perlu sesuatu sebelum bisa berbicara…"`,
      sub: sc.type === 'bring'
        ? ready
          ? `Serahkan ${sc.need} stempel emas → ${item.name}`
          : `${sc.need} stempel emas (kau: ${stamps})`
        : sc.type === 'talk'
          ? ready
            ? `Rahasia terbuka! → ${item.name}`
            : `Rahasia terbuka pada ${sc.need}× bicara (kau: ${talkN})`
          : 'Rahasia tersembunyi…',
      icon: ready ? '✨' : '🔒',
      cls: ready ? 'secret-ready' : 'secret-locked',
      action: () => {
        if (ready) {
          this._grantSecret(npc, sc, item);
        } else {
          this._lines = [sc.hint, '(Kembali lagi nanti…)'];
          this._onDone = () => this._showChoices(npc, this.ctx.delivery.offersFor(npc));
          this._play();
        }
      },
    };
  }

  _grantSecret(npc, sc, item) {
    const s = app.save.state;
    s.items[sc.item] = true;
    s.secretsFound = [...(s.secretsFound ?? []), npc.id];
    // stamp cost consumed
    if (sc.type === 'bring') this._spendStamps(sc.need);
    app.save.save();
    this.ctx.player.stats.recalc();
    this.ctx.player.setPowerup?.(2.2);
    app.audio.sfx('levelup');
    app.ui.toast(`${item.name} diperoleh! ${item.desc}`, { icon: item.icon, title: 'SECRET ITEM!' });
    app.bus.emit('item-new', { item: sc.item });
    this._closeUi();
  }

  _spendStamps(n) {
    const stamps = { ...(app.save.state.stamps ?? {}) };
    const keys = Object.keys(stamps);
    let remaining = n;
    for (const k of keys) {
      const v = Number(stamps[k] || 0);
      if (v <= 0) continue;
      const take = Math.min(v, remaining);
      stamps[k] = v - take;
      remaining -= take;
      if (remaining <= 0) break;
    }
    app.save.state.stamps = stamps;
    app.save.save();
  }

  _secretGranted(npc) {
    return app.save.state.secretsFound?.includes(npc.id);
  }

  /* ------------------------------------------------------------------ */
  _typewriteDispose() {
    if (this._typeTimer) clearInterval(this._typeTimer);
    this._typeTimer = null;
  }

  _skipOrNext() {
    const body = this.panel?.querySelector('.dlg-body');
    const line = this._lines[this._lineIdx] ?? '';
    const slot = body?.querySelector('.dlg-line');
    if (slot && slot.textContent.length < line.length) {
      clearInterval(this._typeTimer);
      this._typeTimer = null;
      slot.textContent = line;
      this._showContinueButton();
      return;
    }
    this._nextLine();
  }

  _showContinueButton() {
    const cc = this.panel.querySelector('.dlg-choices');
    const existing = cc.querySelector('.dlg-continue');
    if (existing) return;
    const hint = document.createElement('button');
    hint.className = 'dlg-continue';
    hint.textContent = 'Lanjutkan ▸';
    hint.addEventListener('click', () => {
      app.audio.sfx('ui_click');
      this._nextLine();
    });
    cc.appendChild(hint);
  }

  _typeLine(line) {
    const body = this.panel.querySelector('.dlg-body');
    const cc = this.panel.querySelector('.dlg-choices');
    cc.innerHTML = '';
    body.innerHTML = '<span class="dlg-line"></span>';
    const slot = body.querySelector('.dlg-line');
    body.onclick = () => this._skipOrNext();
    let i = 0;
    this._typewriteDispose();
    this._typeTimer = setInterval(() => {
      i += 1;
      slot.textContent = line.slice(0, i);
      if (i >= line.length) {
        clearInterval(this._typeTimer);
        this._typeTimer = null;
        app.audio.babble?.(line, { voice: 'villager' });
        this._showContinueButton();
      }
    }, 12);
  }

  _nextLine() {
    this._lineIdx += 1;
    if (this._lineIdx >= this._lines.length) {
      const cb = this._onDone;
      this._onDone = null;
      cb?.();
      return;
    }
    this._typeLine(this._lines[this._lineIdx]);
  }

  _ensurePanel() {
    if (this.panel) return;
    const el = document.createElement('div');
    el.className = 'dialogue-panel';
    el.innerHTML = `
      <div class="dlg-card">
        <div class="dlg-head">
          <span class="dlg-badge">◉ NPC</span>
          <span class="dlg-name"></span>
          <div class="dlg-dots"><span></span><span></span></div>
        </div>
        <div class="dlg-body"></div>
        <div class="dlg-choices"></div>
      </div>
    `;
    document.getElementById('ui-root').appendChild(el);
    this.panel = el;
  }

  _closeUi() {
    this.state = 'closed';
    this._typewriteDispose();
    if (this.panel) this.panel.classList.remove('open');
    this._npc = null;
    app.ui.modalOpen = false;
    if (this.ctx.worldActive && !this.ctx.bossActive) app.input.requestLock();
  }

  _boundsHook() {
    document.addEventListener('pointerlockchange', () => {
      // no-op: modalOpen flag already gates auto-pause; kept as symmetry anchor
    });
  }
}
