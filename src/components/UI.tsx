import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { hueFor } from '../lib/utils';
import type { BeltTier } from '../lib/belt';

// ---------- Ambient background ----------
export function Background() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden bg-void">
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse 80% 60% at 50% -10%, #141824 0%, #06070a 55%)',
        }}
      />
      <div className="absolute inset-0 bg-noise opacity-60" />
      <div
        className="absolute w-[520px] h-[520px] rounded-full opacity-[0.14] blur-[110px] animate-float-a"
        style={{ background: '#5FCBEE', top: '-8%', left: '-6%' }}
      />
      <div
        className="absolute w-[480px] h-[480px] rounded-full opacity-[0.12] blur-[110px] animate-float-b"
        style={{ background: '#FF5A2B', bottom: '-10%', right: '-8%' }}
      />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ boxShadow: 'inset 0 0 160px 40px rgba(0,0,0,0.7)' }}
      />
    </div>
  );
}

// ---------- Signature mark: a forged emblem ----------
let sealSeq = 0;
export function Seal({ size = 22, glow = false }: { size?: number; glow?: boolean }) {
  const gid = React.useMemo(() => `seal-${++sealSeq}`, []);
  return (
    <div className="relative inline-flex items-center justify-center flex-shrink-0" style={{ width: size, height: size }}>
      {glow && (
        <div
          className="absolute inset-[-8px] rounded-full blur-md opacity-50 animate-pulse-glow"
          style={{ background: 'radial-gradient(circle, #5FCBEE55, transparent 70%)' }}
        />
      )}
      <svg width={size} height={size} viewBox="0 0 44 44" fill="none" className="relative">
        <defs>
          <linearGradient id={`${gid}-ice`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#8FE3FF" />
            <stop offset="100%" stopColor="#3A9FBF" />
          </linearGradient>
          <linearGradient id={`${gid}-ember`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#FF8A5C" />
            <stop offset="100%" stopColor="#B23A17" />
          </linearGradient>
          <radialGradient id={`${gid}-core`}>
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="100%" stopColor="#C7DAE3" />
          </radialGradient>
        </defs>
        {/* outer plate */}
        <path
          d="M22 2.5 L39.5 12 V32 L22 41.5 L4.5 32 V12 Z"
          fill={`url(#${gid}-ice)`}
          fillOpacity="0.06"
          stroke={`url(#${gid}-ice)`}
          strokeWidth="1.5"
        />
        {/* inner faceted ring */}
        <path d="M22 8 L34 14.5 V29.5 L22 36 L10 29.5 V14.5 Z" fill="none" stroke="#5FCBEE" strokeWidth="1" opacity="0.4" />
        {/* the crack, split ice / ember */}
        <path d="M22 2.5 L22 22 L4.5 12" stroke={`url(#${gid}-ice)`} strokeWidth="1.8" fill="none" strokeLinecap="round" />
        <path
          d="M22 22 L39.5 12 M22 22 L22 41.5"
          stroke={`url(#${gid}-ember)`}
          strokeWidth="1.8"
          fill="none"
          strokeLinecap="round"
          opacity="0.92"
        />
        {/* rivets */}
        <circle cx="22" cy="2.5" r="1.1" fill="#8FE3FF" />
        <circle cx="39.5" cy="12" r="1.1" fill="#FF8A5C" />
        <circle cx="39.5" cy="32" r="1.1" fill="#FF8A5C" />
        <circle cx="22" cy="41.5" r="1.1" fill="#FF8A5C" />
        <circle cx="4.5" cy="32" r="1.1" fill="#8FE3FF" />
        <circle cx="4.5" cy="12" r="1.1" fill="#8FE3FF" />
        {/* core */}
        <circle cx="22" cy="22" r="3.4" fill={`url(#${gid}-core)`} />
        <circle cx="22" cy="22" r="3.4" stroke="#08090C" strokeWidth="0.6" fill="none" />
      </svg>
    </div>
  );
}

export function Wordmark({ subtitle }: { subtitle?: string }) {
  return (
    <div className={subtitle ? 'mb-1' : 'mb-1.5'}>
      <div className="flex items-center gap-3">
        <Seal size={26} glow />
        <span
          className="font-display text-[30px] leading-none tracking-[2.5px] text-text-hi"
          style={{ textShadow: '0 0 20px rgba(95,203,238,0.35)' }}
        >
          WINTER ARC
        </span>
      </div>
      {subtitle && (
        <div className="text-xs text-text-low ml-9 mt-1 font-mono uppercase tracking-wider">{subtitle}</div>
      )}
    </div>
  );
}

// ---------- Avatar ----------
export function Avatar({ name, id, size = 34, active = false }: { name?: string; id?: string; size?: number; active?: boolean }) {
  const initials = (name || '?').trim().slice(0, 2).toUpperCase();
  const color = hueFor(id || name || 'x');
  return (
    <div
      className="relative flex items-center justify-center flex-shrink-0 font-mono font-bold rounded-[10px]"
      style={{
        width: size,
        height: size,
        background: `linear-gradient(135deg, ${color}3d, ${color}12)`,
        border: `1px solid ${color}88`,
        fontSize: size * 0.36,
        color,
        boxShadow: active ? `0 0 14px ${color}55, inset 0 0 10px ${color}22` : `0 2px 6px rgba(0,0,0,0.35)`,
      }}
    >
      {initials}
    </div>
  );
}

// ---------- Belt / rank badge ----------
// Only ever fed a { key, label, color } tier — never a score, ratio, or
// threshold. See src/lib/belt.ts for why.
export function RankBadge({ tier, size = 30 }: { tier: BeltTier; size?: number }) {
  return (
    <motion.div
      key={tier.key}
      initial={{ scale: 0.6, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 16 }}
      title={tier.label}
      className="relative flex items-center justify-center flex-shrink-0 rounded-full"
      style={{
        width: size,
        height: size,
        background: `radial-gradient(circle at 30% 30%, ${tier.color}66, ${tier.color}1a)`,
        border: `1.5px solid ${tier.color}`,
        boxShadow: tier.key === 'frost' ? `0 0 12px ${tier.color}88` : `0 0 6px ${tier.color}44`,
      }}
    >
      <svg width={size * 0.5} height={size * 0.5} viewBox="0 0 24 24" fill="none">
        <path
          d="M12 2 L21 6.5 V15 C21 18.5 17 21.2 12 22.5 C7 21.2 3 18.5 3 15 V6.5 Z"
          stroke={tier.color}
          strokeWidth="1.8"
          fill="none"
          strokeLinejoin="round"
        />
        <path d="M8.5 12 L11 14.5 L15.5 9.5" stroke={tier.color} strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </motion.div>
  );
}

/** Compact "Current: X" / "Current: X — Record: Y" label — text only, no bars. */
export function BeltLabel({ current, record }: { current: BeltTier; record: BeltTier }) {
  if (current.key === record.key) return null;
  return (
    <span className="text-[10.5px] text-text-low font-mono">
      Record: <span style={{ color: record.color }}>{record.label}</span>
    </span>
  );
}

// ---------- HUD progress bar ----------
export function Progress({ pct, color = '#5FCBEE' }: { pct: number; color?: string }) {
  const clamped = Math.min(100, Math.max(0, pct));
  return (
    <div className="relative h-[7px] bg-raised rounded-full overflow-hidden border border-line">
      <motion.div
        className="h-full relative overflow-hidden rounded-full"
        initial={{ width: 0 }}
        animate={{ width: `${clamped}%` }}
        transition={{ duration: 0.7, ease: 'easeOut' }}
        style={{
          background: `linear-gradient(90deg, ${color}aa, ${color})`,
          boxShadow: `0 0 8px ${color}88`,
        }}
      >
        <div
          className="absolute inset-y-0 w-1/3 animate-shimmer"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.45), transparent)' }}
        />
      </motion.div>
    </div>
  );
}

