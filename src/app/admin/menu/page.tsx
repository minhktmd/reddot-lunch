import { MenuManagementPage } from '@/features/menu-management'

export default function MenuPage() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-semibold text-gray-900">Quản lý thực đơn</h1>
      <MenuManagementPage />
    </main>
  )
}
