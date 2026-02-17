const metrics = [
  { value: "31", label: "Widgets" },
  { value: "17", label: "Color Themes" },
  { value: "5", label: "Chart Types" },
  { value: "3", label: "Sync Strategies" },
];

export function StatsBar() {
  return (
    <section className="border-y bg-muted/20">
      <div className="container mx-auto max-w-6xl px-4 py-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {metrics.map((m) => (
            <div key={m.label} className="text-center">
              <div className="text-3xl font-bold">{m.value}</div>
              <div className="text-sm text-muted-foreground">{m.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
