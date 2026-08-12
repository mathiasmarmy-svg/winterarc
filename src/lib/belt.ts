import type { Group, Member, Objective } from '../types';
import { activeObjectives, formatDay } from './utils';

/**
 * Hidden belt-progression algorithm.
 *
 * Deliberately NOT exposed to the UI beyond the final { current, record }
 * badge — no scores, ratios, or thresholds are ever rendered. This file is
 * the only place the formula is documented.
 *
 * Design, in plain terms:
 *  - There are 10 "paliers" (Ash through Eternal), each split into 3
 *    "barrettes" (I/II/III) — 30 badges total, forming one ascending ladder.
 *  - The engine is cumulative "qualifying days": a day counts once a member
 *    clears DAY_QUALIFY_RATIO of that day's active objectives. Badges are
 *    keyed off this count via a triangular curve (day(i) = i*(i+5)/2 for
 *    badge index i), so early badges come quickly and the ladder stretches
 *    out toward the top — reaching Eternal takes well over a year of
 *    consistent activity, like a martial-arts belt, not a weekly percentage.
 *  - Average completion rate acts only as a floor/gate: fall under
 *    AVG_FLOOR and you're capped at the base badge no matter how many days
 *    you've logged; fall under HIGH_TIER_AVG_FLOOR and the top two paliers
 *    (Aurora, Eternal) are out of reach. It never promotes on its own.
 *  - The last RECENT_WINDOW_DAYS give a "current form" adjustment: a hot
 *    streak (>= RECENT_HOT_RATIO) can pull someone into their next badge a
 *    little early; a sustained cold streak (< RECENT_COLD_RATIO) can drop
 *    the *displayed* current badge by one notch.
 *  - The historical peak ("record") is recomputed by walking the full
 *    check-in history rather than persisted, so it can never regress even
 *    if the formula's constants change later — and it survives demotion.
 *  - A cell's aggregate badge (computeCellBelt) runs the exact same walk,
 *    just fed the day-by-day mean completion ratio across its members
 *    instead of one member's ratio — same algorithm, aggregate input.
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
  /** Ordinal position only (0-9 palier, 0-2 barrette) — safe to expose,
   * unlike the day/ratio constants above, since it reveals no thresholds. */
  tierIndex: number;
  subIndex: number;
}

interface Tier extends BeltTier {
  days: number;
}

const PALIER_NAMES = ['Ash', 'Iron', 'Bronze', 'Silver', 'Gold', 'Sapphire', 'Platinum', 'Diamond', 'Aurora', 'Eternal'];
const PALIER_COLORS = ['#5B6472', '#8A8F98', '#B08968', '#B8C4D0', '#E8B84B', '#4C8DFF', '#8FE3FF', '#7FA6FF', '#C994E8', '#5FCBEE'];
const BARRETTE_LABELS = ['I', 'II', 'III'];

const TIERS: Tier[] = [];
for (let p = 0; p < PALIER_NAMES.length; p++) {
  for (let s = 0; s < BARRETTE_LABELS.length; s++) {
    const i = p * 3 + s;
    TIERS.push({
      key: `${PALIER_NAMES[p].toLowerCase()}-${s + 1}`,
      label: `${PALIER_NAMES[p]} ${BARRETTE_LABELS[s]}`,
      color: PALIER_COLORS[p],
      tierIndex: p,
      subIndex: s,
      days: Math.round((i * (i + 5)) / 2),
    });
  }
}

/** The full 30-badge ladder in order — names, colors and ordinal position
 * only, safe for the Paliers tab to render as a locked/unlocked ladder. */
export const ALL_TIERS: BeltTier[] = TIERS.map(({ key, label, color, tierIndex, subIndex }) => ({
  key,
  label,
  color,
  tierIndex,
  subIndex,
}));

const DAY_QUALIFY_RATIO = 0.6;
const AVG_FLOOR = 0.4;
const HIGH_TIER_AVG_FLOOR = 0.6;
const HIGH_TIER_FLOOR_INDEX = 24; // 'Aurora I' — this badge and above need HIGH_TIER_AVG_FLOOR
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

function recentAverageByDate(ratioForDate: (key: string) => number, windowDays: number): number {
  let sum = 0;
  const d = new Date();
  for (let i = 0; i < windowDays; i++) {
    sum += ratioForDate(formatDay(d));
    d.setDate(d.getDate() - 1);
  }
  return sum / windowDays;
}

export interface BeltResult {
  current: BeltTier;
  record: BeltTier;
}

function coreBelt(dayRatios: { ratio: number }[], recentRatio: number): BeltResult {
  if (dayRatios.length === 0) return { current: TIERS[0], record: TIERS[0] };

  let qualifyingDays = 0;
  let sumRatio = 0;
  let recordIndex = 0;

  for (let i = 0; i < dayRatios.length; i++) {
    const ratio = dayRatios[i].ratio;
    sumRatio += ratio;
    if (ratio >= DAY_QUALIFY_RATIO) qualifyingDays++;
    const avgSoFar = sumRatio / (i + 1);
    const gatedIndex = gateByAverage(tierIndexForDays(qualifyingDays), avgSoFar);
    if (gatedIndex > recordIndex) recordIndex = gatedIndex;
  }

  const overallAvg = sumRatio / dayRatios.length;
  let currentIndex = gateByAverage(tierIndexForDays(qualifyingDays), overallAvg);

  if (recentRatio >= RECENT_HOT_RATIO) {
    const boosted = gateByAverage(tierIndexForDays(qualifyingDays + RECENT_HOT_BONUS_DAYS), overallAvg);
    currentIndex = Math.min(boosted, recordIndex + 1);
  } else if (recentRatio < RECENT_COLD_RATIO && qualifyingDays >= MIN_DAYS_BEFORE_DEMOTION) {
    currentIndex = Math.max(0, currentIndex - 1);
  }

  return { current: TIERS[currentIndex], record: TIERS[recordIndex] };
}

export function computeBelt(member: Member, objectives: Objective[]): BeltResult {
  const denom = activeObjectives({ objectives }).length;
  if (denom === 0) return { current: TIERS[0], record: TIERS[0] };

  const dates = Object.keys(member.checkins).sort();
  const ratioForDate = (key: string) => Math.min(1, (member.checkins[key]?.length ?? 0) / denom);
  const dayRatios = dates.map((date) => ({ ratio: ratioForDate(date) }));
  const recentRatio = recentAverageByDate(ratioForDate, RECENT_WINDOW_DAYS);

  return coreBelt(dayRatios, recentRatio);
}

/** Same algorithm as computeBelt, fed the cell's day-by-day mean completion
 * ratio (average across members) instead of one member's ratio. */
export function computeCellBelt(group: Group): BeltResult {
  const denom = activeObjectives(group).length;
  const members = group.members;
  if (denom === 0 || members.length === 0) return { current: TIERS[0], record: TIERS[0] };

  const dateSet = new Set<string>();
  for (const m of members) for (const date of Object.keys(m.checkins)) dateSet.add(date);
  const dates = Array.from(dateSet).sort();

  const ratioForDate = (key: string) =>
    members.reduce((acc, m) => acc + Math.min(1, (m.checkins[key]?.length ?? 0) / denom), 0) / members.length;

  const dayRatios = dates.map((date) => ({ ratio: ratioForDate(date) }));
  const recentRatio = recentAverageByDate(ratioForDate, RECENT_WINDOW_DAYS);

  return coreBelt(dayRatios, recentRatio);
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
