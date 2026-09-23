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

  public playError() {
    if (!this.enabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(140, ctx.currentTime);
    osc.frequency.setValueAtTime(110, ctx.currentTime + 0.08);

    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.18);
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
      output[i] = (lastOut + 0.028 * white) / 1.028;
      lastOut = output[i];
      output[i] *= 3.6;
    }

    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = noiseBuffer;

    // 1. Sweeping Lowpass filter: Clear, distinct RISE (0s -> 1.1s) and gradual FALL (1.4s -> 4.2s)
    const lpFilter = ctx.createBiquadFilter();
    lpFilter.type = 'lowpass';
    lpFilter.Q.setValueAtTime(2.6, now);
    lpFilter.frequency.setValueAtTime(150, now);
    lpFilter.frequency.exponentialRampToValueAtTime(720, now + 1.1); // Rise up
    lpFilter.frequency.setValueAtTime(700, now + 1.4);              // Apex
    lpFilter.frequency.exponentialRampToValueAtTime(380, now + 2.3); // Fall stage 1
    lpFilter.frequency.exponentialRampToValueAtTime(220, now + 3.4); // Fall stage 2
    lpFilter.frequency.exponentialRampToValueAtTime(100, now + duration); // Coast to stop

    // 2. Resonant Bandpass filter: hollow aerodynamic whoosh body
    const bpFilter = ctx.createBiquadFilter();
    bpFilter.type = 'bandpass';
    bpFilter.Q.setValueAtTime(2.8, now);
    bpFilter.frequency.setValueAtTime(180, now);
    bpFilter.frequency.exponentialRampToValueAtTime(540, now + 1.1); // Rise up
    bpFilter.frequency.setValueAtTime(520, now + 1.4);              // Apex
    bpFilter.frequency.exponentialRampToValueAtTime(320, now + 2.3); // Fall stage 1
    bpFilter.frequency.exponentialRampToValueAtTime(190, now + 3.4); // Fall stage 2
    bpFilter.frequency.exponentialRampToValueAtTime(110, now + duration); // Coast to stop

    // 3. Sub-bass Wind Body: low displacement rumble (55Hz -> 110Hz -> 38Hz)
    const subOsc = ctx.createOscillator();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(55, now);
    subOsc.frequency.exponentialRampToValueAtTime(110, now + 1.1);
    subOsc.frequency.setValueAtTime(105, now + 1.4);
    subOsc.frequency.exponentialRampToValueAtTime(75, now + 2.3);
    subOsc.frequency.exponentialRampToValueAtTime(50, now + 3.4);
    subOsc.frequency.exponentialRampToValueAtTime(38, now + duration);

    const subGain = ctx.createGain();
    // Reduced ~2.5x: peak volume 0.075 (was 0.20)
    subGain.gain.setValueAtTime(0.001, now);
    subGain.gain.linearRampToValueAtTime(0.075, now + 1.1);
    subGain.gain.setValueAtTime(0.07, now + 1.4);
    subGain.gain.exponentialRampToValueAtTime(0.035, now + 2.3);
    subGain.gain.exponentialRampToValueAtTime(0.012, now + 3.4);
    subGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    subOsc.connect(subGain);
    subGain.connect(ctx.destination);

    // Master Whoosh Volume Envelope: Clear Rise & Fall curve
    // Reduced ~2.5x: peak volume 0.14 (was 0.35)
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.001, now);
    masterGain.gain.linearRampToValueAtTime(0.14, now + 1.1);        // Smooth audible rise to peak
    masterGain.gain.setValueAtTime(0.13, now + 1.4);                 // Crest
    masterGain.gain.exponentialRampToValueAtTime(0.075, now + 2.3); // Continuous smooth fall
    masterGain.gain.exponentialRampToValueAtTime(0.028, now + 3.4); // Settling down
    masterGain.gain.exponentialRampToValueAtTime(0.001, now + 4.1);  // Gentle whisper
    masterGain.gain.linearRampToValueAtTime(0.0001, now + duration); // Settle to 0

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
          masterGain.gain.linearRampToValueAtTime(0.0001, stopTime + 0.06);
          subGain.gain.cancelScheduledValues(stopTime);
          subGain.gain.linearRampToValueAtTime(0.0001, stopTime + 0.06);
          setTimeout(() => {
            try {
              noiseSource.stop();
              subOsc.stop();
            } catch {}
          }, 70);
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

    // Smooth individual whoosh gust if invoked directly (~2.5x quieter)
    const clamped = Math.max(0, Math.min(1, progress));
    const now = ctx.currentTime;
    const dur = 0.26;

    const noiseBuf = this.getNoiseBuffer(ctx);
    const noiseSrc = ctx.createBufferSource();
    noiseSrc.buffer = noiseBuf;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.Q.setValueAtTime(2.2, now);
    filter.frequency.setValueAtTime(180, now);
    filter.frequency.exponentialRampToValueAtTime(500 - clamped * 250, now + dur * 0.45);
    filter.frequency.exponentialRampToValueAtTime(130, now + dur);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.09, now + dur * 0.45);
    gain.gain.exponentialRampToValueAtTime(0.0005, now + dur);

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

  /**
   * Angelic celestial chime / choir harmonic synthesized chord for Save Token
   */
  public playAngelicChime() {
    if (!this.enabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    // Harmonic celestial frequencies: C5, E5, G5, B5, C6, E6
    const freqs = [523.25, 659.25, 783.99, 987.77, 1046.5, 1318.51];
    freqs.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      const startTime = ctx.currentTime + idx * 0.06;
      osc.frequency.setValueAtTime(freq, startTime);
      osc.detune.setValueAtTime((Math.random() - 0.5) * 8, startTime);

      gain.gain.setValueAtTime(0.001, startTime);
      gain.gain.exponentialRampToValueAtTime(0.12, startTime + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 1.2);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + 1.25);
    });
  }

  /**
   * Grappling hook throw: metallic chain swish (noise sweep up + steel whistle)
   */
  public playHookThrow() {
    if (!this.enabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    // 1. Chain links rattling — bandpass noise sweeping up
    const noise = ctx.createBufferSource();
    noise.buffer = this.getNoiseBuffer(ctx);
    noise.loop = true;
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.Q.setValueAtTime(3.0, now);
    bp.frequency.setValueAtTime(900, now);
    bp.frequency.exponentialRampToValueAtTime(3600, now + 0.28);
    const ng = ctx.createGain();
    ng.gain.setValueAtTime(0.001, now);
    ng.gain.linearRampToValueAtTime(0.16, now + 0.06);
    ng.gain.exponentialRampToValueAtTime(0.001, now + 0.32);
    noise.connect(bp);
    bp.connect(ng);
    ng.connect(ctx.destination);
    noise.start(now);
    noise.stop(now + 0.35);

    // 2. Steel whistle — sine gliding up as the hook flies
    const osc = ctx.createOscillator();
    const og = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(420, now);
    osc.frequency.exponentialRampToValueAtTime(980, now + 0.28);
    og.gain.setValueAtTime(0.001, now);
    og.gain.linearRampToValueAtTime(0.07, now + 0.08);
    og.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
    osc.connect(og);
    og.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.32);
  }

  /**
   * Hook latch: heavy metal clank (resonant partials + click transient)
   */
  public playHookLatch() {
    if (!this.enabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    // Metallic partials
    [612, 917, 1440].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now);
      const peak = idx === 0 ? 0.16 : 0.09;
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(peak, now + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35 - idx * 0.06);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.4);
    });
    // Click transient
    const noise = ctx.createBufferSource();
    noise.buffer = this.getNoiseBuffer(ctx);
    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.setValueAtTime(2500, now);
    const ng = ctx.createGain();
    ng.gain.setValueAtTime(0.2, now);
    ng.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
    noise.connect(hp);
    hp.connect(ng);
    ng.connect(ctx.destination);
    noise.start(now);
    noise.stop(now + 0.1);
  }

  /**
   * Hook slip: chain slipping off — descending slide with soft rattle
   */
  public playHookSlip() {
    if (!this.enabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(540, now);
    osc.frequency.exponentialRampToValueAtTime(170, now + 0.42);
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.1, now + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.47);
  }

  /**
   * High-voltage lightning discharge / taser spark sound for Zeus x27
   */
  public playZeusShock() {
    if (!this.enabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    // 1. High-voltage crackle noise
    const noise = ctx.createBufferSource();
    noise.buffer = this.getNoiseBuffer(ctx);
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(3400, ctx.currentTime);
    filter.Q.setValueAtTime(4.0, ctx.currentTime);

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.25, ctx.currentTime);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    noise.start();

    // 2. Heavy electric arc zap oscillator
    const osc = ctx.createOscillator();
    const oscGain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(750, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(65, ctx.currentTime + 0.4);

    oscGain.gain.setValueAtTime(0.2, ctx.currentTime);
    oscGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);

    osc.connect(oscGain);
    oscGain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.42);
  }
}

export const sound = new SoundController();
