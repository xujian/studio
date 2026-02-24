import { Skeleton } from '@/components/ui/skeleton'

export default function StoreLoading() {
  return (
    <section className="flex w-full flex-col px-16 pb-16 pt-2">
      <h1 className="mb-8 text-2xl font-semibold">Store</h1>
      <div className="flex flex-col gap-10">
        {[1, 2, 3].map(i => (
          <div key={i}>
            <Skeleton className="mb-3 h-6 w-24" />
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
              {Array.from({ length: 6 }).map((_, j) => (
                <Skeleton key={j} className="aspect-square w-full rounded-lg" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
