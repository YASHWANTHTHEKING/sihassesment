import { Sidebar } from './Sidebar';

interface ShellProps {
  children: React.ReactNode;
}

export function Shell({ children }: ShellProps) {
  return (
    <div className="flex min-h-[100dvh]">
      <Sidebar />
      <main className="flex-1 ml-56 min-h-[100dvh] overflow-auto">
        {children}
      </main>
    </div>
  );
}
