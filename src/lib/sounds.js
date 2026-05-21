export function playUnlockSound({
  //src = '/sounds/unlock.wav',
  src = null,
  notes = [523.25, 659.25, 783.99],
  spacing = 0.1,
  gain = 0.18,
  decay = 0.35,
  type = 'sine',
} = {}) {
  if (src) {
    const audio = new Audio(src);
    audio.play().catch(e => console.warn('[Sound] Playback failed:', e));
    return;
  }

  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return;

  const ctx = new AudioContext();
  const now = ctx.currentTime;

  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc.type = type;
    osc.frequency.setValueAtTime(freq, now + i * spacing);

    gainNode.gain.setValueAtTime(gain, now + i * spacing);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + i * spacing + decay);

    osc.start(now + i * spacing);
    osc.stop(now + i * spacing + decay);
  });
}

export function playLockSound({
  '/sounds/lock.wav',
  //src = null,
  notes = [783.99, 659.25, 523.25],
  spacing = 0.1,
  gain = 0.18,
  decay = 0.35,
  type = 'sine',
} = {}) {
  if (src) {
    const audio = new Audio(src);
    audio.play().catch(e => console.warn('[Sound] Playback failed:', e));
    return;
  }

  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return;

  const ctx = new AudioContext();
  const now = ctx.currentTime;

  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc.type = type;
    osc.frequency.setValueAtTime(freq, now + i * spacing);

    gainNode.gain.setValueAtTime(gain, now + i * spacing);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + i * spacing + decay);

    osc.start(now + i * spacing);
    osc.stop(now + i * spacing + decay);
  });
}