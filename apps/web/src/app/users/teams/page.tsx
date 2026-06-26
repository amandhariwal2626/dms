import { AppShell } from '@/components/layouts/app-shell';
import { TeamsPage } from '@/features/users/components/teams-page';

export default function TeamsRoute(): React.JSX.Element {
  return (
    <AppShell>
      <TeamsPage />
    </AppShell>
  );
}
