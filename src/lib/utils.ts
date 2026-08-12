export interface Grade {
  key: string;
  label: string;
  threshold: number;
  color: string;
}

export const GRADES: Grade[] = [
  { key: 'bronze', label: 'Bronze', threshold: 0, color: '#B08968' },
  { key: 'silver', label: 'Argent', threshold: 30, color: '#B8C4D0' },
  { key: 'gold', label: 'Or', threshold: 70, color: '#E8B84B' },
  { key: 'frost', label: 'Forgé', threshold: 100, color: '#5FCBEE' },
];

export function gradeFor(pct: number): Grade {
  let g = GRADES[0];
  for (const grade of GRADES) if (pct >= grade.threshold) g = grade;
  return g;
}

export const AVATAR_HUES = ['#5FCBEE', '#FF5A2B', '#B08968', '#8FD694', '#E8B84B', '#C994E8'];

export function hueFor(id: string): string {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) % AVATAR_HUES.length;
  return AVATAR_HUES[h];
}

export function uid(): string {
  return Math.random().toString(36).slice(2, 9);
}

export function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

export function makeGroupCode(): string {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  let s = '';
  for (let i = 0; i < 6; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

export function formatDay(d: Date): string {
  return d.toISOString().slice(0, 10);
}
