"use client";

import { useState, useTransition } from "react";
import type { AbilityDefinition, MemberWithAbilities } from "@/lib/types";
import { deleteMember, updateMember } from "@/lib/api/members";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { AbilitySliders } from "./AbilitySliders";

interface MemberListProps {
  members: MemberWithAbilities[];
  abilityDefs: AbilityDefinition[];
}

export function MemberList({ members, abilityDefs }: MemberListProps) {
  const [editingMember, setEditingMember] = useState<MemberWithAbilities | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleToggleActive = (member: MemberWithAbilities) => {
    startTransition(async () => {
      await updateMember(member.id, { is_active: !member.is_active });
    });
  };

  const handleDelete = (member: MemberWithAbilities) => {
    if (!confirm(`${member.name}を削除しますか？`)) return;
    startTransition(async () => {
      await deleteMember(member.id);
    });
  };

  if (members.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        メンバーがいません。追加してください。
      </div>
    );
  }

  return (
    <>
      <div className="grid gap-3">
        {members.map((member) => (
          <div
            key={member.id}
            className="flex items-center gap-4 p-4 bg-white rounded-lg border border-gray-200 shadow-sm"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium text-gray-900">{member.name}</span>
                {!member.is_active && (
                  <Badge variant="gray">非アクティブ</Badge>
                )}
                <Badge variant="blue">スコア {member.total_score}</Badge>
              </div>
              <div className="flex gap-3 flex-wrap">
                {member.abilities.map((ability) => (
                  <span key={ability.ability_definition_id} className="text-xs text-gray-500">
                    {ability.label}: <strong>{ability.score}</strong>
                  </span>
                ))}
                {member.abilities.length === 0 && (
                  <span className="text-xs text-gray-400">能力未設定</span>
                )}
              </div>
            </div>
            <div className="flex gap-2 shrink-0">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setEditingMember(member)}
              >
                能力設定
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleToggleActive(member)}
                disabled={isPending}
              >
                {member.is_active ? "無効化" : "有効化"}
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={() => handleDelete(member)}
                disabled={isPending}
              >
                削除
              </Button>
            </div>
          </div>
        ))}
      </div>

      <Modal
        isOpen={editingMember !== null}
        onClose={() => setEditingMember(null)}
        title={`${editingMember?.name} の能力設定`}
      >
        {editingMember && (
          <AbilitySliders
            member={editingMember}
            abilityDefs={abilityDefs}
            onClose={() => setEditingMember(null)}
          />
        )}
      </Modal>
    </>
  );
}
