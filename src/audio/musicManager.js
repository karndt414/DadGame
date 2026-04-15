class MusicManager {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.timer = null;
    this.step = 0;
    this.started = false;
    this.startPromise = null;
    this.mood = "title";
    this.currentTrack = null;
    this.currentTrackBaseVolume = null;
    this.sfxLastAt = {};
    this.usingAssetTracks = true;
    this.masterBaseGain = 0.17;
    this.videoDuckFactor = 0.35;
    this.duckFactor = 1;
    this.trackConfig = {
      title: { path: "assets/audio/Flying-HighFinal.wav", volume: 0.42, startAt: 0 },
      zone1: { path: "assets/audio/Flying-HighFinal.wav", volume: 0.48, startAt: 0 },
      zone2: { path: "assets/audio/Two BirdsFinal.wav", volume: 0.48, startAt: 0 },
      zone3: { path: "assets/audio/FreefallFinal.wav", volume: 0.48, startAt: 0 },
      zone4: { path: "assets/audio/Into-DreamlandsFinal.wav", volume: 0.5, startAt: 0 },
      final: { path: "assets/audio/Into-DreamlandsFinal.wav", volume: 0.54, startAt: 52 }
    };
    this.arrangements = {
      title: {
        melody: [0, 2, 4, 7, 4, 2, 0, -3],
        chords: [0, 5, 7, 4],
        tempoMs: 268,
        heroLift: 2,
        leadWave: "triangle",
        leadGain: 0.082,
        counterGain: 0.032,
        harmonyGain: 0.024,
        hatGainMul: 0.72,
        snareGain: 0.014,
        arpWave: "sawtooth",
        arpOffsets: [0, 4, 7, 12],
        bassEvery: 2,
        padIntervals: [0, 4, 7],
        percPattern: [0.05, 0, 0.028, 0, 0.045, 0, 0.03, 0]
      },
      zone1: {
        melody: [0, 2, 4, 7, 9, 7, 4, 2],
        chords: [0, 5, 7, 9],
        tempoMs: 260,
        heroLift: 4,
        leadWave: "triangle",
        leadGain: 0.092,
        counterGain: 0.042,
        harmonyGain: 0.03,
        hatGainMul: 0.9,
        snareGain: 0.018,
        arpWave: "sawtooth",
        arpOffsets: [0, 4, 7, 12],
        bassEvery: 2,
        padIntervals: [0, 4, 7],
        percPattern: [0.06, 0.03, 0.04, 0.03, 0.055, 0.03, 0.04, 0.03]
      },
      zone2: {
        melody: [0, 3, 5, 8, 10, 8, 5, 3],
        chords: [0, 3, 8, 5],
        tempoMs: 246,
        heroLift: 3,
        leadWave: "square",
        leadGain: 0.08,
        counterGain: 0.046,
        harmonyGain: 0.033,
        hatGainMul: 0.95,
        snareGain: 0.02,
        arpWave: "triangle",
        arpOffsets: [0, 3, 7, 10],
        bassEvery: 1,
        padIntervals: [0, 3, 7],
        percPattern: [0.055, 0.022, 0.038, 0.022, 0.048, 0.022, 0.034, 0.022]
      },
      zone3: {
        melody: [0, 4, 7, 11, 7, 4, 2, -1],
        chords: [0, 7, 11, 4],
        tempoMs: 232,
        heroLift: 5,
        leadWave: "sawtooth",
        leadGain: 0.086,
        counterGain: 0.05,
        harmonyGain: 0.035,
        hatGainMul: 1.0,
        snareGain: 0.022,
        arpWave: "square",
        arpOffsets: [0, 7, 11, 14],
        bassEvery: 1,
        padIntervals: [0, 4, 7],
        percPattern: [0.058, 0.03, 0.044, 0.026, 0.053, 0.03, 0.044, 0.026]
      },
      zone4: {
        melody: [0, 1, 5, 8, 5, 3, 1, -2],
        chords: [0, 1, 5, 8],
        tempoMs: 222,
        heroLift: 4,
        leadWave: "triangle",
        leadGain: 0.094,
        counterGain: 0.052,
        harmonyGain: 0.038,
        hatGainMul: 1.05,
        snareGain: 0.023,
        arpWave: "sawtooth",
        arpOffsets: [0, 3, 7, 10],
        bassEvery: 1,
        padIntervals: [0, 3, 7],
        percPattern: [0.062, 0.032, 0.05, 0.032, 0.058, 0.032, 0.05, 0.032]
      },
      final: {
        melody: [0, 3, 7, 10, 12, 10, 7, 3],
        chords: [0, 3, 10, 7],
        tempoMs: 208,
        heroLift: 7,
        leadWave: "sawtooth",
        leadGain: 0.1,
        counterGain: 0.058,
        harmonyGain: 0.043,
        hatGainMul: 1.15,
        snareGain: 0.027,
        arpWave: "square",
        arpOffsets: [0, 3, 7, 12],
        bassEvery: 1,
        padIntervals: [0, 3, 7],
        percPattern: [0.07, 0.036, 0.058, 0.036, 0.07, 0.04, 0.06, 0.04]
      }
    };
  }

  startTimer(intervalMs) {
    if (this.timer) {
      window.clearInterval(this.timer);
    }
    this.timer = window.setInterval(() => this.playStep(), intervalMs);
  }

  ensureContext() {
    if (this.ctx) {
      this.applyOutputVolume();
      return;
    }
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) {
      return;
    }
    this.ctx = new AudioCtx();
    this.master = this.ctx.createGain();
    this.master.gain.value = this.masterBaseGain;
    this.master.connect(this.ctx.destination);
    this.applyOutputVolume();
  }

  async safeResumeContext() {
    if (!this.ctx || this.ctx.state !== "suspended") {
      return true;
    }

    try {
      await this.ctx.resume();
      return true;
    } catch {
      return false;
    }
  }

  applyOutputVolume() {
    if (this.master) {
      this.master.gain.value = this.masterBaseGain * this.duckFactor;
    }
    if (this.currentTrack) {
      this.currentTrack.volume = (this.currentTrackBaseVolume ?? 0.5) * this.duckFactor;
    }
  }

  setVideoDuck(active) {
    this.duckFactor = active ? this.videoDuckFactor : 1;
    this.applyOutputVolume();
  }

  async tryStart() {
    if (this.startPromise) {
      return this.startPromise;
    }

    this.startPromise = (async () => {
      this.ensureContext();
      if (!this.ctx || !this.master) {
        return false;
      }

      if (!(await this.safeResumeContext())) {
        return false;
      }

      if (this.started) {
        return true;
      }
      this.started = true;
      this.step = 0;
      if (this.usingAssetTracks) {
        const startedTrack = await this.playTrackForMood(this.mood);
        if (!startedTrack) {
          const arrangement = this.arrangements[this.mood] || this.arrangements.title;
          this.startTimer(arrangement.tempoMs || 260);
        }
        return true;
      }

      const arrangement = this.arrangements[this.mood] || this.arrangements.title;
      this.startTimer(arrangement.tempoMs || 260);
      return true;
    })();

    try {
      return await this.startPromise;
    } finally {
      this.startPromise = null;
    }
  }

  setMood(mood) {
    if (this.arrangements[mood]) {
      this.mood = mood;
      this.step = 0;
      this.playMoodStinger(mood);
      if (this.started) {
        if (this.usingAssetTracks) {
          this.playTrackForMood(mood).then((startedTrack) => {
            if (!startedTrack) {
              this.startTimer(this.arrangements[mood].tempoMs || 260);
            }
          });
          return;
        }

        this.startTimer(this.arrangements[mood].tempoMs || 260);
      }
    }
  }

  stopCurrentTrack() {
    if (!this.currentTrack) {
      return;
    }
    this.currentTrack.pause();
    this.currentTrack.src = "";
    this.currentTrack = null;
    this.currentTrackBaseVolume = null;
  }

  stopAll({ resetStarted = false } = {}) {
    if (this.timer) {
      window.clearInterval(this.timer);
      this.timer = null;
    }
    this.stopCurrentTrack();
    if (resetStarted) {
      this.started = false;
    }
  }

  async playTrackForMood(mood) {
    const config = this.trackConfig[mood];
    if (!config?.path) {
      this.stopCurrentTrack();
      return false;
    }

    this.stopCurrentTrack();
    if (this.timer) {
      window.clearInterval(this.timer);
      this.timer = null;
    }

    const track = new Audio(`/${encodeURI(config.path)}`);
    track.loop = true;
    this.currentTrackBaseVolume = config.volume ?? 0.5;
    track.volume = this.currentTrackBaseVolume * this.duckFactor;
    track.preload = "auto";
    track.playsInline = true;

    try {
      const seekTo = () => {
        if ((config.startAt || 0) > 0) {
          try {
            track.currentTime = config.startAt;
          } catch {
            // Ignore seek errors before metadata is fully ready.
          }
        }
      };

      if (track.readyState >= 1) {
        seekTo();
      } else {
        track.addEventListener("loadedmetadata", seekTo, { once: true });
      }

      await track.play();
      this.currentTrack = track;
      this.applyOutputVolume();
      return true;
    } catch {
      this.currentTrack = null;
      this.currentTrackBaseVolume = null;
      return false;
    }
  }

  playMoodStinger(mood) {
    this.ensureContext();
    if (!this.ctx || !this.master) {
      return;
    }

    const roots = {
      title: 0,
      zone1: 0,
      zone2: 3,
      zone3: 7,
      zone4: 1,
      final: 10
    };
    const root = roots[mood] ?? 0;
    const now = this.ctx.currentTime;
    const tones = [0, 4, 7, 12];
    tones.forEach((interval, idx) => {
      this.playNote(196 * 2 ** ((root + interval) / 12), now + idx * 0.05, 0.18, "triangle", 0.032, 0.01, 0.1);
    });
  }

  playCelebration() {
    this.ensureContext();
    if (!this.ctx || !this.master) {
      return;
    }
    void this.safeResumeContext();

    const now = this.ctx.currentTime;
    const notes = [0, 4, 7, 12];
    notes.forEach((semitone, idx) => {
      this.playNote(392 * 2 ** (semitone / 12), now + idx * 0.06, 0.22, "triangle", 0.07, 0.01, 0.12);
    });
    this.playNote(196, now, 0.3, "sine", 0.04, 0.01, 0.16);
  }

  playSfx(name, options = {}) {
    this.ensureContext();
    if (!this.ctx || !this.master) {
      return;
    }

    const nowMs = performance.now();
    const throttleMs = options.throttleMs ?? 70;
    const last = this.sfxLastAt[name] || 0;
    if (nowMs - last < throttleMs) {
      return;
    }
    this.sfxLastAt[name] = nowMs;

    void this.safeResumeContext();

    const now = this.ctx.currentTime;
    const vol = options.gain ?? 0.05;
    const pitch = options.pitch ?? 1;

    switch (name) {
      case "slash":
        this.playNote(560 * pitch, now, 0.08, "sawtooth", vol, 0.004, 0.04);
        this.playNote(340 * pitch, now + 0.015, 0.07, "triangle", vol * 0.7, 0.004, 0.05);
        break;
      case "shoot":
        this.playNote(820 * pitch, now, 0.07, "square", vol * 0.95, 0.002, 0.03);
        break;
      case "dodge":
        this.playNote(320 * pitch, now, 0.12, "triangle", vol, 0.003, 0.07);
        this.playNote(520 * pitch, now + 0.02, 0.1, "sine", vol * 0.65, 0.003, 0.06);
        break;
      case "special":
        this.playNote(250 * pitch, now, 0.16, "sawtooth", vol * 1.2, 0.002, 0.1);
        this.playNote(480 * pitch, now + 0.03, 0.14, "triangle", vol, 0.003, 0.1);
        break;
      case "enemyShoot":
        this.playNote(430 * pitch, now, 0.07, "square", vol * 0.8, 0.003, 0.04);
        break;
      case "enemyHit":
        this.playNote(220 * pitch, now, 0.06, "triangle", vol * 0.8, 0.002, 0.03);
        break;
      case "enemyDown":
        this.playNote(280 * pitch, now, 0.09, "square", vol, 0.002, 0.05);
        this.playNote(170 * pitch, now + 0.03, 0.12, "triangle", vol * 0.8, 0.002, 0.08);
        break;
      case "pickup":
        this.playNote(720 * pitch, now, 0.08, "sine", vol * 0.9, 0.003, 0.04);
        this.playNote(920 * pitch, now + 0.04, 0.1, "triangle", vol * 0.8, 0.003, 0.06);
        break;
      case "secret":
        this.playNote(660 * pitch, now, 0.12, "sine", vol, 0.004, 0.08);
        this.playNote(990 * pitch, now + 0.06, 0.14, "triangle", vol * 0.85, 0.004, 0.08);
        break;
      case "hurt":
        this.playNote(180 * pitch, now, 0.12, "sawtooth", vol, 0.002, 0.05);
        break;
      case "shield":
        this.playNote(540 * pitch, now, 0.1, "sine", vol * 0.85, 0.002, 0.06);
        break;
      case "interact":
        this.playNote(460 * pitch, now, 0.06, "triangle", vol * 0.75, 0.002, 0.03);
        break;
      case "footstep":
        this.playNote(130 * pitch, now, 0.045, "triangle", vol * 0.6, 0.002, 0.025);
        this.playNote(90 * pitch, now + 0.01, 0.04, "sine", vol * 0.45, 0.002, 0.025);
        break;
      case "bossDash":
        this.playNote(150 * pitch, now, 0.18, "sawtooth", vol * 1.2, 0.002, 0.08);
        break;
      case "bossPulse":
        this.playNote(220 * pitch, now, 0.2, "triangle", vol, 0.005, 0.1);
        this.playNote(120 * pitch, now, 0.22, "sine", vol * 0.6, 0.005, 0.12);
        break;
      case "uiConfirm":
        this.playNote(600 * pitch, now, 0.08, "triangle", vol * 0.8, 0.003, 0.04);
        break;
      default:
        this.playNote(400 * pitch, now, 0.08, "triangle", vol * 0.7, 0.002, 0.04);
    }
  }

  playStep() {
    if (this.currentTrack) {
      return;
    }

    if (!this.ctx || !this.master) {
      return;
    }

    const arrangement = this.arrangements[this.mood] || this.arrangements.title;
    const phraseStep = this.step % 16;
    const phraseIndex = Math.floor(this.step / 16) % 8;
    const chordRoot = arrangement.chords[Math.floor(this.step / 4) % arrangement.chords.length];
    const leadPattern = [1, 0.8, 0, 0.72, 1, 0.8, 0, 0.74, 1, 0.86, 0.5, 0.78, 1, 0.82, 0.58, 0.9];
    const hatPattern = [0.02, 0.014, 0.017, 0.013, 0.021, 0.014, 0.018, 0.013, 0.02, 0.015, 0.017, 0.013, 0.022, 0.014, 0.02, 0.015];
    const snareHits = [2, 6, 10, 14];
    const swing = this.step % 2 === 1 ? 0.008 : 0;
    const now = this.ctx.currentTime + swing;

    let semitone = arrangement.melody[(phraseStep + (phraseIndex % 2 === 1 ? 1 : 0)) % arrangement.melody.length];
    if (phraseIndex % 4 === 2 && phraseStep % 4 === 0) {
      semitone += arrangement.heroLift || 2;
    }
    if (phraseIndex % 8 === 7 && phraseStep >= 12) {
      semitone += 12;
    }

    // Lead melody.
    const leadGate = leadPattern[phraseStep];
    if (leadGate > 0.01) {
      const leadLength = phraseStep % 4 === 3 ? 0.26 : 0.2;
      this.playNote(220 * 2 ** (semitone / 12), now, leadLength, arrangement.leadWave, arrangement.leadGain * leadGate, 0.01, 0.15);
    }

    // Mid arpeggio for fullness.
    const arp = arrangement.arpOffsets[this.step % arrangement.arpOffsets.length];
    this.playNote(146.83 * 2 ** ((chordRoot + arp) / 12), now, 0.16, arrangement.arpWave, 0.04, 0.003, 0.08);

    // Counter melody adds a heroic call-and-response feel.
    if (phraseStep % 2 === 1) {
      const counterJump = phraseStep % 4 === 1 ? 12 : 7;
      const counterSemitone = semitone + counterJump;
      this.playNote(220 * 2 ** (counterSemitone / 12), now, 0.13, "triangle", arrangement.counterGain || 0.05, 0.005, 0.08);
    }

    // Heroic harmony stabs at phrase accents.
    if (phraseStep % 4 === 0) {
      this.playNote(220 * 2 ** ((semitone + 4) / 12), now, 0.17, "sine", arrangement.harmonyGain || 0.038, 0.01, 0.1);
    }

    // Bass pulse.
    if (this.step % arrangement.bassEvery === 0) {
      this.playNote(73.41 * 2 ** (chordRoot / 12), now, 0.24, "square", 0.06, 0.002, 0.07);
      if (phraseStep % 8 === 0) {
        this.playNote(55 * 2 ** (chordRoot / 12), now, 0.3, "triangle", 0.028, 0.01, 0.12);
      }
    }

    // Soft pad chord every beat group.
    if (this.step % 4 === 0) {
      this.playPadChord(chordRoot, now, arrangement.padIntervals);
    }

    // Pattern-driven percussion gives each level a distinct groove.
    const percGain = arrangement.percPattern[this.step % arrangement.percPattern.length] || 0;
    if (percGain > 0.001) {
      this.playPerc(now, percGain);
    }

    // Bright rhythmic hats and snare-style accents for adventure momentum.
    this.playHat(now, hatPattern[phraseStep] * (arrangement.hatGainMul || 1));
    if (snareHits.includes(phraseStep)) {
      this.playSnare(now, arrangement.snareGain || 0.022);
    }

    // Drum fill at the end of each long phrase to avoid loop fatigue.
    if (phraseStep >= 12 && phraseIndex % 4 === 3) {
      this.playTom(now, 0.02 + (phraseStep - 12) * 0.005, 160 - (phraseStep - 12) * 18);
    }

    this.step += 1;
  }

  playPadChord(root, start, intervals = [0, 4, 7]) {
    const tones = intervals.map((interval) => 130.81 * 2 ** ((root + interval) / 12));
    tones.forEach((freq, idx) => {
      this.playNote(freq, start + idx * 0.015, 0.72, "sine", 0.022, 0.08, 0.2);
    });
  }

  playPerc(start, gainAmount) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(120, start);
    osc.frequency.exponentialRampToValueAtTime(48, start + 0.11);

    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(gainAmount, start + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.12);

    osc.connect(gain);
    gain.connect(this.master);
    osc.start(start);
    osc.stop(start + 0.14);
  }

  playHat(start, gainAmount) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "square";
    osc.frequency.setValueAtTime(1800, start);
    osc.frequency.exponentialRampToValueAtTime(900, start + 0.04);

    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(gainAmount, start + 0.004);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.045);

    osc.connect(gain);
    gain.connect(this.master);
    osc.start(start);
    osc.stop(start + 0.05);
  }

  playSnare(start, gainAmount) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(420, start);
    osc.frequency.exponentialRampToValueAtTime(210, start + 0.08);

    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(gainAmount, start + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.09);

    osc.connect(gain);
    gain.connect(this.master);
    osc.start(start);
    osc.stop(start + 0.1);
  }

  playTom(start, gainAmount, freq) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, start);
    osc.frequency.exponentialRampToValueAtTime(Math.max(62, freq * 0.62), start + 0.1);

    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(gainAmount, start + 0.006);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.11);

    osc.connect(gain);
    gain.connect(this.master);
    osc.start(start);
    osc.stop(start + 0.12);
  }

  playNote(freq, start, length, type, gainAmount, attack = 0.03, release = 0.03) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = type;
    osc.frequency.value = freq;

    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(gainAmount, start + attack);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + length);

    osc.connect(gain);
    gain.connect(this.master);

    osc.start(start);
    osc.stop(start + length + release);
  }
}

export const musicManager = new MusicManager();
