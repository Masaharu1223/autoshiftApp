"use server";

import { createClient } from "@/lib/supabase/server";
import type { DayShiftData, Member, MonthShiftData, Shift, ShiftAbilityWeight, ShiftAssignment, ShiftDayConfig, ShiftMemberRequest } from "@/lib/types";
import { revalidatePath } from "next/cache";
import { getMembers, getAbilityDefinitions } from "./members";

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

export async function getOrCreateShift(year: number, month: number): Promise<Shift> {
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("shifts")
    .select("*")
    .eq("year", year)
    .eq("month", month)
    .single();

  if (existing) return existing as Shift;

  const { data: created, error } = await supabase
    .from("shifts")
    .insert({ year, month })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return created as Shift;
}

export async function getMonthShiftData(
  year: number,
  month: number
): Promise<MonthShiftData> {
  const supabase = await createClient();
  const shift = await getOrCreateShift(year, month);
  const daysInMonth = getDaysInMonth(year, month);

  const [members, abilityDefs, dayConfigsResult, assignmentsResult, requestsResult, weightsResult] =
    await Promise.all([
      getMembers(),
      getAbilityDefinitions(),
      supabase
        .from("shift_day_configs")
        .select("*")
        .eq("shift_id", shift.id),
      supabase
        .from("shift_assignments")
        .select("*, members(*)")
        .eq("shift_id", shift.id),
      supabase
        .from("shift_member_requests")
        .select("*")
        .eq("shift_id", shift.id),
      supabase
        .from("shift_ability_weights")
        .select("*")
        .eq("shift_id", shift.id),
    ]);

  const dayConfigs = (dayConfigsResult.data ?? []) as ShiftDayConfig[];
  const assignments = (assignmentsResult.data ?? []) as Array<ShiftAssignment & { members: Member }>;
  const requests = (requestsResult.data ?? []) as ShiftMemberRequest[];
  const abilityWeights = (weightsResult.data ?? []) as ShiftAbilityWeight[];

  // Build weight map: ability_definition_id -> weight (default 1.0)
  const weightMap = new Map(abilityWeights.map((w) => [w.ability_definition_id, Number(w.weight)]));

  // Compute weighted_score for each member
  const membersWithWeightedScore = members.map((m) => ({
    ...m,
    weighted_score: m.abilities.reduce((sum, a) => {
      const weight = weightMap.get(a.ability_definition_id) ?? 1.0;
      return sum + a.score * weight;
    }, 0),
  }));

  const memberMap = new Map(membersWithWeightedScore.map((m) => [m.id, m]));
  const configMap = new Map(dayConfigs.map((c) => [c.day, c]));

  const days: DayShiftData[] = Array.from({ length: daysInMonth }, (_, i) => {
    const day = i + 1;
    const config = configMap.get(day) ?? null;
    const dayAssignments = assignments
      .filter((a) => a.day === day)
      .map((a) => ({
        ...a,
        member: a.members,
      }));

    const total_score = dayAssignments.reduce((sum, a) => {
      const member = memberMap.get(a.member_id);
      return sum + (member?.total_score ?? 0);
    }, 0);

    return {
      day,
      date: new Date(year, month - 1, day),
      config,
      assignments: dayAssignments,
      total_score,
      required_count: config?.required_count ?? 2,
      max_count: config?.max_count ?? null,
      is_closed: config?.is_closed ?? false,
    };
  });

  return {
    shift,
    days,
    members: membersWithWeightedScore,
    ability_definitions: abilityDefs,
    requests,
    ability_weights: abilityWeights,
  };
}

export async function updateDayConfig(
  shiftId: string,
  year: number,
  month: number,
  day: number,
  data: { required_count?: number; max_count?: number | null; is_closed?: boolean }
): Promise<void> {
  const supabase = await createClient();
  await supabase
    .from("shift_day_configs")
    .upsert(
      { shift_id: shiftId, day, ...data, updated_at: new Date().toISOString() },
      { onConflict: "shift_id,day" }
    );
  revalidatePath(`/shifts/${year}/${month}`);
  revalidatePath(`/staffing/${year}/${month}`);
}

export async function getDayConfigs(
  year: number,
  month: number
): Promise<{ shiftId: string; configs: ShiftDayConfig[]; daysInMonth: number }> {
  const supabase = await createClient();
  const shift = await getOrCreateShift(year, month);
  const daysInMonth = getDaysInMonth(year, month);

  const { data } = await supabase
    .from("shift_day_configs")
    .select("*")
    .eq("shift_id", shift.id);

  return {
    shiftId: shift.id,
    configs: (data ?? []) as ShiftDayConfig[],
    daysInMonth,
  };
}

export async function bulkUpdateDayConfigs(
  shiftId: string,
  year: number,
  month: number,
  configs: Array<{
    day: number;
    required_count: number;
    max_count: number | null;
    is_closed: boolean;
  }>
): Promise<void> {
  const supabase = await createClient();
  const now = new Date().toISOString();

  const rows = configs.map((c) => ({
    shift_id: shiftId,
    day: c.day,
    required_count: c.required_count,
    max_count: c.max_count,
    is_closed: c.is_closed,
    updated_at: now,
  }));

  const { error } = await supabase
    .from("shift_day_configs")
    .upsert(rows, { onConflict: "shift_id,day" });

  if (error) throw new Error(error.message);

  revalidatePath(`/shifts/${year}/${month}`);
  revalidatePath(`/staffing/${year}/${month}`);
}
