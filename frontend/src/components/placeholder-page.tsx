import { AppShell } from "@/components/app-shell";
import { Card } from "@/components/ui/card";
import { Construction } from "lucide-react";

export function PlaceholderPage({ title, description }: { title: string; description: string }) {
  return (
    <AppShell>
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        </div>
        <Card className="p-12 flex flex-col items-center justify-center text-center">
          <div className="h-12 w-12 rounded-md bg-muted text-muted-foreground flex items-center justify-center mb-3">
            <Construction className="h-5 w-5" />
          </div>
          <div className="font-medium">Coming soon</div>
          <div className="text-sm text-muted-foreground mt-1 max-w-sm">
            This module is part of the upcoming release.
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
