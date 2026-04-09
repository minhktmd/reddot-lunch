import { MenuManagementPage } from '@/features/menu-management';

export default function MenuPage() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="text-foreground mb-6 text-2xl font-semibold">Quản lý thực đơn</h1>
      <MenuManagementPage />
    </main>
  );
}
