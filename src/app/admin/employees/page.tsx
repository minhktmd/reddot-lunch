import { EmployeeAddForm, EmployeeTable } from '@/features/employee-management';

export default function EmployeesPage() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-semibold text-gray-900">Quản lý nhân viên</h1>
      <div className="flex flex-col gap-6">
        <EmployeeAddForm />
        <EmployeeTable />
      </div>
    </main>
  );
}
