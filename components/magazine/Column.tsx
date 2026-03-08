export type ColumnProps = {
  children: React.ReactNode
}

export function Column ({ children }: ColumnProps) {
  return (
    <div className="magazine-column max-w-160 mx-auto">
      {children}
    </div>
  )
}
