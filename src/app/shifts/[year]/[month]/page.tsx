import { getMonthShiftData } from "@/lib/api/shifts";
import { ShiftCalendar } from "@/components/shifts/ShiftCalendar";
import { ShiftControls } from "@/components/shifts/ShiftControls";
import { RequestGrid } from "@/components/shifts/RequestGrid";
import Link from "next/link";

interface PageProps {
  params: Promise<{ year: string; month: string }>;
}

export default async function ShiftPage({ params }: PageProps) {
  const { year: yearStr, month: monthStr } = await params;
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);

  if (
    isNaN(year) ||
    isNaN(month) ||
    month < 1 ||
    month > 12 ||
    year < 2000 ||
    year > 2100
  ) {
    return <div className="text-red-600">無効な年月です</div>;
  }

  const data = await getMonthShiftData(year, month);

  const prevMonth = month === 1 ? 12 : month - 1;
  const prevYear = month === 1 ? year - 1 : year;
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;

  const monthLabel = `${year}年${month}月`;

  return (
    <div>
      {/* Header */}
      <div className="mb-4 flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <Link
            href={`/shifts/${prevYear}/${prevMonth}`}
            className="px-3 py-1.5 rounded-md border border-gray-300 text-sm hover:bg-gray-100 transition-colors"
          >
            ← 前月
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">{monthLabel}</h1>
          <Link
            href={`/shifts/${nextYear}/${nextMonth}`}
            className="px-3 py-1.5 rounded-md border border-gray-300 text-sm hover:bg-gray-100 transition-colors"
          >
            翌月 →
          </Link>
        </div>

        {data.members.length === 0 && (
          <div className="text-sm text-yellow-700 bg-yellow-50 border border-yellow-200 rounded-md px-3 py-1.5">
            メンバーが登録されていません。
            <Link href="/members" className="underline ml-1">
              メンバー管理
            </Link>
            から追加してください。
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="mb-4 p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
        <ShiftControls data={data} year={year} month={month} />
      </div>

      {/* Legend */}
      <div className="mb-3 flex gap-4 text-xs text-gray-500">
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded-full bg-blue-200" />
          自動アサイン
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded-full bg-green-200" />
          手動アサイン
        </span>
      </div>

      {/* Calendar */}
      <ShiftCalendar data={data} year={year} month={month} />

      {/* Request Grid */}
      {data.members.some((m) => m.is_active) && (
        <div className="mt-6 p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">
            出勤・休み希望入力
          </h2>
          <RequestGrid
            shiftId={data.shift.id}
            year={year}
            month={month}
            members={data.members}
            daysInMonth={data.days.length}
            requests={data.requests}
          />
        </div>
      )}

      {/* Member scores summary */}
      {data.members.length > 0 && (
        <div className="mt-6 p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">
            メンバースコア一覧
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {data.members
              .filter((m) => m.is_active)
              .sort((a, b) => b.total_score - a.total_score)
              .map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm"
                >
                  <span className="text-gray-800 truncate">{member.name}</span>
                  <span className="text-gray-500 ml-2 shrink-0">
                    {member.total_score}
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
