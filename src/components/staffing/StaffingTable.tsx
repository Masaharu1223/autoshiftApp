"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { bulkUpdateDayConfigs } from "@/lib/api/shifts";
import type { ShiftDayConfig } from "@/lib/types";
import { NumberStepper } from "@/components/ui/NumberStepper";
import { Button } from "@/components/ui/Button";

const DAY_LABELS = ["日", "月", "火", "水", "木", "金", "土"];

interface DayRow {
  day: number;
  dayOfWeek: number;
  requiredCount: string;
  maxCount: string;
  isClosed: boolean;
}

interface StaffingTableProps {
  shiftId: string;
  year: number;
  month: number;
  daysInMonth: number;
  configs: ShiftDayConfig[];
}

function buildInitialRows(
  year: number,
  month: number,
  daysInMonth: number,
  configs: ShiftDayConfig[]
): DayRow[] {
  const configMap = new Map(configs.map((c) => [c.day, c]));

  return Array.from({ length: daysInMonth }, (_, i) => {
    const day = i + 1;
    const date = new Date(year, month - 1, day);
    const config = configMap.get(day);
    return {
      day,
      dayOfWeek: date.getDay(),
      requiredCount: String(config?.required_count ?? 2),
      maxCount: config?.max_count != null ? String(config.max_count) : "",
      isClosed: config?.is_closed ?? false,
    };
  });
}

export function StaffingTable({
  shiftId,
  year,
  month,
  daysInMonth,
  configs,
}: StaffingTableProps) {
  const [rows, setRows] = useState<DayRow[]>(() =>
    buildInitialRows(year, month, daysInMonth, configs)
  );
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const router = useRouter();

  const updateRow = (day: number, patch: Partial<DayRow>) => {
    setSaved(false);
    setRows((prev) =>
      prev.map((r) => (r.day === day ? { ...r, ...patch } : r))
    );
  };

  const handleSave = () => {
    setError(null);
    setSaved(false);

    // Validate
    for (const row of rows) {
      if (row.isClosed) continue;
      const min = Number(row.requiredCount);
      const max = row.maxCount === "" ? null : Number(row.maxCount);
      if (isNaN(min) || min < 0) {
        setError(`${row.day}日: 最小人数は0以上の数値を入力してください`);
        return;
      }
      if (max != null && max < min) {
        setError(`${row.day}日: 最大人数は最小人数以上で入力してください`);
        return;
      }
    }

    startTransition(async () => {
      const payload = rows.map((r) => ({
        day: r.day,
        required_count: Number(r.requiredCount),
        max_count: r.maxCount === "" ? null : Number(r.maxCount),
        is_closed: r.isClosed,
      }));
      await bulkUpdateDayConfigs(shiftId, year, month, payload);
      router.refresh();
      setSaved(true);
    });
  };

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b border-gray-200 text-gray-600">
              <th className="py-2 px-3 text-left font-medium w-16">日付</th>
              <th className="py-2 px-3 text-left font-medium w-12">曜日</th>
              <th className="py-2 px-3 text-center font-medium w-20">休業</th>
              <th className="py-2 px-3 text-left font-medium">最小人数</th>
              <th className="py-2 px-3 text-left font-medium">最大人数</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const isWeekend = row.dayOfWeek === 0 || row.dayOfWeek === 6;
              return (
                <tr
                  key={row.day}
                  className={`border-b border-gray-100 ${
                    row.isClosed
                      ? "bg-gray-50 text-gray-400"
                      : isWeekend
                      ? "bg-blue-50/30"
                      : ""
                  }`}
                >
                  <td className="py-2 px-3 font-medium">{row.day}日</td>
                  <td
                    className={`py-2 px-3 ${
                      row.dayOfWeek === 0
                        ? "text-red-500"
                        : row.dayOfWeek === 6
                        ? "text-blue-500"
                        : ""
                    }`}
                  >
                    {DAY_LABELS[row.dayOfWeek]}
                  </td>
                  <td className="py-2 px-3 text-center">
                    <input
                      type="checkbox"
                      checked={row.isClosed}
                      onChange={(e) =>
                        updateRow(row.day, { isClosed: e.target.checked })
                      }
                      className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </td>
                  <td className="py-2 px-3">
                    {!row.isClosed && (
                      <NumberStepper
                        value={row.requiredCount}
                        onChange={(v) => updateRow(row.day, { requiredCount: v })}
                        min={0}
                      />
                    )}
                  </td>
                  <td className="py-2 px-3">
                    {!row.isClosed && (
                      <NumberStepper
                        value={row.maxCount}
                        onChange={(v) => updateRow(row.day, { maxCount: v })}
                        min={0}
                        placeholder="未設定"
                      />
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {error && (
        <p className="mt-3 text-sm text-red-600">{error}</p>
      )}

      <div className="mt-4 flex items-center gap-3">
        <Button onClick={handleSave} disabled={isPending}>
          {isPending ? "保存中..." : "一括保存"}
        </Button>
        {saved && !isPending && (
          <span className="text-sm text-green-600">保存しました</span>
        )}
      </div>
    </div>
  );
}
