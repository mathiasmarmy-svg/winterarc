import React from 'react';
import { Award } from 'lucide-react';
import { gradeFor, hueFor } from '../lib/utils';

// ---------- Ambient background ----------
export function Background() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden bg-void">
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 80% 60% at 50% -10%, #141824 0%, #06070a 55%)',
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

// ---------- Signature mark: a cracked seal ----------
export function Seal({ size = 22, glow = false }: { size?: number; glow?: boolean }) {
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      {glow && (
        <div
          className="absolute inset-[-6px] rounded-full blur-md opacity-50 animate-pulse-glow"
          style={{ background: 'radial-gradient(circle, #5FCBEE55, transparent 70%)' }}
        />
      )}
      <svg width={size} height={size} viewBox="0 0 40 40" fill="none" className="relative">
        <path d="M20 2 L36 11 V29 L20 38 L4 29 V11 Z" stroke="#5FCBEE" strokeWidth="1.6" fill="none" />
        <path d="M20 2 L20 20 L4 11" stroke="#5FCBEE" strokeWidth="1.6" fill="none" opacity="0.55" />
        <path d="M20 20 L36 11 M20 20 L20 38" stroke="#FF5A2B" strokeWidth="1.6" fill="none" opacity="0.85" />
        <circle cx="20" cy="20" r="3" fill="#F2F4F7" />
      </svg>
    </div>
  );
}

export function Wordmark({ subtitle }: { subtitle?: string }) {
  return (
    <div className={subtitle ? 'mb-0.5' : 'mb-1.5'}>
      <div className="flex items-center gap-2.5">
        <Seal size={24} glow />
        <span
          className="font-display text-[28px] tracking-[2px] text-text-hi"
          style={{ textShadow: '0 0 18px rgba(95,203,238,0.35)' }}
        >
          WINTER ARC
        </span>
      </div>
      {subtitle && (
        <div className="text-xs text-text-low ml-8 mt-0.5 font-mono uppercase tracking-wider">{subtitle}</div>
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
        boxShadow: active ? `0 0 14px ${color}55, inset 0 0 10px ${color}22` : undefined,
      }}
    >
      {initials}
    </div>
  );
}

// ---------- Rank badge ----------
export function RankBadge({ pct, size = 30 }: { pct: number; size?: number }) {
  const g = gradeFor(pct);
  return (
    <div
      key={g.key}
      title={g.label}
      className="relative flex items-center justify-center flex-shrink-0 rounded-full animate-rank-pop"
      style={{
        width: size,
        height: size,
        background: `radial-gradient(circle at 30% 30%, ${g.color}66, ${g.color}1a)`,
        border: `1.5px solid ${g.color}`,
        boxShadow: g.key === 'frost' ? `0 0 12px ${g.color}88` : `0 0 6px ${g.color}44`,
      }}
    >
      <Award size={size * 0.55} color={g.color} strokeWidth={2.2} />
    </div>
  );
}

// ---------- HUD progress bar ----------
export function Progress({ pct, color = '#5FCBEE' }: { pct: number; color?: string }) {
  return (
    <div className="relative h-[7px] bg-raised rounded-full overflow-hidden border border-line">
      <div
        className="h-full relative overflow-hidden rounded-full transition-[width] duration-500 ease-out"
        style={{
          width: `${Math.min(100, Math.max(0, pct))}%`,
          background: `linear-gradient(90deg, ${color}aa, ${color})`,
          boxShadow: `0 0 8px ${color}88`,
        }}
      >
        <div
          className="absolute inset-y-0 w-1/3 animate-shimmer"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.45), transparent)' }}
        />
      </div>
    </div>
  );
}

// ---------- Shell / page frame ----------
export function Shell({ children, wide }: { children: React.ReactNode; wide?: boolean }) {
  return (
    <div className="min-h-screen flex flex-col items-center px-5 py-8 text-text-hi font-body">
      <Background />
      <div className="w-full" style={{ maxWidth: wide ? 920 : 420 }}>
        {children}
      </div>
    </div>
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
    <button
      onClick={onClick}
      disabled={disabled}
      className={
        `group relative w-full overflow-hidden rounded px-5 py-3.5 text-[14.5px] font-bold tracking-wide transition-all active:scale-[0.98] ` +
        (row ? 'flex items-center justify-between text-left ' : 'text-center ') +
        (disabled
          ? 'bg-raised text-text-low cursor-not-allowed opacity-60'
          : 'text-void shadow-[0_0_20px_rgba(95,203,238,0.35)] hover:shadow-[0_0_28px_rgba(95,203,238,0.55)]') +
        ` ${className}`
      }
      style={!disabled ? { background: 'linear-gradient(135deg, #8fe3ff, #3A9FBF)' } : undefined}
    >
      {!disabled && (
        <span className="pointer-events-none absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out bg-gradient-to-r from-transparent via-white/30 to-transparent" />
      )}
      {children}
    </button>
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
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className={`w-full rounded px-5 py-4 text-[15px] font-semibold bg-transparent transition-colors flex items-center justify-between ${className}`}
      style={{ border: `1px solid ${hover ? hoverAccent : accent}` }}
    >
      {children}
    </button>
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
        &larr; Retour
      </button>
      <div className="font-display text-[24px] tracking-wide">{label}</div>
    </div>
  );
}

export function HudCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`relative border border-line rounded bg-surface hud-corners text-ice ${className}`}>
      {children}
    </div>
  );
}
