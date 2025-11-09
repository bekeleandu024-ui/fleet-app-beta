import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function ThemeProbe() {
  return (
    <main className="min-h-screen bg-background text-foreground p-6 space-y-6">
      <Card className="border border-border">
        <CardHeader><CardTitle>Theme Probe</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-muted-foreground">
            Background uses <code>bg-background</code>; text uses <code>text-foreground</code>.
          </div>
          <input
            className="w-full rounded-md bg-input border border-border px-3 py-2
                       focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring
                       ring-offset-2 ring-offset-background"
            placeholder="Ring/border should reflect your tokens"
          />
          <Button>shadcn Button</Button>
        </CardContent>
      </Card>
    </main>
  );
}
