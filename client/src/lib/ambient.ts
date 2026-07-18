/**
 * UNICORN FOREST — ambient signals
 * A tiny shared pub/sub for cross-component atmosphere:
 *  - music state (playing + tempo) so the fireflies can breathe with the song
 *  - a Web Audio chime synth for zone materialization (no audio asset needed)
 *
 * The YouTube IFrame API exposes no audio analysis data (cross-origin), so the
 * fireflies sync to a gentle musical pulse (default ~72 BPM heartbeat) that
 * starts/stops exactly with playback — poetic rather than spectral.
 */

// ---------- music state signal ----------
export interface MusicState {
  playing: boolean;
  /** beats per minute of the visual pulse while playing */
  bpm: number;
  /** epoch ms when playback last started — anchors the beat phase */
  startedAt: number;
}

const musicState: MusicState = { playing: false, bpm: 72, startedAt: 0 };
type Listener = (s: MusicState) => void;
const listeners = new Set<Listener>();

export function setMusicPlaying(playing: boolean, bpm = 72) {
  musicState.playing = playing;
  musicState.bpm = bpm;
  if (playing) musicState.startedAt = Date.now();
  listeners.forEach((l) => l(musicState));
}

export function getMusicState(): MusicState {
  return musicState;
}

export function subscribeMusic(l: Listener): () => void {
  listeners.add(l);
  return () => listeners.delete(l);
}

// ---------- materialization chime ----------
let audioCtx: AudioContext | null = null;

function ctx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return null;
  if (!audioCtx) audioCtx = new AC();
  if (audioCtx.state === "suspended") void audioCtx.resume();
  return audioCtx;
}

/**
 * A soft, magical two-note bell — sine partials with a shimmering fifth,
 * gentle attack, long airy decay. Volume kept low to stay under the music.
 */
export function playMaterializeChime() {
  const ac = ctx();
  if (!ac) return;
  const now = ac.currentTime;

  const master = ac.createGain();
  master.gain.value = 0.0001;
  master.connect(ac.destination);
  // gentle swell in, long fade out
  master.gain.exponentialRampToValueAtTime(0.12, now + 0.04);
  master.gain.exponentialRampToValueAtTime(0.0001, now + 2.8);

  // bell partials: fundamental + detuned octave + airy twelfth
  const notes = [
    { f: 1046.5, t: 0, dur: 2.6, g: 1.0 }, // C6
    { f: 1568.0, t: 0.18, dur: 2.2, g: 0.45 }, // G6 — the answering shimmer
    { f: 2093.0, t: 0.02, dur: 1.4, g: 0.18 }, // C7 sparkle
  ];

  for (const n of notes) {
    const osc = ac.createOscillator();
    const g = ac.createGain();
    osc.type = "sine";
    osc.frequency.value = n.f;
    // slight upward glide gives the "materialize" feel
    osc.frequency.setValueAtTime(n.f * 0.985, now + n.t);
    osc.frequency.exponentialRampToValueAtTime(n.f, now + n.t + 0.25);
    g.gain.value = 0.0001;
    g.gain.setValueAtTime(0.0001, now + n.t);
    g.gain.exponentialRampToValueAtTime(n.g, now + n.t + 0.06);
    g.gain.exponentialRampToValueAtTime(0.0001, now + n.t + n.dur);
    osc.connect(g);
    g.connect(master);
    osc.start(now + n.t);
    osc.stop(now + n.t + n.dur + 0.1);
  }
}
