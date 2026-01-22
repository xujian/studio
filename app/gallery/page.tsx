import { GalleryGrid } from '@/components/gallery-grid'

export default function GalleryPage() {
  return (
    <div className="container mx-auto p-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Gallery</h1>
        <p className="text-muted-foreground">
          View all your generated images
        </p>
      </div>

      <GalleryGrid />
    </div>
  )
}
