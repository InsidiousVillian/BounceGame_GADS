/**
 * Audio hooks with console fallbacks until sound files are wired via register().
 */
(function (global) {
  const FALLBACK_MSG = {
    bg_music: '[SoundManager] bg_music — muffled, bass-heavy nightclub loop (placeholder)',
    sfx_punch: '[SoundManager] sfx_punch — heavy impact (placeholder)',
    sfx_stamp_approve: '[SoundManager] sfx_stamp_approve — crisp paper stamp (placeholder)',
    sfx_stamp_deny: '[SoundManager] sfx_stamp_deny — dull, heavy stamp (placeholder)',
    sfx_alarm: '[SoundManager] sfx_alarm — subtle siren (chaos high) (placeholder)',
  };

  const SoundManager = {
    _bgTick: null,
    _alarmTick: null,
    /** @type {Record<string, HTMLAudioElement>} */
    _clips: {},

    _log(key) {
      if (FALLBACK_MSG[key]) console.log(FALLBACK_MSG[key]);
    },

    /**
     * Assign a file URL to a key. Optional: call before play/startBgMusic.
     * @param {string} key
     * @param {string} url
     */
    register(key, url) {
      const a = new Audio(url);
      a.preload = 'auto';
      if (key === 'bg_music') {
        a.loop = true;
        a.volume = 0.45;
      }
      this._clips[key] = a;
    },

    /**
     * One-shot SFX (or any non-looping key).
     * @param {string} key
     */
    play(key) {
      this._log(key);
      const el = this._clips[key];
      if (!el || !el.src) return;
      try {
        el.currentTime = 0;
        const p = el.play();
        if (p && typeof p.catch === 'function') p.catch(() => {});
      } catch (_) {}
    },

    startBgMusic() {
      this.stopBgMusic();
      const el = this._clips.bg_music;
      if (el && el.src) {
        try {
          el.currentTime = 0;
          const p = el.play();
          if (p && typeof p.catch === 'function') p.catch(() => {});
        } catch (_) {}
      }
      this._log('bg_music');
      this._bgTick = global.setInterval(() => this._log('bg_music'), 2800);
    },

    stopBgMusic() {
      if (this._bgTick != null) {
        global.clearInterval(this._bgTick);
        this._bgTick = null;
      }
      const el = this._clips.bg_music;
      if (el) {
        try {
          el.pause();
          el.currentTime = 0;
        } catch (_) {}
      }
    },

    startAlarm() {
      if (this._alarmTick != null) return;
      const el = this._clips.sfx_alarm;
      if (el && el.src) {
        try {
          el.loop = true;
          el.volume = 0.22;
          const p = el.play();
          if (p && typeof p.catch === 'function') p.catch(() => {});
        } catch (_) {}
      }
      this._alarmTick = global.setInterval(() => this._log('sfx_alarm'), 3200);
    },

    stopAlarm() {
      if (this._alarmTick != null) {
        global.clearInterval(this._alarmTick);
        this._alarmTick = null;
      }
      const el = this._clips.sfx_alarm;
      if (el) {
        try {
          el.pause();
          el.currentTime = 0;
        } catch (_) {}
      }
    },

    /** @param {number} chaos 0–100 */
    updateChaosAlarm(chaos) {
      if (chaos > 80) this.startAlarm();
      else this.stopAlarm();
    },
  };

  global.SoundManager = SoundManager;
})(typeof window !== 'undefined' ? window : globalThis);
