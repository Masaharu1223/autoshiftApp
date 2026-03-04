interface DayScoreBadgeProps {
  score: number;
  required: number;
  maxCount: number | null;
  assigned: number;
}

export function DayScoreBadge({ score, required, maxCount, assigned }: DayScoreBadgeProps) {
  const isBelowMin = assigned < required;
  const isAboveMax = maxCount != null && assigned > maxCount;
  const isGood = !isBelowMin && !isAboveMax;

  const rangeLabel = maxCount != null ? `${required}~${maxCount}` : `${required}`;

  return (
    <div className="flex items-center gap-1">
      <span
        className={`text-xs px-1.5 py-0.5 rounded font-medium ${
          isAboveMax
            ? "bg-yellow-100 text-yellow-800"
            : isGood
            ? "bg-green-100 text-green-800"
            : "bg-red-100 text-red-800"
        }`}
      >
        {assigned}/{rangeLabel}人
      </span>
      <span className="text-xs text-gray-400">スコア:{score}</span>
    </div>
  );
}
