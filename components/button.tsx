import * as React from "react"

import {
  Button as ShadcnButton,
  type buttonVariants,
} from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import type { VariantProps } from "class-variance-authority"

type ButtonProps = React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
    tooltip?: React.ReactNode
  }

function Button({ tooltip, "aria-label": ariaLabel, ...props }: ButtonProps) {
  const label = ariaLabel || (typeof tooltip === 'string' ? tooltip : undefined)
  if (!tooltip) return <ShadcnButton aria-label={label} {...props} />

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <ShadcnButton aria-label={label} {...props} />
      </TooltipTrigger>
      <TooltipContent align="center" side="top" sideOffset={10}>{tooltip}</TooltipContent>
    </Tooltip>
  )
}

export { Button, type ButtonProps }
