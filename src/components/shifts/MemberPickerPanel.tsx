"use client";

import { useState, useTransition } from "react";
import type { MemberWithAbilities } from "@/lib/types";
import { addManualAssignment } from "@/lib/api/assignments";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";

interface MemberPickerPanelProps {
  shiftId: string;
  year: number;
  month: number;
  day: number;
  members: MemberWithAbilities[];
  assignedMemberIds: string[];
  wantOffMemberIds?: string[];
}

export function MemberPickerPanel({
  shiftId,
  year,
  month,
  day,
  members,
  assignedMemberIds,
  wantOffMemberIds = [],
}: MemberPickerPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const availableMembers = members.filter(
    (m) =>
      m.is_active &&
      !assignedMemberIds.includes(m.id) &&
      !wantOffMemberIds.includes(m.id)
  );

  const handleAdd = (memberId: string) => {
    startTransition(async () => {
      await addManualAssignment(shiftId, year, month, day, memberId);
      setIsOpen(false);
    });
  };

  return (
    <>
      <Button variant="ghost" size="sm" onClick={() => setIsOpen(true)}>
        +
      </Button>
      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title={`${month}月${day}日 メンバー追加`}
      >
        {availableMembers.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">
            追加できるメンバーがいません
          </p>
        ) : (
          <div className="flex flex-col gap-2 max-h-80 overflow-y-auto">
            {availableMembers.map((member) => (
              <button
                key={member.id}
                onClick={() => handleAdd(member.id)}
                disabled={isPending}
                className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:bg-gray-50 text-left transition-colors"
              >
                <span className="font-medium text-gray-900">{member.name}</span>
                <span className="text-sm text-gray-500">
                  スコア: {member.total_score}
                </span>
              </button>
            ))}
          </div>
        )}
      </Modal>
    </>
  );
}

// これはこれはテストです