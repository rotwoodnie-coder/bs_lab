import { Badge } from "@bs-lab/ui";

type ShellHeaderProps = {
  message: string;
  error: string;
};

export function ShellHeader({ message, error }: ShellHeaderProps) {
  return (
    <div className="mb-6 rounded-2xl border bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Magnifier New Core</h1>
          <p className="mt-1 text-sm text-muted-foreground">MVP chain console for contract-aligned backend flow.</p>
        </div>
        <Badge variant="secondary">Demo Shell</Badge>
      </div>
      {message ? <p className="mt-3 text-sm text-green-600">{message}</p> : null}
      {error ? <p className="mt-3 text-sm text-destructive">Error: {error}</p> : null}
    </div>
  );
}

