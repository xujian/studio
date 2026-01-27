import { StoreGrid } from '@/components/store-grid'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'

export default function StorePage() {
  return (
    <div className="container mx-auto p-4 pt-8">
      <Card className="mb-6 elevation-2 animate-float-up">
        <CardHeader>
          <CardTitle className="text-3xl font-bold">Store</CardTitle>
          <p className="text-muted-foreground">
            View all your generated images
          </p>
        </CardHeader>
      </Card>

      <StoreGrid />
    </div>
  )
}
