import { ThemeProvider } from 'next-themes';
import { Toaster } from 'sonner';

import { QueryProvider } from './query-provider';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <QueryProvider>
        {children}
        <Toaster richColors position="top-right" />
      </QueryProvider>
    </ThemeProvider>
  );
}
