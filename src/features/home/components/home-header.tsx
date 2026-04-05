'use client';

type HomeHeaderProps = {
  employeeName: string;
  onChangeName: () => void;
};

export function HomeHeader({ employeeName, onChangeName }: HomeHeaderProps) {
  return (
    <header className="border-b bg-white px-4 py-3">
      <div className="mx-auto flex max-w-2xl items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">🍱</span>
          <span className="font-semibold text-gray-900">{employeeName}</span>
        </div>
        <button onClick={onChangeName} className="cursor-pointer text-sm text-blue-600 hover:underline">
          Đổi người đặt
        </button>
      </div>
    </header>
  );
}
