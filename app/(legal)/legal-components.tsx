export function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-2xl font-bold mb-5">{title}</h2>
      <div className="text-muted-foreground leading-relaxed space-y-3">
        {children}
      </div>
    </section>
  )
}

export function SubSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-5">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-foreground mb-1">{title}</h3>
      <p className="leading-relaxed">{children}</p>
    </div>
  )
}
