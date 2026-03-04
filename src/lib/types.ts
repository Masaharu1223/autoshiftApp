// =========================================
// Core domain types for AutoShiftApp
// =========================================

export interface AbilityDefinition {
  id: string;
  key: string;
  label: string;
  sort_order: number;
  created_at: string;
}

export interface Member {
  id: string;
  name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface MemberAbility {
  id: string;
  member_id: string;
  ability_definition_id: string;
  score: number;
}

export interface MemberWithAbilities extends Member {
  abilities: Array<{
    ability_definition_id: string;
    key: string;
    label: string;
    score: number;
  }>;
  total_score: number;
  weighted_score: number;
}

export interface ShiftMemberRequest {
  id: string;
  shift_id: string;
  member_id: string;
  day: number;
  request: "want_work" | "want_off";
}

export interface ShiftAbilityWeight {
  id: string;
  shift_id: string;
  ability_definition_id: string;
  weight: number;
}

export interface Shift {
  id: string;
  year: number;
  month: number;
  status: "draft" | "published";
  created_at: string;
  updated_at: string;
}

export interface ShiftDayConfig {
  id: string;
  shift_id: string;
  day: number;
  required_count: number;
  max_count: number | null;
  is_closed: boolean;
}

export interface ShiftAssignment {
  id: string;
  shift_id: string;
  day: number;
  member_id: string;
  is_auto_assigned: boolean;
  created_at: string;
}

export interface DayShiftData {
  day: number;
  date: Date;
  config: ShiftDayConfig | null;
  assignments: Array<ShiftAssignment & { member: Member }>;
  total_score: number;
  required_count: number;
  max_count: number | null;
  is_closed: boolean;
}

export interface OptimizationResult {
  day: number;
  selected_member_ids: string[];
  total_score: number;
  method: "exhaustive" | "greedy";
}

export interface MonthShiftData {
  shift: Shift;
  days: DayShiftData[];
  members: MemberWithAbilities[];
  ability_definitions: AbilityDefinition[];
  requests: ShiftMemberRequest[];
  ability_weights: ShiftAbilityWeight[];
}
