(() => {
  "use strict";

  const state = window.SDWX.state.state;
  const storage = window.SDWX.storage;
  let audioContext = null;

  function ensureAudio() {
    if (!state.soundOn) return;
    if (!audioContext) {
      const AudioCtor = window.AudioContext || window.webkitAudioContext;
      if (AudioCtor) audioContext = new AudioCtor();
    }
    if (audioContext && audioContext.state === "suspended") {
      audioContext.resume().catch(() => {});
    }
  }

  function tone(frequency, duration, volume, type = "sine", endFrequency = null, delay = 0) {
    if (!state.soundOn || !audioContext) return;
    const start = audioContext.currentTime + delay;
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, start);
    if (endFrequency) {
      oscillator.frequency.exponentialRampToValueAtTime(Math.max(20, endFrequency), start + duration);
    }
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(volume, start + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    oscillator.connect(gain);
    gain.connect(audioContext.destination);
    oscillator.start(start);
    oscillator.stop(start + duration + 0.04);
  }

  function playDropSound() {
    ensureAudio();
    tone(180, 0.1, 0.028, "triangle", 118);
  }

  function playMergeSound(level) {
    ensureAudio();
    const base = 260 + level * 48;
    tone(base, 0.17, 0.038, "sine", base * 1.25);
    tone(base * 1.5, 0.12, 0.022, "triangle", base * 1.8, 0.035);
  }

  function playFinalSound() {
    ensureAudio();
    [261.6, 329.6, 392, 523.2].forEach((frequency, index) => {
      tone(frequency, 0.36, 0.045, "triangle", frequency * 1.01, index * 0.055);
    });
    tone(95, 0.5, 0.055, "sine", 58);
  }

  function playGameOverSound() {
    ensureAudio();
    [330, 262, 196].forEach((frequency, index) => {
      tone(frequency, 0.24, 0.03, "sine", frequency * 0.95, index * 0.13);
    });
  }

  function toggleSound() {
    state.soundOn = !state.soundOn;
    storage.write("tripleMelonSound", state.soundOn ? "on" : "off");
    window.SDWX.hud.updateSoundButton();
    if (state.soundOn) {
      ensureAudio();
      tone(520, 0.09, 0.025, "sine");
    }
  }

  const SDWX = window.SDWX = window.SDWX || {};
  SDWX.audio = {
    ensureAudio,
    tone,
    playDropSound,
    playMergeSound,
    playFinalSound,
    playGameOverSound,
    toggleSound
  };
})();
