import { StoreGrid } from '@/components/store-grid'

export default function StorePage() {
  return (
    <section className="flex w-full flex-col px-16 pb-16 pt-2">
      <h1 className="mb-6 text-2xl font-semibold">Store</h1>
      <StoreGrid />
    </section>
  )
}
