import type { Member, Objective } from '../types';
import { activeObjectives, formatDay } from './utils';

/**
 * Hidden belt-progression algorithm.
 *
 * Deliberately NOT exposed to the UI beyond the final { current, record }
 * tier — no scores, ratios, or thresholds are ever rendered. This file is
 * the only place the formula is documented.
 *
 * Design, in plain terms:
 *  - The engine is cumulative "qualifying days": a day counts once a member
 *    clears DAY_QUALIFY_RATIO of that day's active objectives. Tiers are
 *    keyed off this count (roughly 0 / 20 / 60 / 120 / 220 / 380 days), so
 *    reaching the top tier takes on the order of a year of consistent
 *    activity — this is meant to feel like a martial-arts belt, not a
 *    weekly percentage.
 *  - Average completion rate acts only as a floor/gate: fall under
 *    AVG_FLOOR and you're capped at the base tier no matter how many days
 *    you've logged; fall under HIGH_TIER_AVG_FLOOR and the top two tiers
 *    are out of reach. It never promotes on its own.
 *  - The last RECENT_WINDOW_DAYS give a "current form" adjustment: a hot
 *    streak (>= RECENT_HOT_RATIO) can pull someone into their next tier a
 *    little early; a sustained cold streak (< RECENT_COLD_RATIO) can drop
 *    the *displayed* current tier by one notch.
 *  - The historical peak ("record") is recomputed by walking the full
 *    check-in history rather than persisted, so it can never regress even
 *    if the formula's constants change later — and it survives demotion.
 *
 * Simplification: the denominator (active objective count) uses the
 * cell's CURRENT active objectives applied uniformly across all past days,
 * rather than reconstructing how many objectives existed on each historical
 * date. Objectives are soft-deleted (archived, never removed) specifically
 * so this stays a reasonable approximation instead of losing data outright.
 */

export interface BeltTier {
  key: string;
  label: string;
  color: string;
}

interface Tier extends BeltTier {
  days: number;
}

const TIERS: Tier[] = [
  { key: 'bronze', label: 'Bronze', color: '#B08968', days: 0 },
  { key: 'silver', label: 'Silver', color: '#B8C4D0', days: 20 },
  { key: 'gold', label: 'Gold', color: '#E8B84B', days: 60 },
  { key: 'platinum', label: 'Platinum', color: '#8FE3FF', days: 120 },
  { key: 'diamond', label: 'Diamond', color: '#7FA6FF', days: 220 },
  { key: 'frost', label: 'Forged', color: '#5FCBEE', days: 380 },
];

const DAY_QUALIFY_RATIO = 0.6;
const AVG_FLOOR = 0.4;
const HIGH_TIER_AVG_FLOOR = 0.6;
const HIGH_TIER_FLOOR_INDEX = 4; // 'diamond' — this tier and above need HIGH_TIER_AVG_FLOOR
const RECENT_WINDOW_DAYS = 14;
const RECENT_HOT_RATIO = 0.8;
const RECENT_HOT_BONUS_DAYS = 15;
const RECENT_COLD_RATIO = 0.25;
const MIN_DAYS_BEFORE_DEMOTION = 10;

function tierIndexForDays(days: number): number {
  let idx = 0;
  for (let i = 0; i < TIERS.length; i++) if (days >= TIERS[i].days) idx = i;
  return idx;
}

function gateByAverage(index: number, avg: number): number {
  if (avg < AVG_FLOOR) return 0;
  if (avg < HIGH_TIER_AVG_FLOOR) return Math.min(index, HIGH_TIER_FLOOR_INDEX - 1);
  return index;
}

function recentAverage(member: Member, denom: number, windowDays: number): number {
  let sum = 0;
  const d = new Date();
  for (let i = 0; i < windowDays; i++) {
    const key = formatDay(d);
    sum += Math.min(1, (member.checkins[key]?.length ?? 0) / denom);
    d.setDate(d.getDate() - 1);
  }
  return sum / windowDays;
}

export interface BeltResult {
  current: BeltTier;
  record: BeltTier;
}

export function computeBelt(member: Member, objectives: Objective[]): BeltResult {
  const denom = activeObjectives({ objectives }).length;
  const dates = Object.keys(member.checkins).sort();
  if (denom === 0 || dates.length === 0) {
    return { current: TIERS[0], record: TIERS[0] };
  }

  let qualifyingDays = 0;
  let sumRatio = 0;
  let recordIndex = 0;

  for (let i = 0; i < dates.length; i++) {
    const ratio = Math.min(1, (member.checkins[dates[i]]?.length ?? 0) / denom);
    sumRatio += ratio;
    if (ratio >= DAY_QUALIFY_RATIO) qualifyingDays++;
    const avgSoFar = sumRatio / (i + 1);
    const gatedIndex = gateByAverage(tierIndexForDays(qualifyingDays), avgSoFar);
    if (gatedIndex > recordIndex) recordIndex = gatedIndex;
  }

  const overallAvg = sumRatio / dates.length;
  let currentIndex = gateByAverage(tierIndexForDays(qualifyingDays), overallAvg);

  const recentRatio = recentAverage(member, denom, RECENT_WINDOW_DAYS);
  if (recentRatio >= RECENT_HOT_RATIO) {
    const boosted = gateByAverage(tierIndexForDays(qualifyingDays + RECENT_HOT_BONUS_DAYS), overallAvg);
    currentIndex = Math.min(boosted, recordIndex + 1);
  } else if (recentRatio < RECENT_COLD_RATIO && qualifyingDays >= MIN_DAYS_BEFORE_DEMOTION) {
    currentIndex = Math.max(0, currentIndex - 1);
  }

  return { current: TIERS[currentIndex], record: TIERS[recordIndex] };
}

/**
 * Raw count of "qualifying" active days (see DAY_QUALIFY_RATIO above). This
 * number itself is fine to surface on the rankings tabs — comparing days
 * shown up is the whole point there — it's the *belt-tier derivation*
 * (floor/bonus/demotion logic above) that stays hidden, not this count.
 */
export function cumulativeActiveDays(member: Member, objectives: Objective[]): number {
  const denom = activeObjectives({ objectives }).length;
  if (denom === 0) return 0;
  let qualifyingDays = 0;
  for (const date of Object.keys(member.checkins)) {
    const ratio = (member.checkins[date]?.length ?? 0) / denom;
    if (ratio >= DAY_QUALIFY_RATIO) qualifyingDays++;
  }
  return qualifyingDays;
}
