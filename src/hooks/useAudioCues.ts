import { useCallback, useRef, useState } from 'react';
import { playCue, primeAudio, type AudioCueName } from '../lib/audio';

export interface AudioCues {
  isMuted: boolean;
  /** Toggle mute. Primes the context first so unmute works in one gesture. */
  toggleMuted: () => void;
  /** Call at the top of gesture handlers so later cues are allowed to sound. */
  prime: () => void;
  /** Stable play function; skips every cue while muted. */
  play: (cue: AudioCueName) => void;
}

/**
 * Mute state + stable callbacks over the Web Audio synth in lib/audio.
 * The hook keeps no audio lifecycle of its own — the module singleton in
 * lib/audio is what survives StrictMode's double-mount.
 */
export const useAudioCues = (initialMuted: boolean): AudioCues => {
  const [isMuted, setIsMuted] = useState(initialMuted);
  // Mirror for the stable `play` closure, which must never go stale mid-session.
  const isMutedRef = useRef(initialMuted);

  const prime = useCallback(() => {
    primeAudio();
  }, []);

  const play = useCallback((cue: AudioCueName) => {
    if (isMutedRef.current) return;
    playCue(cue);
  }, []);

  const toggleMuted = useCallback(() => {
    primeAudio();
    const next = !isMutedRef.current;
    isMutedRef.current = next;
    setIsMuted(next);
  }, []);

  return { isMuted, toggleMuted, prime, play };
};
