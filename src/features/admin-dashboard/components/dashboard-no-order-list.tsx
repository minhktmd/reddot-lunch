import type { EmployeeListItem } from '@/domains/employee';

type Props = {
  employees: EmployeeListItem[];
};

export function DashboardNoOrderList({ employees }: Props) {
  if (employees.length === 0) {
    return <p className="text-sm text-muted-foreground">Tất cả đã đặt món.</p>;
  }

  return (
    <ul className="space-y-1">
      {employees.map((emp) => (
        <li key={emp.id} className="text-sm text-foreground">
          {emp.name}
        </li>
      ))}
    </ul>
  );
}
