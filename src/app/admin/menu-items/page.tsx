import { MenuItemAddForm, MenuItemTable } from '@/features/menu-item-management';

export default function MenuItemsPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-semibold text-foreground">Quản lý món ăn</h1>
      <div className="flex flex-col gap-6">
        <MenuItemAddForm />
        <MenuItemTable />
      </div>
    </main>
  );
}
