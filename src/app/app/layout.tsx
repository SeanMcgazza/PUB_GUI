import { AppShell } from '@/components/layout/app-shell';
import { BookingNotifier } from '@/components/booking-notifier';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <AppShell>{children}</AppShell>
      <BookingNotifier />
    </>
  );
}
