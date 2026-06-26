import { AppShell } from '@/components/layouts/app-shell';
import { InvitationsPage } from '@/features/users/components/invitations-page';

export default function InvitationsRoute(): React.JSX.Element {
  return (
    <AppShell>
      <InvitationsPage />
    </AppShell>
  );
}
