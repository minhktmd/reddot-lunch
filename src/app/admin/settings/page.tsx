'use client';

import { SettingsBankSection } from '@/features/app-settings';

export default function SettingsPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-8 p-6">
      <h1 className="text-2xl font-bold">Cài đặt</h1>
      <SettingsBankSection />
    </div>
  );
}
