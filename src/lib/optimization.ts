import type { MemberWithAbilities, OptimizationResult } from "./types";

// Combinations threshold for exhaustive search
const EXHAUSTIVE_THRESHOLD = 10_000;

function combinations<T>(arr: T[], k: number): T[][] {
  if (k === 0) return [[]];
  if (k > arr.length) return [];
  const [first, ...rest] = arr;
  const withFirst = combinations(rest, k - 1).map((c) => [first, ...c]);
  const withoutFirst = combinations(rest, k);
  return [...withFirst, ...withoutFirst];
}

function nCr(n: number, k: number): number {
  if (k > n) return 0;
  if (k === 0 || k === n) return 1;
  let result = 1;
  for (let i = 0; i < k; i++) {
    result = (result * (n - i)) / (i + 1);
    if (result > EXHAUSTIVE_THRESHOLD * 2) return result; // early exit
  }
  return result;
}

function totalScore(members: MemberWithAbilities[]): number {
  return members.reduce((sum, m) => sum + (m.weighted_score ?? m.total_score), 0);
}

/**
 * Optimize shift assignments for a single day.
 *
 * @param availableMembers - Members who can work (not locked)
 * @param lockedMembers    - Members already fixed for this day (count toward required)
 * @param requiredCount    - Minimum number of workers needed
 * @param maxCount         - Maximum number of workers allowed (null = same as requiredCount)
 * @returns OptimizationResult with selected member IDs
 */
export function optimizeDay(
  availableMembers: MemberWithAbilities[],
  lockedMembers: MemberWithAbilities[],
  requiredCount: number,
  day: number,
  maxCount: number | null = null
): OptimizationResult {
  // Target: fill up to maxCount if set, otherwise fill to requiredCount
  const targetCount = maxCount != null ? maxCount : requiredCount;
  const maxSlotsToFill = Math.max(0, targetCount - lockedMembers.length);

  if (maxSlotsToFill === 0 || availableMembers.length === 0) {
    return {
      day,
      selected_member_ids: lockedMembers.map((m) => m.id),
      total_score: totalScore(lockedMembers),
      method: "exhaustive",
    };
  }

  const k = Math.min(maxSlotsToFill, availableMembers.length);
  const combinationCount = nCr(availableMembers.length, k);

  let selectedFromAvailable: MemberWithAbilities[];
  let method: "exhaustive" | "greedy";

  if (combinationCount <= EXHAUSTIVE_THRESHOLD) {
    // Exhaustive search
    method = "exhaustive";
    const allCombinations = combinations(availableMembers, k);
    let bestScore = -1;
    let bestCombo = allCombinations[0] ?? [];
    for (const combo of allCombinations) {
      const score = totalScore(combo);
      if (score > bestScore) {
        bestScore = score;
        bestCombo = combo;
      }
    }
    selectedFromAvailable = bestCombo;
  } else {
    // Greedy: pick top-k by score
    method = "greedy";
    selectedFromAvailable = [...availableMembers]
      .sort((a, b) => (b.weighted_score ?? b.total_score) - (a.weighted_score ?? a.total_score))
      .slice(0, k);
  }

  const allSelected = [...lockedMembers, ...selectedFromAvailable];
  return {
    day,
    selected_member_ids: allSelected.map((m) => m.id),
    total_score: totalScore(allSelected),
    method,
  };
}

/**
 * Optimize all days in a month.
 */
export function optimizeMonth(
  members: MemberWithAbilities[],
  daysInMonth: number,
  getRequiredCount: (day: number) => number,
  isClosed: (day: number) => boolean,
  getLockedMemberIds: (day: number) => string[],
  getWantOffMemberIds: (day: number) => string[] = () => [],
  getMaxCount: (day: number) => number | null = () => null
): OptimizationResult[] {
  const activeMembers = members.filter((m) => m.is_active);

  return Array.from({ length: daysInMonth }, (_, i) => i + 1)
    .filter((day) => !isClosed(day))
    .map((day) => {
      const lockedIds = getLockedMemberIds(day);
      const wantOffIds = getWantOffMemberIds(day);
      const lockedMembers = activeMembers.filter((m) =>
        lockedIds.includes(m.id)
      );
      const availableMembers = activeMembers.filter(
        (m) => !lockedIds.includes(m.id) && !wantOffIds.includes(m.id)
      );
      const requiredCount = getRequiredCount(day);
      const maxCount = getMaxCount(day);
      return optimizeDay(availableMembers, lockedMembers, requiredCount, day, maxCount);
    });
}
