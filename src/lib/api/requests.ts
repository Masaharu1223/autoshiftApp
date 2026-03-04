"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function upsertMemberRequest(
  shiftId: string,
  year: number,
  month: number,
  memberId: string,
  day: number,
  request: "want_work" | "want_off" | null
): Promise<void> {
  const supabase = await createClient();

  if (request === null) {
    await supabase
      .from("shift_member_requests")
      .delete()
      .eq("shift_id", shiftId)
      .eq("member_id", memberId)
      .eq("day", day);
  } else {
    const { error } = await supabase.from("shift_member_requests").upsert(
      {
        shift_id: shiftId,
        member_id: memberId,
        day,
        request,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "shift_id,member_id,day" }
    );
    if (error) throw new Error(error.message);
  }

  revalidatePath(`/shifts/${year}/${month}`);
}

export async function bulkUpdateRequests(
  shiftId: string,
  year: number,
  month: number,
  requests: Array<{
    member_id: string;
    day: number;
    request: "want_work" | "want_off" | null;
  }>
): Promise<void> {
  const supabase = await createClient();

  // Delete all existing requests for this shift
  const { error: deleteError } = await supabase
    .from("shift_member_requests")
    .delete()
    .eq("shift_id", shiftId);

  if (deleteError) throw new Error(deleteError.message);

  // Insert only non-null requests
  const toInsert = requests
    .filter((r) => r.request !== null)
    .map((r) => ({
      shift_id: shiftId,
      member_id: r.member_id,
      day: r.day,
      request: r.request!,
      updated_at: new Date().toISOString(),
    }));

  if (toInsert.length > 0) {
    const { error: insertError } = await supabase
      .from("shift_member_requests")
      .insert(toInsert);

    if (insertError) throw new Error(insertError.message);
  }

  revalidatePath(`/shifts/${year}/${month}`);
}
