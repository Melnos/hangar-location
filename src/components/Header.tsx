'use client';

export function Header({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <header className="bg-[#f5f5dc] border-b border-gray-200 px-6 py-4 hidden md:block">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        {action && <div>{action}</div>}
      </div>
    </header>
  );
}
