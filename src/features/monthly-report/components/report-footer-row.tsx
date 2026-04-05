import { formatPrice } from '@/shared/utils/format';
import type { MonthlyReportRow } from '../types/report.type';

type ReportFooterRowProps = {
  rows: MonthlyReportRow[];
};

export function ReportFooterRow({ rows }: ReportFooterRowProps) {
  const totalPortions = rows.reduce((sum, r) => sum + r.totalPortions, 0);
  const totalAmount = rows.reduce((sum, r) => sum + r.totalAmount, 0);
  const totalPaid = rows.reduce((sum, r) => sum + r.paidAmount, 0);
  const totalUnpaid = rows.reduce((sum, r) => sum + r.unpaidAmount, 0);

  return (
    <tr className="border-t-2 font-semibold">
      <td className="px-6 py-3">Tổng</td>
      <td className="px-6 py-3 text-right">—</td>
      <td className="px-6 py-3 text-right">{totalPortions}</td>
      <td className="px-6 py-3 text-right">{formatPrice(totalAmount)}</td>
      <td className="px-6 py-3 text-right">{formatPrice(totalPaid)}</td>
      <td className="px-6 py-3 text-right">{formatPrice(totalUnpaid)}</td>
    </tr>
  );
}
