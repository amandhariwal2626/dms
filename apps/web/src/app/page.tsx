import { Activity, Boxes, Layers3 } from 'lucide-react';
import { AppShell } from '@/components/layouts/app-shell';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/shared/page-header';

const foundationItems = [
  {
    title: 'Monorepo',
    description: 'Turborepo and pnpm workspace orchestration.',
    icon: Boxes,
  },
  {
    title: 'Frontend',
    description: 'Next.js App Router with web-local Shadcn components.',
    icon: Layers3,
  },
  {
    title: 'Backend',
    description: 'NestJS REST foundation with health checks.',
    icon: Activity,
  },
] as const;

export default function HomePage(): React.JSX.Element {
  return (
    <AppShell>
      <PageHeader
        title="Foundation Dashboard"
        description="Infrastructure shell for future application modules."
        actions={<Button variant="secondary">Ready</Button>}
      />
      <div className="grid gap-4 md:grid-cols-3">
        {foundationItems.map((item) => (
          <Card key={item.title}>
            <CardHeader>
              <item.icon className="h-5 w-5 text-neutral-600" aria-hidden="true" />
              <CardTitle>{item.title}</CardTitle>
              <CardDescription>Foundation layer</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-neutral-600">{item.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </AppShell>
  );
}
