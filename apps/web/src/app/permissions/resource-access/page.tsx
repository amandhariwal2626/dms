import { AppShell } from '@/components/layouts/app-shell';
import { ResourceAccessPage } from '@/features/permissions/components/resource-access-page';

export default function ResourceAccessRoute(): React.JSX.Element {
  return (
    <AppShell>
      <ResourceAccessPage />
    </AppShell>
  );
}
