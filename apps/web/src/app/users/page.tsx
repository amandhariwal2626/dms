import { AppShell } from '@/components/layouts/app-shell';
import { UsersPage } from '@/features/users/components/users-page';

export default function UsersRoute(): React.JSX.Element {
  return (
    <AppShell>
      <UsersPage />
    </AppShell>
  );
}
