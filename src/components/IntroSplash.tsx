import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

/** One-shot animated boot sequence — the seal draws itself in, then the
 * wordmark fades up. Plays once per browser tab (gated by sessionStorage in
 * App.tsx), and is skipped entirely for prefers-reduced-motion. */
export function IntroSplash({ onDone }: { onDone: () => void }) {
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) {
      onDone();
      return;
    }
    const t1 = setTimeout(() => setExiting(true), 1500);
    const t2 = setTimeout(onDone, 1900);
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
      className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-void"
    >
      <svg width={76} height={76} viewBox="0 0 44 44" fill="none">
        <defs>
          <linearGradient id="intro-ice" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#8FE3FF" />
            <stop offset="100%" stopColor="#3A9FBF" />
          </linearGradient>
          <linearGradient id="intro-ember" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#FF8A5C" />
            <stop offset="100%" stopColor="#B23A17" />
          </linearGradient>
          <radialGradient id="intro-core">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="100%" stopColor="#C7DAE3" />
          </radialGradient>
        </defs>

        <motion.path
          d="M22 2.5 L39.5 12 V32 L22 41.5 L4.5 32 V12 Z"
          fill="url(#intro-ice)"
          fillOpacity={0.06}
          stroke="url(#intro-ice)"
          strokeWidth={1.5}
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 0.7, ease: 'easeInOut' }}
        />
        <motion.path
          d="M22 8 L34 14.5 V29.5 L22 36 L10 29.5 V14.5 Z"
          fill="none"
          stroke="#5FCBEE"
          strokeWidth={1}
          opacity={0.4}
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.5, delay: 0.3, ease: 'easeInOut' }}
        />
        <motion.path
          d="M6.5 29.5 Q 22 9 37 15"
          stroke="url(#intro-ice)"
          strokeWidth={1.8}
          fill="none"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.5, delay: 0.5, ease: 'easeInOut' }}
        />
        <motion.path
          d="M9.5 33.5 Q 22 17 35.5 25.5"
          stroke="url(#intro-ember)"
          strokeWidth={1.6}
          fill="none"
          strokeLinecap="round"
          opacity={0.9}
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.5, delay: 0.65, ease: 'easeInOut' }}
        />
        <motion.path
          d="M31 8.5 L32.4 11 L34.9 12.4 L32.4 13.8 L31 16.3 L29.6 13.8 L27.1 12.4 L29.6 11 Z"
          fill="#8FE3FF"
          style={{ transformOrigin: '31px 12.4px' }}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 0.85, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.9 }}
        />
        {[
          [22, 2.5, '#8FE3FF'],
          [39.5, 12, '#FF8A5C'],
          [39.5, 32, '#FF8A5C'],
          [22, 41.5, '#FF8A5C'],
          [4.5, 32, '#8FE3FF'],
          [4.5, 12, '#8FE3FF'],
        ].map(([cx, cy, color], i) => (
          <motion.circle
            key={i}
            cx={cx as number}
            cy={cy as number}
            r={1.1}
            fill={color as string}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2, delay: 0.9 + i * 0.04 }}
          />
        ))}
        <motion.circle
          cx={22}
          cy={22}
          r={3.4}
          fill="url(#intro-core)"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: [0, 1.4, 1], opacity: 1 }}
          transition={{ duration: 0.5, delay: 1.0, ease: 'easeOut' }}
        />
        <circle cx={22} cy={22} r={3.4} stroke="#08090C" strokeWidth={0.6} fill="none" />
      </svg>
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.95, duration: 0.5 }}
        className="font-display text-[24px] tracking-[3px] text-text-hi"
        style={{ textShadow: '0 0 20px rgba(95,203,238,0.35)' }}
      >
        WINTER ARC
      </motion.div>
    </motion.div>
  );
}
