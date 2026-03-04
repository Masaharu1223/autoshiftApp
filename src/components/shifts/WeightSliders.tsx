"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import type { AbilityDefinition, ShiftAbilityWeight } from "@/lib/types";
import { saveAbilityWeights } from "@/lib/api/weights";
import { Button } from "@/components/ui/Button";

interface WeightSlidersProps {
  shiftId: string;
  year: number;
  month: number;
  abilityDefinitions: AbilityDefinition[];
  initialWeights: ShiftAbilityWeight[];
}

export function WeightSliders({
  shiftId,
  year,
  month,
  abilityDefinitions,
  initialWeights,
}: WeightSlidersProps) {
  const weightMap = new Map(
    initialWeights.map((w) => [w.ability_definition_id, Number(w.weight)])
  );

  const [weights, setWeights] = useState<Record<string, number>>(() =>
    Object.fromEntries(
      abilityDefinitions.map((def) => [
        def.id,
        weightMap.get(def.id) ?? 1.0,
      ])
    )
  );

  const [isPending, startTransition] = useTransition();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const persist = (newWeights: Record<string, number>) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      startTransition(async () => {
        await saveAbilityWeights(
          shiftId,
          year,
          month,
          Object.entries(newWeights).map(([ability_definition_id, weight]) => ({
            ability_definition_id,
            weight,
          }))
        );
      });
    }, 800);
  };

  const handleChange = (id: string, value: number) => {
    const next = { ...weights, [id]: value };
    setWeights(next);
    persist(next);
  };

  const handleReset = () => {
    const next = Object.fromEntries(abilityDefinitions.map((d) => [d.id, 1.0]));
    setWeights(next);
    persist(next);
  };

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  if (abilityDefinitions.length === 0) return null;

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-700">能力重み付け</span>
        <div className="flex items-center gap-2">
          {isPending && (
            <span className="text-xs text-gray-400">保存中...</span>
          )}
          <Button variant="secondary" size="sm" onClick={handleReset}>
            リセット (全て×1)
          </Button>
        </div>
      </div>
      <div className="flex flex-wrap gap-4">
        {abilityDefinitions.map((def) => (
          <div key={def.id} className="flex flex-col gap-1 min-w-[140px]">
            <div className="flex items-center justify-between">
              <label className="text-xs text-gray-600">{def.label}</label>
              <span className="text-xs font-mono text-gray-800 w-8 text-right">
                ×{weights[def.id]?.toFixed(1) ?? "1.0"}
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={3}
              step={0.5}
              value={weights[def.id] ?? 1.0}
              onChange={(e) => handleChange(def.id, parseFloat(e.target.value))}
              className="w-full accent-blue-500"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
