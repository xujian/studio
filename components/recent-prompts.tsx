'use client'

import { useGenerations } from '@/hooks/use-generations'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Clock } from 'lucide-react'

type RecentPromptsProps = {
  onSelectPrompt: (prompt: string) => void
}

export const RecentPrompts = ({ onSelectPrompt }: RecentPromptsProps) => {
  const { data: generations, isLoading } = useGenerations()

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Recent Prompts</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </CardContent>
      </Card>
    )
  }

  const recentPrompts = generations?.slice(0, 5) || []

  if (recentPrompts.length === 0) {
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <Clock className="h-4 w-4" />
          Recent Prompts
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {recentPrompts.map((generation) => (
          <Button
            key={generation.id}
            variant="ghost"
            className="w-full justify-start text-left h-auto py-2"
            onClick={() => onSelectPrompt(generation.prompt)}
          >
            <span className="line-clamp-2 text-sm">
              {generation.prompt}
            </span>
          </Button>
        ))}
      </CardContent>
    </Card>
  )
}
