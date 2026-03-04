import type { DayShiftData, MemberWithAbilities } from "@/lib/types";
import { MemberChip } from "./MemberChip";
import { MemberPickerPanel } from "./MemberPickerPanel";

const DAY_LABELS = ["日", "月", "火", "水", "木", "金", "土"];

interface DayCellProps {
  dayData: DayShiftData;
  members: MemberWithAbilities[];
  shiftId: string;
  year: number;
  month: number;
  wantOffMemberIds?: string[];
}

export function DayCell({ dayData, members, shiftId, year, month, wantOffMemberIds = [] }: DayCellProps) {
  const { day, date, assignments, is_closed } = dayData;
  const dayOfWeek = date.getDay();
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

  if (is_closed) {
    return (
      <div className="min-h-[100px] p-2 rounded-lg bg-gray-50 border border-gray-100">
        <div className="flex items-center gap-1 mb-1">
          <span
            className={`text-sm font-semibold ${
              dayOfWeek === 0
                ? "text-red-500"
                : dayOfWeek === 6
                ? "text-blue-500"
                : "text-gray-400"
            }`}
          >
            {day}
          </span>
          <span className="text-xs text-gray-400">({DAY_LABELS[dayOfWeek]})</span>
        </div>
        <span className="text-xs text-gray-400">休業日</span>
      </div>
    );
  }

  return (
    <div
      className={`min-h-[100px] p-2 rounded-lg border ${
        isWeekend ? "bg-blue-50/30 border-blue-100" : "bg-white border-gray-200"
      } shadow-sm`}
    >
      <div className="flex items-start justify-between mb-1">
        <div className="flex items-center gap-1">
          <span
            className={`text-sm font-semibold ${
              dayOfWeek === 0
                ? "text-red-500"
                : dayOfWeek === 6
                ? "text-blue-500"
                : "text-gray-700"
            }`}
          >
            {day}
          </span>
          <span className="text-xs text-gray-400">({DAY_LABELS[dayOfWeek]})</span>
        </div>
        <MemberPickerPanel
          shiftId={shiftId}
          year={year}
          month={month}
          day={day}
          members={members}
          assignedMemberIds={assignments.map((a) => a.member_id)}
          wantOffMemberIds={wantOffMemberIds}
        />
      </div>

      <div className="flex flex-wrap gap-1 min-h-[24px]">
        {assignments.map((assignment) => (
          <MemberChip
            key={assignment.id}
            shiftId={shiftId}
            year={year}
            month={month}
            day={day}
            memberId={assignment.member_id}
            memberName={assignment.member.name}
            isAutoAssigned={assignment.is_auto_assigned}
          />
        ))}
      </div>
    </div>
  );
}
