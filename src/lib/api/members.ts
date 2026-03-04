"use server";

import { createClient } from "@/lib/supabase/server";
import type { AbilityDefinition, Member, MemberWithAbilities } from "@/lib/types";
import { revalidatePath } from "next/cache";

export async function getAbilityDefinitions(): Promise<AbilityDefinition[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("ability_definitions")
    .select("*")
    .order("sort_order");
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getMembers(): Promise<MemberWithAbilities[]> {
  const supabase = await createClient();

  const { data: members, error: membersError } = await supabase
    .from("members")
    .select("*")
    .order("created_at");
  if (membersError) throw new Error(membersError.message);

  const { data: abilities, error: abilitiesError } = await supabase
    .from("member_abilities")
    .select("*, ability_definitions(key, label)");
  if (abilitiesError) throw new Error(abilitiesError.message);

  const abilityMap = new Map<string, typeof abilities>();
  for (const ability of abilities ?? []) {
    if (!abilityMap.has(ability.member_id)) {
      abilityMap.set(ability.member_id, []);
    }
    abilityMap.get(ability.member_id)!.push(ability);
  }

  return (members ?? []).map((member: Member) => {
    const memberAbilities = (abilityMap.get(member.id) ?? []).map((a) => ({
      ability_definition_id: a.ability_definition_id,
      key: (a.ability_definitions as { key: string; label: string }).key,
      label: (a.ability_definitions as { key: string; label: string }).label,
      score: a.score,
    }));
    const total_score = memberAbilities.reduce((sum, a) => sum + a.score, 0);
    return { ...member, abilities: memberAbilities, total_score, weighted_score: total_score };
  });
}

export async function createMember(formData: FormData): Promise<void> {
  const supabase = await createClient();
  const name = formData.get("name") as string;
  if (!name?.trim()) throw new Error("名前を入力してください");

  const { data: member, error: memberError } = await supabase
    .from("members")
    .insert({ name: name.trim() })
    .select()
    .single();
  if (memberError) throw new Error(memberError.message);

  // Insert default ability scores
  const { data: abilityDefs } = await supabase
    .from("ability_definitions")
    .select("id");
  if (abilityDefs && abilityDefs.length > 0) {
    const abilityRows = abilityDefs.map((def) => ({
      member_id: member.id,
      ability_definition_id: def.id,
      score: 0,
    }));
    const { error: abilitiesError } = await supabase
      .from("member_abilities")
      .insert(abilityRows);
    if (abilitiesError) throw new Error(abilitiesError.message);
  }

  revalidatePath("/members");
}

export async function updateMember(
  memberId: string,
  data: { name?: string; is_active?: boolean }
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("members")
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq("id", memberId);
  if (error) throw new Error(error.message);
  revalidatePath("/members");
}

export async function updateMemberAbilities(
  memberId: string,
  abilities: Record<string, number>
): Promise<void> {
  const supabase = await createClient();

  const upsertRows = Object.entries(abilities).map(
    ([ability_definition_id, score]) => ({
      member_id: memberId,
      ability_definition_id,
      score,
      updated_at: new Date().toISOString(),
    })
  );

  const { error } = await supabase
    .from("member_abilities")
    .upsert(upsertRows, { onConflict: "member_id,ability_definition_id" });
  if (error) throw new Error(error.message);
  revalidatePath("/members");
}

export async function deleteMember(memberId: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("members")
    .delete()
    .eq("id", memberId);
  if (error) throw new Error(error.message);
  revalidatePath("/members");
}
