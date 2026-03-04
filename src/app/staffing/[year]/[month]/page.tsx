import { getDayConfigs } from "@/lib/api/shifts";
import { StaffingTable } from "@/components/staffing/StaffingTable";
import Link from "next/link";

interface PageProps {
  params: Promise<{ year: string; month: string }>;
}

export default async function StaffingPage({ params }: PageProps) {
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

  const { shiftId, configs, daysInMonth } = await getDayConfigs(year, month);

  const prevMonth = month === 1 ? 12 : month - 1;
  const prevYear = month === 1 ? year - 1 : year;
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;

  const monthLabel = `${year}年${month}月`;

  return (
    <div>
      <div className="mb-4 flex items-center gap-3">
        <Link
          href={`/staffing/${prevYear}/${prevMonth}`}
          className="px-3 py-1.5 rounded-md border border-gray-300 text-sm hover:bg-gray-100 transition-colors"
        >
          ← 前月
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">{monthLabel}</h1>
        <Link
          href={`/staffing/${nextYear}/${nextMonth}`}
          className="px-3 py-1.5 rounded-md border border-gray-300 text-sm hover:bg-gray-100 transition-colors"
        >
          翌月 →
        </Link>
      </div>

      <div className="p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">
          出勤人数設定
        </h2>
        <StaffingTable
          shiftId={shiftId}
          year={year}
          month={month}
          daysInMonth={daysInMonth}
          configs={configs}
        />
      </div>
    </div>
  );
}
