"use client";

import { useState, useTransition, useMemo } from "react";
import type { MemberWithAbilities, ShiftMemberRequest } from "@/lib/types";
import { bulkUpdateRequests } from "@/lib/api/requests";
import { Button } from "@/components/ui/Button";

interface RequestGridProps {
  shiftId: string;
  year: number;
  month: number;
  members: MemberWithAbilities[];
  daysInMonth: number;
  requests: ShiftMemberRequest[];
}

type RequestValue = "want_work" | "want_off" | null;

function nextRequest(current: RequestValue): RequestValue {
  if (current === null) return "want_work";
  if (current === "want_work") return "want_off";
  return null;
}

function buildRequestMap(
  requests: ShiftMemberRequest[]
): Map<string, RequestValue> {
  const map = new Map<string, RequestValue>();
  for (const r of requests) {
    map.set(`${r.member_id}-${r.day}`, r.request);
  }
  return map;
}

export function RequestGrid({
  shiftId,
  year,
  month,
  members,
  daysInMonth,
  requests,
}: RequestGridProps) {
  const [requestMap, setRequestMap] = useState(() => buildRequestMap(requests));
  const [savedMap, setSavedMap] = useState(() => buildRequestMap(requests));
  const [isSaving, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  const activeMembers = members.filter((m) => m.is_active);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const hasChanges = useMemo(() => {
    if (requestMap.size !== savedMap.size) return true;
    for (const [key, value] of requestMap) {
      if (savedMap.get(key) !== value) return true;
    }
    for (const [key] of savedMap) {
      if (!requestMap.has(key)) return true;
    }
    return false;
  }, [requestMap, savedMap]);

  const handleCellClick = (memberId: string, day: number) => {
    const key = `${memberId}-${day}`;
    const current = requestMap.get(key) ?? null;
    const next = nextRequest(current);

    setRequestMap((prev) => {
      const updated = new Map(prev);
      if (next === null) {
        updated.delete(key);
      } else {
        updated.set(key, next);
      }
      return updated;
    });
    setMessage(null);
  };

  const handleSave = () => {
    const changes: Array<{
      member_id: string;
      day: number;
      request: RequestValue;
    }> = [];

    // Collect all cells for active members
    for (const member of activeMembers) {
      for (const day of days) {
        const key = `${member.id}-${day}`;
        const value = requestMap.get(key) ?? null;
        changes.push({ member_id: member.id, day, request: value });
      }
    }

    startTransition(async () => {
      try {
        await bulkUpdateRequests(shiftId, year, month, changes);
        setSavedMap(new Map(requestMap));
        setMessage("保存しました");
      } catch {
        setMessage("保存に失敗しました");
      }
    });
  };

  if (activeMembers.length === 0) {
    return (
      <p className="text-sm text-gray-500">アクティブなメンバーがいません。</p>
    );
  }

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="text-xs border-collapse min-w-max">
          <thead>
            <tr>
              <th className="sticky left-0 z-10 bg-white border border-gray-200 px-2 py-1 text-left font-medium text-gray-700 min-w-[80px]">
                メンバー
              </th>
              {days.map((day) => {
                const dayOfWeek = new Date(year, month - 1, day).getDay();
                return (
                  <th
                    key={day}
                    className={`border border-gray-200 px-1 py-1 text-center font-medium w-8 ${
                      dayOfWeek === 0
                        ? "text-red-500"
                        : dayOfWeek === 6
                        ? "text-blue-500"
                        : "text-gray-700"
                    }`}
                  >
                    {day}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {activeMembers.map((member) => (
              <tr key={member.id}>
                <td className="sticky left-0 z-10 bg-white border border-gray-200 px-2 py-1 font-medium text-gray-800 truncate max-w-[100px]">
                  {member.name}
                </td>
                {days.map((day) => {
                  const key = `${member.id}-${day}`;
                  const req = requestMap.get(key) ?? null;
                  return (
                    <td
                      key={day}
                      onClick={() => handleCellClick(member.id, day)}
                      className={`border border-gray-200 text-center w-8 h-8 cursor-pointer select-none transition-colors ${
                        req === "want_work"
                          ? "bg-green-100 hover:bg-green-200"
                          : req === "want_off"
                          ? "bg-red-100 hover:bg-red-200"
                          : "hover:bg-gray-50"
                      }`}
                    >
                      {req === "want_work" && (
                        <span className="text-green-600 font-bold">○</span>
                      )}
                      {req === "want_off" && (
                        <span className="text-red-600 font-bold">×</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-2 text-xs text-gray-400">
          クリックでトグル: 未入力 → ○出勤希望 → ×休み希望 → 未入力
        </p>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <Button
          onClick={handleSave}
          disabled={isSaving || !hasChanges}
          size="sm"
        >
          {isSaving ? "保存中..." : "一括保存"}
        </Button>
        {message && (
          <span
            className={`text-sm ${
              message.includes("失敗") ? "text-red-600" : "text-green-600"
            }`}
          >
            {message}
          </span>
        )}
        {hasChanges && !isSaving && (
          <span className="text-sm text-amber-600">未保存の変更があります</span>
        )}
      </div>
    </div>
  );
}
