import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

/** Boot sequence: the ensō draws itself in one stroke, then the wordmark
 * settles below it. Plays on every load — deliberately not gated behind
 * storage, so it's never in doubt whether it ran. Skipped entirely for
 * prefers-reduced-motion. */
export function IntroSplash({ onDone }: { onDone: () => void }) {
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) {
      onDone();
      return;
    }
    const t1 = setTimeout(() => setExiting(true), 2300);
    const t2 = setTimeout(onDone, 2700);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <motion.div
      animate={{ opacity: exiting ? 0 : 1 }}
      transition={{ duration: 0.4, ease: 'easeInOut' }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-5 bg-void"
    >
      <svg width={96} height={96} viewBox="0 0 44 44" fill="none">
        <defs>
          <linearGradient id="intro-enso" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#8FE3FF" />
            <stop offset="55%" stopColor="#5FCBEE" />
            <stop offset="100%" stopColor="#FF8A5C" />
          </linearGradient>
        </defs>
        <motion.circle
          cx={22}
          cy={22}
          r={15}
          fill="none"
          stroke="url(#intro-enso)"
          strokeWidth={2.4}
          strokeLinecap="round"
          strokeDasharray="73.5 21"
          transform="rotate(-100 22 22)"
          initial={{ strokeDashoffset: 73.5 }}
          animate={{ strokeDashoffset: 0 }}
          transition={{ duration: 1.1, ease: 'easeInOut' }}
        />
        <motion.circle
          cx={7.3}
          cy={19.8}
          r={1.3}
          fill="#FF8A5C"
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 0.85, scale: 1 }}
          transition={{ duration: 0.3, delay: 1.0 }}
        />
      </svg>
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.3, duration: 0.5 }}
        className="font-display text-[24px] tracking-[3px] text-text-hi"
        style={{ textShadow: '0 0 20px rgba(95,203,238,0.35)' }}
      >
        WINTER ARC
      </motion.div>
    </motion.div>
  );
}
