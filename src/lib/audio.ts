/**
 * Web Audio cue synthesis — beep, shutter click, printer whirr — with zero
 * asset files. Audio is polish, never a failure path: every entry point is
 * guarded and every builder is wrapped, so a missing Web Audio API, a
 * suspended context, or an engine that throws simply means silence.
 *
 * Lifecycle: the AudioContext is a lazy module singleton created only inside
 * primeAudio(), which must run in a user-gesture call stack (autoplay
 * policy). It is NEVER created or closed in a React effect — StrictMode's
 * dev double-mount would otherwise permanently close the context.
 */

export type AudioCueName = 'beep' | 'beepFinal' | 'shutter' | 'print';

/** Master loudness for every cue — a future volume control is one line here. */
const MASTER_GAIN = 0.9;

/** Length of the printer whirr, matching the eject animation's slide window. */
const PRINT_CUE_DURATION_MS = 1400;

let context: AudioContext | null = null;
let masterGain: GainNode | null = null;
let noiseBuffer: AudioBuffer | null = null;

const getAudioContextCtor = (): typeof AudioContext | null => {
  if (typeof AudioContext !== 'undefined') return AudioContext;
  // Older Safari. The DOM lib has no type for it — cast through unknown.
  const webkit = (globalThis as { webkitAudioContext?: unknown }).webkitAudioContext;
  return typeof webkit === 'function' ? (webkit as typeof AudioContext) : null;
};

const createNoiseBuffer = (audio: AudioContext): AudioBuffer => {
  const buffer = audio.createBuffer(1, audio.sampleRate, audio.sampleRate);
  const data = buffer.getChannelData(0);
  for (let index = 0; index < data.length; index += 1) {
    data[index] = Math.random() * 2 - 1;
  }
  return buffer;
};

/** Create/resume the singleton context. Call inside a user-gesture handler. */
export const primeAudio = (): void => {
  try {
    const Ctor = getAudioContextCtor();
    if (!Ctor) return;
    if (!context) {
      context = new Ctor();
      masterGain = context.createGain();
      masterGain.gain.value = MASTER_GAIN;
      masterGain.connect(context.destination);
      noiseBuffer = createNoiseBuffer(context);
    }
    if (context.state === 'suspended') {
      void context.resume().catch(() => {
        /* Stay silent until the next gesture. */
      });
    }
  } catch {
    context = null;
    masterGain = null;
    noiseBuffer = null;
  }
};

const isReady = (): boolean =>
  context !== null && masterGain !== null && noiseBuffer !== null && context.state === 'running';

/** One enveloped sine blip. Never ramp exponential gains to exactly 0. */
const playTone = (frequency: number, peak: number, startOffset: number, duration: number) => {
  const audio = context!;
  const master = masterGain!;
  const start = audio.currentTime + startOffset;

  const oscillator = audio.createOscillator();
  oscillator.type = 'sine';
  oscillator.frequency.value = frequency;

  const gain = audio.createGain();
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(peak, start + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);

  oscillator.connect(gain).connect(master);
  oscillator.start(start);
  oscillator.stop(start + duration + 0.05);
};

/** Filtered burst from the shared noise buffer — clicks, snaps, hiss. */
const playNoise = (
  filterType: BiquadFilterType,
  frequency: number,
  peak: number,
  startOffset: number,
  duration: number,
) => {
  const audio = context!;
  const master = masterGain!;
  const start = audio.currentTime + startOffset;

  const source = audio.createBufferSource();
  source.buffer = noiseBuffer!;

  const filter = audio.createBiquadFilter();
  filter.type = filterType;
  filter.frequency.value = frequency;

  const gain = audio.createGain();
  gain.gain.setValueAtTime(peak, start);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);

  source.connect(filter).connect(gain).connect(master);
  source.start(start);
  source.stop(start + duration + 0.05);
};

/** Mechanical click (bandpass snap), body thock, and a soft mirror slap. */
const playShutter = () => {
  const audio = context!;
  const master = masterGain!;
  const start = audio.currentTime;

  const click = audio.createBufferSource();
  click.buffer = noiseBuffer!;
  const bandpass = audio.createBiquadFilter();
  bandpass.type = 'bandpass';
  bandpass.frequency.value = 2500;
  bandpass.Q.value = 0.8;
  const clickGain = audio.createGain();
  clickGain.gain.setValueAtTime(0.5, start);
  clickGain.gain.exponentialRampToValueAtTime(0.0001, start + 0.06);
  click.connect(bandpass).connect(clickGain).connect(master);
  click.start(start);
  click.stop(start + 0.1);

  playTone(180, 0.25, 0, 0.05);
  playNoise('highpass', 4000, 0.2, 0.07, 0.03);
};

/** Stepper-motor whirr (LFO-rattled sawtooth) plus faint paper-feed hiss. */
const playPrint = () => {
  const audio = context!;
  const master = masterGain!;
  const start = audio.currentTime;
  const duration = PRINT_CUE_DURATION_MS / 1000;

  const oscillator = audio.createOscillator();
  oscillator.type = 'sawtooth';
  oscillator.frequency.value = 110;

  const lowpass = audio.createBiquadFilter();
  lowpass.type = 'lowpass';
  lowpass.frequency.value = 500;

  const whirrGain = audio.createGain();
  whirrGain.gain.setValueAtTime(0.0001, start);
  whirrGain.gain.exponentialRampToValueAtTime(0.12, start + 0.08);
  whirrGain.gain.setValueAtTime(0.12, start + duration - 0.3);
  whirrGain.gain.exponentialRampToValueAtTime(0.0001, start + duration);

  // 22 Hz tremolo gives the whirr its stepper-motor rattle.
  const lfo = audio.createOscillator();
  lfo.type = 'sine';
  lfo.frequency.value = 22;
  const lfoGain = audio.createGain();
  lfoGain.gain.value = 0.06;
  lfo.connect(lfoGain).connect(whirrGain.gain);

  oscillator.connect(lowpass).connect(whirrGain).connect(master);
  oscillator.start(start);
  oscillator.stop(start + duration);
  lfo.start(start);
  lfo.stop(start + duration);

  playNoise('bandpass', 1200, 0.03, 0, duration);
};

/** Play one synth cue. No-op unless the context exists and is running. */
export const playCue = (cue: AudioCueName): void => {
  try {
    if (!isReady()) return;
    switch (cue) {
      case 'beep':
        playTone(880, 0.22, 0, 0.22);
        break;
      case 'beepFinal':
        // Rising two-note chime for the "Smile!" moment.
        playTone(880, 0.26, 0, 0.12);
        playTone(1174.66, 0.26, 0.13, 0.16);
        break;
      case 'shutter':
        playShutter();
        break;
      case 'print':
        playPrint();
        break;
    }
  } catch {
    /* Audio is polish — never a failure path. */
  }
};