// ---------- Shell / page frame ----------
export function Shell({ children, wide }: { children: React.ReactNode; wide?: boolean }) {
  return (
    <div className="min-h-screen flex flex-col items-center px-5 py-8 text-text-hi font-body">
      <Background />
      <div className="w-full" style={{ maxWidth: wide ? 960 : 420 }}>
        {children}
      </div>
    </div>
  );
}

// ---------- Animated tab panel ----------
export function TabPanel({ tabKey, children }: { tabKey: string; children: React.ReactNode }) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={tabKey}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -6 }}
        transition={{ duration: 0.22, ease: 'easeOut' }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

/** Stagger-in wrapper for list rows (leaderboards, rankings). */
export function StaggerItem({ index, children }: { index: number; children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, delay: Math.min(index, 10) * 0.035, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  );
}

// ---------- Buttons ----------
export function PrimaryButton({
  children,
  onClick,
  disabled,
  row,
  className = '',
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  row?: boolean;
  className?: string;
}) {
  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      whileTap={!disabled ? { scale: 0.98 } : undefined}
      whileHover={!disabled ? { y: -1 } : undefined}
      className={
        `group relative w-full overflow-hidden rounded px-5 py-3.5 text-[14.5px] font-bold tracking-wide transition-shadow ` +
        (row ? 'flex items-center justify-between text-left ' : 'text-center ') +
        (disabled
          ? 'bg-raised text-text-low cursor-not-allowed opacity-60'
          : 'text-void shadow-[0_4px_20px_rgba(95,203,238,0.3)] hover:shadow-[0_6px_28px_rgba(95,203,238,0.5)]') +
        ` ${className}`
      }
      style={!disabled ? { background: 'linear-gradient(135deg, #8fe3ff, #3A9FBF)' } : undefined}
    >
      {!disabled && (
        <span className="pointer-events-none absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out bg-gradient-to-r from-transparent via-white/30 to-transparent" />
      )}
      {children}
    </motion.button>
  );
}

