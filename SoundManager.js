/**
 * SFX: Web Audio synthesis. Music: HTMLAudioElement → MediaElementSource → lowpass → out.
 * "Portal to Underworld" plays full-range in-club / end screens; muffled (~400Hz) when paused (outside).
 */
(function (global) {
  const MUSIC_PATH = 'assets/audio/DavidKBD - Pink Bloom Pack - 02 - Portal to Underworld.ogg';

  /** @type {AudioContext | null} */
  let _ctx = null;
  /** @type {HTMLAudioElement | null} */
  let _musicEl = null;
  /** @type {MediaElementAudioSourceNode | null} */
  let _musicSource = null;
  /** @type {BiquadFilterNode | null} */
  let _musicLowpass = null;
  /** @type {GainNode | null} */
  let _musicGain = null;

  let _alarmInterval = null;

  const MUFFLE_FREQ = 400;
  const CLEAR_FREQ = 22000;
  const FILTER_Q = 0.85;

  function getCtx() {
    if (!_ctx) {
      const AC = global.AudioContext || global.webkitAudioContext;
      if (!AC) return null;
      _ctx = new AC();
    }
    if (_ctx.state === 'suspended') {
      _ctx.resume().catch(() => {});
    }
    return _ctx;
  }

  function ensureMusicGraph() {
    const ctx = getCtx();
    if (!ctx) return false;

    if (!_musicEl) {
      _musicEl = new Audio(MUSIC_PATH);
      _musicEl.loop = true;
      _musicEl.preload = 'auto';
    }

    if (!_musicSource) {
      _musicSource = ctx.createMediaElementSource(_musicEl);
      _musicLowpass = ctx.createBiquadFilter();
      _musicLowpass.type = 'lowpass';
      _musicLowpass.frequency.value = MUFFLE_FREQ;
      _musicLowpass.Q.value = FILTER_Q;
      _musicGain = ctx.createGain();
      _musicGain.gain.value = 0.52;
      _musicSource.connect(_musicLowpass);
      _musicLowpass.connect(_musicGain);
      _musicGain.connect(ctx.destination);
    }

    return true;
  }

  const SoundManager = {
    /**
     * @param {boolean} muffled true = outside / lobby (~400Hz lowpass); false = inside club or end screen (full range)
     */
    setMusicMuffled(muffled) {
      if (!_musicLowpass) return;
      const ctx = getCtx();
      if (!ctx) return;
      const t = ctx.currentTime;
      const target = muffled ? MUFFLE_FREQ : CLEAR_FREQ;
      _musicLowpass.frequency.cancelScheduledValues(t);
      _musicLowpass.frequency.setTargetAtTime(target, t, muffled ? 0.07 : 0.1);
    },

    playPunch() {
      const ctx = getCtx();
      if (!ctx) return;
      const t = ctx.currentTime + 0.001;

      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(78, t);
      osc.frequency.exponentialRampToValueAtTime(52, t + 0.14);
      const gThump = ctx.createGain();
      gThump.gain.setValueAtTime(0, t);
      gThump.gain.linearRampToValueAtTime(0.85, t + 0.012);
      gThump.gain.exponentialRampToValueAtTime(0.001, t + 0.16);
      osc.connect(gThump);
      gThump.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.18);

      const dur = 0.07;
      const nSamples = Math.max(1, Math.floor(ctx.sampleRate * dur));
      const noiseBuf = ctx.createBuffer(1, nSamples, ctx.sampleRate);
      const ch = noiseBuf.getChannelData(0);
      for (let i = 0; i < nSamples; i++) ch[i] = Math.random() * 2 - 1;

      const noise = ctx.createBufferSource();
      noise.buffer = noiseBuf;
      const bp = ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.setValueAtTime(900, t);
      bp.Q.value = 0.7;
      const gNoise = ctx.createGain();
      gNoise.gain.setValueAtTime(0, t);
      gNoise.gain.linearRampToValueAtTime(0.38, t + 0.004);
      gNoise.gain.exponentialRampToValueAtTime(0.001, t + 0.055);
      noise.connect(bp);
      bp.connect(gNoise);
      gNoise.connect(ctx.destination);
      noise.start(t);
      noise.stop(t + dur);
    },

    playStamp(dull) {
      const ctx = getCtx();
      if (!ctx) return;
      const t = ctx.currentTime + 0.001;
      const f0 = dull ? 1650 : 3200;
      const f1 = dull ? 520 : 980;

      const osc = ctx.createOscillator();
      osc.type = 'square';
      osc.frequency.setValueAtTime(f0, t);
      osc.frequency.exponentialRampToValueAtTime(f1, t + 0.035);

      const g = ctx.createGain();
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(dull ? 0.11 : 0.09, t + 0.002);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.045);

      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.setValueAtTime(4800, t);

      osc.connect(lp);
      lp.connect(g);
      g.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.055);
    },

    playAlarm() {
      const ctx = getCtx();
      if (!ctx) return;
      const t = ctx.currentTime + 0.001;
      const hi = this._alarmToggle ? 920 : 1180;
      this._alarmToggle = !this._alarmToggle;

      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(hi, t);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.11, t + 0.008);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
      osc.connect(g);
      g.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.12);
    },

    _alarmToggle: false,

    startAlarm() {
      if (_alarmInterval != null) return;
      this._alarmToggle = false;
      const ctx = getCtx();
      if (ctx) ctx.resume().catch(() => {});
      this.playAlarm();
      _alarmInterval = global.setInterval(() => this.playAlarm(), 380);
    },

    stopAlarm() {
      if (_alarmInterval != null) {
        global.clearInterval(_alarmInterval);
        _alarmInterval = null;
      }
    },

    /**
     * Begin loop (call from START SHIFT click so autoplay allows playback).
     * In-club = full-range; graph defaults to lowpass until setMusicMuffled(false).
     */
    startMusic() {
      if (!ensureMusicGraph()) return;
      const ctx = getCtx();
      if (!ctx) return;

      ctx.resume().catch(() => {});

      _musicEl.pause();
      _musicEl.currentTime = 0;

      this.setMusicMuffled(false);

      const p = _musicEl.play();
      if (p && typeof p.catch === 'function') p.catch(() => {});
    },

    stopMusic() {
      if (_musicEl) {
        _musicEl.pause();
        _musicEl.currentTime = 0;
      }
    },

    startBgMusic() {
      this.startMusic();
    },

    stopBgMusic() {
      this.stopMusic();
    },

    play(key) {
      if (key === 'sfx_punch') this.playPunch();
      else if (key === 'sfx_stamp_approve') this.playStamp(false);
      else if (key === 'sfx_stamp_deny') this.playStamp(true);
    },

    updateChaosAlarm(chaos) {
      if (chaos > 80) this.startAlarm();
      else this.stopAlarm();
    },
  };

  global.SoundManager = SoundManager;
})(typeof window !== 'undefined' ? window : globalThis);
