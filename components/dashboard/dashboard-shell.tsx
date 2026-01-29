interface DashboardShellProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
}

export function DashboardShell({ children, title, description }: DashboardShellProps) {
  return (
    <div className="flex-1 space-y-6 p-4 md:p-6 pt-6">
      {(title || description) && (
        <div className="space-y-1">
          {title && <h1 className="text-2xl font-bold tracking-tight">{title}</h1>}
          {description && <p className="text-muted-foreground">{description}</p>}
        </div>
      )}
      {children}
    </div>
  );
}
