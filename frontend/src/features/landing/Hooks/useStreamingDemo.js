import { useCallback, useEffect, useState } from 'react';
import { prefersReducedMotion } from '../../../shared/animations/motion.js';

/**
 * The pretend answer in the landing page's preview card. Each block is a
 * paragraph or a numbered item; we stream it one word at a time, just like
 * the real chat does with tokens.
 */
export const DEMO_QUESTION = 'Help me plan a calm Sunday morning';
export const DEMO_ANSWER = Object.freeze([
  { kind: 'p', text: 'Here is an unhurried plan: no alarms, and nothing urgent before noon.' },
  { kind: 'li', n: '01', title: 'Slow pour.', text: 'Coffee or tea by the window, with your phone in another room.' },
  { kind: 'li', n: '02', title: 'A short walk.', text: 'Thirty minutes around the block. No destination, no podcast.' },
  { kind: 'li', n: '03', title: 'Real pages.', text: 'Ten pages of a paper book, and a notebook for stray thoughts.' },
]);

const blocks = DEMO_ANSWER.map((block) => ({
  ...block,
  titleWords: block.title ? block.title.split(' ') : [],
  words: block.text.split(' '),
}));
const TOTAL = blocks.reduce((sum, b) => sum + b.titleWords.length + b.words.length, 0);

const THINK_MS = 1400; // the "thinking" pause before the first word
const WORD_MS = 70; // one word every 70 ms
const REST_MS = 5200; // pause on the finished answer before replaying

/**
 * Drives the streaming demo.
 * status: 'thinking' → 'streaming' → 'done' (auto-replays), or 'stopped' if
 * the visitor presses Stop (stays put until they press Replay).
 *
 * @returns {{
 *   blocks: typeof blocks, shown: number,
 *   status: 'thinking' | 'streaming' | 'stopped' | 'done',
 *   stop: () => void, replay: () => void,
 * }}
 */
export function useStreamingDemo() {
  const [still] = useState(prefersReducedMotion);
  const [shown, setShown] = useState(still ? TOTAL : 0);
  const [status, setStatus] = useState(still ? 'done' : 'thinking');

  useEffect(() => {
    if (still) return undefined;
    let timer;
    if (status === 'thinking') {
      timer = window.setTimeout(() => setStatus('streaming'), THINK_MS);
    } else if (status === 'streaming') {
      timer = window.setInterval(() => {
        setShown((count) => {
          if (count + 1 >= TOTAL) setStatus('done');
          return Math.min(count + 1, TOTAL);
        });
      }, WORD_MS);
      return () => window.clearInterval(timer);
    } else if (status === 'done') {
      timer = window.setTimeout(() => {
        setShown(0);
        setStatus('thinking');
      }, REST_MS);
    }
    return () => window.clearTimeout(timer);
  }, [status, still]);

  const stop = useCallback(() => setStatus('stopped'), []);
  const replay = useCallback(() => {
    setShown(0);
    setStatus(still ? 'done' : 'thinking');
    if (still) setShown(TOTAL);
  }, [still]);

  return { blocks, shown, status, stop, replay };
}
