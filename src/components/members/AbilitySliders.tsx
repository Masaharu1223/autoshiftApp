"use client";

import { AbilityDefinition, MemberWithAbilities } from "@/lib/types";
import { updateMemberAbilities } from "@/lib/api/members";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";

interface AbilitySlidersProps {
  member: MemberWithAbilities;
  abilityDefs: AbilityDefinition[];
  onClose?: () => void;
}

export function AbilitySliders({ member, abilityDefs, onClose }: AbilitySlidersProps) {
  const [isPending, startTransition] = useTransition();
  const [scores, setScores] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    for (const def of abilityDefs) {
      const existing = member.abilities.find(
        (a) => a.ability_definition_id === def.id
      );
      initial[def.id] = existing?.score ?? 0;
    }
    return initial;
  });

  const handleSave = () => {
    startTransition(async () => {
      await updateMemberAbilities(member.id, scores);
      onClose?.();
    });
  };

  const totalScore = Object.values(scores).reduce((sum, s) => sum + s, 0);

  return (
    <div className="flex flex-col gap-4">
      {abilityDefs.map((def) => (
        <div key={def.id} className="flex flex-col gap-1">
          <div className="flex justify-between text-sm">
            <label className="font-medium text-gray-700">{def.label}</label>
            <span className="text-gray-500 w-6 text-right">{scores[def.id]}</span>
          </div>
          <input
            type="range"
            min={0}
            max={10}
            value={scores[def.id] ?? 0}
            onChange={(e) =>
              setScores((prev) => ({ ...prev, [def.id]: Number(e.target.value) }))
            }
            className="w-full accent-blue-600"
          />
        </div>
      ))}
      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
        <span className="text-sm text-gray-600">
          合計スコア: <strong>{totalScore}</strong>
        </span>
        <div className="flex gap-2">
          {onClose && (
            <Button variant="secondary" size="sm" onClick={onClose}>
              キャンセル
            </Button>
          )}
          <Button size="sm" onClick={handleSave} disabled={isPending}>
            {isPending ? "保存中..." : "保存"}
          </Button>
        </div>
      </div>
    </div>
  );
}
