"use server";

import { createClient } from "@/lib/supabase/server";
import type { OptimizationResult } from "@/lib/types";
import { revalidatePath } from "next/cache";

export async function saveOptimizedAssignments(
  shiftId: string,
  year: number,
  month: number,
  results: OptimizationResult[]
): Promise<void> {
  const supabase = await createClient();

  // Delete all auto-assigned entries for this shift
  const days = results.map((r) => r.day);
  await supabase
    .from("shift_assignments")
    .delete()
    .eq("shift_id", shiftId)
    .eq("is_auto_assigned", true)
    .in("day", days);

  // Insert new optimized assignments
  const rows = results.flatMap((result) =>
    result.selected_member_ids.map((member_id) => ({
      shift_id: shiftId,
      day: result.day,
      member_id,
      is_auto_assigned: true,
    }))
  );

  if (rows.length > 0) {
    const { error } = await supabase
      .from("shift_assignments")
      .upsert(rows, { onConflict: "shift_id,day,member_id" });
    if (error) throw new Error(error.message);
  }

  revalidatePath(`/shifts/${year}/${month}`);
}

export async function addManualAssignment(
  shiftId: string,
  year: number,
  month: number,
  day: number,
  memberId: string
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("shift_assignments").upsert(
    {
      shift_id: shiftId,
      day,
      member_id: memberId,
      is_auto_assigned: false,
    },
    { onConflict: "shift_id,day,member_id" }
  );
  if (error) throw new Error(error.message);
  revalidatePath(`/shifts/${year}/${month}`);
}

export async function removeAssignment(
  shiftId: string,
  year: number,
  month: number,
  day: number,
  memberId: string
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("shift_assignments")
    .delete()
    .eq("shift_id", shiftId)
    .eq("day", day)
    .eq("member_id", memberId);
  if (error) throw new Error(error.message);
  revalidatePath(`/shifts/${year}/${month}`);
}

export async function clearAllAssignments(
  shiftId: string,
  year: number,
  month: number
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("shift_assignments")
    .delete()
    .eq("shift_id", shiftId);
  if (error) throw new Error(error.message);
  revalidatePath(`/shifts/${year}/${month}`);
}
