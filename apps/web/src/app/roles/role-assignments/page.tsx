import { AppShell } from '@/components/layouts/app-shell';
import { RoleAssignmentsPage } from '@/features/roles/components/role-assignments-page';

export default function RoleAssignmentsRoute(): React.JSX.Element {
  return (
    <AppShell>
      <RoleAssignmentsPage />
    </AppShell>
  );
}
