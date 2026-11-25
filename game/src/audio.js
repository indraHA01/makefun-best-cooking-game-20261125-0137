// Ember Hearth — SoundEngine: every sound is synthesized with WebAudio.
// No audio files, no network: oscillators and filtered noise only.

export class SoundEngine {
  constructor() {
    this.context = null;
    this.muted = false;
    this.sizzleNodes = null;
  }

  // Browsers only allow audio after a user gesture; call from the first
  // key press or click, then every later sound just works.
  ensure() {
    if (!this.context) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      this.context = new AudioContext();
    }
    if (this.context.state === 'suspended') this.context.resume();
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.muted) this.stopSizzle();
    return this.muted;
  }

  tone(freq, duration, type = 'sine', volume = 0.12, when = 0) {
    if (!this.context || this.muted) return;
    const t0 = this.context.currentTime + when;
    const osc = this.context.createOscillator();
    const gain = this.context.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    gain.gain.setValueAtTime(volume, t0);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + duration);
    osc.connect(gain).connect(this.context.destination);
    osc.start(t0);
    osc.stop(t0 + duration + 0.02);
  }

  // Short filtered-noise burst: chops, sizzles, trash thuds.
  noise(duration, filterFreq, volume = 0.15, when = 0) {
    if (!this.context || this.muted) return;
    const t0 = this.context.currentTime + when;
    const length = Math.max(1, Math.floor(this.context.sampleRate * duration));
    const buffer = this.context.createBuffer(1, length, this.context.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / length);
    const source = this.context.createBufferSource();
    source.buffer = buffer;
    const filter = this.context.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = filterFreq;
    const gain = this.context.createGain();
    gain.gain.setValueAtTime(volume, t0);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + duration);
    source.connect(filter).connect(gain).connect(this.context.destination);
    source.start(t0);
  }

  pickup() { this.tone(520, 0.08, 'triangle', 0.1); }
  place() { this.tone(330, 0.08, 'triangle', 0.1); this.noise(0.06, 900, 0.08, 0.02); }
  chop() { this.noise(0.09, 1400, 0.22); this.tone(180, 0.07, 'square', 0.06); }
  chopDone() { this.tone(660, 0.1, 'triangle', 0.12); this.tone(880, 0.14, 'triangle', 0.1, 0.08); }
  cookDone() { this.tone(740, 0.12, 'sine', 0.12); this.tone(988, 0.16, 'sine', 0.1, 0.1); }
  serve() {
    this.tone(523, 0.12, 'triangle', 0.14);
    this.tone(659, 0.12, 'triangle', 0.14, 0.09);
    this.tone(784, 0.2, 'triangle', 0.14, 0.18);
  }
  error() { this.tone(160, 0.18, 'sawtooth', 0.09); }
  trash() { this.noise(0.12, 500, 0.16); }
  tick() { this.tone(1100, 0.05, 'square', 0.05); }
  rush() { this.tone(440, 0.15, 'square', 0.08); this.tone(587, 0.2, 'square', 0.08, 0.12); }
  win() {
    [523, 659, 784, 1047].forEach((f, i) => this.tone(f, 0.22, 'triangle', 0.13, i * 0.11));
  }

  // A looping sizzle while anything cooks on the stove.
  startSizzle() {
    if (!this.context || this.muted || this.sizzleNodes) return;
    const length = this.context.sampleRate;
    const buffer = this.context.createBuffer(1, length, this.context.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
    const source = this.context.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    const filter = this.context.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 3000;
    const gain = this.context.createGain();
    gain.gain.value = 0.035;
    source.connect(filter).connect(gain).connect(this.context.destination);
    source.start();
    this.sizzleNodes = { source, gain };
  }

  stopSizzle() {
    if (!this.sizzleNodes) return;
    try { this.sizzleNodes.source.stop(); } catch (_) { /* already stopped */ }
    this.sizzleNodes = null;
  }
}
