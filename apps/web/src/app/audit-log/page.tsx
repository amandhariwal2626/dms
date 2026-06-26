import { AppShell } from '@/components/layouts/app-shell';
import { AuditLogPage } from '@/features/audit-log/components/audit-log-page';

export default function AuditLogRoute(): React.JSX.Element {
  return (
    <AppShell>
      <AuditLogPage />
    </AppShell>
  );
}
