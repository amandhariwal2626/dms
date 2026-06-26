import { AppShell } from '@/components/layouts/app-shell';
import { PermissionsPage } from '@/features/permissions/components/permissions-page';

export default function PermissionsRoute(): React.JSX.Element {
  return (
    <AppShell>
      <PermissionsPage />
    </AppShell>
  );
}