export function GhostButton({
  children,
  onClick,
  accent = '#262B35',
  hoverAccent = '#5FCBEE',
  className = '',
}: {
  children: React.ReactNode;
  onClick?: () => void;
  accent?: string;
  hoverAccent?: string;
  className?: string;
}) {
  const [hover, setHover] = React.useState(false);
  return (
    <motion.button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      whileTap={{ scale: 0.98 }}
      whileHover={{ y: -1 }}
      className={`w-full rounded px-5 py-4 text-[15px] font-semibold bg-transparent transition-colors flex items-center justify-between ${className}`}
      style={{ border: `1px solid ${hover ? hoverAccent : accent}` }}
    >
      {children}
    </motion.button>
  );
}

// ---------- Form bits ----------
export function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-[11.5px] text-text-mid mb-2 font-mono uppercase tracking-wider">{children}</label>
  );
}

export function TextInput({
  value,
  onChange,
  placeholder,
  autoFocus,
  mono,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
  mono?: boolean;
}) {
  return (
    <input
      autoFocus={autoFocus}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={
        `w-full px-3.5 py-3 bg-surface border border-line rounded text-text-hi text-[14.5px] transition-colors focus:border-ice ` +
        (mono ? 'font-mono tracking-[2px]' : '')
      }
    />
  );
}

export function BackRow({ onBack, label }: { onBack: () => void; label: string }) {
  return (
    <div className="mb-6">
      <button onClick={onBack} className="bg-transparent border-none text-text-low text-[13px] p-0 mb-3.5 hover:text-ice transition-colors">
        &larr; Back
      </button>
      <div className="font-display text-[26px] tracking-wide">{label}</div>
    </div>
  );
}

export function HudCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`relative border border-line rounded hud-corners text-ice panel ${className}`}>
      {children}
    </div>
  );
}

export function SectionTitle({ children, icon }: { children: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 text-[12.5px] font-bold text-text-mid uppercase tracking-[1.5px]">
      {icon}
      {children}
    </div>
  );
}
