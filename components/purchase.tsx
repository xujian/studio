'use client'

import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { DialogTitle } from '@radix-ui/react-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import type { AssetWithPurchaseInfo } from '@/lib/types'
import { assetUrl, cn } from '@/lib/utils'
import { useProfile } from '@/hooks/use-profile'
import { usePurchase } from '@/hooks/use-purchase'
import { Credits } from '@/components/credits'
import { Price } from '@/components/price'
import { Check, Loader2, X } from 'lucide-react'

interface PurchaseModalProps {
  asset: AssetWithPurchaseInfo
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function PurchaseModal({
  asset,
  open,
  onOpenChange
}: PurchaseModalProps) {
  const router = useRouter()
  const purchase = usePurchase()
  const { data: profile } = useProfile()

  const isOwned = asset.is_purchased
  const hasImage = !!asset.path
  const canAfford = profile == null || profile.credits >= (asset.price ?? 0)

  const handleBuy = () => {
    if (!asset.id) return
    purchase.mutate(asset.id, {
      onSuccess: () => {
        onOpenChange(false)
        router.refresh()
      }
    })
  }

  const handleUse = () => {
    onOpenChange(false)
    router.push(`/studio?use=${asset.id}&type=${asset.type}`)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="gap-0 overflow-hidden rounded-2xl p-0 sm:max-w-sm"
        showCloseButton={false}>
        <DialogTitle className="sr-only">Purchase Asset</DialogTitle>
        {/* Hero — full bleed */}
        <div className="relative aspect-square rounded-2xl w-full overflow-hidden bg-black">
          {hasImage ? (
            <Image
              src={assetUrl(asset.path!)}
              alt={asset.name || 'Asset'}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 480px"
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-neutral-950 p-10">
              <p className="text-center text-sm leading-relaxed text-neutral-300">
                {asset.content}
              </p>
            </div>
          )}

          {/* Scrim */}
          <div className="absolute inset-x-0 bottom-0 h-24 bg-linear-to-t from-black/70 to-transparent" />

          {/* Close button */}
          <button
            onClick={() => onOpenChange(false)}
            className="absolute top-3 right-3 flex h-7 w-7 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition-colors hover:bg-black/60">
            <X className="size-3.5" />
          </button>

          {/* Bottom overlays: type badge + price/owned */}
          <div className="absolute right-3 bottom-3 left-3 flex items-end justify-between">
            <Badge className="border-white/20 bg-white/10 text-[10px] tracking-widest text-white uppercase backdrop-blur-sm">
              {asset.type}
            </Badge>
            {isOwned ? (
              <Badge className="gap-1 bg-primary/90 text-xs">
                <Check className="size-3" />
                Owned
              </Badge>
            ) : null}
          </div>
        </div>

        {/* Info panel */}
        <div className="flex flex-col gap-4 p-4">
          <div className="flex flex-col gap-1">
            <h2 className="text-base leading-tight font-semibold">
              {asset.title || asset.name}
            </h2>
            {asset.description && (
              <p className="text-sm leading-tight text-muted-foreground">
                {asset.description}
              </p>
            )}
          </div>
        </div>
        <div className="p-1 flex flex-col gap-2">
          {/* Credit balance — only for unowned purchasable assets */}
          {asset.price != null && (
            <Price value={asset.price} variant="button" />
          )}
          {/* Action */}
          {isOwned ? (
            <Button className="button w-full rounded-full" onClick={handleUse}>
              Use
            </Button>
          ) : (
            <Button
              className={cn('w-full rounded-xl cursor-pointer',
                purchase.isPending && 'animate-pulse',
                canAfford ? 'bg-green-500 hover:bg-green-700' : 'bg-muted text-muted-foreground'
              )}
              onClick={handleBuy}
              disabled={purchase.isPending || !canAfford}>
              {purchase.isPending
                ? (<Loader2 className="size-4 animate-spin" />)
                : canAfford
                  ? 'BUY'
                  : 'Credits Unsufficient'
              }
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
