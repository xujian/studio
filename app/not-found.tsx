import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div className="text-center">
        <h2 className="text-2xl font-bold">Page Not Found</h2>
        <p className="mt-2 text-muted-foreground">
          The page you&apos;re looking for doesn&apos;t exist
        </p>
        <Button asChild className="mt-4">
          <Link href="/studio">Go to Studio</Link>
        </Button>
      </div>
    </div>
  )
}
