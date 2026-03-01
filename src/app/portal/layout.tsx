import { ThemeProvider } from '@/components/ThemeProvider';
import LayoutWrapper from './components/LayoutWrapper';

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider defaultContext="portal" defaultMode="dark">
      <LayoutWrapper>
        {children}
      </LayoutWrapper>
    </ThemeProvider>
  );
}
