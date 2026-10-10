import { useCallback, useState } from 'react';
import { POSE_PROMPTS } from '../lib/posePrompts';

export interface PosePromptApi {
  /** The prompt to display right now. */
  pose: string;
  /** Move to the next prompt (next tick / next shot). */
  advance: () => void;
  /** Jump to a random prompt when a new capture session starts. */
  restart: () => void;
}

/**
 * Prompt rotation: starts at the first prompt and advances one step per tick
 * or shot; each new session restarts at a random index (chosen in the
 * start-capture handler, not during render, to keep rendering pure).
 */
export const usePosePrompt = (): PosePromptApi => {
  const [poseIndex, setPoseIndex] = useState(0);

  const pose = POSE_PROMPTS[poseIndex];

  const advance = useCallback(() => {
    setPoseIndex((current) => (current + 1) % POSE_PROMPTS.length);
  }, []);

  const restart = useCallback(() => {
    setPoseIndex(Math.floor(Math.random() * POSE_PROMPTS.length));
  }, []);

  return { pose, advance, restart };
};
