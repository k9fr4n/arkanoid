// Audio manager using Web Audio API for synthesized sounds
export class AudioManager {
  constructor() {
    this.audioContext = null;
    this.masterGain = null;
    this.sfxGain = null;
    this.musicGain = null;
    this.enabled = true;
    this.sfxEnabled = true;
    this.musicEnabled = true;
    this.musicOscillators = [];
    this.musicGainNodes = [];
    this.isPlayingMusic = false;

    this.initAudioContext();
  }

  initAudioContext() {
    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      this.masterGain = this.audioContext.createGain();
      this.sfxGain = this.audioContext.createGain();
      this.musicGain = this.audioContext.createGain();

      this.masterGain.connect(this.audioContext.destination);
      this.sfxGain.connect(this.masterGain);
      this.musicGain.connect(this.masterGain);

      this.setMasterVolume(0.5);
      this.setSfxVolume(0.6);
      this.setMusicVolume(0.3);
    } catch (e) {
      console.warn('Web Audio API not supported:', e);
      this.enabled = false;
    }
  }

  resume() {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
  }

  setMasterVolume(volume) {
    if (this.masterGain) {
      this.masterGain.gain.value = Math.max(0, Math.min(1, volume));
    }
  }

  setSfxVolume(volume) {
    if (this.sfxGain) {
      this.sfxGain.gain.value = Math.max(0, Math.min(1, volume));
    }
  }

  setMusicVolume(volume) {
    if (this.musicGain) {
      this.musicGain.gain.value = Math.max(0, Math.min(1, volume));
    }
  }

  toggleSfx(enabled) {
    this.sfxEnabled = enabled;
  }

  toggleMusic(enabled) {
    this.musicEnabled = enabled;
    if (!enabled) {
      this.stopMusic();
    } else if (this.isPlayingMusic) {
      this.playMusic();
    }
  }

  toggleMaster(enabled) {
    this.enabled = enabled;
    if (!enabled) {
      this.stopMusic();
    }
  }

  // Synthesized sound effects
  playTone(frequency, duration, type = 'sine', volume = 0.3, frequencyEnd = null) {
    if (!this.enabled || !this.sfxEnabled || !this.audioContext) return;

    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();

    osc.type = type;
    osc.frequency.value = frequency;
    if (frequencyEnd) {
      osc.frequency.exponentialRampToValueAtTime(frequencyEnd, this.audioContext.currentTime + duration);
    }

    gain.gain.value = volume;
    gain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start();
    osc.stop(this.audioContext.currentTime + duration);
  }

  playNoise(duration, volume = 0.2, filterFreq = 2000) {
    if (!this.enabled || !this.sfxEnabled || !this.audioContext) return;

    const bufferSize = this.audioContext.sampleRate * duration;
    const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 2);
    }

    const source = this.audioContext.createBufferSource();
    const gain = this.audioContext.createGain();
    const filter = this.audioContext.createBiquadFilter();

    source.buffer = buffer;
    filter.type = 'lowpass';
    filter.frequency.value = filterFreq;

    gain.gain.value = volume;
    gain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    source.start();
    source.stop(this.audioContext.currentTime + duration);
  }

  // Specific game sounds
  playBounce(paddleHit = false) {
    if (paddleHit) {
      // Paddle hit - richer tone
      this.playTone(220, 0.1, 'square', 0.4, 110);
      this.playTone(440, 0.05, 'sine', 0.2);
    } else {
      // Wall/brick hit
      this.playTone(660, 0.08, 'triangle', 0.3, 1320);
    }
  }

  playBrickDestroy(brickType = 'standard') {
    const tones = {
      standard: [523, 784, 1047],
      reinforced: [349, 523, 698],
      special: [659, 988, 1319, 1976],
      indestructible: [150, 100]
    };
    const seq = tones[brickType] || tones.standard;
    seq.forEach((freq, i) => {
      setTimeout(() => this.playTone(freq, 0.08, 'square', 0.25), i * 30);
    });
  }

  playPowerUpSpawn() {
    this.playTone(440, 0.1, 'sine', 0.3, 880);
    this.playTone(660, 0.15, 'triangle', 0.2, 1320);
  }

  playPowerUpCollect() {
    this.playTone(880, 0.05, 'sine', 0.4, 1760);
    this.playTone(1320, 0.1, 'triangle', 0.3, 2640);
    this.playTone(1760, 0.15, 'square', 0.2, 3520);
  }

  playLifeLost() {
    this.playTone(330, 0.2, 'sawtooth', 0.4, 80);
    this.playTone(220, 0.4, 'sine', 0.3, 60);
    this.playNoise(0.5, 0.15, 500);
  }

  playLevelComplete() {
    const melody = [523, 659, 784, 1047, 1319, 1568];
    melody.forEach((freq, i) => {
      setTimeout(() => this.playTone(freq, 0.15, 'sine', 0.3), i * 100);
    });
  }

  playGameOver() {
    this.playTone(220, 0.5, 'sawtooth', 0.4, 60);
    this.playTone(165, 0.8, 'sine', 0.3, 40);
  }

  playLaunch() {
    this.playTone(440, 0.05, 'square', 0.4, 880);
    this.playTone(880, 0.1, 'sine', 0.3, 1760);
  }

  // Background music - ambient synth
  playMusic() {
    if (!this.enabled || !this.musicEnabled || !this.audioContext || this.isPlayingMusic) return;
    this.isPlayingMusic = true;

    // Stop any existing music
    this.stopMusic();

    const chords = [
      [130.81, 196.00, 261.63], // C minor
      [138.59, 207.65, 277.18], // C# minor
      [164.81, 246.94, 329.63], // E minor
      [174.61, 261.63, 349.23]  // F minor
    ];

    let chordIndex = 0;
    const playChord = () => {
      if (!this.isPlayingMusic || !this.musicEnabled) return;

      const chord = chords[chordIndex % chords.length];
      chordIndex = (chordIndex + 1) % chords.length;

      chord.forEach((freq, i) => {
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        const filter = this.audioContext.createBiquadFilter();

        osc.type = 'sine';
        osc.frequency.value = freq;
        filter.type = 'lowpass';
        filter.frequency.value = 800;
        filter.Q.value = 2;

        gain.gain.value = 0;
        gain.gain.linearRampToValueAtTime(0.02, this.audioContext.currentTime + 2);
        gain.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + 8);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.musicGain);

        osc.start();
        osc.stop(this.audioContext.currentTime + 10);

        this.musicOscillators.push(osc);
        this.musicGainNodes.push(gain);
      });

      // Schedule next chord
      setTimeout(playChord, 8000);
    };

    playChord();
  }

  stopMusic() {
    this.isPlayingMusic = false;
    this.musicOscillators.forEach(osc => {
      try { osc.stop(); } catch (e) {}
    });
    this.musicOscillators = [];
    this.musicGainNodes = [];
  }

  // Cleanup
  dispose() {
    this.stopMusic();
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }
}

// Singleton instance
export const audioManager = new AudioManager();