"use client";

import { useTransition } from "react";
import { removeAssignment } from "@/lib/api/assignments";

interface MemberChipProps {
  shiftId: string;
  year: number;
  month: number;
  day: number;
  memberId: string;
  memberName: string;
  isAutoAssigned: boolean;
}

export function MemberChip({
  shiftId,
  year,
  month,
  day,
  memberId,
  memberName,
  isAutoAssigned,
}: MemberChipProps) {
  const [isPending, startTransition] = useTransition();

  const handleRemove = () => {
    startTransition(async () => {
      await removeAssignment(shiftId, year, month, day, memberId);
    });
  };

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
        isAutoAssigned
          ? "bg-blue-100 text-blue-800"
          : "bg-green-100 text-green-800"
      }`}
    >
      {memberName}
      <button
        onClick={handleRemove}
        disabled={isPending}
        className="ml-0.5 hover:opacity-70 leading-none"
        title="削除"
      >
        ×
      </button>
    </span>
  );
}
