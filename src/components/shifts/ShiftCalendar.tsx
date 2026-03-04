import type { MonthShiftData } from "@/lib/types";
import { DayCell } from "./DayCell";

interface ShiftCalendarProps {
  data: MonthShiftData;
  year: number;
  month: number;
}

export function ShiftCalendar({ data, year, month }: ShiftCalendarProps) {
  const { days, members, shift, requests } = data;

  // Build per-day want_off member id sets
  const wantOffByDay = new Map<number, string[]>();
  for (const r of requests) {
    if (r.request === "want_off") {
      if (!wantOffByDay.has(r.day)) wantOffByDay.set(r.day, []);
      wantOffByDay.get(r.day)!.push(r.member_id);
    }
  }

  // Calculate offset for first day of month (0=Sun, 1=Mon, ...)
  const firstDayOfWeek = new Date(year, month - 1, 1).getDay();
  const emptyCells = Array.from({ length: firstDayOfWeek });

  return (
    <div>
      {/* Day headers */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {["日", "月", "火", "水", "木", "金", "土"].map((d, i) => (
          <div
            key={d}
            className={`text-center text-xs font-medium py-1 ${
              i === 0
                ? "text-red-500"
                : i === 6
                ? "text-blue-500"
                : "text-gray-500"
            }`}
          >
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {emptyCells.map((_, i) => (
          <div key={`empty-${i}`} />
        ))}
        {days.map((dayData) => (
          <DayCell
            key={dayData.day}
            dayData={dayData}
            members={members}
            shiftId={shift.id}
            year={year}
            month={month}
            wantOffMemberIds={wantOffByDay.get(dayData.day) ?? []}
          />
        ))}
      </div>
    </div>
  );
}
