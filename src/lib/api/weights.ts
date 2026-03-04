"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function saveAbilityWeights(
  shiftId: string,
  year: number,
  month: number,
  weights: Array<{ ability_definition_id: string; weight: number }>
): Promise<void> {
  const supabase = await createClient();

  const rows = weights.map((w) => ({
    shift_id: shiftId,
    ability_definition_id: w.ability_definition_id,
    weight: w.weight,
    updated_at: new Date().toISOString(),
  }));

  const { error } = await supabase
    .from("shift_ability_weights")
    .upsert(rows, { onConflict: "shift_id,ability_definition_id" });
  if (error) throw new Error(error.message);

  revalidatePath(`/shifts/${year}/${month}`);
}
