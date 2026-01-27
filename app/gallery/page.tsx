import { GalleryGrid } from '@/components/gallery-grid'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'

export default function GalleryPage() {
  return (
    <div className="container mx-auto p-4 pt-8">
      <Card className="mb-6 elevation-2 animate-float-up">
        <CardHeader>
          <CardTitle className="text-3xl font-bold">Gallery</CardTitle>
          <p className="text-muted-foreground">
            View all your generated images
          </p>
        </CardHeader>
      </Card>

      <GalleryGrid />
    </div>
  )
}
