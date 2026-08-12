import type { Group, Member, Objective } from '../types';

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

export function activeObjectives(group: Pick<Group, 'objectives'>): Objective[] {
  return group.objectives.filter((o) => !o.archived);
}

/** Cells created before `founderId` existed fall back to their earliest member. */
export function founderIdOf(group: Pick<Group, 'founderId' | 'members'>): string | undefined {
  if (group.founderId) return group.founderId;
  const earliest = group.members.slice().sort((a, b) => a.joinedAt - b.joinedAt)[0];
  return earliest?.id;
}

export function isFounder(group: Pick<Group, 'founderId' | 'members'>, memberId: string): boolean {
  return founderIdOf(group) === memberId;
}

export function streakFor(objectives: Objective[], member: Member): number {
  const activeIds = activeObjectives({ objectives });
  if (activeIds.length === 0) return 0;
  let streak = 0;
  const d = new Date();
  while (true) {
    const key = formatDay(d);
    const done = member.checkins[key];
    if (done && activeIds.every((o) => done.includes(o.id))) {
      streak++;
      d.setDate(d.getDate() - 1);
    } else break;
  }
  return streak;
}
