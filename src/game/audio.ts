class SoundEngine {
  private ctx: AudioContext | null = null;
  public muted = false;

  private ensureContext(): AudioContext | null {
    if (this.muted) return null;
    try {
      if (!this.ctx) {
        const AudioCtx =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        this.ctx = new AudioCtx();
      }
      if (this.ctx.state === 'suspended') {
        void this.ctx.resume();
      }
      return this.ctx;
    } catch {
      return null;
    }
  }

  private tone(
    freq: number,
    duration: number,
    type: OscillatorType = 'sine',
    gainPeak = 0.08,
    delay = 0,
    endFreq?: number,
  ) {
    const ctx = this.ensureContext();
    if (!ctx) return;

    const start = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, start);
    if (endFreq !== undefined) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(20, endFreq), start + duration);
    }
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.linearRampToValueAtTime(gainPeak, start + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(start);
    osc.stop(start + duration + 0.02);
  }

  playClick() {
    this.tone(540, 0.06, 'triangle', 0.05);
  }

  playPickup() {
    this.tone(520, 0.09, 'triangle', 0.08, 0);
    this.tone(780, 0.14, 'triangle', 0.08, 0.07);
  }

  playDelivery() {
    this.tone(587.33, 0.1, 'triangle', 0.09, 0);
    this.tone(783.99, 0.11, 'triangle', 0.09, 0.08);
    this.tone(1046.5, 0.22, 'sine', 0.1, 0.16);
  }

  playCoin() {
    this.tone(987.77, 0.07, 'sine', 0.06, 0);
    this.tone(1318.51, 0.16, 'sine', 0.07, 0.06);
  }

  playDash() {
    this.tone(240, 0.18, 'sawtooth', 0.04, 0, 520);
  }

  playBump() {
    this.tone(150, 0.24, 'sawtooth', 0.11, 0, 55);
    this.tone(95, 0.28, 'square', 0.06, 0.02, 40);
  }

  playHorn() {
    this.tone(330, 0.14, 'sawtooth', 0.05, 0);
    this.tone(415, 0.16, 'sawtooth', 0.05, 0.01);
  }

  playBark() {
    this.tone(290, 0.07, 'square', 0.05, 0, 140);
    this.tone(340, 0.08, 'square', 0.05, 0.11, 130);
  }

  playBuy() {
    this.tone(440, 0.08, 'triangle', 0.07, 0);
    this.tone(660, 0.14, 'triangle', 0.08, 0.07);
  }

  playError() {
    this.tone(210, 0.16, 'sawtooth', 0.07, 0, 140);
  }

  playNewDay() {
    this.tone(440, 0.12, 'sine', 0.07, 0);
    this.tone(554.37, 0.12, 'sine', 0.07, 0.1);
    this.tone(659.25, 0.22, 'sine', 0.08, 0.2);
  }

  playLevelUp() {
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((n, idx) => {
      this.tone(n, 0.18, 'triangle', 0.09, idx * 0.08);
    });
  }

  playVictory() {
    const fanfare = [523.25, 659.25, 783.99, 1046.5, 783.99, 1046.5, 1318.51];
    fanfare.forEach((n, idx) => {
      this.tone(n, idx === fanfare.length - 1 ? 0.5 : 0.15, 'triangle', 0.1, idx * 0.11);
    });
  }
}

export const soundEngine = new SoundEngine();
