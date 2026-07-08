'use client'

import { ArrowUpDown } from 'lucide-react'
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui'

export type SortOption<T extends string = string> = {
  value: T
  label: string
}

type SortingProps<T extends string> = {
  options: SortOption<T>[]
  value: T
  onChange: (value: T) => void
}

export const Sorting = <T extends string>({
  options,
  value,
  onChange,
}: SortingProps<T>) => (
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button variant="outline" size="sm" className="gap-2">
        <ArrowUpDown className="size-4" />
        {options.find(o => o.value === value)?.label}
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end">
      <DropdownMenuRadioGroup
        value={value}
        onValueChange={next => onChange(next as T)}>
        {options.map(option => (
          <DropdownMenuRadioItem key={option.value} value={option.value}>
            {option.label}
          </DropdownMenuRadioItem>
        ))}
      </DropdownMenuRadioGroup>
    </DropdownMenuContent>
  </DropdownMenu>
)
