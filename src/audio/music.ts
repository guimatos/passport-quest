/**
 * Procedural background music with the Web Audio API: no audio files, no
 * network. Two short loops (a bossa-flavoured one for Rio, a folk waltz for
 * Porto) built from oscillators and filtered noise.
 * Rules: the AudioContext is created on the first user gesture (unlock),
 * the user can mute, and the context is suspended while the page is hidden.
 */
export type Track = 'rio' | 'porto' | 'menu';

interface Pattern {
  bpm: number;
  stepsPerBar: number;
  bars: number;
  bass: (number | null)[];
  melody: (number | null)[];
  chords: number[][] | null;
  hat: boolean[];
  melodyWave: OscillatorType;
  bassWave: OscillatorType;
}

// MIDI note numbers. null = rest.
const RIO: Pattern = {
  bpm: 124, stepsPerBar: 8, bars: 4,
  bass:   [45, null, 52, null, 45, null, 52, 50,  43, null, 50, null, 43, null, 50, 48,  41, null, 48, null, 41, null, 48, 47,  43, null, 50, null, 43, 47, 50, 52],
  melody: [69, null, 72, 74, null, 72, null, 69,  67, null, 71, null, 72, null, 71, 67,  65, null, 69, 72, null, 69, null, 65,  67, 71, null, 74, null, 72, 71, null],
  chords: [[57, 60, 64], [55, 59, 62], [53, 57, 60], [55, 59, 62]],
  hat: [true, false, true, true, false, true, true, false].concat([true, false, true, true, false, true, true, false], [true, false, true, true, false, true, true, false], [true, false, true, true, false, true, true, false]),
  melodyWave: 'triangle', bassWave: 'sine',
};

const PORTO: Pattern = {
  bpm: 150, stepsPerBar: 6, bars: 4,
  bass:   [48, null, null, 55, null, null,  53, null, null, 60, null, null,  55, null, null, 62, null, null,  48, null, null, 55, null, 55],
  melody: [72, null, 74, 76, null, 79,  77, null, 76, 74, null, 72,  74, null, 76, 79, null, 77,  76, 74, null, 72, null, null],
  chords: [[60, 64, 67], [65, 69, 72], [67, 71, 74], [60, 64, 67]],
  hat: [true, false, false, true, false, true].concat([true, false, false, true, false, true], [true, false, false, true, false, true], [true, false, false, true, false, true]),
  melodyWave: 'square', bassWave: 'triangle',
};

const MENU: Pattern = {
  bpm: 96, stepsPerBar: 4, bars: 2,
  bass: [45, null, 52, null, 43, null, 50, null],
  melody: [null, 64, null, 67, null, 62, null, 64],
  chords: [[57, 60, 64], [55, 59, 62]],
  hat: [false, false, false, false, false, false, false, false],
  melodyWave: 'sine', bassWave: 'sine',
};

const PATTERNS: Record<Track, Pattern> = { rio: RIO, porto: PORTO, menu: MENU };
const midiToHz = (m: number) => 440 * Math.pow(2, (m - 69) / 12);

export class Music {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private noise: AudioBuffer | null = null;
  private track: Track | null = null;
  private step = 0;
  private nextTime = 0;
  private timer = 0;
  private _muted = false;
  private hidden = false;

  get muted() { return this._muted; }
  get available() { return typeof window !== 'undefined' && !!(window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext); }

  /** Must be called from a user gesture (e.g. the Play tap). Safe to call repeatedly. */
  unlock() {
    if (this.ctx) { if (this.ctx.state === 'suspended' && !this.hidden) void this.ctx.resume(); return; }
    const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return;
    this.ctx = new Ctor();
    this.master = this.ctx.createGain();
    this.master.gain.value = this._muted ? 0 : 0.14;
    this.master.connect(this.ctx.destination);
    const len = this.ctx.sampleRate * 0.2;
    this.noise = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = this.noise.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  }

  play(track: Track) {
    if (!this.ctx) return;
    if (this.track === track) return;
    this.stop();
    this.track = track;
    this.step = 0;
    this.nextTime = this.ctx.currentTime + 0.05;
    this.timer = window.setInterval(() => this.schedule(), 90);
  }

  stop() {
    if (this.timer) { clearInterval(this.timer); this.timer = 0; }
    this.track = null;
  }

  setMuted(m: boolean) {
    this._muted = m;
    if (this.master && this.ctx) this.master.gain.setTargetAtTime(m ? 0 : 0.14, this.ctx.currentTime, 0.03);
  }

  /** Silence while the page is hidden; resume when visible again. */
  setHidden(hidden: boolean) {
    this.hidden = hidden;
    if (!this.ctx) return;
    if (hidden) void this.ctx.suspend(); else void this.ctx.resume();
  }

  /** Short celebratory arpeggio. */
  jingle() {
    if (!this.ctx || !this.master) return;
    const t = this.ctx.currentTime;
    [60, 64, 67, 72].forEach((m, i) => this.tone(m, t + i * 0.09, 0.25, 'triangle', 0.5));
  }

  private schedule() {
    if (!this.ctx || !this.track) return;
    const p = PATTERNS[this.track];
    const stepDur = 60 / p.bpm / (p.stepsPerBar / 4) / 2 * (p.stepsPerBar === 6 ? 1.5 : 1);
    while (this.nextTime < this.ctx.currentTime + 0.25) {
      const total = p.stepsPerBar * p.bars;
      const i = this.step % total;
      const t = this.nextTime;
      const bass = p.bass[i]; if (bass != null) this.tone(bass, t, stepDur * 1.8, p.bassWave, 0.9);
      const mel = p.melody[i]; if (mel != null) this.tone(mel, t, stepDur * 1.1, p.melodyWave, 0.35);
      if (p.chords && i % p.stepsPerBar === (p.stepsPerBar === 8 ? 2 : 1)) {
        const chord = p.chords[Math.floor(i / p.stepsPerBar) % p.chords.length];
        chord.forEach((m) => this.tone(m, t, stepDur * 1.6, 'triangle', 0.16));
      }
      if (p.hat[i]) this.hatTick(t);
      this.nextTime += stepDur;
      this.step++;
    }
  }

  private tone(midi: number, at: number, dur: number, wave: OscillatorType, vol: number) {
    if (!this.ctx || !this.master) return;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = wave;
    osc.frequency.value = midiToHz(midi);
    g.gain.setValueAtTime(0.0001, at);
    g.gain.exponentialRampToValueAtTime(vol, at + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
    osc.connect(g).connect(this.master);
    osc.start(at);
    osc.stop(at + dur + 0.05);
  }

  private hatTick(at: number) {
    if (!this.ctx || !this.master || !this.noise) return;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noise;
    const f = this.ctx.createBiquadFilter();
    f.type = 'highpass'; f.frequency.value = 6000;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.12, at);
    g.gain.exponentialRampToValueAtTime(0.0001, at + 0.05);
    src.connect(f).connect(g).connect(this.master);
    src.start(at); src.stop(at + 0.06);
  }

  /** Full teardown (restart keeps the context but stops the sequencer). */
  destroy() {
    this.stop();
  }
}
