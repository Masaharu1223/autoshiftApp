"use client";

import { useTransition } from "react";
import type { MonthShiftData } from "@/lib/types";
import { optimizeMonth } from "@/lib/optimization";
import { saveOptimizedAssignments, clearAllAssignments } from "@/lib/api/assignments";
import { Button } from "@/components/ui/Button";
import { WeightSliders } from "./WeightSliders";

interface ShiftControlsProps {
  data: MonthShiftData;
  year: number;
  month: number;
}

export function ShiftControls({ data, year, month }: ShiftControlsProps) {
  const [isPending, startTransition] = useTransition();

  const handleOptimize = () => {
    startTransition(async () => {
      const daysInMonth = data.days.length;
      const results = optimizeMonth(
        data.members,
        daysInMonth,
        (day) => {
          const dayData = data.days.find((d) => d.day === day);
          return dayData?.required_count ?? 2;
        },
        (day) => {
          const dayData = data.days.find((d) => d.day === day);
          return dayData?.is_closed ?? false;
        },
        // No locked members in full optimize
        () => [],
        (day) =>
          data.requests
            .filter((r) => r.day === day && r.request === "want_off")
            .map((r) => r.member_id),
        (day) => {
          const dayData = data.days.find((d) => d.day === day);
          return dayData?.max_count ?? null;
        }
      );
      await saveOptimizedAssignments(data.shift.id, year, month, results);
    });
  };

  const handleClear = () => {
    if (!confirm("全てのアサインをクリアしますか？")) return;
    startTransition(async () => {
      await clearAllAssignments(data.shift.id, year, month);
    });
  };

  const totalAssigned = data.days.reduce(
    (sum, d) => sum + d.assignments.length,
    0
  );
  const totalScore = data.days.reduce((sum, d) => sum + d.total_score, 0);

  return (
    <div className="flex flex-col gap-3">
      <WeightSliders
        shiftId={data.shift.id}
        year={year}
        month={month}
        abilityDefinitions={data.ability_definitions}
        initialWeights={data.ability_weights}
      />
      <div className="flex items-center gap-4 flex-wrap">
        <div className="text-sm text-gray-600">
          総アサイン数: <strong>{totalAssigned}</strong> | 月間合計スコア:{" "}
          <strong>{totalScore}</strong>
        </div>
        <div className="flex gap-2 ml-auto">
          <Button
            variant="secondary"
            onClick={handleClear}
            disabled={isPending || totalAssigned === 0}
          >
            クリア
          </Button>
          <Button onClick={handleOptimize} disabled={isPending}>
            {isPending ? "最適化中..." : "自動最適化"}
          </Button>
        </div>
      </div>
    </div>
  );
}
