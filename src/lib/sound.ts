// Web Audio API Procedural Synthesizer for CS2 Simulator
class SoundController {
  private ctx: AudioContext | null = null;
  private noiseBuffer: AudioBuffer | null = null;
  private activeWhooshNodes: { stop: () => void } | null = null;
  public enabled: boolean = true;

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  private getNoiseBuffer(ctx: AudioContext): AudioBuffer {
    if (this.noiseBuffer && this.noiseBuffer.sampleRate === ctx.sampleRate) {
      return this.noiseBuffer;
    }
    const bufferSize = Math.floor(ctx.sampleRate * 0.05);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    this.noiseBuffer = buffer;
    return buffer;
  }

  public playClick() {
    if (!this.enabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.04);

    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.04);
  }

  public playTick(pitchRatio: number = 1) {
    if (!this.enabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    const baseFreq = 950 * pitchRatio;
    osc.frequency.setValueAtTime(baseFreq, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.4, ctx.currentTime + 0.035);

    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.035);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.035);
  }

  public playWin(rarity: string = 'milspec') {
    if (!this.enabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const isGold = rarity === 'gold' || rarity === 'covert';
    const notes = isGold ? [523.25, 659.25, 783.99, 1046.50, 1318.51] : [440, 554.37, 659.25, 880];

    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = isGold ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.08);

      gain.gain.setValueAtTime(0.001, ctx.currentTime + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.15, ctx.currentTime + idx * 0.08 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.08 + 0.4);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime + idx * 0.08);
      osc.stop(ctx.currentTime + idx * 0.08 + 0.45);
    });
  }

  public playCashout() {
    if (!this.enabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    [880, 1174.66, 1760].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.06);

      gain.gain.setValueAtTime(0.15, ctx.currentTime + idx * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.06 + 0.3);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime + idx * 0.06);
      osc.stop(ctx.currentTime + idx * 0.06 + 0.3);
    });
  }

  public playCrash() {
    if (!this.enabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    // Deep sub-bass boom
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(140, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(30, ctx.currentTime + 0.4);

    gain.gain.setValueAtTime(0.25, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.45);
  }

  public startSpinWhoosh(duration: number = 4.2) {
    if (!this.enabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    this.stopSpinWhoosh();

    const now = ctx.currentTime;
    const bufferSize = Math.floor(ctx.sampleRate * (duration + 0.5));
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);

    // Warm Brownian-tinted noise for smooth aerodynamic wind texture (not harsh or crackling)
    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      output[i] = (lastOut + 0.03 * white) / 1.03;
      lastOut = output[i];
      output[i] *= 3.8;
    }

    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = noiseBuffer;

    // 1. Sweeping Lowpass filter (Wind rush)
    const lpFilter = ctx.createBiquadFilter();
    lpFilter.type = 'lowpass';
    lpFilter.Q.setValueAtTime(2.5, now);
    lpFilter.frequency.setValueAtTime(220, now);
    lpFilter.frequency.exponentialRampToValueAtTime(880, now + 0.4);
    lpFilter.frequency.setValueAtTime(850, now + 2.0);
    lpFilter.frequency.exponentialRampToValueAtTime(140, now + duration);

    // 2. Resonant Bandpass filter (Gives the distinct hollow "WHOOSH" body)
    const bpFilter = ctx.createBiquadFilter();
    bpFilter.type = 'bandpass';
    bpFilter.Q.setValueAtTime(3.0, now);
    bpFilter.frequency.setValueAtTime(260, now);
    bpFilter.frequency.exponentialRampToValueAtTime(650, now + 0.45);
    bpFilter.frequency.setValueAtTime(600, now + 2.0);
    bpFilter.frequency.exponentialRampToValueAtTime(180, now + duration);

    // 3. Sub-bass Wind Body (Low air displacement)
    const subOsc = ctx.createOscillator();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(65, now);
    subOsc.frequency.exponentialRampToValueAtTime(120, now + 0.4);
    subOsc.frequency.setValueAtTime(105, now + 2.0);
    subOsc.frequency.exponentialRampToValueAtTime(45, now + duration);

    const subGain = ctx.createGain();
    subGain.gain.setValueAtTime(0.001, now);
    subGain.gain.linearRampToValueAtTime(0.20, now + 0.35);
    subGain.gain.setValueAtTime(0.18, now + 2.2);
    subGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    subOsc.connect(subGain);
    subGain.connect(ctx.destination);

    // Master Whoosh Volume Envelope
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.001, now);
    masterGain.gain.linearRampToValueAtTime(0.35, now + 0.32); // Powerful, smooth whoosh surge
    masterGain.gain.setValueAtTime(0.30, now + 2.2);
    masterGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    noiseSource.connect(lpFilter);
    lpFilter.connect(masterGain);

    noiseSource.connect(bpFilter);
    bpFilter.connect(masterGain);

    masterGain.connect(ctx.destination);

    noiseSource.start(now);
    subOsc.start(now);
    noiseSource.stop(now + duration + 0.1);
    subOsc.stop(now + duration + 0.1);

    this.activeWhooshNodes = {
      stop: () => {
        try {
          const stopTime = ctx.currentTime;
          masterGain.gain.cancelScheduledValues(stopTime);
          masterGain.gain.linearRampToValueAtTime(0.0001, stopTime + 0.08);
          subGain.gain.cancelScheduledValues(stopTime);
          subGain.gain.linearRampToValueAtTime(0.0001, stopTime + 0.08);
          setTimeout(() => {
            try {
              noiseSource.stop();
              subOsc.stop();
            } catch {}
          }, 90);
        } catch {}
      }
    };
  }

  public stopSpinWhoosh() {
    if (this.activeWhooshNodes) {
      this.activeWhooshNodes.stop();
      this.activeWhooshNodes = null;
    }
  }

  public playSpinStart() {
    this.startSpinWhoosh(4.2);
  }

  public playUpgradeSpin(progress: number = 0.5) {
    if (!this.enabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    // Smooth individual whoosh gust if invoked directly
    const clamped = Math.max(0, Math.min(1, progress));
    const now = ctx.currentTime;
    const dur = 0.22 + (1 - clamped) * 0.12;

    const noiseBuf = this.getNoiseBuffer(ctx);
    const noiseSrc = ctx.createBufferSource();
    noiseSrc.buffer = noiseBuf;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.Q.setValueAtTime(2.2, now);
    filter.frequency.setValueAtTime(200, now);
    filter.frequency.exponentialRampToValueAtTime(650 - clamped * 250, now + dur * 0.5);
    filter.frequency.exponentialRampToValueAtTime(150, now + dur);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.22, now + dur * 0.4);
    gain.gain.exponentialRampToValueAtTime(0.001, now + dur);

    noiseSrc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    noiseSrc.start(now);
    noiseSrc.stop(now + dur + 0.02);
  }

  public playConsolation(isPotion: boolean = false) {
    if (!this.enabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    if (isPotion) {
      // Mysterious, dark emerald potion chime (minor/ethereal)
      const potionNotes = [329.63, 311.13, 277.18, 246.94];
      potionNotes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        const noteStart = now + idx * 0.1;
        osc.frequency.setValueAtTime(freq, noteStart);
        osc.frequency.exponentialRampToValueAtTime(freq * 0.95, noteStart + 0.25);

        gain.gain.setValueAtTime(0.001, noteStart);
        gain.gain.linearRampToValueAtTime(0.07, noteStart + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0005, noteStart + 0.3);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(noteStart);
        osc.stop(noteStart + 0.32);
      });
      return;
    }

    // Subdued, melancholic descending minor motif (F4 -> Eb4 -> Db4 -> A3 slide down)
    const notes = [
      { freq: 349.23, dur: 0.14, start: 0 },
      { freq: 311.13, dur: 0.14, start: 0.12 },
      { freq: 277.18, dur: 0.16, start: 0.24 },
      { freq: 220.00, dur: 0.36, start: 0.38 },
    ];

    notes.forEach((n) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      osc.type = 'triangle';
      const noteStart = now + n.start;
      osc.frequency.setValueAtTime(n.freq, noteStart);
      if (n.start >= 0.35) {
        osc.frequency.exponentialRampToValueAtTime(175, noteStart + n.dur);
      }

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(900, noteStart);

      gain.gain.setValueAtTime(0.001, noteStart);
      gain.gain.linearRampToValueAtTime(0.08, noteStart + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0005, noteStart + n.dur);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.start(noteStart);
      osc.stop(noteStart + n.dur + 0.02);
    });

    // Sub-bass deflated sigh at the end
    const subOsc = ctx.createOscillator();
    const subGain = ctx.createGain();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(85, now + 0.38);
    subOsc.frequency.exponentialRampToValueAtTime(42, now + 0.72);

    subGain.gain.setValueAtTime(0.001, now + 0.38);
    subGain.gain.linearRampToValueAtTime(0.09, now + 0.42);
    subGain.gain.exponentialRampToValueAtTime(0.0005, now + 0.74);

    subOsc.connect(subGain);
    subGain.connect(ctx.destination);
    subOsc.start(now + 0.38);
    subOsc.stop(now + 0.76);
  }

  public playReward() {
    if (!this.enabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    [587.33, 739.99, 880, 1174.66].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.07);

      gain.gain.setValueAtTime(0.001, ctx.currentTime + idx * 0.07);
      gain.gain.exponentialRampToValueAtTime(0.14, ctx.currentTime + idx * 0.07 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.07 + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime + idx * 0.07);
      osc.stop(ctx.currentTime + idx * 0.07 + 0.38);
    });
  }
}

export const sound = new SoundController();
