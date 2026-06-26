import { AppShell } from '@/components/layouts/app-shell';
import { RolesPage } from '@/features/roles/components/roles-page';

export default function RolesRoute(): React.JSX.Element {
  return (
    <AppShell>
      <RolesPage />
    </AppShell>
  );
}
